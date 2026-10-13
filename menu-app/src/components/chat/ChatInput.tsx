"use client"

import React, { useState } from "react"
import { ChatTheme } from "@/types/chat"
import {
  Send,
  ArrowUp,
  Sparkles,
} from "lucide-react"

interface ChatInputProps {
  theme: ChatTheme
  onSendMessage: (text: string) => void
  disabled?: boolean
}

export function ChatInput({ theme, onSendMessage, disabled }: ChatInputProps) {
  const [input, setInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || disabled) return
    onSendMessage(input.trim())
    setInput("")
  }

  // 1. Modern AI Site Input Bar (ChatGPT / Claude / Gemini)
  if (theme === "ai-chat") {
    return (
      <div className="p-2.5 pb-2 sm:p-3 sm:pb-3 bg-neutral-50/90 dark:bg-neutral-950/90 border-t border-neutral-200/80 dark:border-neutral-800/80 backdrop-blur-md shrink-0">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700/80 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500 transition-all p-1.5"
        >
          <div className="pl-2.5 text-neutral-400">
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Menüden bir şey sorun (örn: şekersiz kahve)..."
            disabled={disabled}
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 px-3 py-2 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className={`p-2 rounded-xl text-white transition-all ${
              input.trim() && !disabled
                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90 shadow-sm cursor-pointer scale-100"
                : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed opacity-60"
            }`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </form>
      </div>
    )
  }

  // 2. WhatsApp Input Bar
  if (theme === "whatsapp") {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 p-2.5 pb-2 sm:pb-2.5 bg-[#F0F2F5] dark:bg-[#202C33] border-t border-neutral-300 dark:border-neutral-800 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Bir mesaj yazın..."
          disabled={disabled}
          className="flex-1 bg-white dark:bg-[#2A3942] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 text-sm px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-0 shadow-xs border border-transparent focus:border-[#00A884]/30 transition-all"
        />

        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className={`p-2.5 rounded-full text-white transition-all shadow-md shrink-0 ${
            input.trim() && !disabled
              ? "bg-[#00A884] hover:bg-[#02906F] scale-100 cursor-pointer"
              : "bg-neutral-400 dark:bg-neutral-700 cursor-not-allowed opacity-60"
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    )
  }

  // 3. iMessage Input Bar
  if (theme === "imessage") {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex items-center p-2.5 pb-2 sm:pb-2.5 bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 shrink-0"
      >
        <div className="flex-1 flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-full px-3.5 py-1.5 border border-neutral-300/60 dark:border-neutral-700/60 focus-within:border-blue-500/50 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="iMessage"
            disabled={disabled}
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className={`p-1.5 rounded-full text-white transition-all ml-1.5 shrink-0 ${
              input.trim() && !disabled
                ? "bg-gradient-to-b from-[#3488FE] to-[#0A6BFF] scale-100 cursor-pointer shadow-xs"
                : "bg-neutral-300 dark:bg-neutral-600 cursor-not-allowed opacity-50"
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    )
  }

  // 4. Samsung One UI Input Bar
  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-3 pb-2 sm:pb-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shrink-0"
    >
      <div className="flex-1 flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-3xl px-4 py-2 border border-neutral-200 dark:border-neutral-700 focus-within:border-[#2C80FF]/50 transition-colors">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Mesaj girin..."
          disabled={disabled}
          className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={!input.trim() || disabled}
        className={`p-2.5 rounded-full text-white transition-all shrink-0 ${
          input.trim() && !disabled
            ? "bg-[#2C80FF] hover:bg-[#1E6FE0] shadow-md cursor-pointer"
            : "bg-neutral-300 dark:bg-neutral-700 opacity-60 cursor-not-allowed"
        }`}
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  )
}
