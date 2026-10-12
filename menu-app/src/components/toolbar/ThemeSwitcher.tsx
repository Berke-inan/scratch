"use client"

import React from "react"
import { useApp } from "@/context/AppContext"
import { ChatTheme } from "@/types/chat"
import { Smartphone, MessageCircle, Sparkles, Layers } from "lucide-react"

const THEMES: { id: ChatTheme; label: string; icon: React.ReactNode; color: string }[] = [
  {
    id: "ai-chat",
    label: "AI Arayüzü",
    icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
    color: "from-amber-600 to-amber-700",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />,
    color: "from-emerald-600 to-emerald-700",
  },
  {
    id: "imessage",
    label: "iOS",
    icon: <Smartphone className="w-3.5 h-3.5 text-sky-400" />,
    color: "from-sky-500 to-sky-600",
  },
  {
    id: "oneui",
    label: "One UI",
    icon: <Layers className="w-3.5 h-3.5 text-indigo-400" />,
    color: "from-indigo-600 to-blue-700",
  },
]

export function ThemeSwitcher() {
  const { theme, setTheme, mode } = useApp()

  return (
    <div className="flex items-center gap-1 bg-neutral-900/90 dark:bg-neutral-900/95 p-1 rounded-full border border-neutral-700/60 shadow-lg backdrop-blur-md overflow-x-auto max-w-full">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 px-2 hidden sm:inline">
        Tema:
      </span>

      {THEMES.map((t) => {
        const isActive = theme === t.id
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
              isActive
                ? "bg-white text-neutral-950 font-semibold shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <span
              className={`p-0.5 rounded-full ${
                isActive ? "text-neutral-900" : "text-neutral-400"
              }`}
            >
              {t.icon}
            </span>
            <span>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}
