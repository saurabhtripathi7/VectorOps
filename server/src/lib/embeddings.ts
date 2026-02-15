import axios from "axios";

export async function embedTexts(texts: string[]) {
  if (!process.env.JINA_API_KEY) {
    throw new Error("JINA_API_KEY is not set");
  }

  if (!texts || texts.length === 0) {
    return [];
  }

  const start = Date.now();
  console.info("[embeddings] request", { count: texts.length });

  try {
    const response = await axios.post(
      "https://api.jina.ai/v1/embeddings",
      {
        input: texts,
        model: "jina-embeddings-v2-base-en",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.JINA_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    const vectors = response.data.data.map((d: any) => d.embedding);
    console.info("[embeddings] response", {
      count: vectors.length,
      ms: Date.now() - start,
    });
    return vectors;
  } catch (error) {
    const elapsed = Date.now() - start;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const statusCode = axios.isAxiosError(error) ? error.response?.status : "unknown";
    const responseData = axios.isAxiosError(error) ? error.response?.data : null;

    console.error("[embeddings] error", {
      ms: elapsed,
      status: statusCode,
      message: errorMessage,
      responseData,
    });

    throw new Error(
      `Embedding service failed (status: ${statusCode}): ${errorMessage}`
    );
  }
}
