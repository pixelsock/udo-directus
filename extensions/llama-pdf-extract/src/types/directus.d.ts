
// Extend Express Request interface to include Directus accountability
declare global {
  namespace Express {
    interface Request {
      accountability?: {
        user?: string;
        role?: string;
        admin?: boolean;
        app?: boolean;
        ip?: string;
        userAgent?: string;
        permissions?: string[];
      };
      file?: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      };
    }
  }
}

export interface DirectusServices {
  FilesService: any;
  AssetsService: any;
}