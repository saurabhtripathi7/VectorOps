"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Book,
  Settings,
  Database,
  Cpu,
  Rocket,
  ChevronRight,
  Terminal,
  FileText,
  Workflow,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Link } from "react-router-dom";

function toRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const sections = [
  {
    id: "overview",
    title: "Project Overview",
    icon: <Brain className="w-5 h-5" />,
    content:
      "VectorOps is an AI-powered personal knowledge management system that uses Retrieval-Augmented Generation (RAG) to help you interact with your digital knowledge base in real-time.",
    color: "#60a5fa",
  },
  {
    id: "concepts",
    title: "Core Concepts",
    icon: <Sparkles className="w-5 h-5" />,
    content:
      "The system is built on three pillars: Semantic Search for understanding intent, Vector Embeddings for storing knowledge, and LLMs for generating human-like responses with citations.",
    color: "#a855f7",
  },
  {
    id: "setup",
    title: "Quick Setup",
    icon: <Settings className="w-5 h-5" />,
    content:
      "Configure server/.env with MongoDB, ChromaDB, Jina, Gemini, and OpenAI fallback keys, then run npm install and npm run dev.",
    color: "#ec4899",
  },
  {
    id: "architecture",
    title: "Architecture",
    icon: <Workflow className="w-5 h-5" />,
    content:
      "Uploaded documents are chunked, embedded with Jina, and stored in ChromaDB. Chat uses hybrid retrieval and Gemini generation with automatic OpenAI fallback.",
    color: "#22c55e",
  },
  {
    id: "ingestion-workflow",
    title: "Ingestion Workflow",
    icon: <Rocket className="w-5 h-5" />,
    content:
      "Knowledge files can be ingested from the UI or via API endpoints. The server chunks content, generates embeddings, and updates ChromaDB metadata.",
    color: "#facc15",
  },
];

