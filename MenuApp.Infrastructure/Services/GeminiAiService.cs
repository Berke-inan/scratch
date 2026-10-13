using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MenuApp.Infrastructure.Services;

public class GeminiAiService : IAiService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GeminiAiService> _logger;

    private const string SystemPrompt =
        "Sen yeni nesil, modern bir 3rd wave kafe baristası ve profesyonel salon şefisin.\n" +
        "Persona ve Tarz:\n" +
        "- Kısa, samimi, kibar, net ve doğrudan sonuca odaklısın.\n" +
        "- KESİNLİKLE YASAK OLAN İFADELER: 'Ailesine hoş geldin', 'dünyasına hoş geldin', 'damak çatlatan', 'damaklarda iz bırakan enfes lezzetler', 'sıcacık atmosfer', 'sabırsızlanıyoruz', 'lezzet şöleni', 'büyük bir keyif' gibi yapay reklam ajansı ve klişe bot sözlerini ASLA KULLANMA.\n" +
        "- 'ai_message' alanına kullanıcıya öneri sunarken reklam yapmadan, tek cümleyle doğrudan konuya gir (Örn: 'Sizin için menümüzdeki en uygun fiyatlı lezzetleri listeledim:', 'Güne güzel bir başlangıç için kahvaltılık ve doyurucu alternatiflerimiz:', 'Sizin için taze demlenmiş sıcak kahvelerimizi listeledim:').\n\n" +
        "Görevin kullanıcının mesajını analiz ederek daima aşağıdaki JSON formatında tek bir nesne üretmektir:\n" +
        "{\n" +
        "  \"intent\": \"chat\" | \"menu_search\" | \"out_of_scope\",\n" +
        "  \"ai_message\": \"string\",\n" +
        "  \"category\": \"Sıcak Kahveler\" | \"Soğuk Kahveler\" | \"Soğuk İçecekler\" | \"Tatlılar & Pastacılık\" | \"Atıştırmalık & Mutfak\" | null,\n" +
        "  \"search_keywords\": [\"string\"],\n" +
        "  \"exclude_tags\": [\"string\"],\n" +
        "  \"price_preference\": \"cheap\" | \"expensive\" | \"none\",\n" +
        "  \"max_price\": number | null,\n" +
        "  \"min_price\": number | null\n" +
        "}\n\n" +
        "Kurallar ve Kategori Eşleme:\n" +
        "Veritabanında YALNIZCA 5 Kategori vardır. 'category' alanı bu 5 kategoriden biri olmalı veya genel aramalarda null olmalıdır:\n" +
        "1. 'Sıcak Kahveler': Filtre kahve, espresso, americano, latte, cappuccino, flat white, cortado, mocha, türk kahvesi (soğuk belirtilmemiş kahveler).\n" +
        "2. 'Soğuk Kahveler': Iced latte, cold brew, frappe, iced americano, buzlu kahve, iced mocha.\n" +
        "3. 'Soğuk İçecekler': Meşrubat, gazlı içecek, kola, fanta, sprite, gazoz, maden suyu, soda, doğal su, ev yapımı limonata, soğuk çay, portakal suyu. (Kola, gazoz, soda ve meşrubatlar ASLA kahve değildir!).\n" +
        "4. 'Tatlılar & Pastacılık': Tatlı, pasta, kek, cheesecake, brownie, tiramisu, kruvasan (tatlı), kurabiye, çikolatalı lezzetler.\n" +
        "5. 'Atıştırmalık & Mutfak': Kahvaltı, kahvaltılık, tost, sandviç, kruvasan sandviç, wrap, bowl, patates sepeti, atıştırmalık, ana yemek, doyurucu öğünler, yiyecek, tuzlu.\n\n" +
        "Fiyat ve Bütçe Kuralları:\n" +
        "- 'price_preference': Kullanıcı 'ucuz', 'en ucuz', 'uygun', 'en uygun', 'hesaplı', 'ekonomik', 'bütçe dostu', 'fiyatı düşük' derse 'cheap'. 'en pahalı', 'lüks', 'premium' derse 'expensive'. Aksi halde 'none'.\n" +
        "- 'max_price': '150 TL altı', 'en fazla 200 lira', '100 liraya kadar' gibi üst sınır varsa sayısal değer (örn: 150), yoksa null.\n" +
        "- 'min_price': '100 TL üstü', 'en az 80 lira' gibi alt sınır varsa sayısal değer (örn: 100), yoksa null.\n" +
        "- '100-200 TL arası' gibi aralıklarda min_price: 100, max_price: 200 olmalıdır.\n\n" +
        "Dışlanan Etiketler (exclude_tags):\n" +
        "- 'şekersiz' -> ['Şeker', 'Şekerli']\n" +
        "- 'glutensiz' -> ['Gluten', 'Glüten', 'Gluten İçerir', 'Glüten İçerir']\n" +
        "- 'sütsüz' / 'laktozsuz' -> ['Süt', 'Sütlü', 'Süt Ürünü İçerir']\n\n" +
        "Intent Kuralları:\n" +
        "- Genel selamlama / hal hatır ('merhaba', 'selam', 'nasılsın') -> intent: 'chat', category: null, search_keywords: [], exclude_tags: [], price_preference: 'none', max_price: null, min_price: null.\n" +
        "- Kod yazma, sistem hackleme veya kafe dışı konular -> intent: 'out_of_scope'.\n" +
        "- Menü, lezzet veya bütçe sorgusu -> intent: 'menu_search'.\n" +
        "- YALNIZCA tek bir geçerli JSON döndür. Markdown (```json) veya fazladan açıklama yazma.";

    public GeminiAiService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<GeminiAiService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> ProcessMenuQueryAsync(string userQuery, CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["Gemini:ApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        var configuredModel = _configuration["Gemini:Model"]?.Trim();
        var model = string.IsNullOrWhiteSpace(configuredModel) ||
                    configuredModel == "gemini-1.5-flash" ||
                    configuredModel == "gemini-2.0-flash" ||
                    configuredModel == "gemini-2.5-flash" ||
                    configuredModel == "gemini-3.5-flash" ||
                    configuredModel == "gemini-3.5-flash-lite"
            ? "gemini-3.8-flash"
            : configuredModel;

        if (string.IsNullOrWhiteSpace(apiKey) || apiKey.StartsWith("YOUR_"))
        {
            _logger.LogWarning("Gemini API anahtarı yapılandırılmamış. Yerel kural tabanlı intent çıkarıcı devreye giriyor: {Query}", userQuery);
            return GenerateFallbackIntent(userQuery);
        }

        var requestUri = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

        var payload = new
        {
            systemInstruction = new
            {
                parts = new[]
                {
                    new { text = SystemPrompt }
                }
            },
            contents = new[]
            {
                new
                {
                    role = "user",
                    parts = new[]
                    {
                        new { text = userQuery }
                    }
                }
            },
            generationConfig = new
            {
                temperature = 0.1,
                responseMimeType = "application/json"
            }
        };

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, requestUri);
            request.Headers.TryAddWithoutValidation("x-goog-api-key", apiKey);
            request.Content = JsonContent.Create(payload);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Gemini API hata döndürdü ({StatusCode}): {ErrorBody}", response.StatusCode, errorBody);
                return GenerateFallbackIntent(userQuery);
            }

            var jsonResponse = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: cancellationToken);
            var text = jsonResponse?["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.ToString();

            if (!string.IsNullOrWhiteSpace(text))
            {
                return text.Trim();
            }

            return GenerateFallbackIntent(userQuery);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gemini API çağrısı sırasında hata oluştu. Yerel kural tabanlı intent çıkarıcıya geçiliyor: {Query}", userQuery);
            return GenerateFallbackIntent(userQuery);
        }
    }

    public async Task<string> GenerateWelcomeMessageAsync(string cafeName, CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["Gemini:ApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        var configuredModel = _configuration["Gemini:Model"]?.Trim();
        var model = string.IsNullOrWhiteSpace(configuredModel) ||
                    configuredModel == "gemini-1.5-flash" ||
                    configuredModel == "gemini-2.0-flash" ||
                    configuredModel == "gemini-2.5-flash" ||
                    configuredModel == "gemini-3.5-flash" ||
                    configuredModel == "gemini-3.5-flash-lite"
            ? "gemini-3.8-flash"
            : configuredModel;

        var defaultFallback = $"Merhaba! {cafeName} menüsüne hoş geldiniz. İster filtre kahve, ister glutensiz veya şekersiz lezzetler ya da bütçenize uygun seçenekler olsun; ne arzu ederseniz yardımcı olabilirim.";

        if (string.IsNullOrWhiteSpace(apiKey) || apiKey.StartsWith("YOUR_"))
        {
            _logger.LogWarning("Gemini API anahtarı yapılandırılmamış. Varsayılan karşılama mesajı kullanılıyor.");
            return defaultFallback;
        }

        var requestUri = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

        var prompt = $"Sen {cafeName} mekanının yeni nesil 3rd wave baristası ve salon şefisin.\n" +
                     "Müşteriyi karşılayan kısa (1-2 cümlelik), samimi, profesyonel ve modern bir karşılama mesajı yaz.\n" +
                     "KESİNLİKLE YASAKLAR: 'Ailesine hoş geldin', 'dünyasına hoş geldin', 'damak çatlatan', 'damaklarda iz bırakan', 'enfes lezzetler', 'sıcacık atmosfer', 'sabırsızlanıyoruz' gibi yapay reklam ve bot klişelerini ASLA KULLANMA.\n" +
                     $"Örnek ton: 'Merhaba! {cafeName} menüsüne hoş geldiniz. İster filtre kahve, ister glutensiz veya şekersiz lezzetler ya da bütçenize uygun seçenekler olsun; ne arzu ederseniz yardımcı olabilirim.'\n" +
                     "Yalnızca müşteriye hitap eden selamlama metnini döndür. Tırnak işareti, başlık veya ek açıklama yazma.";

        var payload = new
        {
            contents = new[]
            {
                new
                {
                    role = "user",
                    parts = new[]
                    {
                        new { text = prompt }
                    }
                }
            },
            generationConfig = new
            {
                temperature = 0.3
            }
        };

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, requestUri);
            request.Headers.TryAddWithoutValidation("x-goog-api-key", apiKey);
            request.Content = JsonContent.Create(payload);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Gemini API karşılama mesajında hata döndürdü ({StatusCode}): {ErrorBody}", response.StatusCode, errorBody);
                return defaultFallback;
            }

            var jsonResponse = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: cancellationToken);
            var text = jsonResponse?["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.ToString();

            if (!string.IsNullOrWhiteSpace(text))
            {
                var clean = text.Trim(' ', '"', '\n', '\r');
                return SanitizeBaristaTone(clean, defaultFallback);
            }

            return defaultFallback;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gemini karşılama mesajı üretimi sırasında hata oluştu. Varsayılan mesaja geçiliyor.");
            return defaultFallback;
        }
    }

    public static string SanitizeBaristaTone(string message, string fallback)
    {
        if (string.IsNullOrWhiteSpace(message)) return fallback;

        var lower = message.ToLowerInvariant();
        var bannedPhrases = new[]
        {
            "ailesine hoş",
            "dünyasına hoş",
            "damak çatlatan",
            "damaklarda iz bırakan",
            "enfes lezzet",
            "sıcacık atmosfer",
            "sabırsızlanıyoruz",
            "şölen",
            "lezzet şöleni",
            "büyük bir keyif",
            "büyük bir heyecan",
            "lezzet dolu"
        };

        if (bannedPhrases.Any(phrase => lower.Contains(phrase)))
        {
            return fallback;
        }

        return message;
    }

    public static string NormalizeText(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;

        // Onar: UTF-8 -> ISO-8859-1 mojibake (altÄ± -> altı)
        var s = input
            .Replace("Ä±", "ı")
            .Replace("Ã§", "ç")
            .Replace("ÅŸ", "ş")
            .Replace("Ã¶", "ö")
            .Replace("Ã¼", "ü")
            .Replace("ÄŸ", "ğ")
            .Replace("Ä°", "i")
            .Replace("Ã‡", "ç")
            .Replace("Å\u009e", "ş")
            .Replace("Ã–", "ö")
            .Replace("Ãœ", "ü")
            .Replace("Ä\u009e", "ğ");

        return s.ToLowerInvariant()
            .Replace('ı', 'i')
            .Replace('ğ', 'g')
            .Replace('ü', 'u')
            .Replace('ş', 's')
            .Replace('ö', 'o')
            .Replace('ç', 'c');
    }

    public static string GenerateFallbackIntent(string query)
    {
        var norm = NormalizeText(query).Trim();

        // 1. Kapsam Dışı (out_of_scope)
        if (norm.Contains("kod yaz") || norm.Contains("hack") || norm.Contains("python") ||
            norm.Contains("javascript") || norm.Contains("select *") || norm.Contains("drop table"))
        {
            return JsonSerializer.Serialize(new
            {
                intent = "out_of_scope",
                ai_message = "Ben menü asistanıyım. Size lezzetli yiyecek, içecek ve kahvelerimiz hakkında yardımcı olabilirim.",
                category = (string?)null,
                search_keywords = new List<string>(),
                exclude_tags = new List<string>(),
                price_preference = "none",
                max_price = (decimal?)null,
                min_price = (decimal?)null
            });
        }

        // 2. Sohbet ve Selamlaşma (chat)
        if (norm == "merhaba" || norm == "selam" || norm == "selamlar" || norm.StartsWith("merhaba") ||
            norm.Contains("nasilsin") || norm.Contains("gunaydin") || norm.Contains("iyi gunler") ||
            norm.Contains("iyi aksamlar") || norm.Contains("tesekkur") || norm.Contains("naber"))
        {
            return JsonSerializer.Serialize(new
            {
                intent = "chat",
                ai_message = "Merhaba! Menümüzden ne arzu edersiniz, size yardımcı olabilirim.",
                category = (string?)null,
                search_keywords = new List<string>(),
                exclude_tags = new List<string>(),
                price_preference = "none",
                max_price = (decimal?)null,
                min_price = (decimal?)null
            });
        }

        // 3. Fiyat ve Bütçe Tespiti
        string pricePreference = "none";
        if (norm.Contains("ucuz") || norm.Contains("uygun") || norm.Contains("hesapli") ||
            norm.Contains("ekonomik") || norm.Contains("butce dostu") || norm.Contains("en dusuk"))
        {
            pricePreference = "cheap";
        }
        else if (norm.Contains("pahali") || norm.Contains("en pahali") || norm.Contains("luks") || norm.Contains("premium"))
        {
            pricePreference = "expensive";
        }

        decimal? maxPrice = null;
        decimal? minPrice = null;

        // Fiyat aralığı tespiti: Örn: "100-200 TL arası"
        var rangeMatch = Regex.Match(norm, @"(\d+)\s*(?:tl|lira)?\s*(?:-|–|ile|\s+ila\s+)\s*(\d+)\s*(?:tl|lira)?");
        if (rangeMatch.Success)
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
            // Max price: "150 tl alti", "en fazla 200 lira", "100 liraya kadar"
            var maxMatch = Regex.Match(norm, @"(?:en\s+fazla|maksimum|max|en\s+cok)\s*(\d+)|(\d+)\s*(?:tl|lira)?\s*(?:alti|altinda|kadar|gecmesin)");
            if (maxMatch.Success)
            {
                var numStr = !string.IsNullOrEmpty(maxMatch.Groups[1].Value) ? maxMatch.Groups[1].Value : maxMatch.Groups[2].Value;
                if (decimal.TryParse(numStr, out var val))
                {
                    maxPrice = val;
                }
            }

            // Min price: "100 tl ustu", "en az 150 lira"
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

        // 4. Kategori Eşlemesi (5 Kanonik Kategori)
        string? category = null;
        var searchKeywords = new List<string>();
        var excludeTags = new List<string>();

        // Atıştırmalık & Mutfak
        if (norm.Contains("kahvalti") || norm.Contains("tost") || norm.Contains("sandvic") ||
            norm.Contains("atistir") || norm.Contains("patates") || norm.Contains("wrap") ||
            norm.Contains("bowl") || norm.Contains("yemek") || norm.Contains("ana yemek") ||
            norm.Contains("yiyecek") || norm.Contains("doyurucu") || norm.Contains("tuzlu") || norm.Contains("snack"))
        {
            category = "Atıştırmalık & Mutfak";
            if (norm.Contains("kahvalti")) searchKeywords.Add("kahvaltı");
            if (norm.Contains("tost")) searchKeywords.Add("tost");
            if (norm.Contains("sandvic")) searchKeywords.Add("sandviç");
            if (norm.Contains("patates")) searchKeywords.Add("patates");
            if (norm.Contains("wrap")) searchKeywords.Add("wrap");
            if (norm.Contains("bowl")) searchKeywords.Add("bowl");
        }
        // Soğuk İçecekler (Meşrubat, Kola vb. - Asla kahve değildir!)
        else if (norm.Contains("mesrubat") || norm.Contains("gazli") ||
                 norm.Contains("kola") || norm.Contains("cola") || norm.Contains("fanta") || norm.Contains("sprite") ||
                 norm.Contains("gazoz") || norm.Contains("soda") || norm.Contains("maden suyu") ||
                 norm.Contains("limonata") || norm.Contains("soguk cay") || norm.Contains("ice tea") ||
                 norm.Contains("portakal suyu") || (norm.Contains("icecek") && !norm.Contains("sicak")))
        {
            category = "Soğuk İçecekler";
            if (norm.Contains("kola") || norm.Contains("cola")) searchKeywords.Add("kola");
            if (norm.Contains("gazoz") || norm.Contains("sprite")) searchKeywords.Add("gazoz");
            if (norm.Contains("soda") || norm.Contains("maden")) searchKeywords.Add("maden suyu");
            if (norm.Contains("limonata")) searchKeywords.Add("limonata");
        }
        // Tatlılar & Pastacılık
        else if (norm.Contains("tatli") || norm.Contains("pasta") || norm.Contains("kek") ||
                 norm.Contains("cheesecake") || norm.Contains("brownie") || norm.Contains("tiramisu") ||
                 norm.Contains("puding") || norm.Contains("cikolata") || norm.Contains("kurabiye"))
        {
            category = "Tatlılar & Pastacılık";
            searchKeywords.Add("tatlı");
        }
        // Soğuk Kahveler
        else if (norm.Contains("soguk kahve") || norm.Contains("iced latte") ||
                 norm.Contains("cold brew") || norm.Contains("frappe") || norm.Contains("iced") || norm.Contains("buzlu kahve"))
        {
            category = "Soğuk Kahveler";
            searchKeywords.Add("kahve");
        }
        // Sıcak Kahveler
        else if (norm.Contains("kahve") || norm.Contains("espresso") || norm.Contains("latte") ||
                 norm.Contains("filtre") || norm.Contains("cappuccino") || norm.Contains("americano") ||
                 norm.Contains("turk kahvesi") || norm.Contains("sicak kahve"))
        {
            category = "Sıcak Kahveler";
            searchKeywords.Add("kahve");
        }

        // Dışlanan etiketler
        if (norm.Contains("sekersiz") || norm.Contains("seker icermeyen"))
        {
            excludeTags.Add("Şeker");
            excludeTags.Add("Şekerli");
        }

        if (norm.Contains("glutensiz") || norm.Contains("gluten icermeyen") || norm.Contains("colyak"))
        {
            excludeTags.Add("Gluten");
            excludeTags.Add("Glüten");
            excludeTags.Add("Gluten İçerir");
            excludeTags.Add("Glüten İçerir");
        }

        if (norm.Contains("sutsuz") || norm.Contains("sut icermeyen") || norm.Contains("laktozsuz"))
        {
            excludeTags.Add("Süt");
            excludeTags.Add("Sütlü");
            excludeTags.Add("Süt Ürünü İçerir");
        }

        // Doğrudan ve net barista yanıtı üretimi
        string aiMessage;
        if (pricePreference == "cheap")
        {
            aiMessage = "Sizin için menümüzdeki en uygun fiyatlı lezzetleri listeledim:";
        }
        else if (maxPrice.HasValue)
        {
            aiMessage = $"Sizin için {maxPrice.Value:0} TL altındaki seçeneklerimizi listeledim:";
        }
        else if (norm.Contains("kahvalti"))
        {
            aiMessage = "Güne güzel bir başlangıç için kahvaltılık ve doyurucu alternatiflerimiz:";
        }
        else if (!string.IsNullOrWhiteSpace(category))
        {
            aiMessage = $"Sizin için {category} kategorisindeki alternatiflerimizi listeledim:";
        }
        else
        {
            aiMessage = "Sizin için seçeneklerimizi listeledim:";
        }

        return JsonSerializer.Serialize(new
        {
            intent = "menu_search",
            ai_message = aiMessage,
            category = category,
            search_keywords = searchKeywords,
            exclude_tags = excludeTags,
            price_preference = pricePreference,
            max_price = maxPrice,
            min_price = minPrice
        });
    }
}
