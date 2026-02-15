export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const pdfParse = await import("pdf-parse");
    const data = await pdfParse.default(pdfBuffer);

    if (!data.text || data.text.trim().length === 0) {
      throw new Error("PDF extraction produced no text");
    }

    return data.text;
  } catch (error) {
    throw new Error(
      `Failed to extract text from PDF: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export function isPDFFile(filePath: string): boolean {
  return filePath.toLowerCase().endsWith(".pdf");
}
