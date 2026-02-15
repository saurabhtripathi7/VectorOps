# Component Guide

Complete reference for all VectorOps React components, their props, state, and interactions.

---

## Component Hierarchy

```
App
├── ToastProvider ──────────────── Global notification system
│   └── Routes
│       ├── / (Landing)
│       ├── /docs (Docs)
│       └── ChatLayout
│           ├── Sidebar ────────── Session management
│           │   └── UploadModal ── Knowledge management
│           └── Outlet
│               ├── /chat (Landing)
│               └── /chat/:id ──── Chat interface
│                   ├── ChatContent
│                   ├── MessageList
│                   ├── TypingIndicator
│                   └── InputForm
```

---

## Core Components

### 1. `App` (client/src/App.tsx)

**Purpose:** Root wrapper for entire application.

**Structure:**
```typescript
export default function App() {
  return (
    <ToastProvider>
      <Routes>
        {/* route tree */}
      </Routes>
    </ToastProvider>
  );
}
```

**Key Features:**
- Wraps routes with `ToastProvider` for global notifications
- Uses React Router for page routing

---

### 2. `ToastProvider` (client/src/components/ToastProvider.tsx)

**Purpose:** Global notification system using React Context.

**API:**
```typescript
const { showToast } = useToast();

showToast({
  type: "success" | "error" | "warning",
  title: string,
  message?: string,
  duration?: number  // Default: 5000ms
});
```

**Implementation:**
```typescript
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { ...options, id, onClose: removeToast }]);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}
```

**Usage Example:**
```typescript
// In any component
const { showToast } = useToast();

try {
  await uploadFile();
  showToast({
    type: "success",
    title: "Upload successful",
    message: "File has been added to your knowledge base"
  });
} catch (error) {
  showToast({
    type: "error",
    title: "Upload failed",
    message: error.message
  });
}
```

---

### 3. `Toast` (client/src/components/ui/Toast.tsx)

**Purpose:** Individual notification component with animations.

**Props:**
```typescript
interface ToastProps {
  id: string;
  type: "success" | "error" | "warning";
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}
```

**Features:**
- **Auto-dismiss** after duration (default 5s)
- **Manual close** button
- **Color-coded** by type (green/red/yellow)
- **Animated** entry/exit (Framer Motion)
- **Stacked** in top-right corner (z-index: 9999)

**Styling:**
```typescript
const styles = {
  success: "bg-green-500/10 border-green-500/20",
  error: "bg-red-500/10 border-red-500/20",
  warning: "bg-yellow-500/10 border-yellow-500/20"
};
```

---

### 4. `ChatSidebar` (client/src/components/Sidebar.tsx)

**Purpose:** Session list and navigation sidebar.

**State:**
```typescript
const [sessions, setSessions] = useState<Session[]>([]);
const [isCollapsed, setIsCollapsed] = useState(false);
const [showUploadModal, setShowUploadModal] = useState(false);
```

**Key Functions:**

**fetchSessions()**
```typescript
async function fetchSessions() {
  const res = await fetch('/api/sessions');
  const data = await res.json();
  setSessions(data);
}
```

**handleDeleteSession(id)**
```typescript
async function handleDeleteSession(e, id) {
  e.stopPropagation(); // Don't navigate when deleting
  if (!confirm("Delete this session?")) return;
  
  await fetch(`/api/messages/${id}`, { method: 'DELETE' });
  setSessions(prev => prev.filter(s => s._id !== id));
  
  showToast({
    type: "success",
    title: "Chat deleted"
  });
  
  window.dispatchEvent(new CustomEvent("chat-updated"));
}
```

**Real-time Updates:**
```typescript
useEffect(() => {
  fetchSessions();
  
  const handleUpdate = () => fetchSessions();
  window.addEventListener("chat-updated", handleUpdate);
  return () => window.removeEventListener("chat-updated", handleUpdate);
}, []);
```

**Features:**
- Collapsible (64px → 288px)
- Session deletion with confirmation
- Upload modal trigger
- Active session highlighting
- Auto-refresh on updates

---

### 5. `UploadModal` (client/src/components/UploadModal.tsx)

**Purpose:** Manage knowledge base (list, upload, delete files).

