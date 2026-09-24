import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { MessageCircle, Send, X } from 'lucide-react'
import { chatbotApi, type ChatMessage } from '@/api/chatbot'
import { apiErrorMessage } from '@/api/client'
import { useAuthStore } from '@/store/auth'

export function ChatWidget() {
  const isAuthed = !!useAuthStore((s) => s.accessToken)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  const send = useMutation({
    mutationFn: (text: string) => chatbotApi.sendMessage(text, conversationId),
    onSuccess: (data) => {
      setConversationId(data.conversation_id)
      setMessages((prev) => [...prev, data.reply])
    },
    onError: (err) => setError(apiErrorMessage(err, "Assistant is unavailable right now — please try again.")),
  })

  const handleSend = () => {
    const text = input.trim()
    if (!text || send.isPending) return
    setError('')
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: 'user', content: text, created_at: new Date().toISOString() },
    ])
    setInput('')
    send.mutate(text)
  }

  if (!isAuthed) return null

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 sm:bottom-6 right-4 z-40 h-14 w-14 rounded-full bg-forest-600 text-rice-50 shadow-lg flex items-center justify-center hover:bg-forest-700 transition-colors"
          aria-label="Chat with us"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 z-40 w-[calc(100vw-2rem)] sm:w-96 h-[70vh] sm:h-[32rem] rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-forest-600 text-rice-50">
            <div>
              <p className="text-sm font-semibold">zKart Assistant</p>
              <p className="text-xs text-rice-100/70">Orders, products, aur help</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-rice-100/80 hover:text-rice-50">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
            {messages.length === 0 && (
              <div className="text-center text-sm text-ink-300 mt-8 px-4">
                Aap mujhse apne order ka status, product availability, ya delivery/return policy ke baare mein pooch sakte hain.
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.role === 'user'
                    ? 'self-end bg-forest-600 text-rice-50 rounded-br-sm'
                    : 'self-start bg-rice-100 text-ink-500 rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            ))}
            {send.isPending && (
              <div className="self-start bg-rice-100 text-ink-300 rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm">
                Typing...
              </div>
            )}
            {error && <p className="text-xs text-chili-600 text-center">{error}</p>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2 p-3 border-t border-ink-100/60"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Apna sawaal likhein..."
              className="flex-1 rounded-xl border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || send.isPending}
              className="h-9 w-9 rounded-xl bg-forest-600 text-rice-50 flex items-center justify-center disabled:opacity-40 shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
