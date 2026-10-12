"use client"

import React, { useEffect, useRef } from "react"
import { useApp } from "@/context/AppContext"
import { ChatMessageItem } from "./ChatMessageItem"
import { ChatInput } from "./ChatInput"
import {
  Sparkles,
  Bot,
} from "lucide-react"

export function ChatWindow() {
  const { messages, theme, activeCafe, sendMessage, isTyping } = useApp()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Header per theme
  const renderHeader = () => {
    if (theme === "whatsapp") {
      return (
        <div className="flex items-center px-4 py-3 bg-[#075E54] dark:bg-[#1F2C34] text-white shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-400/40 shadow-xs">
                <Bot className="w-5 h-5 text-emerald-200" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#075E54]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight truncate">
                {activeCafe?.name || "Kafe Asistanı"}
              </span>
              <span className="text-[11px] text-emerald-200/90 leading-tight">çevrimiçi</span>
            </div>
          </div>
        </div>
      )
    }

    if (theme === "imessage") {
      return (
        <div className="flex flex-col items-center justify-center px-4 py-2.5 bg-neutral-100/85 dark:bg-neutral-900/85 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800 z-10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shadow-sm mb-1">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
            {activeCafe?.name || "Menü Asistanı"}
          </span>
          <span className="text-[10px] text-neutral-400 leading-tight mt-0.5">
            iMessage
          </span>
        </div>
      )
    }

    if (theme === "oneui") {
      return (
        <div className="px-5 py-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 z-10">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-tight">
            {activeCafe?.name || "Akıllı Menü Asistanı"}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Yapay Zeka Destekli Masadan Sipariş & Menü
          </p>
        </div>
      )
    }

    // Modern AI (ChatGPT / Claude / Gemini Style - Default)
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 z-10 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 text-white flex items-center justify-center text-xs font-bold shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {activeCafe?.name || "Lounge Box Kitchen"} AI
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-1.5 py-0.2 rounded-full border border-emerald-500/20">
                Canlı
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">Akıllı Menü Asistanı</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium">
            Gemini AI
          </span>
        </div>
      </div>
    )
  }

  // Background style per theme
  const getContainerBg = () => {
    switch (theme) {
      case "whatsapp":
        return "bg-[#EFEAE2] dark:bg-[#0B141A]"
      case "imessage":
        return "bg-neutral-50 dark:bg-neutral-950"
      case "oneui":
        return "bg-[#F8F9FA] dark:bg-[#1C1D21]"
      case "ai-chat":
      default:
        return "bg-[#FDFBF7] dark:bg-neutral-950"
    }
  }

  return (
    <div
      className={`flex flex-col h-[680px] max-h-[82vh] w-full max-w-md mx-auto rounded-3xl overflow-hidden border border-neutral-300 dark:border-neutral-800 shadow-2xl transition-colors duration-200 ${getContainerBg()}`}
    >
      {/* Platform Header */}
      {renderHeader()}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} message={msg} theme={theme} />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-1.5 py-2 px-3 bg-neutral-200/80 dark:bg-neutral-800/80 rounded-2xl w-fit my-1">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:0.4s]" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <ChatInput
        theme={theme}
        onSendMessage={sendMessage}
        disabled={isTyping}
      />
    </div>
  )
}
