"use client"

import { useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot } from "lucide-react"
import { ChatMessage, Message } from "@/components/ChatMessage/ChatMessage"
import { TypingIndicator } from "@/components/TypingIndicator/TypingIndicator"
import { ChatInput } from "@/components/ChatInput/ChatInput"
import Header from "../header/Header"

interface ChatContainerProps {
  messages: Message[]
  onSendMessage: (content: string) => void
  isLoading?: boolean
  title?: string
  subtitle?: string
}

export function ChatContainer({
  messages,
  onSendMessage,
  isLoading = false
}: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isLoading])

    return (
    <div className="flex h-full flex-col bg-background overflow-hidden">
      <Header/>
        <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-4 py-4 w-full max-w-2xl mx-auto">
            {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Bot className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-medium text-foreground">
                {"¡Hola! Soy tu asistente Koa, te ayudare con "}
                </h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Escribe un mensaje para comenzar nuestra conversación.
                </p>
            </div>
            )}

            {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
            ))}

            {isLoading && <TypingIndicator />}

            <div ref={scrollRef} />
        </div>
        </ScrollArea>

        <ChatInput onSend={onSendMessage} disabled={isLoading} />
    </div>
    )
}
