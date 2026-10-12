"use client"

import React, { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import {
  QrCode,
  ArrowLeft,
  Printer,
  ExternalLink,
  Copy,
  Check,
  Store,
  Globe,
} from "lucide-react"
import Link from "next/link"
import { CafeDto } from "@/types/menu"
import { ApiClient } from "@/services/apiClient"
import { getAppBaseUrl, buildQrTargetUrl } from "@/lib/urlUtils"

export default function QrDashboardPage() {
  const [cafes, setCafes] = useState<CafeDto[]>([])
  const [selectedCafeId, setSelectedCafeId] = useState<string>("a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab")
  const [baseUrl, setBaseUrl] = useState<string>("")
  const [copiedTable, setCopiedTable] = useState<number | null>(null)

  useEffect(() => {
    async function loadCafes() {
      try {
        const loaded = await ApiClient.getCafes()
        setCafes(loaded)
        if (loaded.length > 0) {
          const defaultCafe = loaded.find((c) => c.id === "a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab")
          setSelectedCafeId(defaultCafe ? defaultCafe.id : loaded[0].id)
        }
      } catch (err) {
        console.error("Failed to fetch cafes:", err)
      }
    }
    loadCafes()

    setBaseUrl(getAppBaseUrl())
  }, [])

  const currentCafe = cafes.find((c) => c.id === selectedCafeId)

  const handleCopy = (url: string, tableNum: number) => {
    navigator.clipboard?.writeText(url)
    setCopiedTable(tableNum)
    setTimeout(() => setCopiedTable(null), 2000)
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-8">
      {/* Top Navigation & Controls */}
      <div className="max-w-6xl mx-auto mb-8 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                <QrCode className="w-6 h-6 text-amber-400" />
                Masa QR Kod Yönetimi & Yazdırma
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Veritabanındaki her kafe için Masa 1-5 taranabilir masabaşı QR kartları
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Masaları Yazdır</span>
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Cafe Switcher */}
          <div className="bg-neutral-900/90 border border-neutral-800 p-4 rounded-2xl">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-amber-400" />
              Aktif Kafe (Veritabanından)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {cafes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCafeId(c.id)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer truncate ${
                    selectedCafeId === c.id
                      ? "bg-amber-500 text-neutral-950 shadow-md font-bold"
                      : "bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/60"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Base URL Settings */}
          <div className="bg-neutral-900/90 border border-neutral-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                Hedef Yayın Adresi (Base URL)
              </span>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-mono border border-emerald-500/20">
                Production
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://scratch-e6j4kgn11-berke-inan.vercel.app"
                className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={() => setBaseUrl(getAppBaseUrl(true))}
                title="Vercel adresine sıfırla"
                className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-[11px] font-semibold text-neutral-300 border border-neutral-700 transition-colors shrink-0 cursor-pointer"
              >
                Sıfırla
              </button>
            </div>
            <p className="text-[10.5px] text-neutral-400 mt-1.5">
              QR kodlar bu canlı adres üzerinden üretilir.
            </p>
          </div>
        </div>
      </div>

      {/* Tables Grid (1 to 5) */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">
              {currentCafe?.name || "Kafe"} • Masalar (1 - 5)
            </h2>
            <p className="text-xs text-neutral-400">
              Telefon kameranızı aşağıdaki herhangi bir QR koda tutarak o masanın menüsünü açabilirsiniz.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((tableNum) => {
            const tableUrl = buildQrTargetUrl(selectedCafeId, tableNum, baseUrl)

            return (
              <div
                key={tableNum}
                className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 flex flex-col items-center justify-between shadow-xl transition-all hover:border-amber-500/40 print:border-2 print:border-neutral-900 print:bg-white print:text-black"
              >
                {/* Header Badge */}
                <div className="w-full flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-neutral-400 print:text-neutral-600 truncate max-w-[100px]">
                    {currentCafe?.name}
                  </span>
                  <span className="bg-amber-500/20 text-amber-300 print:bg-neutral-200 print:text-neutral-900 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-amber-500/30">
                    QR MENÜ
                  </span>
                </div>

                {/* Table Title */}
                <div className="text-center mb-3">
                  <div className="text-lg font-black tracking-tight text-white print:text-black">
                    MASA {tableNum}
                  </div>
                  <span className="text-[10px] text-neutral-400 print:text-neutral-600">
                    Kameranızla Okutunuz
                  </span>
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-3.5 rounded-2xl shadow-md border border-neutral-200">
                  <QRCodeSVG
                    value={tableUrl}
                    size={150}
                    level="M"
                    includeMargin={true}
                  />
                </div>

                {/* URL Display */}
                <div className="w-full mt-3 bg-neutral-950 print:bg-neutral-100 p-2 rounded-xl flex items-center justify-between gap-2 border border-neutral-800 print:border-neutral-300">
                  <span className="font-mono text-[9px] text-neutral-400 print:text-neutral-700 truncate flex-1">
                    Masa {tableNum} Linki
                  </span>
                  <button
                    onClick={() => handleCopy(tableUrl, tableNum)}
                    title="Kopyala"
                    className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer print:hidden"
                  >
                    {copiedTable === tableNum ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Direct Open Button (Screen only) */}
                <div className="w-full mt-3 print:hidden">
                  <Link
                    href={`/?cafeId=${selectedCafeId}&table=${tableNum}`}
                    className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Masayı Aç</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
