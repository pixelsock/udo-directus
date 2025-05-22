import { defineEndpoint } from '@directus/extensions-sdk';
import { Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { promises as fs } from 'fs';
import path from 'path';
import { DirectusServices } from './types/directus';

const upload = multer({ storage: multer.memoryStorage() });

export default defineEndpoint((router, { services, env, database }) => {
  // Log when the extension is loaded
  console.log('PDF Extract endpoint registered');
  
  // Handle direct file uploads
  router.post('/', upload.single('file'), async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No PDF uploaded' });
    }

    try {
      // Parse PDF content using pdf-parse library
      const pdfData = await pdfParse(req.file.buffer);
      
      // Convert extracted text to basic HTML
      const htmlContent = convertTextToHtml(pdfData.text);

      return res.json({ 
        status: 'ok', 
        data: { 
          html: htmlContent,
          metadata: {
            info: pdfData.info,
            numberOfPages: pdfData.numpages,
            version: pdfData.pdfInfo?.PDFFormatVersion,
            isEncrypted: pdfData.pdfInfo?.IsEncrypted === 'true',
          }
        } 
      });
    } catch (error: any) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  });
  
  // Handle file ID requests
  router.get('/:fileId', async (req: Request, res: Response) => {
    try {
      const { FilesService } = services as DirectusServices;
      const fileId = req.params.fileId;
      
      // Validate fileId
      if (!fileId) {
        return res.status(400).json({
          status: 'error',
          message: 'No file ID provided'
        });
      }
      
      console.log(`Processing PDF extraction for file ID: ${fileId}`);
      
      // Create files service instance with proper accountability
      const filesService = new FilesService({ 
        knex: database,
        accountability: req.accountability 
      });
      
      // Get file information
      const file = await filesService.readOne(fileId);
      
      if (!file || !file.filename_download.toLowerCase().endsWith('.pdf')) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Invalid or non-PDF file ID provided' 
        });
      }
      
      console.log(`Found file in database: ${file.filename_download}`);
      
      // Try to get the file directly using the FilesService with stream option
      let fileBuffer: Buffer | undefined;
      
      try {
        // Use the readOne method with stream option to get the file contents directly
        const fileStream = await filesService.readOne(fileId, { stream: true });
        const chunks: Buffer[] = [];
        
        // Process the stream into a buffer
        for await (const chunk of fileStream) {
          chunks.push(Buffer.from(chunk));
        }
        
        fileBuffer = Buffer.concat(chunks);
        console.log(`Successfully retrieved file from Directus using stream API`);
      } catch (streamError) {
        console.error('Error getting file using stream API:', streamError);
        
        // Fallback to file system access if stream approach fails
        const uploadsDir = env.PUBLIC_PATH || 'uploads';
        
        // Try multiple possible file paths
        const possiblePaths = [
          path.join(uploadsDir, fileId), 
          path.join(uploadsDir, `${fileId}.pdf`),
          path.join(uploadsDir, file.filename_download)
        ];
        
        console.log(`Attempting to read file from possible paths: ${possiblePaths.join(', ')}`);
        
        // Try each path
        let found = false;
        for (const pathToTry of possiblePaths) {
          try {
            fileBuffer = await fs.readFile(pathToTry);
            console.log(`Successfully read file from: ${pathToTry}`);
            found = true;
            break;
          } catch (err) {
            // Continue to next path
          }
        }
        
        if (!found) {
          return res.status(404).json({ 
            status: 'error', 
            message: `Could not find PDF file in any of the expected locations` 
          });
        }
      }
      
      if (!fileBuffer) {
        return res.status(404).json({
          status: 'error',
          message: 'Could not read PDF file content'
        });
      }
      
      // Parse PDF content
      console.log(`Parsing PDF content with pdf-parse`);
      const pdfData = await pdfParse(fileBuffer);
      
      // Convert text to HTML
      const htmlContent = convertTextToHtml(pdfData.text);
      
      // Return response
      return res.json({
        status: 'ok',
        data: {
          html: htmlContent,
          filename: file.filename_download,
          metadata: {
            info: pdfData.info,
            numberOfPages: pdfData.numpages,
            version: pdfData.pdfInfo?.PDFFormatVersion,
            isEncrypted: pdfData.pdfInfo?.IsEncrypted === 'true',
          }
        }
      });
    } catch (error: any) {
      console.error('Error processing PDF by ID:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
});

/**
 * Convert plain text to structured HTML
 * This function creates basic paragraph and section structure from text
 */
function convertTextToHtml(text: string): string {
  // Clean up text
  const cleanText = text.replace(/\r\n/g, '\n').trim();
  
  // Split into paragraphs
  const paragraphs = cleanText.split(/\n{2,}/);
  
  // Convert paragraphs to HTML
  const htmlParagraphs = paragraphs.map(paragraph => {
    // Skip empty paragraphs
    if (!paragraph.trim()) return '';
    
    // Check if paragraph looks like a heading (all caps, short line)
    const isHeading = paragraph.trim().length < 100 && 
                      paragraph.toUpperCase() === paragraph.trim() && 
                      paragraph.length > 4;
    
    if (isHeading) {
      return `<h2>${paragraph.trim()}</h2>`;
    }
    
    // Process lines within a paragraph
    const lines = paragraph.split('\n');
    const processedLines = lines.map(line => line.trim()).join(' ');
    
    return `<p>${processedLines}</p>`;
  });
  
  return htmlParagraphs.join('\n');
}
