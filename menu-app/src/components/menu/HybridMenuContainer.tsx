"use client"

import React, { useState, useRef } from "react"
import { useApp } from "@/context/AppContext"
import { MenuHeader } from "./MenuHeader"
import { CategoryCardGrid } from "./CategoryCardGrid"
import { HybridChatWindow, HybridChatWindowRef } from "./HybridChatWindow"
import { FixedBottomAiBar } from "./FixedBottomAiBar"
import { ProductCard } from "./ProductCard"
import { ProductDto } from "@/types/menu"
import {
  ConsolidatedCategory,
  consolidateCategories,
  getCanonicalCategoryName,
} from "@/lib/categoryUtils"
import {
  ArrowLeft,
  Utensils,
  Coffee,
  Snowflake,
  GlassWater,
  Cake,
  UtensilsCrossed,
  AlertCircle,
  Sparkles,
  X,
} from "lucide-react"

function getCategoryIcon(catName: string) {
  const lower = catName.toLowerCase()
  if (lower.includes("sıcak kahve") || lower.includes("sicak kahve")) return Coffee
  if (lower.includes("soğuk kahve") || lower.includes("soguk kahve")) return Snowflake
  if (lower.includes("içecek") || lower.includes("icecek")) return GlassWater
  if (lower.includes("tatlı") || lower.includes("tatli") || lower.includes("pasta")) return Cake
  if (lower.includes("atıştır") || lower.includes("atistir") || lower.includes("mutfak")) return UtensilsCrossed
  return Utensils
}

export function HybridMenuContainer() {
  const { categories, products, activeCafe } = useApp()
  const chatRef = useRef<HybridChatWindowRef>(null)

  const [selectedCategory, setSelectedCategory] = useState<ConsolidatedCategory | null>(null)
  const [aiFilteredProducts, setAiFilteredProducts] = useState<ProductDto[] | null>(null)
  const [aiQuery, setAiQuery] = useState<string>("")
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false)

  // Compute consolidated categories and their products
  const consolidatedList = React.useMemo(() => {
    return consolidateCategories(categories, products)
  }, [categories, products])

  // Handle AI Search Products Response
  const handleAiProductsLoaded = (loadedProducts: ProductDto[], query: string) => {
    setAiFilteredProducts(loadedProducts)
    setAiQuery(query)
    // If a category was open, reset it so AI results are front and center
    setSelectedCategory(null)
  }

  // Forward message from Fixed Bottom AI Bar to the Chat Window
  const handleSendMessage = async (queryText: string) => {
    if (!chatRef.current) return
    setIsAiTyping(true)
    try {
      await chatRef.current.sendMessage(queryText)
    } finally {
      setIsAiTyping(false)
    }
  }

  // Handle product click from mini chat cards
  const handleProductSelectFromChat = (product: ProductDto) => {
    const canonicalName = getCanonicalCategoryName(product.categoryName || "")
    const found = consolidatedList.find(
      (c) =>
        c.canonicalName.toLowerCase() === canonicalName.toLowerCase() ||
        c.aliasCategoryIds.includes(product.categoryId)
    )
    if (found) {
      setSelectedCategory(found)
      setAiFilteredProducts(null)
    }
  }

  const ActiveIcon = selectedCategory ? getCategoryIcon(selectedCategory.name) : Utensils

  return (
    <div className="w-full max-w-2xl mx-auto pb-32 sm:pb-36 relative animate-in fade-in duration-200">
      {/* 1. Cafe Profile & Visual Hero Banner */}
      <MenuHeader />

      {/* 2. Embedded Real AI Chat Window */}
      <HybridChatWindow
        ref={chatRef}
        cafeName={activeCafe?.name || "Lounge Box Kitchen"}
        cafeId={activeCafe?.id}
        onSelectProduct={handleProductSelectFromChat}
        onAiProductsLoaded={handleAiProductsLoaded}
      />

      {/* 3. Dynamic AI Search Results View (If AI returned search results) */}
      {aiFilteredProducts !== null && (
        <div className="w-full mb-6 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* AI Filter Header Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold tracking-tight">
                    Yapay Zeka Önerileri: &quot;{aiQuery}&quot;
                  </h3>
                  <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full font-mono">
                    {aiFilteredProducts.length} Ürün
                  </span>
                </div>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                  Tercihinize en uygun menü lezzetleri listelendi
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setAiFilteredProducts(null)
                setAiQuery("")
              }}
              title="Filtreyi Temizle"
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <X className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Temizle</span>
            </button>
          </div>

          {/* AI Recommended Product Grid */}
          {aiFilteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {aiFilteredProducts.map((product) => (
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
                />
              ))}
            </div>
          ) : (
            <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 text-center text-xs text-neutral-500">
              Bu kritere uygun ürün bulunamadı. Lütfen farklı bir arama deneyin veya kategorilerden seçim yapın.
            </div>
          )}
        </div>
      )}

      {/* 4. Menu Navigation: Category Cards Grid OR Category Drill-Down View */}
      {!selectedCategory ? (
        /* A) 2-Column Responsive Category Cards Grid */
        <CategoryCardGrid
          categories={categories}
          products={products}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat)
            setAiFilteredProducts(null)
          }}
        />
      ) : (
        /* B) Drill-Down Navigation View for the Selected Category */
        <div className="w-full space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between p-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer active:scale-95 group"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-500 group-hover:-translate-x-0.5 transition-transform" />
              <span>← Tüm Kategoriler</span>
            </button>

            <div className="flex items-center gap-1.5 pr-2">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/60 font-mono">
                {selectedCategory.products.length} Ürün
              </span>
            </div>
          </div>

          {/* Category Title Header Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 text-white border border-neutral-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <ActiveIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  {selectedCategory.name}
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Özenle hazırlanan taze içerikler ve gurme sunumlar
                </p>
              </div>
            </div>

            <span className="text-xs text-neutral-400 hidden sm:inline font-mono">
              {selectedCategory.products.length} Çeşit
            </span>
          </div>

          {/* Product Cards List */}
          {selectedCategory.products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {selectedCategory.products.map((product) => (
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
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 text-neutral-500 text-xs flex flex-col items-center">
              <AlertCircle className="w-8 h-8 text-neutral-400 mb-2" />
              <p className="font-semibold text-neutral-700 dark:text-neutral-300">
                Bu kategoride şu an kayıtlı ürün bulunmuyor.
              </p>
              <button
                onClick={() => setSelectedCategory(null)}
                className="mt-3 px-4 py-1.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold cursor-pointer"
              >
                Tüm Kategorilere Dön
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. Fixed Sticky Bottom AI Input Bar */}
      <FixedBottomAiBar
        onSendMessage={handleSendMessage}
        isTyping={isAiTyping}
      />
    </div>
  )
}
