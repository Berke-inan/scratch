using MenuApp.Core.Enums;

namespace MenuApp.Core.Interfaces;

public interface ITaxonomyRegistry
{
    /// <summary>
    /// Sorgu metni ve AI önerisi üzerinden birincil Makro Alanı çözümler.
    /// Belirli bir alan tespit edilemezse (ör. "ucuz bir şeyler öner") null döner.
    /// </summary>
    MacroDomain? ResolveMacroDomain(string normalizedQuery, string? suggestedCategory = null);

    /// <summary>
    /// Belirtilen makro alana ait kanonik kategori adlarını döndürür.
    /// </summary>
    IReadOnlyList<string> GetCategoriesForDomain(MacroDomain domain);

    /// <summary>
    /// Verilen kategori adının hangi makro alana ait olduğunu döndürür.
    /// </summary>
    MacroDomain? GetDomainForCategory(string categoryName);

    /// <summary>
    /// Bir makro alan aktif olduğunda dışlanması gereken zıt alanları döndürür.
    /// </summary>
    IReadOnlyList<MacroDomain> GetImplicitNegativeDomains(MacroDomain domain);

    /// <summary>
    /// Verilen kategorinin belirtilen makro alana dahil olup olmadığını doğrular.
    /// </summary>
    bool IsCategoryInDomain(string categoryName, MacroDomain domain);

    /// <summary>
    /// Sorgu bağlamına göre etiketin önemlilik puanını hesaplar.
    /// </summary>
    int CalculateTagScore(string tag, string normalizedQuery, string? categoryName);

    /// <summary>
    /// Bir ürünün etiketleri arasından en yüksek skorlu birincil etiketi seçer.
    /// </summary>
    string? SelectPrimaryTag(IEnumerable<string> tags, string normalizedQuery, string? categoryName);
}
