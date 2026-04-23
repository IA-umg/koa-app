"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, User, FileText } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useState, useMemo } from "react"
import type { SourceFragment } from "@/screen/Chat/Chat"

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp?: Date
  sources?: SourceFragment[]
}

interface ChatMessageProps {
  message: Message
}

/* ── Citation badge component ── */
function CitationBadge({
  number,
  source,
}: {
  number: number
  source?: SourceFragment
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  const tooltipContent = useMemo(() => {
    if (!source) return null
    const meta = source.metadata as Record<string, unknown>
    const archivo = (meta?.archivo as string) || source.fuente || "Documento"
    const pagina = meta?.pagina ? `Página ${meta.pagina}` : null
    const fragmento = meta?.fragmento ? `Fragmento ${meta.fragmento}` : null
    const curso = meta?.curso as string | undefined

    return { archivo, pagina, fragmento, curso, contenido: source.contenido }
  }, [source])

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-medium bg-zinc-700 text-zinc-300 rounded-full cursor-help ml-0.5 -translate-y-1 hover:bg-zinc-600 transition-colors">
        {number}
      </span>

      {showTooltip && tooltipContent && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72 pointer-events-none">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-3 text-xs">
            <div className="flex items-center gap-1.5 mb-1.5">
              <FileText className="h-3 w-3 text-zinc-400 shrink-0" />
              <span className="font-semibold text-zinc-200 truncate">
                {tooltipContent.archivo}
              </span>
            </div>
            <div className="flex gap-2 text-zinc-400 mb-2">
              {tooltipContent.pagina && <span>{tooltipContent.pagina}</span>}
              {tooltipContent.fragmento && (
                <span>{tooltipContent.fragmento}</span>
              )}
              {tooltipContent.curso && (
                <span className="text-zinc-500">• {tooltipContent.curso}</span>
              )}
            </div>
            <p className="text-zinc-400 line-clamp-3 leading-relaxed border-t border-zinc-800 pt-2">
              {tooltipContent.contenido}
            </p>
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-zinc-900 border-r border-b border-zinc-700 rotate-45" />
          </div>
        </div>
      )}
    </span>
  )
}

