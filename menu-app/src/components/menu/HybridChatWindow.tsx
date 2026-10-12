"use client"

import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react"
import { ProductDto } from "@/types/menu"
import { ApiClient } from "@/services/apiClient"
import { ProductCard } from "./ProductCard"
import {
  Sparkles,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Bot,
  Utensils,
} from "lucide-react"

export interface HybridMessage {
  id: string
  sender: "user" | "assistant"
  text: string
  timestamp: string
  products?: ProductDto[]
}

export interface HybridChatWindowRef {
  sendMessage: (queryText: string) => Promise<void>
  expand: () => void
  isTyping: boolean
}

export interface HybridChatWindowProps {
  cafeName?: string
  cafeId?: string
  onSelectProduct?: (product: ProductDto) => void
  onAiProductsLoaded?: (products: ProductDto[], query: string) => void
}

export const HybridChatWindow = forwardRef<
  HybridChatWindowRef,
  HybridChatWindowProps
>(function HybridChatWindow(
  {
    cafeName = "Lounge",
    cafeId,
    onSelectProduct,
    onAiProductsLoaded,
  },
  ref
) {
  const [messages, setMessages] = useState<HybridMessage[]>([
    {
      id: "init-welcome",
      sender: "assistant",
      text: `Merhaba! Ben ${cafeName} menü asistanınızım. Diyet, alerjen veya lezzet tercihinizi aşağıdaki alandan yazarak bana sorabilirsiniz. En uygun lezzetleri hemen getireyim!`,
      timestamp: new Date().toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isExpanded) {
      scrollToBottom()
    }
  }, [messages, isTyping, isExpanded])

  const handleSendMessage = async (queryText: string) => {
    const trimmed = queryText.trim()
    if (!trimmed || isTyping) return

    // Ensure window is expanded when sending
    setIsExpanded(true)

    const nowTime = new Date().toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    })

    const userMsg: HybridMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: nowTime,
    }

    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)

    try {
      const searchRes = await ApiClient.searchMenu(trimmed, cafeId)
      const foundProducts = searchRes.products || []

      const assistantMsg: HybridMessage = {
        id: `asst-${Date.now()}`,
        sender: "assistant",
        text: searchRes.message || "Sizin için menümüzden lezzetler seçtim:",
        timestamp: new Date().toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        products: foundProducts,
      }

      setMessages((prev) => [...prev, assistantMsg])

      if (onAiProductsLoaded) {
        onAiProductsLoaded(foundProducts, trimmed)
      }
    } catch (err) {
      console.error("Hybrid search error:", err)
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          text: "Bağlantıda bir sorun oluştu, ancak menüden lezzetleri keşfetmeye devam edebilirsiniz.",
          timestamp: new Date().toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  useImperativeHandle(ref, () => ({
    sendMessage: handleSendMessage,
    expand: () => setIsExpanded(true),
    isTyping,
  }))

  const handleClearChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: "assistant",
        text: `Sohbet temizlendi. Ben ${cafeName} AI Asistanıyım, size nasıl yardımcı olabilirim?`,
        timestamp: new Date().toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ])
  }

  return (
    <div className="w-full bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 shadow-md overflow-hidden mb-5 transition-all">
      {/* 1. Chat Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 text-white flex items-center justify-between border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          {/* Avatar with Online Indicator */}
          <div className="relative">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-neutral-900 rounded-full animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white">
                {cafeName} AI Asistanı
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium px-1.5 py-0.2 rounded-full">
                Çevrimiçi
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Yapay Zeka Destekli Akıllı Menü Asistanı
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Clear Chat Button */}
          <button
            onClick={handleClearChat}
            title="Sohbeti Temizle"
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-300 hover:text-white transition-colors cursor-pointer border border-neutral-700/60"
          >
            <Trash2 className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Temizle</span>
          </button>

          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            title={isExpanded ? "Sohbeti Daralt" : "Sohbeti Genişlet"}
            className="p-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-300 hover:text-white transition-colors cursor-pointer border border-neutral-700/60"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Body */}
      {isExpanded ? (
        <div className="flex flex-col animate-in fade-in duration-200">
          {/* Message History Box */}
          <div className="p-3.5 sm:p-4 space-y-3 max-h-[340px] sm:max-h-[380px] overflow-y-auto no-scrollbar bg-neutral-50/50 dark:bg-neutral-950/40">
            {messages.map((msg) => {
              const isUser = msg.sender === "user"

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isUser ? "items-end" : "items-start"
                  } animate-in fade-in slide-in-from-bottom-1 duration-150`}
                >
                  {/* Chat Bubble */}
                  <div
                    className={`max-w-[88%] sm:max-w-[82%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                      isUser
                        ? "bg-amber-600 text-white rounded-tr-xs font-medium"
                        : "bg-white dark:bg-neutral-800/95 text-neutral-800 dark:text-neutral-100 rounded-tl-xs border border-neutral-200/80 dark:border-neutral-700/70"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Menü Danışmanı</span>
                      </div>
                    )}

                    <p className="whitespace-pre-line">{msg.text}</p>

                    <div
                      className={`text-[10px] mt-1 text-right ${
                        isUser
                          ? "text-amber-200/90"
                          : "text-neutral-400 dark:text-neutral-500"
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {/* Product Integration: Horizontal Scrollable Mini Cards */}
                  {!isUser && msg.products && msg.products.length > 0 && (
                    <div className="w-full mt-2.5 pl-1">
                      <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                        <Utensils className="w-3 h-3 text-amber-500" />
                        <span>Önerilen Menü Lezzetleri ({msg.products.length}):</span>
                      </div>

                      <div className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5 no-scrollbar">
                        {msg.products.map((p) => (
                          <ProductCard
                            key={p.id}
                            product={{
                              id: p.id,
                              name: p.name,
                              description: p.description || "",
                              price: p.price,
                              currency: "₺",
                              tags: p.tags,
                            }}
                            compact={true}
                            onClick={() => onSelectProduct && onSelectProduct(p)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-neutral-500 bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 px-3.5 py-2 rounded-2xl rounded-tl-xs w-fit shadow-xs animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  {cafeName} AI menüyü tarıyor...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      ) : (
        /* Collapsed Minimalist Bar */
        <div
          onClick={() => setIsExpanded(true)}
          className="p-3 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <span>
              Sohbet simge durumunda ({messages.length} mesaj). Sorularınız için tıklayın.
            </span>
          </div>
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            Genişlet <ChevronDown className="w-3.5 h-3.5" />
          </span>
        </div>
      )}
    </div>
  )
})
