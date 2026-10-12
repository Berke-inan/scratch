using MenuApp.Core.Entities;
using MenuApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

Console.WriteLine("==================================================");
Console.WriteLine(">>> Lounge Box Kitchen Standartlaştırılmış Menü Tohumlama Başlatılıyor...");
Console.WriteLine("==================================================");

var connectionString = Environment.GetEnvironmentVariable("DEFAULT_CONNECTION")
    ?? "Host=aws-1-eu-central-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.wtrizpvvdjxmhrdzfbat;Password=YOUR_DATABASE_PASSWORD;SSL Mode=Require;Trust Server Certificate=true";

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
    Console.WriteLine($">>> Mevcut Kafe doğrulandı: {cafe.Name} ({cafe.Id})");
}

// 2. Clear existing categories and products for this cafe
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

// 3. Tag helper
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
        TagType = "Özellik"
    };
    db.Tags.Add(newTag);
    await db.SaveChangesAsync();
    tagMap[key] = newTag;
    return newTag;
}

// 4. Standart Kategori ve Ürün Verileri
var standardizedMenu = new List<(string CategoryName, List<(string Name, string Desc, decimal Price, string[] Tags)> Products)>
{
    // Kategori 1: Sıcak Kahveler
    ("Sıcak Kahveler", new List<(string Name, string Desc, decimal Price, string[] Tags)>
    {
        ("Espresso", "Sıcak servis edilen, taze çekilmiş İtalyan çekirdeklerinden tek shot yoğun ve sert kahve, ilave şekersiz.", 95, new[] { "Sıcak", "Şekersiz", "Vegan", "Glutensiz" }),
        ("Double Espresso", "Sıcak servis edilen, ekstra yoğun ve sert çift shot espresso kahve, ilave şekersiz.", 120, new[] { "Sıcak", "Şekersiz", "Vegan", "Glutensiz" }),
        ("Americano", "Sıcak servis edilen, ilave şekersiz espresso bazlı sıcak su ile seyreltilmiş sert kahve.", 110, new[] { "Sıcak", "Şekersiz", "Vegan", "Glutensiz" }),
        ("Filtre Kahve (Single Origin)", "Sıcak demlenen, dengeli gövdeli ve zengin aromalı taze çekirdek filtre kahve, sade ve şekersiz.", 105, new[] { "Sıcak", "Şekersiz", "Vegan", "Glutensiz" }),
        ("Caffe Latte", "Sıcak servis edilen, bol buharda ısıtılmış kadifemsi süt ve espresso ile hazırlanan yumuşak içimli kahve.", 130, new[] { "Sıcak", "Şekersiz", "Süt Ürünü İçerir", "Glutensiz" }),
        ("Şekerli Karamel Latte", "Sıcak servis edilen, tatlı karamel şurubu ile tatlandırılmış, şekerli ve kremalı espresso latte.", 145, new[] { "Sıcak", "Şekerli", "Süt Ürünü İçerir", "Glutensiz" }),
        ("Şekerli Vanilya Latte", "Sıcak servis edilen, aromatik Madagaskar vanilya şurubu ile hazırlanmış lezzetli şekerli kahve.", 145, new[] { "Sıcak", "Şekerli", "Süt Ürünü İçerir", "Glutensiz" }),
        ("Cappuccino", "Sıcak servis edilen, eşit oranda espresso, sıcak süt ve yoğun süt köpüğü içeren klasik İtalyan kahvesi.", 135, new[] { "Sıcak", "Şekersiz", "Süt Ürünü İçerir", "Glutensiz" }),
        ("Flat White", "Sıcak servis edilen, çift shot ristretto ve mikro köpüklü ince süt katmanlı yoğun kahve lezzeti.", 140, new[] { "Sıcak", "Şekersiz", "Süt Ürünü İçerir", "Glutensiz" }),
        ("Mocha (Belçika Çikolatalı)", "Sıcak servis edilen, eritilmiş gerçek çikolata, espresso ve sıcak sütle hazırlanan zengin şekerli kahve.", 155, new[] { "Sıcak", "Şekerli", "Süt Ürünü İçerir", "Glutensiz" }),
        ("Geleneksel Türk Kahvesi", "Sıcak közde pişirilen, bol köpüklü geleneksel Türk kahvesi. Taze çekilmiş kahve çekirdekleri.", 90, new[] { "Sıcak", "Şekersiz", "Vegan", "Glutensiz" }),
        ("Kafeinsiz Sıcak Filtre Kahve", "Sıcak demlenen, kafeinsiz özel çekirdeklerden hazırlanmış yumuşak ve şekersiz akşam kahvesi.", 115, new[] { "Sıcak", "Şekersiz", "Kafeinsiz", "Vegan", "Glutensiz" }),
        ("Yulaf Sütlü Latte (Laktozsuz)", "Sıcak servis edilen, laktozsuz bitkisel yulaf sütü ve espresso ile hazırlanan vegan sıcak kahve.", 150, new[] { "Sıcak", "Şekersiz", "Laktozsuz", "Vegan", "Glutensiz" })
    }),

    // Kategori 2: Soğuk Kahveler
    ("Soğuk Kahveler", new List<(string Name, string Desc, decimal Price, string[] Tags)>
    {
        ("Iced Americano", "Bol buzlu soğuk su ve çift shot espresso ile hazırlanan, ferahlatıcı sert soğuk kahve, şekersiz.", 125, new[] { "Soğuk", "Şekersiz", "Vegan", "Glutensiz" }),
        ("Iced Latte", "Buzlu soğuk süt ve espresso katmanlarından oluşan, hafif ve ferahlatıcı şekersiz soğuk kahve.", 140, new[] { "Soğuk", "Şekersiz", "Süt Ürünü İçerir", "Glutensiz" }),
        ("Cold Brew Reserve", "24 saat soğuk damıtma tekniği ile demlenmiş, asiditesi düşük, yoğun çikolata notalı şekersiz soğuk kahve.", 150, new[] { "Soğuk", "Şekersiz", "Vegan", "Glutensiz" }),
        ("Şekerli Karamel Frappe", "Buzla harmanlanmış kahve, süt, krema ve karamel sos ile hazırlanan buz gibi tatlı şekerli içecek.", 165, new[] { "Soğuk", "Şekerli", "Süt Ürünü İçerir" }),
        ("Şekerli Çikolatalı Frappe", "Kırılmış buz, espresso, zengin kakao ve krema ile çırpılmış enfes soğuk şekerli kahve tatlısı.", 165, new[] { "Soğuk", "Şekerli", "Süt Ürünü İçerir" }),
        ("Iced Mocha", "Soğuk süt, buz, çikolata sosu ve espresso buluşması. Tatlı ve ferahlatıcı şekerli soğuk kahve.", 160, new[] { "Soğuk", "Şekerli", "Süt Ürünü İçerir", "Glutensiz" }),
        ("Kafeinsiz Iced Latte", "Buzlu soğuk süt ve kafeinsiz espresso ile hazırlanan hafif, akşam tüketimine uygun soğuk kahve.", 145, new[] { "Soğuk", "Şekersiz", "Kafeinsiz", "Süt Ürünü İçerir", "Glutensiz" })
    }),

    // Kategori 3: Soğuk İçecekler (Kola, Gazoz, Su vb. - Asla kahve değildir)
    ("Soğuk İçecekler", new List<(string Name, string Desc, decimal Price, string[] Tags)>
    {
        ("Coca-Cola Orijinal", "Soğuk servis edilen, ferahlatıcı ve klasik şekerli gazlı meşrubat içecek. Asla kahve değildir.", 75, new[] { "Soğuk", "Şekerli", "Gazlı İçecek", "Glutensiz", "Vegan" }),
        ("Coca-Cola Zero Sugar", "Soğuk servis edilen, sıfır şeker ve kalorisiz ferahlatıcı gazlı meşrubat içecek.", 75, new[] { "Soğuk", "Şekersiz", "Gazlı İçecek", "Glutensiz", "Vegan" }),
        ("Fanta Portakal", "Soğuk servis edilen, yoğun portakal aromalı, gazlı ve şekerli ferahlatıcı meyveli içecek.", 75, new[] { "Soğuk", "Şekerli", "Gazlı İçecek", "Glutensiz", "Vegan" }),
        ("Sprite Gazoz", "Soğuk servis edilen, limon ve misket limonu aromalı ferahlatıcı şekerli gazoz.", 75, new[] { "Soğuk", "Şekerli", "Gazlı İçecek", "Glutensiz", "Vegan" }),
        ("Taze Sıkma Portakal Suyu", "Anlık sıkılan taze Akdeniz portakalları. İlave şekersiz, doğal vitamin deposu taze meyve suyu.", 110, new[] { "Soğuk", "Doğal Şeker", "Vegan", "Glutensiz" }),
        ("Doğal Maden Suyu", "Zengin mineralli, soğuk servis edilen, saf ve şekersiz yerli kaynak maden suyu.", 45, new[] { "Soğuk", "Şekersiz", "Vegan", "Glutensiz" }),
        ("Limonlu Maden Suyu", "Doğal maden suyu ve taze limon dilimleri ile hazırlanan ferahlatıcı şekersiz içecek.", 55, new[] { "Soğuk", "Şekersiz", "Vegan", "Glutensiz" }),
        ("Doğal Kaynak Suyu (Cam Şişe 330ml)", "Doğal kaynak suyu, cam şişede soğuk servis edilir.", 35, new[] { "Soğuk", "Şekersiz", "Vegan", "Glutensiz" }),
        ("Ev Yapımı Naneli Limonata", "Taze sıkılmış limon suyu, taze nane yaprakları ve pancar şekeri ile hazırlanan buz gibi geleneksel içecek.", 95, new[] { "Soğuk", "Şekerli", "Vegan", "Glutensiz" }),
        ("Şekersiz Şeftalili Soğuk Çay", "Demleme çay ve şeftali aroması ile hazırlanan, ilave şekersiz ferahlatıcı soğuk içecek.", 85, new[] { "Soğuk", "Şekersiz", "Vegan", "Glutensiz" })
    }),

    // Kategori 4: Tatlılar & Pastacılık
    ("Tatlılar & Pastacılık", new List<(string Name, string Desc, decimal Price, string[] Tags)>
    {
        ("San Sebastian Cheesecake (Belçika Çikolatalı)", "İpeksi dokulu, fırınlanmış Bask usulü cheesecake, sıcak Callebaut Belçika çikolatası eşliğinde.", 195, new[] { "Tatlı", "Şekerli", "Glutensiz", "Süt Ürünü İçerir", "Yumurta İçerir" }),
        ("Havuçlu & Cevizli Tarçınlı Kek", "Taze rendelenmiş havuç, kırık ceviz ve Seylan tarçını ile fırınlanan yumuşacık artizan kek.", 140, new[] { "Tatlı", "Şekerli", "Glüten İçerir", "Yumurta İçerir" }),
        ("Sıcak Çikolatalı Fıstıklı Brownie", "Yoğun bitter çikolata ve Antep fıstıklı sıcak servis edilen sufle kıvamında nemli brownie.", 180, new[] { "Sıcak", "Tatlı", "Şekerli", "Süt Ürünü İçerir", "Glüten İçerir" }),
        ("Glutensiz Vegan Raw Berry Bar", "Hurma, çiğ badem ve orman meyvelerinden hazırlanan, rafine şekersiz ve unsuz sağlıklı tatlı.", 160, new[] { "Tatlı", "Doğal Şeker", "Glutensiz", "Vegan", "Laktozsuz" }),
        ("Fransız Tiramisu (Mascarpone)", "Savoiardi kedidili bisküvileri, taze espresso ve gerçek mascarpone peyniriyle geleneksel İtalyan tatlısı.", 175, new[] { "Tatlı", "Şekerli", "Süt Ürünü İçerir", "Glüten İçerir" }),
        ("Çikolatalı Bademli Kruvasan", "Kat kat çıtır Fransız tereyağlı kruvasan, içinde eritilmiş çikolata ve üstünde kavrulmuş file badem.", 155, new[] { "Tatlı", "Şekerli", "Glüten İçerir", "Süt Ürünü İçerir" })
    }),

    // Kategori 5: Atıştırmalık & Mutfak
    ("Atıştırmalık & Mutfak", new List<(string Name, string Desc, decimal Price, string[] Tags)>
    {
        ("Avokadolu Poşe Yumurtalı Ekşi Maya Tost", "Kızarmış artizan ekşi maya ekmeği üzerine taze ezilmiş avokado, labne ve çiftlik poşe yumurta.", 220, new[] { "Sıcak", "Şekersiz", "Glüten İçerir", "Yumurta İçerir", "Vejetaryen" }),
        ("Füme Hindi & Çedar Peynirli Kruvasan Sandviç", "Tereyağlı çıtır kruvasan arasında fırınlanmış hindi füme, eritilmiş çedar ve hardallı sos.", 210, new[] { "Sıcak", "Şekersiz", "Glüten İçerir", "Süt Ürünü İçerir" }),
        ("Dört Peynirli Gurme Tost", "Kaşar, çedar, mozarella ve parmesan peynirlerinin ekşi mayalı ekmekte ızgara edilmesiyle hazırlanan sıcak tost.", 195, new[] { "Sıcak", "Şekersiz", "Glüten İçerir", "Süt Ürünü İçerir", "Vejetaryen" }),
        ("Falafelli & Humuslu Vegan Wrap", "Lavaş ekmeğine sarılı çıtır nohut falafeller, tahinli humus, sumaklı soğan ve taze yeşillikler.", 205, new[] { "Sıcak", "Şekersiz", "Vegan", "Glüten İçerir" }),
        ("Glutensiz Tavuklu & Avokadolu Bowl", "Kinoa, ızgara tavuk göğsü, avokado, kiraz domates ve limon zeytinyağı soslu sağlıklı öğün kasesi.", 245, new[] { "Şekersiz", "Glutensiz", "Laktozsuz" }),
        ("Çıtır Patates Sepeti (Truffle & Parmesan)", "Özel baharat karışımlı altın sarısı çıtır parmak patatesler, trüf yağı ve rendelenmiş parmesan ile.", 150, new[] { "Sıcak", "Şekersiz", "Vejetaryen", "Süt Ürünü İçerir" })
    })
};

