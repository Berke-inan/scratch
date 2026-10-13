using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using MenuApp.Core.DTOs;
using MenuApp.Core.Interfaces;
using MenuApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MenuApp.Infrastructure.Services;

public class MenuService : IMenuService
{
    private readonly IAiService _aiService;
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<MenuService> _logger;

    private record AiIntentPayload(
        [property: JsonPropertyName("intent")] string? Intent,
        [property: JsonPropertyName("ai_message")] string? AiMessage,
        [property: JsonPropertyName("category")] string? Category,
        [property: JsonPropertyName("search_keywords")] List<string>? SearchKeywords,
        [property: JsonPropertyName("exclude_tags")] List<string>? ExcludeTags,
        [property: JsonPropertyName("price_preference")] string? PricePreference,
        [property: JsonPropertyName("max_price")] decimal? MaxPrice,
        [property: JsonPropertyName("min_price")] decimal? MinPrice
    );

    public MenuService(
        IAiService aiService,
        ApplicationDbContext dbContext,
        ILogger<MenuService> logger)
    {
        _aiService = aiService;
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<MenuInitDto> GetInitMessageAsync(Guid cafeId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("=================================================");
        _logger.LogInformation(">>> [MENU INIT] Kafe karşılama isteği alındı: {CafeId}", cafeId);

        var cafe = await _dbContext.Cafes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == cafeId, cancellationToken);

        if (cafe == null)
        {
            _logger.LogWarning(">>> [MENU INIT] '{CafeId}' kimlikli kafe bulunamadı.", cafeId);
            throw new KeyNotFoundException($"'{cafeId}' kimlikli kafe bulunamadı.");
        }

        var rawWelcomeMessage = await _aiService.GenerateWelcomeMessageAsync(cafe.Name, cancellationToken);
        var baristaFallback = $"Merhaba! {cafe.Name} menüsüne hoş geldiniz. İster filtre kahve, ister glutensiz veya şekersiz lezzetler ya da bütçenize uygun seçenekler olsun; ne arzu ederseniz yardımcı olabilirim.";
        var welcomeMessage = GeminiAiService.SanitizeBaristaTone(rawWelcomeMessage, baristaFallback);

        _logger.LogInformation(">>> [MENU INIT] '{CafeName}' için nihai karşılama mesajı: '{WelcomeMessage}'", cafe.Name, welcomeMessage);
        _logger.LogInformation("=================================================");

        return new MenuInitDto
        {
            CafeId = cafe.Id,
            CafeName = cafe.Name,
            WelcomeMessage = welcomeMessage
        };
    }

    public async Task<MenuSearchResultDto> SearchMenuAsync(string userQuery, Guid? cafeId = null, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("=================================================");
        _logger.LogInformation(">>> [MENU SEARCH] Yeni sorgu alındı: '{Query}' | KafeId: {CafeId}", userQuery, cafeId?.ToString() ?? "Tümü");

        var norm = GeminiAiService.NormalizeText(userQuery).Trim();

        // 1. AI Intent ve Sohbet Yanıtı Çıkarımı
        var aiJson = await _aiService.ProcessMenuQueryAsync(userQuery, cancellationToken);
        _logger.LogInformation(">>> [AI INTENT] Ham JSON Çıktısı: {AiJson}", aiJson);

        AiIntentPayload? intentPayload = null;
        try
        {
            intentPayload = JsonSerializer.Deserialize<AiIntentPayload>(aiJson);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, ">>> [AI PARSE ERROR] AI yanıtı JSON olarak ayrıştırılamadı.");
        }

        var intent = intentPayload?.Intent?.Trim().ToLowerInvariant() ?? "menu_search";
        var rawAiMessage = intentPayload?.AiMessage?.Trim() ?? string.Empty;

