import { CategoryDto, ProductDto } from "@/types/menu"

export interface ConsolidatedCategory {
  canonicalName: string
  id: string
  cafeId: string
  name: string
  aliasCategoryIds: string[]
  aliasNames: string[]
  products: ProductDto[]
  productCount: number
}

/**
 * Normalizes raw category names into standardized canonical category names.
 */
export function getCanonicalCategoryName(rawName: string): string {
  const norm = (rawName || "").trim().toLowerCase()

  if (norm.includes("sıcak kahve") || norm.includes("sicak kahve")) {
    return "Sıcak Kahveler"
  }
  if (norm.includes("soğuk kahve") || norm.includes("soguk kahve")) {
    return "Soğuk Kahveler"
  }
  if (
    norm.includes("soğuk içecek") ||
    norm.includes("soguk icecek") ||
    norm.includes("içecek") ||
    norm.includes("icecek") ||
    norm.includes("meşrubat")
  ) {
    return "Soğuk İçecekler"
  }
  if (
    norm.includes("tatlı") ||
    norm.includes("tatli") ||
    norm.includes("pasta") ||
    norm.includes("kek") ||
    norm.includes("tatlilar") ||
    norm.includes("tatlılar")
  ) {
    return "Tatlılar & Pastacılık"
  }
  if (
    norm.includes("atıştır") ||
    norm.includes("atistir") ||
    norm.includes("mutfak") ||
    norm.includes("tost") ||
    norm.includes("sandviç") ||
    norm.includes("sandvic") ||
    norm.includes("yiyecek")
  ) {
    return "Atıştırmalık & Mutfak"
  }

  return rawName.trim()
}

/**
 * Consolidates, deduplicates and merges categories and their products.
 * E.g. "Tatlılar" (2) + "Tatlılar & Pastacılık" (6) -> "Tatlılar & Pastacılık" (8)
 * and deduplicates repeated "Sıcak Kahveler" and "Soğuk İçecekler".
 */
export function consolidateCategories(
  categories: CategoryDto[],
  products: ProductDto[]
): ConsolidatedCategory[] {
  const canonicalMap = new Map<string, ConsolidatedCategory>()

  const CANONICAL_ORDER = [
    "Sıcak Kahveler",
    "Soğuk Kahveler",
    "Soğuk İçecekler",
    "Tatlılar & Pastacılık",
    "Atıştırmalık & Mutfak",
  ]

  // Initialize canonical categories
  for (const c of categories) {
    const canonicalName = getCanonicalCategoryName(c.name)
    if (!canonicalMap.has(canonicalName)) {
      canonicalMap.set(canonicalName, {
        canonicalName,
        id: c.id || `canonical-${canonicalName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        cafeId: c.cafeId || "",
        name: canonicalName,
        aliasCategoryIds: c.id ? [c.id] : [],
        aliasNames: [c.name],
        products: [],
        productCount: 0,
      })
    } else {
      const existing = canonicalMap.get(canonicalName)!
      if (c.id && !existing.aliasCategoryIds.includes(c.id)) {
        existing.aliasCategoryIds.push(c.id)
      }
      if (c.name && !existing.aliasNames.includes(c.name)) {
        existing.aliasNames.push(c.name)
      }
    }
  }

  // Deduplicate products themselves by id or normalized name
  const seenProductKeys = new Set<string>()
  const uniqueProducts: ProductDto[] = []
  for (const p of products) {
    const key = (p.id || p.name).toLowerCase().trim()
    if (!seenProductKeys.has(key)) {
      seenProductKeys.add(key)
      uniqueProducts.push(p)
    }
  }

  // Group unique products into their respective canonical categories
  for (const prod of uniqueProducts) {
    const prodCatCanonicalName = getCanonicalCategoryName(prod.categoryName || "")
    let target = canonicalMap.get(prodCatCanonicalName)

    if (!target) {
      for (const entry of Array.from(canonicalMap.values())) {
        if (entry.aliasCategoryIds.includes(prod.categoryId)) {
          target = entry
          break
        }
      }
    }

    if (target) {
      target.products.push(prod)
      target.productCount++
    } else {
      const groupName = getCanonicalCategoryName(prod.categoryName || "Diğer")
      if (!canonicalMap.has(groupName)) {
        canonicalMap.set(groupName, {
          canonicalName: groupName,
          id: prod.categoryId || `canonical-${groupName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          cafeId: "",
          name: groupName,
          aliasCategoryIds: prod.categoryId ? [prod.categoryId] : [],
          aliasNames: [prod.categoryName],
          products: [prod],
          productCount: 1,
        })
      } else {
        const group = canonicalMap.get(groupName)!
        group.products.push(prod)
        group.productCount++
      }
    }
  }

  // Sort according to preferred canonical order
  return Array.from(canonicalMap.values()).sort((a, b) => {
    const idxA = CANONICAL_ORDER.indexOf(a.canonicalName)
    const idxB = CANONICAL_ORDER.indexOf(b.canonicalName)
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    return a.canonicalName.localeCompare(b.canonicalName, "tr")
  })
}
