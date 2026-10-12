"use client"

import React from "react"
import { useApp } from "@/context/AppContext"

interface CategoryPillsProps {
  onCategorySelect?: (categoryName: string) => void
}

export function CategoryPills({ onCategorySelect }: CategoryPillsProps) {
  const { categories, selectedCategory, setSelectedCategory } = useApp()

  const allCategoryNames = ["Tümü", ...categories.map((c) => c.name)]

  const handleSelect = (catName: string) => {
    setSelectedCategory(catName)
    if (onCategorySelect) {
      onCategorySelect(catName)
    }
  }

  return (
    <div className="sticky top-0 z-30 w-full bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-800/80 py-2.5 px-2">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {allCategoryNames.map((catName) => {
          const isActive = selectedCategory === catName
          return (
            <button
              key={catName}
              onClick={() => handleSelect(catName)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 shadow-xs ${
                isActive
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-md scale-102"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {catName}
            </button>
          )
        })}
      </div>
    </div>
  )
}
