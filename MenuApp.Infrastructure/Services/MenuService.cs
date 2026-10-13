using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using MenuApp.Core.DTOs;
using MenuApp.Core.Enums;
using MenuApp.Core.Interfaces;
using MenuApp.Infrastructure.Data;
using MenuApp.Infrastructure.Search;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MenuApp.Infrastructure.Services;

public class MenuService : IMenuService
{
    private readonly IAiService _aiService;
    private readonly ApplicationDbContext _dbContext;
    private readonly ITaxonomyRegistry _taxonomyRegistry;
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

    private static int _curatedIndex = 0;

    private static readonly IReadOnlyList<(string Message, string[] ProductNames)> CuratedRecommendations = new List<(string, string[])>
    {
        (
            "Ben bir menü asistanıyım; ancak gününüze eşlik edecek harika bir lezzet ikilisi önerebilirim: 24 saat soğuk damıtılmış ferahlatıcı Cold Brew Reserve ve fırından taze Çikolatalı Bademli Kruvasanımız!",
            new[] { "Cold Brew Reserve", "Çikolatalı Bademli Kruvasan" }
        ),
        (
            "Size kafe lezzetlerimizden keyifli bir mola önerisi: Taze demlenmiş tek köken Filtre Kahvemiz ve Callebaut Belçika çikolatalı San Sebastian Cheesecake'imiz tam bir klasik.",
            new[] { "Filtre Kahve (Single Origin)", "San Sebastian Cheesecake (Belçika Çikolatalı)" }
        ),
        (
            "Doyurucu ve enerji verici bir şeyler arıyorsanız şefin favorisi: Artizan ekşi mayalı Avokadolu Poşe Yumurtalı Tostumuz ve yanında kadifemsi Caffe Latte!",
            new[] { "Avokadolu Poşe Yumurtalı Ekşi Maya Tost", "Caffe Latte" }
        ),
        (
            "Ferahlatıcı ve hafif bir mola için favori eşleşmemiz: Buzlu serinletici Iced Latte ve rafine şekersiz Glutensiz Vegan Raw Berry Bar!",
            new[] { "Iced Latte", "Glutensiz Vegan Raw Berry Bar" }
        ),
        (
            "Tuzlu ve çıtır bir lezzet arzu ederseniz: Trüf yağlı çıtır Patates Sepetimiz ve yanında taze nane yapraklarıyla hazırlanan Ev Yapımı Naneli Limonatamız!",
            new[] { "Çıtır Patates Sepeti (Truffle & Parmesan)", "Ev Yapımı Naneli Limonata" }
        )
    };

