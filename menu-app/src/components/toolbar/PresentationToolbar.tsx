"use client"

import React, { useState } from "react"
import { useApp } from "@/context/AppContext"
import { NavigationDrawer } from "./NavigationDrawer"
import { Menu, QrCode, Sparkles } from "lucide-react"
import { ChatTheme } from "@/types/chat"

function getThemeLabel(theme: ChatTheme): string {
  switch (theme) {
    case "ai-chat":
      return "AI Arayüzü"
    case "whatsapp":
      return "WhatsApp"
    case "imessage":
      return "iOS"
    case "oneui":
      return "One UI"
    default:
      return "AI Arayüzü"
  }
}

export function PresentationToolbar() {
  const { activeCafe, mode, theme, tableNumber, setIsQrModalOpen } = useApp()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const currentModeLabel =
    mode === "hybrid-menu"
      ? "Menu + AI"
      : `Chat Only • ${getThemeLabel(theme)}`

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-neutral-950/85 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800/80 transition-all">
        <div className="max-w-4xl mx-auto h-14 sm:h-16 px-3 sm:px-4 flex items-center justify-between">
          {/* Left: Hamburger Menu Button & Cafe Title */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Menüyü Aç"
              title="Görünüm ve Mod Menüsü"
              className="p-2 sm:p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/90 dark:border-neutral-800 transition-all cursor-pointer active:scale-95 shadow-2xs flex items-center justify-center group"
            >
              <Menu className="w-5 h-5 text-neutral-700 dark:text-neutral-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
            </button>

            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-none truncate max-w-[130px] sm:max-w-[200px]">
                {activeCafe?.name || "Lounge Box Kitchen"}
              </h1>

              {/* Active Mode/Theme Subtle Indicator Badge */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                title="Mod Değiştirmek İçin Tıklayın"
                className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60 transition-colors cursor-pointer"
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                <span>{currentModeLabel}</span>
              </button>
            </div>
          </div>

          {/* Right: Table QR Quick Badge */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsQrModalOpen(true)}
              title="Masa QR Kodunu Gör"
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Masa {tableNumber || 1}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-Over Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  )
}
