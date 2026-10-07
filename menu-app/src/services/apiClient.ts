import {
  CafeDto,
  CategoryDto,
  MenuInitDto,
  MenuSearchResultDto,
  ProductDto,
} from "@/types/menu"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" ? "" : "http://localhost:5238")

// Demo Fallback Data for presentation safety
const FALLBACK_CAFE: CafeDto = {
  id: "a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab",
  name: "Lounge Box Kitchen",
}

const FALLBACK_PRODUCTS: ProductDto[] = [
  {
    id: "020dca87-78d4-453b-8d4b-ad44f731d6b1",
    categoryId: "b7543421-afcd-4795-aadb-b7b504e608b6",
    categoryName: "Özel Demleme Kahveler",
    name: "V60 Seramik Demleme",
    description: "Düşük TDS su ile yavaş demlenmiş, meyvemsi ve çiçeksi notalara sahip tek köken filtre kahve.",
    price: 120,
    isAvailable: true,
    tags: ["Vejetaryen", "Vegan", "Şekersiz"],
  },
  {
    id: "031eea98-89e5-464c-9e5c-be55f842e7c2",
    categoryId: "b7543421-afcd-4795-aadb-b7b504e608b6",
    categoryName: "Özel Demleme Kahveler",
    name: "Ethiopia Yirgacheffe Flat White",
    description: "Çift shot espresso ve kadife dokulu mikro köpüklü yulaf sütü alternatifi.",
    price: 135,
    isAvailable: true,
    tags: ["Glutensiz", "Organik"],
  },
  {
    id: "042ffba9-90f6-475d-af6d-cf660953f8d3",
    categoryId: "b7543421-afcd-4795-aadb-b7b504e608b6",
    categoryName: "Özel Demleme Kahveler",
    name: "Cold Brew Reserve (Şekersiz)",
    description: "20 saat soğuk damıtma yöntemiyle hazırlanmış, yoğun çikolata bitişli buzlu kahve.",
    price: 140,
    isAvailable: true,
    tags: ["Şekersiz", "Vegan"],
  },
  {
    id: "00ebdc4e-1f10-437c-8f3e-b8bf9318d73a",
    categoryId: "53eb8950-5d94-4a6b-b523-9d65ff606119",
    categoryName: "Tuzlu Atıştırmalıklar",
    name: "Avokadolu Poşe Yumurtalı Tost",
    description: "Ekşi mayalı artizan ekmek üzerine taze ezilmiş avokado, labne ve çiftlik poşe yumurta.",
    price: 210,
    isAvailable: true,
    tags: ["Glüten İçerir", "Yumurta İçerir", "Vejetaryen"],
  },
  {
    id: "053aabb0-01a7-486e-b07e-df771064a9e4",
    categoryId: "53eb8950-5d94-4a6b-b523-9d65ff606119",
    categoryName: "Tuzlu Atıştırmalıklar",
    name: "Füme Hindi & Çedar Kruvasan Sandviç",
    description: "Tereyağlı çıtır kruvasan arasında füme hindi göğsü, eritilmiş çedar ve hardallı mayonez.",
    price: 195,
    isAvailable: true,
    tags: ["Sıcak Servis"],
  },
  {
    id: "064bbcc1-12b8-497f-c18f-ef882175b0f5",
    categoryId: "c8654532-b0de-48a6-bbdc-c8c615f719c7",
    categoryName: "Tatlılar",
    name: "San Sebastian Cheesecake (Belçika Çikolatalı)",
    description: "İpeksi dokulu fırınlanmış Bask cheesecake, eritilmiş sıcak Callebaut sütlü çikolata ile.",
    price: 185,
    isAvailable: true,
    tags: ["Glutensiz", "Vejetaryen"],
  },
  {
    id: "075ccdd2-23c9-4a80-d290-ff993286c1a6",
    categoryId: "c8654532-b0de-48a6-bbdc-c8c615f719c7",
    categoryName: "Tatlılar",
    name: "Fransız Bademli Kruvasan",
    description: "Kavrulmuş file badem ve zengin badem kreması dolgulu geleneksel kat kat kruvasan.",
    price: 145,
    isAvailable: true,
    tags: ["Vejetaryen"],
  },
]

