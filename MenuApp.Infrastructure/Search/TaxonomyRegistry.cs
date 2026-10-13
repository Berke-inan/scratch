using MenuApp.Core.Enums;
using MenuApp.Core.Interfaces;
using MenuApp.Infrastructure.Services;

namespace MenuApp.Infrastructure.Search;

/// <summary>
/// Genelleştirilmiş Taksonomi ve Eş Anlam Motoru (Taxonomy & Synonym Registry).
/// İki aşamalı kapsam/makro alan yönetimi ve semantik haritalamayı deterministik olarak yürütür.
/// </summary>
public class TaxonomyRegistry : ITaxonomyRegistry
{
    private class DomainDefinition
    {
        public MacroDomain Domain { get; init; }
        public required IReadOnlyList<string> Categories { get; init; }
        public required IReadOnlyList<string> RootKeywords { get; init; }
        public required IReadOnlyList<string> Synonyms { get; init; }
        public required IReadOnlyList<MacroDomain> ImplicitNegativeDomains { get; init; }
    }

    private readonly IReadOnlyList<DomainDefinition> _domains;
    private readonly Dictionary<string, MacroDomain> _categoryToDomainMap;

    public TaxonomyRegistry()
    {
        _domains = new List<DomainDefinition>
        {
            new()
            {
                Domain = MacroDomain.BeverageCoffee,
                Categories = new[] { "Sıcak Kahveler", "Soğuk Kahveler" },
                RootKeywords = new[]
                {
                    "kahve", "kahveler", "espresso", "latte", "filtre", "cappuccino",
                    "americano", "cortado", "macchiato", "flat white", "mocha", "turk kahvesi",
                    "cold brew", "frappe", "v60", "chemex", "aeropress", "ristretto", "lungo", "iced latte", "iced americano"
                },
                Synonyms = new[]
                {
                    "kafein", "ayılmak", "kahve molası", "taze çekilmiş", "demleme", "single origin", "çekirdek"
                },
                ImplicitNegativeDomains = new[]
                {
                    MacroDomain.FoodKitchen,
                    MacroDomain.FoodDessert
                }
            },
            new()
            {
                Domain = MacroDomain.BeverageOther,
                Categories = new[] { "Soğuk İçecekler" },
                RootKeywords = new[]
                {
                    "icecek", "mesrubat", "kola", "cola", "gazoz", "soda", "maden suyu",
                    "limonata", "soguk cay", "ice tea", "portakal suyu", "su", "fanta", "sprite", "meyve suyu"
                },
                Synonyms = new[]
                {
                    "susadim", "susuzluk", "ferahlatici", "serinletici", "hararet", "gazli icecek", "gazli", "mesrubatlar"
                },
                ImplicitNegativeDomains = new[]
                {
                    MacroDomain.FoodKitchen
                }
            },
            new()
            {
                Domain = MacroDomain.FoodKitchen,
                Categories = new[] { "Atıştırmalık & Mutfak" },
                RootKeywords = new[]
                {
                    "kahvalti", "tost", "sandvic", "kruvasan sandvic", "wrap", "bowl",
                    "patates", "atistirmalik", "ana yemek", "yemek", "snack", "ogün", "yiyecek"
                },
                Synonyms = new[]
                {
                    "acim", "aciktim", "doyurucu", "brunch", "ogle yemegi", "sabah kahvaltisi", "tuzlu", "atistirma", "karin doyur"
                },
                ImplicitNegativeDomains = new[]
                {
                    MacroDomain.BeverageCoffee,
                    MacroDomain.BeverageOther,
                    MacroDomain.FoodDessert
                }
            },
            new()
            {
                Domain = MacroDomain.FoodDessert,
                Categories = new[] { "Tatlılar & Pastacılık", "Tatlılar" },
                RootKeywords = new[]
                {
                    "tatli", "pasta", "kek", "cheesecake", "brownie", "tiramisu",
                    "puding", "kurabiye", "kruvasan", "profiterol", "san sebastian", "tatlilar"
                },
                Synonyms = new[]
                {
                    "tatli krizindeyim", "sekerim dustu", "cikolata", "tatli bir seyler", "kahve yani tatli", "tatlici", "pasta borek"
                },
                ImplicitNegativeDomains = new[]
                {
                    MacroDomain.FoodKitchen
                }
            }
        };

        // Kategori adından Makro Alana hızlı harita (Normalize edilmiş adlarla)
        _categoryToDomainMap = new Dictionary<string, MacroDomain>(StringComparer.OrdinalIgnoreCase);
        foreach (var def in _domains)
        {
            foreach (var cat in def.Categories)
            {
                _categoryToDomainMap[cat] = def.Domain;
                _categoryToDomainMap[GeminiAiService.NormalizeText(cat)] = def.Domain;
            }
        }
    }

