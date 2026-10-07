"use client"

import React from "react"
import { useApp } from "@/context/AppContext"

export function CategoryNav() {
  const { categories, selectedCategory, setSelectedCategory } = useApp()

  const allCategoryNames = ["Tümü", ...categories.map((c) => c.name)]

  return (
    <div className="w-full overflow-x-auto py-2 no-scrollbar sticky top-[68px] z-30 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md mb-3">
      <div className="flex items-center gap-2 px-1">
        {allCategoryNames.map((catName) => {
          const isActive = selectedCategory === catName
          return (
            <button
              key={catName}
              onClick={() => setSelectedCategory(catName)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-md scale-102 font-semibold"
                  : "bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200/60 dark:border-neutral-800"
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
