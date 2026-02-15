"use client";

import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ToastProvider";
import { buildApiUrl } from "@/lib/api";

export default function ChatLanding() {
  const [input, setInput] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);

    try {
      const res = await fetch(buildApiUrl("/api/sessions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstMessage: input }),
      });

      if (!res.ok) {
        showToast({
          type: "error",
          title: "Failed to create chat",
          message: "Unable to start a new chat session. Please try again.",
        });
        setLoading(false);
        return;
      }

      const { sessionId } = await res.json();

      window.dispatchEvent(new CustomEvent("chat-updated"));

      navigate(`/chat/${sessionId}?q=${encodeURIComponent(input)}`);
    } catch (error) {
      console.error("Failed to create session:", error);
      showToast({
        type: "error",
        title: "Failed to create chat",
        message: "An unexpected error occurred. Please try again.",
      });
      setLoading(false);
    }
  }

  if (!isMounted) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 bg-[#0a0a0a] animate-pulse">
        <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-white/5" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-[#0a0a0a]">
      <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-6 shadow-2xl">
        <img src="/icon.svg" alt="VectorOps" className="w-12 h-12" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">Start a Conversation</h2>

      <p className="text-zinc-500 max-w-xs text-sm leading-relaxed mb-6">
        Ask a question to begin exploring your knowledge base.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-md relative">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your VectorOps..."
          disabled={loading}
          className="w-full pr-14 py-4 px-5 rounded-2xl bg-zinc-900/50 border border-white/10 focus:border-blue-500/50 focus:ring-blue-500/20 shadow-xl text-sm"
        />

        <Button
          type="submit"
          disabled={loading || !input.trim()}
          className="absolute right-2 top-2 h-10 w-10 rounded-xl cursor-pointer"
          aria-label="Send message"
        >
          <Send className="w-4 h-4 text-white" />
        </Button>
      </form>
    </div>
  );
}
