/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'assets', 'images', 'products');
const MAPPING_FILE = path.join(ROOT, 'src', 'data', 'productImageSources.ts');
const MANIFEST_FILE = path.join(OUTPUT_DIR, 'manifest.json');

const PRODUCTS = [
  {
    id: 'ridomil-gold-mz',
    query: 'Syngenta Ridomil Gold MZ 68 WG packet',
  },
  {
    id: 'amistar-top-325',
    query: 'Syngenta Amistar Top 325 SC bottle',
  },
  {
    id: 'indofil-m45',
    query: 'Indofil M-45 Mancozeb 75 WP packet',
  },
  {
    id: 'tilt-250-ec',
    query: 'Syngenta Tilt 250 EC fungicide bottle',
  },
  {
    id: 'confidor-200-sl',
    query: 'Bayer Confidor 200 SL insecticide bottle',
  },
  {
    id: 'iffco-npk-19-19-19',
    query: 'IFFCO NPK 19 19 19 water soluble fertilizer packet',
  },
  {
    id: 'gromor-npk-10-26-26',
    query: 'Coromandel Gromor NPK 10 26 26 fertilizer bag',
    imageUrl:
      'https://5.imimg.com/data5/ANDROID/Default/2022/12/AM/FS/TF/153510408/product-jpeg-1000x1000.jpg',
    pageUrl:
      'https://www.indiamart.com/proddetail/npk-10-26-26-2849013646955.html',
  },
  {
    id: 'blitox-50-wp',
    query: 'Tata Blitox 50 WP copper oxychloride packet',
    imageUrl:
      'https://5.imimg.com/data5/SELLER/Default/2021/1/YA/OZ/XS/17540945/tata-blitox-copper-oxychloride-50-wp-fungicide-1000x1000.jpg',
    pageUrl:
      'https://www.indiamart.com/proddetail/tata-blitox-copper-oxychloride-50-wp-fungicide-23069324988.html',
  },
  {
    id: 'bayer-nativo-75-wg',
    query: 'Bayer Nativo fungicide bottle',
  },
  {
    id: 'upl-saaf',
    query: 'UPL Saaf fungicide packet',
  },
  {
    id: 'hindustan-streptocycline',
    query: 'Streptocycline bacterial plant packet',
  },
  {
    id: 'fmc-coragen',
    query: 'FMC Coragen insecticide bottle',
  },
  {
    id: 'syngenta-actara',
    query: 'Syngenta Actara insecticide packet',
  },
  {
    id: 'bayer-solomon',
    query: 'Bayer Solomon insecticide bottle',
  },
  {
    id: 'dhanuka-em-1',
    query: 'Dhanuka EM 1 insecticide',
    imageUrl:
      'https://5.imimg.com/data5/SELLER/Default/2025/4/505784328/PR/QJ/YR/84891431/dhanuka-em-1-insecticide-1000x1000.jpg',
    pageUrl:
      'https://www.indiamart.com/proddetail/dhanuka-em-1-insecticide-23695914833.html',
  },
  {
    id: 'syngenta-pegasus',
    query: 'Syngenta Pegasus insecticide',
  },
  {
    id: 'iffco-nano-urea',
    query: 'IFFCO Nano Urea liquid bottle',
  },
  {
    id: 'iffco-nano-dap',
    query: 'IFFCO Nano DAP liquid bottle',
  },
  {
    id: 'mahadhan-mkp-00-52-34',
    query: 'Mahadhan 00 52 34 fertilizer packet',
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0722/2059/files/mahadhan-mkp-005234-imp-fertilizer-file-21349.jpg?v=1747136420',
    pageUrl:
      'https://www.bighaat.com/products/mahadhan-mkp-00-52-34-imp-fertilizer',
  },
  {
    id: 'yara-liva-tropicote',
    query: 'YaraLiva Tropicote Calcium Nitrate bag',
  },
  {
    id: 'katyayani-neem-oil',
    query: 'Katyayani Neem Oil 1500 ppm bottle',
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0722/2059/files/katyayani-dr-neem-1500-neem-oil-insecticide-file-17288.png?v=1737480154&width=3840',
    pageUrl:
      'https://www.bighaat.com/products/katyayani-dr-neem-1500-neem-oil-insecticide',
  },
  {
    id: 't-stanes-bioderma-viride',
    query: 'T. Stanes BioCure-F Trichoderma viride packet',
    imageUrl:
      'https://www.tstanes.com/assets/images/products/international/disease-management/bio_cure_f.webp',
    pageUrl:
      'https://www.tstanes.com/international-crop-care/disease-management/bio-cure-f',
  },
  {
    id: 'iffco-sagarika',
    query: 'IFFCO Sagarika seaweed liquid bottle',
    imageUrl:
      'https://www.indohobby.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/i/f/iffco_sagarica.jpg',
    pageUrl: 'https://www.indohobby.com/iffco-sagarica.html',
  },
  {
    id: 'aries-agromin-max',
    query: 'Aries Agromin Max micronutrient packet',
  },
  {
    id: 'arka-rakshak-tomato-seeds',
    query: 'Arka Rakshak tomato hybrid seed packet',
    imageUrl:
      'https://5.imimg.com/data5/HP/BT/GP/SELLER-1486667/arka-rakshak-tomato-seed-1000x1000.jpg',
    pageUrl: 'https://dir.indiamart.com/impcat/tomato-seeds.html',
  },
  {
    id: 'nhrdf-bhima-super-onion-seeds',
    query: 'Bhima Super onion seed packet',
    imageUrl:
      'https://5.imimg.com/data5/SELLER/Default/2021/12/VV/OP/HY/128901760/bhima-super-onion-seed-1000x1000.jpg',
    pageUrl:
      'https://www.indiamart.com/proddetail/bhima-super-onion-seed-24369593530.html',
  },
];

