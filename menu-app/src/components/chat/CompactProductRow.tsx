"use client"

import React from "react"
import { ProductDto } from "@/types/menu"
import { ChevronRight } from "lucide-react"
import { getTagBadgeStyle } from "@/components/menu/ProductCard"
import { getSmartProductTags } from "@/utils/tagUtils"

interface CompactProductRowProps {
  product: ProductDto
  userQuery?: string
  onClick: () => void
}

export function CompactProductRow({
  product,
  userQuery = "",
  onClick,
}: CompactProductRowProps) {
  const formattedPrice =
    typeof product.price === "number"
      ? new Intl.NumberFormat("tr-TR", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(product.price)
      : product.price

  // Akıllı Etiket Önceliklendirme (Query Relevance > Diyet > Varsayılan)
  const displayedTags = getSmartProductTags(
    product.tags,
    userQuery,
    product.categoryName
  )

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className="flex items-center justify-between px-3 h-10 sm:h-11 w-full rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 hover:border-amber-500/50 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-all cursor-pointer group shadow-2xs select-none"
    >
      {/* Sol: Ürün Adı + Varsa minik rozetler */}
      <div className="flex items-center gap-1.5 min-w-0 pr-2">
        <span className="text-xs sm:text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {product.name}
        </span>

        {displayedTags.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            {displayedTags.map((tag) => (
              <span
                key={tag}
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium tracking-tight ${getTagBadgeStyle(
                  tag
                )}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Sağ: 95 ₺ | İncele > */}
      <div className="flex items-center gap-1.5 shrink-0 pl-1">
        <span className="text-xs sm:text-[13px] font-bold text-amber-600 dark:text-amber-400 font-mono">
          {formattedPrice} ₺
        </span>
        <span className="text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center group-hover:text-amber-500 transition-colors">
          İncele
          <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  )
}
