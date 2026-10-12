using System.Text.Json;
using System.Text.Json.Serialization;
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
        [property: JsonPropertyName("exclude_tags")] List<string>? ExcludeTags
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

        var welcomeMessage = await _aiService.GenerateWelcomeMessageAsync(cafe.Name, cancellationToken);
        _logger.LogInformation(">>> [MENU INIT] '{CafeName}' için üretilen karşılama mesajı: '{WelcomeMessage}'", cafe.Name, welcomeMessage);
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

        var intent = intentPayload?.Intent?.Trim().ToLowerInvariant() ?? "chat";
        var aiMessage = intentPayload?.AiMessage?.Trim() ?? string.Empty;

        // 2. Kapsam Dışı (out_of_scope) kontrolü
        if (intent == "out_of_scope")
        {
            _logger.LogInformation(">>> [OUT OF SCOPE] Sorgu menü kapsamı dışında değerlendirildi.");
            _logger.LogInformation("=================================================");
            return new MenuSearchResultDto
            {
                Message = !string.IsNullOrWhiteSpace(aiMessage)
                    ? aiMessage
                    : "Ben sadece menü ve kafe asistanıyım. Size lezzetli yiyecek ve içeceklerimiz hakkında yardımcı olabilirim.",
                Products = new List<ProductDto>()
            };
        }

        // 3. Genel Sohbet / Selamlaşma (chat) kontrolü
        if (intent == "chat")
        {
            _logger.LogInformation(">>> [CHAT INTENT] Sohbet veya selamlaşma yanıtı üretildi: '{Message}'", aiMessage);
            _logger.LogInformation("=================================================");
            return new MenuSearchResultDto
            {
                Message = !string.IsNullOrWhiteSpace(aiMessage)
                    ? aiMessage
                    : "Merhaba! Hoş geldiniz, bugün size menümüzden ne ikram etmemi istersiniz?",
                Products = new List<ProductDto>()
            };
        }

        _logger.LogInformation(">>> [INTENT DETAILS] Kategori: '{Category}', Arama Kelimeleri: [{Keywords}], Dışlanacak: [{ExcludeTags}]",
            intentPayload?.Category ?? "Belirtilmedi",
            string.Join(", ", intentPayload?.SearchKeywords ?? new()),
            string.Join(", ", intentPayload?.ExcludeTags ?? new()));

        // 4. Veritabanından Category ve Tags ilişkileriyle birlikte aktif ürünleri çek
        var baseQuery = _dbContext.Products
            .Include(p => p.Category)
            .Include(p => p.Tags)
            .Where(p => p.IsAvailable);

        // Multi-tenant: Eğer cafeId verilmişse o kafenin ürünlerine filtrele
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

        // 5. Akıllı Arama & Filtreleme (Keywords & Category)
        var keywords = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (intentPayload?.SearchKeywords != null)
        {
            foreach (var kw in intentPayload.SearchKeywords)
            {
                if (!string.IsNullOrWhiteSpace(kw))
                    keywords.Add(kw.Trim().ToLowerInvariant());
            }
        }

        var lowerQuery = userQuery.ToLowerInvariant();

        // Kullanıcının sorguda belirli bir kategori/ürün türü belirtip belirtmediğini kontrol et
        bool queryHasCategoryMention =
            lowerQuery.Contains("kahve") || lowerQuery.Contains("espresso") || lowerQuery.Contains("latte") || lowerQuery.Contains("filtre") ||
            lowerQuery.Contains("çay") || lowerQuery.Contains("cay") || lowerQuery.Contains("içecek") || lowerQuery.Contains("icecek") || lowerQuery.Contains("meşrubat") ||
            lowerQuery.Contains("tatlı") || lowerQuery.Contains("tatli") || lowerQuery.Contains("pasta") || lowerQuery.Contains("kek") || lowerQuery.Contains("cheesecake") ||
            lowerQuery.Contains("tost") || lowerQuery.Contains("sandviç") || lowerQuery.Contains("sandvic") || lowerQuery.Contains("kruvasan") || lowerQuery.Contains("atıştır") ||
            lowerQuery.Contains("yemek") || lowerQuery.Contains("bowl") || lowerQuery.Contains("patates") || lowerQuery.Contains("wrap");

        if (!string.IsNullOrWhiteSpace(intentPayload?.Category) && queryHasCategoryMention)
        {
            var catWords = intentPayload.Category.Split(new[] { ' ', ',', '-', '/' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var cw in catWords)
            {
                keywords.Add(cw.ToLowerInvariant());
            }
        }

        // Kullanıcı sorgusundan temel yiyecek/içecek anahtar kelimelerini de ekle
        var commonFoodTerms = new[] { "kahve", "espresso", "latte", "filtre", "çay", "tost", "tatlı", "pasta", "kek", "kruvasan", "sandviç", "salep", "kurabiye", "burger", "pizza", "makarna", "fajita", "et", "tavuk", "köfte", "salata" };
        foreach (var term in commonFoodTerms)
        {
            if (term == "et" && (lowerQuery.Contains("etsiz") || lowerQuery.Contains("vejetaryen") || lowerQuery.Contains("vejeteryan")))
            {
                continue;
            }
            if (term == "tavuk" && lowerQuery.Contains("tavuksuz"))
            {
                continue;
            }
            if (lowerQuery.Contains(term))
            {
                keywords.Add(term);
            }
        }

        if (keywords.Count > 0)
        {
            _logger.LogInformation(">>> [FILTER KEYWORDS] Arama anahtar kelimeleri: [{Keywords}]", string.Join(", ", keywords));

            static bool MatchesKeyword(string text, string k)
            {
                if (string.IsNullOrWhiteSpace(text)) return false;
                if ((k.Equals("kola", StringComparison.OrdinalIgnoreCase) || k.Equals("cola", StringComparison.OrdinalIgnoreCase)) &&
                    (text.Contains("çikolata", StringComparison.OrdinalIgnoreCase) || text.Contains("cikolata", StringComparison.OrdinalIgnoreCase)))
                {
                    var clean = text
                        .Replace("çikolata", "", StringComparison.OrdinalIgnoreCase)
                        .Replace("çikolatalı", "", StringComparison.OrdinalIgnoreCase)
                        .Replace("cikolata", "", StringComparison.OrdinalIgnoreCase);
                    return clean.Contains(k, StringComparison.OrdinalIgnoreCase);
                }
                return text.Contains(k, StringComparison.OrdinalIgnoreCase);
            }

            // Ürün filtreleme: Kategori adı, ürün adı veya açıklaması anahtar kelimelerden herhangi birini içeriyor mu?
            var matches = filtered.Where(p =>
            {
                var catName = p.Category?.Name ?? "";
                var prodName = p.Name;
                var prodDesc = p.Description ?? "";

                return keywords.Any(k =>
                    MatchesKeyword(catName, k) ||
                    k.Contains(catName, StringComparison.OrdinalIgnoreCase) ||
                    MatchesKeyword(prodName, k) ||
                    MatchesKeyword(prodDesc, k) ||
                    p.Tags.Any(t => MatchesKeyword(t.Name, k) ||
                                    (k.Equals("vejetaryen", StringComparison.OrdinalIgnoreCase) && t.Name.Equals("Vegan", StringComparison.OrdinalIgnoreCase)))
                );
            }).ToList();

            filtered = matches;
            _logger.LogInformation(">>> [MATCH RESULT] Anahtar kelimelerle eşleşen ürün sayısı: {Count}", filtered.Count);
        }

        // 6. Dışlanan Etiketler Filtrelemesi (exclude_tags)
        var excludeList = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (intentPayload?.ExcludeTags != null)
        {
            foreach (var tag in intentPayload.ExcludeTags)
            {
                if (!string.IsNullOrWhiteSpace(tag))
                    excludeList.Add(tag.Trim());
            }
        }

        // Sıcaklık Filtrelemesi (Sıcak vs Soğuk)
        bool wantsHot = lowerQuery.Contains("sıcak") || lowerQuery.Contains("hot");
        bool wantsCold = lowerQuery.Contains("soğuk") || lowerQuery.Contains("cold") || lowerQuery.Contains("buzlu") || lowerQuery.Contains("iced");

        if (wantsHot && !wantsCold)
        {
            // Kullanıcı sıcak istedi: Soğuk etiketli veya Soğuk kategorili ürünleri ele, Sıcak olanları filtrele
            var hotMatches = filtered.Where(p =>
                p.Tags.Any(t => t.Name.Equals("Sıcak", StringComparison.OrdinalIgnoreCase)) ||
                (p.Category?.Name.StartsWith("Sıcak", StringComparison.OrdinalIgnoreCase) ?? false)
            ).ToList();

            if (hotMatches.Count > 0)
            {
                filtered = hotMatches;
            }
        }
        else if (wantsCold && !wantsHot)
        {
            // Kullanıcı soğuk istedi: Sıcak etiketli veya Sıcak kategorili ürünleri ele, Soğuk olanları filtrele
            var coldMatches = filtered.Where(p =>
                p.Tags.Any(t => t.Name.Equals("Soğuk", StringComparison.OrdinalIgnoreCase)) ||
                (p.Category?.Name.StartsWith("Soğuk", StringComparison.OrdinalIgnoreCase) ?? false)
            ).ToList();

            if (coldMatches.Count > 0)
            {
                filtered = coldMatches;
            }
        }

        // Şeker Durumu Filtrelemesi (Şekerli vs Şekersiz)
        bool wantsSugarFree = lowerQuery.Contains("şekersiz") || lowerQuery.Contains("sugar-free") || lowerQuery.Contains("diyet");
        bool wantsSugary = lowerQuery.Contains("şekerli") && !wantsSugarFree;

        if (wantsSugarFree)
        {
            excludeList.Add("şeker");
            excludeList.Add("şekerli");
            filtered = filtered.Where(p =>
                !p.Tags.Any(t => t.Name.Equals("Şekerli", StringComparison.OrdinalIgnoreCase))
            ).ToList();
        }
        else if (wantsSugary)
        {
            var sugaryMatches = filtered.Where(p =>
                p.Tags.Any(t => t.Name.Equals("Şekerli", StringComparison.OrdinalIgnoreCase) || t.Name.Equals("Doğal Şeker", StringComparison.OrdinalIgnoreCase))
            ).ToList();

            if (sugaryMatches.Count > 0)
            {
                filtered = sugaryMatches;
            }
        }

        // Alerjen & Diyet Filtrelemesi (Glutensiz, Vegan, Sütsüz / Laktozsuz)
        bool wantsGlutenFree = lowerQuery.Contains("glutensiz") || lowerQuery.Contains("glütensiz") || lowerQuery.Contains("gluten-free");
        if (wantsGlutenFree)
        {
            excludeList.Add("glüten içerir");
            excludeList.Add("gluten içerir");
            excludeList.Add("gluten");
            filtered = filtered.Where(p =>
                !p.Tags.Any(t => t.Name.Contains("Glüten İçerir", StringComparison.OrdinalIgnoreCase) || t.Name.Contains("Gluten İçerir", StringComparison.OrdinalIgnoreCase))
            ).ToList();
        }

        bool wantsVegan = lowerQuery.Contains("vegan") || lowerQuery.Contains("bitkisel");
        if (wantsVegan)
        {
            filtered = filtered.Where(p =>
                p.Tags.Any(t => t.Name.Equals("Vegan", StringComparison.OrdinalIgnoreCase)) &&
                !p.Tags.Any(t => t.Name.Contains("Süt Ürünü İçerir", StringComparison.OrdinalIgnoreCase) || t.Name.Contains("Yumurta İçerir", StringComparison.OrdinalIgnoreCase)) &&
                !p.Name.Contains("Tavuk", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Hindi", StringComparison.OrdinalIgnoreCase)
            ).ToList();
        }

        // Vejetaryen & Etsiz Filtrelemesi
        bool wantsVegetarian = lowerQuery.Contains("vejetaryen") ||
                               lowerQuery.Contains("vejeteryan") ||
                               lowerQuery.Contains("etsiz") ||
                               lowerQuery.Contains("tavuksuz") ||
                               lowerQuery.Contains("etli olmayan");

        if (wantsVegetarian)
        {
            filtered = filtered.Where(p =>
                (p.Tags.Any(t => t.Name.Equals("Vejetaryen", StringComparison.OrdinalIgnoreCase) || t.Name.Equals("Vegan", StringComparison.OrdinalIgnoreCase))) &&
                !p.Name.Contains("Tavuk", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Hindi", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Et", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Köfte", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Sucuk", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Sosis", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Bacon", StringComparison.OrdinalIgnoreCase)
            ).ToList();
        }

        // Kafeinsiz (Decaf) Filtrelemesi
        bool wantsDecaf = lowerQuery.Contains("kafeinsiz") ||
                          lowerQuery.Contains("decaf") ||
                          lowerQuery.Contains("kafein istemiyorum") ||
                          excludeList.Any(ex => ex.Contains("kafein", StringComparison.OrdinalIgnoreCase) && !ex.Contains("kafeinsiz", StringComparison.OrdinalIgnoreCase));

        if (wantsDecaf)
        {
            filtered = filtered.Where(p =>
                p.Tags.Any(t => t.Name.Equals("Kafeinsiz", StringComparison.OrdinalIgnoreCase)) ||
                p.Name.Contains("Kafeinsiz", StringComparison.OrdinalIgnoreCase) ||
                (p.Description != null && p.Description.Contains("kafeinsiz", StringComparison.OrdinalIgnoreCase))
            ).ToList();
        }

        // Yumurtasız Filtrelemesi
        bool wantsEggFree = lowerQuery.Contains("yumurtasız") ||
                            lowerQuery.Contains("yumurtasiz") ||
                            lowerQuery.Contains("yumurta alerji") ||
                            lowerQuery.Contains("yumurta istemiyorum") ||
                            excludeList.Any(ex => ex.Contains("yumurta", StringComparison.OrdinalIgnoreCase) && !ex.Contains("yumurtasız", StringComparison.OrdinalIgnoreCase));

        if (wantsEggFree)
        {
            excludeList.Add("yumurta");
            excludeList.Add("yumurta içerir");
            filtered = filtered.Where(p =>
                !p.Tags.Any(t => t.Name.Contains("Yumurta", StringComparison.OrdinalIgnoreCase) && !t.Name.Contains("Yumurtasız", StringComparison.OrdinalIgnoreCase)) &&
                !p.Name.Contains("Yumurta", StringComparison.OrdinalIgnoreCase) &&
                !(p.Description != null && p.Description.Contains("yumurta", StringComparison.OrdinalIgnoreCase))
            ).ToList();
        }

        // Kuruyemiş / Fıstıksız Filtrelemesi
        bool wantsNutFree = lowerQuery.Contains("fıstıksız") ||
                            lowerQuery.Contains("fistiksiz") ||
                            lowerQuery.Contains("fıstık alerji") ||
                            lowerQuery.Contains("cevizsiz") ||
                            lowerQuery.Contains("bademsiz") ||
                            lowerQuery.Contains("kuruyemişsiz") ||
                            lowerQuery.Contains("fındıksız");

        if (wantsNutFree)
        {
            filtered = filtered.Where(p =>
                !p.Name.Contains("Fıstık", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Fistik", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Ceviz", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Badem", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Fındık", StringComparison.OrdinalIgnoreCase) &&
                !(p.Description != null && (
                    p.Description.Contains("fıstık", StringComparison.OrdinalIgnoreCase) ||
                    p.Description.Contains("fistik", StringComparison.OrdinalIgnoreCase) ||
                    p.Description.Contains("ceviz", StringComparison.OrdinalIgnoreCase) ||
                    p.Description.Contains("badem", StringComparison.OrdinalIgnoreCase) ||
                    p.Description.Contains("fındık", StringComparison.OrdinalIgnoreCase)))
            ).ToList();
        }

        bool wantsDairyFree = lowerQuery.Contains("sütsüz") ||
                              lowerQuery.Contains("sutsuz") ||
                              lowerQuery.Contains("laktozsuz") ||
                              lowerQuery.Contains("lactose-free") ||
                              lowerQuery.Contains("süt istemiyorum") ||
                              lowerQuery.Contains("süt olmasın") ||
                              lowerQuery.Contains("süt koyma") ||
                              lowerQuery.Contains("süt içermeyen") ||
                              lowerQuery.Contains("süt alerji") ||
                              excludeList.Any(ex =>
                                  ((ex.Contains("süt", StringComparison.OrdinalIgnoreCase) || ex.Contains("sut", StringComparison.OrdinalIgnoreCase)) &&
                                   !ex.Contains("sütsüz", StringComparison.OrdinalIgnoreCase) &&
                                   !ex.Contains("sutsuz", StringComparison.OrdinalIgnoreCase)) ||
                                  (ex.Contains("laktoz", StringComparison.OrdinalIgnoreCase) && !ex.Contains("laktozsuz", StringComparison.OrdinalIgnoreCase))
                              );

        if (wantsDairyFree)
        {
            excludeList.Add("süt");
            excludeList.Add("sütlü");
            excludeList.Add("süt ürünü içerir");

            // Süt Ürünü İçerir etiketli veya doğası gereği sütlü kahveleri (Latte, Cappuccino, Flat White, Mocha vb.) ele
            filtered = filtered.Where(p =>
                !p.Tags.Any(t => (t.Name.Contains("Süt", StringComparison.OrdinalIgnoreCase) || t.Name.Contains("Sut", StringComparison.OrdinalIgnoreCase)) &&
                                 !t.Name.Contains("Sütsüz", StringComparison.OrdinalIgnoreCase) &&
                                 !t.Name.Contains("Sutsuz", StringComparison.OrdinalIgnoreCase)) &&
                !p.Name.Contains("Latte", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Cappuccino", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Flat White", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Mocha", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Frappe", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Macchiato", StringComparison.OrdinalIgnoreCase) &&
                !p.Name.Contains("Cortado", StringComparison.OrdinalIgnoreCase)
            ).ToList();
        }
        else if (lowerQuery.Contains("sütlü") || lowerQuery.Contains("sutlu"))
        {
            // Kullanıcı sütlü kahve istedi: Sadece süt içeren ürünleri listele
            var dairyMatches = filtered.Where(p =>
                p.Tags.Any(t => (t.Name.Contains("Süt", StringComparison.OrdinalIgnoreCase) || t.Name.Contains("Sut", StringComparison.OrdinalIgnoreCase)) &&
                                 !t.Name.Contains("Sütsüz", StringComparison.OrdinalIgnoreCase) &&
                                 !t.Name.Contains("Sutsuz", StringComparison.OrdinalIgnoreCase)) ||
                p.Name.Contains("Latte", StringComparison.OrdinalIgnoreCase) ||
                p.Name.Contains("Cappuccino", StringComparison.OrdinalIgnoreCase) ||
                p.Name.Contains("Flat White", StringComparison.OrdinalIgnoreCase) ||
                p.Name.Contains("Mocha", StringComparison.OrdinalIgnoreCase) ||
                p.Name.Contains("Frappe", StringComparison.OrdinalIgnoreCase) ||
                p.Name.Contains("Macchiato", StringComparison.OrdinalIgnoreCase) ||
                p.Name.Contains("Cortado", StringComparison.OrdinalIgnoreCase)
            ).ToList();

            if (dairyMatches.Count > 0)
            {
                filtered = dairyMatches;
            }
        }

        // Kategori Odaklaması (Tatlı arandıysa Tatlılar & Pastacılık, Kahve arandıysa Kahveler)
        if (lowerQuery.Contains("tatlı") || lowerQuery.Contains("pasta") || lowerQuery.Contains("kek") || lowerQuery.Contains("cheesecake"))
        {
            var dessertMatches = filtered.Where(p => p.Category != null && p.Category.Name.Contains("Tatlı", StringComparison.OrdinalIgnoreCase)).ToList();
            if (dessertMatches.Count > 0)
            {
                filtered = dessertMatches;
            }
        }
        else if (lowerQuery.Contains("kahve") || lowerQuery.Contains("espresso") || (!wantsDairyFree && lowerQuery.Contains("latte")))
        {
            var coffeeMatches = filtered.Where(p => p.Category != null && p.Category.Name.Contains("Kahve", StringComparison.OrdinalIgnoreCase)).ToList();
            if (coffeeMatches.Count > 0)
            {
                filtered = coffeeMatches;
            }
        }
        else if (lowerQuery.Contains("tost") || lowerQuery.Contains("sandviç") || lowerQuery.Contains("kruvasan") || lowerQuery.Contains("atıştır"))
        {
            var snackMatches = filtered.Where(p => p.Category != null && p.Category.Name.Contains("Atıştırmalık", StringComparison.OrdinalIgnoreCase)).ToList();
            if (snackMatches.Count > 0)
            {
                filtered = snackMatches;
            }
        }

        if (excludeList.Count > 0)
        {
            var beforeCount = filtered.Count;
            filtered = filtered.Where(p =>
                !p.Tags.Any(t =>
                    excludeList.Any(ex =>
                    {
                        var tName = t.Name;
                        var exLower = ex.ToLowerInvariant();

                        // Şeker / Şekerli ayrımı: 'şekersiz' etiketini 'şeker' dışlamasıyla eşleştirme!
                        if (exLower == "şeker" || exLower == "şekerli" || exLower == "seker" || exLower == "sekerli")
                        {
                            return (tName.Contains("Şeker", StringComparison.OrdinalIgnoreCase) || tName.Contains("Seker", StringComparison.OrdinalIgnoreCase)) &&
                                   !tName.Contains("Şekersiz", StringComparison.OrdinalIgnoreCase) &&
                                   !tName.Contains("Sekersiz", StringComparison.OrdinalIgnoreCase);
                        }

                        // Gluten ayrımı: 'glutensiz' etiketini 'gluten' dışlamasıyla eşleştirme!
                        if (exLower == "gluten" || exLower == "glüten" || exLower == "glutenli" || exLower == "glüten içerir" || exLower == "gluten içerir")
                        {
                            return (tName.Contains("Gluten", StringComparison.OrdinalIgnoreCase) || tName.Contains("Glüten", StringComparison.OrdinalIgnoreCase)) &&
                                   !tName.Contains("Glutensiz", StringComparison.OrdinalIgnoreCase) &&
                                   !tName.Contains("Glütensiz", StringComparison.OrdinalIgnoreCase);
                        }

                        // Süt ayrımı: 'laktozsuz' veya 'sütsüz' etiketini 'süt' dışlamasıyla eşleştirme!
                        if (exLower == "süt" || exLower == "sütlü" || exLower == "sut" || exLower == "sutlu" || exLower == "süt ürünü içerir")
                        {
                            return (tName.Contains("Süt", StringComparison.OrdinalIgnoreCase) || tName.Contains("Sut", StringComparison.OrdinalIgnoreCase)) &&
                                   !tName.Contains("Sütsüz", StringComparison.OrdinalIgnoreCase) &&
                                   !tName.Contains("Sutsuz", StringComparison.OrdinalIgnoreCase);
                        }

                        if (exLower == "sütsüz" || exLower == "sutsuz" || exLower == "glutensiz" || exLower == "glütensiz" || exLower == "şekersiz" || exLower == "sekersiz" || exLower == "kafeinsiz" || exLower == "etsiz" || exLower == "yumurtasız" || exLower == "fıstıksız")
                        {
                            return false;
                        }

                        return tName.Equals(ex, StringComparison.OrdinalIgnoreCase) ||
                               (tName.Contains(ex, StringComparison.OrdinalIgnoreCase) && !tName.EndsWith("siz", StringComparison.OrdinalIgnoreCase) && !tName.EndsWith("sız", StringComparison.OrdinalIgnoreCase));
                    })
                )
            ).ToList();

            _logger.LogInformation(">>> [TAG FILTER] Dışlanan etiket filtrelemesi: {ExcludedCount} ürün elendi, {RemainingCount} ürün kaldı.",
                beforeCount - filtered.Count, filtered.Count);
        }

        _logger.LogInformation(">>> [FINAL RESULT] Eşleşen nihai ürün sayısı: {MatchedCount}", filtered.Count);
        _logger.LogInformation("=================================================");

        // 7. Nihai Mesajı Belirle
        var finalMessage = filtered.Count > 0
            ? (!string.IsNullOrWhiteSpace(aiMessage) ? aiMessage : "Sizin için seçeneklerimizi listeledim:")
            : "Aradığınız kriterlere uygun ürün bulunamadı.";

        // 8. MenuSearchResultDto döndür
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
}
