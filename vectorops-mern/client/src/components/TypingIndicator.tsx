"use client";

type TypingIndicatorProps = {
  status?: string | null;
};

export default function TypingIndicator({ status }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex items-end gap-1.5">
        <span className="h-2 w-1.5 rounded-full bg-white/50 animate-pulse [animation-delay:-0.3s]" />
        <span className="h-3 w-1.5 rounded-full bg-white/60 animate-pulse [animation-delay:-0.15s]" />
        <span className="h-2 w-1.5 rounded-full bg-white/50 animate-pulse" />
      </div>
      <div className="text-[11px] text-zinc-400">{status || "Working..."}</div>
    </div>
  );
}