**Props:**
```typescript
interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**State:**
```typescript
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
const [uploading, setUploading] = useState(false);
const [deletingFile, setDeletingFile] = useState<string | null>(null);
```

**Key Functions:**

**handleUpload()**
```typescript
async function handleUpload() {
  const reader = new FileReader();
  
  reader.onload = async () => {
    const base64 = reader.result.split(',')[1];
    
    const res = await fetch('/api/injest', {
      method: 'POST',
      body: JSON.stringify({
        filePath: `knowledge/${selectedFile.name}`,
        contentBase64: base64
      })
    });
    
    if (res.ok) {
      showToast({ type: "success", title: "File uploaded" });
      fetchKnowledgeFiles(); // Refresh list
    }
  };
  
  reader.readAsDataURL(selectedFile);
}
```

**handleDelete(filePath)**
```typescript
async function handleDelete(filePath) {
  if (!confirm(`Delete ${filePath.split('/').pop()}?`)) return;
  
  await fetch('/api/knowledge', {
    method: 'DELETE',
    body: JSON.stringify({ filePath })
  });
  
  fetchKnowledgeFiles(); // Refresh list
}
```

**Features:**
- Drag & drop file upload
- File type validation (.md, .txt, .pdf, .docx)
- Real-time knowledge base list
- Delete with confirmation
- Base64 encoding for file upload
- Toast notifications for all operations

---

### 6. `ChatContent` (client/src/pages/ChatSessionPage.tsx)

**Purpose:** Main chat interface with streaming responses.

**Key Hook:**
```typescript
const { messages, setMessages, sendMessage, status, error } = useChat({
  api: `/api/chat?sessionId=${id}`,
  body: { sessionId: id },
  onError: (error: Error) => {
    // Handle quota exceeded, network failures, etc.
    if (error.message.includes("quota")) {
      showToast({
        type: "error",
        title: "API Quota Exceeded",
        message: "Wait a minute or check billing settings."
      });
    }
  }
});
```

**State:**
```typescript
const [input, setInput] = useState("");
const [historyLoaded, setHistoryLoaded] = useState(false);
const [hasHistory, setHasHistory] = useState(false);
```

**Message History Loading:**
```typescript
useEffect(() => {
  async function fetchHistory() {
    const res = await fetch(`/api/messages/${id}`);
    const data = await res.json();
    
    if (data.length > 0) {
      setHasHistory(true);
      const mapped = data.map(m => ({
        id: m._id,
        role: m.role,
        parts: [{ type: "text", text: m.content }]
      }));
      setMessages(mapped);
    }
    
    setHistoryLoaded(true);
  }
  
  fetchHistory();
}, [id]);
```

**Auto-send First Query:**
```typescript
const searchParams = useSearchParams();
const firstQuery = searchParams.get("q");
const sentRef = useRef(false);

useEffect(() => {
  // Only send if:
  // - History is loaded
  // - No existing history
  // - Query param exists
  // - Haven't sent yet
  if (historyLoaded && !hasHistory && firstQuery && !sentRef.current) {
    sentRef.current = true;
    sendMessage({ text: firstQuery, metadata: { sessionId: id } });
    router.replace(`/chat/${id}`); // Remove query param
  }
}, [historyLoaded, hasHistory, firstQuery]);
```

**Message Rendering:**
```typescript
<AnimatePresence>
  {messages.map((m) => (
    <motion.div
      key={m.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={m.role === "user" ? "flex-row-reverse" : "flex-row"}
    >
      {/* Avatar */}
      <div className={m.role === "user" ? "bg-blue-600" : "bg-zinc-800"}>
        {m.role === "user" ? <User /> : <Bot />}
      </div>
      
      {/* Message Content */}
      <div>
        <Markdown>{m.parts[0].text}</Markdown>
      </div>
    </motion.div>
  ))}
</AnimatePresence>
```

**Features:**
- Streaming responses with loading indicator
- Markdown rendering with syntax highlighting
- YouTube link embedding
- Image rendering
- Auto-scroll to bottom
- Error handling with toasts
- Session deletion
- History restoration

---

### 7. `ChatPage` (client/src/pages/ChatLanding.tsx)

**Purpose:** Landing page to start new chat sessions.

**State:**
```typescript
const [input, setInput] = useState("");
const [loading, setLoading] = useState(false);
```

**Session Creation:**
```typescript
async function handleSubmit(e) {
  e.preventDefault();
  if (!input.trim()) return;
  
  setLoading(true);
  
  const res = await fetch('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ firstMessage: input })
  });
  
  const { sessionId } = await res.json();
  
  // Notify sidebar
  window.dispatchEvent(new CustomEvent("chat-updated"));
  
  // Navigate with query param (will auto-send)
  router.push(`/chat/${sessionId}?q=${encodeURIComponent(input)}`);
}
```

**Features:**
- Clean landing UI
- Single input field
- Creates session on submit
- Redirects to chat with auto-send

---

## UI Components

### Button (client/src/components/ui/Button.tsx)

**Variants:**
```typescript
const variants = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  ghost: "bg-transparent hover:bg-white/5 text-zinc-400",
  default: "bg-zinc-800 hover:bg-zinc-700 text-white"
};

