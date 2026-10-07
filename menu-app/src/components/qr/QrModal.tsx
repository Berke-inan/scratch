"use client"

import React, { useState, useEffect } from "react"
import { useApp } from "@/context/AppContext"
import { QRCodeSVG } from "qrcode.react"
import {
  QrCode,
  X,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Wifi,
  Sparkles,
  Layers,
  Store,
} from "lucide-react"

export function QrModal() {
  const { isQrModalOpen, setIsQrModalOpen, cafes, activeCafe, setActiveCafeId, setTableNumber } =
    useApp()

  const [selectedCafeId, setSelectedCafeId] = useState<string>("")
  const [selectedTable, setSelectedTable] = useState<number>(1)
  const [networkHost, setNetworkHost] = useState<string>("192.168.1.2:3000")
  const [useLocalhost, setUseLocalhost] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  // Sync selected cafe with activeCafe on open
  useEffect(() => {
    if (activeCafe) {
      setSelectedCafeId(activeCafe.id)
    } else if (cafes.length > 0) {
      setSelectedCafeId(cafes[0].id)
    }
  }, [activeCafe, cafes, isQrModalOpen])

  // Detect current hostname if accessed via IP
  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.host // includes port
      if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
        setNetworkHost(host)
      }
    }
  }, [])

  if (!isQrModalOpen) return null

  const currentCafe = cafes.find((c) => c.id === selectedCafeId) || activeCafe || cafes[0]
  const currentHost = useLocalhost ? "localhost:3000" : networkHost
  const targetUrl = `http://${currentHost}/?cafeId=${currentCafe?.id}&table=${selectedTable}`

  const handleCopy = () => {
    navigator.clipboard?.writeText(targetUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDirectOpen = () => {
    if (currentCafe) {
      setActiveCafeId(currentCafe.id)
      setTableNumber(selectedTable)
      // Update browser URL query without reload
      window.history.pushState({}, "", `/?cafeId=${currentCafe.id}&table=${selectedTable}`)
      setIsQrModalOpen(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Masa QR Kod Üretici
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                  Canlı
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Kafeler ve Masalar (1 - 5) için taranabilir QR Kodlar
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsQrModalOpen(false)}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* 1. Cafe Selector Tabs */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              1. Kafe Seçin (Veritabanı)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {cafes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCafeId(c.id)}
                  className={`px-3 py-2 rounded-xl text-center font-medium transition-all cursor-pointer truncate ${
                    selectedCafeId === c.id
                      ? "bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20"
                      : "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800 border border-neutral-700/60"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Table Selector (1 - 5) */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              2. Masa Seçin
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTable(t)}
                  className={`flex-1 py-2 rounded-xl font-bold text-center transition-all cursor-pointer ${
                    selectedTable === t
                      ? "bg-white text-neutral-950 shadow-md"
                      : "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800 border border-neutral-700/60"
                  }`}
                >
                  Masa {t}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Host / Network Mode Switcher */}
          <div className="bg-neutral-950/70 p-3 rounded-2xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                Bağlantı Modu (Telefon Erişimi)
              </span>
              <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
                <button
                  onClick={() => setUseLocalhost(false)}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                    !useLocalhost
                      ? "bg-emerald-500 text-neutral-950"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Wi-Fi (Telefon)
                </button>
                <button
                  onClick={() => setUseLocalhost(true)}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                    useLocalhost
                      ? "bg-neutral-700 text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Localhost
                </button>
              </div>
            </div>

            {!useLocalhost ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-400 shrink-0">Yerel Ağ IP:</span>
                <input
                  type="text"
                  value={networkHost}
                  onChange={(e) => setNetworkHost(e.target.value)}
                  className="flex-1 bg-neutral-900 border border-neutral-700/80 rounded-lg px-2.5 py-1 text-neutral-200 text-xs focus:outline-none focus:border-amber-400 font-mono"
                  placeholder="192.168.1.2:3000"
                />
              </div>
            ) : (
              <p className="text-[11px] text-neutral-400">
                Localhost modu sadece bu bilgisayardaki tarayıcı içindir. Telefondan okutmak için Wi-Fi modunu kullanın.
              </p>
            )}
          </div>

          {/* 4. The QR Code Display Card */}
          <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl shadow-xl text-neutral-900">
            <div className="text-center mb-3">
              <div className="text-sm font-extrabold tracking-tight text-neutral-950">
                {currentCafe?.name}
              </div>
              <div className="inline-block bg-amber-500 text-neutral-950 px-2.5 py-0.5 rounded-full text-[11px] font-bold mt-0.5 shadow-xs">
                MASA {selectedTable}
              </div>
            </div>

            {/* High-contrast crisp SVG QR Code */}
            <div className="p-3 bg-white border-2 border-neutral-200 rounded-2xl shadow-inner">
              <QRCodeSVG
                value={targetUrl}
                size={180}
                level="M"
                includeMargin={true}
              />
            </div>

            {/* Target URL string */}
            <div className="mt-3 w-full bg-neutral-100 rounded-xl p-2 flex items-center justify-between gap-2 border border-neutral-200">
              <span className="font-mono text-[10px] text-neutral-600 truncate flex-1">
                {targetUrl}
              </span>
              <button
                onClick={handleCopy}
                title="Linki Kopyala"
                className="shrink-0 p-1.5 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-800 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* 5. Mobile Wi-Fi Guidance Card */}
          <div className="flex items-start gap-2.5 bg-neutral-950/80 p-3 rounded-2xl border border-neutral-800/80 text-neutral-300">
            <Smartphone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <p className="font-semibold text-white">Telefondan Okuturken:</p>
              <p className="text-neutral-400 mt-0.5">
                Telefonunuz ve bilgisayarınız aynı ev/ofis Wi-Fi ağına bağlı olmalıdır. Telefon kameranızı yukarıdaki QR koda tuttuğunuzda Masa {selectedTable} menüsü otomatik açılacaktır.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-800 bg-neutral-950/80">
          <button
            onClick={() => {
              window.open(`/qr`, "_blank")
            }}
            className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tüm Masaları Sayfada Gör</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDirectOpen}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-3.5 py-1.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
            >
              <span>Bu Masayı Aç</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
