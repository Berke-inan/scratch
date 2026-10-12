const { spawn, execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Ensure credentials exist before starting
const devSettingsPath = path.join(__dirname, 'MenuApp.Api', 'appsettings.Development.json');
if (!fs.existsSync(devSettingsPath)) {
  console.clear();
  console.log('\x1b[33m⚠️  İlk çalıştırma tespit edildi: API ve veritabanı ayarları yapılandırılıyor...\x1b[0m\n');
  require('./configure-keys.js');
  return;
}

console.clear();
console.log('\x1b[1m\x1b[33m===============================================================\x1b[0m');
console.log('\x1b[1m\x1b[33m    🍽️  LOUNGE BOX KITCHEN • FULL-STACK GELİŞTİRME ORTAMI    \x1b[0m');
console.log('\x1b[1m\x1b[33m===============================================================\x1b[0m\n');

// Detect Local Wi-Fi IPv4 for mobile testing
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254')) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();

console.log('\x1b[32m🚀 Sistem Başlatılıyor:\x1b[0m');
console.log(`  • \x1b[1mBackend (.NET 8 Web API):\x1b[0m  http://localhost:5238  (Swagger: /swagger)`);
console.log(`  • \x1b[1mFrontend (Next.js):\x1b[0m        http://localhost:3000`);
console.log(`  • \x1b[1mQR Masalar & Stand:\x1b[0m        http://localhost:3000/qr`);
if (localIp !== 'localhost') {
  console.log(`  • \x1b[36m📱 Mobil / Aynı Wi-Fi:\x1b[0m     http://${localIp}:3000  (QR testleri için)`);
}
console.log('\n\x1b[90m(Durdurmak için Ctrl + C tuşlarına basabilirsiniz...)\x1b[0m\n');
console.log('---------------------------------------------------------------');

const isWindows = process.platform === 'win32';

// 1. Start Backend (.NET Web API)
const backend = spawn(
  'dotnet',
  ['run', '--project', 'MenuApp.Api', '--urls', 'http://0.0.0.0:5238'],
  {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
  }
);

backend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach((line) => {
    if (line.trim()) {
      console.log(`\x1b[36m[BACKEND]\x1b[0m ${line}`);
    }
  });
});

backend.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach((line) => {
    if (line.trim()) {
      console.error(`\x1b[31m[BACKEND HATA]\x1b[0m ${line}`);
    }
  });
});

// 2. Start Frontend (Next.js App)
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const frontend = spawn(
  npmCmd,
  ['run', 'dev', '--prefix', 'menu-app', '--', '-p', '3000'],
  {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
  }
);

let browserOpened = false;

frontend.stdout.on('data', (data) => {
  const text = data.toString();
  const lines = text.trim().split('\n');
  lines.forEach((line) => {
    if (line.trim()) {
      console.log(`\x1b[35m[FRONTEND]\x1b[0m ${line}`);
    }
  });

  // Automatically open browser once Next.js is ready
  if (!browserOpened && (text.includes('Ready in') || text.includes('Local:'))) {
    browserOpened = true;
    setTimeout(() => {
      try {
        if (isWindows) {
          spawn('cmd.exe', ['/c', 'start', 'http://localhost:3000'], { stdio: 'ignore' });
        } else if (process.platform === 'darwin') {
          spawn('open', ['http://localhost:3000'], { stdio: 'ignore' });
        } else {
          spawn('xdg-open', ['http://localhost:3000'], { stdio: 'ignore' });
        }
      } catch (e) {}
    }, 1000);
  }
});

frontend.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach((line) => {
    if (line.trim()) {
      console.error(`\x1b[33m[FRONTEND]\x1b[0m ${line}`);
    }
  });
});

// Graceful cleanup on termination
function cleanup() {
  console.log('\n\x1b[33mUygulamalar kapatılıyor...\x1b[0m');
  try {
    if (isWindows) {
      if (backend.pid) spawn('taskkill', ['/pid', backend.pid.toString(), '/f', '/t']);
      if (frontend.pid) spawn('taskkill', ['/pid', frontend.pid.toString(), '/f', '/t']);
    } else {
      backend.kill('SIGTERM');
      frontend.kill('SIGTERM');
    }
  } catch (e) {
    // Ignore cleanup errors
  }
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
