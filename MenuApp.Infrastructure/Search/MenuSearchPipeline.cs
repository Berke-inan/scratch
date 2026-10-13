using MenuApp.Core.DTOs;
using MenuApp.Core.Entities;
using MenuApp.Core.Enums;
using MenuApp.Core.Interfaces;
using MenuApp.Infrastructure.Services;
using Microsoft.Extensions.Logging;

namespace MenuApp.Infrastructure.Search;

/// <summary>
/// Deterministik Arama, Filtreleme ve Skorlama Boru Hattı (MenuSearchPipeline).
/// 4 aşamalı deterministik pipeline mimarisi ile çalışır:
/// 1. Macro-Domain Isolation (Katman 1 Kapsam İzolasyonu)
/// 2. Hard Exclusions (0 Toleranslı Negatif Elemeler)
/// 3. Hard Inclusions (Sıcaklık, Bütçe ve Zorunlu Kriterler)
/// 4. Relevance Scoring & Sorting (Semantik Ağırlıklı Puanlama ve Sıralama)
/// </summary>
public class MenuSearchPipeline
{
    private readonly ITaxonomyRegistry _taxonomyRegistry;
    private readonly ILogger _logger;

    public record SearchContext(
        string NormalizedQuery,
        MacroDomain? MacroDomain,
        string? AiCategory,
        List<string> ExcludeTags,
        List<string> SearchKeywords,
        string PricePreference,
        decimal? MaxPrice,
        decimal? MinPrice
    );

    public MenuSearchPipeline(ITaxonomyRegistry taxonomyRegistry, ILogger logger)
    {
        _taxonomyRegistry = taxonomyRegistry;
        _logger = logger;
    }

    public List<Product> Execute(IEnumerable<Product> initialProducts, SearchContext context)
    {
        var candidates = initialProducts.Where(p => p.IsAvailable).ToList();
        _logger.LogInformation(">>> [PIPELINE] Başlangıç aday havuzu: {Count} ürün.", candidates.Count);

        // =========================================================================
        // AŞAMA 1: MACRO-DOMAIN ISOLATION (Katman 1: Makro Alan İzolasyonu)
        // =========================================================================
        if (context.MacroDomain.HasValue)
        {
            var targetDomain = context.MacroDomain.Value;
            var allowedCategories = _taxonomyRegistry.GetCategoriesForDomain(targetDomain);
            var negativeDomains = _taxonomyRegistry.GetImplicitNegativeDomains(targetDomain);

            _logger.LogInformation(">>> [PIPELINE: STAGE 1] Makro Alan: {Domain}. İzin verilen kategoriler: [{Cats}]. Zıt alanlar: [{Negs}].",
                targetDomain, string.Join(", ", allowedCategories), string.Join(", ", negativeDomains));

            candidates = candidates.Where(p =>
            {
                if (p.Category == null) return false;

                // 1. Ürünün kategorisi bu makro alana ait mi?
                var catDomain = _taxonomyRegistry.GetDomainForCategory(p.Category.Name);
                if (catDomain != targetDomain)
                {
                    return false;
                }

                // 2. Zıt alanlardan kesin izolasyon
                if (catDomain.HasValue && negativeDomains.Contains(catDomain.Value))
                {
                    return false;
                }

                return true;
            }).ToList();

            _logger.LogInformation(">>> [PIPELINE: STAGE 1] Makro alan izolasyonu sonrası kalan ürün sayısı: {Count}", candidates.Count);
        }
        else
        {
            _logger.LogInformation(">>> [PIPELINE: STAGE 1] Belirli bir makro alan kısıtı yok (tüm alanlar açık).");
        }

        // =========================================================================
        // AŞAMA 2: HARD EXCLUSIONS (0 Toleranslı Sert Elemeler)
        // =========================================================================
        var q = context.NormalizedQuery;
        var negativeTags = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var tag in context.ExcludeTags)
        {
            negativeTags.Add(GeminiAiService.NormalizeText(tag));
        }

        // Dil bazlı olumsuzluk ve alerjen ekleri (-siz, -suz, istemiyorum, olmasın)
        bool wantsDairyFree = q.Contains("sutsuz") || q.Contains("laktozsuz") ||
                              q.Contains("sut istemiyorum") || q.Contains("sut olmasin") || q.Contains("sut alerji");
        bool wantsSugarFree = q.Contains("sekersiz") || q.Contains("diyet") || q.Contains("sugar-free") || q.Contains("seker istemiyorum");
        bool wantsGlutenFree = q.Contains("glutensiz") || q.Contains("colyak") || q.Contains("gluten-free") || q.Contains("gluten istemiyorum");
        bool wantsMeatFree = q.Contains("etsiz") || q.Contains("tavuksuz") || q.Contains("vejetaryen") || q.Contains("vejeteryan");