        // 2. Kapsam Dışı (out_of_scope) kontrolü
        if (intent == "out_of_scope")
        {
            _logger.LogInformation(">>> [OUT OF SCOPE] Sorgu menü kapsamı dışında değerlendirildi.");
            _logger.LogInformation("=================================================");
            return new MenuSearchResultDto
            {
                Message = !string.IsNullOrWhiteSpace(rawAiMessage)
                    ? GeminiAiService.SanitizeBaristaTone(rawAiMessage, "Ben menü asistanıyım. Size lezzetli yiyecek, içecek ve kahvelerimiz hakkında yardımcı olabilirim.")
                    : "Ben menü asistanıyım. Size lezzetli yiyecek, içecek ve kahvelerimiz hakkında yardımcı olabilirim.",
                Products = new List<ProductDto>()
            };
        }

        // 3. Genel Sohbet / Selamlaşma (chat) kontrolü
        bool isStrictGreeting = norm == "merhaba" || norm == "selam" || norm == "selamlar" ||
                                norm == "gunaydin" || norm == "iyi gunler" || norm == "iyi aksamlar" ||
                                norm == "nasilsin" || norm == "naber";

        if (intent == "chat" && isStrictGreeting)
        {
            _logger.LogInformation(">>> [CHAT INTENT] Sohbet veya selamlaşma yanıtı üretildi: '{Message}'", rawAiMessage);
            _logger.LogInformation("=================================================");
            return new MenuSearchResultDto
            {
                Message = !string.IsNullOrWhiteSpace(rawAiMessage)
                    ? GeminiAiService.SanitizeBaristaTone(rawAiMessage, "Merhaba! Menümüzden ne arzu edersiniz, size yardımcı olabilirim.")
                    : "Merhaba! Menümüzden ne arzu edersiniz, size yardımcı olabilirim.",
                Products = new List<ProductDto>()
            };
        }

        // 4. Fiyat ve Bütçe Çıkarımı & Deterministik Fallback
        var pricePreference = intentPayload?.PricePreference?.Trim().ToLowerInvariant() ?? "none";
        var maxPrice = intentPayload?.MaxPrice;
        var minPrice = intentPayload?.MinPrice;

        if (pricePreference == "none")
        {
            if (norm.Contains("ucuz") || norm.Contains("uygun") || norm.Contains("hesapli") ||
                norm.Contains("ekonomik") || norm.Contains("butce dostu") || norm.Contains("en dusuk"))
            {
                pricePreference = "cheap";
            }
            else if (norm.Contains("pahali") || norm.Contains("en pahali") || norm.Contains("luks") || norm.Contains("premium"))
            {
                pricePreference = "expensive";
            }
        }

        // Regex ile Fiyat Aralığı ve Limit Tespiti
        var rangeMatch = Regex.Match(norm, @"(\d+)\s*(?:tl|lira)?\s*(?:-|–|ile|\s+ila\s+)\s*(\d+)\s*(?:tl|lira)?");
        if (rangeMatch.Success && (!minPrice.HasValue || !maxPrice.HasValue))
        {
            if (decimal.TryParse(rangeMatch.Groups[1].Value, out var minVal) &&
                decimal.TryParse(rangeMatch.Groups[2].Value, out var maxVal))
            {
                minPrice = Math.Min(minVal, maxVal);
                maxPrice = Math.Max(minVal, maxVal);
            }
        }
        else
        {
            if (!maxPrice.HasValue)
            {
                var maxMatch = Regex.Match(norm, @"(?:en\s+fazla|maksimum|max|en\s+cok)\s*(\d+)|(\d+)\s*(?:tl|lira)?\s*(?:alti|altinda|kadar|gecmesin)");
                if (maxMatch.Success)
                {
                    var numStr = !string.IsNullOrEmpty(maxMatch.Groups[1].Value) ? maxMatch.Groups[1].Value : maxMatch.Groups[2].Value;
                    if (decimal.TryParse(numStr, out var val))
                    {
                        maxPrice = val;
                    }
                }
            }

            if (!minPrice.HasValue)
            {
                var minMatch = Regex.Match(norm, @"(?:en\s+az|minimum|min)\s*(\d+)|(\d+)\s*(?:tl|lira)?\s*(?:ustu|uzeri)");
                if (minMatch.Success)
                {
                    var numStr = !string.IsNullOrEmpty(minMatch.Groups[1].Value) ? minMatch.Groups[1].Value : minMatch.Groups[2].Value;
                    if (decimal.TryParse(numStr, out var val))
                    {
                        minPrice = val;
                    }
                }
            }
        }

