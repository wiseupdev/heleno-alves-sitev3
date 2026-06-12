(function () {
  const $ = (id) => document.getElementById(id);

  let properties = [];
  let favoriteItems = [];
  let currentPage = 1;

  const perPage = 6;

  const fallbackProperties = [
    {
      id: 1,
      slug: 'vitra-by-pininfarina',
      title: 'Vitra by Pininfarina',
      region: 'BC',
      district: 'Barra Sul',
      loc: 'Barra Sul · Balneário Camboriú',
      tag: 'Frente Mar',
      price: 'Sob consulta',
      img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&q=82&auto=format&fit=crop',
      specs: ['320 m²', '4 suítes', '4 vagas', 'Vista mar']
    },
    {
      id: 2,
      slug: 'one-tower-residence',
      title: 'One Tower Residence',
      region: 'BC',
      district: 'Centro',
      loc: 'Centro · Balneário Camboriú',
      tag: 'Cobertura',
      price: 'R$ 12.500.000',
      img: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=900&q=82&auto=format&fit=crop',
      specs: ['540 m²', '5 suítes', '5 vagas', 'Triplex']
    },
    {
      id: 3,
      slug: 'brava-ocean-house',
      title: 'Brava Ocean House',
      region: 'Praia Brava',
      district: 'Brava Norte',
      loc: 'Brava Norte · Praia Brava',
      tag: 'Vista Mar',
      price: 'R$ 6.900.000',
      img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=82&auto=format&fit=crop',
      specs: ['240 m²', '4 suítes', '3 vagas', 'Vista mar']
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

  function getFavorites() {
    return JSON.parse(localStorage.getItem('heleno_favorites') || '[]');
  }

  function saveFavorites(ids) {
    localStorage.setItem('heleno_favorites', JSON.stringify(ids));
  }

  function getImage(item) {
    return item.cover?.previewUrl || item.cover || item.img || item.image || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&q=82&auto=format&fit=crop';
  }

  function getSpecs(item) {
    if (Array.isArray(item.specs)) return item.specs;

    const specs = [
      item.privateArea || item.area,
      item.suites ? `${item.suites} suítes` : '',
      item.parking ? `${item.parking} vagas` : ''
    ];

    return specs.filter(Boolean);
  }

  function getLocation(item) {
    return item.loc || [item.district, item.region].filter(Boolean).join(' · ') || 'Localização sob consulta';
  }

  function getDetailUrl(item) {
    const slug = item.slug || slugify(item.title);

    return `../imoveis/detalhe.html?slug=${slug}`;
  }

  async function loadProperties() {
    try {
      // Busca real no Postgres via webhook N8n
      const data = await HA_API.fetchProperties();
      properties = Array.isArray(data) ? data : [];
    } catch (error) {
      properties = fallbackProperties;
    }

    const adminProperties = JSON.parse(localStorage.getItem('admin_properties_list') || '[]');

    if (adminProperties.length) {
      properties = [...adminProperties, ...properties];
    }

    properties = properties.map((item, index) => ({
      ...item,
      id: item.id || index + 1,
      slug: item.slug || slugify(item.title)
    }));
  }

  function buildFavoriteItems() {
    const favoriteIds = getFavorites().map(String);

    favoriteItems = properties.filter((item) => {
      const id = String(item.id);
      const slug = String(item.slug || slugify(item.title));

      return favoriteIds.includes(id) || favoriteIds.includes(slug);
    });
  }

  function getPaginatedItems() {
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;

    return favoriteItems.slice(start, end);
  }

  function renderFavorites() {
    const grid = $('favoritesGrid');
    const emptyState = $('emptyState');
    const resultText = $('resultText');
    const favoriteCountSidebar = $('favoriteCountSidebar');

    if (!grid) return;

    const total = favoriteItems.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const pageItems = getPaginatedItems();

    if (favoriteCountSidebar) {
      favoriteCountSidebar.textContent = `${total} favorito(s)`;
    }

    if (resultText) {
      resultText.textContent = `${total} imóvel(is) salvo(s)`;
    }

    if (!pageItems.length) {
      grid.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      renderPagination(totalPages);
      return;
    }

    if (emptyState) {
      emptyState.style.display = 'none';
    }

    grid.innerHTML = pageItems.map((item) => `
      <article class="favorite-card">
        <div class="favorite-image">
          <img src="${getImage(item)}" alt="${escapeText(item.title)}">
          <span class="favorite-tag">${escapeText(item.tag || item.status || 'Favorito')}</span>
        </div>

        <div class="favorite-body">
          <h3>${escapeText(item.title || 'Imóvel sem nome')}</h3>
          <p class="favorite-location">${escapeText(getLocation(item))}</p>

          <div class="favorite-specs">
            ${getSpecs(item).map((spec) => `
              <span class="favorite-spec">${escapeText(spec)}</span>
            `).join('')}
          </div>

          <div class="favorite-price">${escapeText(item.price || 'Sob consulta')}</div>

          <div class="favorite-actions">
            <a class="action-btn" href="${getDetailUrl(item)}">Ver detalhes</a>
            <a class="action-btn" href="https://wa.me/5585988085349" target="_blank">WhatsApp</a>
            <button class="action-btn danger" type="button" data-id="${item.id}" data-slug="${item.slug}">
              Remover
            </button>
          </div>
        </div>
      </article>
    `).join('');

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    const pageInfo = $('pageInfo');
    const prevPage = $('prevPage');
    const nextPage = $('nextPage');

    if (pageInfo) {
      pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    }

    if (prevPage) {
      prevPage.disabled = currentPage <= 1;
    }

    if (nextPage) {
      nextPage.disabled = currentPage >= totalPages;
    }
  }

  function changePage(direction) {
    const totalPages = Math.max(1, Math.ceil(favoriteItems.length / perPage));

    currentPage += direction;

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    renderFavorites();
  }

  function removeFavorite(id, slug) {
    const favorites = getFavorites().map(String);

    const updatedFavorites = favorites.filter((item) => {
      return item !== String(id) && item !== String(slug);
    });

    saveFavorites(updatedFavorites);

    buildFavoriteItems();
    renderFavorites();
  }

  function handleGridClick(event) {
    const button = event.target.closest('[data-id]');

    if (!button) return;

    removeFavorite(button.dataset.id, button.dataset.slug);
  }

  function bindEvents() {
    $('prevPage')?.addEventListener('click', () => changePage(-1));
    $('nextPage')?.addEventListener('click', () => changePage(1));
    $('favoritesGrid')?.addEventListener('click', handleGridClick);
  }

  async function initFavorites() {
    bindEvents();

    await loadProperties();

    buildFavoriteItems();
    renderFavorites();
  }

  document.addEventListener('DOMContentLoaded', initFavorites);
})();