const TRUSTED_HOSTS = [
  'amazon.',
  'flipkart.',
  'indiamart.',
  'bigbasket.',
  'bighaat.',
  'agrostar.',
  'agriplex.',
  'kisan.',
  'dehaat.',
  'plantix.',
  'syngenta.',
  'bayer.',
  'iffco.',
  'coromandel.',
  'upl-ltd.',
  'dhanuka.',
  'katyayani.',
  'nexles.',
  'shopee.',
  'lazada.',
  'desertcart.',
  'agriapp.',
  'krishibazaar.',
  'farmagro.',
  'agrimart.',
  'agriculture.',
  'agrosyn.',
  'agroworld.',
  'agro.',
];

const BAD_HOSTS = [
  'facebook.',
  'lookaside.fbsbx.',
  'instagram.',
  'pinterest.',
  'youtube.',
  'ytimg.',
  'tiktok.',
  'twitter.',
  'x.com',
  'wikipedia.',
  'wikimedia.',
  'clipart',
  'freepik.',
  'shutterstock.',
  'istockphoto.',
  'dreamstime.',
  'alamy.',
  'vecteezy.',
];

const BAD_TITLE_WORDS =
  /\b(logo|icon|clipart|clip art|vector|drawing|illustration|diagram|chart|screenshot|cartoon|sticker|banner|poster|advertisement|advert)\b/i;

const GENERIC_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'liquid',
  'bottle',
  'packet',
  'pack',
  'bag',
  'pouch',
  'container',
  'water',
  'soluble',
  'fertilizer',
  'fertiliser',
  'fungicide',
  'insecticide',
  'bacterial',
  'plant',
  'bio',
  'hybrid',
  'seed',
  'seeds',
  'calcium',
  'nitrate',
  'potassium',
  'micronutrient',
  'seaweed',
  'copper',
  'oxychloride',
  'onion',
  'tomato',
  'ppm',
]);

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function decodeHtml(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function scoreCandidate(entry, query) {
  const title = `${entry.t || ''} ${entry.desc || ''}`;
  const normalizedTitle = normalize(title);
  const tokens = normalize(query)
    .split(' ')
    .filter((token) => token.length > 1 && !GENERIC_WORDS.has(token));
  const matches = tokens.filter((token) => normalizedTitle.includes(token)).length;
  const purlHost = hostOf(entry.purl || '');
  const mediaHost = hostOf(entry.murl || '');
  const combinedHost = `${purlHost} ${mediaHost}`;
  let score = matches * 4;

  if (TRUSTED_HOSTS.some((host) => combinedHost.includes(host))) score += 14;
  if (BAD_HOSTS.some((host) => combinedHost.includes(host))) score -= 30;
  if (BAD_TITLE_WORDS.test(title)) score -= 24;
  if (/\b(bottle|packet|pack|bag|pouch|container|can|jar)\b/i.test(title)) score += 3;
  if (/\.(jpe?g|png|webp)(\?|$)/i.test(entry.murl || '')) score += 2;
  if (entry.murl && entry.murl.startsWith('https://')) score += 1;

  const width = Number(entry.expw) || 0;
  const height = Number(entry.exph) || 0;
  if (width >= 500 && height >= 500) score += 3;
  if (width >= 900 && height >= 900) score += 2;
  if (width > 0 && height > 0 && (width / height > 3 || height / width > 3)) score -= 6;

  return score;
}

function parseBingEntries(html) {
  const entries = [];
  const pattern = /<a[^>]*class="iusc"[^>]*\bm="([^"]+)"/g;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    try {
      const entry = JSON.parse(decodeHtml(match[1]));
      if (entry.murl || entry.turl) entries.push(entry);
    } catch {
      // Ignore malformed result payloads.
    }
  }

  return entries;
}

async function searchBing(query) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1&tsc=ImageHoverTitle`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`Bing search failed with HTTP ${response.status}`);
  }

  const html = await response.text();
  return parseBingEntries(html);
}

async function downloadImage(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
    redirect: 'follow',
  });

  if (!response.ok) return null;
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (!contentType.startsWith('image/')) return null;

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 12 * 1024) return null;

  return buffer;
}

function makeWsrvUrl(sourceUrl) {
  return `https://wsrv.nl/?url=${encodeURIComponent(sourceUrl)}&w=900&h=900&fit=inside&output=jpg&bg=white&q=90`;
}

