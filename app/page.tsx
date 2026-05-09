'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Cpu, Trash2, ChevronDown, Zap } from 'lucide-react'
import UploadSidebar from '@/components/UploadSidebar'
import ChatMessageBubble from '@/components/ChatMessage'
import ChatInput from '@/components/ChatInput'
import { sendChat, ChatMessage, IndexedSource } from '@/lib/api'

const THREAD_ID = 'default'

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `## Welcome to RAG Assistant

I can answer questions based on your uploaded knowledge sources.

**To get started:**
- Upload **PDFs** for document Q&A
- Add a **URL** to index any webpage
- Upload a **Video** to query its content

Then just ask me anything!`,
  timestamp: new Date(),
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [sources, setSources] = useState<IndexedSource[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    setShowScrollBtn(!isNearBottom)
  }

  const handleSend = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    const thinkingMsg: ChatMessage = {
      id: 'thinking',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }
    setMessages(prev => [...prev, userMsg, thinkingMsg])
    setIsLoading(true)

    try {
      const response = await sendChat(text, THREAD_ID)
      setMessages(prev =>
        prev.map(m =>
          m.id === 'thinking'
            ? { ...m, id: Date.now().toString(), content: response, isStreaming: false }
            : m
        )
      )
    } catch (e: any) {
      setMessages(prev =>
        prev.map(m =>
          m.id === 'thinking'
            ? { ...m, id: Date.now().toString(), content: `**Error:** ${e.message}`, isStreaming: false }
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSourceAdded = (source: IndexedSource) => {
    setSources(prev => {
      const exists = prev.find(s => s.id === source.id)
      if (exists) return prev.map(s => s.id === source.id ? source : s)
      return [...prev, source]
    })
  }

  const handleSourceRemove = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id))
  }

  const clearChat = () => {
    setMessages([WELCOME])
  }

  const readySources = sources.filter(s => s.status === 'ready')

  return (
    <div className="h-screen flex noise-bg overflow-hidden">
      {/* Subtle grid background */}
      <div className="fixed inset-0 grid-lines opacity-30 pointer-events-none" />

      {/* Left sidebar */}
      <UploadSidebar
        sources={sources}
        onSourceAdded={handleSourceAdded}
        onSourceRemove={handleSourceRemove}
      />

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30
                flex items-center justify-center">
                <Zap size={14} className="text-[var(--accent)]" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--accent)]
                shadow-[0_0_6px_var(--accent)]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[var(--text)] tracking-wide">RAG Assistant</h1>
              <p className="status-online text-[10px] font-mono text-[var(--text-dim)]">
                {readySources.length > 0
                  ? `${readySources.length} source${readySources.length > 1 ? 's' : ''} active`
                  : 'No sources indexed'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Active source badges */}
            <div className="hidden md:flex items-center gap-1.5">
              {readySources.slice(0, 3).map(s => (
                <span key={s.id}
                  className="text-[10px] font-mono px-2 py-1 rounded-md
                    bg-[var(--surface)] border border-[var(--border)] text-[var(--text-dim)]
                    max-w-[100px] truncate">
                  {s.name.length > 14 ? s.name.slice(0, 14) + '…' : s.name}
                </span>
              ))}
              {readySources.length > 3 && (
                <span className="text-[10px] font-mono text-[var(--muted)]">+{readySources.length - 3}</span>
              )}
            </div>

            <button
              onClick={clearChat}
              title="Clear chat"
              className="p-2 rounded-lg text-[var(--muted)] hover:text-red-400
                hover:bg-red-400/5 border border-transparent hover:border-red-400/20 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
        >
          {messages.map(msg => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-6 p-2 rounded-full
              bg-[var(--surface)] border border-[var(--border)] text-[var(--text-dim)]
              hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-all
              shadow-lg animate-fade-in"
          >
            <ChevronDown size={14} />
          </button>
        )}

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={false} isLoading={isLoading} />
      </main>
    </div>
  )
}