const sizes = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3 text-sm",
  lg: "h-12 px-6 text-lg",
  icon: "h-10 w-10"
};
```

### Input (client/src/components/ui/Input.tsx)

**Features:**
- Consistent styling
- Focus states
- Disabled states
- Full Tailwind customization

### Card (client/src/components/ui/Card.tsx)

**Structure:**
```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

---

## Utility Components

### TypingIndicator (client/src/components/TypingIndicator.tsx)

**Purpose:** Animated dots while AI is thinking.

```typescript
export default function TypingIndicator() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2
          }}
          className="w-2 h-2 rounded-full bg-zinc-500"
        />
      ))}
    </div>
  );
}
```

---

## Component Communication Patterns

### 1. Custom Events (Cross-component)

**Emitter:**
```typescript
window.dispatchEvent(new CustomEvent("chat-updated"));
```

**Listener:**
```typescript
useEffect(() => {
  const handleUpdate = () => fetchSessions();
  window.addEventListener("chat-updated", handleUpdate);
  return () => window.removeEventListener("chat-updated", handleUpdate);
}, []);
```

**Use Cases:**
- Sidebar refresh after session creation
- Session list update after deletion

---

### 2. Context (Provider/Consumer)

**Provider:**
```typescript
// ToastProvider.tsx
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((options) => { /* ... */ }, []);
  
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}
```

**Consumer:**
```typescript
// Any component
const { showToast } = useToast();
showToast({ type: "success", title: "Done!" });
```

---

### 3. Props (Parent/Child)

**Parent:**
```typescript
<UploadModal 
  isOpen={showModal} 
  onClose={() => setShowModal(false)} 
/>
```

**Child:**
```typescript
interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  if (!isOpen) return null;
  return <div>...</div>;
}
```

---

## State Management Strategy

VectorOps uses **local component state** with:
- React `useState` for UI state
- `useEffect` for side effects
- Custom events for cross-component communication
- Context for global features (toasts)

**No Redux/Zustand needed** because:
- Limited global state (just toasts)
- Server state managed by AI SDK (`useChat`)
- Simple component tree

---

## Animation Strategy

### Framer Motion Patterns

**Page Transitions:**
```typescript
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

**List Items:**
```typescript
<AnimatePresence>
  {items.map(item => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      {item.content}
    </motion.div>
  ))}
</AnimatePresence>
```

---

## Best Practices

### 1. Component Organization
```typescript
// ✅ Good
function MyComponent() {
  // Hooks first
  const [state, setState] = useState();
  const { data } = useQuery();
  
  // Effects
  useEffect(() => { /* ... */ }, []);
  
  // Event handlers
  function handleClick() { /* ... */ }
  
  // Render
  return <div>...</div>;
}
```

### 2. Error Boundaries
```typescript
// Future: Add error boundary
<ErrorBoundary fallback={<ErrorUI />}>
  <ChatContent id={id} />
</ErrorBoundary>
```

### 3. Loading States
```typescript
if (!isMounted) return <LoadingSkeleton />;
if (loading) return <Spinner />;
return <Content />;
```

---

**See also:**
- [Architecture](./architecture.md) for system design
- [API Reference](./api-reference.md) for backend endpoints
