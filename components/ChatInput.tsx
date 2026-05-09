'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Square } from 'lucide-react'

interface Props {
  onSend: (message: string) => void
  disabled?: boolean
  isLoading?: boolean
}

const SUGGESTIONS = [
  'Summarize the uploaded document',
  'What are the key topics covered?',
  'What happens in the video?',
  'Find information about...',
]

export default function ChatInput({ onSend, disabled, isLoading }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px'
    }
  }, [value])

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled || isLoading) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg)] p-4">
      {/* Suggestion chips — only show when empty */}
      {!value && !isLoading && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => setValue(s)}
              className="shrink-0 text-[10px] font-mono text-[var(--text-dim)] px-3 py-1.5
                rounded-full border border-[var(--border)] hover:border-[var(--accent)]/40
                hover:text-[var(--accent)] transition-all whitespace-nowrap"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your documents..."
            rows={1}
            disabled={disabled}
            className="chat-input w-full rounded-xl px-4 py-3 pr-4 text-sm font-sans
              text-[var(--text)] placeholder:text-[var(--muted)] disabled:opacity-50
              leading-relaxed"
            style={{ minHeight: '48px' }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0
            transition-all duration-200 border
            ${value.trim() && !disabled
              ? 'bg-[var(--accent)]/10 border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent)]/20 glow-accent'
              : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] cursor-not-allowed'
            }`}
        >
          {isLoading ? (
            <Square size={14} className="text-[var(--accent)] fill-current" />
          ) : (
            <Send size={14} />
          )}
        </button>
      </div>

      <p className="text-center text-[10px] font-mono text-[var(--muted)] mt-2">
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  )
}
