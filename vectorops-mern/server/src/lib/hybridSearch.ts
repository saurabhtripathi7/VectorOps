import { DEFAULT_COLLECTION_NAME, getOrCreateCollection } from "./chromaClient";
import { miniSearch } from "./lexicalIndex";

const SEMANTIC_WEIGHT = 0.7;
const LEXICAL_WEIGHT = 0.3;

export type HybridSearchResult = {
  content: string;
  meta?: {
    filePath?: string;
  };
  score: number;
  source: "semantic" | "lexical";
  finalScore: number;
};

type SemanticDocRaw = {
  content: string | null;
  meta: { filePath?: string } | undefined;
  score: number;
  source: "semantic";
};

type SemanticDoc = {
  content: string;
  meta: { filePath?: string } | undefined;
  score: number;
  source: "semantic";
};

export async function hybridSearch(query: string): Promise<HybridSearchResult[]> {
  const start = Date.now();
  if (!query.trim()) {
    console.info("[hybridSearch] empty query");
    return [];
  }
  console.info("[hybridSearch] start", { queryLength: query.length });

  const lexicalResults = miniSearch.search(query, {
    prefix: true,
  });
  console.info("[hybridSearch] lexical", { count: lexicalResults.length });

  const semanticStart = Date.now();
  const collection = await getOrCreateCollection(DEFAULT_COLLECTION_NAME);
  const semanticResults = await collection.query({
    queryTexts: [query],
    nResults: 5,
    include: ["documents", "metadatas", "distances"],
  });
  console.info("[hybridSearch] semantic", {
    count: semanticResults.documents?.[0]?.length ?? 0,
    ms: Date.now() - semanticStart,
  });

  const semanticDocs: SemanticDoc[] =
    semanticResults.documents?.[0]
      ?.map((doc, i): SemanticDocRaw => ({
        content: doc,
        meta: semanticResults?.metadatas?.[0]?.[i] ?? undefined,
        score: 1 - (semanticResults?.distances?.[0]?.[i] ?? 0),
        source: "semantic" as const,
      }))
      .filter((doc): doc is SemanticDoc => doc.content != null) ?? [];

  const lexicalDocs = lexicalResults?.map((r) => ({
    content: r.content,
    meta: { filePath: r.filePath },
    score: r.score,
    source: "lexical" as const,
  }));

  const combined = [...semanticDocs, ...lexicalDocs];

  const ranked = combined
    .map((d) => ({
      ...d,
      finalScore:
        d.source === "semantic" ? d.score * SEMANTIC_WEIGHT : d.score * LEXICAL_WEIGHT,
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 5);

  console.info("[hybridSearch] end", {
    combined: combined.length,
    returned: ranked.length,
    ms: Date.now() - start,
  });
  return ranked;
}
