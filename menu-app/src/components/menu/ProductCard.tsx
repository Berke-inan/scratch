import * as React from "react"
import { cn } from "@/lib/utils"

export interface Product {
  id?: string | number
  name: string
  description?: string | null
  price: number | string
  currency?: string
  tags?: string[]
}

export interface ProductCardProps {
  product: Product
  className?: string
  compact?: boolean
  onClick?: () => void
}

/**
 * Returns color-coded badge styles for dietary, allergen and temperature tags.
 */
export function getTagBadgeStyle(tag: string): string {
  const lower = tag.toLowerCase().trim()

  // 1. SECONDARY (Kullanıcı Tercihleri & Diyet):
  // Vegan / Vejetaryen -> Soft pastel yeşil / zümrüt tonları
  if (lower.includes("vegan") || lower.includes("vejetaryen") || lower.includes("vejeteryan")) {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
  }

  // Glutensiz / Şekersiz / Laktozsuz -> Soft açık mavi / gök mavisi tonları
  if (
    lower.includes("glutensiz") ||
    lower.includes("glütensiz") ||
    lower.includes("şekersiz") ||
    lower.includes("sekersiz") ||
    lower.includes("laktozsuz")
  ) {
    return "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60"
  }

  // 2. TERTIARY / MUTED (İçerik, Alerjen ve Durum Bilgisi - Nötr Arka Plan):
  // Sıcaklık belirteçleri: "Sıcak" / "Soğuk" -> Tamamen nötr slate/gri
  if (
    lower.includes("sıcak") ||
    lower.includes("sicak") ||
    lower.includes("soğuk") ||
    lower.includes("soguk")
  ) {
    return "bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
  }

  // Alerjen/İçerik Bilgisi ("Süt Ürünü İçerir", "Glüten İçerir", "Yumurta İçerir", vb.)
  // Hafif sıcak-gri veya çok soft taş/stone tonları (kesinlikle sarı/turuncu/amber yok)
  return "bg-stone-100 text-stone-600 dark:bg-stone-800/80 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60"
}

function getTagPriority(tag: string): number {
  const lower = tag.toLowerCase()
  if (lower.includes("vegan") || lower.includes("vejetaryen") || lower.includes("vejeteryan")) return 1
  if (
    lower.includes("glutensiz") ||
    lower.includes("glütensiz") ||
    lower.includes("şekersiz") ||
    lower.includes("sekersiz") ||
    lower.includes("laktozsuz")
  ) return 2
  if (lower.includes("sıcak") || lower.includes("soğuk") || lower.includes("sicak") || lower.includes("soguk")) return 3
  return 4
}

export function ProductCard({ product, className, compact = false, onClick }: ProductCardProps) {
  const { name, description, price, currency = "₺", tags = [] } = product

  const sortedTags = React.useMemo(() => {
    return [...tags].sort((a, b) => getTagPriority(a) - getTagPriority(b))
  }, [tags])

  const formattedPrice =
    typeof price === "number"
      ? new Intl.NumberFormat("tr-TR", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(price)
      : price

  // Compact card layout for horizontal scrollable mini product cards (in chat responses)
  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "w-60 shrink-0 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 shadow-xs hover:shadow-md hover:border-amber-500/40 transition-all duration-200 flex flex-col justify-between group select-none text-left",
          onClick && "cursor-pointer active:scale-98",
          className
        )}
      >
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {name}
            </h4>
            {/* Primary Focus: Price badge */}
            <span className="shrink-0 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-200/60 dark:border-amber-800/60 font-mono">
              {formattedPrice} {currency}
            </span>
          </div>

          {description && (
            <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {sortedTags && sortedTags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1 pt-1.5 border-t border-neutral-100 dark:border-neutral-800/60">
            {sortedTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={cn(
                  "rounded-md text-[10px] px-1.5 py-0.5 font-medium tracking-tight",
                  getTagBadgeStyle(tag)
                )}
              >
                {tag}
              </span>
            ))}
            {sortedTags.length > 3 && (
              <span className="text-[10px] text-neutral-400 font-mono">
                +{sortedTags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  // Standard full card layout for Category drill-down grid
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-neutral-200/80 dark:border-neutral-800/90 bg-white dark:bg-neutral-900/90 p-4 shadow-xs hover:shadow-md hover:border-amber-500/40 transition-all duration-200 flex flex-col justify-between group",
        onClick && "cursor-pointer active:scale-[0.99]",
        className
      )}
    >
      <div>
        {/* Header: Title and PRIMARY Focus Price Badge */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {name}
          </h3>
          <span className="shrink-0 text-xs sm:text-sm font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-xl border border-amber-200/60 dark:border-amber-800/60 font-mono tracking-tight shadow-xs">
            {formattedPrice} {currency}
          </span>
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400 line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* Secondary (Diet/Lifestyle) & Tertiary (Allergens/Temp) Badges */}
      {sortedTags && sortedTags.length > 0 && (
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/70">
          {sortedTags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "rounded-lg text-[11px] px-2 py-0.5 font-medium tracking-tight shadow-2xs",
                getTagBadgeStyle(tag)
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
