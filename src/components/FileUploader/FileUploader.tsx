"use client"

import { useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  File,
  FileText,
  FileImage,
  FileArchive,
  CheckCircle2,
  AlertCircle,
  FolderUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: "uploading" | "completed" | "error"
  progress: number
  file?: File
}

interface FileUploaderProps {
  files: UploadedFile[]
  onFilesAdd: (files: File[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return FileImage
  if (type.includes("zip") || type.includes("rar") || type.includes("tar"))
    return FileArchive
  if (
    type.includes("pdf") ||
    type.includes("doc") ||
    type.includes("text") ||
    type.includes("txt")
  )
    return FileText
  return File
}

function getFileTypeColor(type: string): string {
  if (type.startsWith("image/")) return "bg-purple-500/10 text-purple-600"
  if (type.includes("pdf")) return "bg-red-500/10 text-red-600"
  if (type.includes("doc") || type.includes("text"))
    return "bg-blue-500/10 text-blue-600"
  if (type.includes("zip") || type.includes("rar"))
    return "bg-amber-500/10 text-amber-600"
  return "bg-muted text-muted-foreground"
}

export function FileUploader({
  files,
  onFilesAdd,
  maxFiles = 20,
  acceptedTypes = [".pdf", ".txt", ".doc", ".docx", ".md", ".json", ".csv"],
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const droppedFiles = Array.from(e.dataTransfer.files)
      if (droppedFiles.length > 0) {
        onFilesAdd(droppedFiles)
      }
    },
    [onFilesAdd]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || [])
      if (selectedFiles.length > 0) {
        onFilesAdd(selectedFiles)
      }
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    },
    [onFilesAdd]
  )

  const completedCount = files.filter((f) => f.status === "completed").length
  const uploadingCount = files.filter((f) => f.status === "uploading").length
  const errorCount = files.filter((f) => f.status === "error").length

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className=" pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <FolderUp className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-medium text-foreground">
              Base de conocimiento
            </h2>          
          </div>
          <Badge variant="secondary" className="font-mono">
            {files.length}/{maxFiles}
          </Badge>
        </div>

        {/* Stats */}
        {files.length > 0 && (
          <div className="mt-3 flex gap-3">
            {completedCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span>{completedCount} listos</span>
              </div>
            )}
            {uploadingCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>{uploadingCount} subiendo</span>
              </div>
            )}
            {errorCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                <span>{errorCount} errores</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 p-4">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
              isDragging ? "bg-primary/10" : "bg-muted"
            )}
          >
            <Upload
              className={cn(
                "h-6 w-6 transition-colors",
                isDragging ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {isDragging ? "Suelta los archivos aquí" : "Arrastra archivos aquí"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              o haz clic para seleccionar
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {acceptedTypes.join(", ")}
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(",")}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-2">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.type)
                const typeColor = getFileTypeColor(file.type)

                return (
                  <div
                    key={file.id}
                    className="group flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        typeColor
                      )}
                    >
                      <FileIcon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </span>
                        {file.status === "uploading" && (
                          <span className="text-xs text-primary">
                            {file.progress}%
                          </span>
                        )}
                      </div>
                      {file.status === "uploading" && (
                        <Progress value={file.progress} className="mt-1.5 h-1" />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {file.status === "completed" && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {file.status === "error" && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}

        {/* Empty State */}
        {files.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              No hay archivos subidos
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sube documentos para alimentar tu chatbot
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}