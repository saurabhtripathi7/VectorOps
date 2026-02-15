# VectorOps MERN

Monorepo migration of VectorOps to React (Vite) + Express + MongoDB with the same RAG functionality.

## Structure

- client: Vite + React UI
- server: Express API (chat, sessions, ingest, knowledge)
- docs: Project documentation
- knowledge: Sample knowledge files

## Quick Start

1) Install dependencies

```
npm install
```

2) Configure environment

- Copy server/.env.example to server/.env and fill in keys.
- Optional: client/.env.example to client/.env to set VITE_API_BASE_URL.

3) Run dev servers

```
npm run dev
```

Client runs on http://localhost:5173
Server runs on http://localhost:4000

## Notes

- Client uses Vite proxy for /api to the server in dev.
- Server exposes the same endpoints as the original Next.js app.
