/**
 * Chat Service - Client-side service for AI Chatbot "Cú Mèo"
 * 
 * Handles:
 * - Streaming messages to/from the /api/chat endpoint
 * - Loading/saving chat history from Supabase
 * - Session management (conversation ID)
 */

import { getSupabaseBrowserClient } from '@/lib/supabase'

export interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  isStreaming?: boolean
}

interface StreamCallbacks {
  onChunk: (text: string) => void
  onDone: (fullText: string) => void
  onError: (error: string) => void
}

class ChatService {
  private supabase = getSupabaseBrowserClient()

  /**
   * Send a message to the AI chatbot with streaming response.
   * 
   * HOW STREAMING WORKS:
   * 1. We send the message to /api/chat via fetch
   * 2. The server calls Gemini with streaming enabled
   * 3. Gemini sends back text in small chunks (a few words at a time)
   * 4. Server forwards each chunk as a Server-Sent Event (SSE)
   * 5. This function reads the stream and calls onChunk() for each piece
   * 6. The UI appends each chunk to the message, making text appear gradually
   * 
   * This gives a "typing" effect like ChatGPT instead of waiting 3-5s for the full answer.
   */
  async sendMessageStream(
    message: string,
    subjectId: number | null,
    conversationHistory: Array<{ role: 'user' | 'bot'; text: string }>,
    callbacks: StreamCallbacks
  ): Promise<void> {
    try {
      // Get the current user's JWT token for authentication
      const { data: { session } } = await this.supabase.auth.getSession()
      if (!session?.access_token) {
        callbacks.onError('Bạn cần đăng nhập để chat với Cú Mèo')
        return
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message,
          subjectId,
          conversationHistory: conversationHistory.slice(-10), // Last 10 messages
        }),
      })

      // Handle non-streaming error responses (JSON)
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const errorData = await response.json()
          
          if (response.status === 429) {
            callbacks.onError(errorData.error || 'Cú Mèo đang bận, chờ chút nha~ 🦉')
            return
          }
          
          callbacks.onError(errorData.error || 'Có lỗi xảy ra')
          return
        }
        callbacks.onError('Cú Mèo gặp sự cố, thử lại sau nhé! 🦉')
        return
      }

      // Handle cached (non-streaming) response
      const responseContentType = response.headers.get('content-type')
      if (responseContentType?.includes('application/json')) {
        const data = await response.json()
        callbacks.onChunk(data.response)
        callbacks.onDone(data.response)
        return
      }

      // Handle streaming response (SSE)
      const reader = response.body?.getReader()
      if (!reader) {
        callbacks.onError('Không thể đọc phản hồi từ Cú Mèo')
        return
      }

      const decoder = new TextDecoder()
      let fullText = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE events from the buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep the last incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.done) {
                callbacks.onDone(fullText)
                return
              }
              
              if (data.error) {
                // Error with fallback message from server
                fullText += data.text
                callbacks.onChunk(data.text)
                continue
              }
              
              if (data.text) {
                fullText += data.text
                callbacks.onChunk(data.text)
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      }

      // If we reach here without a done signal, finalize
      if (fullText) {
        callbacks.onDone(fullText)
      } else {
        callbacks.onError('Cú Mèo không phản hồi, thử lại nhé! 🦉')
      }

    } catch (error) {
      console.error('Chat service error:', error)
      callbacks.onError('Không thể kết nối với Cú Mèo. Kiểm tra mạng và thử lại nhé! 🦉')
    }
  }

  /**
   * Load chat history from the database.
   * Groups messages by today's conversation.
   */
  async getChatHistory(limit = 50): Promise<ChatMessage[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return []

      const today = new Date().toISOString().split('T')[0]
      const conversationId = `conv_${user.id}_${today}`

      const { data: logs, error } = await this.supabase
        .from('chat_logs')
        .select('id, sender, message, created_at, is_blocked')
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId)
        .eq('is_blocked', false)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error || !logs) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return logs.map((log: any) => ({
        id: log.id,
        text: log.message,
        sender: log.sender === 'ai' ? 'bot' as const : 'user' as const,
        timestamp: new Date(log.created_at),
      }))
    } catch (error) {
      console.error('Error loading chat history:', error)
      return []
    }
  }

  /**
   * Clear today's conversation history.
   */
  async clearHistory(): Promise<boolean> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      if (!session?.access_token) return false

      // Use server endpoint (service role) to bypass RLS on DELETE
      const response = await fetch('/api/chat', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      return response.ok
    } catch (error) {
      console.error('Error clearing chat history:', error)
      return false
    }
  }
}

// Export singleton instance (follows existing service pattern in this codebase)
export const chatService = new ChatService()
