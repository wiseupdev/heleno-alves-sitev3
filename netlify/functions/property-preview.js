/**
 * netlify/functions/property-preview.js — Heleno Alves
 *
 * Gera dinamicamente uma página HTML de preview (Open Graph / Twitter Card)
 * para um imóvel, identificado pelo slug na URL /compartilhar/:slug/.
 *
 * Por que existe: quando alguém compartilha o link de um imóvel no WhatsApp,
 * o WhatsApp faz UMA requisição à URL e lê as meta tags do HTML retornado
 * para montar o card de preview (foto + título + descrição). A página de
 * detalhe real (imoveis/detalhe.html) monta o conteúdo via JavaScript depois
 * do carregamento, então o WhatsApp nunca veria as meta tags certas nela.
 * Esta function devolve um HTML estático "burro" só com as meta tags corretas
 * + um redirect imediato para a página de detalhe real.
 *
 * Vantagem sobre o gerador estático (scripts/generate-share-pages.js):
 * não precisa ser regenerado/commitado toda vez que o catálogo muda — o
 * preview é montado on-demand a partir do webhook.
 *
 * IMPORTANTE: o contrato de requisição replica EXATAMENTE o de
 * assets/js/api.js (contrato em inglês). Se aquele mudar, este muda junto.
 */

const WEBHOOK_URL = 'https://webhook.wiseuptech.com.br/webhook/apipaginationha';
const TENANT_ID   = '1911202511';
const PAGE_SIZE   = 20;

/* ─── Base URL dinâmica ──────────────────────────────────────────────
 * Prioridade:
 *   1) variável de ambiente SITE_BASE_URL (se o Bruno travar no painel);
 *   2) host real da requisição — assim, em helenoalvesv3.netlify.app usa
 *      esse domínio, e quando helenoalvesbc.com.br apontar, usa o final,
 *      sem precisar mexer em nada;
 *   3) fallback para o domínio de testes.
 * ──────────────────────────────────────────────────────────────────── */
function getBaseUrl(event) {
  if (process.env.SITE_BASE_URL) {
    return process.env.SITE_BASE_URL.replace(/\/$/, '');
  }

  const host = (event.headers && (event.headers.host || event.headers.Host)) || '';
  if (host) {
    return `https://${host}`;
  }

  return 'https://helenoalvesv3.netlify.app';
}

/* ─── Slugify — idêntico ao de assets/js/api.js ─────────────────────── */
function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/* ─── Escape para inserir texto em atributos/HTML ───────────────────── */
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
    filters: { min_price: 0, max_price: 999999999 },
  };

  const res = await fetch(WEBHOOK_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Webhook retornou ${res.status} na página ${page}`);

  const data    = await res.json();
  const wrapper = Array.isArray(data) ? data[0] : data;
  return {
    total: wrapper.propertyAmount || 0,
    list:  wrapper.listProperty   || [],
  };
}

/* ─── Normaliza 1 imóvel para os dados que o preview precisa ────────── */
function normalizeForPreview(raw, baseUrl) {
  const images   = Array.isArray(raw.images) ? raw.images : [];
  const coverObj = images.find((img) => img.is_cover) || images[0] || null;
  const cover    = coverObj ? coverObj.url : '';
  const fallbackImage = `${baseUrl}/assets/images/logo/logo-horizontal.webp`;

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
    const noCents = rawPrice.replace(/,00$/, '');
    price = noCents.startsWith('R$') ? noCents : `R$ ${noCents}`;
  }

  const title = raw.property_title || 'Imóvel de alto padrão';
  const slug  = raw.slug || `${slugify(title)}-${raw.id}`;
  const area  = raw.property_area_sqm ? `${raw.property_area_sqm} m²` : '';

  return {
    id:      raw.id,
    slug,
    title,
    region,
    price,
    area,
    suites:  raw.property_bedrooms      ? Number(raw.property_bedrooms)      : 0,
    parking: raw.property_garage_spaces ? Number(raw.property_garage_spaces) : 0,
    cover:   cover || fallbackImage,
  };
}

/* ─── Busca um imóvel pelo slug, paginando até encontrar ────────────── */
async function findPropertyBySlug(targetSlug, baseUrl) {
  const first = await fetchPage(1);
  const total = first.total;

  // Procura na primeira página
  let found = first.list.map((r) => normalizeForPreview(r, baseUrl)).find((p) => p.slug === targetSlug);
  if (found) return found;

  // Pagina o resto até achar (ou esgotar)
  if (total > PAGE_SIZE) {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    for (let page = 2; page <= totalPages; page++) {
      try {
        const result = await fetchPage(page);
        found = result.list.map((r) => normalizeForPreview(r, baseUrl)).find((p) => p.slug === targetSlug);
        if (found) return found;
      } catch (err) {
        console.error(`[property-preview] falha na página ${page}:`, err.message);
      }
    }
  }

  return null;
}

/* ─── Descrição curta usada no preview ──────────────────────────────── */
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

/* ─── HTML da página de preview ─────────────────────────────────────── */
function buildHtml(item, slug, baseUrl) {
  const shareUrl  = `${baseUrl}/compartilhar/${slug}/`;
  const detailUrl = `${baseUrl}/imoveis/detalhe.html?slug=${slug}`;

  const T   = escapeHtml(`${item.title} | Heleno Alves`);
  const D   = escapeHtml(buildDescription(item));
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
  <script>window.location.replace(${JSON.stringify(detailUrl)});</script>
</body>
</html>`;
}

