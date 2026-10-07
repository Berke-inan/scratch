"use client"

import React, { useState } from "react"
import { ChatTheme } from "@/types/chat"
import {
  Send,
  Smile,
  Paperclip,
  Plus,
  ArrowUp,
  Camera,
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
      <div className="p-3 bg-neutral-50/90 dark:bg-neutral-950/90 border-t border-neutral-200/80 dark:border-neutral-800/80 backdrop-blur-md">
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

        <p className="text-[10px] text-center text-neutral-400 dark:text-neutral-400 mt-1.5 select-none">
          Yapay zeka menü içeriklerini filtreler • Alerjilerinizi lütfen garsona bildiriniz.
        </p>
      </div>
    )
  }

  // 2. WhatsApp Input Bar
  if (theme === "whatsapp") {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-1.5 p-2 bg-[#F0F2F5] dark:bg-[#202C33] border-t border-neutral-300 dark:border-neutral-800"
      >
        <button
          type="button"
          className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
        >
          <Smile className="w-5 h-5" />
        </button>
        <button
          type="button"
          className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Bir mesaj yazın..."
          disabled={disabled}
          className="flex-1 bg-white dark:bg-[#2A3942] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-0 shadow-xs"
        />

        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className={`p-2.5 rounded-full text-white transition-all shadow-md ${
            input.trim()
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
        className="flex items-center gap-2 p-2.5 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800"
      >
        <button
          type="button"
          className="p-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-full px-3 py-1.5 border border-neutral-300/60 dark:border-neutral-700/60">
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
            className={`p-1 rounded-full text-white transition-all ml-1 ${
              input.trim()
                ? "bg-gradient-to-b from-[#3488FE] to-[#0A6BFF] scale-100 cursor-pointer"
                : "bg-neutral-300 dark:bg-neutral-600 cursor-not-allowed opacity-50"
            }`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </form>
    )
  }

  // 4. Samsung One UI Input Bar
  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800"
    >
      <button
        type="button"
        className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
      >
        <Camera className="w-5 h-5" />
      </button>

      <div className="flex-1 flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-3xl px-4 py-2 border border-neutral-200 dark:border-neutral-700">
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
        className={`p-2.5 rounded-full text-white transition-all ${
          input.trim()
            ? "bg-[#2C80FF] hover:bg-[#1E6FE0] shadow-md cursor-pointer"
            : "bg-neutral-300 dark:bg-neutral-700 opacity-60 cursor-not-allowed"
        }`}
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  )
}
