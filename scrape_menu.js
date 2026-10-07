const https = require('https');
const fs = require('fs');

const categories = [
  { slug: 'kahvaltilar.html', name: 'Kahvaltılıklar', icon: '🍳', defaultPrice: 220 },
  { slug: 'baslangiclar.html', name: 'Başlangıçlar & Atıştırmalıklar', icon: '🍟', defaultPrice: 195 },
  { slug: 'burgerler-sandvicler.html', name: 'Burger & Sandviç', icon: '🍔', defaultPrice: 280 },
  { slug: 'pizzalar.html', name: 'Taş Fırın Pizza', icon: '🍕', defaultPrice: 290 },
  { slug: 'makarnalar.html', name: 'Makarnalar & Noodle', icon: '🍝', defaultPrice: 240 },
  { slug: 'etler.html', name: 'Et Yemekleri & Izgaralar', icon: '🥩', defaultPrice: 420 },
  { slug: 'tavuklar.html', name: 'Tavuk Spesiyalleri', icon: '🍗', defaultPrice: 270 },
  { slug: 'deniz-urunleri.html', name: 'Deniz Mahsulleri', icon: '🦐', defaultPrice: 380 },
  { slug: 'mexican-mutfagi.html', name: 'Meksika Mutfağı', icon: '🌮', defaultPrice: 310 },
  { slug: 'uzakdogu-mutfagi.html', name: 'Uzak Doğu Mutfağı', icon: '🥡', defaultPrice: 320 },
  { slug: 'salatalar.html', name: 'Gurme Salatalar', icon: '🥗', defaultPrice: 210 },
  { slug: 'fitlestiren-yemekler.html', name: 'Fit & Sağlıklı Tabaklar', icon: '🥑', defaultPrice: 240 },
  { slug: 'cocuk-menusu.html', name: 'Çocuk Menüsü', icon: '🧒', defaultPrice: 180 },
  { slug: 'tatlilar.html', name: 'Tatlılar & Pastalar', icon: '🍰', defaultPrice: 175 },
  { slug: 'soguk-sicak-icecekler.html', name: 'Sıcak & Soğuk İçecekler', icon: '🥤', defaultPrice: 85 }
];

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/-->/g, '')
    .replace(/<!--/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Rename brand references to protect against copyright / github issues
function sanitizeBrand(str) {
  if (!str) return '';
  return str
    .replace(/Lunch Box/gi, 'Lounge Box')
    .replace(/Lunchbox/gi, 'Lounge Box')
    .replace(/Lunch Burger/gi, 'Lounge Burger')
    .replace(/Lunch /gi, 'Lounge ');
}

function parseProducts(html, category) {
  const items = [];

  // Special handling for drinks page (soguk-sicak-icecekler.html)
  if (category.slug.includes('icecek')) {
    const pRegex = /<p><font[^>]*>([\s\S]*?)<\/font><\/p>/gi;
    let pMatch;
    while ((pMatch = pRegex.exec(html)) !== null) {
      const line = cleanText(pMatch[1]).replace(/&nbsp;/g, ' ').replace(/-/g, '').trim();
      if (line && line.length > 2 && !line.includes('Soğuk İçecek') && !line.includes('Sıcak İçecek')) {
        let price = category.defaultPrice;
        let tags = [];
        const lower = line.toLowerCase();
        if (lower.includes('kahve') || lower.includes('latte') || lower.includes('espresso') || lower.includes('americano')) tags.push('Kahve');
        if (lower.includes('çay') || lower.includes('ıhlamur') || lower.includes('adaçayı')) tags.push('Sıcak Çay');
        if (lower.includes('şekersiz') || lower.includes('sade') || lower.includes('filtre') || lower.includes('americano') || lower.includes('espresso')) tags.push('Şekersiz');
        if (lower.includes('taze') || lower.includes('meyve')) tags.push('Doğal Meyve');
        if (lower.includes('frozen') || lower.includes('milkshake') || lower.includes('buz')) tags.push('Soğuk İçecek');

        items.push({
          name: sanitizeBrand(line),
          desc: `${line} - Taze hazırlanmış premium içecek servisi.`,
          price,
          tags
        });
      }
    }
    return items;
  }

  // Special handling for steaks (etler.html is empty on source website, enrich with authentic bistro meat dishes)
  if (category.slug.includes('etler')) {
    return [
      {
        name: 'Dana Antrikot Izgara',
        desc: 'Kekikli tereyağı, fırınlanmış taze patates, köz biber ve domates eşliğinde 240g ızgara antrikot.',
        price: 480,
        tags: ['Izgara', 'Glütensiz']
      },
      {
        name: 'Lokum Bonfile Dilimleri',
        desc: 'Karamelize soğan yatağında, trüf yağlı patates püresi ve sote mevsim sebzeleri ile.',
        price: 520,
        tags: ['Şefin Tavsiyesi', 'Glütensiz']
      },
      {
        name: 'Kuzu Pirzola Izgara',
        desc: 'Biberiye ve kekik marineli 3 adet kuzu pirzola, firik bulgur pilavı ve sumaklı soğan ile.',
        price: 490,
        tags: ['Izgara', 'Geleneksel']
      },
      {
        name: 'Geleneksel Izgara Kasap Köfte',
        desc: 'Özel baharatlarla yoğrulmuş kasap köfte, patates kızartması, közlenmiş biber ve piyaz ile.',
        price: 340,
        tags: ['Geleneksel', 'Çok Satan']
      },
      {
        name: 'Beğendili Dana Külbastı',
        desc: 'Köz patlıcanlı ılık beğendi yatağında ince dövülmüş dana külbastı dilimleri.',
        price: 460,
        tags: ['Geleneksel', 'Süt Ürünü İçerir']
      },
      {
        name: 'Çökertme Kebabı',
        desc: 'Kıtır kibrit patates üzerinde marine dana bonfile şeritleri, süzme sarımsaklı yoğurt ve kızgın tereyağlı domates sos.',
        price: 450,
        tags: ['Çok Satan', 'Geleneksel']
      },
      {
        name: 'Tane Karabiber Soslu Bonfile (Pepper Steak)',
        desc: 'Fransız usulü tane yeşil ve siyah karabiber krema soslu bonfile madalyonları, patates püresi ile.',
        price: 510,
        tags: ['Şefin Tavsiyesi']
      },
      {
        name: 'Karışık Izgara Tabağı',
        desc: 'Kasap köfte, kuzu pirzola, marine tavuk pirzola ve ızgara sucuk, pilav ve köz sebzeler eşliğinde zengin tabak.',
        price: 560,
        tags: ['Doyurucu', 'Izgara']
      }
    ];
  }

  // Match products_sh containing h3 and p
  const blockRegex = /<div class="products_sh">([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = blockRegex.exec(html)) !== null) {
    const block = match[1];
    const h3Match = block.match(/<h3>([\s\S]*?)<\/h3>/i);
    const pMatch = block.match(/<p>([\s\S]*?)<\/p>/i);
    const priceMatch = block.match(/<span>(\d+[\d,.]*)\s*₺?<\/span>/i);

    if (h3Match) {
      let name = sanitizeBrand(cleanText(h3Match[1]));
      let desc = sanitizeBrand(cleanText(pMatch ? pMatch[1] : ''));
      let price = category.defaultPrice;

      if (priceMatch) {
        const parsedP = parseFloat(priceMatch[1].replace(',', '.'));
        if (!isNaN(parsedP) && parsedP > 0) {
          price = Math.round((parsedP * 7.5) / 10) * 10;
        }
      }
      if (name.toLowerCase().includes('serpme')) price = 540;
      if (price < 140 && category.defaultPrice >= 200) price = category.defaultPrice;

      // Generate tags based on description
      const tags = [];
      const lower = (name + ' ' + desc).toLowerCase();
      if (lower.includes('vejetaryen') || lower.includes('sebze') || (lower.includes('mantar') && !lower.includes('et') && !lower.includes('tavuk'))) tags.push('Vejetaryen');
      if (lower.includes('acı') || lower.includes('jalapeno') || lower.includes('chili')) tags.push('Acılı');
      if (lower.includes('peynir') || lower.includes('cheddar') || lower.includes('parmesan') || lower.includes('mozzarella')) tags.push('Süt Ürünü İçerir');
      if (lower.includes('ekmek') || lower.includes('burger') || lower.includes('makarna') || lower.includes('pizza') || lower.includes('un')) tags.push('Glüten İçerir');
      if (lower.includes('avokado') || lower.includes('fit') || lower.includes('kinoa') || lower.includes('haşlama') || lower.includes('salata')) tags.push('Sağlıklı Seçim');
      if (lower.includes('şekersiz')) tags.push('Şekersiz');

      if (name.length > 1) {
        items.push({
          name,
          desc,
          price,
          tags
        });
      }
    }
  }
  return items;
}

async function run() {
  const result = [];
  let totalItems = 0;

  for (const cat of categories) {
    try {
      console.log(`Fetching ${cat.slug}...`);
      const html = await fetchPage('https://www.lunchbox.com.tr/' + cat.slug);
      const products = parseProducts(html, cat);
      console.log(`  -> ${cat.name}: ${products.length} ürün`);
      totalItems += products.length;
      result.push({
        categoryName: cat.name,
        icon: cat.icon,
        products
      });
    } catch (err) {
      console.error(`Error fetching ${cat.slug}:`, err.message);
    }
  }

  console.log(`\nToplam kategori: ${result.length}, Toplam ürün: ${totalItems}`);
  fs.writeFileSync('scraped_menu.json', JSON.stringify(result, null, 2), 'utf-8');
  console.log('Saved to scraped_menu.json');
}

run();
