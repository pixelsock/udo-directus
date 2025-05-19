import { defineEndpoint } from '@directus/extensions-sdk';
import { Request, Response } from 'express';
import multer from 'multer';

// Placeholder import for llama-extract. Assumes a function that accepts a file path
// and returns extracted HTML or text content.
// TODO: Replace with actual llama-extract import when available.
// import { extract } from 'llama-extract';

const upload = multer({ storage: multer.memoryStorage() });

export default defineEndpoint((router) => {
  router.post('/extract', upload.single('file'), async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No PDF uploaded' });
    }

    try {
      // TODO: Use llama-extract to parse the uploaded PDF buffer.
      // const result = await extract(req.file.buffer);
      const result = '<p>TODO: parsed content from llama-extract</p>';

      res.json({ status: 'ok', data: { html: result } });
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });
});
