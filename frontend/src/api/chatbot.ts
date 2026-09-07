import { api } from '@/api/client'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export const chatbotApi = {
  sendMessage: (message: string, conversationId?: string) =>
    api
      .post<{ conversation_id: string; reply: ChatMessage }>('/chatbot/message/', {
        message,
        conversation_id: conversationId,
      })
      .then((r) => r.data),
}
