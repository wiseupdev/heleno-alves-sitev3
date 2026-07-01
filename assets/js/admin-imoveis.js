/**
 * admin-imoveis.js — Heleno Alves
 * Lista de imóveis do painel admin. Fonte de dados REAL:
 *   HA_API_ADMIN.listAllProperties → webhook apiADMINpagination.
 * Ações de excluir vão direto no PROPERTYMANAGER (delete_property).
 * Editar/Duplicar abrem o formulário (admin-imovel-form.js).
 *
 * Não usa mais localStorage como fonte; o cache local fica só para o
 * filtro/paginação client-side. "Duplicar" e "Ocultar" são UX local
 * (não persistem no backend) e estão claramente sinalizados.
 */
(function () {
  const $ = (id) => document.getElementById(id);
  const N = (window.HA_NORMALIZER || null);

  let properties = [];
  let filteredProperties = [];
  let currentPage = 1;
  const perPage = 6;

  function escapeText(value) {
    return String(value || '')
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function isValidUrl(value) {
    const url = String(value || '').trim();
    return url !== '' && !['#', 'null', 'undefined'].includes(url.toLowerCase());
  }
  function mediaUrl(media) {
    if (!media) return '';
    if (typeof media === 'string') return media.trim();
    return String(media.url || media.media_url || media.image_url || media.previewUrl || media.src || '').trim();
  }
  function getImage(item) {
    const firstImage = Array.isArray(item.images) ? item.images[0] : null;
    return [mediaUrl(firstImage), mediaUrl(item.cover), mediaUrl(item.img), mediaUrl(item.image)]
      .find(isValidUrl) || '';
  }
  function renderThumb(item) {
    const image = getImage(item);
    if (!image) return '<div class="property-image-placeholder property-thumb-placeholder"><span>Sem imagem</span></div>';
    return `<img src="${escapeText(image)}" alt="${escapeText(item.title || 'Imóvel')}">`;
  }
  function getArea(item)     { return item.privateArea || item.area || '-'; }
  function getStatus(item)   { return item.status || 'Ativo'; }
  function getPrice(item)    { return item.price || 'Sob consulta'; }
  function getLocation(item) {
    return [item.district, item.region].filter(Boolean).join(' · ') || 'Localização sob consulta';
  }

  async function loadProperties() {
    if (typeof HA_API_ADMIN === 'undefined') {
      console.error('[ADMIN] HA_API_ADMIN ausente.');
      properties = [];
      return;
    }
    try {
      const res = await HA_API_ADMIN.listAllProperties({ pageSize: 50 });
      const list = Array.isArray(res.properties) ? res.properties : [];
      properties = N ? N.normalizeList(list) : list;
      console.log(`[ADMIN] ${properties.length} imóveis carregados do backend.`);
    } catch (err) {
      console.error('[ADMIN] Falha ao listar imóveis:', err);
      properties = [];
      const tbody = $('adminPropertyRows');
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="padding:20px;text-align:center;color:#f88">Não foi possível carregar imóveis do servidor.</td></tr>`;
    }
  }

  function applyFilters() {
    const search = $('searchInput')?.value.trim().toLowerCase() || '';
    const region = $('regionFilter')?.value || 'Todos';
    const status = $('statusFilter')?.value || 'Todos';

    filteredProperties = properties.filter((item) => {
      const itemRegion = item.region || '';
      const itemStatus = getStatus(item);
      const searchText = [
        item.title, item.district, item.type, itemRegion, itemStatus,
        getPrice(item), getArea(item), item.slug,
        Array.isArray(item.features) ? item.features.join(' ') : '',
      ].join(' ').toLowerCase();

      const matchSearch = !search || searchText.includes(search);
      const matchRegion = region === 'Todos' || itemRegion === region ||
                          (region === 'BC' && itemRegion === 'Balneário Camboriú');
      const matchStatus = status === 'Todos' || itemStatus === status;
      return matchSearch && matchRegion && matchStatus;
    });
    currentPage = 1;
    renderProperties();
  }

  function getPaginatedItems() {
    const start = (currentPage - 1) * perPage;
    return filteredProperties.slice(start, start + perPage);
  }

  function renderProperties() {
    const tbody = $('adminPropertyRows');
    const emptyState = $('emptyState');
    const resultText = $('resultText');
    const propertyCount = $('propertyCount');
    if (!tbody) return;

    const total = filteredProperties.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (currentPage > totalPages) currentPage = totalPages;
    const pageItems = getPaginatedItems();

    if (propertyCount) propertyCount.textContent = `${properties.length} imóveis`;
    if (resultText)    resultText.textContent    = `${total} imóvel(is) encontrado(s)`;

    if (!pageItems.length) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      renderPagination(totalPages);
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = pageItems.map((item) => {
      const status = getStatus(item);
      const statusClass = status === 'Oculto' ? 'status hidden' : 'status';
      return `
        <tr>
          <td>
            <div class="property-cell">
              ${renderThumb(item)}
              <div>
                <strong>${escapeText(item.title || 'Imóvel sem nome')}</strong>
                <span>${escapeText(getLocation(item))} · ${escapeText(item.type || 'Imóvel')}</span>
              </div>
            </div>
          </td>
          <td>${escapeText(item.region || '-')}</td>
          <td>${escapeText(getArea(item))}</td>
          <td><span class="${statusClass}">${escapeText(status)}</span></td>
          <td>${escapeText(getPrice(item))}</td>
          <td>
            <div class="actions-row">
              <a class="action-btn" href="../imoveis/detalhe.html?id=${encodeURIComponent(item.id)}&slug=${encodeURIComponent(item.slug)}" target="_blank">Ver</a>
              <button class="action-btn" type="button" data-action="edit" data-id="${item.id}">Editar</button>
              <button class="action-btn danger" type="button" data-action="delete" data-id="${item.id}">Excluir</button>
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
    if (pageInfo) pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    if (prevPage) prevPage.disabled = currentPage <= 1;
    if (nextPage) nextPage.disabled = currentPage >= totalPages;
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

  async function deleteProperty(id) {
    if (!confirm('Excluir este imóvel do banco? Esta ação é permanente.')) return;
    try {
      await HA_API_ADMIN.deleteProperty(id);
      properties = properties.filter((item) => String(item.id) !== String(id));
      applyFilters();
      alert('Imóvel excluído.');
    } catch (err) {
      console.error('[ADMIN][DELETE] falha:', err);
      alert('Não foi possível excluir agora. Tente novamente.');
    }
  }

  function handleTableClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;
    if (action === 'edit')   editProperty(id);
    if (action === 'delete') deleteProperty(id);
  }

  function clearFilters() {
    if ($('searchInput'))  $('searchInput').value = '';
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
