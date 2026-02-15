import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const ESTIMATED_TOKENS_PER_CHUNK = 180;
const TOKEN_LIMIT_PER_MINUTE = 100000;
const CHROMA_RECORD_QUOTA = 300;

export interface TokenEstimate {
  textLength: number;
  estimatedChunks: number;
  estimatedTokens: number;
  withinLimit: boolean;
  remainingTokens: number;
}

export interface QuotaEstimate extends TokenEstimate {
  chromaRecordQuota: number;
  withinChromaQuota: boolean;
  remainingChromaRecords: number;
}

export async function estimateTokensForText(text: string): Promise<QuotaEstimate> {
  if (!text || text.trim().length === 0) {
    return {
      textLength: 0,
      estimatedChunks: 0,
      estimatedTokens: 0,
      withinLimit: true,
      remainingTokens: TOKEN_LIMIT_PER_MINUTE,
      chromaRecordQuota: CHROMA_RECORD_QUOTA,
      withinChromaQuota: true,
      remainingChromaRecords: CHROMA_RECORD_QUOTA,
    };
  }

  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.splitText(text);
    const estimatedTokens = chunks.length * ESTIMATED_TOKENS_PER_CHUNK;
    const withinTokenLimit = estimatedTokens <= TOKEN_LIMIT_PER_MINUTE;
    const remainingTokens = TOKEN_LIMIT_PER_MINUTE - estimatedTokens;

    const withinChromaQuota = chunks.length <= CHROMA_RECORD_QUOTA;
    const remainingChromaRecords = CHROMA_RECORD_QUOTA - chunks.length;

    return {
      textLength: text.length,
      estimatedChunks: chunks.length,
      estimatedTokens,
      withinLimit: withinTokenLimit,
      remainingTokens,
      chromaRecordQuota: CHROMA_RECORD_QUOTA,
      withinChromaQuota,
      remainingChromaRecords,
    };
  } catch (error) {
    throw new Error(
      `Failed to estimate tokens: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export function getFileSizeReducedError(estimate: QuotaEstimate): string {
  const issues: string[] = [];

  if (!estimate.withinLimit) {
    issues.push(
      `Token limit exceeded: ${estimate.estimatedTokens} tokens (max: ${TOKEN_LIMIT_PER_MINUTE})`
    );
  }

  if (!estimate.withinChromaQuota) {
    issues.push(
      `Chroma record quota exceeded: ${estimate.estimatedChunks} chunks (quota: ${estimate.chromaRecordQuota})`
    );
  }

  const issueText = issues.length > 1 ? "issues" : "issue";
  const issueList = issues.map((i) => `  - ${i}`).join("\n");

  const maxChunksForTokens = Math.floor(TOKEN_LIMIT_PER_MINUTE / ESTIMATED_TOKENS_PER_CHUNK);
  const maxChunksAllowed = Math.min(maxChunksForTokens, CHROMA_RECORD_QUOTA);
  const maxTextLength = maxChunksAllowed * 800;

  return `File exceeds limits (${issueList}).
  
Current file:
  - Content length: ${estimate.textLength} characters
  - Estimated chunks: ${estimate.estimatedChunks}
  - Estimated tokens: ${estimate.estimatedTokens}

Solutions:
1. Provide a smaller file (max ~${Math.round(maxTextLength / 1024)}KB for ${maxChunksAllowed} chunks)
2. Split the file into multiple smaller parts and ingest separately
3. Delete existing ingested documents to free up Chroma quota
4. Upgrade your plan for higher limits`;
}
