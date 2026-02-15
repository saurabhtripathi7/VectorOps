"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import TypingIndicator from "@/components/TypingIndicator";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Send, User, Bot, Trash2 } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { markdownSchema } from "@/lib/markdownSanitizer";
import { useToast } from "@/components/ToastProvider";
import { buildApiUrl } from "@/lib/api";

function transformYoutubeLinks(text: string): string {
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;

  return text.replace(youtubeRegex, (_match, videoId) => {
    return `<iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>`;
  });
}

type AssistantMeta = {
  model?: string;
  mode?: "General" | "Knowledge base";
  cleanedText: string;
};

function extractAssistantMeta(text: string): AssistantMeta {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  let model: string | undefined;
  let mode: "General" | "Knowledge base" | undefined;

  for (let i = 0; i < Math.min(lines.length, 3); i += 1) {
    const trimmed = lines[i].trim();
    const modelMatch = trimmed.match(/^Model:\s*(.+)$/i);
    if (!model && modelMatch) {
      model = modelMatch[1].trim();
      continue;
    }
    const modeMatch = trimmed.match(/^Mode:\s*(.+)$/i);
    if (!mode && modeMatch) {
      const value = modeMatch[1].trim().toLowerCase();
      if (value.includes("general")) mode = "General";
      if (value.includes("knowledge")) mode = "Knowledge base";
    }
  }

  const cleanedLines = lines.filter((line, idx) => {
    if (idx >= 3) return true;
    const trimmed = line.trim();
    return !/^Model:/i.test(trimmed) && !/^Mode:/i.test(trimmed);
  });

  let cleanedText = cleanedLines.join("\n");
  if (/General answer \(not from knowledge base\)/i.test(cleanedText)) {
    cleanedText = cleanedText.replace(/General answer \(not from knowledge base\):?\s*/gi, "");
    if (!mode) mode = "General";
  }

  return { model, mode, cleanedText: cleanedText.trim() };
}

function formatAssistantText(text: string) {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const mainLines: string[] = [];
  const sourceLines: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      mainLines.push(line);
      continue;
    }

    if (!inCodeBlock && /^\s*(From Source|Source)\b/i.test(line)) {
      sourceLines.push(trimmed);
    } else {
      mainLines.push(line);
    }
  }

  const main = applyFormattingRules(mainLines).trim();
  const sources = formatSources(sourceLines.join("\n"));

  return { main, sources };
}

function formatSources(text: string) {
  if (!text.trim()) return "";

  const cleaned = text
    .split("\n")
    .map((line) => line.replace(/\s*\|\s*/g, " ").trim())
    .filter((line) => line.length > 0)
    .map((line) => (line.startsWith("-") ? line : `- ${line}`))
    .join("\n");

  return cleaned.replace(/\n{3,}/g, "\n\n").trim();
}

function applyFormattingRules(lines: string[]) {
  const out: string[] = [];
  let inCodeBlock = false;
  let hasHeading = false;
  let firstBulletIndex = -1;
  let looksLikeTable = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      out.push(line);
      continue;
    }

    if (!inCodeBlock && /^\|?.*\|.*\|$/.test(trimmed) && /\|\s*-{3,}\s*\|/.test(trimmed)) {
      looksLikeTable = true;
    }

    if (!inCodeBlock && /^#{1,6}\s+\S+/.test(trimmed)) {
      hasHeading = true;
    }

    if (!inCodeBlock && firstBulletIndex === -1 && /^([-*•]|\d+[.)])\s+/.test(trimmed)) {
      firstBulletIndex = out.length;
    }

    if (!inCodeBlock && /^([-*•]|\d+[.)])\s+/.test(trimmed)) {
      const last = out[out.length - 1] ?? "";
      if (last.trim() !== "") {
        out.push("");
      }
    }

    let cleaned = line.replace(/\s+$/g, "");
    if (!inCodeBlock && !looksLikeTable) {
      cleaned = cleaned.replace(/\s*\|\s*/g, " ");
    }
    out.push(cleaned);
  }

  let formatted = out.join("\n").replace(/\n{3,}/g, "\n\n");

  if (!hasHeading && formatted.length > 600) {
    formatted = `### Answer\n\n${formatted}`;
  }

  if (!hasHeading && firstBulletIndex !== -1) {
    const parts = formatted.split("\n");
    parts.splice(firstBulletIndex, 0, "", "### Key Points");
    formatted = parts.join("\n").replace(/\n{3,}/g, "\n\n");
  }

  return formatted;
}

