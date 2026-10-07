"use client"

import React, { useState } from "react"
import { useApp } from "@/context/AppContext"
import { ModeSwitcher } from "./ModeSwitcher"
import { ThemeSwitcher } from "./ThemeSwitcher"
import { Store, RotateCcw, ChevronDown, QrCode } from "lucide-react"

export function PresentationToolbar() {
  const {
    cafes,
    activeCafe,
    setActiveCafeId,
    refreshInit,
    sendMessage,
    mode,
    tableNumber,
    setIsQrModalOpen,
  } = useApp()
  const [isCafeDropdownOpen, setIsCafeDropdownOpen] = useState(false)

  const samplePrompts = [
    "Bana şöyle şekersiz bir kahve öner",
    "Tatlı bir şeyler istiyorum",
    "Glutensiz tuzlu ne var?",
    "Merhaba, günün kahvesi nedir?",
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/80 px-3 py-2.5 transition-all">
      <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
        {/* Main Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Cafe Selector / Brand Tag */}
          <div className="relative">
            <button
              onClick={() => setIsCafeDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/60 px-3 py-1.5 rounded-full text-xs font-medium text-neutral-200 transition-colors shadow-sm cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-white truncate max-w-[140px] sm:max-w-[200px]">
                {activeCafe?.name || "Kafe Seçimi"}
              </span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {isCafeDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-64 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs">
                <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Kayıtlı Kafeler (Multi-Tenant)
                </div>
                {cafes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveCafeId(c.id)
                      setIsCafeDropdownOpen(false)
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-center justify-between ${
                      activeCafe?.id === c.id
                        ? "bg-neutral-800 text-white font-medium"
                        : "text-neutral-300 hover:bg-neutral-800/60"
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    {activeCafe?.id === c.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mode Switcher */}
          <ModeSwitcher />

          {/* QR Masalar Trigger */}
          <button
            onClick={() => setIsQrModalOpen(true)}
            title="Masa QR Kodlarını Göster"
            className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-amber-500/40 hover:border-amber-400 text-amber-300 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>QR Masalar {tableNumber ? `(Masa ${tableNumber})` : ""}</span>
          </button>

          {/* Reset / Refresh Button */}
          <button
            onClick={() => refreshInit()}
            title="Sohbeti Baştan Başlat / Yenile"
            className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-300 hover:text-white px-2.5 py-1.5 rounded-full text-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sıfırla</span>
          </button>
        </div>

        {/* Theme Switcher Row (Always visible or in Chat Mode) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800/60 pt-2">
          <ThemeSwitcher />

          {/* Quick Demo Prompts Pill Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar max-w-full">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 shrink-0 hidden sm:inline">
              Hızlı Demo:
            </span>
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(prompt)}
                className="text-[11px] bg-neutral-800/80 hover:bg-neutral-700/90 text-neutral-300 hover:text-white px-2.5 py-1 rounded-full border border-neutral-700/50 transition-all shrink-0 cursor-pointer active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