    public MenuService(
        IAiService aiService,
        ApplicationDbContext dbContext,
        ITaxonomyRegistry taxonomyRegistry,
        ILogger<MenuService> logger)
    {
        _aiService = aiService;
        _dbContext = dbContext;
        _taxonomyRegistry = taxonomyRegistry;
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

        // 2. Kapsam Dışı (out_of_scope) / Alakasız Sorgu kontrolü
        bool isGreeting = norm.Contains("merhaba") || norm.Contains("selam") ||
                          norm.Contains("gunaydin") || norm.Contains("iyi gunler") || norm.Contains("iyi aksamlar") ||
                          norm.Contains("nasilsin") || norm.Contains("naber") || norm.Contains("kolay gelsin") ||
                          norm.Contains("tesekkur");

        bool isOutOfScope = intent == "out_of_scope" || (intent == "chat" && !isGreeting);

        if (isOutOfScope)
        {
            _logger.LogInformation(">>> [OUT OF SCOPE] Alakasız sorgu tespit edildi: '{Query}'. Öne çıkan lezzet rotasyonu devreye giriyor.", userQuery);

            int recIndex = Math.Abs(Interlocked.Increment(ref _curatedIndex) - 1) % CuratedRecommendations.Count;
            var curated = CuratedRecommendations[recIndex];

            var baseRecQuery = _dbContext.Products
                .Include(p => p.Category)
                .Include(p => p.Tags)
                .Where(p => p.IsAvailable);

            if (cafeId.HasValue && cafeId.Value != Guid.Empty)
            {
                baseRecQuery = baseRecQuery.Where(p => p.Category != null && p.Category.CafeId == cafeId.Value);
            }

            var availableRecProducts = await baseRecQuery.AsNoTracking().ToListAsync(cancellationToken);

            var matchedProducts = new List<ProductDto>();
            foreach (var targetName in curated.ProductNames)
            {
                var cleanTarget = GeminiAiService.NormalizeText(targetName);
                var match = availableRecProducts.FirstOrDefault(p =>
                    GeminiAiService.NormalizeText(p.Name).Contains(cleanTarget) ||
                    cleanTarget.Contains(GeminiAiService.NormalizeText(p.Name)));

                if (match != null && !matchedProducts.Any(mp => mp.Id == match.Id))
                {
                    matchedProducts.Add(new ProductDto
                    {
                        Id = match.Id,
                        CategoryId = match.CategoryId,
                        CategoryName = match.Category?.Name ?? string.Empty,
                        Name = match.Name,
                        Description = match.Description,
                        Price = match.Price,
                        IsAvailable = match.IsAvailable,
                        Tags = match.Tags.Select(t => t.Name).ToList()
                    });
                }
            }

            if (matchedProducts.Count == 0 && availableRecProducts.Count > 0)
            {
                matchedProducts = availableRecProducts.Take(2).Select(p => new ProductDto
                {
                    Id = p.Id,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category?.Name ?? string.Empty,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    IsAvailable = p.IsAvailable,
                    Tags = p.Tags.Select(t => t.Name).ToList()
                }).ToList();
            }

            _logger.LogInformation(">>> [OUT OF SCOPE] Seçilen öneri indeksi: {Index}, Ürün sayısı: {Count}, Mesaj: '{Message}'",
                recIndex, matchedProducts.Count, curated.Message);
            _logger.LogInformation("=================================================");

            return new MenuSearchResultDto
            {
                Message = curated.Message,
                Products = matchedProducts
            };
        }

        // 3. Genel Sohbet / Selamlaşma (chat) kontrolü
        if (intent == "chat" && isGreeting)
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

        // 4.5. Katalog Modu / Tüm Menü / Bütün Kategori Tespiti
        bool isBrowseAllGeneral =
            (intent == "browse_all" && string.IsNullOrWhiteSpace(intentPayload?.Category)) ||
            norm.Contains("tum menu") || norm.Contains("bütün menu") || norm.Contains("butun menu") ||
            norm.Contains("menude ne var") || norm.Contains("menuyu goster") || norm.Contains("her seyi goster") ||
            norm.Contains("herseyi goster") || norm.Contains("butun lezzetler") || norm.Contains("tum lezzetler") ||
            norm.Contains("tum urunler") || norm.Contains("butun urunler") || norm.Contains("hepsini goster") ||
            norm == "menu" || norm == "menü";

        bool isBrowseAllCategory =
            (intent == "browse_all" && !string.IsNullOrWhiteSpace(intentPayload?.Category)) ||
            norm.Contains("tum kahve") || norm.Contains("butun kahve") ||
            norm.Contains("tum tatli") || norm.Contains("butun tatli") ||
            norm.Contains("tum icecek") || norm.Contains("butun icecek") ||
            norm.Contains("tum kahvalti") || norm.Contains("butun kahvalti") || norm.Contains("her kahvalti") ||
            norm.Contains("tum mutfak") || norm.Contains("tum yemek") || norm.Contains("butun yemek") ||
            norm.Contains("tum atistir") || norm.Contains("butun atistir");

        bool isBrowseAll = isBrowseAllGeneral || isBrowseAllCategory;

        // 5. Macro-Domain Tespiti (Katman 1: Kapsam ve Etki Alanı İzolasyonu)
        MacroDomain? macroDomain = null;
        if (!isBrowseAllGeneral)
        {
            macroDomain = _taxonomyRegistry.ResolveMacroDomain(norm, intentPayload?.Category);
        }

        _logger.LogInformation(">>> [INTENT DETAILS] Makro Alan: '{MacroDomain}', Katalog Modu: {IsBrowseAll}, Fiyat Tercihi: '{PricePref}', MaxFiyat: {MaxPrice}, MinFiyat: {MinPrice}",
            macroDomain?.ToString() ?? "Genel (Tümü)", isBrowseAll, pricePreference, maxPrice, minPrice);

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

        // 7. Deterministik Arama, Filtreleme ve Skorlama Boru Hattı (MenuSearchPipeline)
        var pipeline = new MenuSearchPipeline(_taxonomyRegistry, _logger);
        var searchContext = new MenuSearchPipeline.SearchContext(
            NormalizedQuery: norm,
            MacroDomain: isBrowseAllGeneral ? null : macroDomain,
            AiCategory: isBrowseAllGeneral ? null : intentPayload?.Category,
            ExcludeTags: intentPayload?.ExcludeTags ?? new List<string>(),
            SearchKeywords: intentPayload?.SearchKeywords ?? new List<string>(),
            PricePreference: pricePreference,
            MaxPrice: maxPrice,
            MinPrice: minPrice,
            IsBrowseAll: isBrowseAll
        );

        var filtered = pipeline.Execute(allAvailable, searchContext);

        // 8. Deterministik Barista Yanıtı & Cliche Sanitization
        string finalMessage;
        if (filtered.Count == 0)
        {
            if (!macroDomain.HasValue && pricePreference == "none" && !maxPrice.HasValue && !minPrice.HasValue && (intentPayload?.ExcludeTags?.Count ?? 0) == 0)
            {
                int recIndex = Math.Abs(Interlocked.Increment(ref _curatedIndex) - 1) % CuratedRecommendations.Count;
                var curated = CuratedRecommendations[recIndex];

                var fallbackProducts = new List<ProductDto>();
                foreach (var targetName in curated.ProductNames)
                {
                    var cleanTarget = GeminiAiService.NormalizeText(targetName);
                    var match = allAvailable.FirstOrDefault(p =>
                        GeminiAiService.NormalizeText(p.Name).Contains(cleanTarget) ||
                        cleanTarget.Contains(GeminiAiService.NormalizeText(p.Name)));

                    if (match != null && !fallbackProducts.Any(mp => mp.Id == match.Id))
                    {
                        fallbackProducts.Add(new ProductDto
                        {
                            Id = match.Id,
                            CategoryId = match.CategoryId,
                            CategoryName = match.Category?.Name ?? string.Empty,
                            Name = match.Name,
                            Description = match.Description,
                            Price = match.Price,
                            IsAvailable = match.IsAvailable,
                            Tags = match.Tags.Select(t => t.Name).ToList()
                        });
                    }
                }

                return new MenuSearchResultDto
                {
                    Message = curated.Message,
                    Products = fallbackProducts.Count > 0 ? fallbackProducts : allAvailable.Take(2).Select(p => new ProductDto
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

            finalMessage = "Belirttiğiniz kriterlere veya fiyat aralığına uygun ürün bulunamadı. Farklı bir seçenek denemek ister misiniz?";
        }
        else if (isBrowseAllGeneral)
        {
            finalMessage = "Menümüzdeki tüm lezzetleri sizin için listeledim:";
        }
        else if (isBrowseAllCategory)
        {
            if (macroDomain == MacroDomain.BeverageCoffee)
                finalMessage = "Tüm kahve alternatiflerimiz listelendi:";
            else if (macroDomain == MacroDomain.FoodDessert)
                finalMessage = "Tüm tatlı alternatiflerimiz listelendi:";
            else if (macroDomain == MacroDomain.FoodKitchen)
                finalMessage = "Tüm kahvaltılık ve mutfak lezzetlerimiz listelendi:";
            else if (macroDomain == MacroDomain.BeverageOther)
                finalMessage = "Tüm soğuk içecek alternatiflerimiz listelendi:";
            else
                finalMessage = "Tüm seçeneklerimiz listelendi:";
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
                if (pricePreference == "cheap")
                {
                    finalMessage = "Sizin için menümüzdeki en uygun fiyatlı lezzetleri listeledim:";
                }
                else if (maxPrice.HasValue)
                {
                    finalMessage = $"Sizin için {maxPrice.Value:0} TL altındaki seçeneklerimizi listeledim:";
                }
                else if (macroDomain == MacroDomain.BeverageCoffee)
                {
                    finalMessage = norm.Contains("soguk")
                        ? "Sizin için ferahlatıcı soğuk kahve alternatiflerimizi listeledim:"
                        : "Sizin için taze demlenmiş sıcak kahve alternatiflerimizi listeledim:";
                }
                else if (macroDomain == MacroDomain.FoodKitchen)
                {
                    finalMessage = "Güne güzel bir başlangıç için kahvaltılık ve doyurucu alternatiflerimiz:";
                }
                else if (macroDomain == MacroDomain.FoodDessert)
                {
                    finalMessage = "Tatlı krizleriniz için özenle hazırlanan lezzetlerimiz:";
                }
                else if (macroDomain == MacroDomain.BeverageOther)
                {
                    finalMessage = "Sizin için serinletici soğuk içecek alternatiflerimizi listeledim:";
                }
                else
                {
                    finalMessage = "Sizin için menümüzden seçenekleri listeledim:";
                }
            }
        }

        _logger.LogInformation(">>> [FINAL RESULT] Eşleşen nihai ürün sayısı: {MatchedCount} | Mesaj: '{Message}'", filtered.Count, finalMessage);
        _logger.LogInformation("=================================================");

        // 9. Dinamik ve Bağlamsal Etiket Sıralaması ile ProductDto Projeksiyonu
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
                Tags = p.Tags
                    .Select(t => t.Name)
                    .OrderByDescending(t => _taxonomyRegistry.CalculateTagScore(t, norm, p.Category?.Name))
                    .ToList()
            }).ToList()
        };
    }

    public static string? MapToCanonicalCategory(string? intentCategory, string normalizedQuery)
    {
        var registry = new TaxonomyRegistry();
        var domain = registry.ResolveMacroDomain(normalizedQuery, intentCategory);
        if (!domain.HasValue) return null;
        var categories = registry.GetCategoriesForDomain(domain.Value);
        return categories.FirstOrDefault();
    }
}
