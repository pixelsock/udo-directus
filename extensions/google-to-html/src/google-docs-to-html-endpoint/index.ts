import { defineEndpoint } from '@directus/extensions-sdk';
import { Request, Response } from 'express';
// @ts-ignore
import nodePandoc from 'node-pandoc';
import * as fs from 'fs-extra';
import * as temp from 'temp';
import multer from 'multer';
import * as path from 'path';
import { promisify } from 'util';

// Promisify the node-pandoc function
const pandoc = promisify(nodePandoc);

// Automatically track and clean up temporary files
temp.track();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create a temporary directory
    temp.mkdir('directus-pandoc', (err, dirPath) => {
      if (err) return cb(err, '');
      cb(null, dirPath);
    });
  },
  filename: (req, file, cb) => {
    // Keep the original filename
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

export default defineEndpoint((router, { services, exceptions }) => {
  const { ServiceUnavailableException } = exceptions;
  
  // Log when the endpoint is registered - helpful for debugging
  console.log('Google Docs to HTML endpoint registered');
  
  // Health check route
  router.get('/status', async (req: Request, res: Response) => {
    console.log('Status endpoint called');
    try {
      // Check if pandoc is installed
      const version = await pandoc('', '--version');
      console.log('Pandoc check successful:', version.split('\n')[0]);
      res.json({ 
        status: 'ok', 
        message: 'Conversion service is operational',
        pandoc_version: version.split('\n')[0]
      });
    } catch (error) {
      console.error('Pandoc check failed:', error);
      res.status(503).json({ 
        status: 'error', 
        message: 'Pandoc is not installed or not working properly',
        error: error.message
      });
    }
  });

  // File upload and convert route
  router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }
    try {
      const inputPath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();
      let inputFormat = '';
      if (ext === '.docx') inputFormat = 'docx';
      else if (ext === '.odt') inputFormat = 'odt';
      else if (ext === '.rtf') inputFormat = 'rtf';
      else if (ext === '.html' || ext === '.htm') inputFormat = 'html';
      else throw new Error('Unsupported file extension: ' + ext);
      const args = ['-f', inputFormat, '-t', 'html'];
      console.log('Invoking pandoc with:', inputPath, args);
      const html = await pandoc(inputPath, args);
      res.json({ status: 'ok', data: { html } });
    } catch (error) {
      console.error('Pandoc conversion failed:', error, req.file ? req.file.originalname : 'no file');
      res.status(500).json({ status: 'error', message: 'Conversion failed', error: error.message });
    }
  });

});