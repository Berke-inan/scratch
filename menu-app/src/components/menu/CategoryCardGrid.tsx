"use client"

import React from "react"
import { CategoryDto, ProductDto } from "@/types/menu"
import {
  ConsolidatedCategory,
  consolidateCategories,
} from "@/lib/categoryUtils"
import {
  Coffee,
  Snowflake,
  GlassWater,
  Cake,
  UtensilsCrossed,
  Utensils,
  ChevronRight,
} from "lucide-react"

interface CategoryCardGridProps {
  categories: CategoryDto[]
  products: ProductDto[]
  onSelectCategory: (category: ConsolidatedCategory) => void
}

interface CategoryMeta {
  icon: React.ElementType
  colorClass: string
  bgGradient: string
  subtitle: string
}

function getCategoryMeta(categoryName: string): CategoryMeta {
  const lower = categoryName.toLowerCase()

  if (lower.includes("sıcak kahve") || lower.includes("sicak kahve")) {
    return {
      icon: Coffee,
      colorClass: "text-amber-500 dark:text-amber-400",
      bgGradient: "from-amber-500/15 via-orange-500/10 to-transparent",
      subtitle: "Espresso, Americano, Latte & Filtre",
    }
  }

  if (lower.includes("soğuk kahve") || lower.includes("soguk kahve")) {
    return {
      icon: Snowflake,
      colorClass: "text-sky-500 dark:text-sky-400",
      bgGradient: "from-sky-500/15 via-blue-500/10 to-transparent",
      subtitle: "Cold Brew, Iced Latte & Frappe",
    }
  }

  if (lower.includes("soğuk içecek") || lower.includes("soguk icecek") || lower.includes("içecek")) {
    return {
      icon: GlassWater,
      colorClass: "text-teal-500 dark:text-teal-400",
      bgGradient: "from-teal-500/15 via-emerald-500/10 to-transparent",
      subtitle: "Doğal Meyve Suyu, Soda & Meşrubat",
    }
  }

  if (lower.includes("tatlı") || lower.includes("tatli") || lower.includes("pasta")) {
    return {
      icon: Cake,
      colorClass: "text-rose-500 dark:text-rose-400",
      bgGradient: "from-rose-500/15 via-pink-500/10 to-transparent",
      subtitle: "San Sebastian, Tiramisu & Kek",
    }
  }

  if (lower.includes("atıştır") || lower.includes("atistir") || lower.includes("mutfak") || lower.includes("tost")) {
    return {
      icon: UtensilsCrossed,
      colorClass: "text-purple-500 dark:text-purple-400",
      bgGradient: "from-purple-500/15 via-violet-500/10 to-transparent",
      subtitle: "Ekşi Maya Tost, Wrap, Bowl & Kruvasan",
    }
  }

  return {
    icon: Utensils,
    colorClass: "text-neutral-500 dark:text-neutral-400",
    bgGradient: "from-neutral-500/15 via-neutral-500/10 to-transparent",
    subtitle: "Özel şef lezzetleri ve sunumlar",
  }
}

export function CategoryCardGrid({
  categories,
  products,
  onSelectCategory,
}: CategoryCardGridProps) {
  // Consolidate categories, merge duplicates & subcategories, and combine product counts
  const consolidatedList = React.useMemo(() => {
    return consolidateCategories(categories, products)
  }, [categories, products])

  return (
    <div className="w-full space-y-3.5 animate-in fade-in duration-300">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            Menü Kategorileri ({consolidatedList.length})
          </h2>
        </div>
        <span className="text-[11px] font-medium text-neutral-400">
          Kategori seçerek ürünleri keşfedin
        </span>
      </div>

      {/* 2-Column Responsive Card Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {consolidatedList.map((cat) => {
          const meta = getCategoryMeta(cat.name)
          const Icon = meta.icon

          return (
            <button
              key={cat.canonicalName}
              onClick={() => onSelectCategory(cat)}
              className="group relative overflow-hidden rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-left shadow-xs hover:shadow-lg hover:border-amber-500/50 dark:hover:border-amber-500/40 transition-all duration-200 active:scale-98 cursor-pointer flex flex-col justify-between min-h-[140px] sm:min-h-[155px]"
            >
              {/* Subtle Ambient Background Gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${meta.bgGradient} opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none`}
              />

              {/* Top Row: Icon and Consolidated Product Count Badge */}
              <div className="relative flex items-start justify-between gap-2 z-10">
                <div
                  className={`w-10 h-10 rounded-xl bg-white/90 dark:bg-neutral-800/90 border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs flex items-center justify-center ${meta.colorClass} group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <span className="text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2.5 py-0.5 rounded-full border border-neutral-200/60 dark:border-neutral-700/60 font-mono tracking-tight">
                  {cat.productCount} Ürün
                </span>
              </div>

              {/* Bottom: Title & Subtitle */}
              <div className="relative mt-3 z-10">
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                  {meta.subtitle}
                </p>

                <div className="mt-2.5 flex items-center text-[11px] font-semibold text-amber-600 dark:text-amber-400 opacity-90 group-hover:opacity-100">
                  <span>Keşfet</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
