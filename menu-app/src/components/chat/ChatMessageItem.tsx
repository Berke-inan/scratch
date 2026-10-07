"use client"

import React, { useState } from "react"
import { ChatMessage, ChatTheme } from "@/types/chat"
import { ProductCard } from "@/components/menu/ProductCard"
import { Check, CheckCheck, Sparkles, Copy, CheckCheck as CopiedIcon, ThumbsUp, ThumbsDown } from "lucide-react"

interface ChatMessageItemProps {
  message: ChatMessage
  theme: ChatTheme
}

export function ChatMessageItem({ message, theme }: ChatMessageItemProps) {
  const isUser = message.sender === "user"
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard?.writeText(message.text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Modern AI Site Style (ChatGPT / Claude / Gemini)
  if (theme === "ai-chat") {
    if (isUser) {
      return (
        <div className="flex justify-end my-2">
          <div className="max-w-[85%] bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-4 py-2.5 rounded-3xl text-sm shadow-xs border border-neutral-200 dark:border-neutral-700">
            <p className="whitespace-pre-wrap">{message.text}</p>
            <span className="block text-right text-[10px] text-neutral-400 mt-1">
              {message.timestamp}
            </span>
          </div>
        </div>
      )
    }

    // Assistant Message (Claude / Gemini Style)
    return (
      <div className="flex items-start gap-2.5 my-3 w-full animate-in fade-in duration-200">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
          <Sparkles className="w-4 h-4 text-white" />
        </div>

        <div className="flex-1 space-y-2 max-w-[92%]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Menü Asistanı
            </span>
            <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-md font-medium border border-purple-500/20">
              Gemini AI
            </span>
            <span className="text-[10px] text-neutral-400 ml-auto">
              {message.timestamp}
            </span>
          </div>

          <div className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-900/90 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
            <p className="whitespace-pre-wrap">{message.text}</p>

            {/* Quick Actions (Copy, Feedback) */}
            <div className="flex items-center gap-3 text-neutral-400 text-xs pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800/80">
              <button
                onClick={handleCopy}
                className="hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-1 cursor-pointer transition-colors"
              >
                {isCopied ? (
                  <>
                    <CopiedIcon className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[11px] text-emerald-500">Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Kopyala</span>
                  </>
                )}
              </button>
              <button className="hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5 cursor-pointer">
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button className="hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5 cursor-pointer">
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Embedded Products Grid */}
          {message.products && message.products.length > 0 && (
            <div className="w-full mt-2.5 space-y-2">
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-1">
                Eşleşen Menü Lezzetleri ({message.products.length}):
              </div>
              <div className="grid grid-cols-1 gap-2">
                {message.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      name: product.name,
                      description: product.description || "",
                      price: product.price,
                      currency: "₺",
                      tags: product.tags,
                    }}
                    className="bg-white dark:bg-neutral-900/95 border-neutral-200 dark:border-neutral-800 shadow-sm"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Messenger-Style Themes (WhatsApp, iMessage, One UI)
  const getBubbleStyle = () => {
    switch (theme) {
      case "whatsapp":
        return isUser
          ? "bg-[#D9FDD3] dark:bg-[#005C4B] text-neutral-900 dark:text-neutral-100 rounded-2xl rounded-tr-xs shadow-xs"
          : "bg-white dark:bg-[#202C33] text-neutral-900 dark:text-neutral-100 rounded-2xl rounded-tl-xs shadow-xs"

      case "imessage":
        return isUser
          ? "bg-gradient-to-b from-[#3488FE] to-[#0A6BFF] text-white rounded-2xl rounded-br-sm shadow-md"
          : "bg-[#E5E5EA] dark:bg-[#2C2C2E] text-neutral-900 dark:text-neutral-100 rounded-2xl rounded-bl-sm shadow-xs"

      case "oneui":
      default:
        return isUser
          ? "bg-[#2C80FF] text-white rounded-3xl rounded-br-lg shadow-sm"
          : "bg-[#F1F3F5] dark:bg-[#2A2B30] text-neutral-900 dark:text-neutral-100 rounded-3xl rounded-bl-lg shadow-xs"
    }
  }

  return (
    <div
      className={`flex flex-col my-1.5 transition-all duration-150 ${
        isUser ? "items-end" : "items-start"
      }`}
    >
      <div
        className={`max-w-[85%] sm:max-w-[75%] px-3.5 py-2.5 text-sm leading-relaxed relative ${getBubbleStyle()}`}
      >
        <p className="whitespace-pre-wrap select-text">{message.text}</p>

        <div
          className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${
            isUser
              ? theme === "whatsapp"
                ? "text-neutral-600 dark:text-neutral-300"
                : "text-white/80"
              : "text-neutral-400 dark:text-neutral-400"
          }`}
        >
          <span>{message.timestamp}</span>

          {isUser && theme === "whatsapp" && (
            <span className="text-[#53BDEB] inline-flex items-center ml-0.5">
              <CheckCheck className="w-3.5 h-3.5" />
            </span>
          )}

          {isUser && theme !== "whatsapp" && (
            <span className="opacity-70">
              <Check className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      {/* Embedded Products Carousel/Grid when AI returns products */}
      {message.products && message.products.length > 0 && (
        <div className="w-full max-w-sm sm:max-w-md mt-2 space-y-2">
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 px-1">
            Önerilen Ürünler ({message.products.length}):
          </div>
          <div className="grid grid-cols-1 gap-2">
            {message.products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  description: product.description || "",
                  price: product.price,
                  currency: "₺",
                  tags: product.tags,
                }}
                className="bg-white/95 dark:bg-neutral-900/95 border-neutral-200 dark:border-neutral-800 shadow-sm"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
