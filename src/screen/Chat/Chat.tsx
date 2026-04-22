"use client"

import { ChatContainer } from "@/components/ChatContainer/ChatContainer"
import { Message } from "@/components/ChatMessage/ChatMessage"
import { useState, useCallback } from "react"
import { useMutation } from "@tanstack/react-query"
import { post } from "@/service/methods/methods"
import { useAuthStore } from "@/store/auth"
import { useDataStore } from "@/store/model"

interface ChatResponse {
  ok: boolean;
  answer: string;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const token = useAuthStore((s) => s.auth?.token)
  const {complex,model}= useDataStore()

  const chatMutation = useMutation({
    mutationFn: async (content: string) => {
      const data ={
        question: content,
        pprovider: complex ?model.value:undefined,
        topk:4,
      }

      const response = await post<ChatResponse>("/api/query", data, token)
      console.log(response)

      if (!response.ok || !response.data) {
        throw new Error(response.error || "Error al obtener respuesta")
      }

      return response.data
    },
    onSuccess: (data) => {
      const botMessage: Message = {
        id: generateId(),
        content: data.answer,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    },
    onError: (error) => {
      console.error("Error:", error)
    },
  })

  const handleSendMessage = useCallback((content: string) => {
    const userMessage: Message = {
      id: generateId(),
      content,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    chatMutation.mutate(content)
  }, [])

  return (
    <main className="mx-auto flex h-screen w-full flex-col">
      <ChatContainer
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={chatMutation.isPending}
      />
    </main>
  )
}