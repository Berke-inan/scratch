"use client"

import React from "react"
import { useApp } from "@/context/AppContext"
import { QrCode, Clock } from "lucide-react"

export function MenuHeader() {
  const { activeCafe, tableNumber, setIsQrModalOpen } = useApp()

  return (
    <div className="relative w-full h-44 sm:h-48 rounded-3xl overflow-hidden mb-4 shadow-lg border border-neutral-800/80 group">
      {/* 1. Cafe Ambience Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80')",
        }}
      />

      {/* 2. Premium Dark Gradient Overlay for optimal text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/40" />

      {/* 3. Hero Content Container */}
      <div className="relative h-full p-4 sm:p-5 flex flex-col justify-between z-10">
        {/* Top Bar: Table Info / QR (Left) and Hours Badge (Right) */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsQrModalOpen(true)}
            title="QR Kodları Gör / Masa Değiştir"
            className="flex items-center gap-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-semibold text-amber-300 border border-amber-500/30 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Masa {tableNumber || 1} • QR Menü</span>
          </button>

          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-medium text-neutral-300 border border-white/10 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>08:30 - 23:00</span>
          </div>
        </div>

        {/* Bottom Bar: Cafe Title & Compact One-line Description */}
        <div className="mt-auto">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 font-mono">
              Açık • Masaya Servis
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm leading-tight">
            {activeCafe?.name || "Lounge Box Kitchen"}
          </h1>

          <p className="text-[11.5px] sm:text-xs text-neutral-300/90 mt-0.5 line-clamp-1 drop-shadow-xs font-normal">
            Özenle seçilmiş kahve çekirdekleri, gurme atıştırmalıklar ve taze pastacılık lezzetleri.
          </p>
        </div>
      </div>
    </div>
  )
}
