import { ProductDto } from "./menu"

export type ChatTheme = "ai-chat" | "whatsapp" | "imessage" | "oneui"
export type AppMode = "chat-only" | "hybrid-menu"

export interface ChatMessage {
  id: string
  sender: "user" | "assistant"
  text: string
  timestamp: string
  products?: ProductDto[]
  status?: "sent" | "delivered" | "read"
}