int totalCats = 0;
int totalProds = 0;

foreach (var catInfo in standardizedMenu)
{
    var catEntity = new Category
    {
        Id = Guid.NewGuid(),
        CafeId = targetCafeId,
        Name = catInfo.CategoryName
    };
    db.Categories.Add(catEntity);
    await db.SaveChangesAsync();
    totalCats++;

    foreach (var prodInfo in catInfo.Products)
    {
        var prodEntity = new Product
        {
            Id = Guid.NewGuid(),
            CategoryId = catEntity.Id,
            Name = prodInfo.Name,
            Description = prodInfo.Desc,
            Price = prodInfo.Price,
            IsAvailable = true
        };

        foreach (var tagName in prodInfo.Tags)
        {
            var tagEntity = await GetOrCreateTagAsync(tagName);
            prodEntity.Tags.Add(tagEntity);
        }

        db.Products.Add(prodEntity);
        totalProds++;
    }
    await db.SaveChangesAsync();
    Console.WriteLine($"  [+] '{catEntity.Name}' oluşturuldu ({catInfo.Products.Count} ürün).");
}

Console.WriteLine("==================================================");
Console.WriteLine($">>> BAŞARIYLA TAMAMLANDI: {totalCats} kategori ve {totalProds} standart ürün kaydedildi!");
Console.WriteLine("==================================================");
