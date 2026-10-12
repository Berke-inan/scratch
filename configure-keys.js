const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.clear();
console.log('\x1b[1m\x1b[33m===============================================================\x1b[0m');
console.log('\x1b[1m\x1b[33m    🔑  LOUNGE BOX KITCHEN • HIZLI AYAR VE ANAHTAR SİHİRBAZI   \x1b[0m');
console.log('\x1b[1m\x1b[33m===============================================================\x1b[0m');
console.log('Bu sihirbaz, ekip arkadaşlarınızın backend ve veritabanı ayarlarını');
console.log('tek adımda zahmetsizce tamamlamasını sağlar.\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  const defaultGeminiModel = 'gemini-3.5-flash-lite';

  // 1. Gemini API Key
  console.log('\x1b[36m[1/2] Google Gemini API Anahtarı:\x1b[0m');
  console.log('\x1b[90m(Google AI Studio üzerinden aldığınız API anahtarını buraya yapıştırın)\x1b[0m');
  const envApiKey = process.env.GEMINI_API_KEY || '';
  let apiKeyPrompt = envApiKey ? `👉 Gemini API Key [Mevcut: ${envApiKey.substring(0, 6)}... Enter ile geç]: ` : '👉 Gemini API Key: ';
  let apiKey = await ask(apiKeyPrompt);
  apiKey = apiKey.trim() || envApiKey;

  if (!apiKey) {
    console.log('\x1b[33m⚠️  API anahtarı girilmedi. Yer tutucu (YOUR_GEMINI_API_KEY_HERE) atanacak.\x1b[0m');
    console.log('\x1b[90mNot: AI asistan özelliklerini kullanmak için geçerli bir anahtar sağlamanız gerekir.\x1b[0m');
    apiKey = 'YOUR_GEMINI_API_KEY_HERE';
  }

  // 2. Database Password
  console.log('\n\x1b[36m[2/2] Supabase Veritabanı Şifresi:\x1b[0m');
  console.log('\x1b[90m(Supabase veritabanı erişim şifresi. Boş bırakılırsa yer tutucu kullanılır)\x1b[0m');
  const envDbPassword = process.env.DB_PASSWORD || '';
  let dbPassword = await ask('👉 DB Şifresi: ');
  dbPassword = dbPassword.trim() || envDbPassword || 'YOUR_DATABASE_PASSWORD';

  const connectionString = `Host=aws-1-eu-central-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.wtrizpvvdjxmhrdzfbat;Password=${dbPassword};SSL Mode=Require;Trust Server Certificate=true`;

  // 3. Write MenuApp.Api/appsettings.Development.json
  const devSettings = {
    Logging: {
      LogLevel: {
        Default: 'Information',
        'Microsoft.AspNetCore': 'Warning',
      },
    },
    AllowedHosts: '*',
    ConnectionStrings: {
      DefaultConnection: connectionString,
    },
    Gemini: {
      ApiKey: apiKey,
      Model: defaultGeminiModel,
    },
  };

  const devSettingsPath = path.join(__dirname, 'MenuApp.Api', 'appsettings.Development.json');
  fs.writeFileSync(devSettingsPath, JSON.stringify(devSettings, null, 2), 'utf-8');
  console.log('\n\x1b[32m✓ MenuApp.Api/appsettings.Development.json başarıyla oluşturuldu/güncellendi.\x1b[0m');

  // 4. Try saving to dotnet user-secrets
  try {
    execSync(`dotnet user-secrets set "ConnectionStrings:DefaultConnection" "${connectionString}" --project MenuApp.Api`, { stdio: 'ignore' });
    execSync(`dotnet user-secrets set "Gemini:ApiKey" "${apiKey}" --project MenuApp.Api`, { stdio: 'ignore' });
    execSync(`dotnet user-secrets set "Gemini:Model" "${defaultGeminiModel}" --project MenuApp.Api`, { stdio: 'ignore' });
    console.log('\x1b[32m✓ .NET User Secrets yerel kasasına kaydedildi.\x1b[0m');
  } catch (err) {
    // If dotnet user-secrets fails, appsettings.Development.json is already there!
  }

  // 5. Ensure frontend .env.local
  const envLocalPath = path.join(__dirname, 'menu-app', '.env.local');
  if (!fs.existsSync(envLocalPath)) {
    fs.writeFileSync(envLocalPath, 'NEXT_PUBLIC_API_URL=http://localhost:5238\n', 'utf-8');
    console.log('\x1b[32m✓ menu-app/.env.local oluşturuldu.\x1b[0m');
  }

  console.log('\n===============================================================');
  console.log('\x1b[32m🎉 HARİKA! Tüm ayarlar tamamlandı.\x1b[0m');
  console.log('Şimdi projeyi tek adımda başlatabilirsiniz:');
  console.log('  👉 \x1b[1m\x1b[33mstart.bat\x1b[0m  veya  \x1b[1m\x1b[33mnpm start\x1b[0m');
  console.log('===============================================================\n');

  rl.close();
}

main();
