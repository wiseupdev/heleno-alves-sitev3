/**
 * api.js — Heleno Alves
 * Módulo central de comunicação com o webhook N8n / Postgres
 */

const HA_API = (function () {

  const WEBHOOK_URL = 'https://webhook.wiseuptech.com.br/webhook/apipaginationha';
  const TENANT_ID   = '1911202511';
  const PAGE_SIZE   = 20;
  // v7: contrato de requisição trocado para inglês (event_name/page/
  // limit/offset/filters) — o webhook responde melhor a esse formato.
  const CACHE_KEY   = 'ha_props_v7';
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

  /* ─── Agrupamento por identidade real ──────────────────────────────
   * Se a query do n8n faz JOIN com imagens/amenities sem agregação
   * (sem GROUP BY / array_agg), o MESMO imóvel pode chegar em várias
   * "linhas" — uma por imagem ou característica associada — cada
   * linha com o id da linha do JOIN, não necessariamente o id real
   * da propriedade.
   *
   * Em vez de simplesmente descartar essas linhas (o que perderia
   * fotos/características reais que vieram em linhas diferentes),
   * AGRUPAMOS por identidade e MESCLAMOS galeria/features de todas
   * as linhas do mesmo grupo.
   * ──────────────────────────────────────────────────────────────── */
  function normalizeKey(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
  }

  function keyById(property) {
    const directKey = property.id || property.slug;
    return directKey ? normalizeKey(directKey) : '';
  }

  function keyByContent(property) {
    const name   = property.title  || '';
    const region = property.region || '';
    const value  = property.price  || '';
    return normalizeKey(`${name}-${region}-${value}`);
  }

  function dedupeProperties(list, context = 'global') {
    // Mapa por chave de CONTEÚDO (título+região+preço) — é o que
    // realmente identifica "é o mesmo imóvel", já que o id da linha
    // do JOIN pode variar entre repetições do mesmo imóvel.
    const groups = new Map();
    const order  = []; // mantém a ordem de primeira aparição

    list.forEach((property) => {
      const contentKey = keyByContent(property) || keyById(property);
      if (!contentKey) {
        // Sem nenhuma chave possível — mantém como item isolado
        order.push(property);
        return;
      }

      if (!groups.has(contentKey)) {
        groups.set(contentKey, {
          ...property,
          gallery:  Array.isArray(property.gallery)  ? [...property.gallery]  : [],
          features: Array.isArray(property.features) ? [...property.features] : [],
        });
        order.push(contentKey);
      } else {
        // Já existe — é uma linha duplicada do mesmo imóvel.
        // Mescla galeria e features em vez de simplesmente descartar.
        const existing = groups.get(contentKey);
        console.warn(`[HA_API] (${context}) Linha duplicada mesclada — "${property.title}" (chave: ${contentKey})`);

        if (Array.isArray(property.gallery)) {
          property.gallery.forEach((url) => {
            if (url && !existing.gallery.includes(url)) existing.gallery.push(url);
          });
        }
        if (property.cover && !existing.cover) existing.cover = property.cover;

        if (Array.isArray(property.features)) {
          property.features.forEach((f) => {
            if (f && !existing.features.includes(f)) existing.features.push(f);
          });
        }
      }
    });

    const unique = order.map((entry) =>
      typeof entry === 'string' ? groups.get(entry) : entry
    );

    console.log(`[HA_API] (${context}) ${list.length} recebidos → ${unique.length} únicos (agrupados)`);
    return unique;
  }

  /* ─── Fetch uma página ────────────────────────────────────────── */
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

    console.log('[PAGINATION] request:', payload);

    const res = await fetch(WEBHOOK_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`API ${res.status}`);
    const data    = await res.json();
    const wrapper = Array.isArray(data) ? data[0] : data;

    // Diagnóstico de paginação — log obrigatório pedido na auditoria
    console.log('[PAGINATION] response:', {
      pageRequested: page,
      total:    wrapper.propertyAmount,
      itemsLength: Array.isArray(wrapper.listProperty) ? wrapper.listProperty.length : 0,
      firstId:  wrapper.listProperty?.[0]?.id,
      lastId:   wrapper.listProperty?.[wrapper.listProperty.length - 1]?.id,
    });

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

    // Assinatura da página 1 (ids), usada abaixo para provar se o
    // backend está de fato avançando a paginação ou sempre devolvendo
    // o mesmo conteúdo independente do número de página pedido.
    const firstPageIds = first.list.map(p => p.id).join(',');
    let identicalPageCount = 0;

    if (total > PAGE_SIZE) {
      const totalPages = Math.ceil(total / PAGE_SIZE);
      const pages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
      // Lotes de 5 para não sobrecarregar
      for (let i = 0; i < pages.length; i += 5) {
        const batch = pages.slice(i, i + 5);

        // Cada página é buscada com seu próprio try/catch — uma falha
        // isolada não pode mais derrubar as páginas restantes.
        const results = await Promise.all(
          batch.map(async (p) => {
            try {
              return await fetchPage(p);
            } catch (err) {
              console.error(`[HA_API] Falha ao buscar página ${p}:`, err.message);
              return { total: 0, list: [] };
            }
          })
        );

        results.forEach((r, idx) => {
          const pageNum   = batch[idx];
          const theseIds  = r.list.map(p => p.id).join(',');
          if (theseIds && theseIds === firstPageIds) {
            identicalPageCount++;
            console.warn(
              `[PAGINATION] ⚠ Página ${pageNum} retornou EXATAMENTE os mesmos ids da página 1. ` +
              'Isso indica que o webhook/n8n está IGNORANDO o parâmetro de página e sempre ' +
              'devolvendo o mesmo conteúdo — causa raiz provável da duplicação E da incompletude ' +
              '(os imóveis "reais" dessas páginas nunca chegam a ser buscados).'
            );
          }
          all = all.concat(r.list);
        });
      }
    }

    if (identicalPageCount > 0) {
      console.error(
        `[PAGINATION] CONFIRMADO: ${identicalPageCount} de ${Math.ceil(total / PAGE_SIZE) - 1} ` +
        'páginas adicionais retornaram conteúdo idêntico à página 1. ' +
        'A paginação do webhook N8n precisa ser corrigida (verificar nome do parâmetro de página ' +
        'esperado pelo workflow — possivelmente sem o acento em "página").'
      );
    }

    return all;
  }

  /* ─── Proteção contra chamadas concorrentes ────────────────────── */
  let _fetchInFlight = null;

  /* ─── Resumo por cidade — log obrigatório de auditoria ──────────── */
  function summarizeByCity(properties, context) {
    const summary = properties.reduce((acc, p) => {
      const city = String(p.region || p.property_city || '').trim() || '(sem cidade)';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});
    console.log(`[${context}] resumo por cidade:`, summary);
    return summary;
  }

  /* ─── API principal ───────────────────────────────────────────── */
  async function fetchProperties() {
    const cached = getCached();
    if (cached) return cached;

    // Se já existe um fetch em andamento, todos esperam o mesmo resultado
    // em vez de disparar requisições paralelas redundantes.
    if (_fetchInFlight) return _fetchInFlight;

    _fetchInFlight = (async () => {
      const raw        = await fetchAll();
      const normalized = raw.map(normalize);

      // ── [API RAW] Diagnóstico ANTES do agrupamento ──────────────────
      console.log('[API RAW] total bruto:', normalized.length);
      summarizeByCity(normalized, 'API RAW');

      // ── Agrupamento (mescla linhas duplicadas por JOIN sem perder
      //    galeria/features) ──────────────────────────────────────────
      const grouped = dedupeProperties(normalized, 'after-fetch');

      console.log('[API DEDUPE] total único:', grouped.length);
      summarizeByCity(grouped, 'API DEDUPE');

      if (grouped.length !== normalized.length) {
        console.warn(
          `[HA_API] ${normalized.length - grouped.length} linha(s) duplicada(s) mesclada(s) ` +
          'no front. Isso confirma que o webhook/n8n retorna registros repetidos — provavelmente ' +
          'um JOIN sem agregação (ver seção de correção SQL sugerida: DISTINCT ON ou GROUP BY + array_agg).'
        );
      }

      setCache(grouped);
      return grouped;
    })();

    try {
      return await _fetchInFlight;
    } finally {
      _fetchInFlight = null;
    }
  }

  return {
    fetchProperties,
    normalize,
    dedupeProperties,
    // Alias com o nome usado na auditoria — mesma função
    groupPropertiesByRealEstate: dedupeProperties,
    summarizeByCity,
    TENANT_ID,
    WEBHOOK_URL,
  };

})(); 