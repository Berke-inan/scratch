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

        if (!string.IsNullOrWhiteSpace(intentPayload?.Category))
        {
            var catWords = intentPayload.Category.Split(new[] { ' ', ',', '-', '/' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var cw in catWords)
            {
                keywords.Add(cw.ToLowerInvariant());
            }
        }

        // Kullanıcı sorgusundan temel yiyecek/içecek anahtar kelimelerini de ekle
        var commonFoodTerms = new[] { "kahve", "espresso", "latte", "filtre", "çay", "tost", "tatlı", "pasta", "kek", "kruvasan", "sandviç", "salep", "kurabiye", "burger", "pizza", "makarna", "fajita", "et", "tavuk", "köfte", "salata" };
        var lowerQuery = userQuery.ToLowerInvariant();
        foreach (var term in commonFoodTerms)
        {
            if (lowerQuery.Contains(term))
            {
                keywords.Add(term);
            }
        }

        if (keywords.Count > 0)
        {
            _logger.LogInformation(">>> [FILTER KEYWORDS] Arama anahtar kelimeleri: [{Keywords}]", string.Join(", ", keywords));

            // Ürün filtreleme: Kategori adı, ürün adı veya açıklaması anahtar kelimelerden herhangi birini içeriyor mu?
            var matches = filtered.Where(p =>
            {
                var catName = p.Category?.Name ?? "";
                var prodName = p.Name;
                var prodDesc = p.Description ?? "";

                return keywords.Any(k =>
                    catName.Contains(k, StringComparison.OrdinalIgnoreCase) ||
                    k.Contains(catName, StringComparison.OrdinalIgnoreCase) ||
                    prodName.Contains(k, StringComparison.OrdinalIgnoreCase) ||
                    prodDesc.Contains(k, StringComparison.OrdinalIgnoreCase)
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

        // Eğer kullanıcı 'şekersiz' istediyse 'şeker', 'şekerli' etiketlerini dışla
        if (lowerQuery.Contains("şekersiz"))
        {
            excludeList.Add("şeker");
            excludeList.Add("şekerli");
        }

        if (excludeList.Count > 0)
        {
            var beforeCount = filtered.Count;
            filtered = filtered.Where(p =>
                !p.Tags.Any(t =>
                    excludeList.Any(ex =>
                        t.Name.ToLowerInvariant().Contains(ex.ToLowerInvariant()) ||
                        ex.ToLowerInvariant().Contains(t.Name.ToLowerInvariant())
                    )
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
