declare module 'multer' {
  import { RequestHandler } from 'express';

  interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  }

  interface StorageEngine {
    _handleFile(req: any, file: any, cb: any): void;
    _removeFile(req: any, file: any, cb: any): void;
  }

  interface Options {
    dest?: string;
    storage?: StorageEngine;
    limits?: {
      fieldNameSize?: number;
      fieldSize?: number;
      fields?: number;
      fileSize?: number;
      files?: number;
      parts?: number;
      headerPairs?: number;
    };
    preservePath?: boolean;
    fileFilter?: (req: any, file: MulterFile, cb: any) => void;
  }

  interface Multer {
    single(fieldname: string): RequestHandler;
    array(fieldname: string, maxCount?: number): RequestHandler;
    fields(fields: any[]): RequestHandler;
    none(): RequestHandler;
    any(): RequestHandler;
  }

  interface MemoryStorage {
    (): StorageEngine;
  }

  interface DiskStorage {
    (options: {
      destination?: string | ((req: any, file: MulterFile, cb: any) => void);
      filename?: (req: any, file: MulterFile, cb: any) => void;
    }): StorageEngine;
  }

  interface MulterStatic {
    (options?: Options): Multer;
    memoryStorage: MemoryStorage;
    diskStorage: DiskStorage;
  }

  const multer: MulterStatic;
  export = multer;
}