        // 5. Kategori Eşlemesi (5 Kanonik Kategori Normalizasyonu)
        var canonicalCategory = MapToCanonicalCategory(intentPayload?.Category, norm);

        _logger.LogInformation(">>> [INTENT DETAILS] Kanonik Kategori: '{Category}', Fiyat Tercihi: '{PricePref}', MaxFiyat: {MaxPrice}, MinFiyat: {MinPrice}",
            canonicalCategory ?? "Belirtilmedi", pricePreference, maxPrice, minPrice);

        // 6. Veritabanından Category ve Tags ilişkileriyle birlikte aktif ürünleri çek
        var baseQuery = _dbContext.Products
            .Include(p => p.Category)
            .Include(p => p.Tags)
            .Where(p => p.IsAvailable);

        if (cafeId.HasValue && cafeId.Value != Guid.Empty)
        {
            baseQuery = baseQuery.Where(p => p.Category != null && p.Category.CafeId == cafeId.Value);
        }

        List<Core.Entities.Product> allAvailable;
        try
        {
            allAvailable = await baseQuery.AsNoTracking().ToListAsync(cancellationToken);
            _logger.LogInformation(">>> [DB QUERY] Veritabanından çekilen aktif ürün sayısı: {Count}", allAvailable.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ">>> [DB ERROR] Veritabanından ürünler çekilirken hata oluştu!");
            throw;
        }

        var filtered = allAvailable;

        // 7. Kategori Filtrelemesi (5 Kanonik Kategoriye haritalanmış filtre)
        if (!string.IsNullOrWhiteSpace(canonicalCategory))
        {
            var categoryMatches = filtered.Where(p =>
                p.Category != null && (
                    p.Category.Name.Equals(canonicalCategory, StringComparison.OrdinalIgnoreCase) ||
                    p.Category.Name.Contains(canonicalCategory, StringComparison.OrdinalIgnoreCase)
                )
            ).ToList();

            if (categoryMatches.Count > 0)
            {
                filtered = categoryMatches;
                _logger.LogInformation(">>> [CATEGORY FILTER] '{Category}' kategorisine filtrelendi, ürün sayısı: {Count}", canonicalCategory, filtered.Count);
            }
        }

        // 8. Anahtar Kelime Filtrelemesi (Spesifik ürünler için: tost, brownie, limonata vb.)
        var specificKeywords = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (intentPayload?.SearchKeywords != null)
        {
            foreach (var kw in intentPayload.SearchKeywords)
            {
                if (!string.IsNullOrWhiteSpace(kw))
                {
                    var cleanKw = GeminiAiService.NormalizeText(kw);
                    if (cleanKw != "kahvalti" && cleanKw != "atistirmalik" && cleanKw != "tatli" &&
                        cleanKw != "kahve" && cleanKw != "icecek" && cleanKw != "mesrubat" && cleanKw != "yemek")
                    {
                        specificKeywords.Add(cleanKw);
                    }
                }
            }
        }

        var specificTerms = new[] { "tost", "sandvic", "kruvasan", "patates", "wrap", "bowl", "cheesecake", "brownie", "tiramisu", "kek", "latte", "espresso", "cappuccino", "americano", "frappe", "kola", "gazoz", "limonata" };
        foreach (var term in specificTerms)
        {
            if (norm.Contains(term))
            {
                specificKeywords.Add(term);
            }
        }

        if (specificKeywords.Count > 0)
        {
            var specificMatches = filtered.Where(p =>
            {
                var prodNormName = GeminiAiService.NormalizeText(p.Name);
                var prodNormDesc = GeminiAiService.NormalizeText(p.Description ?? "");
                return specificKeywords.Any(k => prodNormName.Contains(k) || prodNormDesc.Contains(k));
            }).ToList();

            // Eğer spesifik ürün eşleşmesi varsa onu daralt, yoksa kategorideki tüm ürünleri koru
            if (specificMatches.Count > 0)
            {
                filtered = specificMatches;
            }
        }

