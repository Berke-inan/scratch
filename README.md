# 🍽️ Lounge Box Kitchen • AI Destekli QR Menü & Akıllı Kafe Asistanı

> **Modern Full-Stack Mimari:** Next.js 16 (App Router, Tailwind CSS) • .NET 8 Web API • Supabase (PostgreSQL) • Google Gemini AI (`gemini-3.5-flash-lite`)

Bu proje; masadan QR kod ile açılabilen, müşterilerin doğal dille yemek/içecek arayabildiği ve tavsiye alabildiği yeni nesil bir akıllı kafe & restoran asistanıdır.

---

## 🚀 Ekip Arkadaşları İçin Hızlı Başlangıç (Quick Start)

Projeyi klonladıktan sonra frontend ve backend'i tek tıkla veya tek komutla ayağa kaldırabilirsiniz.

### 1. Ön Koşullar
- [Node.js](https://nodejs.org/) (v18, v20 veya üzeri)
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)

---

### 2. Tek Komutla Kurulum (Setup)

Proje ana dizinindeyken terminalde şu komutu çalıştırın (veya Windows'ta **`setup.bat`** dosyasına çift tıklayın):

```bash
npm run setup
```

Bu komut:
- Backend için `.NET` bağımlılıklarını (`dotnet restore`) yükler.
- Frontend için `npm` bağımlılıklarını kurar.
- Gerekli yerel ayar şablonlarını (`.env.local` ve `appsettings.Development.json`) otomatik oluşturur.

---

### 3. Tek Komutla Başlatma (Start)

Terminalde şu komutu çalıştırın (veya Windows'ta **`start.bat`** dosyasına çift tıklayın):

```bash
npm start
```

🎉 **Hazır!** Bu komut hem .NET 8 Backend'i (`http://localhost:5238`) hem de Next.js Frontend'i (`http://localhost:3000`) aynı anda başlatır ve tüm logları renklendirerek tek bir ekranda gösterir.

---

## 🌐 Erişim Adresleri

| Servis | URL | Açıklama |
| :--- | :--- | :--- |
| **Frontend Arayüzü** | `http://localhost:3000` | Müşteri sohbet ve hibrit menü arayüzü |
| **Masa QR Standları** | `http://localhost:3000/qr` | Masa 1-5 için taranabilir canlı QR kartları |
| **Backend Swagger UI** | `http://localhost:5238/swagger` | REST API dökümantasyonu ve test paneli |
| **Mobil / Aynı Wi-Fi** | `http://<BILGISAYAR-IP>:3000` | Telefonla aynı Wi-Fi ağındayken doğrudan test |

*(Durdurmak istediğinizde terminalde `Ctrl + C` yapmanız yeterlidir; her iki uygulama da güvenle kapatılır.)*

---

## 🔑 Gizli Anahtarlar & Veritabanı Ayarları (Configuration)

Proje hassas anahtarları Git'e göndermemek için **.NET User Secrets** yapısını destekler. Ekip arkadaşlarınız yerel bilgisayarlarında şu komutlarla kendi ortamlarını bağlayabilir:

### A. Veritabanı Bağlantısı (Supabase)
```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=aws-1-eu-central-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.wtrizpvvdjxmhrdzfbat;Password=SIFRE_BURAYA;SSL Mode=Require;Trust Server Certificate=true" --project MenuApp.Api
```

### B. Gemini API Anahtarı (Google AI Studio)
```bash
dotnet user-secrets set "Gemini:ApiKey" "GEMINI_API_KEY_BURAYA" --project MenuApp.Api
dotnet user-secrets set "Gemini:Model" "gemini-3.5-flash-lite" --project MenuApp.Api
```

*(Dilerseniz bu ayarları `MenuApp.Api/appsettings.Development.json` dosyasına da yazabilirsiniz; bu dosya `.gitignore` tarafından korunur.)*

---

## 📱 Telefondan Test Etme (Mobil QR Okutma)

1. Telefonunuzun bilgisayarınızla **aynı Wi-Fi ağına** bağlı olduğundan emin olun.
2. Bilgisayarınızda `http://localhost:3000` sayfasını açın ve üst menüdeki **`QR Masalar`** butonuna tıklayın.
3. Telefon kameranızı ekrandaki QR koda tutun.
4. Menü ve yapay zeka asistanı masanıza özel olarak telefonunuzda açılacaktır.

---

## 📁 Proje Dizin Yapısı

```text
├── MenuApp.slnx                 # .NET Solution dosyası
├── start.bat / start.js         # Tek tıkla / tek komutla full-stack başlatıcı
├── setup.bat / setup.js         # İlk kurulum ve bağımlılık yükleyici
├── package.json                 # Kök npm komutları (npm start, npm run setup vb.)
├── .gitignore                   # Kapsamlı Git filtreleri (bin, obj, node_modules vb.)
│
├── MenuApp.Api/                 # .NET 8 Web API katmanı (Minimal APIs, Rate Limiter, Swagger)
│   ├── Program.cs
│   └── appsettings.Example.json
│
├── MenuApp.Core/                # Domain & İş Mantığı (Entities, DTOs, Interfaces, Validators)
│   ├── Entities/ (Cafe, Category, Product, Tag)
│   └── DTOs/
│
├── MenuApp.Infrastructure/      # Veri Erişimi & Dış Servisler
│   ├── Data/ (ApplicationDbContext - EF Core Npgsql)
│   └── Services/ (GeminiAiService, MenuService)
│
├── menu-app/                    # Next.js 16 Frontend (App Router, Tailwind CSS, Lucide)
│   ├── src/app/ (Sayfalar: /, /qr)
│   ├── src/components/ (chat, menu, toolbar, qr)
│   ├── src/context/ (AppContext - Multi-tenant & Table state)
│   └── next.config.ts (API Proxy rewrites)
│
└── MenuSeeder/                  # Menü tohumlama konsol aracı (15 kategori, 195 ürün)
```

---

## 🌟 Öne Çıkan Özellikler

1. **Mod Değiştirici (Mode Switcher):**
   - **Mod A (Chat-Only):** Saf yapay zeka mesajlaşma deneyimi.
   - **Mod B (Hybrid Menu):** E-ticaret / restoran menüsü ve akıllı ürün filtreleme.
2. **Tema Desteği:**
   - **Modern AI:** Gemini / Claude stili modern prose sohbet balonları, kopyalama ve geri bildirim tuşları.
   - **WhatsApp:** WhatsApp yeşili ve çift tik durum ikonları.
   - **iMessage:** iOS tarzı mavi degradeler.
   - **Samsung One UI:** Geniş başlık ve modern kartlar.
3. **Akıllı Semantik Arama:**
   - *"Bana şekersiz bir kahve öner"* -> Yalnızca şekersiz kahveleri önerir.
   - *"Meksika mutfağından acılı ne var?"* -> Fajita, quesadilla ve nachos önerir.
   - *"Diyet yapıyorum fit neyiniz var?"* -> Kalori etiketli sağlıklı tabakları filtreler.
4. **Multi-Tenant & Masaya Özel Karşılama:**
   - Veritabanındaki tüm kafeler ve Masa 1-5 için dinamik parametreli QR yönlendirmesi.
