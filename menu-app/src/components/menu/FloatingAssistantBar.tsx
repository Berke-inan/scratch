"use client"

import React, { useState } from "react"
import { Sparkles, Send, Loader2 } from "lucide-react"

interface FloatingAssistantBarProps {
  onSearch: (query: string) => void
  isSearching?: boolean
}

export function FloatingAssistantBar({
  onSearch,
  isSearching = false,
}: FloatingAssistantBarProps) {
  const [query, setQuery] = useState("")

  const promptChips = [
    "Şekersiz ne var?",
    "Sıcak kahve öner",
    "Glutensiz seçenekler",
    "Tatlı bir şeyler",
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isSearching) return
    onSearch(query.trim())
    setQuery("")
  }

  const handleChipClick = (chip: string) => {
    setQuery(chip)
    onSearch(chip)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md border-t border-neutral-200/80 dark:border-neutral-800/80 p-3 shadow-2xl">
      <div className="max-w-xl mx-auto space-y-2">
        {/* Quick Prompt Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isSearching}
              onClick={() => handleChipClick(chip)}
              className="px-3 py-1 text-[11px] font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full whitespace-nowrap transition-colors border border-neutral-200/60 dark:border-neutral-700/60 cursor-pointer disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar Form */}
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <div className="absolute left-3 text-amber-500">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isSearching}
            placeholder="Yapay zekaya menüden sorun (örn: sıcak şekerli kahve)..."
            className="w-full bg-neutral-100/90 dark:bg-neutral-800/90 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm pl-9 pr-11 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-neutral-400"
          />

          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className={`absolute right-1.5 p-2 rounded-xl text-white transition-all ${
              query.trim() && !isSearching
                ? "bg-amber-600 hover:bg-amber-500 shadow-sm cursor-pointer scale-100"
                : "bg-neutral-300 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed opacity-50"
            }`}
          >
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
