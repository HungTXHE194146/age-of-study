import mammoth from "mammoth";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buffer: Buffer, options?: object) => Promise<{ text: string }>;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const WordExtractor = require("word-extractor") as new () => { extract(path: string | Buffer): Promise<{ getBody(): string }> };

export interface ParsedFileContent {
  text: string;
  error?: string;
}

/**
 * Extracts text content from uploaded files (PDF, DOCX, and older DOC)
 * @param fileBuffer - The Node.js Buffer from the uploaded file
 * @param mimeType - The MIME type of the file
 * @param fileName - Optional file name to help fallback formatting
 * @returns ParsedFileContent with extracted text or error
 */
export async function extractTextFromFile(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string = ""
): Promise<ParsedFileContent> {
  try {
    // 1. Handle PDF
    if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith('.pdf')) {
      const result = await pdfParse(fileBuffer);
      const text = result.text ? result.text.trim() : "";
      if (!text) throw new Error("PDF parsed but returned empty text.");
      return { text };
    } 
    
    // 2. Handle DOCX
    else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
      fileName.toLowerCase().endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      const text = result.value ? result.value.trim() : "";
      if (!text) throw new Error("DOCX parsed but returned empty text.");
      return { text };
    } 
    
    // 3. Handle older DOC (Word 97-2003)
    else if (mimeType === "application/msword" || fileName.toLowerCase().endsWith('.doc')) {
      const extractor = new WordExtractor();
      const extracted = await extractor.extract(fileBuffer);
      const text = extracted.getBody() ? extracted.getBody().trim() : "";
      if (!text) throw new Error("DOC parsed but returned empty text.");
      return { text };
    } 
    
    // 4. Unsupported
    else {
      return {
        text: "",
        error: `Định dạng không được hỗ trợ: ${mimeType}. Vui lòng tải lên PDF, DOCX, hoặc DOC.`,
      };
    }
  } catch (error) {
    console.error(`[FileParser Error] MIME: ${mimeType}, File: ${fileName}`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      text: "",
      error: `Không thể đọc nội dung file. Lỗi hệ thống: ${errorMessage}`,
    };
  }
}

/**
 * Validates if the extracted text contains meaningful content
 * @param text - The extracted text
 * @returns boolean indicating if text is valid
 */
export function isValidTextContent(text: string): boolean {
  if (!text || typeof text !== "string") {
    return false;
  }

  // Remove whitespace and check if there's actual content
  const trimmedText = text.trim();
  
  // Chỉ cần có nội dung (length > 0) là hợp lệ. Bỏ logic báo lỗi nếu file quá ngắn.
  // Giới hạn max 50000 ký tự để tránh nổ token của AI.
  return trimmedText.length > 0 && trimmedText.length < 50000;
}