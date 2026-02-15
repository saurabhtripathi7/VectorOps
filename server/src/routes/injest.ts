import { Router } from "express";
import crypto from "crypto";
import { ingestTextIntoChroma } from "../lib/chunkAndIngest";
import { DEFAULT_COLLECTION_NAME, getOrCreateCollection } from "../lib/chromaClient";
import { estimateTokensForText, getFileSizeReducedError } from "../lib/tokenEstimator";
import { isPDFFile, extractTextFromPDF } from "../lib/pdfExtractor";

const router = Router();

function hashContent(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

router.post("/", async (req, res) => {
  try {
    const { filePath, content, contentBase64 } = req.body as {
      filePath?: string;
      content?: string;
      contentBase64?: string;
    };

    console.log("Ingest request received:", filePath);

    const resolvedContent =
      content ?? (contentBase64 ? Buffer.from(contentBase64, "base64").toString("utf8") : undefined);

    if (!filePath || !resolvedContent) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    let processedContent = resolvedContent;
    if (isPDFFile(filePath)) {
      console.log("PDF file detected, extracting text from:", filePath);
      if (!contentBase64) {
        return res.status(400).json({
          error: "Invalid payload",
          message: "contentBase64 is required for PDF ingestion",
        });
      }
      try {
        const pdfBuffer = Buffer.from(contentBase64, "base64");
        processedContent = await extractTextFromPDF(pdfBuffer);
        console.log("PDF text extraction complete:", {
          filePath,
          originalSize: resolvedContent.length,
          extractedSize: processedContent.length,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("PDF extraction failed:", { filePath, message });
        return res.status(400).json({
          error: "PDF extraction failed",
          message,
        });
      }
    }

    console.log("Estimating tokens and quota for:", filePath);
    const tokenEstimate = await estimateTokensForText(processedContent);

    console.log("Token and quota estimate:", {
      filePath,
      estimatedChunks: tokenEstimate.estimatedChunks,
      estimatedTokens: tokenEstimate.estimatedTokens,
      withinTokenLimit: tokenEstimate.withinLimit,
      withinChromaQuota: tokenEstimate.withinChromaQuota,
    });

    if (!tokenEstimate.withinLimit || !tokenEstimate.withinChromaQuota) {
      const errorMessage = getFileSizeReducedError(tokenEstimate);
      console.warn("File exceeds limits:", {
        filePath,
        estimate: tokenEstimate,
      });
      return res.status(413).json({
        error: "File exceeds limits",
        message: errorMessage,
        details: {
          contentLength: tokenEstimate.textLength,
          estimatedChunks: tokenEstimate.estimatedChunks,
          estimatedTokens: tokenEstimate.estimatedTokens,
          tokenLimit: 100000,
          chromaQuota: tokenEstimate.chromaRecordQuota,
          withinTokenLimit: tokenEstimate.withinLimit,
          withinChromaQuota: tokenEstimate.withinChromaQuota,
        },
      });
    }

    const collection = await getOrCreateCollection(DEFAULT_COLLECTION_NAME);
    const fileHash = hashContent(processedContent);

    const existing = await collection.get({
      where: { filePath },
      include: ["metadatas"],
    });

    const existingHash = (existing.metadatas?.[0] as any)?.fileHash;

    if (existingHash === fileHash) {
      return res.json({ status: "skipped" });
    }

    await collection.delete({ where: { filePath } });

    await ingestTextIntoChroma(DEFAULT_COLLECTION_NAME, filePath, processedContent, { fileHash });

    return res.json({ status: "ingested", filePath });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Ingest failed", { message, error });
    return res.status(500).json({ error: "Ingest failed", message });
  }
});

export default router;