        // 9. Diyet, Alerjen ve Tercih Filtrelemeleri
        var excludeList = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (intentPayload?.ExcludeTags != null)
        {
            foreach (var tag in intentPayload.ExcludeTags)
            {
                if (!string.IsNullOrWhiteSpace(tag))
                    excludeList.Add(GeminiAiService.NormalizeText(tag));
            }
        }

        // Sıcaklık Filtrelemesi
        bool wantsHot = norm.Contains("sicak") || norm.Contains("hot");
        bool wantsCold = norm.Contains("soguk") || norm.Contains("cold") || norm.Contains("buzlu") || norm.Contains("iced");

        if (wantsHot && !wantsCold)
        {
            var hotMatches = filtered.Where(p =>
                p.Tags.Any(t => GeminiAiService.NormalizeText(t.Name).Contains("sicak")) ||
                (p.Category != null && GeminiAiService.NormalizeText(p.Category.Name).StartsWith("sicak"))
            ).ToList();

            if (hotMatches.Count > 0) filtered = hotMatches;
        }
        else if (wantsCold && !wantsHot)
        {
            var coldMatches = filtered.Where(p =>
                p.Tags.Any(t => GeminiAiService.NormalizeText(t.Name).Contains("soguk")) ||
                (p.Category != null && GeminiAiService.NormalizeText(p.Category.Name).StartsWith("soguk"))
            ).ToList();

            if (coldMatches.Count > 0) filtered = coldMatches;
        }

        // Şeker Durumu
        bool wantsSugarFree = norm.Contains("sekersiz") || norm.Contains("sugar-free") || norm.Contains("diyet");
        if (wantsSugarFree)
        {
            excludeList.Add("seker");
            excludeList.Add("sekerli");
            filtered = filtered.Where(p => !p.Tags.Any(t => GeminiAiService.NormalizeText(t.Name).Equals("sekerli"))).ToList();
        }

        // Gluten Durumu
        bool wantsGlutenFree = norm.Contains("glutensiz") || norm.Contains("gluten-free") || norm.Contains("colyak");
        if (wantsGlutenFree)
        {
            excludeList.Add("gluten icerir");
            excludeList.Add("gluten");
            filtered = filtered.Where(p => !p.Tags.Any(t => GeminiAiService.NormalizeText(t.Name).Contains("gluten icerir"))).ToList();
        }

        // Süt Ürünü / Laktoz
        bool wantsDairyFree = norm.Contains("sutsuz") || norm.Contains("laktozsuz") ||
                              norm.Contains("sut istemiyorum") || norm.Contains("sut olmasin") || norm.Contains("sut alerji");
        if (wantsDairyFree)
        {
            excludeList.Add("sut");
            excludeList.Add("sutlu");
            excludeList.Add("sut urunu icerir");
            filtered = filtered.Where(p =>
                !p.Tags.Any(t =>
                {
                    var tNorm = GeminiAiService.NormalizeText(t.Name);
                    return tNorm.Contains("sut") && !tNorm.Contains("sutsuz");
                }) &&
                !p.Name.Contains("Latte", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Cappuccino", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Flat White", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Mocha", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Frappe", StringComparison.OrdinalIgnoreCase)
            ).ToList();
        }

