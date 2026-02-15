import { Router } from "express";
import { getOrCreateCollection, DEFAULT_COLLECTION_NAME } from "../lib/chromaClient";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const collection = await getOrCreateCollection(DEFAULT_COLLECTION_NAME);
    const results = await collection.get({
      include: ["metadatas"],
    });

    if (!results.metadatas || results.metadatas.length === 0) {
      return res.json([]);
    }

    const filePathsSet = new Set<string>();
    results.metadatas.forEach((metadata: any) => {
      if (metadata && metadata.filePath) {
        filePathsSet.add(metadata.filePath);
      }
    });

    const filePaths = Array.from(filePathsSet).map((path) => ({
      filePath: path,
      fileName: path.split("/").pop() || path,
    }));

    return res.json(filePaths);
  } catch (error) {
    console.error("[knowledge] Error listing files:", error);
    return res.status(500).json({ error: "Failed to list knowledge files" });
  }
});

router.delete("/", async (req, res) => {
  try {
    const { filePath } = req.body as { filePath?: string };

    if (!filePath) {
      return res.status(400).json({ error: "filePath is required" });
    }

    const collection = await getOrCreateCollection(DEFAULT_COLLECTION_NAME);
    const results = await collection.get({
      where: { filePath },
      include: ["metadatas"],
    });

    if (!results.ids || results.ids.length === 0) {
      return res.status(404).json({ error: "File not found in knowledge base" });
    }

    await collection.delete({
      ids: results.ids,
    });

    return res.json({
      status: "deleted",
      filePath,
      chunksDeleted: results.ids.length,
    });
  } catch (error) {
    console.error("[knowledge] Error deleting file:", error);
    return res.status(500).json({ error: "Failed to delete file" });
  }
});

export default router;