        candidates = candidates.Where(p =>
        {
            var pName = GeminiAiService.NormalizeText(p.Name);
            var pTags = p.Tags.Select(t => GeminiAiService.NormalizeText(t.Name)).ToList();

            // AI veya kullanıcı tarafından belirtilen exclude_tags
            foreach (var neg in negativeTags)
            {
                if (pTags.Any(t => t.Contains(neg)) || pName.Contains(neg))
                {
                    return false;
                }
            }

            // Süt / Laktoz Elemesi
            if (wantsDairyFree)
            {
                if (pTags.Any(t => t.Contains("sut") && !t.Contains("sutsuz"))) return false;
                if (pTags.Any(t => t.Contains("sut urunu icerir"))) return false;
                if (pName.Contains("latte") || pName.Contains("cappuccino") || pName.Contains("flat white") ||
                    pName.Contains("mocha") || pName.Contains("frappe"))
                {
                    return false;
                }
            }

            // Şeker Elemesi
            if (wantsSugarFree)
            {
                if (pTags.Any(t => t.Equals("sekerli") || t.Contains("seker icerir"))) return false;
            }

            // Gluten Elemesi
            if (wantsGlutenFree)
            {
                if (pTags.Any(t => t.Contains("gluten icerir") || t.Equals("gluten"))) return false;
            }

            // Et / Tavuk Elemesi
            if (wantsMeatFree)
            {
                if (pName.Contains("tavuk") || pName.Contains("hindi") || pName.Contains("et ") || pName.StartsWith("et ")) return false;
            }

            return true;
        }).ToList();

        _logger.LogInformation(">>> [PIPELINE: STAGE 2] Sert elemeler sonrası kalan ürün sayısı: {Count}", candidates.Count);

        // =========================================================================
        // AŞAMA 3: HARD INCLUSIONS & CONSTRAINTS (Zorunlu Kriterler)
        // =========================================================================
        bool wantsHot = q.Contains("sicak") || q.Contains("hot");
        bool wantsCold = q.Contains("soguk") || q.Contains("cold") || q.Contains("buzlu") || q.Contains("iced");

        // Sıcaklık Filtresi (yalnızca tek yönlü talep varsa)
        if (wantsHot && !wantsCold)
        {
            var hotMatches = candidates.Where(p =>
                p.Tags.Any(t => GeminiAiService.NormalizeText(t.Name).Contains("sicak")) ||
                (p.Category != null && GeminiAiService.NormalizeText(p.Category.Name).StartsWith("sicak"))
            ).ToList();

            if (hotMatches.Count > 0) candidates = hotMatches;
        }
        else if (wantsCold && !wantsHot)
        {
            var coldMatches = candidates.Where(p =>
                p.Tags.Any(t => GeminiAiService.NormalizeText(t.Name).Contains("soguk")) ||
                (p.Category != null && GeminiAiService.NormalizeText(p.Category.Name).StartsWith("soguk"))
            ).ToList();

            if (coldMatches.Count > 0) candidates = coldMatches;
        }

        // Fiyat Üst / Alt Sınırı
        if (context.MaxPrice.HasValue)
        {
            candidates = candidates.Where(p => p.Price <= context.MaxPrice.Value).ToList();
        }
        if (context.MinPrice.HasValue)
        {
            candidates = candidates.Where(p => p.Price >= context.MinPrice.Value).ToList();
        }

        // Vegan Kriteri
        if (q.Contains("vegan") || q.Contains("bitkisel"))
        {
            candidates = candidates.Where(p =>
                p.Tags.Any(t => GeminiAiService.NormalizeText(t.Name).Equals("vegan"))
            ).ToList();
        }

        _logger.LogInformation(">>> [PIPELINE: STAGE 3] Zorunlu kriterler sonrası kalan ürün sayısı: {Count}", candidates.Count);

        // =========================================================================
        // AŞAMA 4: RELEVANCE SCORING & SORTING (Puanlama ve Sıralama)
        // Score = (İsim Eşleşmesi * 3) + (Nitelik/Etiket Eşleşmesi * 2) + (Açıklama Eşleşmesi * 1)
        // =========================================================================
        var queryTokens = q.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(t => t.Length > 2)
            .ToList();

        var scored = candidates.Select(p =>
        {
            int score = 0;
            var pName = GeminiAiService.NormalizeText(p.Name);
            var pDesc = GeminiAiService.NormalizeText(p.Description ?? "");
            var pTags = p.Tags.Select(t => GeminiAiService.NormalizeText(t.Name)).ToList();

            foreach (var token in queryTokens)
            {
                // İsim Eşleşmesi (Ağırlık: 3)
                if (pName.Contains(token))
                {
                    score += 3;
                    if (pName.StartsWith(token)) score += 2; // Başlangıç bonusu
                }

                // Etiket Eşleşmesi (Ağırlık: 2)
                if (pTags.Any(t => t.Contains(token)))
                {
                    score += 2;
                }

                // Açıklama Eşleşmesi (Ağırlık: 1)
                if (pDesc.Contains(token))
                {
                    score += 1;
                }
            }

            // SearchKeywords bonusu
            foreach (var kw in context.SearchKeywords)
            {
                var cleanKw = GeminiAiService.NormalizeText(kw);
                if (pName.Contains(cleanKw)) score += 4;
            }

            return new { Product = p, Score = score };
        }).ToList();

        // Bütçe ve Fiyat Sıralaması Entegrasyonu
        if (context.PricePreference == "cheap")
        {
            return scored
                .OrderBy(x => x.Product.Price)
                .ThenByDescending(x => x.Score)
                .Select(x => x.Product)
                .ToList();
        }
        else if (context.PricePreference == "expensive")
        {
            return scored
                .OrderByDescending(x => x.Product.Price)
                .ThenByDescending(x => x.Score)
                .Select(x => x.Product)
                .ToList();
        }
        else
        {
            return scored
                .OrderByDescending(x => x.Score)
                .ThenBy(x => x.Product.Price)
                .Select(x => x.Product)
                .ToList();
        }
    }
}
