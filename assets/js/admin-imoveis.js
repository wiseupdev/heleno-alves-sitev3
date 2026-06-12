(function () {
  const $ = (id) => document.getElementById(id);

  let properties = [];
  let filteredProperties = [];
  let currentPage = 1;

  const perPage = 6;

  const fallbackProperties = [
    {
      id: 1,
      title: 'Vitra by Pininfarina',
      slug: 'vitra-by-pininfarina',
      region: 'BC',
      district: 'Barra Sul',
      type: 'Apartamento',
      status: 'Exclusivo',
      price: 'Sob consulta',
      area: '320 m²',
      suites: 4,
      parking: 4,
      img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&q=82&auto=format&fit=crop'
    },
    {
      id: 2,
      title: 'One Tower Residence',
      slug: 'one-tower-residence',
      region: 'BC',
      district: 'Centro',
      type: 'Cobertura',
      status: 'Pronto',
      price: 'R$ 12.500.000',
      area: '540 m²',
      suites: 5,
      parking: 5,
      img: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=900&q=82&auto=format&fit=crop'
    },
    {
      id: 3,
      title: 'Skyline Private',
      slug: 'skyline-private',
      region: 'BC',
      district: 'Barra Norte',
      type: 'Lançamento',
      status: 'Em obra',
      price: 'R$ 4.200.000',
      area: '188 m²',
      suites: 3,
      parking: 3,
      img: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=900&q=82&auto=format&fit=crop'
    },
    {
      id: 4,
      title: 'Brava Ocean House',
      slug: 'brava-ocean-house',
      region: 'Praia Brava',
      district: 'Brava Norte',
      type: 'Apartamento',
      status: 'Exclusivo',
      price: 'R$ 6.900.000',
      area: '240 m²',
      suites: 4,
      parking: 3,
      img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=82&auto=format&fit=crop'
    },
    {
      id: 5,
      title: 'Brava Front Sea',
      slug: 'brava-front-sea',
      region: 'Praia Brava',
      district: 'Orla',
      type: 'Apartamento',
      status: 'Exclusivo',
      price: 'Sob consulta',
      area: '290 m²',
      suites: 4,
      parking: 4,
      img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&q=82&auto=format&fit=crop'
    },
    {
      id: 6,
      title: 'The Brava Collection',
      slug: 'the-brava-collection',
      region: 'Praia Brava',
      district: 'Brava Sul',
      type: 'Boutique',
      status: 'Lançamento',
      price: 'R$ 3.950.000',
      area: '176 m²',
      suites: 3,
      parking: 2,
      img: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=900&q=82&auto=format&fit=crop'
    },
    {
      id: 7,
      title: 'Casa Reserva Brava',
      slug: 'casa-reserva-brava',
      region: 'Praia Brava',
      district: 'Condomínio',
      type: 'Casa',
      status: 'Pronto',
      price: 'R$ 9.400.000',
      area: '420 m²',
      suites: 5,
      parking: 4,
      img: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=900&q=82&auto=format&fit=crop'
    }
  ];

  function escapeText(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function getStorageArray(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function normalizeRegion(region) {
    if (!region) return '';

    if (region === 'BC') return 'Balneário Camboriú';

    return region;
  }

  function normalizeRegionForStorage(region) {
    if (!region) return '';

    if (
      region === 'Balneário Camboriú' ||
      region === 'Balneario Camboriu' ||
      region === 'balneario-camboriu'
    ) {
      return 'BC';
    }

    if (region === 'praia-brava') {
      return 'Praia Brava';
    }

    return region;
  }

  function getImage(item) {
    return item.cover?.previewUrl ||
      item.cover ||
      item.img ||
      item.image ||
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&q=82&auto=format&fit=crop';
  }

  function getArea(item) {
    return item.privateArea || item.area || '-';
  }

  function getStatus(item) {
    return item.status || 'Ativo';
  }

  function getPrice(item) {
    return item.price || 'Sob consulta';
  }

  function getLocation(item) {
    return item.loc ||
      [item.district, normalizeRegion(item.region)].filter(Boolean).join(' · ') ||
      'Localização sob consulta';
  }

  function getSpecs(item) {
    if (Array.isArray(item.specs) && item.specs.length) {
      return item.specs;
    }

    return [
      getArea(item),
      item.suites ? `${item.suites} suítes` : '',
      item.parking ? `${item.parking} vagas` : '',
      getStatus(item)
    ].filter(Boolean);
  }

  function normalizeProperty(item, index) {
    const title = item.title || item.name || 'Imóvel sem nome';
    const id = item.id || Date.now() + index;

    return {
      ...item,
      id,
      title,
      slug: item.slug || slugify(title),
      region: normalizeRegionForStorage(item.region || 'BC'),
      district: item.district || '',
      type: item.type || item.tag || 'Imóvel',
      status: item.status || 'Ativo',
      price: item.price || 'Sob consulta',
      area: item.area || item.privateArea || '',
      privateArea: item.privateArea || item.area || '',
      suites: item.suites || '',
      parking: item.parking || '',
      img: getImage(item),
      specs: getSpecs(item),
      loc: item.loc || getLocation(item),
      updatedAt: item.updatedAt || item.createdAt || new Date().toISOString()
    };
  }

  function saveProperties() {
    const normalized = properties.map(normalizeProperty);

    properties = normalized;

    localStorage.setItem('admin_properties_list', JSON.stringify(properties));
  }

  function loadDraftProperties() {
    const drafts = getStorageArray('admin_properties_draft');

    return drafts.map((item, index) => {
      return normalizeProperty({
        ...item,
        id: item.id || Date.now() + index,
        status: item.status || 'Ativo'
      }, index);
    });
  }

  async function loadPublicJsonProperties() {
    try {
      // Busca real no Postgres via webhook N8n
      const data = await HA_API.fetchProperties();
      const list = Array.isArray(data) ? data : [];

      return list.map(normalizeProperty);
    } catch (error) {
      return fallbackProperties.map(normalizeProperty);
    }
  }

  async function loadProperties() {
    const saved = getStorageArray('admin_properties_list');

    if (saved.length) {
      properties = saved.map(normalizeProperty);
      saveProperties();
      return;
    }

    const jsonProperties = await loadPublicJsonProperties();
    const drafts = loadDraftProperties();

    const merged = [...drafts, ...jsonProperties];

    const unique = [];

    merged.forEach((item) => {
      const exists = unique.some((property) => {
        return String(property.id) === String(item.id) || property.slug === item.slug;
      });

      if (!exists) {
        unique.push(item);
      }
    });

    properties = unique.length ? unique : fallbackProperties.map(normalizeProperty);

    saveProperties();
  }

  function applyFilters() {
    const search = $('searchInput')?.value.trim().toLowerCase() || '';
    const region = $('regionFilter')?.value || 'Todos';
    const status = $('statusFilter')?.value || 'Todos';

    filteredProperties = properties.filter((item) => {
      const itemRegion = normalizeRegion(item.region);
      const itemStatus = getStatus(item);

      const searchText = [
        item.title,
        item.district,
        item.type,
        item.region,
        itemRegion,
        itemStatus,
        getPrice(item),
        getArea(item),
        item.slug,
        Array.isArray(item.features) ? item.features.join(' ') : '',
        Array.isArray(item.specs) ? item.specs.join(' ') : ''
      ].join(' ').toLowerCase();

      const matchSearch = !search || searchText.includes(search);

      const matchRegion =
        region === 'Todos' ||
        item.region === region ||
        itemRegion === region;

      const matchStatus =
        status === 'Todos' ||
        itemStatus === status;

      return matchSearch && matchRegion && matchStatus;
    });

    currentPage = 1;
    renderProperties();
  }

  function getPaginatedItems() {
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;

    return filteredProperties.slice(start, end);
  }

  function renderProperties() {
    const tbody = $('adminPropertyRows');
    const emptyState = $('emptyState');
    const resultText = $('resultText');
    const propertyCount = $('propertyCount');

    if (!tbody) return;

    const total = filteredProperties.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const pageItems = getPaginatedItems();

    if (propertyCount) {
      propertyCount.textContent = `${properties.length} imóveis`;
    }

    if (resultText) {
      resultText.textContent = `${total} imóvel(is) encontrado(s)`;
    }

    if (!pageItems.length) {
      tbody.innerHTML = '';

      if (emptyState) {
        emptyState.style.display = 'block';
      }

      renderPagination(totalPages);
      return;
    }

    if (emptyState) {
      emptyState.style.display = 'none';
    }

    tbody.innerHTML = pageItems.map((item) => {
      const status = getStatus(item);
      const statusClass = status === 'Oculto' ? 'status hidden' : 'status';

      return `
        <tr>
          <td>
            <div class="property-cell">
              <img src="${escapeText(getImage(item))}" alt="${escapeText(item.title)}">

              <div>
                <strong>${escapeText(item.title || 'Imóvel sem nome')}</strong>
                <span>${escapeText(getLocation(item))} · ${escapeText(item.type || 'Imóvel')}</span>
              </div>
            </div>
          </td>

          <td>${escapeText(normalizeRegion(item.region) || '-')}</td>

          <td>${escapeText(getArea(item))}</td>

          <td>
            <span class="${statusClass}">${escapeText(status)}</span>
          </td>

          <td>${escapeText(getPrice(item))}</td>

          <td>
            <div class="actions-row">
              <a 
                class="action-btn" 
                href="../imoveis/detalhe.html?slug=${escapeText(item.slug)}" 
                target="_blank"
              >
                Ver
              </a>

              <button class="action-btn" type="button" data-action="edit" data-id="${item.id}">
                Editar
              </button>

              <button class="action-btn" type="button" data-action="duplicate" data-id="${item.id}">
                Duplicar
              </button>

              <button class="action-btn" type="button" data-action="toggle" data-id="${item.id}">
                ${status === 'Oculto' ? 'Publicar' : 'Ocultar'}
              </button>

              <button class="action-btn danger" type="button" data-action="delete" data-id="${item.id}">
                Excluir
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

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
    const totalPages = Math.max(1, Math.ceil(filteredProperties.length / perPage));

    currentPage += direction;

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    renderProperties();
  }

  function editProperty(id) {
    localStorage.setItem('editing_property_id', String(id));
    window.location.href = 'imovel-form.html';
  }

  function duplicateProperty(id) {
    const item = properties.find((property) => String(property.id) === String(id));

    if (!item) return;

    const copy = normalizeProperty({
      ...item,
      id: Date.now(),
      slug: `${item.slug || slugify(item.title)}-copia-${Date.now()}`,
      title: `${item.title || 'Imóvel'} — Cópia`,
      status: 'Oculto',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    properties.unshift(copy);
    saveProperties();
    applyFilters();
  }

  function togglePropertyStatus(id) {
    properties = properties.map((item) => {
      if (String(item.id) !== String(id)) return item;

      return {
        ...item,
        status: getStatus(item) === 'Oculto' ? 'Ativo' : 'Oculto',
        updatedAt: new Date().toISOString()
      };
    });

    saveProperties();
    applyFilters();
  }

  function deleteProperty(id) {
    const confirmDelete = confirm('Deseja excluir este imóvel do painel?');

    if (!confirmDelete) return;

    properties = properties.filter((item) => String(item.id) !== String(id));

    const favorites = getStorageArray('heleno_favorites').filter((favorite) => {
      return String(favorite) !== String(id);
    });

    localStorage.setItem('heleno_favorites', JSON.stringify(favorites));

    saveProperties();
    applyFilters();
  }

  function handleTableClick(event) {
    const button = event.target.closest('[data-action]');

    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === 'edit') editProperty(id);
    if (action === 'duplicate') duplicateProperty(id);
    if (action === 'toggle') togglePropertyStatus(id);
    if (action === 'delete') deleteProperty(id);
  }

  function clearFilters() {
    if ($('searchInput')) $('searchInput').value = '';
    if ($('regionFilter')) $('regionFilter').value = 'Todos';
    if ($('statusFilter')) $('statusFilter').value = 'Todos';

    applyFilters();
  }

  function bindEvents() {
    $('searchInput')?.addEventListener('input', applyFilters);
    $('regionFilter')?.addEventListener('change', applyFilters);
    $('statusFilter')?.addEventListener('change', applyFilters);
    $('clearFilters')?.addEventListener('click', clearFilters);

    $('prevPage')?.addEventListener('click', () => changePage(-1));
    $('nextPage')?.addEventListener('click', () => changePage(1));

    $('adminPropertyRows')?.addEventListener('click', handleTableClick);
  }

  async function init() {
    bindEvents();

    await loadProperties();

    filteredProperties = [...properties];

    renderProperties();
  }

  document.addEventListener('DOMContentLoaded', init);
})();