export default function DocsPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 selection:bg-blue-500/30">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]" />
      </div>

      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:border-blue-500/50 transition-colors">
              <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:text-blue-400" />
            </div>
            <span className="font-semibold text-zinc-100">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Book className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-zinc-500 uppercase tracking-widest">Documentation</span>
          </div>
        </div>
      </nav>

      <main className="relative pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-20"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Building your <span className="text-gradient">VectorOps</span>
          </h1>
          <p className="text-xl text-zinc-400 leading-relaxed max-w-3xl">
            Everything you need to know to build, configure, and extend your AI-powered knowledge management system. Designed for thinkers, builders, and everyone in between.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-20"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {sections.map((section) => (
            <motion.div
              key={section.id}
              variants={item}
              className="transition-all duration-300"
              style={{
                filter: "drop-shadow(0 0 0px rgba(0,0,0,0))",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = `drop-shadow(0 0 8px ${section.color}40)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "drop-shadow(0 0 0px rgba(0,0,0,0))";
              }}
            >
              <a href={`#${section.id}`}>
                <Card className="transition-all duration-300 group cursor-pointer bg-zinc-900/50 border border-white/10 hover:border-white/20">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300"
                      style={{
                        color: section.color,
                        backgroundColor: toRgba(section.color, 0.12),
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = toRgba(section.color, 0.2);
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = toRgba(section.color, 0.12);
                      }}
                    >
                      {section.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-100 mb-1 group-hover:text-blue-400 transition-colors">{section.title}</h3>
                      <p className="text-sm text-zinc-500 leading-relaxed">{section.content}</p>
                    </div>
                  </div>
                </Card>
              </a>
            </motion.div>
          ))}
        </motion.div>

        <div className="space-y-32">
          <section id="overview" className="scroll-mt-32">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-8 bg-blue-500 rounded-full" />
              <h2 className="text-3xl font-bold text-white">Project Overview</h2>
            </div>
            <div className="prose prose-invert max-w-none text-zinc-400 leading-relaxed space-y-6">
              <p>
                The VectorOps project is born out of the need to organize the vast amount of information we consume daily. Traditional note-taking is static; VectorOps makes it dynamic.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                  <FileText className="w-6 h-6 text-blue-400 mb-4" />
                  <h4 className="text-zinc-100 font-semibold mb-2">Multi-Format</h4>
                  <p className="text-sm">Supports PDF, DOCX, MD, and TXT ingestion pipelines.</p>
                </div>
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                  <Cpu className="w-6 h-6 text-purple-400 mb-4" />
                  <h4 className="text-zinc-100 font-semibold mb-2">AI-Core</h4>
                  <p className="text-sm">Gemini 2.5-flash primary generation with OpenAI failover.</p>
                </div>
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                  <Database className="w-6 h-6 text-pink-400 mb-4" />
                  <h4 className="text-zinc-100 font-semibold mb-2">Vector Store</h4>
                  <p className="text-sm">ChromaDB semantic retrieval fused with MiniSearch lexical ranking.</p>
                </div>
              </div>
            </div>
          </section>

          <section id="setup" className="scroll-mt-32">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-8 bg-pink-500 rounded-full" />
              <h2 className="text-3xl font-bold text-white">Setup Guide</h2>
            </div>
            <div className="space-y-8">
              <div className="bg-zinc-900/80 rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs font-mono text-zinc-500">Terminal</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  </div>
                </div>
                <div className="p-6 font-mono text-sm space-y-4">
                  <p className="text-zinc-500"># Step 1: Clone repository</p>
                  <div className="w-full overflow-hidden rounded-lg border border-white/10 bg-black/50">
                    <img src="/gitRepo.png" alt="Repo Link" className="w-full h-auto object-cover" />
                  </div>
                  <p className="text-zinc-500"># Step 2: Clone and install</p>
                  <p className="text-blue-400">git clone https://github.com/saurabhtripathi7/VectorOps.git</p>
                  <p className="text-blue-400">cd VectorOps &amp;&amp; npm install</p>
                  <p className="text-zinc-500 mt-4"># Step 3: Configure environment</p>
                  <p className="text-pink-400">cp server/.env.example server/.env</p>
                  <p className="text-pink-400">cp client/.env.example client/.env # optional</p>
                  <p className="text-zinc-500 mt-4"># Step 4: Start development</p>
                  <p className="text-green-400">npm run dev</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-zinc-100 font-semibold">Environment Variables</h4>
                  <ul className="space-y-3 text-sm text-zinc-400">
                    <li className="flex gap-2">
                      <div className="mt-1.5 w-1 h-1 rounded-full bg-zinc-600 shrink-0" />
                      <span><code className="text-zinc-200">MONGODB_URI</code>: MongoDB connection string for sessions and messages.</span>
                    </li>
                    <li className="flex gap-2">
                      <div className="mt-1.5 w-1 h-1 rounded-full bg-zinc-600 shrink-0" />
                      <span><code className="text-zinc-200">GOOGLE_GENERATIVE_AI_API_KEY</code>: Gemini key for primary generation.</span>
                    </li>
                    <li className="flex gap-2">
                      <div className="mt-1.5 w-1 h-1 rounded-full bg-zinc-600 shrink-0" />
                      <span><code className="text-zinc-200">JINA_API_KEY</code>: Embedding API key for vector generation.</span>
                    </li>
                    <li className="flex gap-2">
                      <div className="mt-1.5 w-1 h-1 rounded-full bg-zinc-600 shrink-0" />
                      <span><code className="text-zinc-200">CHROMA_API_KEY / CHROMA_TENANT / CHROMA_DATABASE</code>: ChromaDB Cloud credentials.</span>
                    </li>
                    <li className="flex gap-2">
                      <div className="mt-1.5 w-1 h-1 rounded-full bg-zinc-600 shrink-0" />
                      <span><code className="text-zinc-200">OPENAI_API_KEY</code>: Used for fallback when Gemini fails or is rate-limited.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section id="architecture" className="scroll-mt-32">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-8 bg-green-500 rounded-full" />
              <h2 className="text-3xl font-bold text-white">How it Works</h2>
            </div>
            <div className="bg-zinc-900/30 rounded-3xl border border-white/5 p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="flex-1 space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">1</div>
                    <div>
                      <h5 className="text-zinc-100 font-semibold mb-1">Data Ingestion</h5>
                      <p className="text-sm text-zinc-400">Documents are uploaded via UI or <code className="text-zinc-300">/api/injest</code>, then split into chunks.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold shrink-0">2</div>
                    <div>
                      <h5 className="text-zinc-100 font-semibold mb-1">Vectorization</h5>
                      <p className="text-sm text-zinc-400">Jina generates embeddings for each chunk, which are stored in ChromaDB with metadata.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold shrink-0">3</div>
                    <div>
                      <h5 className="text-zinc-100 font-semibold mb-1">Retrieval & Chat</h5>
                      <p className="text-sm text-zinc-400">Hybrid retrieval (semantic + lexical) builds context for Gemini, with automatic OpenAI fallback on failure.</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 relative w-full aspect-square max-w-75">
                  <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-pulse" />
                  <div className="absolute inset-4 border border-dashed border-white/10 rounded-full animate-spin-slow" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Rocket className="w-20 h-20 text-white animate-bounce" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="ingestion-workflow" className="scroll-mt-32">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-8 bg-yellow-500 rounded-full" />
              <h2 className="text-3xl font-bold text-white">Ingestion Workflow</h2>
            </div>
            <div className="space-y-6">
              <p className="text-zinc-400 leading-relaxed">
                VectorOps supports ingestion through both UI uploads and direct API calls. Each file is parsed, chunked, embedded, and written into ChromaDB so it becomes available for retrieval in chat.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                  <h4 className="text-zinc-100 font-semibold mb-3 flex items-center gap-2">
                    <span className="text-yellow-400">Pipeline</span>
                    How It Works
                  </h4>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    <li>- Accepts <code className="text-zinc-300">.md</code>, <code className="text-zinc-300">.txt</code>, <code className="text-zinc-300">.pdf</code>, <code className="text-zinc-300">.docx</code></li>
                    <li>- Splits text into overlapping chunks for retrieval quality</li>
                    <li>- Generates vectors with Jina embeddings</li>
                    <li>- Stores chunks + metadata in ChromaDB</li>
                    <li>- Index is immediately available to chat retrieval</li>
                  </ul>
                </div>
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                  <h4 className="text-zinc-100 font-semibold mb-3 flex items-center gap-2">
                    <span className="text-blue-400">API</span>
                    Quick Test
                  </h4>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    <li>- Start the server with <code className="text-zinc-300">npm run dev</code></li>
                    <li>- POST to <code className="text-zinc-300">/api/injest</code> or <code className="text-zinc-300">/api/ingest</code></li>
                    <li>- Provide <code className="text-zinc-300">filePath</code> and file content/base64 payload</li>
                    <li>- Verify ingestion by calling <code className="text-zinc-300">/api/knowledge</code></li>
                    <li>- Ask questions in chat to validate retrieval grounding</li>
                  </ul>
                </div>
              </div>
              <div className="bg-zinc-900/80 rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5">
                  <span className="text-xs font-mono text-zinc-500">Example: Ingest via API</span>
                </div>
                <div className="p-6 font-mono text-xs space-y-3 text-zinc-300 overflow-x-auto">
                  <p className="text-blue-400">curl -X POST http://localhost:4000/api/injest \</p>
                  <p className="text-blue-400">  -H &quot;Content-Type: application/json&quot; \</p>
                  <p className="text-blue-400">  -d &#123;</p>
                  <p className="ml-4 text-blue-400">&quot;filePath&quot;: &quot;knowledge/example.md&quot;,</p>
                  <p className="ml-4 text-blue-400">&quot;content&quot;: &quot;# Sample\\nVectorOps ingestion test.&quot;</p>
                  <p className="text-blue-400">  &#125;</p>
                </div>
              </div>
            </div>
          </section>

          <section id="concepts" className="scroll-mt-32">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-8 bg-purple-500 rounded-full" />
              <h2 className="text-3xl font-bold text-white">Core Concepts</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                <h4 className="text-zinc-100 font-semibold mb-2">Hybrid Retrieval</h4>
                <p className="text-sm text-zinc-400">Combines semantic search from ChromaDB with lexical ranking from MiniSearch for stronger relevance.</p>
              </div>
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                <h4 className="text-zinc-100 font-semibold mb-2">Model Reliability</h4>
                <p className="text-sm text-zinc-400">Gemini handles primary generation while OpenAI fallback recovers from failures, empty outputs, and rate limits.</p>
              </div>
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                <h4 className="text-zinc-100 font-semibold mb-2">Grounded Answers</h4>
                <p className="text-sm text-zinc-400">Responses are built from retrieved chunks and include citations so users can trace output back to sources.</p>
              </div>
            </div>
          </section>

          <section className="text-center py-20 bg-linear-to-b from-transparent to-zinc-900/50 rounded-3xl">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to expand your mind?</h2>
            <p className="text-zinc-400 mb-10 max-w-xl mx-auto">
              Start by adding your first document to the knowledge base and see the magic happen in the chat interface.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/chat">
                <Button size="lg" className="px-10 rounded-2xl group">
                  Start Chatting
                  <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="https://github.com/saurabhtripathi7/VectorOps" target="_blank" rel="noreferrer">
                <Button variant="secondary" size="lg" className="px-10 rounded-2xl">
                  GitHub
                </Button>
              </a>
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-20 border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="VectorOps" className="w-6 h-6" />
            <span className="font-semibold text-zinc-100">VectorOps</span>
          </div>
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} VectorOps. Built with care for the community by <a href="https://linkedin.com/in/saurabhtripathicr7" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Saurabh Tripathi</a>.
          </p>
        </div>
      </footer>
    </div>
  );
}
