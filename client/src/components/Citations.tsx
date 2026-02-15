"use client";

import { useState } from "react";

interface Citation {
  id: number;
  source: string;
  chunkIndex: number;
  preview: string;
}

export default function Citations({ citations }: { citations: Citation[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-white/60 hover:text-white/90 transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span>{citations.length} source{citations.length > 1 ? "s" : ""}</span>
      </button>

      {expanded && (
        <div className="space-y-2 animate-fadeIn">
          {citations.map((citation) => (
            <div
              key={citation.id}
              className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start gap-2">
                <span className="text-xs font-mono text-blue-400 mt-0.5">
                  [{citation.id}]
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white/90 truncate" title={citation.source}>
                    {citation.source.split("/").pop() || citation.source}
                  </div>
                  <div className="text-xs text-white/50 mt-1">Chunk {citation.chunkIndex}</div>
                  <div className="text-xs text-white/40 mt-2 line-clamp-2">{citation.preview}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
