(function () {
  if (document.body.dataset.page !== 'imoveis') return;

  const $ = (id) => document.getElementById(id);

  let properties         = [];
  let filteredProperties = [];
  let currentPage        = 1;
  const perPage          = 9;
  let maxSliderPrice     = 30000000;

  /* ─── Helpers ──────────────────────────────────────────────────── */
  function slugify(v) {
    return String(v || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function esc(v) {
    return String(v || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function norm(str) {
    return String(str || '').normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  function t(key, fallback) {
    return (typeof HA_I18N !== 'undefined') ? HA_I18N.t(key) : fallback;
  }

  /* ─── Favoritos ────────────────────────────────────────────────── */
  function getFavs()       { return JSON.parse(localStorage.getItem('heleno_favorites') || '[]').map(String); }
  function saveFavs(f)     { localStorage.setItem('heleno_favorites', JSON.stringify(f)); }
  function isFav(item)     { const f = getFavs(); return f.includes(String(item.id)); }
  function toggleFav(item) {
    const f  = getFavs();
    const id = String(item.id);
    saveFavs(f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
    renderProperties();
  }

  /* ─── Card helpers ─────────────────────────────────────────────── */
  function getImage(item) {
    return item.cover || item.img || item.image ||
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&q=82&auto=format&fit=crop';
  }

  function tFeat(value) {
    return (typeof HA_FEATURES !== 'undefined' && typeof HA_I18N !== 'undefined')
      ? HA_FEATURES.translate(value, HA_I18N.getLang())
      : value;
  }

  function getLoc(item) {
    return item.loc ||
      [item.district, item.region].filter(Boolean).join(' · ') ||
      t('loc_consult', 'Localização sob consulta');
  }

  function getSpecs(item) {
    if (Array.isArray(item.specs)) {
      const skip = new Set(['ativo','exclusivo','pronto','em obra','active','inactive','vendido','oculto','reservado']);
      return item.specs.filter(s => !skip.has(String(s || '').toLowerCase().trim()));
    }
    const tS = t('card_suites','suítes');
    const tV = t('card_vagas','vagas');
    return [
      item.privateArea || item.area,
      item.suites  > 0 ? `${item.suites} ${tS}`  : '',
      item.parking > 0 ? `${item.parking} ${tV}` : '',
    ].filter(Boolean);
    // Nota: features traduzíveis vão em property-detail; nos cards mantemos specs técnicos
  }

  function getDetailUrl(item) {
    return `imoveis/detalhe.html?slug=${item.slug || slugify(item.title)}`;
  }

  /* ─── Preço ────────────────────────────────────────────────────── */
  function priceNum(price) {
    const txt = String(price || '').toLowerCase().trim();
    if (!txt || txt.includes('consulta') || txt.includes('request')) return null;
    let c = txt.replace(/r\$/g,'').replace(/\s/g,'').replace(/[^\d.,]/g,'');
    if (!c) return null;
    if (c.includes(',')) c = c.split(',')[0];
    c = c.replace(/\./g,'');
    const n = Number(c);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function matchPrice(item, max) {
    const p = item._priceNum !== undefined ? item._priceNum : priceNum(item.price);
    if (p === null) return true;      // sob consulta: sempre mostra
    if (max >= maxSliderPrice) return true; // slider no topo: sem filtro
    return p <= max;
  }

  /* ─── Slider de preço ──────────────────────────────────────────── */
  function maxRegistered() {
    const ps = properties
      .filter(p => p.status !== 'Oculto' && p.status !== 'Vendido')
      .map(p => p._priceNum).filter(n => Number.isFinite(n) && n > 0);
    return ps.length ? Math.max(...ps) : 30000000;
  }

  function roundMax(v) {
    const step = v >= 10000000 ? 5000000 : 500000;
    return Math.ceil(v / step) * step;
  }

  // Converte valor BRL para a moeda do idioma atual
  function convertPrice(brl) {
    if (typeof HA_I18N === 'undefined') return brl;
    const lang  = HA_I18N.getLang();
    const rates = HA_I18N._rates || { USD: 0.18, EUR: 0.17 };
    if (lang === 'en') return Math.round(brl * rates.USD);
    if (lang === 'es' || lang === 'fr') return Math.round(brl * rates.EUR);
    return brl;
  }

  function getCurrencySymbol() {
    if (typeof HA_I18N === 'undefined') return 'R$';
    const lang = HA_I18N.getLang();
    if (lang === 'en') return '$';
    if (lang === 'es' || lang === 'fr') return '€';
    return 'R$';
  }

  function getUptoLabel() {
    if (typeof HA_I18N === 'undefined') return 'Até';
    const labels = { pt: 'Até', en: 'Up to', es: 'Hasta', fr: "Jusqu'à" };
    return labels[HA_I18N.getLang()] || 'Até';
  }

  function fmtShort(brl) {
    const n   = convertPrice(Number(brl || 0));
    const sym = getCurrencySymbol();
    const lang = (typeof HA_I18N !== 'undefined') ? HA_I18N.getLang() : 'pt';
    if (n >= 1000000) {
      const m = n / 1000000;
      const mStr = m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace('.', lang === 'pt' || lang === 'es' || lang === 'fr' ? ',' : '.');
      return `${sym} ${mStr}M`;
    }
    return `${sym} ${n.toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR')}`;
  }

  function updateLabel() {
    const r = $('priceRange'); const l = $('priceRangeLabel');
    if (!r || !l) return;
    const v = Number(r.value);
    const upto = getUptoLabel();
    l.textContent = v >= maxSliderPrice ? `${upto} ${fmtShort(maxSliderPrice)}` : `${upto} ${fmtShort(v)}`;
  }

  function updateScaleLabels() {
    const sc = document.querySelectorAll('.price-scale span');
    if (sc.length >= 2) {
      sc[0].textContent = `${getCurrencySymbol()} 0`;
      sc[1].textContent = fmtShort(maxSliderPrice);
    }
  }

  function setupSlider() {
    const r = $('priceRange');
    if (!r) return;
    maxSliderPrice = roundMax(maxRegistered());
    r.max   = maxSliderPrice;
    r.value = maxSliderPrice;
    updateScaleLabels();
    updateLabel();
  }

  // Re-atualiza o slider quando o idioma muda
  window.addEventListener('ha:langchange', () => {
    updateScaleLabels();
    updateLabel();
    // Re-renderiza cards para atualizar preços convertidos
    renderProperties();
  });



  /* ─── Drawer de filtros mobile ─────────────────────────────────── */
  function initMobileFilters() {
    const sidebar = document.querySelector('.catalog-sidebar');
    const topbar  = document.querySelector('.catalog-topbar');
    if (!sidebar || !topbar) return;

    // Cria botão trigger
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'mobile-filter-trigger';
    trigger.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M7 12h10M10 18h4"/></svg><span>' + t('filters_apply','Filtrar imóveis') + '</span>';
    topbar.parentNode.insertBefore(trigger, topbar);

    // Cria overlay + drawer
    const overlay = document.createElement('div');
    overlay.className = 'filter-drawer-overlay';
    overlay.innerHTML = '<div class="filter-drawer">' +
      '<div class="filter-drawer-head"><h3>' + t('filter_h2','Filtrar imóveis') + '</h3>' +
      '<button class="filter-drawer-close" type="button" aria-label="Fechar">×</button></div>' +
      '<div class="filter-drawer-body"></div>' +
      '<div class="filter-drawer-actions">' +
        '<button class="btn filter-drawer-clear" type="button">' + t('filters_clear','Limpar') + '</button>' +
        '<button class="btn gold filter-drawer-apply" type="button">' + t('filters_apply','Aplicar') + '</button>' +
      '</div></div>';
    document.body.appendChild(overlay);

    const body  = overlay.querySelector('.filter-drawer-body');
    const drawer = overlay.querySelector('.filter-drawer');

    // Clona o conteúdo dos filtros para o drawer
    const filtersEl = sidebar.querySelector('.filters');
    let originalParent = null;
    let placeholder = null;

    function openDrawer() {
      // Move (não clona) os filtros para preservar os listeners
      if (filtersEl && !placeholder) {
        placeholder = document.createComment('filters-placeholder');
        originalParent = filtersEl.parentNode;
        originalParent.insertBefore(placeholder, filtersEl);
        body.appendChild(filtersEl);
      }
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      // Devolve os filtros ao lugar original
      if (placeholder && filtersEl) {
        placeholder.parentNode.insertBefore(filtersEl, placeholder);
        placeholder.remove();
        placeholder = null;
      }
    }

    trigger.addEventListener('click', openDrawer);
    overlay.querySelector('.filter-drawer-close').addEventListener('click', closeDrawer);
    overlay.querySelector('.filter-drawer-apply').addEventListener('click', () => {
      applyFilters();
      closeDrawer();
    });
    overlay.querySelector('.filter-drawer-clear').addEventListener('click', () => {
      (typeof clearFilters === 'function' ? clearFilters() : (document.getElementById('clearFilters') && document.getElementById('clearFilters').click()));
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDrawer();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeDrawer();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initMobileFilters();
    const sel = $('sortSelect');
    if (sel) sel.addEventListener('change', () => {
      applySort();
      currentPage = 1;
      renderProperties();
    });
  });

  /* ─── Carregamento ─────────────────────────────────────────────── */
  function normalizeList(data) {
    return (Array.isArray(data) ? data : []).map((item, i) => {
      const base = {
        ...item,
        id:     item.id   || i + 1,
        slug:   item.slug || slugify(item.title || ''),
        status: item.status || 'Ativo',
      };
      // Pré-computa campos para filtro rápido — roda só 1x no load
      base._regionNorm = norm(base.region || base.property_city || '');
      base._priceNum   = priceNum(base.price);
      base._searchText = [
        base.title, base.district, base.region, base.type,
        base.tag, base.price,
        ...(Array.isArray(base.features) ? base.features : []),
        ...(Array.isArray(base.specs)    ? base.specs    : []),
      ].join(' ').toLowerCase();
      return base;
    });
  }

  function showSkeleton() {
    const grid = $('propertyGrid');
    if (!grid) return;
    grid.classList.add('is-loading');
    grid.innerHTML = Array(9).fill('').map(() => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton-body">
          <div class="skeleton skeleton-line wide"></div>
          <div class="skeleton skeleton-line mid"></div>
          <div class="skeleton skeleton-line short"></div>
          <div class="skeleton skeleton-line full" style="margin-top:8px;height:38px"></div>
        </div>
      </div>`).join('');
  }

  function hideSkeleton() {
    const grid = $('propertyGrid');
    if (!grid) return;
    grid.classList.remove('is-loading');
  }

  async function loadProperties() {
    showSkeleton();
    try {
      const data = await HA_API.fetchProperties();
      const normalized = normalizeList(data);
      // Blindagem redundante: mesmo que api.js já tenha deduplicado,
      // roda de novo aqui (custo desprezível) para garantir que nenhuma
      // etapa futura reintroduza duplicados antes do filtro/render.
      properties = (typeof HA_API.dedupeProperties === 'function')
        ? HA_API.dedupeProperties(normalized, 'imoveis.js:before-filter')
        : normalized;
    } catch (err) {
      console.error('[HA] imoveis.js — falha na API:', err);
      properties = [];
    } finally {
      hideSkeleton();
    }
  }

  /* ─── Filtros ──────────────────────────────────────────────────── */

  // Verifica se item passa pelo filtro de região
  function matchRegion(item, regionNorm) {
    if (!regionNorm) return true;
    const ir = item._regionNorm || '';
    if (regionNorm === 'balneario camboriu') {
      return ir.includes('balneario camb') || ir.includes('balne camb') || ir === 'bc';
    }
    if (regionNorm === 'praia brava') {
      return ir.includes('praia brava');
    }
    return ir === regionNorm || ir.includes(regionNorm);
  }

  // Verifica se item passa por todos os filtros
  function itemMatches(item, search, regionNorm, type, maxP, suites, parking) {
    if (item.status === 'Oculto' || item.status === 'Vendido') return false;
    if (search && !(item._searchText || '').includes(search)) return false;
    if (!matchRegion(item, regionNorm)) return false;
    if (type && String(item.type || item.tag || '') !== type) return false;
    if (!matchPrice(item, maxP)) return false;
    if (suites && Number(item.suites) < Number(suites)) return false;
    if (parking && Number(item.parking) < Number(parking)) return false;
    return true;
  }

  function applyFilters() {
    const search     = ($('searchInput')?.value || '').trim().toLowerCase();
    const region     = ($('regionFilter')?.value || '').trim();
    const type       = ($('typeFilter')?.value || '').trim();
    const maxP       = Number($('priceRange')?.value || maxSliderPrice);
    const suites     = $('suitesFilter')?.value || '';
    const parking    = $('parkingFilter')?.value || '';
    const regionNorm = norm(region);

    updateLabel();

    // Filtro síncrono direto — os campos pré-computados são simples o suficiente
    filteredProperties = properties.filter(item =>
      itemMatches(item, search, regionNorm, type, maxP, suites, parking)
    );

    applySort();
    currentPage = 1;
    renderProperties();
  }

  /* ─── Ordenação ────────────────────────────────────────────────── */
  function areaNum(item) {
    const raw = String(item.area || item.size || '').replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  }

  function applySort() {
    const sel = $('sortSelect');
    const mode = sel ? sel.value : 'featured';

    const byPrice = (a, b) => (b._priceNum || 0) - (a._priceNum || 0);

    switch (mode) {
      case 'price_desc':
        filteredProperties.sort(byPrice);
        break;
      case 'price_asc':
        filteredProperties.sort((a, b) => byPrice(b, a));
        break;
      case 'area_desc':
        filteredProperties.sort((a, b) => areaNum(b) - areaNum(a));
        break;
      case 'recent':
        filteredProperties.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
      case 'featured':
      default:
        // Destaques primeiro (tag), depois preço desc
        filteredProperties.sort((a, b) => {
          const fa = a.tag ? 1 : 0;
          const fb = b.tag ? 1 : 0;
          if (fb !== fa) return fb - fa;
          return byPrice(a, b);
        });
    }
  }

  /* ─── Render ───────────────────────────────────────────────────── */
  function buildCard(item) {
    return `<article class="property-card">
      <div class="property-image">
        <img loading="lazy" decoding="async" src="${esc(getImage(item))}" alt="${esc(item.title)}" width="600" height="400">
        <span class="property-tag">${esc(tFeat(item.tag) || 'Destaque')}</span>
        <button class="favorite-btn ${isFav(item) ? 'active' : ''}" type="button"
          data-action="favorite" data-id="${item.id}" aria-label="Favoritar">
          ${isFav(item) ? '★' : '☆'}
        </button>
        <span class="region-badge">${esc(item.region || '')}</span>
      </div>
      <div class="property-body">
        <h3>${esc(item.title || 'Imóvel sem nome')}</h3>
        <p class="property-location">${esc(getLoc(item))}</p>
        <div class="property-specs">
          ${getSpecs(item).map(s => `<span class="property-spec">${esc(s)}</span>`).join('')}
        </div>
        <div class="property-foot">
          <div class="property-price">
            <small data-i18n="card_value">Valor</small>
            <span data-price-brl="${esc(item.price || '')}">${
              (typeof HA_I18N !== 'undefined')
                ? HA_I18N.formatPrice(item.price, HA_I18N.getLang())
                : esc(item.price || '')
            }</span>
          </div>
          <a class="btn small" href="${esc(getDetailUrl(item))}" data-i18n="card_details">Detalhes</a>
        </div>
      </div>
    </article>`;
  }

  function renderProperties() {
    const grid  = $('propertyGrid');
    const count = $('resultCount');
    const empty = $('emptyState');
    if (!grid) return;

    const total      = filteredProperties.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    if (count) {
      const lbl = total === 1
        ? t('results_count_one', 'imóvel encontrado')
        : t('results_count', 'imóveis encontrados');
      count.textContent = `${total} ${lbl}`;
    }

    renderPagination(totalPages);

    const items = filteredProperties.slice((currentPage - 1) * perPage, currentPage * perPage);

    if (!items.length) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }

    if (empty) empty.style.display = 'none';

    // Mostra skeleton imediato para feedback visual
    grid.style.opacity = '0.4';

    // Render no próximo frame — não bloqueia o clique
    requestAnimationFrame(() => {
      grid.innerHTML = items.map(buildCard).join('');
      grid.style.opacity = '1';
    });
  }

  function renderPagination(totalPages) {
    const info = $('pageInfo');
    const prev = $('prevPage');
    const next = $('nextPage');
    if (info) info.textContent = `Página ${currentPage} de ${totalPages}`;
    if (prev) prev.disabled = currentPage <= 1;
    if (next) next.disabled = currentPage >= totalPages;
  }

  function changePage(dir) {
    const totalPages = Math.max(1, Math.ceil(filteredProperties.length / perPage));
    currentPage = Math.max(1, Math.min(totalPages, currentPage + dir));
    renderProperties();
    const top = document.querySelector('.catalog-content');
    if (top) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ─── URL / filtro inicial ─────────────────────────────────────── */
  function applyInitialRegion() {
    const params  = new URLSearchParams(window.location.search);
    const fromUrl = params.get('region') || localStorage.getItem('heleno_region_filter') || '';
    localStorage.removeItem('heleno_region_filter');
    if (!fromUrl) return;

    const sel = $('regionFilter');
    if (!sel) return;

    const target = norm(decodeURIComponent(fromUrl));
    const match  = Array.from(sel.options).find(o => norm(o.value) === target || norm(o.text) === target);
    if (match) { sel.value = match.value; }
  }

  function clearFilters() {
    ['searchInput','regionFilter','typeFilter','suitesFilter','parkingFilter'].forEach(id => {
      const el = $(id); if (el) el.value = '';
    });
    const r = $('priceRange');
    if (r) r.value = maxSliderPrice;
    updateLabel();
    applyFilters();
    if (window.history.replaceState)
      window.history.replaceState({}, document.title, window.location.pathname);
  }

  /* ─── Schedule filter — não bloqueia UI ───────────────────────── */
  let _filterTimer = null;
  function scheduleFilter() {
    clearTimeout(_filterTimer);
    _filterTimer = setTimeout(applyFilters, 80);
  }

  /* ─── Eventos ──────────────────────────────────────────────────── */
  function bindEvents() {
    ['searchInput','regionFilter','typeFilter','priceRange','suitesFilter','parkingFilter']
      .forEach(id => {
        const el = $(id);
        if (!el) return;
        const evt = (id === 'priceRange' || id === 'searchInput') ? 'input' : 'change';
        el.addEventListener(evt, scheduleFilter);
      });
    $('clearFilters')?.addEventListener('click', clearFilters);
    $('emptyClearFilters')?.addEventListener('click', clearFilters);
    $('prevPage')?.addEventListener('click', () => changePage(-1));
    $('nextPage')?.addEventListener('click', () => changePage(1));
    $('propertyGrid')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-action="favorite"]');
      if (!btn) return;
      const item = properties.find(p => String(p.id) === String(btn.dataset.id));
      if (item) toggleFav(item);
    });
  }

  /* ─── Init ─────────────────────────────────────────────────────── */
  async function init() {
    if (window.__imoveisPageInitialized) {
      console.warn('[IMOVEIS] Inicialização duplicada bloqueada');
      return;
    }
    window.__imoveisPageInitialized = true;

    bindEvents();
    await loadProperties();
    applyInitialRegion();
    setupSlider();
    applyFilters();
  }

  document.addEventListener('DOMContentLoaded', init);

  // ── Helper de validação manual (rodar no console após carregar) ──
  // window.haCheckDuplicates() mostra quantos cards de "Praia Brava"
  // e quantos cards de "Raro" estão de fato renderizados na tela.
  window.haCheckDuplicates = function () {
    const cards = Array.from(document.querySelectorAll('.property-card'));
    const brava = cards.filter(c => c.textContent.toLowerCase().includes('praia brava'));
    const raro  = cards.filter(c => c.textContent.toLowerCase().includes('raro'));
    console.log('Cards Praia Brava renderizados:', brava.length);
    console.log('Cards "Raro" renderizados:', raro.length, '(esperado: 1)');
    return { totalCards: cards.length, bravaCards: brava.length, raroCards: raro.length };
  };
})();