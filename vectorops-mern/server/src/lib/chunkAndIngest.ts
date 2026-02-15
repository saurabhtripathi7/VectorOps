import { getOrCreateCollection } from "./chromaClient";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embedTexts } from "./embeddings";
import { addToLexicalIndex } from "./lexicalIndex";

export async function ingestTextIntoChroma(
  collectionName: string,
  filePath: string,
  text: string,
  metadata: Record<string, any> = {}
) {
  if (!text || text.trim().length === 0) {
    throw new Error("Cannot ingest empty text content");
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.splitText(text);

  if (!chunks || chunks.length === 0) {
    throw new Error("Text splitting produced no chunks");
  }

  console.log("[ingestTextIntoChroma] chunks created", {
    filePath,
    chunkCount: chunks.length,
    totalChars: text.length,
  });

  addToLexicalIndex(
    chunks.map((chunk, index) => ({
      id: `${filePath}_${index}`,
      content: chunk,
      filePath,
    }))
  );

  const collection = await getOrCreateCollection(collectionName);

  if (!collection) {
    throw new Error("Failed to get or create collection");
  }

  const embeddings = await embedTexts(chunks);

  if (!embeddings || embeddings.length !== chunks.length) {
    throw new Error(
      `Embedding mismatch: expected ${chunks.length} embeddings, got ${embeddings?.length || 0}`
    );
  }

  await collection.add({
    ids: chunks.map((_, index) => `${filePath}_${index}`),
    documents: chunks,
    metadatas: chunks.map((_, index) => ({
      ...metadata,
      filePath,
      chunkIndex: index,
    })),
    embeddings,
  });

  console.log(`[ingestTextIntoChroma] success: ingested ${chunks.length} chunks from ${filePath} into collection ${collectionName}`);
}
