import {
  CafeDto,
  CategoryDto,
  MenuInitDto,
  MenuSearchResultDto,
  ProductDto,
} from "@/types/menu"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ||
  "http://localhost:5238"

// Demo Fallback Data for presentation safety
const FALLBACK_CAFE: CafeDto = {
  id: "a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab",
  name: "Lounge Box Kitchen",
}

const FALLBACK_CATEGORIES: CategoryDto[] = [
  {
    id: "cat-1",
    cafeId: "a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab",
    name: "Sıcak Kahveler",
  },
  {
    id: "cat-2",
    cafeId: "a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab",
    name: "Soğuk Kahveler",
  },
  {
    id: "cat-3",
    cafeId: "a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab",
    name: "Soğuk İçecekler",
  },
  {
    id: "cat-4",
    cafeId: "a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab",
    name: "Tatlılar & Pastacılık",
  },
  {
    id: "cat-5",
    cafeId: "a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab",
    name: "Atıştırmalık & Mutfak",
  },
]

const FALLBACK_PRODUCTS: ProductDto[] = [
  {
    id: "p-1",
    categoryId: "cat-1",
    categoryName: "Sıcak Kahveler",
    name: "Espresso",
    description: "Sıcak servis edilen, taze çekilmiş İtalyan çekirdeklerinden tek shot yoğun ve sert kahve, ilave şekersiz.",
    price: 95,
    isAvailable: true,
    tags: ["Sıcak", "Şekersiz", "Vegan", "Glutensiz"],
  },
  {
    id: "p-2",
    categoryId: "cat-1",
    categoryName: "Sıcak Kahveler",
    name: "Americano",
    description: "Sıcak servis edilen, ilave şekersiz espresso bazlı sıcak su ile seyreltilmiş sert kahve.",
    price: 110,
    isAvailable: true,
    tags: ["Sıcak", "Şekersiz", "Vegan", "Glutensiz"],
  },
  {
    id: "p-3",
    categoryId: "cat-1",
    categoryName: "Sıcak Kahveler",
    name: "Caffe Latte",
    description: "Sıcak servis edilen, bol buharda ısıtılmış kadifemsi süt ve espresso ile hazırlanan yumuşak içimli kahve.",
    price: 130,
    isAvailable: true,
    tags: ["Sıcak", "Şekersiz", "Süt Ürünü İçerir", "Glutensiz"],
  },
  {
    id: "p-4",
    categoryId: "cat-1",
    categoryName: "Sıcak Kahveler",
    name: "Şekerli Karamel Latte",
    description: "Sıcak servis edilen, tatlı karamel şurubu ile tatlandırılmış, şekerli ve kremalı espresso latte.",
    price: 145,
    isAvailable: true,
    tags: ["Sıcak", "Şekerli", "Süt Ürünü İçerir", "Glutensiz"],
  },
  {
    id: "p-5",
    categoryId: "cat-2",
    categoryName: "Soğuk Kahveler",
    name: "Iced Latte",
    description: "Buzlu soğuk süt ve espresso katmanlarından oluşan, hafif ve ferahlatıcı şekersiz soğuk kahve.",
    price: 140,
    isAvailable: true,
    tags: ["Soğuk", "Şekersiz", "Süt Ürünü İçerir", "Glutensiz"],
  },
  {
    id: "p-6",
    categoryId: "cat-2",
    categoryName: "Soğuk Kahveler",
    name: "Cold Brew Reserve",
    description: "24 saat soğuk damıtma tekniği ile demlenmiş, asiditesi düşük, yoğun çikolata notalı şekersiz soğuk kahve.",
    price: 150,
    isAvailable: true,
    tags: ["Soğuk", "Şekersiz", "Vegan", "Glutensiz"],
  },
  {
    id: "p-7",
    categoryId: "cat-3",
    categoryName: "Soğuk İçecekler",
    name: "Coca-Cola Orijinal",
    description: "Soğuk servis edilen, ferahlatıcı ve klasik şekerli gazlı meşrubat içecek. Asla kahve değildir.",
    price: 75,
    isAvailable: true,
    tags: ["Soğuk", "Şekerli", "Gazlı İçecek", "Glutensiz", "Vegan"],
  },
  {
    id: "p-8",
    categoryId: "cat-3",
    categoryName: "Soğuk İçecekler",
    name: "Coca-Cola Zero Sugar",
    description: "Soğuk servis edilen, sıfır şeker ve kalorisiz ferahlatıcı gazlı meşrubat içecek.",
    price: 75,
    isAvailable: true,
    tags: ["Soğuk", "Şekersiz", "Gazlı İçecek", "Glutensiz", "Vegan"],
  },
  {
    id: "p-9",
    categoryId: "cat-4",
    categoryName: "Tatlılar & Pastacılık",
    name: "San Sebastian Cheesecake (Belçika Çikolatalı)",
    description: "İpeksi dokulu, fırınlanmış Bask usulü cheesecake, sıcak Callebaut Belçika çikolatası eşliğinde.",
    price: 195,
    isAvailable: true,
    tags: ["Tatlı", "Şekerli", "Glutensiz", "Süt Ürünü İçerir"],
  },
  {
    id: "p-10",
    categoryId: "cat-5",
    categoryName: "Atıştırmalık & Mutfak",
    name: "Avokadolu Poşe Yumurtalı Ekşi Maya Tost",
    description: "Kızarmış artizan ekşi maya ekmeği üzerine taze ezilmiş avokado, labne ve çiftlik poşe yumurta.",
    price: 220,
    isAvailable: true,
    tags: ["Sıcak", "Şekersiz", "Glüten İçerir", "Vejetaryen"],
  },
]

