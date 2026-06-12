(function () {
  const $ = (id) => document.getElementById(id);

  function getProfile() {
    return JSON.parse(localStorage.getItem('heleno_user_profile') || '{}');
  }

  function getFavorites() {
    return JSON.parse(localStorage.getItem('heleno_favorites') || '[]');
  }

  function formatDate(value) {
    if (!value) return '-';

    return new Date(value).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  }

  function getPreferenceValue(preferences, keys, fallback) {
    for (const key of keys) {
      if (preferences && preferences[key]) return preferences[key];
    }

    return fallback;
  }

  function renderProfile() {
    const profile = getProfile();
    const email = localStorage.getItem('heleno_user_email') || profile.email || 'Não informado';
    const name = profile.name || 'Cliente';

    if ($('sidebarUserName')) $('sidebarUserName').textContent = name;
    if ($('welcomeText')) $('welcomeText').textContent = `Olá, ${name}. Acompanhe seus favoritos, preferências e imóveis vistos recentemente.`;

    if ($('profileName')) $('profileName').textContent = profile.name || 'Não informado';
    if ($('profileEmail')) $('profileEmail').textContent = email;
    if ($('profileWhatsapp')) $('profileWhatsapp').textContent = profile.whatsapp || 'Não informado';
    if ($('profileLastLogin')) $('profileLastLogin').textContent = formatDate(profile.lastLogin || profile.createdAt);
  }

  function renderKpis() {
    const profile = getProfile();
    const favorites = getFavorites();
    const preferences = profile.preferences || JSON.parse(localStorage.getItem('heleno_user_preferences') || '{}');

    const region = getPreferenceValue(preferences, ['region', 'preferredRegion'], 'BC');
    const suites = getPreferenceValue(preferences, ['suites', 'preferredSuites'], '4+');

    if ($('favoriteCount')) $('favoriteCount').textContent = favorites.length;
    if ($('preferredRegion')) $('preferredRegion').textContent = region || '-';
    if ($('preferredSuites')) $('preferredSuites').textContent = suites || '-';
  }

  function renderPreferences() {
    const profile = getProfile();
    const preferences = profile.preferences || JSON.parse(localStorage.getItem('heleno_user_preferences') || '{}');
    const container = $('preferencesPreview');

    if (!container) return;

    const entries = Object.entries(preferences).filter(([, value]) => value);

    if (!entries.length) {
      container.innerHTML = `
        <p class="preference-empty">
          Nenhuma preferência salva ainda. Acesse a página de preferências para personalizar sua curadoria.
        </p>
      `;
      return;
    }

    container.innerHTML = entries.map(([key, value]) => `
      <span class="preference-chip">${key}: ${value}</span>
    `).join('');
  }

  function logout() {
    localStorage.removeItem('heleno_user_logged');

    window.location.href = 'login.html';
  }

  function bindEvents() {
    const logoutBtn = $('logoutBtn');

    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }
  }

  function initAccount() {
    bindEvents();
    renderProfile();
    renderKpis();
    renderPreferences();
  }

  document.addEventListener('DOMContentLoaded', initAccount);
})();