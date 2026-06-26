/**
 * scripts/generate-share-pages.js — Heleno Alves
 *
 * Gera uma página HTML estática por imóvel em /compartilhar/<slug>/index.html
 * com meta tags Open Graph/Twitter completas, para que o WhatsApp (e outras
 * redes) consigam montar o preview do link ao compartilhar um imóvel.
 *
 * Por que isso existe: o site é 100% estático (sem servidor Node em produção,
 * sem Netlify Functions — vai rodar tanto na Netlify quanto depois na Hetzner).
 * O WhatsApp lê as meta tags do HTML retornado na primeira requisição da URL
 * compartilhada; como a página de detalhe real (`imoveis/detalhe.html`) monta
 * o conteúdo via JavaScript depois do carregamento, o WhatsApp nunca veria as
 * informações certas. Por isso geramos, de antemão, uma página "burra" e
 * estática por imóvel, só com as meta tags corretas + um redirect imediato
 * para a página de detalhe real.
 *
 * Uso:
 *   node scripts/generate-share-pages.js
 *
 * Variável de ambiente opcional:
 *   SITE_BASE_URL  (padrão: https://helenoalves.com.br)
 *
 * IMPORTANTE: a lógica de fetch/paginação/normalização replica EXATAMENTE
 * o contrato atual de assets/js/api.js (contrato em inglês: event_name,
 * page, limit, offset, filters). Se aquele arquivo mudar de contrato outra
 * vez, este script precisa ser atualizado também.
 */

const fs   = require('fs');
const path = require('path');

const WEBHOOK_URL = 'https://webhook.wiseuptech.com.br/webhook/apipaginationha';
const TENANT_ID   = '1911202511';
const PAGE_SIZE   = 20;
const SITE_BASE_URL = (process.env.SITE_BASE_URL || 'https://helenoalves.com.br').replace(/\/$/, '');

const OUTPUT_DIR = path.join(__dirname, '..', 'compartilhar');

