"use client"

import React, { useState } from "react"
import { useApp } from "@/context/AppContext"
import { ProductCard } from "./ProductCard"
import { X, Sparkles, Send, Loader2, RefreshCw } from "lucide-react"

export function AiSearchDrawer() {
  const { isDrawerOpen, setIsDrawerOpen, sendMessage, messages, isTyping } = useApp()
  const [query, setQuery] = useState("")

  if (!isDrawerOpen) return null

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isTyping) return
    sendMessage(query.trim())
    setQuery("")
  }

  // Find the latest assistant message with products
  const lastAssistantMsg = [...messages].reverse().find((m) => m.sender === "assistant")

  const suggestionChips = [
    "Şekersiz kahve öner",
    "Glutensiz tatlılar",
    "Sıcak çikolata ve kek",
    "En çok satanlar",
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-0 sm:p-4 animate-in fade-in">
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Akıllı Menü Asistanı
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Doğal dille menüyü filtreleyin veya öneri alın
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Query Form */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Örn: Bana şekersiz bir kahve öner..."
                className="w-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm px-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <button
              type="submit"
              disabled={!query.trim() || isTyping}
              className={`p-2.5 rounded-2xl text-white transition-all ${
                query.trim() && !isTyping
                  ? "bg-amber-600 hover:bg-amber-500 shadow-md cursor-pointer"
                  : "bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed opacity-60"
              }`}
            >
              {isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* Quick Suggestions Chips */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar py-0.5">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(chip)
                  sendMessage(chip)
                }}
                className="text-[11px] bg-white dark:bg-neutral-800 hover:bg-amber-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors active:scale-95"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isTyping && (
            <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mb-2" />
              <p className="text-xs">Yapay zeka menüden en uygun ürünleri seçiyor...</p>
            </div>
          )}

          {!isTyping && lastAssistantMsg && (
            <div>
              {/* AI Explanation Banner */}
              <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 rounded-2xl text-xs text-neutral-800 dark:text-neutral-200 mb-3 leading-relaxed flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>{lastAssistantMsg.text}</span>
              </div>

              {/* Matched Products */}
              {lastAssistantMsg.products && lastAssistantMsg.products.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-1">
                    Eşleşen Ürünler ({lastAssistantMsg.products.length})
                  </div>
                  {lastAssistantMsg.products.map((p) => (
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
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 px-4 bg-neutral-50/60 dark:bg-neutral-800/40 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
                  💡 Menüden ürün bulmak için örneğin <span className="text-amber-600 dark:text-amber-400 font-medium">"şekersiz kahve"</span>, <span className="text-amber-600 dark:text-amber-400 font-medium">"çikolatalı tatlı"</span> veya <span className="text-amber-600 dark:text-amber-400 font-medium">"sıcak atıştırmalık"</span> yazabilirsiniz.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