/* ── Sources footer ── */
function SourcesFooter({ sources }: { sources: SourceFragment[] }) {
  const [expanded, setExpanded] = useState(false)

  // Deduplicate sources by archivo/fuente
  const uniqueSources = useMemo(() => {
    const seen = new Set<string>()
    return sources.filter((s) => {
      const meta = s.metadata as Record<string, unknown>
      const key = (meta?.archivo as string) || s.fuente
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [sources])

  if (uniqueSources.length === 0) return null

  return (
    <div className="mt-2 pt-2 border-t border-zinc-700/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <FileText className="h-3 w-3" />
        <span>
          {uniqueSources.length}{" "}
          {uniqueSources.length === 1 ? "fuente" : "fuentes"}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5">
          {uniqueSources.map((source, i) => {
            const meta = source.metadata as Record<string, unknown>
            const archivo =
              (meta?.archivo as string) || source.fuente || "Documento"
            const pagina = meta?.pagina ? `Pág. ${meta.pagina}` : null

            return (
              <div
                key={i}
                className="flex items-center gap-2 text-[11px] text-zinc-400 bg-zinc-800/50 rounded-md px-2 py-1.5"
              >
                <span className="flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-medium bg-zinc-700 text-zinc-300 rounded-full">
                  {i + 1}
                </span>
                <span className="truncate">{archivo}</span>
                {pagina && (
                  <span className="text-zinc-500 shrink-0">{pagina}</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Process text to insert citation badges ── */
function processContentWithCitations(
  content: string,
  sources: SourceFragment[]
) {
  // First, handle grouped citations like [2, 3, 4] or [1,2,3] → convert to [2] [3] [4]
  let processed = content.replace(/\[([\d,\s]+)\]/g, (match, inner: string) => {
    const numbers = inner.split(/[,\s]+/).map(s => s.trim()).filter(Boolean)
    if (numbers.length > 1 && numbers.every(n => /^\d+$/.test(n))) {
      return numbers.map(n => `[${n}]`).join(" ")
    }
    return match
  })

  // Then replace individual [1], [2], [3] with citation markers
  processed = processed.replace(/\[(\d+)\]/g, (match, num) => {
    const n = parseInt(num, 10)
    if (n >= 1 && n <= sources.length) {
      return `%%CITE_${n}%%`
    }
    return match
  })

  return processed
}

/* ── Render text nodes and replace citation markers with badges ── */
function TextWithCitations({
  children,
  sources,
}: {
  children: React.ReactNode
  sources: SourceFragment[]
}) {
  if (typeof children !== "string") {
    // If children is an array, process each element
    if (Array.isArray(children)) {
      return (
        <>
          {children.map((child, i) => (
            <TextWithCitations key={i} sources={sources}>
              {child}
            </TextWithCitations>
          ))}
        </>
      )
    }
    return <>{children}</>
  }

  const parts = children.split(/(%%CITE_\d+%%)/g)

  return (
    <>
      {parts.map((part, i) => {
        const citeMatch = part.match(/^%%CITE_(\d+)%%$/)
        if (citeMatch) {
          const num = parseInt(citeMatch[1], 10)
          return (
            <CitationBadge
              key={i}
              number={num}
              source={sources[num - 1]}
            />
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

/* ── Main ChatMessage component ── */
export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"
  const sources = message.sources || []

  const processedContent = useMemo(
    () =>
      sources.length > 0
        ? processContentWithCitations(message.content, sources)
        : message.content,
    [message.content, sources]
  )

  // Create markdown components that inject citation badges
  const markdownComponents = useMemo(
    () => ({
      p: ({ children }: { children?: React.ReactNode }) => (
        <div className="mb-2 last:mb-0">
          <TextWithCitations sources={sources}>{children}</TextWithCitations>
        </div>
      ),
      li: ({ children }: { children?: React.ReactNode }) => (
        <li className="text-sm">
          <TextWithCitations sources={sources}>{children}</TextWithCitations>
        </li>
      ),
      strong: ({ children }: { children?: React.ReactNode }) => (
        <strong className="font-semibold text-white">{children}</strong>
      ),
      em: ({ children }: { children?: React.ReactNode }) => (
        <em className="italic text-zinc-300">{children}</em>
      ),
      ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
      ),
      ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
      ),
      h1: ({ children }: { children?: React.ReactNode }) => (
        <h1 className="text-base font-bold mb-2 mt-3">{children}</h1>
      ),
      h2: ({ children }: { children?: React.ReactNode }) => (
        <h2 className="text-sm font-bold mb-1.5 mt-2">{children}</h2>
      ),
      h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>
      ),
      code: ({
        className,
        children,
        ...props
      }: {
        className?: string
        children?: React.ReactNode
      }) => {
        const isInline = !className
        return isInline ? (
          <code
            className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded text-xs"
            {...props}
          >
            {children}
          </code>
        ) : (
          <code
            className={cn(
              "block bg-zinc-900 p-3 rounded-lg text-xs overflow-x-auto my-2",
              className
            )}
            {...props}
          >
            {children}
          </code>
        )
      },
      pre: ({ children }: { children?: React.ReactNode }) => (
        <pre className="bg-zinc-900 rounded-lg overflow-x-auto my-2">
          {children}
        </pre>
      ),
      blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="border-l-2 border-zinc-500 pl-3 my-2 text-zinc-400 italic">
          {children}
        </blockquote>
      ),
      a: ({
        href,
        children,
      }: {
        href?: string
        children?: React.ReactNode
      }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          {children}
        </a>
      ),
    }),
    [sources]
  )

  return (
    <div
      className={cn(
        "flex items-start gap-3 w-full px-4 mx-auto",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        {isUser ? (
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        ) : (
          <>
            <AvatarImage src="/bot-avatar.png" alt="Bot" />
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {processedContent}
            </ReactMarkdown>
            {(() => {
              const citedNumbers = [...message.content.matchAll(/\[(\d+)\]/g)].map(m => parseInt(m[1], 10))
              const citedSources = [...new Set(citedNumbers)]
                .filter(n => n >= 1 && n <= sources.length)
                .map(n => ({ ...sources[n - 1], _citedAs: n }))
              return citedSources.length > 0 ? <SourcesFooter sources={citedSources} /> : null
            })()}
          </div>
        )}
        {message.timestamp && (
          <span
            className={cn(
              "mt-1 block text-[10px] opacity-70",
              isUser ? "text-right" : "text-left"
            )}
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  )
}
