import { CloudClient, EmbeddingFunction } from "chromadb";
import { embedTexts } from "./embeddings";
import dotenv from "dotenv";

dotenv.config();

class GeminiEmbeddingFunction implements EmbeddingFunction {
  async generate(texts: string[]): Promise<number[][]> {
    return embedTexts(texts);
  }
}

export const embeddingFunction = new GeminiEmbeddingFunction();

export const DEFAULT_COLLECTION_NAME = "vectorops";

let chromaClient: CloudClient | null = null;

function getChromaClient(): CloudClient {
  const apiKey = process.env.CHROMA_API_KEY;
  const tenant = process.env.CHROMA_TENANT;
  const database = process.env.CHROMA_DATABASE;

  if (!apiKey || !tenant || !database) {
    throw new Error("CHROMA_API_KEY, CHROMA_TENANT, and CHROMA_DATABASE must be set in .env");
  }

  if (!chromaClient) {
    chromaClient = new CloudClient({
      apiKey,
      tenant,
      database,
    });
  }

  return chromaClient;
}

export async function getOrCreateCollection(name: string) {
  console.info("[chroma] getOrCreateCollection", { name });
  const client = getChromaClient();
  return client.getOrCreateCollection({
    name,
    embeddingFunction,
  });
}