    public MacroDomain? ResolveMacroDomain(string normalizedQuery, string? suggestedCategory = null)
    {
        var normQuery = GeminiAiService.NormalizeText(normalizedQuery).Trim();
        var domainScores = new Dictionary<MacroDomain, int>();

        foreach (var def in _domains)
        {
            domainScores[def.Domain] = 0;

            // 1. Root Keywords (Ağırlık: 3 puan)
            foreach (var kw in def.RootKeywords)
            {
                if (normQuery.Contains(kw))
                {
                    domainScores[def.Domain] += 3;
                }
            }

            // 2. Synonyms (Ağırlık: 2 puan)
            foreach (var syn in def.Synonyms)
            {
                if (normQuery.Contains(syn))
                {
                    domainScores[def.Domain] += 2;
                }
            }
        }

        // 3. AI Önerisi veya Kanonik Kategori haritası (Ağırlık: 4 puan)
        if (!string.IsNullOrWhiteSpace(suggestedCategory))
        {
            var cleanCat = GeminiAiService.NormalizeText(suggestedCategory);
            foreach (var kvp in _categoryToDomainMap)
            {
                if (cleanCat.Contains(kvp.Key) || kvp.Key.Contains(cleanCat))
                {
                    domainScores[kvp.Value] += 4;
                    break;
                }
            }
        }

        // En yüksek puanlı domainleri belirle
        var scoredDomains = domainScores
            .Where(kvp => kvp.Value > 0)
            .OrderByDescending(kvp => kvp.Value)
            .ToList();

        if (scoredDomains.Count == 0)
        {
            // Belirli bir makro alan tespit edilmedi (Örn: "ucuz bir şeyler öner", "glutensiz ne var?")
            return null;
        }

        var top = scoredDomains.First();

        // Eğer birden fazla farklı makro alan güçlü skor aldıysa (Örn: "kahve ve tost" - çoklu niyet)
        if (scoredDomains.Count > 1)
        {
            var second = scoredDomains[1];
            // Eğer iki alan birbirine zıtsa ve puanları yakınsa (<2 fark), izolasyon yapma, tüm havuzu açık tut
            if (top.Value - second.Value < 2 &&
                GetImplicitNegativeDomains(top.Key).Contains(second.Key))
            {
                return null;
            }
        }

        return top.Key;
    }

    public IReadOnlyList<string> GetCategoriesForDomain(MacroDomain domain)
    {
        var match = _domains.FirstOrDefault(d => d.Domain == domain);
        return match?.Categories ?? Array.Empty<string>();
    }

    public MacroDomain? GetDomainForCategory(string categoryName)
    {
        if (string.IsNullOrWhiteSpace(categoryName)) return null;

        var clean = GeminiAiService.NormalizeText(categoryName);
        if (_categoryToDomainMap.TryGetValue(clean, out var domain))
        {
            return domain;
        }

        foreach (var kvp in _categoryToDomainMap)
        {
            if (clean.Contains(kvp.Key) || kvp.Key.Contains(clean))
            {
                return kvp.Value;
            }
        }

        return null;
    }

    public IReadOnlyList<MacroDomain> GetImplicitNegativeDomains(MacroDomain domain)
    {
        var match = _domains.FirstOrDefault(d => d.Domain == domain);
        return match?.ImplicitNegativeDomains ?? Array.Empty<MacroDomain>();
    }

    public bool IsCategoryInDomain(string categoryName, MacroDomain domain)
    {
        var catDomain = GetDomainForCategory(categoryName);
        return catDomain == domain;
    }

    public int CalculateTagScore(string tag, string normalizedQuery, string? categoryName)
    {
        if (string.IsNullOrWhiteSpace(tag)) return 0;

        var t = GeminiAiService.NormalizeText(tag);
        var q = GeminiAiService.NormalizeText(normalizedQuery);
        bool isCoffee = categoryName != null && GetDomainForCategory(categoryName) == MacroDomain.BeverageCoffee;

        int score = 0;

        // 1. Sorgu ile Birebir Eşleşme (Query Relevance) -> +100
        bool matchesQuery =
            ((q.Contains("sut") || q.Contains("laktoz")) && (t.Contains("laktozsuz") || t.Contains("sutsuz"))) ||
            ((q.Contains("seker") || q.Contains("diyet")) && t.Contains("sekersiz")) ||
            ((q.Contains("sicak") || q.Contains("hot")) && t.Equals("sicak")) ||
            ((q.Contains("soguk") || q.Contains("iced") || q.Contains("buzlu")) && t.Equals("soguk")) ||
            ((q.Contains("vegan") || q.Contains("bitkisel")) && t.Equals("vegan")) ||
            ((q.Contains("vejetar") || q.Contains("etsiz")) && t.Contains("vejetar")) ||
            ((q.Contains("gluten") || q.Contains("colyak")) && t.Contains("gluten"));

        if (matchesQuery)
        {
            score += 100;
        }

        // 2. Diyet / Yaşam Tarzı Rozeti [Vegan, Vejetaryen, Şekersiz, Laktozsuz] -> +50
        if (t.Equals("vegan") || t.Contains("vejetar") || t.Contains("sekersiz") || t.Contains("laktozsuz") || t.Contains("sutsuz"))
        {
            score += 50;
        }

        // 3. Alerjen Rozeti [İçerir / Alerjen] -> +30
        if (t.Contains("icerir") || t.Contains("alerjen") || t.Contains("findik") || t.Contains("fistik") || t.Contains("soya"))
        {
            score += 30;
        }

        // 4. Temel Durum [Sıcak / Soğuk] -> +10
        if (t.Equals("sicak") || t.Equals("soguk"))
        {
            score += 10;
        }

        // 5. Doğal / Gereksiz Rozet [Kahvede Glutensiz vb.] -> -40
        if (isCoffee && t.Contains("gluten"))
        {
            score -= 40;
        }

        return score;
    }

    public string? SelectPrimaryTag(IEnumerable<string> tags, string normalizedQuery, string? categoryName)
    {
        if (tags == null) return null;

        var list = tags.Where(t => !string.IsNullOrWhiteSpace(t)).ToList();
        if (list.Count == 0) return null;

        return list
            .OrderByDescending(t => CalculateTagScore(t, normalizedQuery, categoryName))
            .FirstOrDefault();
    }
}
