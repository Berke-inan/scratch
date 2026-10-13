"use client"

import React, { useEffect, useRef } from "react"
import { ProductDto } from "@/types/menu"
import { X, Sparkles, Check } from "lucide-react"
import { getTagBadgeStyle } from "@/components/menu/ProductCard"

interface ProductDetailBottomSheetProps {
  products: ProductDto[]
  initialSelectedProductId?: string | number | null
  onClose: () => void
}

export function ProductDetailBottomSheet({
  products,
  initialSelectedProductId,
  onClose,
}: ProductDetailBottomSheetProps) {
  const selectedRef = useRef<HTMLDivElement>(null)

  // ESC tuşuna basıldığında ve body scroll kilidi
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    // Seçilen ürüne otomatik kaydır
    if (selectedRef.current) {
      setTimeout(() => {
        selectedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center">
      {/* Karartma Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 cursor-pointer"
        aria-hidden="true"
      />

      {/* Alt Çekmece (Bottom Sheet) */}
      <div
        className="relative z-10 w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-3xl border-t border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Önerilen Ürün Detayları"
      >
        {/* Çekmece Üst Tutamaç */}
        <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto mt-3 mb-1 shrink-0" />

        {/* Çekmece Başlığı */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 dark:border-neutral-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                Önerilen Menü Lezzetleri
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Toplam {products.length} seçenek listelendi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ürün Detay Kartları Listesi */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
          {products.map((product) => {
            const isSelected = initialSelectedProductId && String(product.id) === String(initialSelectedProductId)
            const formattedPrice =
              typeof product.price === "number"
                ? new Intl.NumberFormat("tr-TR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  }).format(product.price)
                : product.price

            return (
              <div
                key={product.id}
                ref={isSelected ? selectedRef : null}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isSelected
                    ? "border-amber-500/80 bg-amber-50/30 dark:bg-amber-950/30 ring-2 ring-amber-500/20 shadow-sm"
                    : "border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/60 hover:border-neutral-300 dark:hover:border-neutral-700"
                }`}
              >
                {/* Ürün Adı & Fiyat */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                        {product.name}
                      </h4>
                      {isSelected && (
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-900/40 px-1.5 py-0.2 rounded-md">
                          Seçildi
                        </span>
                      )}
                    </div>
                    {product.categoryName && (
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
                        {product.categoryName}
                      </span>
                    )}
                  </div>

                  <span className="shrink-0 text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-200/70 dark:border-amber-800/70 font-mono shadow-2xs">
                    {formattedPrice} ₺
                  </span>
                </div>

                {/* Açıklama */}
                {product.description && (
                  <p className="text-xs sm:text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300 mt-2">
                    {product.description}
                  </p>
                )}

                {/* Etiketler (Diyet / Alerjen) */}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-neutral-200/60 dark:border-neutral-800/60">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md font-medium tracking-tight ${getTagBadgeStyle(
                          tag
                        )}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Alt Sabit Kapat Butonu */}
        <div className="p-3.5 border-t border-neutral-100 dark:border-neutral-800/80 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold text-xs sm:text-sm hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Sohbete Dön</span>
          </button>
        </div>
      </div>
    </div>
  )
}