async function fetchJpeg(sourceUrl) {
  const candidates = [makeWsrvUrl(sourceUrl), sourceUrl];

  for (const url of candidates) {
    try {
      const buffer = await downloadImage(url);
      if (!buffer) continue;
      if (buffer[0] !== 0xff || buffer[1] !== 0xd8) continue;

      const decoded = jpeg.decode(buffer, { useTArray: true });
      if (decoded.width < 250 || decoded.height < 250) continue;
      if (decoded.width * decoded.height < 90000) continue;
      const ratio = decoded.width / decoded.height;
      if (ratio < 0.3 || ratio > 3.5) continue;

      return { buffer, width: decoded.width, height: decoded.height };
    } catch {
      // Try the next source.
    }
  }

  return null;
}

async function fetchProductImage(product, index) {
  console.log(`\n[${index + 1}/${PRODUCTS.length}] ${product.query}`);

  let ranked;
  if (product.imageUrl) {
    console.log('  using verified image override');
    ranked = [
      {
        entry: {
          murl: product.imageUrl,
          purl: product.pageUrl || '',
          t: product.query,
        },
        score: 100,
      },
    ];
  } else {
    const entries = await searchBing(product.query);
    console.log(`  found ${entries.length} image results`);
    ranked = entries
      .map((entry) => ({ entry, score: scoreCandidate(entry, product.query) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 18);
  }

  for (const { entry, score } of ranked) {
    const sourceUrl = entry.murl || entry.turl;
    if (!sourceUrl) continue;

    const sourceLabel = hostOf(entry.purl || sourceUrl) || hostOf(sourceUrl);
    try {
      const image = await fetchJpeg(sourceUrl);
      if (!image) continue;

      const outputPath = path.join(OUTPUT_DIR, `${product.id}.jpg`);
      fs.writeFileSync(outputPath, image.buffer);

      console.log(
        `  saved ${product.id}.jpg (${image.width}x${image.height}, score ${score}) from ${sourceLabel}`
      );

      return {
        id: product.id,
        query: product.query,
        file: `assets/images/products/${product.id}.jpg`,
        width: image.width,
        height: image.height,
        sourcePage: entry.purl || '',
        sourceImage: sourceUrl,
      };
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

function writeImageMapping(manifest) {
  const lines = [
    "import type { ImageSourcePropType } from 'react-native';",
    '',
    'export const PRODUCT_IMAGE_SOURCES: Record<string, ImageSourcePropType> = {',
  ];

  for (const item of manifest.products) {
    lines.push(
      `  '${item.id}': require('../../assets/images/products/${item.id}.jpg'),`
    );
  }

  lines.push('};', '');
  fs.writeFileSync(MAPPING_FILE, lines.join('\n'), 'utf8');
  console.log(`\nWrote ${path.relative(ROOT, MAPPING_FILE)}`);
}

async function main() {
  const onlyArg = process.argv.find((arg) => arg.startsWith('--only='));
  const onlyId = onlyArg ? onlyArg.slice('--only='.length) : null;
  const products = onlyId
    ? PRODUCTS.filter((product) => product.id === onlyId)
    : PRODUCTS;

  if (products.length === 0) {
    throw new Error(`Unknown product id: ${onlyId}`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let previousManifest = { products: [] };
  if (fs.existsSync(MANIFEST_FILE)) {
    try {
      previousManifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
    } catch {
      previousManifest = { products: [] };
    }
  }

  const results = [];
  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];
    let result = null;

    for (let attempt = 0; attempt < 2 && !result; attempt += 1) {
      try {
        result = await fetchProductImage(product, index);
      } catch (error) {
        console.log(`  search error: ${error.message}`);
      }
      if (!result) await sleep(1000 * (attempt + 1));
    }

    if (result) {
      results.push(result);
    } else {
      console.error(`  FAILED to fetch a valid photo for ${product.id}`);
    }

    await sleep(400);
  }

  const previousById = new Map(
    (previousManifest.products || []).map((item) => [item.id, item])
  );
  for (const result of results) previousById.set(result.id, result);

  const manifest = {
    generatedAt: new Date().toISOString(),
    products: PRODUCTS.map((product) => previousById.get(product.id)).filter(
      Boolean
    ),
  };

  fs.writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  writeImageMapping(manifest);

  const missing = PRODUCTS.filter(
    (product) => !fs.existsSync(path.join(OUTPUT_DIR, `${product.id}.jpg`))
  );

  console.log(`\nDownloaded ${manifest.products.length}/${PRODUCTS.length} product photos.`);
  if (missing.length > 0) {
    console.error(`Missing: ${missing.map((product) => product.id).join(', ')}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
