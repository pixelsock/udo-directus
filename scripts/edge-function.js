import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Helper function for error responses
const errorResponse = (message, status = 400)=>{
  return new Response(JSON.stringify({
    error: message
  }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    },
    status
  });
};
// Helper function for success responses
const successResponse = (data, message = 'Operation successful')=>{
  return new Response(JSON.stringify({
    success: true,
    message,
    data
  }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
};
Deno.serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Configuration
    const WEBFLOW_TOKEN = Deno.env.get('WEBFLOW_TOKEN');
    const WEBFLOW_SITE_ID = '675c6fd4b5dad66e8d532a38'; // Hard-coded
    const WEBFLOW_COLLECTION_ID = '6480ced8acfa1bb8f9d4b979'; // Hard-coded
    // Verify Webflow token
    if (!WEBFLOW_TOKEN) {
      return errorResponse('Missing Webflow API token', 500);
    }
    // Parse the incoming webhook request
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return errorResponse('Invalid JSON in request body');
    }
    // Handle both direct calls and Supabase database webhook format
    let eventType;
    let record;
    if (body.eventType && body.record) {
      // Format for direct calls to the function
      eventType = body.eventType;
      record = body.record;
    } else if (body.type && body.table && body.record) {
      // Format for Supabase database webhooks
      eventType = body.type; // Supabase uses 'type' instead of 'eventType'
      record = body.record;
    } else {
      return errorResponse('Invalid webhook payload format');
    }
    // Validate request parameters
    if (!eventType) {
      return errorResponse('Missing eventType parameter');
    }
    if (!record) {
      return errorResponse('Missing record data');
    }
    if (!record.id) {
      return errorResponse('Missing record ID');
    }
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      return errorResponse('Missing Supabase credentials', 500);
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Log operation start - USING CORRECT SCHEMA REFERENCE
    await supabase.from('webflow_sync.sync_log').insert([
      {
        article_id: record.id,
        webflow_id: record.webflow_id || null,
        status: `${eventType}_started`,
        details: {
          article_name: record.name || 'Unnamed article',
          operation: eventType,
          webhook_payload: body // Log the full webhook payload for debugging
        }
      }
    ]);
    let result;
    // Handle different event types
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      // Create slug from name with proper formatting
      const slug = record.name ? record.name.toLowerCase().replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove consecutive hyphens
      .trim() : `article-${record.id}`;
      // Check required fields
      if (!record.name) {
        return errorResponse('Article name is required');
      }
      // Prepare API calls to Webflow
      const webflowData = {
        fieldData: {
          name: record.name,
          content: record.content || '',
          'directus-id': record.id,
          slug: slug
        }
      };
      if (record.webflow_id) {
        // Update existing item
        const updateResponse = await fetch(`https://api.webflow.com/beta/collections/${WEBFLOW_COLLECTION_ID}/items/${record.webflow_id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
            'accept-version': '2.0.0',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webflowData)
        });
        // Check for errors in the response
        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(`Webflow API Error: ${JSON.stringify(errorData)}`);
        }
        result = await updateResponse.json();
        // Publish item
        const publishResponse = await fetch(`https://api.webflow.com/beta/collections/${WEBFLOW_COLLECTION_ID}/items/${record.webflow_id}/live`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
            'accept-version': '2.0.0'
          }
        });
        if (!publishResponse.ok) {
          const publishError = await publishResponse.json();
          throw new Error(`Error publishing to Webflow: ${JSON.stringify(publishError)}`);
        }
      } else {
        // Create new item
        const createResponse = await fetch(`https://api.webflow.com/beta/collections/${WEBFLOW_COLLECTION_ID}/items`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
            'accept-version': '2.0.0',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webflowData)
        });
        // Check for errors in the response
        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(`Webflow API Error: ${JSON.stringify(errorData)}`);
        }
        result = await createResponse.json();
        // Update article with Webflow ID
        if (result.id) {
          await supabase.from('articles').update({
            webflow_id: result.id
          }).eq('id', record.id);
          // Publish item
          const publishResponse = await fetch(`https://api.webflow.com/beta/collections/${WEBFLOW_COLLECTION_ID}/items/${result.id}/live`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
              'accept-version': '2.0.0'
            }
          });
          if (!publishResponse.ok) {
            const publishError = await publishResponse.json();
            throw new Error(`Error publishing to Webflow: ${JSON.stringify(publishError)}`);
          }
        }
      }
      // Initiate publishing the site to apply changes
      await fetch(`https://api.webflow.com/beta/sites/${WEBFLOW_SITE_ID}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
          'accept-version': '2.0.0',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domains: [
            'all'
          ]
        })
      });
    } else if (eventType === 'DELETE') {
      // Handle deletion of the article
      if (record.webflow_id) {
        const deleteResponse = await fetch(`https://api.webflow.com/beta/collections/${WEBFLOW_COLLECTION_ID}/items/${record.webflow_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
            'accept-version': '2.0.0'
          }
        });
        if (!deleteResponse.ok) {
          const deleteError = await deleteResponse.json();
          throw new Error(`Error deleting from Webflow: ${JSON.stringify(deleteError)}`);
        }
        result = {
          deleted: true,
          webflow_id: record.webflow_id
        };
        // Initiate publishing the site to apply changes
        await fetch(`https://api.webflow.com/beta/sites/${WEBFLOW_SITE_ID}/publish`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
            'accept-version': '2.0.0',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            domains: [
              'all'
            ]
          })
        });
      } else {
        // No Webflow ID to delete
        result = {
          message: 'No Webflow ID provided for deletion'
        };
      }
    } else {
      return errorResponse(`Unsupported event type: ${eventType}`);
    }
    // Log success - USING CORRECT SCHEMA REFERENCE
    await supabase.from('webflow_sync.sync_log').insert([
      {
        article_id: record.id,
        webflow_id: record.webflow_id || (result && result.id ? result.id : null),
        status: `${eventType}_completed`,
        details: {
          result,
          operation: eventType
        }
      }
    ]);
    return successResponse(result, `Article successfully ${eventType.toLowerCase()}d in Webflow`);
  } catch (error) {
    console.error('Error in sync-article-to-webflow:', error);
    // Try to log error to Supabase if possible
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        // Use RPC function to safely log errors
        await supabase.rpc('log_webflow_sync_error', {
          error_message: error.message || String(error),
          error_stack: error.stack
        });
      }
    } catch (logError) {
      console.error('Error logging to Supabase:', logError);
    }
    return errorResponse(error.message || String(error), 500);
  }
});