/* ─── Slugify — idêntico ao usado em assets/js/api.js e imoveis.js ──── */
function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/* ─── Escape simples para inserir texto dentro de atributos/HTML ────── */
function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ─── Fetch de 1 página — mesmo contrato do api.js ──────────────────── */
async function fetchPage(page) {
  const offset = (page - 1) * PAGE_SIZE;

  const payload = {
    event_name: 'get_client_property',
    tenant_id:  TENANT_ID,
    page,
    limit:      PAGE_SIZE,
    offset,
    filters: {
      min_price: 0,
      max_price: 999999999,
    },
  };

  const res = await fetch(WEBHOOK_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Webhook retornou ${res.status} na página ${page}`);
  }

  const data    = await res.json();
  const wrapper = Array.isArray(data) ? data[0] : data;

  return {
    total: wrapper.propertyAmount || 0,
    list:  wrapper.listProperty   || [],
  };
}

/* ─── Fetch de todas as páginas ──────────────────────────────────────── */
async function fetchAllProperties() {
  console.log('Buscando imóveis no webhook...');

  const first = await fetchPage(1);
  let all = [...first.list];
  const total = first.total;

  console.log(`  página 1: ${first.list.length} imóveis (total reportado: ${total})`);

  if (total > PAGE_SIZE) {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    for (let page = 2; page <= totalPages; page++) {
      try {
        const result = await fetchPage(page);
        console.log(`  página ${page}: ${result.list.length} imóveis`);
        all = all.concat(result.list);
      } catch (err) {
        console.error(`  ⚠ falha na página ${page}:`, err.message);
      }
    }
  }

  return all;
}

/* ─── Deduplicação por identidade real (mesma lógica do api.js) ─────── */
function dedupeByIdentity(rows) {
  const groups = new Map();
  const order  = [];

  rows.forEach((row) => {
    const title = row.property_title || '';
    const city  = row.property_city  || '';
    const price = row.property_price || '';
    const key   = slugify(`${title}-${city}-${price}`) || String(row.id);

    if (!groups.has(key)) {
      groups.set(key, row);
      order.push(key);
    }
  });

  return order.map((key) => groups.get(key));
}

/* ─── Normaliza 1 imóvel para os dados que a página de share precisa ── */
function normalizeForShare(raw) {
  const images   = Array.isArray(raw.images) ? raw.images : [];
  const coverObj = images.find((img) => img.is_cover) || images[0] || null;
  const cover    = coverObj ? coverObj.url : '';

  const city = String(raw.property_city || '').trim();
  let region = city;
  if (/balne.rio\s*cambo/i.test(city) || /^\s*BC\s*$/i.test(city)) {
    region = 'Balneário Camboriú';
  } else if (/praia\s*brava/i.test(city)) {
    region = 'Praia Brava';
  }

  const rawPrice = String(raw.property_price || '').trim();
  let price = 'Sob consulta';
  if (rawPrice && rawPrice !== '0' && rawPrice !== 'R$ 0,00') {
    // Remove centavos (",00") — padrão "sem centavos" usado no resto do site
    const noCents = rawPrice.replace(/,00$/, '');
    price = noCents.startsWith('R$') ? noCents : `R$ ${noCents}`;
  }

  const title = raw.property_title || 'Imóvel de alto padrão';
  const slug  = raw.slug || `${slugify(title)}-${raw.id}`;
  const area  = raw.property_area_sqm ? `${raw.property_area_sqm} m²` : '';

  return {
    id:       raw.id,
    slug,
    title,
    region,
    price,
    area,
    suites:   raw.property_bedrooms      ? Number(raw.property_bedrooms)      : 0,
    parking:  raw.property_garage_spaces ? Number(raw.property_garage_spaces) : 0,
    cover:    cover || `${SITE_BASE_URL}/assets/images/logo/logo-horizontal.webp`,
  };
}

/* ─── Monta a descrição curta usada no preview ──────────────────────── */
function buildDescription(item) {
  const parts = [
    item.region,
    item.price,
    item.area,
    item.suites  ? `${item.suites} suítes`  : '',
    item.parking ? `${item.parking} vagas`  : '',
  ].filter(Boolean);
  return parts.join(' · ') || 'Imóvel de alto padrão selecionado por Heleno Alves.';
}

/* ─── Template HTML da página de compartilhamento ───────────────────── */
function buildShareHtml(item) {
  const shareUrl  = `${SITE_BASE_URL}/compartilhar/${item.slug}/`;
  const detailUrl = `${SITE_BASE_URL}/imoveis/detalhe.html?slug=${item.slug}`;
  const title       = `${item.title} | Heleno Alves`;
  const description = buildDescription(item);

  const T   = escapeHtml(title);
  const D   = escapeHtml(description);
  const IMG = escapeHtml(item.cover);
  const URL = escapeHtml(shareUrl);
  const DET = escapeHtml(detailUrl);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${T}</title>
  <meta name="description" content="${D}">
  <meta name="robots" content="noindex, follow">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Heleno Alves">
  <meta property="og:title" content="${T}">
  <meta property="og:description" content="${D}">
  <meta property="og:image" content="${IMG}">
  <meta property="og:image:secure_url" content="${IMG}">
  <meta property="og:url" content="${URL}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${T}">
  <meta name="twitter:description" content="${D}">
  <meta name="twitter:image" content="${IMG}">

  <link rel="canonical" href="${DET}">
  <meta http-equiv="refresh" content="0;url=${DET}">
</head>
<body>
  <p>Redirecionando para o imóvel...</p>
  <script>
    window.location.replace(${JSON.stringify(detailUrl)});
  </script>
</body>
</html>
`;
}

/* ─── Execução principal ─────────────────────────────────────────────── */
async function main() {
  const raw = await fetchAllProperties();
  console.log(`\nTotal bruto recebido: ${raw.length}`);

  const unique = dedupeByIdentity(raw);
  console.log(`Total único após deduplicação: ${unique.length}`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let created = 0;
  for (const raw of unique) {
    const item = normalizeForShare(raw);
    if (!item.slug) continue;

    const dir = path.join(OUTPUT_DIR, item.slug);
    fs.mkdirSync(dir, { recursive: true });

    const html = buildShareHtml(item);
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
    created++;
  }

  console.log(`\n✓ ${created} páginas de compartilhamento geradas em /compartilhar/`);
  console.log(`  Base URL usada: ${SITE_BASE_URL}`);
  console.log('  (defina SITE_BASE_URL no ambiente para usar outro domínio)');
}

main().catch((err) => {
  console.error('\n✗ Falha ao gerar páginas de compartilhamento:', err);
  process.exit(1);
});