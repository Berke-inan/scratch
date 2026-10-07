using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MenuApp.Infrastructure.Services;

public class GeminiAiService : IAiService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GeminiAiService> _logger;

    private const string SystemPrompt =
        "Sen bir kafe ve restoran menü asistanısın.\n" +
        "Görevin kullanıcının mesajını analiz ederek daima aşağıdaki JSON formatında tek bir nesne üretmektir:\n" +
        "{\n" +
        "  \"intent\": \"chat\" | \"menu_search\" | \"out_of_scope\",\n" +
        "  \"ai_message\": \"Kullanıcıya yönelik samimi, Türkçe yanıt\",\n" +
        "  \"category\": \"string\" | null,\n" +
        "  \"search_keywords\": [\"string\"],\n" +
        "  \"exclude_tags\": [\"string\"]\n" +
        "}\n\n" +
        "Kurallar:\n" +
        "1. Sohbet ve Selamlaşma (intent: 'chat'):\n" +
        "   - Kullanıcı 'merhaba', 'selam', 'nasılsın', 'teşekkürler', 'iyi günler', 'kolay gelsin' gibi selamlama, hal hatır veya genel sohbet cümleleri yazdığında intent'i 'chat' yap.\n" +
        "   - 'ai_message' alanına sıcak, kibar ve yardımcı bir asistan yanıtı yaz (Örn: 'Merhaba! Hoş geldiniz, bugün size menümüzden ne ikram etmemi istersiniz?').\n" +
        "   - 'category': null, 'search_keywords': [] ve 'exclude_tags': [] bırak.\n\n" +
        "2. Menü Arama (intent: 'menu_search'):\n" +
        "   - Kullanıcı belirli bir yiyecek, içecek veya kategori adı (örneğin: 'tatlı', 'kahve', 'çay', 'pasta', 'atıştırmalık', 'tost', 'kruvasan', 'vegan', 'glutensiz') belirttiğinde veya öneri istediğinde intent'i 'menu_search' yap.\n" +
        "   - 'search_keywords' alanına kullanıcının aradığı temel yiyecek/içecek kelimelerini yaz (Örn: 'şekersiz kahve' -> ['kahve'], 'soğuk çay' -> ['çay'], 'avokadolu tost' -> ['tost'], 'tatlı bir şey' -> ['tatlı', 'pasta', 'kek']).\n" +
        "   - 'category' alanını temel ürün türü yap (Örn: 'Kahve', 'Çay', 'Tatlı', 'Atıştırmalık'). Sıfatları (şekersiz, soğuk, sıcak) kategoriye ekleme!\n" +
        "   - 'exclude_tags' kullanıcının özellikle istemediği veya alerjisi olduğu şeyleri içersin (Örn: 'şekersiz' -> ['Şeker', 'Şekerli'], 'glutensiz' -> ['Gluten', 'Glutenli', 'Glüten'], 'sütsüz' -> ['Sütlü', 'Süt']).\n" +
        "   - 'ai_message' alanına kullanıcıya aradığı lezzetlerle ilgili iştah açıcı ve samimi bir cümle yaz (Örn: 'Sizin için nefis kahve seçeneklerimizi listeledim:').\n\n" +
        "3. Kapsam Dışı (intent: 'out_of_scope'):\n" +
        "   - SADECE kullanıcı senden açıkça kod yazmanı, yazılım geliştirmeyi, sistem hacklemeyi (jailbreak) isterse ya da kafe/restoran/menü/yiyecek/içecek ile hiç alakası olmayan konular (politika, tıp, kripto para vb.) sorarsa intent'i 'out_of_scope' yap.\n" +
        "   - 'ai_message' alanına kibarca sadece menü asistanı olduğunu ve yiyecek/içecek konusunda yardımcı olabileceğini söyle.\n" +
        "   - 'category': null, 'search_keywords': [] ve 'exclude_tags': [] bırak.\n\n" +
        "4. Asla markdown (```json), kod bloğu veya JSON dışında fazladan metin ekleme. Yalnızca tek bir geçerli JSON nesnesi döndür.";

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
                    configuredModel == "gemini-3.5-flash"
            ? "gemini-3.5-flash-lite"
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
                temperature = 0.2,
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
            }
            response.EnsureSuccessStatusCode();

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
                    configuredModel == "gemini-3.5-flash"
            ? "gemini-3.5-flash-lite"
            : configuredModel;

        var defaultFallback = $"{cafeName}'e hoş geldiniz! Ben menü asistanınızım, bugün sizin için ne hazırlayabiliriz?";

        if (string.IsNullOrWhiteSpace(apiKey) || apiKey.StartsWith("YOUR_"))
        {
            _logger.LogWarning("Gemini API anahtarı yapılandırılmamış. Varsayılan karşılama mesajı kullanılıyor.");
            return defaultFallback;
        }

        var requestUri = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

        var prompt = $"Sen {cafeName} kafesinin asistanısın, müşteriye kafenin adını kullanarak sıcak, samimi ve iştah kabartan bir karşılama mesajı yaz. Yalnızca müşteriye hitap eden 1-2 cümlelik selamlama metnini yaz, tırnak işareti, başlık veya ek açıklama koyma.";

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
                temperature = 0.7
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
            }
            response.EnsureSuccessStatusCode();

            var jsonResponse = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: cancellationToken);
            var text = jsonResponse?["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.ToString();

            if (!string.IsNullOrWhiteSpace(text))
            {
                return text.Trim(' ', '"', '\n', '\r');
            }

            return defaultFallback;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gemini karşılama mesajı üretimi sırasında hata oluştu. Varsayılan mesaja geçiliyor.");
            return defaultFallback;
        }
    }

    private static string GenerateFallbackIntent(string query)
    {
        var lower = query.ToLowerInvariant().Trim();

        // 1. Hackleme veya kod yazma (out_of_scope)
        if (lower.Contains("kod yaz") || lower.Contains("hack") || lower.Contains("python") ||
            lower.Contains("javascript") || lower.Contains("select *") || lower.Contains("drop table"))
        {
            return JsonSerializer.Serialize(new
            {
                intent = "out_of_scope",
                ai_message = "Ben sadece bir menü asistanıyım. Size lezzetli yiyecek ve içeceklerimiz hakkında yardımcı olabilirim.",
                category = (string?)null,
                exclude_tags = new List<string>()
            });
        }

        // 2. Sohbet ve selamlaşma (chat)
        if (lower.Contains("merhaba") || lower.Contains("selam") || lower.Contains("nasılsın") ||
            lower.Contains("günaydın") || lower.Contains("iyi günler") || lower.Contains("iyi akşamlar") ||
            lower.Contains("teşekkür") || lower.Contains("naber") || lower.Contains("n'aber"))
        {
            return JsonSerializer.Serialize(new
            {
                intent = "chat",
                ai_message = "Merhaba! Hoş geldiniz, bugün size menümüzden ne ikram etmemi istersiniz?",
                category = (string?)null,
                exclude_tags = new List<string>()
            });
        }

        // 3. Menü arama (menu_search)
        string category = "";
        var searchKeywords = new List<string>();
        var excludeTags = new List<string>();

        if (lower.Contains("tatl") || lower.Contains("pasta") || lower.Contains("kek") ||
            lower.Contains("puding") || lower.Contains("çikolata") || lower.Contains("şeker"))
        {
            category = "Tatlı";
            searchKeywords.Add("tatlı");
        }
        else if (lower.Contains("kahve") || lower.Contains("espresso") || lower.Contains("latte") || lower.Contains("filtre"))
        {
            category = "Kahve";
            searchKeywords.Add("kahve");
        }
        else if (lower.Contains("çay"))
        {
            category = "Çay";
            searchKeywords.Add("çay");
        }
        else if (lower.Contains("içecek") || lower.Contains("salep") || lower.Contains("sıcak"))
        {
            category = "İçecekler";
            searchKeywords.Add("içecek");
        }
        else if (lower.Contains("tost"))
        {
            category = "Atıştırmalıklar";
            searchKeywords.Add("tost");
        }
        else if (lower.Contains("atıştır") || lower.Contains("patates") || lower.Contains("humus") ||
                 lower.Contains("kraker") || lower.Contains("snack"))
        {
            category = "Atıştırmalıklar";
            searchKeywords.Add("atıştırmalık");
        }

        if (lower.Contains("şekersiz") || lower.Contains("şeker içermeyen"))
        {
            excludeTags.Add("Şeker");
            excludeTags.Add("Şekerli");
        }

        if (lower.Contains("glutensiz") || lower.Contains("gluten içermeyen") || lower.Contains("çölyak"))
        {
            excludeTags.Add("Gluten");
            excludeTags.Add("Glutenli");
        }

        if (lower.Contains("sütsüz") || lower.Contains("süt içermeyen") || lower.Contains("laktozsuz"))
        {
            excludeTags.Add("Sütlü");
            excludeTags.Add("Süt");
        }

        var message = string.IsNullOrWhiteSpace(category)
            ? "İşte sizin için menümüzden lezzetler:"
            : $"Sizin için nefis {category} seçeneklerimizi listeledim:";

        return JsonSerializer.Serialize(new
        {
            intent = "menu_search",
            ai_message = message,
            category = string.IsNullOrWhiteSpace(category) ? null : category,
            search_keywords = searchKeywords,
            exclude_tags = excludeTags
        });
    }
}