export class ApiClient {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const cleanEndpoint = endpoint.trim()
    const cleanBaseUrl = API_BASE_URL.trim()
    const url = `${cleanBaseUrl}${cleanEndpoint}`.trim()

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
      const trimmedCafeId = cafeId?.trim()
      const endpoint = trimmedCafeId ? `/api/menu/init?cafeId=${encodeURIComponent(trimmedCafeId)}`.trim() : "/api/menu/init"
      return await this.request<MenuInitDto>(endpoint)
    } catch (error) {
      console.warn("apiClient.initMenu fallback activated:", error)
      return {
        cafeId: cafeId?.trim() || FALLBACK_CAFE.id,
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
    const trimmedQuery = query.trim()
    const trimmedCafeId = cafeId?.trim()

    try {
      return await this.request<MenuSearchResultDto>("/api/menu/search", {
        method: "POST",
        body: JSON.stringify({ query: trimmedQuery, cafeId: trimmedCafeId }),
      })
    } catch (error) {
      console.warn("apiClient.searchMenu fallback activated:", error)
      const lower = trimmedQuery.toLowerCase()

      // Handle greetings in fallback
      if (
        lower.includes("merhaba") ||
        lower.includes("selam") ||
        lower.includes("günaydın") ||
        lower.includes("iyi günler") ||
        lower.includes("nasılsın")
      ) {
        return {
          message: "Merhaba! Hoş geldiniz, bugün canınız nasıl bir lezzet çekiyor? Menümüzden dilediğinizi sorabilirsiniz.",
          products: [],
        }
      }

      // Smart client-side fallback matching
      let matched = [...FALLBACK_PRODUCTS]

      if (lower.includes("kahve") || lower.includes("latte") || lower.includes("espresso")) {
        matched = matched.filter((p) => p.categoryName.includes("Kahve"))
      } else if (lower.includes("tatlı") || lower.includes("pasta") || lower.includes("cheesecake")) {
        matched = matched.filter((p) => p.categoryName.includes("Tatlı"))
      } else if (lower.includes("tost") || lower.includes("atıştır")) {
        matched = matched.filter((p) => p.categoryName.includes("Atıştırmalık"))
      } else if (lower.includes("kola") || lower.includes("gazoz") || lower.includes("içecek")) {
        matched = matched.filter((p) => p.categoryName.includes("Soğuk İçecek"))
      }

      // Temperature filter
      if (lower.includes("sıcak")) {
        matched = matched.filter((p) => p.tags.includes("Sıcak") || p.categoryName.includes("Sıcak"))
      } else if (lower.includes("soğuk")) {
        matched = matched.filter((p) => p.tags.includes("Soğuk") || p.categoryName.includes("Soğuk"))
      }

      // Sugar filter
      if (lower.includes("şekersiz")) {
        matched = matched.filter((p) => !p.tags.includes("Şekerli"))
      } else if (lower.includes("şekerli")) {
        matched = matched.filter((p) => p.tags.includes("Şekerli"))
      }
      // Dairy-free filter
      const wantsDairyFree =
        lower.includes("sütsüz") ||
        lower.includes("sutsuz") ||
        lower.includes("laktozsuz") ||
        lower.includes("süt istemiyorum") ||
        lower.includes("süt olmasın") ||
        lower.includes("süt alerji")

      if (wantsDairyFree) {
        matched = matched.filter(
          (p) =>
            !p.tags.some(
              (t) =>
                t.toLowerCase().includes("süt") &&
                !t.toLowerCase().includes("sütsüz")
            ) &&
            !p.name.toLowerCase().includes("latte") &&
            !p.name.toLowerCase().includes("cappuccino") &&
            !p.name.toLowerCase().includes("flat white") &&
            !p.name.toLowerCase().includes("mocha") &&
            !p.name.toLowerCase().includes("frappe")
        )
      } else if (lower.includes("sütlü") || lower.includes("sutlu")) {
        matched = matched.filter(
          (p) =>
            p.tags.some(
              (t) =>
                t.toLowerCase().includes("süt") &&
                !t.toLowerCase().includes("sütsüz")
            ) ||
            p.name.toLowerCase().includes("latte") ||
            p.name.toLowerCase().includes("cappuccino") ||
            p.name.toLowerCase().includes("flat white") ||
            p.name.toLowerCase().includes("mocha") ||
            p.name.toLowerCase().includes("frappe")
        )
      }

      // Gluten-free filter
      if (lower.includes("glutensiz") || lower.includes("glütensiz")) {
        matched = matched.filter(
          (p) => !p.tags.some((t) => t.toLowerCase().includes("gluten") || t.toLowerCase().includes("glüten"))
        )
      }

      // Vegetarian & meat-free filter
      if (lower.includes("vejetaryen") || lower.includes("vejeteryan") || lower.includes("etsiz") || lower.includes("tavuksuz")) {
        matched = matched.filter(
          (p) =>
            p.tags.some((t) => t.toLowerCase().includes("vejetaryen") || t.toLowerCase().includes("vegan")) &&
            !p.name.toLowerCase().includes("tavuk") &&
            !p.name.toLowerCase().includes("hindi") &&
            !p.name.toLowerCase().includes("et")
        )
      }

      // Vegan filter
      if (lower.includes("vegan") || lower.includes("bitkisel")) {
        matched = matched.filter(
          (p) =>
            p.tags.includes("Vegan") &&
            !p.tags.some((t) => t.includes("Süt") || t.includes("Yumurta"))
        )
      }

      // Decaf filter
      if (lower.includes("kafeinsiz") || lower.includes("decaf")) {
        matched = matched.filter((p) => p.tags.includes("Kafeinsiz") || p.name.toLowerCase().includes("kafeinsiz"))
      }

      const msg =
        matched.length > 0
          ? `Sizin için menümüzden lezzetli seçenekler listelendi:`
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
