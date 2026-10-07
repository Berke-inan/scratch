using System.Text.Json;
using System.Text.Json.Serialization;
using MenuApp.Core.Entities;
using MenuApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

Console.WriteLine("==================================================");
Console.WriteLine(">>> Lounge Box Kitchen Menü Tohumlama Başlatılıyor...");
Console.WriteLine("==================================================");

var connectionString = "Host=aws-1-eu-central-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.wtrizpvvdjxmhrdzfbat;Password=Pv46ehrgNx6Ko5UX;SSL Mode=Require;Trust Server Certificate=true";

var options = new DbContextOptionsBuilder<ApplicationDbContext>()
    .UseNpgsql(connectionString)
    .Options;

using var db = new ApplicationDbContext(options);

// 1. Ensure Target Cafe
var targetCafeId = Guid.Parse("a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab");
var cafe = await db.Cafes.FirstOrDefaultAsync(c => c.Id == targetCafeId);

if (cafe == null)
{
    cafe = new Cafe
    {
        Id = targetCafeId,
        Name = "Lounge Box Kitchen"
    };
    db.Cafes.Add(cafe);
    await db.SaveChangesAsync();
    Console.WriteLine($">>> Yeni Kafe oluşturuldu: {cafe.Name} ({cafe.Id})");
}
else
{
    cafe.Name = "Lounge Box Kitchen";
    await db.SaveChangesAsync();
    Console.WriteLine($">>> Mevcut Kafe güncellendi: {cafe.Name} ({cafe.Id})");
}

// 2. Read scraped_menu.json
var jsonPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "scraped_menu.json");
if (!File.Exists(jsonPath))
{
    jsonPath = Path.Combine(Directory.GetCurrentDirectory(), "scraped_menu.json");
}
if (!File.Exists(jsonPath))
{
    jsonPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "scraped_menu.json");
}

Console.WriteLine($">>> Menü JSON dosyası okunuyor: {jsonPath}");
var jsonString = await File.ReadAllTextAsync(jsonPath);
var menuData = JsonSerializer.Deserialize<List<ScrapedCategoryDto>>(jsonString, new JsonSerializerOptions
{
    PropertyNameCaseInsensitive = true
});

if (menuData == null || menuData.Count == 0)
{
    Console.WriteLine("HATA: Menü JSON verisi boş veya okunamadı.");
    return;
}

// 3. Clear existing categories and products for this cafe
var existingCategories = await db.Categories
    .Where(c => c.CafeId == targetCafeId)
    .Include(c => c.Products)
    .ToListAsync();

if (existingCategories.Count > 0)
{
    Console.WriteLine($">>> Eski {existingCategories.Count} kategori ve ürünleri temizleniyor...");
    foreach (var cat in existingCategories)
    {
        db.Products.RemoveRange(cat.Products);
    }
    db.Categories.RemoveRange(existingCategories);
    await db.SaveChangesAsync();
}

// 4. Ensure tags in database
var allExistingTags = await db.Tags.ToListAsync();
var tagMap = allExistingTags.ToDictionary(t => t.Name.ToLowerInvariant(), t => t);

async Task<Tag> GetOrCreateTagAsync(string tagName)
{
    var key = tagName.ToLowerInvariant();
    if (tagMap.TryGetValue(key, out var existing))
    {
        return existing;
    }

    var newTag = new Tag
    {
        Id = Guid.NewGuid(),
        Name = tagName,
        TagType = "Diğer"
    };
    db.Tags.Add(newTag);
    await db.SaveChangesAsync();
    tagMap[key] = newTag;
    return newTag;
}

// 5. Insert new categories and products
int totalProductsAdded = 0;
int totalCategoriesAdded = 0;

foreach (var catDto in menuData)
{
    var category = new Category
    {
        Id = Guid.NewGuid(),
        CafeId = targetCafeId,
        Name = catDto.CategoryName
    };
    db.Categories.Add(category);
    await db.SaveChangesAsync(); // Save to get valid foreign key
    totalCategoriesAdded++;

    foreach (var prodDto in catDto.Products)
    {
        var product = new Product
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            Name = prodDto.Name,
            Description = prodDto.Desc,
            Price = prodDto.Price > 0 ? prodDto.Price : 150,
            IsAvailable = true
        };

        if (prodDto.Tags != null && prodDto.Tags.Count > 0)
        {
            foreach (var tName in prodDto.Tags)
            {
                var tag = await GetOrCreateTagAsync(tName);
                product.Tags.Add(tag);
            }
        }

        db.Products.Add(product);
        totalProductsAdded++;
    }
    await db.SaveChangesAsync();
    Console.WriteLine($"  [+] '{category.Name}' kategorisi eklendi ({catDto.Products.Count} ürün).");
}

Console.WriteLine("==================================================");
Console.WriteLine($">>> BAŞARILI! Toplam {totalCategoriesAdded} kategori ve {totalProductsAdded} ürün Supabase veritabanına aktarıldı.");
Console.WriteLine("==================================================");

public class ScrapedCategoryDto
{
    [JsonPropertyName("categoryName")]
    public string CategoryName { get; set; } = string.Empty;

    [JsonPropertyName("icon")]
    public string Icon { get; set; } = string.Empty;

    [JsonPropertyName("products")]
    public List<ScrapedProductDto> Products { get; set; } = new();
}

public class ScrapedProductDto
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("desc")]
    public string Desc { get; set; } = string.Empty;

    [JsonPropertyName("price")]
    public decimal Price { get; set; }

    [JsonPropertyName("tags")]
    public List<string> Tags { get; set; } = new();
}
