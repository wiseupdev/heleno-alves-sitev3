(function () {
  const $ = (id) => document.getElementById(id);

  let leads = [];
  let filteredLeads = [];
  let currentPage = 1;

  const perPage = 6;

  const fallbackLeads = [
    {
      id: 1,
      name: 'Mariana Lopes',
      phone: '(47) 99999-1020',
      email: '',
      property: 'Vitra by Pininfarina',
      region: 'Balneário Camboriú',
      type: 'Apartamento',
      goal: 'Investir',
      budget: 'Sob consulta',
      moment: 'Imediato',
      message: '',
      source: 'Instagram Ads',
      status: 'Novo',
      createdAt: '2026-05-31T10:30:00'
    },
    {
      id: 2,
      name: 'Carlos Andrade',
      phone: '(11) 98888-2200',
      email: '',
      property: 'Brava Ocean House',
      region: 'Praia Brava',
      type: 'Apartamento',
      goal: 'Morar',
      budget: 'R$ 5M a R$ 8M',
      moment: 'Em até 3 meses',
      message: '',
      source: 'Google',
      status: 'Em atendimento',
      createdAt: '2026-05-31T11:45:00'
    },
    {
      id: 3,
      name: 'Renata Prado',
      phone: '(47) 97777-8842',
      email: '',
      property: 'One Tower Residence',
      region: 'Balneário Camboriú',
      type: 'Cobertura',
      goal: 'Segunda residência',
      budget: 'Acima de R$ 12M',
      moment: 'Em até 6 meses',
      message: '',
      source: 'Direto',
      status: 'Agendou visita',
      createdAt: '2026-05-30T16:15:00'
    }
  ];

  const statuses = [
    'Novo',
    'Em atendimento',
    'Agendou visita',
    'Concluído',
    'Arquivado'
  ];

  function escapeText(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function normalizeLead(lead) {
    return {
      id: lead.id || Date.now(),
      name: lead.name || 'Lead sem nome',
      phone: lead.phone || lead.whatsapp || '',
      email: lead.email || '',
      property: lead.property || lead.propertyTitle || '',
      region: lead.region || '',
      type: lead.type || '',
      goal: lead.goal || '',
      budget: lead.budget || '',
      moment: lead.moment || '',
      message: lead.message || '',
      source: lead.source || 'Site',
      status: lead.status || 'Novo',
      createdAt: lead.createdAt || new Date().toISOString()
    };
  }

  function getLeadInterest(lead) {
    if (lead.property) return lead.property;

    const parts = [
      lead.region,
      lead.type,
      lead.goal,
      lead.budget
    ].filter(Boolean);

    return parts.length ? parts.join(' · ') : 'Curadoria privada';
  }

  function getLeadDetails(lead) {
    const details = [
      lead.email ? `E-mail: ${lead.email}` : '',
      lead.region ? `Região: ${lead.region}` : '',
      lead.type ? `Tipo: ${lead.type}` : '',
      lead.goal ? `Objetivo: ${lead.goal}` : '',
      lead.budget ? `Investimento: ${lead.budget}` : '',
      lead.moment ? `Momento: ${lead.moment}` : '',
      lead.message ? `Mensagem: ${lead.message}` : ''
    ].filter(Boolean);

    return details.join(' | ');
  }

  function phoneToWhatsApp(phone) {
    const onlyNumbers = String(phone || '').replace(/\D/g, '');

    if (!onlyNumbers) return '#';

    if (onlyNumbers.startsWith('55')) {
      return `https://wa.me/${onlyNumbers}`;
    }

    return `https://wa.me/55${onlyNumbers}`;
  }

  function saveLeads() {
    localStorage.setItem('admin_leads_list', JSON.stringify(leads));
  }

  function loadLeads() {
    const saved = JSON.parse(localStorage.getItem('admin_leads_list') || '[]');
    const contactLeads = JSON.parse(localStorage.getItem('heleno_contact_leads') || '[]');

    const merged = [...saved];

    contactLeads.forEach((contactLead) => {
      const alreadyExists = merged.some((lead) => {
        return String(lead.id) === String(contactLead.id);
      });

      if (!alreadyExists) {
        merged.unshift(contactLead);
      }
    });

    if (merged.length) {
      leads = merged.map(normalizeLead);
      saveLeads();
      return;
    }

    leads = fallbackLeads.map(normalizeLead);
    saveLeads();
  }

  function updateKpis() {
    const total = leads.length;
    const novo = leads.filter((lead) => lead.status === 'Novo').length;
    const progress = leads.filter((lead) => lead.status === 'Em atendimento').length;
    const visit = leads.filter((lead) => lead.status === 'Agendou visita').length;

    if ($('kpiTotal')) $('kpiTotal').textContent = total;
    if ($('kpiNew')) $('kpiNew').textContent = novo;
    if ($('kpiProgress')) $('kpiProgress').textContent = progress;
    if ($('kpiVisit')) $('kpiVisit').textContent = visit;
    if ($('leadCount')) $('leadCount').textContent = `${total} leads`;
  }

  function applyFilters() {
    const search = $('searchInput')?.value.trim().toLowerCase() || '';
    const status = $('statusFilter')?.value || 'Todos';
    const source = $('sourceFilter')?.value || 'Todos';

    filteredLeads = leads.filter((lead) => {
      const searchText = [
        lead.name,
        lead.phone,
        lead.email,
        lead.property,
        lead.region,
        lead.type,
        lead.goal,
        lead.budget,
        lead.moment,
        lead.message,
        lead.source,
        lead.status
      ].join(' ').toLowerCase();

      const matchSearch = !search || searchText.includes(search);
      const matchStatus = status === 'Todos' || lead.status === status;
      const matchSource = source === 'Todos' || lead.source === source;

      return matchSearch && matchStatus && matchSource;
    });

    currentPage = 1;
    renderLeads();
  }

  function getPaginatedItems() {
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;

    return filteredLeads.slice(start, end);
  }

  function renderStatusSelect(lead) {
    return `
      <select class="status-select" data-action="status" data-id="${lead.id}">
        ${statuses.map((status) => `
          <option value="${status}" ${lead.status === status ? 'selected' : ''}>
            ${status}
          </option>
        `).join('')}
      </select>
    `;
  }

  function renderLeads() {
    const tbody = $('leadRows');
    const emptyState = $('emptyState');
    const resultText = $('resultText');

    if (!tbody) return;

    const total = filteredLeads.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const pageItems = getPaginatedItems();

    if (resultText) {
      resultText.textContent = `${total} lead(s) encontrado(s)`;
    }

    if (!pageItems.length) {
      tbody.innerHTML = '';

      if (emptyState) {
        emptyState.style.display = 'block';
      }

      renderPagination(totalPages);
      updateKpis();
      return;
    }

    if (emptyState) {
      emptyState.style.display = 'none';
    }

    tbody.innerHTML = pageItems.map((lead) => {
      const archivedClass = lead.status === 'Arquivado' ? 'status archived' : 'status';
      const leadInterest = getLeadInterest(lead);
      const leadDetails = getLeadDetails(lead);

      return `
        <tr>
          <td>
            <div class="client-cell">
              <strong>${escapeText(lead.name)}</strong>
              <span>${escapeText(lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR') : '')}</span>
            </div>
          </td>

          <td>
            <div class="client-cell">
              <strong>${escapeText(lead.phone)}</strong>
              ${lead.email ? `<span>${escapeText(lead.email)}</span>` : ''}
            </div>
          </td>

          <td>
            <div class="client-cell">
              <strong>${escapeText(leadInterest)}</strong>
              ${leadDetails ? `<span>${escapeText(leadDetails)}</span>` : ''}
            </div>
          </td>

          <td>${escapeText(lead.source)}</td>

          <td>
            <span class="${archivedClass}">${escapeText(lead.status)}</span>
          </td>

          <td>
            <div class="actions-row">
              <a class="action-btn" href="${phoneToWhatsApp(lead.phone)}" target="_blank">WhatsApp</a>
              ${renderStatusSelect(lead)}
              <button class="action-btn" type="button" data-action="archive" data-id="${lead.id}">Arquivar</button>
              <button class="action-btn danger" type="button" data-action="delete" data-id="${lead.id}">Excluir</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    renderPagination(totalPages);
    updateKpis();
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
    const totalPages = Math.max(1, Math.ceil(filteredLeads.length / perPage));

    currentPage += direction;

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    renderLeads();
  }

  function updateLeadStatus(id, status) {
    leads = leads.map((lead) => {
      if (String(lead.id) !== String(id)) return lead;

      return {
        ...lead,
        status
      };
    });

    saveLeads();
    applyFilters();
  }

  function archiveLead(id) {
    updateLeadStatus(id, 'Arquivado');
  }

  function deleteLead(id) {
    const confirmDelete = confirm('Deseja excluir este lead?');

    if (!confirmDelete) return;

    leads = leads.filter((lead) => String(lead.id) !== String(id));

    saveLeads();
    applyFilters();
  }

  function handleTableChange(event) {
    const select = event.target.closest('[data-action="status"]');

    if (!select) return;

    updateLeadStatus(select.dataset.id, select.value);
  }

  function handleTableClick(event) {
    const button = event.target.closest('[data-action]');

    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === 'archive') archiveLead(id);
    if (action === 'delete') deleteLead(id);
  }

  function clearFilters() {
    if ($('searchInput')) $('searchInput').value = '';
    if ($('statusFilter')) $('statusFilter').value = 'Todos';
    if ($('sourceFilter')) $('sourceFilter').value = 'Todos';

    applyFilters();
  }

  function bindEvents() {
    $('searchInput')?.addEventListener('input', applyFilters);
    $('statusFilter')?.addEventListener('change', applyFilters);
    $('sourceFilter')?.addEventListener('change', applyFilters);
    $('clearFilters')?.addEventListener('click', clearFilters);

    $('prevPage')?.addEventListener('click', () => changePage(-1));
    $('nextPage')?.addEventListener('click', () => changePage(1));

    $('leadRows')?.addEventListener('click', handleTableClick);
    $('leadRows')?.addEventListener('change', handleTableChange);
  }

  function init() {
    bindEvents();
    loadLeads();

    filteredLeads = [...leads];

    updateKpis();
    renderLeads();
  }

  document.addEventListener('DOMContentLoaded', init);
})();