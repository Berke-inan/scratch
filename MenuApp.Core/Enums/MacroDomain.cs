namespace MenuApp.Core.Enums;

/// <summary>
/// Makro Alan / Varlık Tipi (Macro Domain).
/// Kategorileri üst seviye etki alanlarına bağlar ve katmanlı izolasyon sağlar.
/// </summary>
public enum MacroDomain
{
    /// <summary>
    /// Sıcak ve Soğuk Kahveler (Espresso, Filtre Kahve, Latte, Cold Brew vb.)
    /// </summary>
    BeverageCoffee,

    /// <summary>
    /// Meşrubat, Gazoz, Su, Limonata, Soğuk Çay vb. (Kahve Dışı İçecekler)
    /// </summary>
    BeverageOther,

    /// <summary>
    /// Mutfak lezzetleri, tost, sandviç, kruvasan sandviç, wrap, kahvaltı, patates sepeti
    /// </summary>
    FoodKitchen,

    /// <summary>
    /// Tatlılar, pastalar, cheesecake, brownie, tiramisu, kek vb.
    /// </summary>
    FoodDessert
}
