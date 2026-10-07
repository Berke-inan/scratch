"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { CafeDto, CategoryDto, ProductDto } from "@/types/menu"
import { AppMode, ChatMessage, ChatTheme } from "@/types/chat"
import { ApiClient } from "@/services/apiClient"

interface AppContextType {
  mode: AppMode
  setMode: (mode: AppMode) => void
  theme: ChatTheme
  setTheme: (theme: ChatTheme) => void
  activeCafe: CafeDto | null
  cafes: CafeDto[]
  setActiveCafeId: (id: string) => void
  tableNumber: number | null
  setTableNumber: (num: number | null) => void
  isQrModalOpen: boolean
  setIsQrModalOpen: (open: boolean) => void
  categories: CategoryDto[]
  products: ProductDto[]
  messages: ChatMessage[]
  isTyping: boolean
  isDrawerOpen: boolean
  setIsDrawerOpen: (open: boolean) => void
  selectedCategory: string
  setSelectedCategory: (cat: string) => void
  sendMessage: (text: string) => void
  clearChat: () => void
  refreshInit: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppMode>("chat-only")
  const [theme, setTheme] = useState<ChatTheme>("ai-chat")
  const [cafes, setCafes] = useState<CafeDto[]>([])
  const [activeCafe, setActiveCafe] = useState<CafeDto | null>(null)
  const [tableNumber, setTableNumber] = useState<number | null>(1)
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false)
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [products, setProducts] = useState<ProductDto[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü")

  const DEFAULT_CAFE_ID = "a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab"

  // Load cafes, categories, and initial products
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [loadedCafes, loadedCategories, loadedProducts] = await Promise.all([
          ApiClient.getCafes(),
          ApiClient.getCategories(),
          ApiClient.getProducts(),
        ])

        setCafes(loadedCafes)
        setCategories(loadedCategories)
        setProducts(loadedProducts)

        // Read query parameters from URL if available (e.g. ?cafeId=...&table=2)
        let targetCafeId = DEFAULT_CAFE_ID
        let currentTable = 1

        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search)
          const qCafeId = urlParams.get("cafeId")
          const qTable = urlParams.get("table")

          if (qCafeId) targetCafeId = qCafeId
          if (qTable) {
            const parsed = parseInt(qTable, 10)
            if (!isNaN(parsed) && parsed > 0) {
              currentTable = parsed
            }
          }
        }

        setTableNumber(currentTable)

        // Find requested cafe or default
        const selectedCafe =
          loadedCafes.find((c) => c.id === targetCafeId) ||
          loadedCafes.find((c) => c.id === DEFAULT_CAFE_ID) ||
          loadedCafes[0] ||
          null

        setActiveCafe(selectedCafe)

        if (selectedCafe) {
          const initRes = await ApiClient.initMenu(selectedCafe.id)
          if (initRes.cafeName) {
            setActiveCafe({
              id: selectedCafe.id,
              name: initRes.cafeName,
            })
          }

          let welcomeMsg = initRes.welcomeMessage
          if (currentTable) {
            welcomeMsg = `${welcomeMsg}\n\n📍 Masa ${currentTable} QR Menü • Sipariş ve öneriler için size yardımcı olmaya hazırım!`
          }

          setMessages([
            {
              id: "init-msg",
              sender: "assistant",
              text: welcomeMsg,
              timestamp: new Date().toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              status: "read",
            },
          ])
        }
      } catch (err) {
        console.error("Initial data load failed:", err)
      }
    }

    loadInitialData()
  }, [])

  const setActiveCafeId = useCallback(
    async (cafeId: string) => {
      const selected = cafes.find((c) => c.id === cafeId) || null
      setActiveCafe(selected)
      if (selected) {
        setIsTyping(true)
        const initRes = await ApiClient.initMenu(selected.id)
        setIsTyping(false)
        let welcomeMsg = initRes.welcomeMessage
        if (tableNumber) {
          welcomeMsg = `${welcomeMsg}\n\n📍 Masa ${tableNumber} QR Menü • Sipariş ve öneriler için size yardımcı olmaya hazırım!`
        }
        setMessages([
          {
            id: `init-${Date.now()}`,
            sender: "assistant",
            text: welcomeMsg,
            timestamp: new Date().toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            status: "read",
          },
        ])
      }
    },
    [cafes, tableNumber]
  )

  const refreshInit = useCallback(async () => {
    if (!activeCafe) return
    setIsTyping(true)
    const initRes = await ApiClient.initMenu(activeCafe.id)
    setIsTyping(false)
    let welcomeMsg = initRes.welcomeMessage
    if (tableNumber) {
      welcomeMsg = `${welcomeMsg}\n\n📍 Masa ${tableNumber} QR Menü • Sipariş ve öneriler için size yardımcı olmaya hazırım!`
    }
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: "assistant",
        text: welcomeMsg,
        timestamp: new Date().toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "read",
      },
    ])
  }, [activeCafe, tableNumber])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "sent",
      }

      setMessages((prev) => [...prev, userMsg])
      setIsTyping(true)

      try {
        const result = await ApiClient.searchMenu(text, activeCafe?.id)

        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          sender: "assistant",
          text: result.message,
          timestamp: new Date().toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          products: result.products && result.products.length > 0 ? result.products : undefined,
          status: "read",
        }

        setMessages((prev) => [...prev, assistantMsg])
      } catch (error) {
        console.error("Search error:", error)
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "assistant",
            text: "Üzgünüm, şu an bağlantıda bir problem oluştu. Lütfen tekrar deneyiniz.",
            timestamp: new Date().toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            status: "read",
          },
        ])
      } finally {
        setIsTyping(false)
      }
    },
    [activeCafe]
  )

  const clearChat = useCallback(() => {
    setMessages([])
  }, [])

  return (
    <AppContext.Provider
      value={{
        mode,
        setMode,
        theme,
        setTheme,
        activeCafe,
        cafes,
        setActiveCafeId,
        tableNumber,
        setTableNumber,
        isQrModalOpen,
        setIsQrModalOpen,
        categories,
        products,
        messages,
        isTyping,
        isDrawerOpen,
        setIsDrawerOpen,
        selectedCategory,
        setSelectedCategory,
        sendMessage,
        clearChat,
        refreshInit,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
