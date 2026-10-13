/**
 * Dinamik ve Bağlamsal Etiket Önceliklendirme (Context-Aware Tag Scoring Engine)
 *
 * Etiket Skoru = (Sorgu ile Birebir Eşleşme ? 100 : 0) 
 *              + (Diyet/Yaşam Tarzı Rozeti [Vegan, Vejetaryen, Şekersiz] ? 50 : 0)
 *              + (Alerjen Rozeti ? 30 : 0)
 *              + (Temel Durum [Sıcak/Soğuk] ? 10 : 0)
 *              - (Doğal/Gereksiz Rozet [Kahvede Glutensiz vb.] ? -40 : 0)
 */
export function calculateTagScore(
  tag: string,
  userQuery = "",
  categoryName = ""
): number {
  if (!tag) return 0

  const t = tag.toLowerCase()
  const q = (userQuery || "").toLowerCase()
  const isCoffee = (categoryName || "").toLowerCase().includes("kahve")

  let score = 0

  // 1. Sorgu ile Birebir Eşleşme (Query Relevance - +100 Puan)
  const isExactQueryMatch =
    ((q.includes("süt") || q.includes("sut") || q.includes("laktoz")) &&
      (t.includes("laktozsuz") || t.includes("sütsüz") || t.includes("sutsuz"))) ||
    ((q.includes("şeker") || q.includes("seker") || q.includes("diyet")) &&
      (t.includes("şekersiz") || t.includes("sekersiz"))) ||
    ((q.includes("sıcak") || q.includes("sicak") || q.includes("hot")) &&
      (t === "sıcak" || t === "sicak")) ||
    ((q.includes("soğuk") || q.includes("soguk") || q.includes("buzlu") || q.includes("iced")) &&
      (t === "soğuk" || t === "soguk")) ||
    ((q.includes("vegan") || q.includes("bitkisel")) && t === "vegan") ||
    ((q.includes("vejetar") || q.includes("etsiz")) && t.includes("vejetar")) ||
    ((q.includes("gluten") || q.includes("çölyak") || q.includes("colyak")) && t.includes("gluten"))

  if (isExactQueryMatch) {
    score += 100
  }

  // 2. Diyet / Yaşam Tarzı Rozeti [Vegan, Vejetaryen, Şekersiz, Laktozsuz] (+50 Puan)
  const isLifestyleBadge =
    t === "vegan" ||
    t.includes("vejetar") ||
    t.includes("şekersiz") ||
    t.includes("sekersiz") ||
    t.includes("laktozsuz") ||
    t.includes("sütsüz")

  if (isLifestyleBadge) {
    score += 50
  }

  // 3. Alerjen Rozeti [İçerir / Alerjen / Fındık / Fıstık] (+30 Puan)
  const isAllergenBadge =
    t.includes("içerir") ||
    t.includes("icerir") ||
    t.includes("alerjen") ||
    t.includes("fındık") ||
    t.includes("fıstık") ||
    t.includes("soya")

  if (isAllergenBadge) {
    score += 30
  }

  // 4. Temel Durum [Sıcak / Soğuk] (+10 Puan)
  const isBasicTemp =
    t === "sıcak" || t === "sicak" || t === "soğuk" || t === "soguk"

  if (isBasicTemp) {
    score += 10
  }

  // 5. Doğal / Gereksiz Rozet [Kahvede Glutensiz vb.] (-40 Puan)
  if (isCoffee && t.includes("gluten")) {
    score -= 40
  }

  return score
}

export function getSmartProductTags(
  tags: string[] = [],
  userQuery = "",
  categoryName = ""
): string[] {
  if (!tags || tags.length === 0) return []

  // Tüm etiketleri skorlarına göre azalan şekilde sırala
  const scoredTags = tags
    .map((tag) => ({
      tag,
      score: calculateTagScore(tag, userQuery, categoryName),
    }))
    .sort((a, b) => b.score - a.score)

  // En yüksek skorlu ilk etiketi al
  const topScored = scoredTags[0]

  // Eğer sorguyla birebir eşleşen birden fazla etiket varsa (örn. "sütsüz sıcak" -> Laktozsuz + Sıcak)
  const queryMatched = scoredTags.filter((st) => st.score >= 100)
  if (queryMatched.length > 1) {
    return queryMatched.slice(0, 2).map((st) => st.tag)
  }

  return [topScored.tag]
}
