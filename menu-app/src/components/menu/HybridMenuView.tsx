"use client"

import React from "react"
import { useApp } from "@/context/AppContext"
import { MenuHeader } from "./MenuHeader"
import { CategoryNav } from "./CategoryNav"
import { ProductCard } from "./ProductCard"
import { AiSearchDrawer } from "./AiSearchDrawer"
import { Sparkles, Utensils } from "lucide-react"

export function HybridMenuView() {
  const { products, selectedCategory, setIsDrawerOpen } = useApp()

  const displayedProducts =
    selectedCategory === "Tümü"
      ? products
      : products.filter(
          (p) => p.categoryName.toLowerCase() === selectedCategory.toLowerCase()
        )

  return (
    <div className="w-full max-w-xl mx-auto pb-28 relative">
      {/* Restaurant QR Menu Header */}
      <MenuHeader />

      {/* Category Navigation Pills */}
      <CategoryNav />

      {/* Products Grid / Feed */}
      <div className="space-y-3 px-1">
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <Utensils className="w-3.5 h-3.5" />
            <span>{selectedCategory} ({displayedProducts.length})</span>
          </div>
        </div>

        {displayedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayedProducts.map((product) => (
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
          <div className="text-center py-12 text-neutral-400 text-sm">
            Bu kategoride henüz ürün bulunmuyor.
          </div>
        )}
      </div>

      {/* Floating Bottom Action Bar for AI Search Drawer */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="w-full bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-medium text-sm py-3.5 px-5 rounded-2xl shadow-xl flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-98 border border-amber-400/30"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
            <span className="font-semibold">AI Menü Asistanına Sor</span>
          </div>
          <span className="text-xs bg-amber-900/60 px-2.5 py-1 rounded-full border border-amber-400/20 text-amber-200">
            Çekmeceyi Aç ⌃
          </span>
        </button>
      </div>

      {/* Bottom Drawer Modal */}
      <AiSearchDrawer />
    </div>
  )
}
