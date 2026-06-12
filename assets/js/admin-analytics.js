(function () {
  const $ = (id) => document.getElementById(id);

  let events = [];
  let filteredEvents = [];
  let currentPage = 1;

  const perPage = 6;

  const analyticsData = {
    kpis: {
      visitors: 1842,
      whatsapp: 126,
      favorites: 87,
      leads: 24
    },

    sources: [
      { name: 'Instagram Ads', value: 44, note: 'Maior volume' },
      { name: 'Google', value: 31, note: 'Alta intenção' },
      { name: 'Direto', value: 18, note: 'Reconhecimento da marca' },
      { name: 'WhatsApp', value: 7, note: 'Contato direto' }
    ],

    funnel: [
      { name: 'Visitantes', value: 1842, pct: 100 },
      { name: 'Visualizaram imóveis', value: 936, pct: 51 },
      { name: 'Abriram detalhes', value: 428, pct: 23 },
      { name: 'Favoritaram', value: 87, pct: 9 },
      { name: 'Clicaram no WhatsApp', value: 126, pct: 7 },
      { name: 'Viraram lead', value: 24, pct: 3 }
    ],

    events: [
      {
        id: 1,
        date: '2026-05-31T09:15:00',
        event: 'Visualização',
        source: 'Instagram Ads',
        page: 'Vitra by Pininfarina',
        note: 'Usuário abriu a página do imóvel'
      },
      {
        id: 2,
        date: '2026-05-31T09:22:00',
        event: 'Clique WhatsApp',
        source: 'Instagram Ads',
        page: 'Vitra by Pininfarina',
        note: 'Clique no botão Quero informações'
      },
      {
        id: 3,
        date: '2026-05-31T10:02:00',
        event: 'Favorito',
        source: 'Google',
        page: 'Brava Ocean House',
        note: 'Imóvel salvo na área do cliente'
      },
      {
        id: 4,
        date: '2026-05-31T10:40:00',
        event: 'Lead',
        source: 'Google',
        page: 'One Tower Residence',
        note: 'Formulário enviado'
      },
      {
        id: 5,
        date: '2026-05-31T11:18:00',
        event: 'Detalhe aberto',
        source: 'Direto',
        page: 'Brava Front Sea',
        note: 'Usuário abriu detalhes do imóvel'
      },
      {
        id: 6,
        date: '2026-05-31T12:05:00',
        event: 'Visualização',
        source: 'Site',
        page: 'Página Praia Brava',
        note: 'Acesso à página regional'
      },
      {
        id: 7,
        date: '2026-05-31T13:30:00',
        event: 'Clique WhatsApp',
        source: 'WhatsApp',
        page: 'Casa Reserva Brava',
        note: 'Retorno para atendimento'
      },
      {
        id: 8,
        date: '2026-05-31T14:10:00',
        event: 'Visualização',
        source: 'Instagram Ads',
        page: 'Skyline Private',
        note: 'Campanha de lançamento'
      },
      {
        id: 9,
        date: '2026-05-31T15:22:00',
        event: 'Lead',
        source: 'Instagram Ads',
        page: 'Brava Essence',
        note: 'Lead captado por interesse em lançamento'
      }
    ]
  };

  function escapeText(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatDate(value) {
    if (!value) return '-';

    return new Date(value).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  }

  function renderKpis() {
    if ($('kpiVisitors')) $('kpiVisitors').textContent = analyticsData.kpis.visitors;
    if ($('kpiWhatsapp')) $('kpiWhatsapp').textContent = analyticsData.kpis.whatsapp;
    if ($('kpiFavorites')) $('kpiFavorites').textContent = analyticsData.kpis.favorites;
    if ($('kpiLeads')) $('kpiLeads').textContent = analyticsData.kpis.leads;
  }

  function renderSources() {
    const el = $('sourceRows');

    if (!el) return;

    el.innerHTML = analyticsData.sources.map((item) => `
      <div class="source-item">
        <b>${escapeText(item.name)}</b>
        <div class="bar">
          <span style="width:${item.value}%"></span>
        </div>
        <span>${item.value}%</span>
      </div>
    `).join('');
  }

  function renderFunnel() {
    const el = $('funnelRows');

    if (!el) return;

    el.innerHTML = analyticsData.funnel.map((item) => `
      <div class="funnel-row">
        <div class="funnel-name">${escapeText(item.name)}</div>
        <div class="bar">
          <span style="width:${item.pct}%"></span>
        </div>
        <div class="funnel-value">${item.value}</div>
      </div>
    `).join('');
  }

  function loadEvents() {
    const saved = JSON.parse(localStorage.getItem('admin_analytics_events') || '[]');

    if (saved.length) {
      events = saved;
      return;
    }

    events = analyticsData.events;
    localStorage.setItem('admin_analytics_events', JSON.stringify(events));
  }

  function applyFilters() {
    const search = $('searchInput')?.value.trim().toLowerCase() || '';
    const source = $('sourceFilter')?.value || 'Todos';
    const eventType = $('eventFilter')?.value || 'Todos';

    filteredEvents = events.filter((item) => {
      const searchText = [
        item.event,
        item.source,
        item.page,
        item.note
      ].join(' ').toLowerCase();

      const matchSearch = !search || searchText.includes(search);
      const matchSource = source === 'Todos' || item.source === source;
      const matchEvent = eventType === 'Todos' || item.event === eventType;

      return matchSearch && matchSource && matchEvent;
    });

    currentPage = 1;
    renderEvents();
  }

  function getPaginatedItems() {
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;

    return filteredEvents.slice(start, end);
  }

  function renderEvents() {
    const tbody = $('eventRows');
    const emptyState = $('emptyState');
    const resultText = $('resultText');
    const eventCount = $('eventCount');

    if (!tbody) return;

    const total = filteredEvents.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const pageItems = getPaginatedItems();

    if (eventCount) {
      eventCount.textContent = `${events.length} eventos`;
    }

    if (resultText) {
      resultText.textContent = `${total} evento(s) encontrado(s)`;
    }

    if (!pageItems.length) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      renderPagination(totalPages);
      return;
    }

    if (emptyState) {
      emptyState.style.display = 'none';
    }

    tbody.innerHTML = pageItems.map((item) => `
      <tr>
        <td>${formatDate(item.date)}</td>
        <td><span class="event-badge">${escapeText(item.event)}</span></td>
        <td>${escapeText(item.source)}</td>
        <td>${escapeText(item.page)}</td>
        <td>${escapeText(item.note)}</td>
      </tr>
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
    const totalPages = Math.max(1, Math.ceil(filteredEvents.length / perPage));

    currentPage += direction;

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    renderEvents();
  }

  function clearFilters() {
    if ($('searchInput')) $('searchInput').value = '';
    if ($('sourceFilter')) $('sourceFilter').value = 'Todos';
    if ($('eventFilter')) $('eventFilter').value = 'Todos';

    applyFilters();
  }

  function bindEvents() {
    $('searchInput')?.addEventListener('input', applyFilters);
    $('sourceFilter')?.addEventListener('change', applyFilters);
    $('eventFilter')?.addEventListener('change', applyFilters);
    $('clearFilters')?.addEventListener('click', clearFilters);

    $('prevPage')?.addEventListener('click', () => changePage(-1));
    $('nextPage')?.addEventListener('click', () => changePage(1));
  }

  function init() {
    bindEvents();
    renderKpis();
    renderSources();
    renderFunnel();
    loadEvents();

    filteredEvents = [...events];

    renderEvents();
  }

  document.addEventListener('DOMContentLoaded', init);
})();