function ChatContent({ id }: { id: string }) {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [bgStatus, setBgStatus] = useState<string | null>(null);
  const { showToast } = useToast();
  const slowStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevChatStatus = useRef<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { messages, setMessages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: buildApiUrl(`/api/chat?sessionId=${id}`),
    }),
    body: {
      sessionId: id,
    },
    onError: (error: Error) => {
      console.error("[Chat Error]:", error);
      const errorMessage = error.message || String(error);
      setBgStatus("Request failed. Please try again.");
      if (clearStatusTimer.current) clearTimeout(clearStatusTimer.current);
      clearStatusTimer.current = setTimeout(() => setBgStatus(null), 2500);

      if (errorMessage.includes("quota") || errorMessage.includes("rate limit")) {
        showToast({
          type: "error",
          title: "API Quota Exceeded",
          message: "You've reached your Gemini API limit. Please wait a minute or check your API billing settings.",
          duration: 8000,
        });
      } else if (errorMessage.includes("Failed after")) {
        showToast({
          type: "error",
          title: "Request Failed",
          message: "The AI service is temporarily unavailable. Please try again in a moment.",
          duration: 6000,
        });
      } else {
        showToast({
          type: "error",
          title: "Something went wrong",
          message: "Failed to get a response. Please try again.",
          duration: 5000,
        });
      }
    },
  } as any);

  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(buildApiUrl(`/api/messages/${id}`));
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setHasHistory(true);
          const mappedMessages = data.map((m: any) => ({
            id: m._id,
            role: m.role as any,
            parts: [{ type: "text" as const, text: m.content }],
          }));
          setMessages(mappedMessages);
        } else {
          setHasHistory(false);
        }
        setHistoryLoaded(true);
      } catch (error) {
        console.error("Failed to fetch history:", error);
        showToast({
          type: "warning",
          title: "Warning",
          message: "Unable to load chat history. Starting a fresh session.",
        });
        setHistoryLoaded(true);
      }
    }
    fetchHistory();
  }, [id, setMessages, showToast]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (slowStatusTimer.current) clearTimeout(slowStatusTimer.current);
      if (clearStatusTimer.current) clearTimeout(clearStatusTimer.current);
    };
  }, []);

  useEffect(() => {
    const previous = prevChatStatus.current;
    prevChatStatus.current = status;

    if (status === "submitted") {
      setBgStatus("Contacting Gemini...");
      if (slowStatusTimer.current) clearTimeout(slowStatusTimer.current);
      slowStatusTimer.current = setTimeout(() => {
        setBgStatus("Gemini is working (no stream yet)...");
      }, 1500);
    }

    if (status === "streaming") {
      if (slowStatusTimer.current) clearTimeout(slowStatusTimer.current);
      setBgStatus("Streaming response...");
    }

    if (status === "ready" && (previous === "submitted" || previous === "streaming")) {
      if (slowStatusTimer.current) clearTimeout(slowStatusTimer.current);
      setBgStatus("Response received.");
      if (clearStatusTimer.current) clearTimeout(clearStatusTimer.current);
      clearStatusTimer.current = setTimeout(() => setBgStatus(null), 1500);
    }
  }, [status]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === "submitted" || status === "streaming") return;

    const userQuery = input;
    setInput("");

    try {
      await sendMessage({ text: userQuery, metadata: { sessionId: id } });
    } catch (error) {
      console.error("Error submitting message:", error);
      showToast({
        type: "error",
        title: "Connection Error",
        message: "Failed to send your message. Please check your connection.",
        duration: 5000,
      });
    }
  };

  const isLoading = status === "submitted" || status === "streaming";

  const [searchParams] = useSearchParams();
  const firstQuery = searchParams.get("q");
  const sentRef = useRef(false);

  useEffect(() => {
    if (historyLoaded && !hasHistory && firstQuery && !sentRef.current && messages.length === 0) {
      sentRef.current = true;
      sendMessage({
        text: firstQuery,
        metadata: { sessionId: id },
      });
      navigate(`/chat/${id}`, { replace: true });
    }
  }, [historyLoaded, hasHistory, firstQuery, sendMessage, messages.length, id, navigate]);

  const handleDeleteChat = async () => {
    if (!confirm("Are you sure you want to delete this chat session? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(buildApiUrl(`/api/messages/${id}`), {
        method: "DELETE",
      });

      if (res.ok) {
        showToast({
          type: "success",
          title: "Chat deleted",
          message: "The chat session has been removed successfully.",
        });
        window.dispatchEvent(new CustomEvent("chat-updated"));
        navigate("/");
      } else {
        showToast({
          type: "error",
          title: "Delete failed",
          message: "Unable to delete the chat session. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      showToast({
        type: "error",
        title: "Delete failed",
        message: "An error occurred while deleting the chat.",
      });
    }
  };

  if (!isMounted) {
    return (
      <div className="flex flex-col h-screen bg-[#0a0a0a] animate-pulse">
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-black/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800" />
            <div className="h-4 w-32 bg-zinc-800 rounded" />
          </div>
        </header>
        <main className="flex-1" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/50 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/10">
            <img src="/icon.svg" alt="VectorOps" className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Knowledge Session</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">ID: {id.slice(-6)}</p>
          </div>
        </div>

        <Button
          onClick={handleDeleteChat}
          variant="ghost"
          size="icon"
          className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          title="Delete Chat"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 md:px-0 py-8">
        <div className="flex flex-col items-center justify-start max-w-2xl mx-auto space-y-8 pb-12">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-6">
                <img src="/icon.svg" alt="VectorOps" className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Deep Knowledge Retrieval</h2>
              <p className="text-zinc-500 max-w-sm">
                This session is ready. Ask anything about your indexed documents and notes.
              </p>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 w-full max-w-2xl ${m.role === "user" ? "flex-row-reverse justify-end" : "flex-row justify-start"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    m.role === "user"
                      ? "bg-blue-600/10 border-blue-500/20 text-blue-400"
                      : "bg-zinc-800 border-white/10 text-zinc-400"
                  }`}
                >
                  {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`flex flex-col w-full max-w-2xl ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`w-full px-4 md:px-5 py-3 rounded-lg md:rounded-2xl max-h-[80vh] overflow-y-auto ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-[#1a1a1a] border border-[#333] text-zinc-100 rounded-bl-none"
                    }`}
                  >
                    {m.parts.map((p, i) => {
                      if (p.type !== "text") return null;
                      const assistantMeta = m.role === "assistant" ? extractAssistantMeta(p.text) : null;
                      const displayText = assistantMeta?.cleanedText ?? p.text;
                      return (
                        <div key={i} className="w-full prose prose-sm dark:prose-invert max-w-none">
                          {(() => {
                            const text = m.role === "assistant" ? formatAssistantText(displayText) : { main: displayText, sources: "" };
                            const blocks = text.main.split("\n\n");

                            return (
                              <>
                                {m.role === "assistant" && assistantMeta?.mode === "General" && (
                                  <div className="mb-3">
                                    <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                                      General answer
                                    </span>
                                  </div>
                                )}
                                {blocks.map((block, idx) => (
                                  <Markdown
                                    rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSchema]]}
                                    key={idx}
                                    components={{
                                      h3({ children }) {
                                        return <h3 className="mt-5 mb-3 text-lg font-bold text-white">{children}</h3>;
                                      },
                                      h4({ children }) {
                                        return <h4 className="mt-4 mb-2 text-base font-semibold text-gray-100">{children}</h4>;
                                      },
                                      code({ inline, className, children, ...props }: any) {
                                        const match = /language-(\w+)/.exec(className || "");
                                        return !inline && match ? (
                                          <div className="my-4 rounded-lg bg-[#1e1e1e] border border-[#333] overflow-hidden">
                                            <div className="text-xs text-gray-400 px-4 py-2 border-b border-[#333] font-mono">{match[1]}</div>
                                            <div className="overflow-x-auto">
                                              <SyntaxHighlighter
                                                style={vscDarkPlus}
                                                language={match[1]}
                                                PreTag="div"
                                                wrapLines={true}
                                                wrapLongLines={true}
                                                className="bg-transparent! m-0! p-4! text-sm"
                                                {...props}
                                              >
                                                {String(children).replace(/\n$/, "")}
                                              </SyntaxHighlighter>
                                            </div>
                                          </div>
                                        ) : (
                                          <code className="bg-[#2d2d2d] text-blue-300 px-2 py-1 rounded text-sm font-mono wrap-break-word" {...props}>
                                            {children}
                                          </code>
                                        );
                                      },
                                      iframe({ src }) {
                                        if (!src) return null;

                                        return (
                                          <div className="my-4 w-full overflow-hidden rounded-xl border border-white/10 bg-black">
                                            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                                              <iframe
                                                src={src}
                                                title="Embedded video"
                                                className="absolute top-0 left-0 w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                referrerPolicy="strict-origin-when-cross-origin"
                                              />
                                            </div>
                                          </div>
                                        );
                                      },
                                      img({ src, alt }) {
                                        if (!src) return null;

                                        return (
                                          <div className="group relative my-8 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl transition-all duration-300 hover:border-white/20">
                                            <img
                                              src={(src as string).replace("/public", "")}
                                              alt={alt ?? "Knowledge Image"}
                                              className="h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                                              loading="lazy"
                                            />
                                          </div>
                                        );
                                      },
                                      p({ children }) {
                                        return <p className="my-2 leading-relaxed text-base text-inherit">{children}</p>;
                                      },
                                      blockquote({ children }) {
                                        return (
                                          <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-3 text-gray-400 italic bg-blue-500/5 rounded-r">
                                            {children}
                                          </blockquote>
                                        );
                                      },
                                      ul({ children }) {
                                        return <ul className="my-2 ml-5 list-disc space-y-1.5 text-base leading-relaxed">{children}</ul>;
                                      },
                                      ol({ children }) {
                                        return <ol className="my-2 ml-5 list-decimal space-y-1.5 text-base leading-relaxed">{children}</ol>;
                                      },
                                      li({ children }) {
                                        return <li className="text-base">{children}</li>;
                                      },
                                      table({ children }) {
                                        return (
                                          <div className="my-4 rounded-lg border border-[#333] overflow-x-auto">
                                            <table className="w-full text-sm border-collapse">{children}</table>
                                          </div>
                                        );
                                      },
                                      th({ children }) {
                                        return (
                                          <th className="text-left bg-[#2d2d2d] px-4 py-3 font-semibold border-b border-[#333] text-white text-sm">
                                            {children}
                                          </th>
                                        );
                                      },
                                      td({ children }) {
                                        return (
                                          <td className="px-4 py-2 border-b border-[#333] align-top text-sm">{children}</td>
                                        );
                                      },
                                    }}
                                  >
                                    {transformYoutubeLinks(block)}
                                  </Markdown>
                                ))}

                                {text.sources && (
                                  <div className="mt-6 rounded-lg border border-[#333] bg-[#0f0f0f] px-4 py-3 w-full">
                                    <div className="text-xs uppercase tracking-wider text-gray-400 mb-3 font-semibold">
                                      Sources
                                    </div>
                                    <div className="text-sm text-gray-300 max-w-full">
                                      <Markdown rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSchema]]}>
                                        {transformYoutubeLinks(text.sources)}
                                      </Markdown>
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                  <div className={`mt-1 px-2 text-[10px] text-zinc-600 ${m.role === "user" ? "text-right" : "text-left"}`}>
                    {m.role === "user" ? (
                      "You"
                    ) : (
                      <div className="flex flex-col items-start gap-0.5">
                        <span>VectorOps</span>
                        {(() => {
                          const textPart = m.parts.find((part) => part.type === "text");
                          const meta = textPart?.type === "text" ? extractAssistantMeta(textPart.text) : null;
                          return meta?.model ? <span className="text-[10px] text-zinc-500">Model: {meta.model}</span> : null;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl px-4 py-2">
                <TypingIndicator status={bgStatus || "Thinking..."} />
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>
      </main>

      <div className="p-6 bg-linear-to-t from-black via-black to-transparent">
        <form onSubmit={onSubmit} className="max-w-3xl mx-auto relative group">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search your query with context..."
            disabled={isLoading}
            className="pr-14 h-14 rounded-2xl bg-zinc-900/50 border-white/10 focus:border-blue-500/50 focus:ring-blue-500/20 shadow-2xl transition-all"
          />

          <div className="absolute right-2 top-2">
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-10 w-10 rounded-xl cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
        <p className="text-center mt-3 text-[10px] text-zinc-600 tracking-wider">
          AI generated responses may be inaccurate. Check citations for verification.
        </p>
      </div>
    </div>
  );
}

export default function ChatSessionPage() {
  const { id } = useParams();

  if (!id) {
    return <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-zinc-500">Missing session ID.</div>;
  }

  return <ChatContent id={id} />;
}
