# API Reference

Complete documentation for all VectorOps API endpoints.

---

## Base URL

```
Development: http://localhost:4000/api
Production: https://your-domain.com/api
```

---

## Endpoints Overview

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/chat` | POST | Stream AI responses with RAG |
| `/api/sessions` | GET, POST | List and create chat sessions |
| `/api/messages/:id` | GET, DELETE | Get history or delete session |
| `/api/injest` | POST | Upload and chunk documents |
| `/api/knowledge` | GET, DELETE | List and remove knowledge files |

---

## 1. Chat Endpoint

### `POST /api/chat`

**Purpose:** Stream AI responses using RAG (Retrieval-Augmented Generation).

**Query Parameters:**
```typescript
sessionId: string (required)
```

**Request Body:**
```typescript
{
  messages: Array<{
    role: "user" | "assistant",
    parts: Array<{ type: "text"; text: string }>,
    metadata?: { sessionId?: string }
  }>,
  sessionId: string
}
```

**Response:**
- **Content-Type:** `text/event-stream` (Server-Sent Events)
- **Stream format:**
```
data: {"type":"text-delta","textDelta":"Hello"}
data: {"type":"text-delta","textDelta":" world"}
data: {"type":"finish","finishReason":"stop"}
data: [DONE]
```

**Example:**
```typescript
// Using AI SDK's useChat hook
const { messages, sendMessage } = useChat({
  api: `/api/chat?sessionId=${sessionId}`,
  body: { sessionId }
});

await sendMessage({ text: "What is machine learning?" });
```

**Internal Flow:**
1. Extract user's last message
2. Run `hybridSearch(query)` to get top 5 relevant chunks
3. Build context string with retrieved chunks
4. Call `streamText()` with Gemini 2.5-flash
5. Stream response chunks to client
6. Save both user message and AI response to MongoDB

**Logging:**
```typescript
[chat] request started: { sessionId, query }
[hybridSearch] start: { query, topK: 5 }
[hybridSearch] completed: { duration: 7234ms, results: 5 }
[chat] model started: { contextLength: 4360 }
[chat] model finish: { duration: 2345ms, finishReason: "stop" }
```

**Error Handling:**
- **Quota exceeded:** Returns error event with quota message
- **Network failure:** Retries 3 times with exponential backoff
- **Invalid session:** Returns 400 Bad Request

---

## 2. Sessions Endpoint

### `GET /api/sessions`

**Purpose:** List all chat sessions sorted by most recent.

**Response:**
```typescript
Array<{
  _id: string,
  title: string,
  createdAt: string (ISO 8601),
  updatedAt: string (ISO 8601)
}>
```

**Example Response:**
```json
[
  {
    "_id": "698b9b277b4108f859848416",
    "title": "What is AI?",
    "createdAt": "2026-02-11T10:30:00.000Z",
    "updatedAt": "2026-02-11T10:35:00.000Z"
  },
  {
    "_id": "698b9b277b4108f859848417",
    "title": "Explain neural networks...",
    "createdAt": "2026-02-10T15:20:00.000Z",
    "updatedAt": "2026-02-10T15:45:00.000Z"
  }
]
```

**Usage:**
```typescript
const res = await fetch('/api/sessions');
const sessions = await res.json();
```

---

### `POST /api/sessions`

**Purpose:** Create a new chat session.

**Request Body:**
```typescript
{
  firstMessage: string (optional)
}
```

**Response:**
```typescript
{
  sessionId: string
}
```

**Example:**
```typescript
const res = await fetch('/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ firstMessage: 'Hello' })
});

const { sessionId } = await res.json();
// sessionId: "698b9b277b4108f859848418"
```

**Internal Logic:**
1. Extract `firstMessage` from body
2. Generate title (truncate to 30 chars if needed)
3. Insert into MongoDB `sessions` collection
4. Return `sessionId`

**Title Generation:**
- If `firstMessage` provided: Use first 30 chars + "..."
- If not provided: Use "New Chat"

---

## 3. Messages Endpoint

### `GET /api/messages/:id`

**Purpose:** Fetch message history for a specific session.

**Path Parameters:**
```typescript
id: string (session ID)
```

**Response:**
```typescript
Array<{
  _id: string,
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  citations?: Array<{
    filePath: string,
    chunkIndex: number
  }>,
  createdAt: string (ISO 8601)
}>
```

**Example:**
```typescript
const res = await fetch('/api/messages/698b9b277b4108f859848416');
const messages = await res.json();

// Returns:
[
  {
    "_id": "698b...",
    "sessionId": "698b9b277b4108f859848416",
    "role": "user",
    "content": "What is AI?",
    "createdAt": "2026-02-11T10:30:00.000Z"
  },
  {
    "_id": "698c...",
    "sessionId": "698b9b277b4108f859848416",
    "role": "assistant",
    "content": "AI stands for Artificial Intelligence...",
    "createdAt": "2026-02-11T10:30:15.000Z"
  }
]
```

**Usage in Chat UI:**
```typescript
useEffect(() => {
  async function fetchHistory() {
    const res = await fetch(`/api/messages/${id}`);
    const data = await res.json();
    
    const mappedMessages = data.map(m => ({
      id: m._id,
      role: m.role,
      parts: [{ type: "text", text: m.content }]
    }));
    
    setMessages(mappedMessages);
  }
  fetchHistory();
}, [id]);
```

---

### `DELETE /api/messages/:id`

**Purpose:** Delete a chat session and all its messages.

**Path Parameters:**
```typescript
id: string (session ID)
```

**Response:**
```typescript
{
  success: boolean
}
```

**Example:**
```typescript
const res = await fetch('/api/messages/698b9b277b4108f859848416', {
  method: 'DELETE'
});

