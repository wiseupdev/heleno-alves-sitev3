(function () {
  const $ = (id) => document.getElementById(id);

  const fallbackProperties = [
    {
      id: 1,
      title: 'Vitra by Pininfarina',
      region: 'BC',
      loc: 'Barra Sul · BC',
      img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=300&q=80&auto=format&fit=crop'
    },
    {
      id: 2,
      title: 'Brava Ocean House',
      region: 'Praia Brava',
      loc: 'Brava Norte · Praia Brava',
      img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=300&q=80&auto=format&fit=crop'
    },
    {
      id: 3,
      title: 'One Tower Residence',
      region: 'BC',
      loc: 'Centro · BC',
      img: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=300&q=80&auto=format&fit=crop'
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

  function getStorageArray(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
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

  function normalizeProperty(property, index) {
    return {
      id: property.id || index + 1,
      title: property.title || property.name || 'Imóvel sem nome',
      region: property.region || '',
      loc: property.loc || [property.district, property.region].filter(Boolean).join(' · ') || 'Localização sob consulta',
      img: property.cover?.previewUrl ||
        property.cover ||
        property.img ||
        property.image ||
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=300&q=80&auto=format&fit=crop',
      status: property.status || 'Ativo'
    };
  }

  function loadLeads() {
    const adminLeads = getStorageArray('admin_leads_list');
    const contactLeads = getStorageArray('heleno_contact_leads');

    const merged = [...adminLeads];

    contactLeads.forEach((contactLead) => {
      const exists = merged.some((lead) => String(lead.id) === String(contactLead.id));

      if (!exists) {
        merged.unshift(contactLead);
      }
    });

    return merged.map(normalizeLead);
  }

  function loadProperties() {
    const adminProperties = getStorageArray('admin_properties_list');

    if (adminProperties.length) {
      return adminProperties
        .map(normalizeProperty)
        .filter((property) => property.status !== 'Oculto' && property.status !== 'Vendido');
    }

    return fallbackProperties.map(normalizeProperty);
  }

  function loadFavorites() {
    return getStorageArray('heleno_favorites');
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

  function phoneToWhatsApp(phone) {
    const onlyNumbers = String(phone || '').replace(/\D/g, '');

    if (!onlyNumbers) return '#';

    if (onlyNumbers.startsWith('55')) {
      return `https://wa.me/${onlyNumbers}`;
    }

    return `https://wa.me/55${onlyNumbers}`;
  }

  function countBy(items, key) {
    return items.reduce((acc, item) => {
      const value = item[key] || 'Não informado';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  function getSourceRows(leads) {
    const total = Math.max(leads.length, 1);
    const grouped = countBy(leads, 'source');

    return Object.entries(grouped)
      .map(([name, count]) => ({
        name,
        count,
        value: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }

  function getFunnelRows(leads, favorites) {
    const totalLeads = leads.length;
    const newLeads = leads.filter((lead) => lead.status === 'Novo').length;
    const progress = leads.filter((lead) => lead.status === 'Em atendimento').length;
    const visits = leads.filter((lead) => lead.status === 'Agendou visita').length;
    const concluded = leads.filter((lead) => lead.status === 'Concluído').length;
    const base = Math.max(totalLeads, 1);

    return [
      {
        name: 'Leads recebidos',
        value: totalLeads,
        pct: 100
      },
      {
        name: 'Novos leads',
        value: newLeads,
        pct: Math.round((newLeads / base) * 100)
      },
      {
        name: 'Em atendimento',
        value: progress,
        pct: Math.round((progress / base) * 100)
      },
      {
        name: 'Agendaram visita',
        value: visits,
        pct: Math.round((visits / base) * 100)
      },
      {
        name: 'Concluídos',
        value: concluded,
        pct: Math.round((concluded / base) * 100)
      },
      {
        name: 'Favoritos salvos',
        value: favorites.length,
        pct: favorites.length ? Math.min(100, Math.round((favorites.length / Math.max(favorites.length, totalLeads, 1)) * 100)) : 0
      }
    ];
  }

  function getTopProperties(properties, favorites, leads) {
    return properties.slice(0, 5).map((property, index) => {
      const propertyId = String(property.id);
      const favoriteCount = favorites.filter((favorite) => String(favorite) === propertyId).length;

      const leadCount = leads.filter((lead) => {
        const interest = getLeadInterest(lead).toLowerCase();
        const title = String(property.title || '').toLowerCase();

        return interest.includes(title);
      }).length;

      return {
        ...property,
        views: leadCount + favoriteCount + Math.max(0, 12 - index * 2),
        favs: favoriteCount
      };
    });
  }

  function setNumber(id, value) {
    const el = $(id);

    if (!el) return;

    el.textContent = value;
  }

  function renderKpis(data) {
    const newLeads = data.leads.filter((lead) => lead.status === 'Novo').length;
    const progressLeads = data.leads.filter((lead) => lead.status === 'Em atendimento').length;
    const visitLeads = data.leads.filter((lead) => lead.status === 'Agendou visita').length;

    setNumber('totalProperties', data.properties.length);
    setNumber('totalLeads', data.leads.length);
    setNumber('totalClicks', newLeads + progressLeads + visitLeads);
    setNumber('totalFavorites', data.favorites.length);
  }

  function renderFunnel(data) {
    const el = $('funnelRows');

    if (!el) return;

    const funnel = getFunnelRows(data.leads, data.favorites);

    el.innerHTML = funnel.map((item) => `
      <div class="funnel-row">
        <div class="funnel-name">${escapeText(item.name)}</div>
        <div class="bar">
          <span style="width:${item.pct}%"></span>
        </div>
        <div class="funnel-value">${escapeText(item.value)}</div>
      </div>
    `).join('');
  }

  function renderSources(data) {
    const el = $('sourceRows');

    if (!el) return;

    const sources = getSourceRows(data.leads);

    if (!sources.length) {
      el.innerHTML = `
        <div class="source-item">
          <b>Nenhuma origem</b>
          <span>0%</span>
        </div>
      `;
      return;
    }

    el.innerHTML = sources.map((item) => `
      <div class="source-item">
        <b>${escapeText(item.name)}</b>
        <span>${item.value}%</span>
      </div>
    `).join('');
  }

  function renderLeads(data) {
    const el = $('leadRows');

    if (!el) return;

    const latestLeads = [...data.leads]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    if (!latestLeads.length) {
      el.innerHTML = `
        <tr>
          <td colspan="5">Nenhum lead recebido ainda.</td>
        </tr>
      `;
      return;
    }

    el.innerHTML = latestLeads.map((lead) => {
      return `
        <tr>
          <td>
            <strong>${escapeText(lead.name)}</strong><br>
            <span style="color:rgba(255,255,255,.42);font-size:12px">${escapeText(lead.phone)}</span>
          </td>

          <td>${escapeText(getLeadInterest(lead))}</td>

          <td>${escapeText(lead.source)}</td>

          <td>
            <span class="status">${escapeText(lead.status)}</span>
          </td>

          <td>
            <a class="btn small" href="${phoneToWhatsApp(lead.phone)}" target="_blank">
              WhatsApp
            </a>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderTopProperties(data) {
    const el = $('topProperties');

    if (!el) return;

    const top = getTopProperties(data.properties, data.favorites, data.leads);

    if (!top.length) {
      el.innerHTML = `
        <tr>
          <td colspan="3">Nenhum imóvel cadastrado ainda.</td>
        </tr>
      `;
      return;
    }

    el.innerHTML = top.map((item) => `
      <tr>
        <td>
          <div class="property-mini">
            <img src="${escapeText(item.img)}" alt="${escapeText(item.title)}">
            <div>
              <b>${escapeText(item.title)}</b>
              <span>${escapeText(item.loc)}</span>
            </div>
          </div>
        </td>

        <td>${escapeText(item.views)}</td>
        <td>${escapeText(item.favs)}</td>
      </tr>
    `).join('');
  }

  function renderLastUpdate() {
    const el = $('lastUpdate');

    if (!el) return;

    const now = new Date();

    el.textContent = now.toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  }

  function getDashboardData() {
    return {
      properties: loadProperties(),
      leads: loadLeads(),
      favorites: loadFavorites()
    };
  }

  function renderDashboard() {
    const data = getDashboardData();

    renderKpis(data);
    renderFunnel(data);
    renderSources(data);
    renderLeads(data);
    renderTopProperties(data);
    renderLastUpdate();
  }

  document.addEventListener('DOMContentLoaded', renderDashboard);
})();