        // Vegan
        if (norm.Contains("vegan") || norm.Contains("bitkisel"))
        {
            filtered = filtered.Where(p =>
                p.Tags.Any(t => GeminiAiService.NormalizeText(t.Name).Equals("vegan")) &&
                !p.Tags.Any(t =>
                {
                    var tNorm = GeminiAiService.NormalizeText(t.Name);
                    return tNorm.Contains("sut urunu") || tNorm.Contains("yumurta");
                }) &&
                !p.Name.Contains("Tavuk", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Hindi", StringComparison.OrdinalIgnoreCase)
            ).ToList();
        }

        // Vejetaryen
        if (norm.Contains("vejetaryen") || norm.Contains("vejeteryan") || norm.Contains("etsiz") || norm.Contains("tavuksuz"))
        {
            filtered = filtered.Where(p =>
                (p.Tags.Any(t =>
                {
                    var tNorm = GeminiAiService.NormalizeText(t.Name);
                    return tNorm.Equals("vejetaryen") || tNorm.Equals("vegan");
                })) &&
                !p.Name.Contains("Tavuk", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Hindi", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Et", StringComparison.OrdinalIgnoreCase)
            ).ToList();
        }

        // Kafeinsiz
        if (norm.Contains("kafeinsiz") || norm.Contains("decaf"))
        {
            filtered = filtered.Where(p =>
                p.Tags.Any(t => GeminiAiService.NormalizeText(t.Name).Equals("kafeinsiz")) ||
                p.Name.Contains("Kafeinsiz", StringComparison.OrdinalIgnoreCase) ||
                (p.Description != null && GeminiAiService.NormalizeText(p.Description).Contains("kafeinsiz"))
            ).ToList();
        }

        // 10. FİYAT FİLTRELEMESİ (Price Limits)
        if (maxPrice.HasValue)
        {
            filtered = filtered.Where(p => p.Price <= maxPrice.Value).ToList();
            _logger.LogInformation(">>> [PRICE FILTER] MaxPrice ({MaxPrice} TL) uygulandı, kalan ürün: {Count}", maxPrice.Value, filtered.Count);
        }

        if (minPrice.HasValue)
        {
            filtered = filtered.Where(p => p.Price >= minPrice.Value).ToList();
            _logger.LogInformation(">>> [PRICE FILTER] MinPrice ({MinPrice} TL) uygulandı, kalan ürün: {Count}", minPrice.Value, filtered.Count);
        }

        // 11. FİYAT SIRALAMASI (Price Sorting)
        if (pricePreference == "cheap")
        {
            filtered = filtered.OrderBy(p => p.Price).ToList();
            _logger.LogInformation(">>> [PRICE SORT] 'cheap' tercihi gereği fiyata göre artan (artan fiyat) sıralandı.");
        }
        else if (pricePreference == "expensive")
        {
            filtered = filtered.OrderByDescending(p => p.Price).ToList();
            _logger.LogInformation(">>> [PRICE SORT] 'expensive' tercihi gereği fiyata göre azalan (azalan fiyat) sıralandı.");
        }

        // 12. Nihai Mesajın Belirlenmesi (Barista Persona & Cliche Sanitization)
        string finalMessage;
        if (filtered.Count == 0)
        {
            finalMessage = "Belirttiğiniz kriterlere veya fiyat aralığına uygun ürün bulunamadı. Farklı bir seçenek denemek ister misiniz?";
        }
        else
        {
            var cleanAiMessage = GeminiAiService.SanitizeBaristaTone(rawAiMessage, string.Empty);

            if (!string.IsNullOrWhiteSpace(cleanAiMessage) &&
                cleanAiMessage != "İşte sizin için menümüzden lezzetler:" &&
                !cleanAiMessage.Contains("lezzetler:"))
            {
                finalMessage = cleanAiMessage;
            }
            else
            {
                // Deterministik Barista Yanıtı
                if (pricePreference == "cheap")
                {
                    finalMessage = "Sizin için menümüzdeki en uygun fiyatlı lezzetleri listeledim:";
                }
                else if (maxPrice.HasValue)
                {
                    finalMessage = $"Sizin için {maxPrice.Value:0} TL altındaki seçeneklerimizi listeledim:";
                }
                else if (norm.Contains("kahvalti"))
                {
                    finalMessage = "Güne güzel bir başlangıç için kahvaltılık ve doyurucu alternatiflerimiz:";
                }
                else if (!string.IsNullOrWhiteSpace(canonicalCategory))
                {
                    finalMessage = $"Sizin için {canonicalCategory} alternatiflerimizi listeledim:";
                }
                else
                {
                    finalMessage = "Sizin için menümüzden seçenekleri listeledim:";
                }
            }
        }

        _logger.LogInformation(">>> [FINAL RESULT] Eşleşen nihai ürün sayısı: {MatchedCount} | Mesaj: '{Message}'", filtered.Count, finalMessage);
        _logger.LogInformation("=================================================");

        // 13. MenuSearchResultDto döndür
        return new MenuSearchResultDto
        {
            Message = finalMessage,
            Products = filtered.Select(p => new ProductDto
            {
                Id = p.Id,
                CategoryId = p.CategoryId,
                CategoryName = p.Category?.Name ?? string.Empty,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                IsAvailable = p.IsAvailable,
                Tags = p.Tags.Select(t => t.Name).ToList()
            }).ToList()
        };
    }

