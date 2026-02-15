# Environment Setup

Complete guide to configure VectorOps for local development and production deployment.

---

## Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **npm** | 9+ | Package manager |
| **Git** | Any | Version control |

**Installation:**
```bash
# Check versions
node --version  # v20.x.x or higher
npm --version   # 10.x.x or higher

# Install if needed
# Visit: https://nodejs.org/
```

---

## Environment Variables

### Required Services

VectorOps requires API keys from 4 external services:

1. **MongoDB Atlas** (Chat history)
2. **ChromaDB Cloud** (Vector storage)
3. **Jina AI** (Embeddings)
4. **Google AI Studio** (Gemini LLM)

---

### 1. MongoDB Setup

**Purpose:** Store chat sessions and message history.

**Steps:**
1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free M0 cluster (512MB, forever free)
3. Create database user
4. Whitelist your IP (or use `0.0.0.0/0` for all IPs)
5. Get connection string

**Connection String Format:**
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
```

**Environment Variable:**
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
```

**Collections Created Automatically:**
- `vectorops.sessions`
- `vectorops.messages`

---

### 2. ChromaDB Cloud Setup

**Purpose:** Vector database for semantic search.

**Steps:**
1. Visit [ChromaDB Cloud](https://www.trychroma.com/)
2. Sign up for free account
3. Create a database
4. Get API credentials:
   - **API Key**
   - **Tenant ID**
   - **Database Name**

**Environment Variables:**
```env
CHROMA_API_KEY=your-api-key-here
CHROMA_TENANT=your-tenant-id
CHROMA_DATABASE=your-database-name
```

**Default Collection:**
- Name: `vectorops` (created automatically)
- Embedding: 768 dimensions (Jina)
- Distance: Cosine similarity

---

### 3. Jina AI Setup

**Purpose:** Generate text embeddings for semantic search.

**Steps:**
1. Visit [Jina AI](https://jina.ai/)
2. Sign up for free account
3. Navigate to API keys
4. Create new API key

**Environment Variable:**
```env
JINA_API_KEY=jina_xxx
```

**Model Used:**
- `jina-embeddings-v2-base-en`
- 768 dimensions
- Optimized for English text

**Rate Limits (Free Tier):**
- 1M tokens/month
- ~1000 documents/month (at 1000 chars each)

---

### 4. Google AI Studio Setup

**Purpose:** LLM for chat generation (Gemini 2.5-flash).

**Steps:**
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with Google account
3. Create API key
4. Copy key

**Environment Variable:**
```env
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyXxx
```

**Model Used:**
- `gemini-2.5-flash`
- Fast, cost-effective
- 1M token context window

**Rate Limits (Free Tier):**
- 20 requests/minute
- 1500 requests/day

---

## Complete `server/.env` File

Create this file in the server directory:

```env
# MongoDB (Chat Storage)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

# ChromaDB Cloud (Vector Storage)
CHROMA_API_KEY=your-chroma-api-key
CHROMA_TENANT=your-tenant-id
CHROMA_DATABASE=your-database-name

# Jina AI (Embeddings)
JINA_API_KEY=jina_xxxxxxxxxxxxx

# Google Gemini (LLM)
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxx

# Optional: Node Environment
NODE_ENV=development

# Server Port
PORT=4000

# CORS for client
CORS_ORIGIN=http://localhost:5173
```

**⚠️ Security Notes:**
- Never commit `.env` to Git
- Already in `.gitignore` by default
- Use different keys for dev/prod

## Client Environment

Create `client/.env` only if you need to override the API base URL:

```env
VITE_API_BASE_URL=http://localhost:4000
```

---

## Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/vectorops.git
cd vectorops-mern
```

### 2. Install Dependencies

```bash
npm install
```

**Key Dependencies Installed:**
- `react` (19.2.1) - UI library
- `vite` (5.x) - Frontend dev server
- `express` (4.x) - API server
- `chromadb` (3.1.6) - Vector DB client
- `@ai-sdk/google` (2.0.44) - Gemini integration
- `mongodb` (7.0.0) - Database driver
- `@langchain/textsplitters` (1.0.1) - Text splitting
- `minisearch` (7.2.0) - Lexical search
- `framer-motion` (12.23.26) - Animations

### 3. Verify Installation

```bash
# Check for errors
npm list --depth=0

# Expected output:
# vectorops-mern@0.1.0
# ├── vectorops-client@0.1.0
# ├── vectorops-server@0.1.0
# ...
```

---

## Running Locally

### Development Server

```bash
npm run dev
```

**Expected output:**
```
[server] listening on http://localhost:4000
VITE v5.x ready in ... ms
```

**Access:**
- Client: `http://localhost:5173`
- Server: `http://localhost:4000`

### Production Build

```bash
npm run build
npm start
```

**Build output:**
```
client: dist/ (static assets)
server: dist/ (compiled API)
```

---

## Testing Configuration

### 1. Test MongoDB Connection

```bash
# Create test script: scripts/test-mongo.js
const { MongoClient } = require('mongodb');

async function test() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  console.log('✅ MongoDB connected');
  await client.close();
}

test();
```

```bash
node scripts/test-mongo.js
```

### 2. Test ChromaDB Connection

```bash
# scripts/test-chroma.js
const { CloudClient } = require('chromadb');

const client = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY,
  tenant: process.env.CHROMA_TENANT,
  database: process.env.CHROMA_DATABASE
});

client.heartbeat()
  .then(() => console.log('✅ ChromaDB connected'))
  .catch(err => console.error('❌', err));
```

```bash
node scripts/test-chroma.js
```

### 3. Test Jina API

```bash
curl -X POST https://api.jina.ai/v1/embeddings \
  -H "Authorization: Bearer $JINA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": ["test"], "model": "jina-embeddings-v2-base-en"}'
```

**Expected response:**
```json
{
  "model": "jina-embeddings-v2-base-en",
  "object": "list",
  "usage": { "total_tokens": 5, "prompt_tokens": 5 },
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [0.123, -0.456, ...]  // 768 numbers
    }
  ]
}
```

### 4. Test Gemini API

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$GOOGLE_GENERATIVE_AI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Say hello"}]}]}'
```

---

## Common Issues

### Issue: `Module not found: chromadb`

**Solution:**
```bash
npm install chromadb@3.1.6
```

### Issue: `MONGODB_URI is not defined`

**Solution:**
1. Verify `server/.env` exists
2. Check file name is exactly `.env` (not `.env.txt`)
3. Restart dev server after creating file

### Issue: `ChromaDB connection timeout`

**Causes:**
- Wrong API key
- Wrong tenant/database
- Network firewall

**Solution:**
```bash
# Test connection manually
curl https://api.trychroma.com/api/v1/heartbeat \
  -H "Authorization: Bearer $CHROMA_API_KEY"
```

### Issue: `Rate limit exceeded` (Gemini)

**Solution:**
- Wait 60 seconds
- Or upgrade to paid tier
- Or reduce chat frequency

---

## Production Deployment

### Hosting Notes

**Steps:**
Deploy the client and server separately or behind a reverse proxy:

- Client: static hosting (Netlify, Vercel static, S3)
- Server: Node hosting (Render, Railway, VPS)

Ensure server environment variables are set in the hosting provider.
- ✅ Server-side only (not exposed to client)

### Railway / Render

**Similar process:**
1. Connect GitHub repo
2. Set environment variables in dashboard
3. Deploy

---

## Optional: ngrok for HTTPS (Local Testing)

**Purpose:** Test features requiring HTTPS (like Web Speech API).

**Steps:**
```bash
# Install ngrok
npm install -g ngrok

# Run dev server
npm run dev

# In another terminal, expose port 3000
ngrok http 3000
```

**Output:**
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

Now access via `https://abc123.ngrok.io` for HTTPS.

---

## Development Workflow

### 1. Start Dev Server
```bash
npm run dev
```

### 2. Make Changes
- Edit files in `app/`, `lib/`, `components/`
- Hot reload automatically updates browser

### 3. Test Locally
- Chat: `http://localhost:3000/chat`
- Upload: Click "Knowledge Base" in sidebar
- Delete: Hover over chat session → trash icon

### 4. Check Logs
- Server logs in terminal
- Look for `[chat]`, `[hybridSearch]`, `[embeddings]` prefixes

### 5. Commit Changes
```bash
git add .
git commit -m "Add feature X"
git push
```

---

## IDE Setup (VS Code)

### Recommended Extensions

**Install:**
```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
```

### Settings (`.vscode/settings.json`)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

---

## Monitoring & Debugging

### Server Logs

**Pattern:**
```typescript
console.log('[namespace] message:', data);
```

**Namespaces:**
- `[chat]` - Chat endpoint
- `[hybridSearch]` - Search operations
- `[embeddings]` - Jina API calls
- `[chroma]` - ChromaDB operations
- `[db]` - MongoDB operations

### Chrome DevTools

**Network Tab:**
- Filter: `chat` to see streaming requests
- Check headers, payload, response

**Console Tab:**
- Check for client-side errors
- React warnings

---

## Performance Monitoring

### Add Timing Logs

```typescript
const startTime = Date.now();

// ... operation ...

console.log('[operation] completed:', {
  duration: Date.now() - startTime,
  // other metrics
});
```

### Expected Timings

| Operation | Target |
|-----------|--------|
| Page load | < 1s |
| Hybrid search | < 8s |
| LLM generation | 2-5s |
| File upload | < 3s |

---

## Backup & Recovery

### Backup MongoDB

```bash
# Export all data
mongodump --uri="$MONGODB_URI" --out=./backup

# Restore
mongorestore --uri="$MONGODB_URI" ./backup
```

### Backup ChromaDB

**Note:** ChromaDB Cloud handles backups automatically.

**Manual export:**
```typescript
const collection = await getOrCreateCollection('vectorops');
const data = await collection.get({ include: ['metadatas', 'documents', 'embeddings'] });

fs.writeFileSync('backup.json', JSON.stringify(data));
```

---

## Troubleshooting Checklist

- [ ] `.env.local` exists in root directory
- [ ] All 5 environment variables are set
- [ ] MongoDB URI is valid and cluster is running
- [ ] ChromaDB API key is correct
- [ ] Jina API key is valid
- [ ] Gemini API key is valid and not rate limited
- [ ] Node version is 18+
- [ ] Dependencies are installed (`node_modules` exists)
- [ ] Port 3000 is not in use by another process
- [ ] Firewall allows outbound HTTPS connections

---

**See also:**
- [Architecture](./architecture.md) for system overview
- [API Reference](./api-reference.md) for endpoint testing
