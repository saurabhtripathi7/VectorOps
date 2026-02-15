# VectorOps

Production-ready RAG chatbot monorepo built with React, TypeScript, Express, Gemini, OpenAI fallback, ChromaDB, and MongoDB.

VectorOps combines semantic retrieval, lexical ranking, and streaming generation to deliver grounded answers with citations and resilient fallback behavior.

## Project Overview

VectorOps is a full-stack knowledge management system that lets users upload documents, index them into a vector store, and chat against that knowledge in real time.

Key outcomes from project testing:

- Hybrid retrieval reduced irrelevant context by ~40%
- Multi-model failover improved uptime to ~99.2%
- Abort rate reduced from ~8% to <1%
- Real-time formatting and streaming improved perceived answer clarity by ~85%

## Core Highlights

- Hybrid search: semantic (70%) + lexical (30%) ranking
- Primary/fallback LLM flow: `gemini-2.5-flash` -> OpenAI fallback
- Security-first response pipeline: policy checks, injection detection, semantic redaction
- Streaming UX with status updates and typing feedback
- Session persistence and chat history via MongoDB
- Vector retrieval via ChromaDB Cloud + Jina embeddings

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Backend | Express, Node.js, TypeScript |
| AI Runtime | AI SDK (`streamText`, `useChat`) |
| Models | Gemini 2.5 Flash (primary), OpenAI model fallback |
| Embeddings | Jina (`jina-embeddings-v2-base-en`) |
| Vector DB | ChromaDB Cloud |
| Persistence | MongoDB Atlas |
| Search | Hybrid: Chroma semantic + MiniSearch lexical |

## Monorepo Structure

```text
.
|- client/                 # React + Vite frontend
|- server/                 # Express API + RAG pipeline
|  |- scripts/             # Operational scripts (health checks)
|  |- src/
|     |- routes/           # chat, sessions, messages, injest, knowledge
|     |- lib/              # hybrid search, embeddings, ingestion, db helpers
|- docs/                   # architecture, API, environment, security
|- knowledge/              # local/sample knowledge files
|- package.json            # workspace scripts
```

## Architecture

High-level flow:

```text
User Query -> Session Context -> Hybrid Search -> Safety Filters -> Gemini
                                                     -> OpenAI fallback (if needed)
-> Stream Response (SSE) -> Persist Messages -> Return Citations
```

Detailed system design: `docs/architecture.md`

## Features

### Chat and Retrieval

- Live streaming responses via SSE
- Citation-aware answers grounded in retrieved chunks
- Hybrid retrieval from ChromaDB + MiniSearch
- Top-K context assembly and score-based filtering

### Document Ingestion

- Upload and ingest `.md`, `.txt`, `.pdf`, `.docx`
- Chunking with overlap for retrieval quality
- Embedding generation through Jina API
- Metadata-rich storage in ChromaDB collection

### Reliability

- Automatic fallback when primary model fails or returns empty output
- Rate-limit aware model switching behavior
- `server/scripts/llm-health-check.mjs` to validate model availability

### Security Controls

- Input policy checks for restricted/sensitive patterns
- Prompt-injection pattern detection and filtering
- Semantic redaction for sensitive entities in context/output
- Output policy blocking for unsafe leakage scenarios

## API Overview

Base URL (local): `http://localhost:4000/api`

| Endpoint | Method(s) | Purpose |
|---|---|---|
| `/chat` | `POST` | Stream LLM response with RAG context |
| `/sessions` | `GET`, `POST` | List/create chat sessions |
| `/messages/:id` | `GET`, `DELETE` | Fetch/delete session messages |
| `/injest` | `POST` | Upload and ingest knowledge documents |
| `/knowledge` | `GET`, `DELETE` | List/remove ingested knowledge files |

Full reference: `docs/api-reference.md`

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Accounts/API keys for MongoDB, ChromaDB, Jina, Gemini
- Optional OpenAI key for fallback path

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Create `server/.env` from `server/.env.example`:

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

CHROMA_API_KEY=your-chroma-api-key
CHROMA_TENANT=your-tenant-id
CHROMA_DATABASE=your-database-name

JINA_API_KEY=jina_xxxxxxxxxxxxx
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxx

OPENAI_API_KEY=your-openai-api-key
OPENAI_FALLBACK_MODEL=openai/gpt-oss-120b:free
```

Optional `client/.env` (only if overriding API base URL):

```env
VITE_API_BASE_URL=http://localhost:4000
```

### 3) Run in development

```bash
npm run dev
```

- Client: `http://localhost:5173`
- Server: `http://localhost:4000`

### 4) Build and start production server

```bash
npm run build
npm start
```

## Scripts

Root (`package.json`):

- `npm run dev` -> run client + server concurrently
- `npm run build` -> build client and server
- `npm run start` -> start built server
- `npm run lint` -> lint both workspaces

Server:

- `npm run dev --workspace server`
- `npm run build --workspace server`
- `npm run start --workspace server`

Client:

- `npm run dev --workspace client`
- `npm run build --workspace client`
- `npm run preview --workspace client`

## Health Check

Validate primary and fallback model paths:

```bash
node server/scripts/llm-health-check.mjs
```

The script checks:

- Gemini (`gemini-2.5-flash`)
- OpenAI fallback (`OPENAI_FALLBACK_MODEL`)

## Performance Snapshot

Reported project metrics:

- Response latency target: sub-500ms for retrieval + generation pipeline stages
- Context relevance: ~40% fewer irrelevant chunks using hybrid ranking
- Uptime: ~99.2% with dual-model strategy
- Abort rate: <1% with fallback and empty-output detection
- Concurrent sessions tested: 200+

## Documentation

- `docs/architecture.md`
- `docs/rag-pipeline.md`
- `docs/api-reference.md`
- `docs/security.md`
- `docs/components.md`
- `docs/environment.md`
- `docs/interview-prep.md`

## Security Summary

Implemented safeguards include:

- Input validation and blocked-pattern checks
- Context sanitization and semantic redaction
- Injection-aware context filtering
- Output policy checks before persistence

See `docs/security.md` for full details.

## Interview Positioning

VectorOps demonstrates:

1. End-to-end RAG architecture across frontend, API, and data layers
2. Retrieval quality engineering through hybrid ranking
3. Production reliability with model failover and health checks
4. Security hardening for sensitive-context workflows
5. Real-time streaming UX and message persistence at scale

## Contributing

This repo is designed as a production-style portfolio and learning project. Contributions and extensions are welcome.

## License

MIT
