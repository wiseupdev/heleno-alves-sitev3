/**
 * api.js — Heleno Alves
 * Módulo central de comunicação com o webhook N8n / Postgres
 */

const HA_API = (function () {

  const WEBHOOK_URL = 'https://webhook.wiseuptech.com.br/webhook/apipaginationha';
  const TENANT_ID   = '1911202511';
  const PAGE_SIZE   = 20;
  const CACHE_KEY   = 'ha_props_v2';
  const CACHE_TTL   = 15 * 60 * 1000; // 15 min

  /* ─── Slugify ─────────────────────────────────────────────────── */
  function slugify(value) {
    return String(value || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  /* ─── Normaliza 1 imóvel ──────────────────────────────────────── */
  function normalize(raw) {
    const images   = Array.isArray(raw.images) ? raw.images : [];
    const coverObj = images.find(img => img.is_cover) || images[0] || null;
    const cover    = coverObj ? coverObj.url : '';
    const gallery  = images.map(img => img.url).filter(Boolean);

    const videos = Array.isArray(raw.videos) ? raw.videos : [];
    const video  = videos[0] ? videos[0].url : '';

    const types = Array.isArray(raw.property_types) ? raw.property_types : [];
    const type  = types[0] ? types[0].property_type_name : '';

    const categories = Array.isArray(raw.categories) ? raw.categories : [];
    const tag        = categories[0] ? categories[0].category_name : type;

    const amenities = Array.isArray(raw.amenities) ? raw.amenities : [];
    const features  = amenities.map(a => a.amenitie_name).filter(Boolean);

    // Normaliza cidade → region padronizada
    const city = String(raw.property_city || '').trim();
    let region     = city;
    let regionSlug = slugify(city);

    if (/balne.rio\s*cambo/i.test(city) || /^\s*BC\s*$/i.test(city)) {
      region     = 'Balneário Camboriú';
      regionSlug = 'balneario-camboriu';
    } else if (/praia\s*brava/i.test(city)) {
      region     = 'Praia Brava';
      regionSlug = 'praia-brava';
    }

    // Preço
    const rawPrice = String(raw.property_price || '').trim();
    let price = 'Sob consulta';
    if (rawPrice && rawPrice !== '0' && rawPrice !== 'R$ 0,00') {
      price = rawPrice.startsWith('R$') ? rawPrice : `R$ ${rawPrice}`;
    }

    const title = raw.property_title || '';
    const slug  = raw.slug || (slugify(title) + '-' + raw.id);
    const area  = raw.property_area_sqm ? `${raw.property_area_sqm} m²` : '';

    return {
      id:          raw.id,
      slug,
      title,
      region,
      regionSlug,
      district:    raw.property_district || '',
      type,
      tag:         tag || type,
      status:      raw.property_status || 'active',
      price,
      privateArea: area,
      suites:      raw.property_bedrooms      ? Number(raw.property_bedrooms)      : 0,
      parking:     raw.property_garage_spaces ? Number(raw.property_garage_spaces) : 0,
      bathrooms:   raw.property_bathrooms     ? Number(raw.property_bathrooms)     : 0,
      cover,
      img:         cover,
      gallery,
      video,
      features,
      description: raw.property_description || '',
      lat:         raw.property_lat ? Number(raw.property_lat) : null,
      lng:         raw.property_lng ? Number(raw.property_lng) : null,
    };
  }

  /* ─── Cache ───────────────────────────────────────────────────── */
  function getCached() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { ts, data } = JSON.parse(raw);
      if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return null; }
      return data;
    } catch { return null; }
  }

  function setCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); }
    catch { /* ignora quota exceeded */ }
  }

  /* ─── Fetch uma página ────────────────────────────────────────── */
  async function fetchPage(page) {
    const res = await fetch(WEBHOOK_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome_do_evento: 'obter_propriedade_do_cliente',
        tenant_id:      TENANT_ID,
        página:         page,
        limite:         PAGE_SIZE,
        filtros: { preço_mínimo: 0, preço_máximo: 999999999 },
      }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data    = await res.json();
    const wrapper = Array.isArray(data) ? data[0] : data;
    return {
      total: wrapper.propertyAmount || 0,
      list:  wrapper.listProperty   || [],
    };
  }

  /* ─── Fetch todas as páginas em lotes de 5 ───────────────────── */
  async function fetchAll() {
    const first = await fetchPage(1);
    let all = [...first.list];
    const total = first.total;

    if (total > PAGE_SIZE) {
      const totalPages = Math.ceil(total / PAGE_SIZE);
      const pages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
      // Lotes de 5 para não sobrecarregar
      for (let i = 0; i < pages.length; i += 5) {
        const batch   = pages.slice(i, i + 5);
        const results = await Promise.all(batch.map(p => fetchPage(p)));
        results.forEach(r => { all = all.concat(r.list); });
      }
    }

    return all;
  }

  /* ─── API principal ───────────────────────────────────────────── */
  async function fetchProperties() {
    const cached = getCached();
    if (cached) return cached;

    const raw        = await fetchAll();
    const normalized = raw.map(normalize);
    setCache(normalized);
    return normalized;
  }

  return { fetchProperties, normalize, TENANT_ID, WEBHOOK_URL };

})();