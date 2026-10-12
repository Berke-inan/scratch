"use client"

import React, { useEffect } from "react"
import { useApp } from "@/context/AppContext"
import { ChatTheme } from "@/types/chat"
import {
  X,
  MessageSquare,
  LayoutGrid,
  Sparkles,
  MessageCircle,
  Smartphone,
  Layers,
  QrCode,
  RotateCcw,
  Store,
  ChevronRight,
  Check,
} from "lucide-react"

interface NavigationDrawerProps {
  isOpen: boolean
  onClose: () => void
}

interface ThemeOption {
  id: ChatTheme
  label: string
  subtitle: string
  icon: React.ElementType
  colorClass: string
  bgClass: string
}

const CHAT_THEMES: ThemeOption[] = [
  {
    id: "ai-chat",
    label: "AI Arayüzü",
    subtitle: "Sistem varsayılanı modern asistan",
    icon: Sparkles,
    colorClass: "text-amber-500 dark:text-amber-400",
    bgClass: "bg-amber-500/10 dark:bg-amber-500/20",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    subtitle: "Yeşil mesajlaşma akışı ve balonları",
    icon: MessageCircle,
    colorClass: "text-emerald-500 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
  },
  {
    id: "imessage",
    label: "iOS",
    subtitle: "Apple tarzı mavi ve gri balonlar",
    icon: Smartphone,
    colorClass: "text-sky-500 dark:text-sky-400",
    bgClass: "bg-sky-500/10 dark:bg-sky-500/20",
  },
  {
    id: "oneui",
    label: "One UI",
    subtitle: "Samsung One UI arayüz tasarımı",
    icon: Layers,
    colorClass: "text-indigo-500 dark:text-indigo-400",
    bgClass: "bg-indigo-500/10 dark:bg-indigo-500/20",
  },
]

export function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  const {
    mode,
    setMode,
    theme,
    setTheme,
    activeCafe,
    cafes,
    setActiveCafeId,
    tableNumber,
    setIsQrModalOpen,
    refreshInit,
  } = useApp()

  // Handle ESC key and scroll lock
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSelectTheme = (themeId: ChatTheme) => {
    setTheme(themeId)
    setMode("chat-only")
    onClose()
  }

  const handleSelectHybrid = () => {
    setMode("hybrid-menu")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* 1. Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* 2. Slide-Over Drawer Panel */}
      <div className="relative z-50 w-80 sm:w-96 max-w-[85vw] h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-300 ease-out">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                Görünüm & Modlar
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Deneyim modunu ve sohbet temasını seçin
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Menüyü Kapat"
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body (Dikey Mod Seçenekleri) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 no-scrollbar">
          {/* Section: MOD 1 - CHAT ONLY */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                1. Mod: Sohbet Deneyimi
              </span>
              {mode === "chat-only" && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 font-mono">
                  Aktif Mod
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 p-3 space-y-2">
              <div className="flex items-center gap-2.5 px-1 py-1">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Chat Only
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Aşağıdaki 4 temadan birini seçerek sohbet moduna geçin:
                  </p>
                </div>
              </div>

              {/* 4 Temanın Listesi */}
              <div className="space-y-1.5 pt-1">
                {CHAT_THEMES.map((item) => {
                  const Icon = item.icon
                  const isSelected = mode === "chat-only" && theme === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTheme(item.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer active:scale-98 border ${
                        isSelected
                          ? "bg-white dark:bg-neutral-800 border-amber-500/50 dark:border-amber-500/40 shadow-xs"
                          : "bg-white/60 dark:bg-neutral-900/60 border-neutral-200/60 dark:border-neutral-800/80 hover:bg-white dark:hover:bg-neutral-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.bgClass} ${item.colorClass}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                              {item.label}
                            </span>
                            {item.id === "ai-chat" && (
                              <span className="text-[9px] font-semibold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.2 rounded">
                                Varsayılan
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Section: MOD 2 - MENU + AI */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                2. Mod: Hibrit Deneyim
              </span>
              {mode === "hybrid-menu" && (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/60 font-mono">
                  Aktif Mod
                </span>
              )}
            </div>

            <button
              onClick={handleSelectHybrid}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer active:scale-98 border ${
                mode === "hybrid-menu"
                  ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/60 shadow-xs"
                  : "bg-white dark:bg-neutral-900 border-neutral-200/90 dark:border-neutral-800 hover:border-amber-500/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center shadow-xs">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Menu + AI
                    </h3>
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                      Önerilen
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Görsel menü ızgarası, kategori kartları ve entegre AI danışmanı
                  </p>
                </div>
              </div>

              {mode === "hybrid-menu" ? (
                <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
              )}
            </button>
          </div>

          {/* Section: Kafe / Masa Bilgisi */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/70 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-1">
              Masa & Kafe
            </span>

            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[170px]">
                  {activeCafe?.name || "Lounge Box Kitchen"}
                </span>
              </div>

              <button
                onClick={() => {
                  setIsQrModalOpen(true)
                  onClose()
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-500/30 hover:bg-amber-500/30 transition-colors cursor-pointer"
              >
                <QrCode className="w-3 h-3" />
                <span>Masa {tableNumber || 1}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex items-center justify-between">
          <button
            onClick={() => {
              refreshInit()
              onClose()
            }}
            className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sohbeti Sıfırla</span>
          </button>

          <span className="text-[10px] text-neutral-400 font-mono">
            v1.2.0 • Lounge Box
          </span>
        </div>
      </div>
    </div>
  )
}
