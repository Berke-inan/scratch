"use client"

import React from "react"
import { useApp } from "@/context/AppContext"
import { MessageSquare, LayoutGrid } from "lucide-react"

export function ModeSwitcher() {
  const { mode, setMode } = useApp()

  return (
    <div className="flex items-center bg-neutral-900/90 dark:bg-neutral-900/95 p-1 rounded-full border border-neutral-700/60 shadow-lg backdrop-blur-md">
      <button
        onClick={() => setMode("chat-only")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
          mode === "chat-only"
            ? "bg-white text-neutral-900 shadow-sm font-semibold scale-100"
            : "text-neutral-400 hover:text-white"
        }`}
      >
        <MessageSquare className="w-3.5 h-3.5" />
        <span>Mod A: Chat-Only</span>
      </button>

      <button
        onClick={() => setMode("hybrid-menu")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
          mode === "hybrid-menu"
            ? "bg-white text-neutral-900 shadow-sm font-semibold scale-100"
            : "text-neutral-400 hover:text-white"
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>Mod B: Menü + AI Hybrid</span>
      </button>
    </div>
  )
}
