import { defineEndpoint } from '@directus/extensions-sdk';
import { Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';

const upload = multer({ storage: multer.memoryStorage() });

/**
 * Convert plain text to structured HTML
 */
function convertTextToHtml(text: string): string {
  const cleanText = text.replace(/\r\n/g, '\n').trim();
  const paragraphs = cleanText.split(/\n{2,}/);
  
  const htmlParagraphs = paragraphs.map(paragraph => {
    if (!paragraph.trim()) return '';
    
    const isHeading = paragraph.trim().length < 100 &&
                      paragraph.toUpperCase() === paragraph.trim() &&
                      paragraph.length > 4;
    
    if (isHeading) {
      return `<h2>${paragraph.trim()}</h2>`;
    }
    
    const lines = paragraph.split('\n');
    const processedLines = lines.map(line => line.trim()).join(' ');
    
    return `<p>${processedLines}</p>`;
  });
  
  return htmlParagraphs.join('\n');
}

export default defineEndpoint((router, context) => {
  const { services, getSchema } = context;
  
  console.log('PDF Extract endpoint registered successfully at /extensions/llama-pdf-extract');
  
  // Test endpoint
  router.get('/test', (req: Request, res: Response) => {
    console.log('Test endpoint accessed');
    res.json({ status: 'ok', message: 'PDF Extract endpoint is working' });
  });
  
  // Handle file ID requests from the interface
  router.get('/:fileId', async (req: Request, res: Response) => {
    try {
      const fileId = req.params.fileId;
      console.log(`Processing PDF extraction for file ID: ${fileId}`);

      if (!fileId) {
        return res.status(400).json({
          status: 'error',
          message: 'Please add a PDF file'
        });
      }

      const schema = await getSchema();
      const { FilesService, AssetsService } = services;

      // Create FilesService to get file metadata
      const filesService = new FilesService({
        schema,
        accountability: req.accountability
      });

      // Get file information
      let file;
      try {
        file = await filesService.readOne(fileId);
      } catch (fileError) {
        console.error('File not found:', fileError);
        return res.status(404).json({
          status: 'error',
          message: 'Please add a PDF file'
        });
      }

      if (!file) {
        return res.status(404).json({
          status: 'error',
          message: 'Please add a PDF file'
        });
      }

      // Validate it's a PDF file
      if (!file.filename_download?.toLowerCase().endsWith('.pdf')) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Selected file is not a PDF. Please select a PDF file.'
        });
      }

      console.log(`Processing PDF file: ${file.filename_download}`);

      // Get file content using AssetsService
      const assetsService = new AssetsService({
        schema,
        accountability: req.accountability
      });

      let fileBuffer: Buffer;
      try {
        const assetResult = await assetsService.getAsset(fileId);
        
        // Convert stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of assetResult.stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        fileBuffer = Buffer.concat(chunks);
        
        console.log(`Successfully retrieved PDF file (${fileBuffer.length} bytes)`);
      } catch (assetsError) {
        console.error('Error accessing PDF file:', assetsError);
        return res.status(404).json({
          status: 'error',
          message: 'Could not access PDF file. Please try uploading the file again.'
        });
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'PDF file appears to be empty. Please select a valid PDF file.'
        });
      }

      // Parse PDF content
      console.log(`Parsing PDF content (${fileBuffer.length} bytes)`);
      let pdfData;
      try {
        pdfData = await pdfParse(fileBuffer);
      } catch (parseError) {
        console.error('Error parsing PDF:', parseError);
        return res.status(400).json({
          status: 'error',
          message: 'Could not parse PDF file. The file may be corrupted, password protected, or not a valid PDF.'
        });
      }

      // Check if PDF has extractable text
      if (!pdfData.text || pdfData.text.trim().length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'PDF file contains no extractable text. The PDF may be image-based or encrypted.'
        });
      }

      // Convert text to HTML
      const htmlContent = convertTextToHtml(pdfData.text);

      // Return success response
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
        message: 'Failed to process PDF file. Please try again.'
      });
    }
  });

  // Handle direct file uploads for testing
  router.post('/', upload.single('file'), async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please add a PDF file'
      });
    }

    try {
      const pdfData = await pdfParse(req.file.buffer);
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
      console.error('Error processing PDF upload:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to process PDF file'
      });
    }
  });
});