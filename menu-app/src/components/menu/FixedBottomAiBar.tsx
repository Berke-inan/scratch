"use client"

import React, { useState } from "react"
import { Sparkles, Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FixedBottomAiBarProps {
  onSendMessage: (query: string) => void
  isTyping?: boolean
}

const QUICK_PROMPTS = [
  "☕ Şekersiz Soğuk Kahve",
  "🌾 Glutensiz Tatlılar",
  "🌱 Vejetaryen Tost",
  "🥛 Sütlü Sıcak Kahve",
  "⚡ Kafeinsiz Kahve",
  "🍫 Tatlı bir şeyler",
]

export function FixedBottomAiBar({
  onSendMessage,
  isTyping = false,
}: FixedBottomAiBarProps) {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || isTyping) return
    onSendMessage(trimmed)
    setQuery("")
  }

  const handlePromptClick = (promptText: string) => {
    const cleaned = promptText.replace(/^[^\s]+\s/, "").trim()
    if (!cleaned || isTyping) return
    onSendMessage(cleaned)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200/80 dark:border-neutral-800/80 px-3 pt-2 pb-3 pb-safe shadow-2xl transition-all">
      <div className="max-w-2xl mx-auto space-y-2">
        {/* 1. Quick Question Pills (Hızlı Sor Hapları) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 shrink-0 select-none">
            Hızlı Sor:
          </span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isTyping}
              onClick={() => handlePromptClick(prompt)}
              className="px-2.5 py-1 text-[11px] font-medium bg-neutral-100 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 dark:bg-neutral-800/90 dark:hover:bg-neutral-800 dark:hover:text-amber-300 text-neutral-700 dark:text-neutral-300 rounded-full whitespace-nowrap transition-all border border-neutral-200/70 dark:border-neutral-700/70 cursor-pointer active:scale-95 disabled:opacity-50 select-none"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* 2. Rounded-Full Modern Input Bar Form */}
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isTyping}
              placeholder="Yapay zekaya sorun (örn: 'şekersiz soğuk kahve', 'vejetaryen tost')..."
              className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm pl-10 pr-4 py-2.5 sm:py-3 rounded-full border border-neutral-200/90 dark:border-neutral-700/80 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-neutral-400 shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={!query.trim() || isTyping}
            className={cn(
              "p-2.5 sm:p-3 rounded-full text-white transition-all shrink-0 flex items-center justify-center shadow-md",
              query.trim() && !isTyping
                ? "bg-amber-600 hover:bg-amber-500 cursor-pointer active:scale-95 shadow-amber-600/30"
                : "bg-neutral-300 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed opacity-60"
            )}
          >
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
