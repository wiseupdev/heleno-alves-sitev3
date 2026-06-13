(function () {
  const page = document.body.dataset.page;

  if (page !== 'detail') return;

  const $ = (id) => document.getElementById(id);

  let properties = [];
  let currentProperty = null;

  const fallbackProperties = [
    {
      id: 1,
      slug: 'vitra-by-pininfarina',
      title: 'Vitra by Pininfarina',
      region: 'BC',
      district: 'Barra Sul',
      type: 'Apartamento',
      status: 'Exclusivo',
      tag: 'Frente Mar',
      price: 'Sob consulta',
      description: 'Empreendimento de assinatura internacional com vista permanente para o Atlântico e leitura arquitetônica icônica.',
      img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1400&q=84&auto=format&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1400&q=84&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1400&q=84&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1400&q=84&auto=format&fit=crop'
      ],
      specs: ['320 m²', '4 suítes', '4 vagas', 'Vista mar'],
      features: ['Frente mar', 'Alto andar', 'Arquitetura assinada', 'Lazer premium'],
      lat: -26.9929,
      lng: -48.6352
    }
  ];

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function escapeText(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function hasValue(value) {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    return String(value).trim() !== '';
  }

  function hideElement(element) {
    if (element) element.classList.add('hidden');
  }

  function showElement(element) {
    if (element) element.classList.remove('hidden');
  }

  function normalizeRegion(region) {
    if (!region) return '';

    if (region === 'BC') return 'Balneário Camboriú';

    return region;
  }

  function getParam(name) {
    const params = new URLSearchParams(window.location.search);

    return params.get(name);
  }

  function getImage(item) {
    return item.cover?.previewUrl ||
      item.cover ||
      item.img ||
      item.image ||
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1400&q=84&auto=format&fit=crop';
  }

  function getGallery(item) {
    const gallery = Array.isArray(item.gallery) ? item.gallery : [];
    const images = gallery.length ? gallery : [getImage(item)];

    return images.filter(Boolean);
  }

  function getLocation(item) {
    return item.loc ||
      [item.district, normalizeRegion(item.region)].filter(Boolean).join(' · ') ||
      '';
  }

  function getDescription(item) {
    return item.description || item.desc || '';
  }

  function getSpecs(item) {
    const tSuites = (typeof HA_I18N !== 'undefined') ? HA_I18N.t('card_suites') : 'suítes';
    const tVagas  = (typeof HA_I18N !== 'undefined') ? HA_I18N.t('card_vagas')  : 'vagas';
    const skip    = new Set(['active','ativo','inactive','vendido','oculto','reservado','pronto','em obra','exclusivo']);

    if (Array.isArray(item.specs)) {
      return item.specs.filter(s => s && !skip.has(String(s).toLowerCase().trim()));
    }

    return [
      item.privateArea || item.area,
      item.suites  > 0 ? `${item.suites} ${tSuites}`  : '',
      item.parking > 0 ? `${item.parking} ${tVagas}` : '',
    ].filter(Boolean);
  }

  function validCoordinates(item) {
    const lat = Number(item.lat);
    const lng = Number(item.lng);

    return Number.isFinite(lat) && Number.isFinite(lng);
  }

  function getMapUrl(item) {
    if (hasValue(item.mapUrl)) return item.mapUrl;

    if (validCoordinates(item)) {
      return `https://www.google.com/maps?q=${item.lat},${item.lng}&z=15&output=embed`;
    }

    return '';
  }

  function getStreetUrl(item) {
    if (hasValue(item.streetViewUrl)) return item.streetViewUrl;

    if (item.hasStreetView && validCoordinates(item)) {
      return `https://www.google.com/maps?q=&layer=c&cbll=${item.lat},${item.lng}&cbp=11,0,0,0,0&output=svembed`;
    }

    return '';
  }

  function getTourUrl(item) {
    return item.tourUrl || item.tour360 || item.virtualTour || '';
  }

  function getVideoUrl(item) {
    return item.videoUrl || item.video || '';
  }

  function getFavorites() {
    return JSON.parse(localStorage.getItem('heleno_favorites') || '[]').map(String);
  }

  function saveFavorites(favorites) {
    localStorage.setItem('heleno_favorites', JSON.stringify(favorites));
  }

  function isFavorite(item) {
    const favorites = getFavorites();
    const id = String(item.id);
    const slug = String(item.slug || slugify(item.title));

    return favorites.includes(id) || favorites.includes(slug);
  }

  function updateFavoriteButton() {
    const button = $('favoriteDetail');

    if (!button || !currentProperty) return;

    const active = isFavorite(currentProperty);

    button.classList.toggle('active', active);
    button.textContent = active ? '★' : '♡';
  }

  function toggleFavorite() {
    if (!currentProperty) return;

    const favorites = getFavorites();
    const id = String(currentProperty.id);
    const slug = String(currentProperty.slug || slugify(currentProperty.title));

    let updatedFavorites;

    if (favorites.includes(id) || favorites.includes(slug)) {
      updatedFavorites = favorites.filter((value) => value !== id && value !== slug);
    } else {
      updatedFavorites = [...favorites, id];
    }

    saveFavorites(updatedFavorites);
    updateFavoriteButton();
  }

  function getWhatsappLink(item) {
    const lang = (typeof HA_I18N !== 'undefined') ? HA_I18N.getLang() : 'pt';
    const name = item.title || '';
    const region = item.region || item.city || '';

    // Mensagens fixas por idioma — sem dependência de estado externo
    const messages = {
      pt: `Olá, Heleno. Tenho interesse no imóvel ${name}${region ? ', em ' + region : ''}. Gostaria de receber mais informações.`,
      en: `Hello, Heleno. I am interested in the property ${name}${region ? ', in ' + region : ''}. I would like to receive more information.`,
      es: `¡Hola Heleno! Estoy interesado en la propiedad: ${name}. ¿Puede darme más información?`,
      fr: `Bonjour Heleno ! Je suis intéressé par la propriété : ${name}. Pouvez-vous me donner plus d'informations ?`,
    };

    const message = encodeURIComponent(messages[lang] || messages.pt);
    return `https://wa.me/5585988085349?text=${message}`;
  }

  // Retorna o link atualizado com o idioma atual no momento da chamada
  function getCurrentWaLink() {
    if (!window._haCurrentProperty) return 'https://wa.me/5585988085349';
    return getWhatsappLink(window._haCurrentProperty);
  }

  async function loadProperties() {
    try {
      // Busca real no Postgres via webhook N8n
      const data = await HA_API.fetchProperties();
      properties = Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('[HA] property-detail.js — falha na API, usando fallback:', error);
      properties = fallbackProperties;
    }

    // Garante id e slug em todos os itens
    properties = properties.map((item, index) => ({
      ...item,
      id:     item.id     || index + 1,
      slug:   item.slug   || slugify(item.title),
      status: item.status || 'Ativo'
    }));
  }

  function findProperty() {
    const slugParam = getParam('slug');
    const idParam = getParam('id');

    if (slugParam) {
      return properties.find((item) => String(item.slug || slugify(item.title)) === String(slugParam));
    }

    if (idParam) {
      return properties.find((item) => String(item.id) === String(idParam));
    }

    return properties[0];
  }

  function renderNotFound() {
    if ($('detailTitle')) $('detailTitle').textContent = 'Imóvel não encontrado';
    if ($('detailLoc')) $('detailLoc').textContent = 'Volte ao portfólio para escolher outro imóvel.';

    hideElement($('visualSection'));
    hideElement($('similarSection'));
    hideElement(document.querySelector('.detail-panel'));
  }

  function renderHero(item) {
    const hero = $('detailHero');

    if (hero) {
      hero.style.setProperty('--detail-bg', `url("${getImage(item)}")`);
    }

    if ($('detailTitle')) $('detailTitle').textContent = item.title || 'Imóvel';
    if ($('detailLoc')) $('detailLoc').textContent = getLocation(item);
  }

  function renderGallery(item) {
    const container = $('detailGallery');

    if (!container) return;

    const images = getGallery(item);

    if (!images.length) {
      hideElement(container);
      return;
    }

    container.innerHTML = images.slice(0, 5).map((image, index) => `
      <div class="gallery-item gallery-clickable" data-gallery-idx="${index}">
        <img loading="lazy" src="${image}" alt="${escapeText(item.title || 'Imóvel')} ${index + 1}">
      </div>
    `).join('');

    // Abre galeria fullscreen ao clicar
    const allImages = images;
    container.querySelectorAll('[data-gallery-idx]').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.galleryIdx, 10) || 0;
        if (typeof HA_GALLERY !== 'undefined') HA_GALLERY.open(allImages, idx);
      });
    });

    // Botão "Ver galeria completa" se houver mais de 5 fotos
    if (images.length > 1) {
      let btn = document.getElementById('viewFullGallery');
      if (!btn) {
        btn = document.createElement('button');
        btn.id = 'viewFullGallery';
        btn.type = 'button';
        btn.className = 'btn view-gallery-btn';
        container.parentNode.appendChild(btn);
      }
      const lang = (typeof HA_I18N !== 'undefined') ? HA_I18N.getLang() : 'pt';
      const labels = {
        pt: 'Ver galeria completa (' + images.length + ')',
        en: 'View full gallery (' + images.length + ')',
        es: 'Ver galería completa (' + images.length + ')',
        fr: 'Voir toute la galerie (' + images.length + ')',
      };
      btn.textContent = labels[lang] || labels.pt;
      btn.onclick = () => {
        if (typeof HA_GALLERY !== 'undefined') HA_GALLERY.open(allImages, 0);
      };
    }

    // Hero também abre galeria
    const hero = $('detailHero');
    if (hero) {
      hero.classList.add('gallery-clickable');
      hero.style.cursor = 'zoom-in';
      hero.addEventListener('click', () => {
        if (typeof HA_GALLERY !== 'undefined') HA_GALLERY.open(allImages, 0);
      });
    }
  }

  function renderPanel(item) {
    if ($('detailTitleSide')) $('detailTitleSide').textContent = item.title || 'Ficha';
    if ($('detailDesc')) $('detailDesc').textContent = getDescription(item);

    if (!hasValue(getDescription(item))) {
      hideElement($('detailDesc'));
    }

    const specs = getSpecs(item);
    const specsContainer = $('detailSpecs');

    if (specsContainer) {
      if (!specs.length) {
        hideElement(specsContainer);
      } else {
        specsContainer.innerHTML = specs.map((spec, index) => `
          <div class="detail-spec">
            <small>${index + 1 < 10 ? '0' + (index + 1) : index + 1}</small>
            <b>${escapeText(spec)}</b>
          </div>
        `).join('');
      }
    }

    const features = Array.isArray(item.features) ? item.features : [];
    const featuresContainer = $('detailFeatures');

    if (featuresContainer) {
      if (!features.length) {
        hideElement(featuresContainer);
      } else {
        const flang = (typeof HA_I18N !== 'undefined') ? HA_I18N.getLang() : 'pt';
        featuresContainer.innerHTML = features.map((feature) => {
          const label = (typeof HA_FEATURES !== 'undefined')
            ? HA_FEATURES.translate(feature, flang) : feature;
          return `<span class="feature-chip" data-feature-raw="${escapeText(feature)}">${escapeText(label)}</span>`;
        }).join('');
      }
    }

    if ($('detailPrice')) {
      const priceFormatted = (typeof HA_I18N !== 'undefined')
        ? HA_I18N.formatPrice(item.price, HA_I18N.getLang())
        : (item.price || 'Sob consulta');
      $('detailPrice').textContent = priceFormatted;
      // Guarda o preço bruto para re-converter ao trocar idioma
      $('detailPrice').dataset.priceBrl = item.price || '';
    }

    const wa = getWhatsappLink(item);

    // Guarda o imóvel atual — link gerado no momento do clique
    window._haCurrentProperty = item;

    const openWa = (e) => {
      e.preventDefault();
      // Lê idioma atual no momento do clique — sempre correto
      window.open(getCurrentWaLink(), '_blank');
    };

    if ($('waDetail')) {
      $('waDetail').removeAttribute('href');
      $('waDetail').onclick = openWa;
    }
    if ($('heroWaDetail')) {
      $('heroWaDetail').removeAttribute('href');
      $('heroWaDetail').onclick = openWa;
    }
    if ($('stickyWaDetail')) {
      $('stickyWaDetail').removeAttribute('href');
      $('stickyWaDetail').onclick = openWa;
    }
  }

  function setupMediaSection(item) {
    const visualSection = $('visualSection');
    const tabsContainer = $('mediaTabs');
    const frames = document.querySelectorAll('.media-frame');

    if (!tabsContainer) return;

    const mediaItems = [];

    const mapUrl = getMapUrl(item);
    const streetUrl = getStreetUrl(item);
    const videoUrl = getVideoUrl(item);
    const tourUrl = getTourUrl(item);

    if (hasValue(mapUrl)) {
      mediaItems.push({
        key: 'map',
        label: 'Mapa',
        url: mapUrl
      });
    }

    if (hasValue(streetUrl)) {
      mediaItems.push({
        key: 'street',
        label: 'Entorno',
        url: streetUrl
      });
    }

    if (hasValue(videoUrl)) {
      mediaItems.push({
        key: 'video',
        label: 'Vídeo',
        url: videoUrl
      });
    }

    if (hasValue(tourUrl)) {
      mediaItems.push({
        key: 'tour',
        label: 'Tour 360',
        url: tourUrl
      });
    }

    if (!mediaItems.length) {
      hideElement(visualSection);
      return;
    }

    showElement(visualSection);

    tabsContainer.innerHTML = mediaItems.map((item, index) => `
      <button 
        class="media-tab ${index === 0 ? 'active' : ''}" 
        type="button" 
        data-media="${item.key}"
      >
        ${item.label}
      </button>
    `).join('');

    frames.forEach((frame) => {
      frame.classList.remove('active');

      const key = frame.dataset.frame;
      const media = mediaItems.find((item) => item.key === key);

      if (!media) {
        hideElement(frame);
        return;
      }

      showElement(frame);

      if (key === 'map' && $('mapFrame')) {
        $('mapFrame').src = media.url;
      }

      if (key === 'street' && $('streetFrame')) {
        $('streetFrame').src = media.url;
      }

      if (key === 'tour' && $('tourFrame')) {
        $('tourFrame').src = media.url;
      }

      if (key === 'video') {
        const videoFrame = $('videoFrame');

        if (videoFrame) {
          const url = media.url || '';
          if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')) {
            videoFrame.innerHTML = `<video src="${url}" controls style="width:100%;height:100%;object-fit:cover"></video>`;
          } else {
            videoFrame.style.backgroundImage = `url("${url}")`;
          }
        }
      }
    });

    const firstKey = mediaItems[0].key;
    const firstFrame = document.querySelector(`[data-frame="${firstKey}"]`);

    if (firstFrame) {
      firstFrame.classList.add('active');
    }
  }

  function switchMedia(event) {
    const button = event.target.closest('[data-media]');

    if (!button) return;

    const key = button.dataset.media;

    document.querySelectorAll('.media-tab').forEach((tab) => {
      tab.classList.toggle('active', tab === button);
    });

    document.querySelectorAll('.media-frame').forEach((frame) => {
      frame.classList.toggle('active', frame.dataset.frame === key);
    });
  }

  function renderSimilar(item) {
    const section = $('similarSection');
    const container = $('similarCarousel');

    if (!container) return;

    const similar = properties
      .filter((property) => {
        if (String(property.id) === String(item.id)) return false;

        const sameRegion = normalizeRegion(property.region) === normalizeRegion(item.region);
        const sameType = property.type && item.type && property.type === item.type;
        const sameTag = property.tag && item.tag && property.tag === item.tag;

        return sameRegion || sameType || sameTag;
      })
      .filter((property) => property.status !== 'Oculto' && property.status !== 'Vendido')
      .slice(0, 8);

    if (!similar.length) {
      hideElement(section);
      return;
    }

    container.innerHTML = similar.map((property) => {
      const slug = property.slug || slugify(property.title);

      return `
        <article class="similar-card">
          <div class="similar-img">
            <img loading="lazy" src="${getImage(property)}" alt="${escapeText(property.title)}">
          </div>

          <div class="similar-body">
            <h3>${escapeText(property.title || 'Imóvel')}</h3>
            <p class="similar-loc">${escapeText(getLocation(property))}</p>

            <div class="similar-foot">
              <div class="similar-price" data-price-brl="${escapeText(property.price || '')}">${
                (typeof HA_I18N !== 'undefined')
                  ? HA_I18N.formatPrice(property.price, HA_I18N.getLang())
                  : escapeText(property.price || 'Sob consulta')
              }</div>
              <a class="btn small" href="detalhe.html?slug=${slug}" data-i18n="card_details">Detalhes</a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function slideCarousel(id, direction) {
    const element = $(id);

    if (!element) return;

    element.scrollBy({
      left: direction * (element.clientWidth * 0.86),
      behavior: 'smooth'
    });
  }

  function bindEvents() {
    $('favoriteDetail')?.addEventListener('click', toggleFavorite);
    $('mediaTabs')?.addEventListener('click', switchMedia);

    document.querySelectorAll('[data-slide]').forEach((button) => {
      button.addEventListener('click', () => {
        slideCarousel(button.dataset.slide, Number(button.dataset.dir || 1));
      });
    });
  }

  async function initDetail() {
    bindEvents();

    await loadProperties();

    currentProperty = findProperty();

    if (!currentProperty) {
      renderNotFound();
      return;
    }

    document.title = `${currentProperty.title || 'Imóvel'} — Heleno Alves`;

    renderHero(currentProperty);
    renderGallery(currentProperty);
    renderPanel(currentProperty);
    setupMediaSection(currentProperty);
    renderSimilar(currentProperty);
    updateFavoriteButton();
  }

  document.addEventListener('DOMContentLoaded', initDetail);

  // O link do WhatsApp é gerado dinamicamente no onclick
  // portanto não precisa de listener de mudança de idioma
})();

/* ─── Re-traduz features ao trocar idioma ──────────────────────── */
window.addEventListener('ha:langchange', function () {
  const lang = (typeof HA_I18N !== 'undefined') ? HA_I18N.getLang() : 'pt';
  document.querySelectorAll('[data-feature-raw]').forEach(function (el) {
    const raw = el.dataset.featureRaw;
    el.textContent = (typeof HA_FEATURES !== 'undefined')
      ? HA_FEATURES.translate(raw, lang) : raw;
  });
});