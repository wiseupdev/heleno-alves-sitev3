(function () {
  const $ = (id) => document.getElementById(id);

  const features = [
    'Frente mar',
    'Vista mar',
    'Alto andar',
    'Cobertura',
    'Mobiliado',
    'Decorado',
    'Lançamento',
    'Pronto para morar',
    'Piscina privativa',
    'Área gourmet',
    'Pé na areia',
    'Condomínio fechado',
    'Poucas unidades',
    'Arquitetura assinada',
    'Lazer completo'
  ];

  let selectedFeatures = [];

  function getSavedPreferences() {
    return JSON.parse(localStorage.getItem('heleno_user_preferences') || '{}');
  }

  function getProfile() {
    return JSON.parse(localStorage.getItem('heleno_user_profile') || '{}');
  }

  function saveProfilePreferences(preferences) {
    const profile = getProfile();

    localStorage.setItem('heleno_user_profile', JSON.stringify({
      ...profile,
      preferences
    }));
  }

  function showFeedback(message, type) {
    const feedback = $('preferenceFeedback');

    if (!feedback) return;

    feedback.textContent = message;
    feedback.className = `preference-feedback ${type}`;
  }

  function getFormData() {
    return {
      region: $('region')?.value || '',
      type: $('type')?.value || '',
      priceRange: $('priceRange')?.value || '',
      suites: $('suites')?.value || '',
      parking: $('parking')?.value || '',
      moment: $('moment')?.value || '',
      features: selectedFeatures,
      notes: $('notes')?.value.trim() || '',
      updatedAt: new Date().toISOString()
    };
  }

  function setFieldValue(id, value) {
    const field = $(id);

    if (field) {
      field.value = value || '';
    }
  }

  function renderFeatureBank() {
    const container = $('featureBank');

    if (!container) return;

    container.innerHTML = features.map((feature) => `
      <button 
        class="feature-option ${selectedFeatures.includes(feature) ? 'active' : ''}" 
        type="button" 
        data-feature="${feature}"
      >
        ${feature}
      </button>
    `).join('');
  }

  function renderSelectedFeatures() {
    const container = $('selectedFeatures');

    if (!container) return;

    if (!selectedFeatures.length) {
      container.innerHTML = '<span>Nenhuma característica selecionada.</span>';
      return;
    }

    container.innerHTML = selectedFeatures.map((feature) => `
      <span class="selected-chip">${feature}</span>
    `).join('');
  }

  function renderSummary() {
    const data = getFormData();
    const container = $('summaryList');

    if (!container) return;

    const rows = [
      ['Região', data.region || 'Não definida'],
      ['Tipo', data.type || 'Não definido'],
      ['Faixa de valor', data.priceRange || 'Não definida'],
      ['Suítes', data.suites || 'Não definido'],
      ['Vagas', data.parking || 'Não definido'],
      ['Momento', data.moment || 'Não definido'],
      ['Características', data.features.length ? data.features.join(', ') : 'Nenhuma'],
      ['Observações', data.notes || 'Nenhuma']
    ];

    container.innerHTML = rows.map(([label, value]) => `
      <div class="summary-row">
        <span>${label}</span>
        <strong>${value}</strong>
      </div>
    `).join('');
  }

  function toggleFeature(feature) {
    if (selectedFeatures.includes(feature)) {
      selectedFeatures = selectedFeatures.filter((item) => item !== feature);
    } else {
      selectedFeatures.push(feature);
    }

    renderFeatureBank();
    renderSelectedFeatures();
    renderSummary();
  }

  function loadPreferences() {
    const saved = getSavedPreferences();

    setFieldValue('region', saved.region);
    setFieldValue('type', saved.type);
    setFieldValue('priceRange', saved.priceRange);
    setFieldValue('suites', saved.suites);
    setFieldValue('parking', saved.parking);
    setFieldValue('moment', saved.moment);
    setFieldValue('notes', saved.notes);

    selectedFeatures = Array.isArray(saved.features) ? saved.features : [];

    if (saved.updatedAt && $('preferenceStatus')) {
      $('preferenceStatus').textContent = 'Salvo';
    }
  }

  function savePreferences(event) {
    event.preventDefault();

    const data = getFormData();

    if (!data.region && !data.type && !data.priceRange) {
      showFeedback('Preencha pelo menos região, tipo ou faixa de valor para salvar.', 'error');
      return;
    }

    localStorage.setItem('heleno_user_preferences', JSON.stringify(data));
    saveProfilePreferences(data);

    if ($('preferenceStatus')) {
      $('preferenceStatus').textContent = 'Salvo';
    }

    showFeedback('Preferências salvas com sucesso.', 'success');
    renderSummary();
  }

  function clearPreferences() {
    const confirmClear = confirm('Deseja limpar todas as preferências?');

    if (!confirmClear) return;

    localStorage.removeItem('heleno_user_preferences');

    selectedFeatures = [];

    ['region', 'type', 'priceRange', 'suites', 'parking', 'moment', 'notes'].forEach((id) => {
      setFieldValue(id, '');
    });

    saveProfilePreferences({});

    if ($('preferenceStatus')) {
      $('preferenceStatus').textContent = 'Não salvo';
    }

    showFeedback('Preferências removidas.', 'success');

    renderFeatureBank();
    renderSelectedFeatures();
    renderSummary();
  }

  function bindEvents() {
    const form = $('preferencesForm');

    if (form) {
      form.addEventListener('submit', savePreferences);
      form.addEventListener('input', renderSummary);
      form.addEventListener('change', renderSummary);
    }

    $('featureBank')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-feature]');

      if (!button) return;

      toggleFeature(button.dataset.feature);
    });

    $('clearPreferences')?.addEventListener('click', clearPreferences);
  }

  function initPreferences() {
    loadPreferences();
    renderFeatureBank();
    renderSelectedFeatures();
    renderSummary();
    bindEvents();
  }

  document.addEventListener('DOMContentLoaded', initPreferences);
})();