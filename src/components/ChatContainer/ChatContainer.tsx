"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Paperclip, Filter } from "lucide-react"
import { ChatMessage, Message } from "@/components/ChatMessage/ChatMessage"
import { TypingIndicator } from "@/components/TypingIndicator/TypingIndicator"
import { ChatInput } from "@/components/ChatInput/ChatInput"
import Header from "../header/Header"
import { MobileUploadTrigger } from "../MobileUploadTrigger/MobileUploadTrigger"
import { FileUploader, UploadedFile, MATERIAS, PERIODOS } from "../FileUploader/FileUploader"
import { generateId } from "@/screen/Chat/Chat"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { postForm } from "@/service/methods/methods"

interface IngestResponse {
  message?: string
}

interface ChatContainerProps {
  messages: Message[]
  onSendMessage: (content: string) => void
  isLoading?: boolean
  materiaFilter?: string
  setMateriaFilter?: (val: string) => void
  periodoFilter?: string
  setPeriodoFilter?: (val: string) => void
}

export function ChatContainer({
  messages,
  onSendMessage,
  isLoading = false,
  materiaFilter = "",
  setMateriaFilter = () => {},
  periodoFilter = "",
  setPeriodoFilter = () => {},
}: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const handleTogglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev)
  }, [])

  const uploadFileToAPI = useCallback(async (uploadedFile: UploadedFile, reemplazar: boolean) => {
    if (!uploadedFile.file) return

    const formData = new FormData()
    formData.append("curso", uploadedFile.periodo || "General")
    formData.append("materia", uploadedFile.materia || "General")
    formData.append("reemplazar", reemplazar ? "true" : "false")
    formData.append("metadata", JSON.stringify({
      profesor: "No especificado",
      semestre: uploadedFile.periodo || "No especificado",
    }))
    formData.append("file", uploadedFile.file)

    const result = await postForm<IngestResponse>("/api/ingest/archivo", formData)
    console.log(result, "result")
    if (result.ok) {
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === uploadedFile.id
            ? { ...f, progress: 100, status: "completed" }
            : f
        )
      )
    } else {
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === uploadedFile.id
            ? { ...f, status: "error", progress: 0 }
            : f
        )
      )
    }
  }, [])

  const handleFilesAdd = useCallback((files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file) => ({
      id: generateId(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "pending" as const,
      progress: 0,
      file,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])

    if (!isPanelOpen) setIsPanelOpen(true)
  }, [isPanelOpen])

  const handleUploadAll = useCallback((metadata: { materia: string; periodo: string; reemplazar: boolean }) => {
    const pendingFiles = uploadedFiles.filter(f => f.status === "pending")
    if (pendingFiles.length === 0) return

    setUploadedFiles(prev => 
      prev.map(f => f.status === "pending" ? { ...f, status: "uploading", materia: metadata.materia, periodo: metadata.periodo } : f)
    )

    pendingFiles.forEach(file => {
      const fileWithMeta = { ...file, materia: metadata.materia, periodo: metadata.periodo, status: "uploading" as const }
      
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 20
        if (progress >= 85) {
          clearInterval(interval)
        } else {
          setUploadedFiles(prev =>
            prev.map(f =>
              f.id === file.id ? { ...f, progress: Math.round(progress) } : f
            )
          )
        }
      }, 200)

      uploadFileToAPI(fileWithMeta, metadata.reemplazar).finally(() => clearInterval(interval))
    })
  }, [uploadedFiles, uploadFileToAPI])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isLoading])

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-background">
      <Header />

      <div className="flex flex-1 min-h-0">
        {/* Panel de archivos — solo desktop */}
        <div
          className={`hidden lg:flex flex-col border-r bg-background overflow-hidden transition-all duration-300 ease-in-out ${
            isPanelOpen ? "w-80" : "w-0 border-r-0"
          }`}
        >
          <div className="w-80 h-full">
            <FileUploader files={uploadedFiles} onFilesAdd={handleFilesAdd} onUploadAll={handleUploadAll} />
          </div>
        </div>

        {/* Chat */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <ScrollArea className="flex-1 min-h-0">
            <div className="flex flex-col gap-4 py-4 w-full max-w-2xl mx-auto px-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Bot className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-lg font-medium text-foreground">
                    ¡Hola! Soy tu asistente Koa, te ayudaré con{" "}
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
          
          {/* Barra de Filtros de Búsqueda Elegante */}
          <div className="w-full max-w-2xl mx-auto px-4 py-2 flex items-center justify-end gap-2 border-t border-border/10 bg-background/30 backdrop-blur-sm z-10">
             <div className="flex items-center gap-1.5 mr-auto pl-2 opacity-50">
               <Filter className="h-3 w-3" />
               <span className="text-[10px] font-semibold uppercase tracking-widest hidden sm:inline-block">Contexto</span>
             </div>
             
             <Select value={materiaFilter} onValueChange={setMateriaFilter}>
               <SelectTrigger className="h-7 text-xs bg-muted/30 border-transparent hover:bg-muted/60 focus:ring-0 w-auto min-w-[140px] rounded-full px-3">
                 <SelectValue placeholder="Materia" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todas las materias</SelectItem>
                 {MATERIAS.map(m => m !== "General" && <SelectItem key={m} value={m}>{m}</SelectItem>)}
                 <SelectItem value="General">General</SelectItem>
               </SelectContent>
             </Select>

             <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
               <SelectTrigger className="h-7 text-xs bg-muted/30 border-transparent hover:bg-muted/60 focus:ring-0 w-auto min-w-[150px] rounded-full px-3">
                 <SelectValue placeholder="Período" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todos los períodos</SelectItem>
                 {PERIODOS.map(p => p !== "General" && <SelectItem key={p} value={p}>{p}</SelectItem>)}
                 <SelectItem value="General">General</SelectItem>
               </SelectContent>
             </Select>
          </div>

          <ChatInput onSend={onSendMessage} disabled={isLoading} />
        </div>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleTogglePanel}
              className="fixed bottom-24 right-6 z-50 hidden lg:flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <Paperclip className="h-5 w-5" />
              {uploadedFiles.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                  {uploadedFiles.length}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Alimenta al koa</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <MobileUploadTrigger
        files={uploadedFiles}
        onFilesAdd={handleFilesAdd}
        onUploadAll={handleUploadAll}
      />
    </div>
  )
}