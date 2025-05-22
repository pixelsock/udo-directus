// A simple script to test if the llama-pdf-extract extension is working
// Usage: node test-pdf-extract.js

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// Configuration
const DIRECTUS_URL = 'http://localhost:8055';
const PDF_FILE_PATH = path.resolve(__dirname, '../uploads/39f1912b-4b50-48dc-bbe6-1d1c19434422.pdf');

async function testEndpoint() {
  console.log('Testing llama-pdf-extract endpoint...');
  
  try {
    // Test 1: Check if the endpoint is available
    console.log('Test 1: Checking if endpoint is available...');
    await axios.get(`${DIRECTUS_URL}/llama-pdf-extract/`);
    console.log('✅ Endpoint is available');
  } catch (error) {
    console.error('❌ Endpoint check failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
  
  try {
    // Test 2: Upload a PDF file directly
    console.log('\nTest 2: Uploading PDF directly...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(PDF_FILE_PATH));
    
    const uploadResponse = await axios.post(
      `${DIRECTUS_URL}/llama-pdf-extract/`, 
      formData,
      {
        headers: formData.getHeaders()
      }
    );
    
    console.log('✅ Upload successful');
    console.log('Response:', JSON.stringify(uploadResponse.data, null, 2).slice(0, 200) + '...');
  } catch (error) {
    console.error('❌ Upload test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
  
  try {
    // Test 3: Process PDF by ID
    console.log('\nTest 3: Processing PDF by ID...');
    
    const fileId = '39f1912b-4b50-48dc-bbe6-1d1c19434422';
    const response = await axios.get(`${DIRECTUS_URL}/llama-pdf-extract/${fileId}`);
    
    console.log('✅ Processing successful');
    console.log('Response:', JSON.stringify(response.data, null, 2).slice(0, 200) + '...');
  } catch (error) {
    console.error('❌ Processing test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testEndpoint().catch(console.error);