/* ─── HTML de fallback quando o imóvel não é encontrado ─────────────── */
function buildFallbackHtml(slug, baseUrl) {
  const detailUrl = `${baseUrl}/imoveis/detalhe.html?slug=${slug}`;
  const fallbackImage = `${baseUrl}/assets/images/logo/logo-horizontal.webp`;
  const DET = escapeHtml(detailUrl);
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Heleno Alves — Curadoria imobiliária de alto padrão</title>
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Heleno Alves">
  <meta property="og:title" content="Heleno Alves — Curadoria imobiliária de alto padrão">
  <meta property="og:description" content="Imóveis selecionados de alto padrão em Balneário Camboriú e Praia Brava.">
  <meta property="og:image" content="${escapeHtml(fallbackImage)}">
  <meta property="og:url" content="${escapeHtml(`${baseUrl}/compartilhar/${slug}/`)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${DET}">
  <meta http-equiv="refresh" content="0;url=${DET}">
</head>
<body>
  <p>Redirecionando...</p>
  <script>window.location.replace(${JSON.stringify(detailUrl)});</script>
</body>
</html>`;
}

/* ─── Handler ────────────────────────────────────────────────────────── */
exports.handler = async (event) => {
  const baseUrl = getBaseUrl(event);
  const slug = (event.queryStringParameters && event.queryStringParameters.slug || '').trim();

  // Cache curto na CDN: o WhatsApp/Facebook cacheiam o preview de qualquer
  // forma, e isso evita martelar o webhook a cada acesso.
  const baseHeaders = {
    'Content-Type':  'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
  };

  if (!slug) {
    return { statusCode: 400, headers: baseHeaders, body: buildFallbackHtml('', baseUrl) };
  }

  try {
    const item = await findPropertyBySlug(slug, baseUrl);
    if (!item) {
      // Imóvel não encontrado — devolve fallback (ainda redireciona)
      return { statusCode: 200, headers: baseHeaders, body: buildFallbackHtml(slug, baseUrl) };
    }
    return { statusCode: 200, headers: baseHeaders, body: buildHtml(item, slug, baseUrl) };
  } catch (err) {
    console.error('[property-preview] erro:', err);
    // Mesmo em erro, devolve algo que redireciona o usuário
    return { statusCode: 200, headers: baseHeaders, body: buildFallbackHtml(slug, baseUrl) };
  }
};