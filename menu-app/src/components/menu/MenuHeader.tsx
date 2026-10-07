"use client"

import React from "react"
import { useApp } from "@/context/AppContext"
import { QrCode, Sparkles, Clock, Wifi, Search } from "lucide-react"

export function MenuHeader() {
  const { activeCafe, setIsDrawerOpen, tableNumber, setIsQrModalOpen } = useApp()

  return (
    <div className="w-full bg-neutral-900 text-white rounded-3xl overflow-hidden border border-neutral-800 shadow-xl mb-4 relative">
      {/* Decorative Gradient Background */}
      <div className="h-32 w-full bg-gradient-to-r from-neutral-800 via-amber-950/40 to-neutral-900 relative p-4 flex items-start justify-between">
        <button
          onClick={() => setIsQrModalOpen(true)}
          title="QR Kodları Gör / Değiştir"
          className="flex items-center gap-2 bg-neutral-900/80 hover:bg-neutral-800 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-amber-300 border border-amber-500/30 cursor-pointer transition-colors"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Masa {tableNumber || 1} • QR Menü</span>
        </button>

        <div className="flex items-center gap-1.5 bg-neutral-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] text-neutral-300">
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span>Misafir WiFi: Aktif</span>
        </div>
      </div>

      {/* Cafe Profile Info */}
      <div className="px-5 pb-5 pt-1 relative -mt-8">
        <div className="flex items-end justify-between mb-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-2xl font-bold shadow-lg border-2 border-neutral-900">
            ☕
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
            <span>08:30 - 23:00 Açık</span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {activeCafe?.name || "Artisan Cafe & Bakery"}
        </h1>
        <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
          Taze kavrulmuş özel çekirdekler, el yapımı taze tatlılar ve glütensiz seçenekler.
        </p>

        {/* Instant Search Bar Trigger */}
        <div
          onClick={() => setIsDrawerOpen(true)}
          className="mt-4 flex items-center justify-between bg-neutral-800/90 hover:bg-neutral-800 px-4 py-3 rounded-2xl border border-neutral-700/60 cursor-pointer transition-all group shadow-inner"
        >
          <div className="flex items-center gap-2.5 text-neutral-400 group-hover:text-neutral-200 text-sm">
            <Search className="w-4 h-4 text-amber-400" />
            <span>AI Asistan ile ara (örn: &quot;şekersiz kahve&quot;)</span>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-semibold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
            <Sparkles className="w-3 h-3" />
            <span>AI Destekli</span>
          </span>
        </div>
      </div>
    </div>
  )
}
