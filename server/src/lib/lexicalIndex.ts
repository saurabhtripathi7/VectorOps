import MiniSearch from "minisearch";

export type LexicalDoc = {
  id: string;
  content: string;
  filePath: string;
};

export const miniSearch = new MiniSearch({
  fields: ["content"],
  storeFields: ["content", "filePath"],
  searchOptions: {
    boost: {
      content: 2,
    },
    fuzzy: 0.2,
  },
});

export function addToLexicalIndex(docs: LexicalDoc[]) {
  miniSearch.addAll(docs);
}