const { success } = await res.json();
// success: true
```

**Internal Logic:**
1. Delete all messages with `sessionId` from `messages` collection
2. Delete session document from `sessions` collection
3. Return success status

**Note:** This does NOT delete knowledge base chunks (use `/api/knowledge` for that).

---

## 4. Ingestion Endpoint

### `POST /api/injest`

**Purpose:** Upload and process documents into the knowledge base.

**Request Body:**
```typescript
{
  filePath: string,           // e.g., "knowledge/ai-guide.md"
  content?: string,           // Raw text content
  contentBase64?: string      // Base64-encoded content (for binary files)
}
```

**Response:**
```typescript
{
  status: "ingested",
  filePath: string,
  chunks: number              // Number of chunks created
}
```

**Example (Text Content):**
```typescript
const res = await fetch('/api/injest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filePath: 'knowledge/ml-basics.md',
    content: '# Machine Learning\n\nML is a subset of AI...'
  })
});

const result = await res.json();
// { status: "ingested", filePath: "knowledge/ml-basics.md", chunks: 5 }
```

**Example (Base64 for Binary Files):**
```typescript
// Frontend file upload
const file = e.target.files[0];
const reader = new FileReader();

reader.onload = async () => {
  const base64 = reader.result.split(',')[1];
  
  const res = await fetch('/api/injest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filePath: `knowledge/${file.name}`,
      contentBase64: base64
    })
  });
  
  const result = await res.json();
};

reader.readAsDataURL(file);
```

**Internal Flow:**
1. Decode base64 if provided, or use raw content
2. Call `chunkAndIngest(content, filePath)`
3. Use `RecursiveCharacterTextSplitter`:
   - Chunk size: 1000 characters
   - Overlap: 200 characters
4. Generate embeddings via Jina API
5. Store in ChromaDB with metadata:
   ```typescript
   {
     filePath: "knowledge/ml-basics.md",
     chunkIndex: 0,
     text: "# Machine Learning\n\nML is..."
   }
   ```

**Supported File Types:**
- `.md` (Markdown)
- `.txt` (Plain text)
- `.pdf` (PDF documents) - requires pdf-parse
- `.docx` (Word documents) - requires mammoth

**Error Responses:**
- `400`: Missing filePath
- `500`: Chunking or embedding failure

---

## 5. Knowledge Endpoint

### `GET /api/knowledge`

**Purpose:** List all unique file paths in the knowledge base.

**Response:**
```typescript
Array<{
  filePath: string,
  fileName: string
}>
```

**Example:**
```typescript
const res = await fetch('/api/knowledge');
const files = await res.json();

// Returns:
[
  {
    filePath: "knowledge/ai-in-general.md",
    fileName: "ai-in-general.md"
  },
  {
    filePath: "knowledge/crypto-case.docx",
    fileName: "crypto-case.docx"
  }
]
```

**Internal Logic:**
1. Query ChromaDB collection for all documents
2. Extract unique `filePath` values from metadata
3. Map to `{ filePath, fileName }` objects

---

### `DELETE /api/knowledge`

**Purpose:** Remove all chunks associated with a specific file.

**Request Body:**
```typescript
{
  filePath: string
}
```

**Response:**
```typescript
{
  status: "deleted",
  filePath: string,
  chunksDeleted: number
}
```

**Example:**
```typescript
const res = await fetch('/api/knowledge', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filePath: 'knowledge/ai-in-general.md'
  })
});

const result = await res.json();
// { status: "deleted", filePath: "...", chunksDeleted: 12 }
```

**Internal Logic:**
1. Query ChromaDB for all chunks with matching `filePath`
2. Get all chunk IDs
3. Delete all chunks by ID
4. Return count of deleted chunks

**Error Responses:**
- `400`: Missing filePath
- `404`: File not found in knowledge base
- `500`: ChromaDB deletion failure

---

## Authentication

**Current:** No authentication (all endpoints are public)

**Future:** Add auth middleware (JWT or session-based) in Express.

---

## Rate Limiting

**Current:** No rate limiting

**Recommended:**
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
});

export async function POST(req: Request) {
  const identifier = getClientIP(req);
  const { success } = await ratelimit.limit(identifier);
  
  if (!success) {
    return new Response("Rate limit exceeded", { status: 429 });
  }
  
  // ... rest of handler
}
```

---

## Testing

### Manual Testing

**Chat Endpoint:**
```bash
curl -N -X POST http://localhost:4000/api/chat?sessionId=test123 \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "parts": [{"type": "text", "text": "What is AI?"}]}],
    "sessionId": "test123"
  }'
```

**Ingestion:**
```bash
curl -X POST http://localhost:4000/api/injest \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "knowledge/test.md",
    "content": "This is a test document about AI."
  }'
```

**List Knowledge:**
```bash
curl http://localhost:4000/api/knowledge
```

---

## Common Issues

### Issue: "Collection not found"
**Solution:** Ensure ChromaDB connection is configured in `server/.env`

### Issue: "Quota exceeded"
**Solution:** Wait 60 seconds or upgrade Gemini API tier

### Issue: "Stream interrupted"
**Solution:** Check network connection and retry with exponential backoff

---

**See also:**
- [RAG Pipeline](./rag-pipeline.md) for chat endpoint internals
- [Architecture](./architecture.md) for system design
