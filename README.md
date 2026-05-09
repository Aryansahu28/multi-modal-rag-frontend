# RAG Chat Frontend

A Next.js 14 chat UI for your Modular RAG backend.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Requirements

- Your FastAPI backend must be running on `http://localhost:8000`
- Next.js proxies `/api/backend/*` → `http://localhost:8000/*` automatically

## Features

- 💬 **Chat** with a single persistent thread
- 📄 **PDF upload** — drag & drop multiple PDFs
- 🔗 **URL indexing** — paste any webpage URL
- 🎬 **Video upload** — upload and query video content
- 📊 **Source tracking** — see all indexed sources with status
- ✨ **Markdown rendering** — AI responses rendered with full markdown
- 💡 **Suggestion chips** — quick-start prompts

## Project Structure

```
app/
  globals.css      # Design system + styles
  layout.tsx       # Root layout
  page.tsx         # Main chat page
components/
  UploadSidebar.tsx  # Left panel: upload + sources list
  ChatMessage.tsx    # Message bubbles (user + AI)
  ChatInput.tsx      # Textarea + send button
lib/
  api.ts           # All backend API calls
```

## Changing the Backend URL

Edit `next.config.js`:
```js
destination: 'http://YOUR_BACKEND_HOST:PORT/:path*'
```
