import { Bot } from 'lucide-react'
import React from 'react'

export default function Header() {
  return (
           <header className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-foreground truncate">Koa</h1>
            <p className="text-xs text-muted-foreground truncate">Inteligencia Artificial</p>
        </div>
        </header>
  )
}
