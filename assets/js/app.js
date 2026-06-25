// DATA_PATH removido — dados vêm do webhook N8n via api.js

const FAV = 'heleno_favorites';
const $ = (id) => document.getElementById(id);

function hasValue(value) {
  if (value === null || value === undefined) return false;

  if (typeof value === 'string') {
    return value.trim() !== '';
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

function hideElement(id) {
  const el = $(id);
  if (el) el.style.display = 'none';
}

function showElement(id, display = '') {
  const el = $(id);
  if (el) el.style.display = display;
}

function setTextOrHide(id, value) {
  const el = $(id);
  if (!el) return;

  if (!hasValue(value)) {
    el.style.display = 'none';
    return;
  }

  el.textContent = value;
  el.style.display = '';
}

function setHtmlOrHide(id, html) {
  const el = $(id);
  if (!el) return;

  if (!hasValue(html)) {
    el.style.display = 'none';
    return;
  }

  el.innerHTML = html;
  el.style.display = '';
}

function validCoordinates(p) {
  return hasValue(p.lat) && hasValue(p.lng);
}

function mapUrl(p) {
  return `https://www.google.com/maps?q=${p.lat},${p.lng}&z=16&output=embed`;
}

function streetUrl(p) {
  return `https://www.google.com/maps?layer=c&cbll=${p.lat},${p.lng}&cbp=12,0,0,0,0&output=svembed`;
}

function openMapUrl(p) {
  return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
}

function getDescription(p) {
  return p.description || p.desc || '';
}

function getCover(p) {
  return p.cover || p.img || '';
}

function getGallery(p) {
  if (Array.isArray(p.gallery) && p.gallery.length) return p.gallery;
  if (hasValue(p.cover)) return [p.cover];
  if (hasValue(p.img)) return [p.img];
  return [];
}

function getSpecs(p) {
  const specs = [];
  const tSuites  = (typeof HA_I18N !== 'undefined') ? HA_I18N.t('card_suites') : 'suítes';
  const tVagas   = (typeof HA_I18N !== 'undefined') ? HA_I18N.t('card_vagas')  : 'vagas';

  if (hasValue(p.privateArea)) specs.push(p.privateArea);
  if (hasValue(p.suites) && p.suites > 0) specs.push(`${p.suites} ${tSuites}`);
  if (hasValue(p.parking) && p.parking > 0) specs.push(`${p.parking} ${tVagas}`);

  if (!specs.length && Array.isArray(p.specs)) {
    return p.specs.filter(Boolean);
  }

  return specs;
}

function getFeatures(p) {
  return Array.isArray(p.features) ? p.features.filter(Boolean) : [];
}

function toggleMenu() {
  const panel = $('mobilePanel');
  if (!panel) return;
  const isOpen = panel.classList.toggle('open');
  document.body.style.overflow = isOpen ? 'hidden' : '';
  const btn = document.querySelector('.menu');
  if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function slide(id, dir) {
  const el = $(id);
  if (!el) return;

  el.scrollBy({
    left: dir * (el.clientWidth * 0.86),
    behavior: 'smooth'
  });
}

window.toggleMenu = toggleMenu;
window.slide = slide;

// Cache em memória para evitar múltiplas chamadas na mesma sessão de página
let _propertiesCache = null;
let _propertiesResolvers = [];
let _propertiesLoading = false;

async function getProperties() {
  // Cache em memória
  if (_propertiesCache) return _propertiesCache;

  // Se já está carregando, espera
  if (_propertiesLoading) {
    return new Promise(resolve => _propertiesResolvers.push(resolve));
  }

  _propertiesLoading = true;

  try {
    const props = await HA_API.fetchProperties();
    _propertiesCache = props;
    // Resolve todos que estavam esperando
    _propertiesResolvers.forEach(r => r(props));
    _propertiesResolvers = [];
    return props;
  } catch (err) {
    console.error('[HA] Falha ao carregar imóveis da API:', err);
    _propertiesResolvers.forEach(r => r([]));
    _propertiesResolvers = [];
    return [];
  } finally {
    _propertiesLoading = false;
  }
}

function favs() {
  return JSON.parse(localStorage.getItem(FAV) || '[]');
}

function saveFavs(list) {
  localStorage.setItem(FAV, JSON.stringify(list));
}

function isFav(id) {
  return favs().includes(Number(id));
}

function toggleFavorite(id, event) {
  if (event) event.stopPropagation();

  id = Number(id);

  let list = favs();
  list = list.includes(id)
    ? list.filter(item => item !== id)
    : [...list, id];

  saveFavs(list);

  document.querySelectorAll(`[data-fav="${id}"]`).forEach(button => {
    button.classList.toggle('active', list.includes(id));
  });

  if (window.renderFavorites) {
    window.renderFavorites();
  }
}

window.toggleFavorite = toggleFavorite;

function card(p, root = '') {
  const detailUrl = `${root}imoveis/detalhe.html?slug=${p.slug}`;
  const cover = getCover(p);
  const specs = getSpecs(p);

  return `
    <article class="property" onclick="location.href='${detailUrl}'">
      <button
        class="favorite ${isFav(p.id) ? 'active' : ''}"
        data-fav="${p.id}"
        onclick="toggleFavorite(${p.id}, event)"
      >
        ♡
      </button>

      ${hasValue(cover) ? `
        <div class="property-img">
          <img src="${cover}" alt="${p.title || 'Imóvel'}" loading="lazy" decoding="async" width="600" height="400">

          ${hasValue(p.tag) ? `<span class="tag">${p.tag}</span>` : ''}
          ${hasValue(p.region) ? `<span class="region-badge">${p.region}</span>` : ''}
        </div>
      ` : ''}

      <div class="property-body">
        ${hasValue(p.title) ? `<h3>${p.title}</h3>` : ''}

        ${hasValue(p.district) || hasValue(p.region) ? `
          <p class="loc">${[p.district, p.region].filter(Boolean).join(' · ')}</p>
        ` : ''}

        ${specs.length ? `
          <div class="specs">
            ${specs.map(spec => `<span class="spec">${spec}</span>`).join('')}
          </div>
        ` : ''}

        <div class="property-foot">
          ${hasValue(p.price) ? `
            <div class="price">
              <small data-i18n="card_value">Valor</small>
              <span data-price-brl="${p.price}">${
                (typeof HA_I18N !== 'undefined')
                  ? HA_I18N.formatPrice(p.price, HA_I18N.getLang())
                  : p.price
              }</span>
            </div>
          ` : ''}

          <a
            class="btn small"
            onclick="event.stopPropagation()"
            href="${detailUrl}"
          >
            Detalhes
          </a>
        </div>
      </div>
    </article>
  `;
}

function renderCarousel(id, items, root = '') {
  const el = $(id);
  if (!el) return;

  if (!items.length) {
    const section = el.closest('section');
    if (section) section.style.display = 'none';
    return;
  }

  el.innerHTML = items.map(p => card(p, root)).join('');
}

function renderMapList(props) {
  const list = $('mapList');
  const frame = $('mainMap');

  if (!list || !frame) return;

  const propertiesWithMap = props.filter(validCoordinates);

  if (!propertiesWithMap.length) {
    const mapSection = frame.closest('section');
    if (mapSection) mapSection.style.display = 'none';
    return;
  }

  function setMap(index) {
    const p = propertiesWithMap[index];

    if (!p) return;

    frame.src = mapUrl(p);

    list.querySelectorAll('.map-item').forEach(item => {
      item.classList.remove('active');
    });

    const activeItem = list.querySelector(`[data-index="${index}"]`);
    if (activeItem) activeItem.classList.add('active');
  }

  list.innerHTML = propertiesWithMap.map((p, index) => `
    <div class="map-item ${index === 0 ? 'active' : ''}" data-index="${index}">
      ${hasValue(p.title) ? `<b>${p.title}</b>` : ''}
      <span>${[p.district, (typeof HA_I18N !== 'undefined' ? HA_I18N.formatPrice(p.price, HA_I18N.getLang()) : p.price)].filter(Boolean).join(' · ')}</span>
    </div>
  `).join('');

  list.querySelectorAll('.map-item').forEach(item => {
    item.onclick = () => setMap(Number(item.dataset.index));
  });

  setMap(0);
}

async function initHome() {
  const props = await getProperties();

  const bcProps    = props.filter(p => p.regionSlug === 'balneario-camboriu');
  const bravaProps = props.filter(p => p.regionSlug === 'praia-brava');

  // Performance: a home é vitrine, não listagem completa.
  // Mostrar no máximo 8 imóveis por região aqui; o catálogo completo
  // fica em /imoveis.html. Isso evita centenas de cards no DOM inicial.
  const FEATURED_LIMIT = 8;
  const bcFeatured    = bcProps.slice(0, FEATURED_LIMIT);
  const bravaFeatured = bravaProps.slice(0, FEATURED_LIMIT);

  renderCarousel('bcCarousel',    bcFeatured);
  renderCarousel('bravaCarousel', bravaFeatured);
  // Mapa: mesmo recorte do destaque, para não gerar centenas de pins/itens
  renderMapList([...bcFeatured, ...bravaFeatured]);

  // Alimenta os region cards com fotos reais dos imóveis do banco
  applyRegionCardImages(bcProps,    'bc');
  applyRegionCardImages(bravaProps, 'brava');

  // Métricas usam o total real (não o recorte de destaque)
  if ($('metricProperties')) {
    $('metricProperties').textContent = String(props.length).padStart(2, '0');
  }

  if ($('metricAreas')) {
    $('metricAreas').textContent = String(
      [...new Set(props.map(p => p.area).filter(Boolean))].length
    ).padStart(2, '0');
  }
}

// Pega a foto de capa do primeiro imóvel com imagem e aplica no region card
function applyRegionCardImages(regionProps, cardId) {
  // Busca os primeiros imóveis com foto
  const withPhoto = regionProps.filter(p => p.cover || p.img);
  if (!withPhoto.length) return;

  // Pega até 3 fotos para criar um background dinâmico
  const photos = withPhoto.slice(0, 3).map(p => p.cover || p.img);

  // Encontra o region card pelo data-region ou pelo h3 dentro
  const cards = document.querySelectorAll('.region-card');
  let targetCard = null;

  cards.forEach(card => {
    const h3 = card.querySelector('h3');
    if (!h3) return;
    const text = h3.textContent.toLowerCase();
    if (cardId === 'bc' && (text.includes('balneário') || text.includes('balneario'))) {
      targetCard = card;
    }
    if (cardId === 'brava' && text.includes('praia brava')) {
      targetCard = card;
    }
  });

  if (!targetCard) return;

  // Aplica a foto — usa a primeira com melhor qualidade
  targetCard.style.setProperty('--bg', `url(${photos[0]})`);
}

async function initList(regionSlug = null) {
  const props = await getProperties();

  const initialList = regionSlug
    ? props.filter(p => p.regionSlug === regionSlug)
    : props;

  const grid = $('propertyGrid');

  function render(items) {
    if (grid) {
      grid.innerHTML = items.length
        ? items.map(p => card(p, '')).join('')
        : '<p class="section-sub">Nenhum imóvel encontrado.</p>';
    }

    if ($('resultCount')) {
      $('resultCount').textContent = `${items.length} imóvel(is) encontrado(s)`;
    }
  }

  function applyFilters() {
    let filtered = props;

    if (regionSlug) {
      filtered = filtered.filter(p => p.regionSlug === regionSlug);
    }

    const search = $('searchInput');
    const type = $('typeFilter');
    const region = $('regionFilter');

    if (search && search.value.trim()) {
      const q = search.value.toLowerCase();

      filtered = filtered.filter(p => {
        const text = [
          p.title,
          p.area,
          p.district,
          p.region,
          p.type,
          p.status
        ].filter(Boolean).join(' ').toLowerCase();

        return text.includes(q);
      });
    }

    if (type && type.value) {
      filtered = filtered.filter(p => p.type === type.value);
    }

    if (region && region.value) {
      filtered = filtered.filter(p => p.regionSlug === region.value);
    }

    render(filtered);
  }

  render(initialList);

  ['searchInput', 'typeFilter', 'regionFilter'].forEach(id => {
    const el = $(id);
    if (el) {
      el.addEventListener('input', applyFilters);
      el.addEventListener('change', applyFilters);
    }
  });
}

function switchMedia(name) {
  document.querySelectorAll('.media-tab').forEach(button => {
    button.classList.toggle('active', button.dataset.media === name);
  });

  document.querySelectorAll('.media-frame').forEach(frame => {
    frame.style.display = frame.dataset.frame === name ? 'block' : 'none';
  });
}

window.switchMedia = switchMedia;

async function initDetail() {
  const slug = new URLSearchParams(location.search).get('slug') || 'vitra-by-pininfarina';

  const props = await getProperties();
  const p = props.find(item => item.slug === slug) || props[0];

  if (!p) return;

  document.title = `${p.title || 'Imóvel'} — Heleno Alves`;

  setTextOrHide('detailTitle', p.title);
  setTextOrHide('detailTitleSide', p.title);
  setTextOrHide('detailLoc', [p.district, p.region].filter(Boolean).join(' · '));
  setTextOrHide('detailDesc', getDescription(p));
  setTextOrHide('detailPrice', p.price);

  const gallery = getGallery(p);

  if (gallery.length) {
    setHtmlOrHide(
      'detailGallery',
      gallery.map(img => `<img src="${img}" alt="${p.title || 'Imóvel'}">`).join('')
    );
  } else {
    hideElement('detailGallery');
  }

  const specs = [
    ['Área', p.privateArea || (Array.isArray(p.specs) ? p.specs[0] : '')],
    ['Suítes', p.suites || (Array.isArray(p.specs) ? p.specs[1] : '')],
    ['Vagas', p.parking || (Array.isArray(p.specs) ? p.specs[2] : '')],
    ['Status', p.status || (Array.isArray(p.specs) ? p.specs[3] : '')]
  ].filter(item => hasValue(item[1]));

  if (specs.length) {
    setHtmlOrHide(
      'detailSpecs',
      specs.map(([label, value]) => `
        <div class="detail-spec">
          <small>${label}</small>
          <b>${value}</b>
        </div>
      `).join('')
    );
  } else {
    hideElement('detailSpecs');
  }

  const features = getFeatures(p);

  if (features.length) {
    setHtmlOrHide(
      'detailFeatures',
      features.map(feature => `<span class="feature">${feature}</span>`).join('')
    );
  } else {
    hideElement('detailFeatures');
  }

  setupMediaSection(p);

  if ($('waDetail')) {
    if (hasValue(p.title)) {
      $('waDetail').href = `https://wa.me/5585988085349?text=Ol%C3%A1%2C%20Heleno.%20Quero%20informa%C3%A7%C3%B5es%20sobre%20${encodeURIComponent(p.title)}.`;
      $('waDetail').style.display = '';
    } else {
      hideElement('waDetail');
    }
  }

  if ($('openMaps')) {
    if (validCoordinates(p)) {
      $('openMaps').href = openMapUrl(p);
      $('openMaps').style.display = '';
    } else {
      hideElement('openMaps');
    }
  }

  if ($('favoriteDetail')) {
    $('favoriteDetail').classList.toggle('active', isFav(p.id));
    $('favoriteDetail').onclick = (event) => toggleFavorite(p.id, event);
  }

  const similar = props
    .filter(item => item.id !== p.id && item.region === p.region)
    .slice(0, 4);

  if (similar.length) {
    renderCarousel('similarCarousel', similar, '../');
  } else {
    const similarSection = $('similarCarousel')?.closest('section');
    if (similarSection) similarSection.style.display = 'none';
  }
}

function setupMediaSection(p) {
  const mediaTabs = document.querySelector('.media-tabs');

  const mapFrame = $('mapFrame');
  const streetFrame = $('streetFrame');
  const videoFrame = $('videoFrame');
  const tourFrame = $('tourFrame');

  const mapContainer = document.querySelector('[data-frame="map"]');
  const streetContainer = document.querySelector('[data-frame="street"]');
  const videoContainer = document.querySelector('[data-frame="video"]');
  const tourContainer = document.querySelector('[data-frame="tour"]');

  const hasMap = validCoordinates(p);
  const hasStreet = hasValue(p.streetViewUrl) || p.hasStreetView === true;
  const hasVideo = hasValue(p.video);
  const hasTour = hasValue(p.tourUrl);

  const tabs = [];

  if (hasMap) {
    tabs.push({
      key: 'map',
      label: 'Mapa'
    });
  }

  if (hasStreet) {
    tabs.push({
      key: 'street',
      label: 'Entorno'
    });
  }

  if (hasVideo) {
    tabs.push({
      key: 'video',
      label: 'Vídeo'
    });
  }

  if (hasTour) {
    tabs.push({
      key: 'tour',
      label: 'Tour 360'
    });
  }

  if (!tabs.length) {
    const mediaSection = mediaTabs?.closest('section');
    if (mediaSection) mediaSection.style.display = 'none';
    return;
  }

  if (mediaTabs) {
    mediaTabs.innerHTML = tabs.map((tab, index) => `
      <button
        class="media-tab ${index === 0 ? 'active' : ''}"
        data-media="${tab.key}"
        onclick="switchMedia('${tab.key}')"
      >
        ${tab.label}
      </button>
    `).join('');
  }

  if (hasMap && mapFrame && mapContainer) {
    mapFrame.src = mapUrl(p);
  } else if (mapContainer) {
    mapContainer.remove();
  }

  if (hasStreet && streetFrame && streetContainer) {
    streetFrame.src = p.streetViewUrl || streetUrl(p);
  } else if (streetContainer) {
    streetContainer.remove();
  }

  if (hasVideo && videoFrame && videoContainer) {
    const videoValue = p.video;

    if (
      typeof videoValue === 'string' &&
      (
        videoValue.endsWith('.mp4') ||
        videoValue.endsWith('.webm') ||
        videoValue.endsWith('.ogg')
      )
    ) {
      videoFrame.innerHTML = `
        <video src="${videoValue}" controls style="width:100%;height:100%;object-fit:cover"></video>
      `;
    } else {
      videoFrame.innerHTML = `
        <img src="${videoValue}" alt="Vídeo do imóvel">
        <div class="play">▶</div>
      `;
    }
  } else if (videoContainer) {
    videoContainer.remove();
  }

  if (hasTour && tourFrame && tourContainer) {
    tourFrame.src = p.tourUrl;
  } else if (tourContainer) {
    tourContainer.remove();
  }

  switchMedia(tabs[0].key);
}

async function initFav() {
  const props = await getProperties();

  window.renderFavorites = function () {
    const list = favs();
    const grid = $('favoritesGrid');

    if (!grid) return;

    const filtered = props.filter(p => list.includes(p.id));

    grid.innerHTML = filtered.length
      ? filtered.map(p => card(p, '../')).join('')
      : '<p class="section-sub">Você ainda não favoritou nenhum imóvel.</p>';
  };

  window.renderFavorites();
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  if (page === 'home') initHome();
  // 'imoveis' é gerenciado pelo imoveis.js com filtros avançados — app.js não interfere
  if (page === 'bc') initList('balneario-camboriu');
  if (page === 'brava') initList('praia-brava');
  // 'detail' é gerenciado pelo property-detail.js — app.js não interfere
  // 'favorites' é gerenciado pelo usuario-favoritos.js — app.js não interfere
});

/* ─── Header blur ao rolar ──────────────────────────────────────── */
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();