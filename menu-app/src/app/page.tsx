"use client"

import React from "react"
import { AppProvider, useApp } from "@/context/AppContext"
import { PresentationToolbar } from "@/components/toolbar/PresentationToolbar"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { HybridMenuContainer } from "@/components/menu/HybridMenuContainer"
import { QrModal } from "@/components/qr/QrModal"

function MainAppContent() {
  const { mode } = useApp()

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col">
      {/* 1. Top Presentation & Mode / Theme Switcher Toolbar */}
      <PresentationToolbar />

      {/* 2. Main Content Area Switcher */}
      <main
        className={`flex-1 w-full mx-auto flex flex-col ${
          mode === "chat-only"
            ? "p-0 sm:p-6 sm:max-w-4xl sm:justify-center sm:items-center"
            : "max-w-4xl p-3 sm:p-6 justify-center items-center"
        }`}
      >
        {mode === "chat-only" ? (
          <div className="w-full h-full flex-1 flex justify-center p-0 sm:py-2 animate-in fade-in duration-200">
            <ChatWindow />
          </div>
        ) : (
          <div className="w-full animate-in fade-in duration-200">
            <HybridMenuContainer />
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
