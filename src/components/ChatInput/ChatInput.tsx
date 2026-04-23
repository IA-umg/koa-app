"use client"

import { useState, useRef, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Send, ChevronDown } from "lucide-react"
import { useDataStore } from "@/store/model"

const MODELS = [
  { value: "gemini", label: "Gemini" },
  { value: "groq", label: "Groq" },
]

interface ChatInputProps {
  onSend: (message: string, model: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Escribe un mensaje...",
}: ChatInputProps) {
  const [input, setInput] = useState("")
  const { setModel, model, complex, setComplex} = useDataStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || disabled) return
    onSend(trimmed, model.value)
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const textarea = e.target
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
  }

  return (
   <div className="flex flex-col w-full gap-2 bg-background px-3 py-3 sm:px-4 sm:py-4">
  <div className="mx-auto w-full max-w-2xl flex items-center gap-2">
    <Textarea
      ref={textareaRef}
      value={input}
      onChange={handleInput}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      rows={1}
      className="pl-1.5 resize-none rounded-xl bg-zinc-900 text-white placeholder:text-zinc-400 border-zinc-700 focus-visible:ring-zinc-600"
    />
    <div className="flex flex-col items-center gap-1">
      <Button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        size="icon"
        className="h-9 w-9 shrink-0 rounded-xl"
        aria-label="Enviar mensaje"
        style={{color:"#3E7063"}}
      >
        <Send className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            disabled={disabled}
            className="flex items-center gap-0.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40"
          >
            {model.label}
            <ChevronDown className="h-2.5 w-2.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top"
          align="end" 
          className="min-w-0 bg-zinc-900 border-zinc-800 text-zinc-400"
        >
          {MODELS.map((m) => (
            <DropdownMenuItem key={m.value} onClick={() => {setModel(m); setComplex(true)}} className="text-xs hover:text-white cursor-pointer">
              {m.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</div>
  )
}