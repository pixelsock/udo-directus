declare module 'pdf-parse' {
  interface PDFInfo {
    PDFFormatVersion?: string;
    IsEncrypted?: string;
    [key: string]: any;
  }
  
  interface PDFData {
    text: string;
    numpages: number;
    info: {
      [key: string]: any;
    };
    metadata: any;
    pdfInfo?: PDFInfo;
    version?: string;
  }
  
  function pdfParse(dataBuffer: Buffer, options?: any): Promise<PDFData>;
  
  export = pdfParse;
}