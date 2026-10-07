"use client"

import React from "react"
import { AppProvider, useApp } from "@/context/AppContext"
import { PresentationToolbar } from "@/components/toolbar/PresentationToolbar"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { HybridMenuView } from "@/components/menu/HybridMenuView"
import { QrModal } from "@/components/qr/QrModal"

function MainAppContent() {
  const { mode } = useApp()

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col">
      {/* 1. Top Presentation & Mode / Theme Switcher Toolbar */}
      <PresentationToolbar />

      {/* 2. Main Content Area Switcher */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-3 sm:p-6 flex flex-col justify-center items-center">
        {mode === "chat-only" ? (
          <div className="w-full flex justify-center py-2 animate-in fade-in zoom-in-95 duration-200">
            <ChatWindow />
          </div>
        ) : (
          <div className="w-full animate-in fade-in duration-200">
            <HybridMenuView />
          </div>
        )}
      </main>

      {/* 3. Table QR Code Generator & Scanner Modal */}
      <QrModal />
    </div>
  )
}

export default function Home() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  )
}
