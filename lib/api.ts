const BASE = '/api/backend'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export interface IndexedSource {
  id: string
  name: string
  type: 'pdf' | 'url' | 'video'
  status: 'indexing' | 'ready' | 'error'
  chunks?: number
  addedAt: Date
}

export async function sendChat(message: string, threadId = 'default'): Promise<string> {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, thread_id: threadId }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Chat failed: ${err}`)
  }
  const data = await res.json()
  return data.response
}

export async function uploadPDFs(files: File[]): Promise<Record<string, string>> {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  const res = await fetch(`${BASE}/index/pdfs`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('PDF upload failed')
  const data = await res.json()
  return data.summary ?? {}
}

export async function indexURL(url: string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${BASE}/index/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) throw new Error('URL indexing failed')
  return res.json()
}

export async function uploadVideo(file: File): Promise<{ filename: string; status: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/index/video`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('Video upload failed')
  return res.json()
}
