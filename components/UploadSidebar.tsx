'use client'

import { useState, useRef, useCallback } from 'react'
import {
  FileText, Link2, Video, Upload, X, CheckCircle2,
  AlertCircle, Loader2, ChevronRight, Cpu, Database
} from 'lucide-react'
import { uploadAndWaitForPDFs, indexURL, uploadVideo, IndexedSource } from '@/lib/api'

interface Props {
  sources: IndexedSource[]
  onSourceAdded: (source: IndexedSource) => void
  onSourceRemove: (id: string) => void
}

type Tab = 'pdf' | 'url' | 'video'

export default function UploadSidebar({ sources, onSourceAdded, onSourceRemove }: Props) {
  const [tab, setTab] = useState<Tab>('pdf')
  const [urlInput, setUrlInput] = useState('')
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  const addSource = (partial: Omit<IndexedSource, 'id' | 'addedAt'>) => {
    const src: IndexedSource = {
      ...partial,
      id: Math.random().toString(36).slice(2),
      addedAt: new Date(),
    }
    onSourceAdded(src)
    return src
  }

  const handlePDFUpload = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.name.endsWith('.pdf'))
    if (!arr.length) return
    setLoading(true); setError('')
    const pending = arr.map(f => addSource({ name: f.name, type: 'pdf', status: 'indexing' }))
    try {
      const { summary = {} } = await uploadAndWaitForPDFs(arr)
      pending.forEach((src, i) => {
        const msg = summary[arr[i].name] ?? ''
        const chunks = parseInt(msg.match(/\d+/)?.[0] ?? '0')
        onSourceAdded({ ...src, status: msg.includes('Error') ? 'error' : 'ready', chunks })
      })
    } catch (e: any) {
      setError(e.message)
      pending.forEach(src => onSourceAdded({ ...src, status: 'error' }))
    } finally { setLoading(false) }
  }

  const handleURLIndex = async () => {
    if (!urlInput.trim()) return
    setLoading(true); setError('')
    const src = addSource({ name: urlInput, type: 'url', status: 'indexing' })
    try {
      const res = await indexURL(urlInput.trim())
      onSourceAdded({ ...src, status: res.status === 'success' ? 'ready' : 'error' })
      setUrlInput('')
    } catch (e: any) {
      setError(e.message)
      onSourceAdded({ ...src, status: 'error' })
    } finally { setLoading(false) }
  }

  const handleVideoUpload = async (file: File) => {
    setLoading(true); setError('')
    const src = addSource({ name: file.name, type: 'video', status: 'indexing' })
    try {
      await uploadVideo(file)
      onSourceAdded({ ...src, status: 'ready' })
    } catch (e: any) {
      setError(e.message)
      onSourceAdded({ ...src, status: 'error' })
    } finally { setLoading(false) }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const files = e.dataTransfer.files
    if (tab === 'pdf') handlePDFUpload(files)
    else if (tab === 'video' && files[0]) handleVideoUpload(files[0])
  }, [tab])

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'pdf', label: 'PDF', icon: FileText },
    { key: 'url', label: 'URL', icon: Link2 },
    { key: 'video', label: 'Video', icon: Video },
  ]

  return (
    <aside className="sidebar w-72 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 mb-1">
          <Cpu size={14} className="text-[var(--accent)]" />
          <span className="text-xs font-mono text-[var(--accent)] tracking-widest uppercase">Knowledge Base</span>
        </div>
        <p className="text-xs text-[var(--text-dim)] font-mono">{sources.filter(s => s.status === 'ready').length} sources indexed</p>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-[var(--border)]">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-mono transition-all
              ${tab === key
                ? 'text-[var(--accent)] border-b border-[var(--accent)] -mb-px'
                : 'text-[var(--text-dim)] hover:text-[var(--text)]'}`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Upload area */}
      <div className="p-4 border-b border-[var(--border)]">
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-xs font-mono mb-3 p-2 bg-red-400/10 rounded-lg border border-red-400/20">
            <AlertCircle size={12} />
            <span className="truncate">{error}</span>
          </div>
        )}

        {tab === 'pdf' && (
          <div
            className={`upload-zone rounded-lg p-6 text-center cursor-pointer ${dragging ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" multiple accept=".pdf" className="hidden"
              onChange={e => e.target.files && handlePDFUpload(e.target.files)} />
            {loading ? (
              <Loader2 size={20} className="mx-auto text-[var(--accent)] animate-spin mb-2" />
            ) : (
              <Upload size={20} className="mx-auto text-[var(--muted)] mb-2" />
            )}
            <p className="text-xs text-[var(--text-dim)] font-mono">
              {loading ? 'Indexing...' : 'Drop PDFs here or click'}
            </p>
            <p className="text-xs text-[var(--muted)] font-mono mt-1">Multiple files supported</p>
          </div>
        )}

        {tab === 'url' && (
          <div className="space-y-2">
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleURLIndex()}
              placeholder="https://example.com/article"
              className="w-full chat-input rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--text)] placeholder:text-[var(--muted)]"
            />
            <button
              onClick={handleURLIndex}
              disabled={loading || !urlInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-mono
                bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)]
                hover:bg-[var(--accent)]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <ChevronRight size={12} />}
              {loading ? 'Indexing...' : 'Index URL'}
            </button>
          </div>
        )}

        {tab === 'video' && (
          <div
            className={`upload-zone rounded-lg p-6 text-center cursor-pointer ${dragging ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => videoRef.current?.click()}
          >
            <input ref={videoRef} type="file" accept="video/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleVideoUpload(e.target.files[0])} />
            {loading ? (
              <Loader2 size={20} className="mx-auto text-[var(--accent)] animate-spin mb-2" />
            ) : (
              <Video size={20} className="mx-auto text-[var(--muted)] mb-2" />
            )}
            <p className="text-xs text-[var(--text-dim)] font-mono">
              {loading ? 'Processing frames...' : 'Drop video here or click'}
            </p>
            <p className="text-xs text-[var(--muted)] font-mono mt-1">MP4, MOV, AVI supported</p>
          </div>
        )}
      </div>

      {/* Sources list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sources.length === 0 && (
          <div className="text-center py-8">
            <Database size={24} className="mx-auto text-[var(--muted)] mb-2" />
            <p className="text-xs text-[var(--muted)] font-mono">No sources yet</p>
          </div>
        )}
        {[...sources].reverse().map(source => (
          <SourceCard key={source.id} source={source} onRemove={onSourceRemove} />
        ))}
      </div>
    </aside>
  )
}

function SourceCard({ source, onRemove }: { source: IndexedSource; onRemove: (id: string) => void }) {
  const Icon = source.type === 'pdf' ? FileText : source.type === 'url' ? Link2 : Video
  const displayName = source.type === 'url'
    ? source.name.replace(/^https?:\/\//, '').slice(0, 30) + (source.name.length > 30 ? '…' : '')
    : source.name.length > 28 ? source.name.slice(0, 28) + '…' : source.name

  return (
    <div className="file-tag rounded-lg p-3 flex items-start gap-2.5 group animate-fade-in">
      <div className={`mt-0.5 p-1.5 rounded-md
        ${source.type === 'pdf' ? 'bg-blue-500/10 text-blue-400' :
          source.type === 'url' ? 'bg-purple-500/10 text-purple-400' :
          'bg-orange-500/10 text-orange-400'}`}>
        <Icon size={10} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-[var(--text)] truncate">{displayName}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {source.status === 'indexing' && (
            <><Loader2 size={9} className="text-yellow-400 animate-spin" />
            <span className="text-[10px] font-mono text-yellow-400">indexing</span></>
          )}
          {source.status === 'ready' && (
            <><CheckCircle2 size={9} className="text-[var(--accent)]" />
            <span className="text-[10px] font-mono text-[var(--accent)]">
              {source.chunks ? `${source.chunks} chunks` : 'ready'}
            </span></>
          )}
          {source.status === 'error' && (
            <><AlertCircle size={9} className="text-red-400" />
            <span className="text-[10px] font-mono text-red-400">error</span></>
          )}
        </div>
      </div>
      <button
        onClick={() => onRemove(source.id)}
        className="opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-red-400 transition-all mt-0.5"
      >
        <X size={12} />
      </button>
    </div>
  )
}
