const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
const REQUEST_TIMEOUT_MS = 10 * 60 * 1000

async function fetchWithTimeout(path: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(`${BASE}${path}`, {
      ...init,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out after 10 minutes')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

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

export interface PDFIndexResponse {
  status: 'indexing' | 'success' | 'partial_success' | 'error'
  message: string
  summary?: Record<string, string>
  job_id?: string
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function sendChat(message: string, threadId = 'default'): Promise<string> {
  const res = await fetchWithTimeout('/chat', {
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

export async function uploadPDFs(files: File[]): Promise<PDFIndexResponse> {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  const res = await fetchWithTimeout('/index/pdfs', { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PDF upload failed: ${err}`)
  }
  return res.json()
}

export async function getPDFIndexJob(jobId: string): Promise<PDFIndexResponse> {
  const res = await fetchWithTimeout(`/index/pdfs/${jobId}`, { method: 'GET' })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PDF indexing status failed: ${err}`)
  }
  return res.json()
}

export async function waitForPDFIndexJob(jobId: string): Promise<PDFIndexResponse> {
  const startedAt = Date.now()
  const timeoutMs = 30 * 60 * 1000

  while (Date.now() - startedAt < timeoutMs) {
    const data = await getPDFIndexJob(jobId)
    if (data.status !== 'indexing') return data
    await delay(2000)
  }

  throw new Error('PDF indexing is still running after 30 minutes')
}

export async function uploadAndWaitForPDFs(files: File[]): Promise<PDFIndexResponse> {
  const data = await uploadPDFs(files)
  if (data.status === 'indexing' && data.job_id) {
    return waitForPDFIndexJob(data.job_id)
  }

  if (data.status === 'indexing') {
    throw new Error('PDF indexing started, but the backend did not return a job id')
  }

  return data
}

export async function indexURL(url: string): Promise<{ status: string; message: string }> {
  const res = await fetchWithTimeout('/index/url', {
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
  const res = await fetchWithTimeout('/index/video', { method: 'POST', body: form })
  if (!res.ok) throw new Error('Video upload failed')
  return res.json()
}