const FALLBACK_CATEGORIES: CategoryDto[] = [
  {
    id: "b7543421-afcd-4795-aadb-b7b504e608b6",
    cafeId: "a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab",
    name: "Özel Demleme Kahveler",
  },
  {
    id: "53eb8950-5d94-4a6b-b523-9d65ff606119",
    cafeId: "a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab",
    name: "Tuzlu Atıştırmalıklar",
  },
  {
    id: "c8654532-b0de-48a6-bbdc-c8c615f719c7",
    cafeId: "a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab",
    name: "Tatlılar",
  },
]

export class ApiClient {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options?.headers || {}),
      },
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error")
      throw new Error(`API Error [${res.status}]: ${errorText}`)
    }

    return res.json() as Promise<T>
  }

  /**
   * Initializes the cafe menu and returns welcoming message from Gemini AI
   */
  public static async initMenu(cafeId?: string): Promise<MenuInitDto> {
    try {
      const endpoint = cafeId ? `/api/menu/init?cafeId=${cafeId}` : "/api/menu/init"
      return await this.request<MenuInitDto>(endpoint)
    } catch (error) {
      console.warn("apiClient.initMenu fallback activated:", error)
      return {
        cafeId: cafeId || FALLBACK_CAFE.id,
        cafeName: FALLBACK_CAFE.name,
        welcomeMessage: `${FALLBACK_CAFE.name}'e hoş geldiniz! Ben menü asistanınızım. Bugün canınız nasıl bir lezzet çekiyor?`,
      }
    }
  }

  /**
   * Searches the menu using natural language with Gemini AI
   */
  public static async searchMenu(
    query: string,
    cafeId?: string
  ): Promise<MenuSearchResultDto> {
    try {
      return await this.request<MenuSearchResultDto>("/api/menu/search", {
        method: "POST",
        body: JSON.stringify({ query, cafeId }),
      })
    } catch (error) {
      console.warn("apiClient.searchMenu fallback activated:", error)
      // Smart client-side demo matching
      const lower = query.toLowerCase()
      let matched = FALLBACK_PRODUCTS

      if (lower.includes("kahve") || lower.includes("latte") || lower.includes("filtre")) {
        matched = FALLBACK_PRODUCTS.filter(
          (p) =>
            p.categoryName.toLowerCase().includes("kahve") ||
            p.name.toLowerCase().includes("kahve") ||
            (p.description && p.description.toLowerCase().includes("kahve"))
        )
      } else if (lower.includes("tatlı") || lower.includes("pasta") || lower.includes("kek")) {
        matched = FALLBACK_PRODUCTS.filter((p) =>
          p.categoryName.toLowerCase().includes("tatlı")
        )
      } else if (lower.includes("tost") || lower.includes("atıştır")) {
        matched = FALLBACK_PRODUCTS.filter((p) =>
          p.categoryName.toLowerCase().includes("tuzlu") || p.name.toLowerCase().includes("tost")
        )
      }

      if (lower.includes("şekersiz")) {
        matched = matched.filter((p) => !p.tags.includes("Şekerli"))
      }

      const msg =
        matched.length > 0
          ? `Sizin için menümüzden nefis seçenekleri hazırladım:`
          : `Aradığınız kriterlere uygun ürün bulunamadı.`

      return {
        message: msg,
        products: matched,
      }
    }
  }

  /**
   * Lists all registered cafes (multi-tenant)
   */
  public static async getCafes(): Promise<CafeDto[]> {
    try {
      return await this.request<CafeDto[]>("/api/cafes")
    } catch {
      return [FALLBACK_CAFE]
    }
  }

  /**
   * Lists categories for the menu
   */
  public static async getCategories(): Promise<CategoryDto[]> {
    try {
      return await this.request<CategoryDto[]>("/api/categories")
    } catch {
      return FALLBACK_CATEGORIES
    }
  }

  /**
   * Lists products
   */
  public static async getProducts(): Promise<ProductDto[]> {
    try {
      return await this.request<ProductDto[]>("/api/products")
    } catch {
      return FALLBACK_PRODUCTS
    }
  }
}
