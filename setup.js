const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.clear();
console.log('===============================================================');
console.log('   🛠️  LOUNGE BOX KITCHEN • İLK KURULUM & BAĞIMLILIKLAR        ');
console.log('===============================================================\n');

function run(cmd, desc) {
  console.log(`\x1b[36m>>> ${desc}...\x1b[0m`);
  try {
    execSync(cmd, { stdio: 'inherit', shell: true });
    console.log(`\x1b[32m✓ ${desc} tamamlandı.\x1b[0m\n`);
  } catch (err) {
    console.error(`\x1b[31m✗ ${desc} başarısız oldu:\x1b[0m`, err.message);
    process.exit(1);
  }
}

// 1. .NET Dependencies
run('dotnet restore', '.NET paketleri geri yükleniyor (Backend)');

// 2. Node Dependencies
run('npm install --prefix menu-app', 'Node paketleri kuruluyor (Frontend)');

// 3. Ensure Backend appsettings.Development.json
const appsettingsDev = path.join(__dirname, 'MenuApp.Api', 'appsettings.Development.json');
const appsettingsExample = path.join(__dirname, 'MenuApp.Api', 'appsettings.Example.json');

if (fs.existsSync(appsettingsExample)) {
  if (!fs.existsSync(appsettingsDev)) {
    fs.copyFileSync(appsettingsExample, appsettingsDev);
    console.log('\x1b[32m✓ MenuApp.Api/appsettings.Development.json oluşturuldu.\x1b[0m\n');
  }
}

// 4. Ensure frontend .env.local
const envPath = path.join(__dirname, 'menu-app', '.env.local');
const envExamplePath = path.join(__dirname, 'menu-app', '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('\x1b[32m✓ menu-app/.env.local oluşturuldu.\x1b[0m\n');
}

console.log('===============================================================');
console.log('\x1b[32m🎉 TEBRİKLER! Kurulum başarıyla tamamlandı.\x1b[0m');
console.log('Şimdi projeyi tek komutla başlatmak için:');
console.log('  👉 \x1b[1m\x1b[33mnpm start\x1b[0m  veya  \x1b[1m\x1b[33mstart.bat\x1b[0m');
console.log('===============================================================\n');
