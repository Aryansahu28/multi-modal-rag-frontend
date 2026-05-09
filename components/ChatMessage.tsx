'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, User } from 'lucide-react'
import { ChatMessage } from '@/lib/api'

interface Props {
  message: ChatMessage
}

function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center py-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--accent)] inline-block animate-pulse-dot"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )
}

export default function ChatMessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  const timeStr = message.timestamp.toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit'
  })

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="flex items-end gap-2.5 max-w-[75%]">
          <div>
            <div className="message-user rounded-2xl rounded-br-sm px-4 py-3">
              <p className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
            <p className="text-[10px] font-mono text-[var(--muted)] text-right mt-1 mr-1">{timeStr}</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20
            flex items-center justify-center shrink-0 mb-5">
            <User size={12} className="text-[var(--accent)]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start animate-slide-up">
      <div className="flex items-end gap-2.5 max-w-[80%]">
        <div className="w-7 h-7 rounded-full bg-[var(--surface)] border border-[var(--border)]
          flex items-center justify-center shrink-0 mb-5">
          <Bot size={12} className="text-[var(--text-dim)]" />
        </div>
        <div>
          <div className="message-ai rounded-2xl rounded-bl-sm px-4 py-3">
            {message.isStreaming ? (
              <TypingIndicator />
            ) : (
              <div className="prose-custom text-sm text-[var(--text)]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
          {!message.isStreaming && (
            <p className="text-[10px] font-mono text-[var(--muted)] mt-1 ml-1">{timeStr}</p>
          )}
        </div>
      </div>
    </div>
  )
}
