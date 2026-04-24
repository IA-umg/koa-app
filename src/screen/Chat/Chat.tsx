"use client"

import { ChatContainer } from "@/components/ChatContainer/ChatContainer"
import { Message } from "@/components/ChatMessage/ChatMessage"
import { useState, useCallback, useRef } from "react"
import { useMutation } from "@tanstack/react-query"
import { post, postStream } from "@/service/methods/methods"
import { useAuthStore } from "@/store/auth"
import { useDataStore } from "@/store/model"
import { FileUploader, UploadedFile } from "@/components/FileUploader/FileUploader"
import { MobileUploadTrigger } from "@/components/MobileUploadTrigger/MobileUploadTrigger"

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

interface ChatResponse {
  ok: boolean
  answer: string
  fragmentosUsados?: SourceFragment[]
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

export default function Chat() {
  const [messages, setMessages] = useState<MessageWithSources[]>([])
  const token = useAuthStore((s) => s.auth?.token)
  const { complex, model } = useDataStore()
  const abortRef = useRef<AbortController | null>(null)
  const [materiaFilter, setMateriaFilter] = useState("all")
  const [periodoFilter, setPeriodoFilter] = useState("all")

  const chatMutation = useMutation({
    mutationFn: async (content: string) => {
      const startTime = performance.now()
      const botMessageId = generateId()

      const payload: Record<string, any> = {
        question: content,
        provider: complex ? model.value : undefined,
        topK: 4,
        stream: true,
      }

      const filtrosMetadata: Record<string, string> = {}
      if (materiaFilter && materiaFilter !== "all") filtrosMetadata.materia = materiaFilter
      if (periodoFilter && periodoFilter !== "all") filtrosMetadata.curso = periodoFilter

      if (Object.keys(filtrosMetadata).length > 0) {
        payload.filtrosMetadata = filtrosMetadata
      }

      // Cancel previous request if any
      if (abortRef.current) {
        abortRef.current.abort()
      }
      const controller = new AbortController()
      abortRef.current = controller

      try {
        // Try streaming via postStream (SSE)
        const response = await postStream("/api/query", payload, token, controller.signal)
        const contentType = response.headers.get("content-type") || ""

        if (contentType.includes("text/event-stream")) {
          // ── SSE Streaming path ──
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
                    if (parsed.done) {
                      // Mantenemos el 'accumulated' del stream porque 'parsed.fullAnswer' del backend 
                      // a veces pierde los saltos de línea (\n).
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === botMessageId
                            ? { ...msg, content: accumulated }
                            : msg
                        )
                      )
                    }
                  } catch {
                    // Not JSON, skip
                  }

                  currentEventType = ""
                }
              }
            }
          }

          const endTime = performance.now()
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, latency: endTime - startTime }
                : msg
            )
          )

          return { streamed: true }
        } else {
          // ── Fallback: regular JSON via Axios post ──
          const result = await post<ChatResponse>("/api/query", { ...payload, stream: false }, token)
          const endTime = performance.now()

          if (!result.ok || !result.data) {
            throw new Error(result.error || "Error al obtener respuesta")
          }

          const botMessage: MessageWithSources = {
            id: botMessageId,
            content: result.data.answer,
            role: "assistant",
            timestamp: new Date(),
            sources: result.data.fragmentosUsados || [],
            latency: endTime - startTime,
          }
          setMessages((prev) => [...prev, botMessage])

          return { streamed: false }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return

        // Add error message to chat
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

        throw error
      } finally {
        abortRef.current = null
      }
    },
    onError: (error) => {
      if (error instanceof Error && error.name === "AbortError") return
      console.error("Chat error:", error)
    },
  })

  const handleSendMessage = useCallback((content: string) => {
    const userMessage: MessageWithSources = {
      id: generateId(),
      content,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    chatMutation.mutate(content)
  }, [chatMutation])


return (
    <main className="flex h-screen w-full overflow-hidden">
      <ChatContainer
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={chatMutation.isPending}
        materiaFilter={materiaFilter}
        setMateriaFilter={setMateriaFilter}
        periodoFilter={periodoFilter}
        setPeriodoFilter={setPeriodoFilter}
      />
    </main>
  )
}