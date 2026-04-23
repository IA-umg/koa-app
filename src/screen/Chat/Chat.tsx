"use client"

import { ChatContainer } from "@/components/ChatContainer/ChatContainer"
import { Message } from "@/components/ChatMessage/ChatMessage"
import { useState, useCallback, useRef } from "react"
import { useAuthStore } from "@/store/auth"
import { useDataStore } from "@/store/model"
import { API_BASE_URL } from "@/service/env/env"

export interface SourceFragment {
  id: number | string
  fuente: string
  contenido: string
  metadata: Record<string, unknown>
  score: number
  tipoFuente: string
  identificador: string
}

export interface MessageWithSources extends Message {
  sources?: SourceFragment[]
}

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

export default function Chat() {
  const [messages, setMessages] = useState<MessageWithSources[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const token = useAuthStore((s) => s.auth?.token)
  const { complex, model } = useDataStore()
  const abortRef = useRef<AbortController | null>(null)

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: MessageWithSources = {
      id: generateId(),
      content,
      role: "user",
      timestamp: new Date(),
    }

    const botMessageId = generateId()

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch(`${API_BASE_URL}/api/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question: content,
          provider: complex ? model.value : undefined,
          topK: 4,
          stream: true,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      const contentType = response.headers.get("content-type") || ""

      if (contentType.includes("text/event-stream")) {
        const botMessage: MessageWithSources = {
          id: botMessageId,
          content: "",
          role: "assistant",
          timestamp: new Date(),
          sources: [],
        }
        setMessages((prev) => [...prev, botMessage])

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let accumulated = ""
        let buffer = ""
        let sources: SourceFragment[] = []

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""

            let currentEventType = ""

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed) continue

              if (trimmed.startsWith("event:")) {
                currentEventType = trimmed.slice(6).trim()
                continue
              }

              if (trimmed.startsWith("data:")) {
                const dataStr = trimmed.slice(5).trim()
                if (dataStr === "[DONE]") continue

                try {
                  const parsed = JSON.parse(dataStr)

                  // Capture metadata (sources) from the metadata event
                  if (currentEventType === "metadata" && parsed.fragmentosUsados) {
                    sources = parsed.fragmentosUsados
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === botMessageId
                          ? { ...msg, sources }
                          : msg
                      )
                    )
                    currentEventType = ""
                    continue
                  }

                  // Regular text chunk
                  if (parsed.chunk) {
                    accumulated += parsed.chunk
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === botMessageId
                          ? { ...msg, content: accumulated }
                          : msg
                      )
                    )
                  }

                  // End event with full answer
                  if (parsed.done && parsed.fullAnswer) {
                    accumulated = parsed.fullAnswer
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === botMessageId
                          ? { ...msg, content: accumulated, sources }
                          : msg
                      )
                    )
                  }
                } catch {
                  // Not JSON
                }

                currentEventType = ""
              }
            }
          }
        }
      } else {
        // Fallback: regular JSON
        const data = await response.json()

        if (data.ok && data.answer) {
          const botMessage: MessageWithSources = {
            id: botMessageId,
            content: data.answer,
            role: "assistant",
            timestamp: new Date(),
            sources: data.fragmentosUsados || [],
          }
          setMessages((prev) => [...prev, botMessage])
        } else {
          throw new Error(data.error || "Error al obtener respuesta")
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return

      console.error("Error:", error)
      const errorMessage: MessageWithSources = {
        id: botMessageId,
        content: "Ocurrió un error al procesar tu mensaje. Intenta de nuevo.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => {
        const existing = prev.find((m) => m.id === botMessageId)
        if (existing) {
          return prev.map((m) => (m.id === botMessageId ? errorMessage : m))
        }
        return [...prev, errorMessage]
      })
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }, [token, complex, model.value])

  return (
    <main className="mx-auto flex h-screen w-full flex-col">
      <ChatContainer
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </main>
  )
}