    public static string? MapToCanonicalCategory(string? intentCategory, string normalizedQuery)
    {
        var normCat = GeminiAiService.NormalizeText(intentCategory ?? string.Empty);
        var norm = normalizedQuery;

        // 1. Atıştırmalık & Mutfak
        if (normCat.Contains("atistirmalik") || normCat.Contains("mutfak") || normCat.Contains("kahvalti") ||
            norm.Contains("kahvalti") || norm.Contains("tost") || norm.Contains("sandvic") ||
            norm.Contains("atistir") || norm.Contains("patates") || norm.Contains("wrap") ||
            norm.Contains("bowl") || norm.Contains("ana yemek") || norm.Contains("yemek") ||
            norm.Contains("yiyecek") || norm.Contains("doyurucu") || norm.Contains("snack") || norm.Contains("tuzlu"))
        {
            return "Atıştırmalık & Mutfak";
        }

        // 2. Soğuk İçecekler (Meşrubat, Gazlı İçecek, Kola, Gazoz vb. - ASLA kahve değildir)
        if (normCat.Contains("soguk icecek") || normCat.Contains("mesrubat") ||
            norm.Contains("mesrubat") || norm.Contains("gazli") ||
            norm.Contains("kola") || norm.Contains("cola") ||
            norm.Contains("fanta") || norm.Contains("sprite") || norm.Contains("gazoz") ||
            norm.Contains("maden suyu") || norm.Contains("soda") ||
            norm.Contains("limonata") || norm.Contains("soguk cay") || norm.Contains("ice tea") ||
            norm.Contains("portakal suyu") || (norm.Contains("icecek") && !norm.Contains("sicak") && !norm.Contains("kahve")))
        {
            return "Soğuk İçecekler";
        }

        // 3. Tatlılar & Pastacılık
        if (normCat.Contains("tatli") || normCat.Contains("pasta") ||
            norm.Contains("tatli") || norm.Contains("pasta") || norm.Contains("kek") ||
            norm.Contains("cheesecake") || norm.Contains("brownie") || norm.Contains("tiramisu") ||
            norm.Contains("puding") || norm.Contains("cikolata") || norm.Contains("kurabiye"))
        {
            return "Tatlılar & Pastacılık";
        }

        // 4. Soğuk Kahveler
        if (normCat.Contains("soguk kahve") ||
            norm.Contains("soguk kahve") ||
            norm.Contains("iced latte") || norm.Contains("cold brew") ||
            norm.Contains("frappe") || norm.Contains("iced americano") ||
            norm.Contains("buzlu kahve") || norm.Contains("iced mocha") ||
            (norm.Contains("kahve") && (norm.Contains("soguk") || norm.Contains("iced") || norm.Contains("buzlu"))))
        {
            return "Soğuk Kahveler";
        }

        // 5. Sıcak Kahveler
        if (normCat.Contains("sicak kahve") || normCat.Contains("kahve") ||
            norm.Contains("sicak kahve") ||
            norm.Contains("kahve") || norm.Contains("filtre") ||
            norm.Contains("espresso") || norm.Contains("latte") ||
            norm.Contains("cappuccino") || norm.Contains("americano") ||
            norm.Contains("turk kahvesi") || norm.Contains("flat white") ||
            norm.Contains("mocha"))
        {
            return "Sıcak Kahveler";
        }

        return null;
    }
}
