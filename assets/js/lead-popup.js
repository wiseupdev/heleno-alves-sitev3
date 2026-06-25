/**
 * lead-popup.js — Heleno Alves
 * Popup de captação de leads após 6s de navegação
 * Salva dados no localStorage + envia ao webhook N8n
 */
(function () {
  const POPUP_KEY    = 'heleno_popup_shown';
  const WEBHOOK_URL  = 'https://webhook.wiseuptech.com.br/webhook/apipaginationha';

  // Não exibe nas páginas admin/usuario
  const path = window.location.pathname;
  if (path.includes('/admin') || path.includes('/usuario')) return;

  // Não exibe se já mostrou hoje
  const lastShown = localStorage.getItem(POPUP_KEY);
  if (lastShown) {
    const diff = Date.now() - parseInt(lastShown, 10);
    if (diff < 24 * 60 * 60 * 1000) return; // 24h
  }

  function getLang() {
    return (typeof HA_I18N !== 'undefined') ? HA_I18N.getLang() : 'pt';
  }

  const labels = {
    pt: {
      title:    'Receba uma curadoria exclusiva',
      sub:      'Imóveis de alto padrão em Balneário Camboriú e Praia Brava selecionados para o seu perfil.',
      name:     'Seu nome',
      phone:    'WhatsApp',
      goal:     'O que você busca?',
      opt1:     'Moradia',
      opt2:     'Investimento',
      opt3:     'Segunda residência',
      submit:   'Quero receber a curadoria',
      skip:     'Agora não',
      success:  'Obrigado! Heleno entrará em contato em breve.',
    },
    en: {
      title:    'Receive an exclusive curation',
      sub:      'High-end properties in Balneário Camboriú and Praia Brava selected for your profile.',
      name:     'Your name',
      phone:    'WhatsApp',
      goal:     'What are you looking for?',
      opt1:     'Primary residence',
      opt2:     'Investment',
      opt3:     'Second home',
      submit:   'Receive my curation',
      skip:     'Not now',
      success:  'Thank you! Heleno will be in touch soon.',
    },
    es: {
      title:    'Reciba una curaduría exclusiva',
      sub:      'Propiedades de alto estándar en Balneário Camboriú y Praia Brava seleccionadas para su perfil.',
      name:     'Su nombre',
      phone:    'WhatsApp',
      goal:     '¿Qué está buscando?',
      opt1:     'Vivienda',
      opt2:     'Inversión',
      opt3:     'Segunda residencia',
      submit:   'Quiero recibir la curaduría',
      skip:     'Ahora no',
      success:  '¡Gracias! Heleno se pondrá en contacto pronto.',
    },
    fr: {
      title:    'Recevez une sélection exclusive',
      sub:      'Propriétés haut de gamme à Balneário Camboriú et Praia Brava sélectionnées pour votre profil.',
      name:     'Votre nom',
      phone:    'WhatsApp',
      goal:     'Que recherchez-vous ?',
      opt1:     'Résidence principale',
      opt2:     'Investissement',
      opt3:     'Résidence secondaire',
      submit:   'Recevoir ma sélection',
      skip:     'Pas maintenant',
      success:  'Merci ! Heleno vous contactera bientôt.',
    },
  };

  function createPopup() {
    const lang = getLang();
    const l    = labels[lang] || labels.pt;

    const overlay = document.createElement('div');
    overlay.id = 'leadPopupOverlay';
    overlay.innerHTML = `
      <div class="lead-popup" role="dialog" aria-modal="true" aria-labelledby="leadPopupTitle">
        <button class="lead-popup-close" id="leadPopupClose" aria-label="${l.skip}">×</button>
        <div class="lead-popup-eyebrow">Heleno Alves</div>
        <h2 class="lead-popup-title" id="leadPopupTitle">${l.title}</h2>
        <p class="lead-popup-sub">${l.sub}</p>
        <form class="lead-popup-form" id="leadPopupForm" novalidate>
          <label class="sr-only" for="lpName">${l.name}</label>
          <input
            type="text"
            id="lpName"
            name="name"
            class="lead-popup-input"
            placeholder="${l.name}"
            autocomplete="name"
            required
          >
          <label class="sr-only" for="lpPhone">${l.phone}</label>
          <input
            type="tel"
            id="lpPhone"
            name="phone"
            class="lead-popup-input"
            placeholder="${l.phone} (+55)"
            autocomplete="tel"
            required
          >
          <label class="sr-only" for="lpGoal">${l.goal}</label>
          <select id="lpGoal" name="goal" class="lead-popup-input" aria-label="${l.goal}">
            <option value="">${l.goal}</option>
            <option value="moradia">${l.opt1}</option>
            <option value="investimento">${l.opt2}</option>
            <option value="segunda-residencia">${l.opt3}</option>
          </select>
          <button type="submit" class="btn gold lead-popup-submit">${l.submit}</button>
        </form>
        <div class="lead-popup-success" id="leadPopupSuccess" hidden>
          <span>✓</span>
          <p>${l.success}</p>
        </div>
        <button class="lead-popup-skip" id="leadPopupSkip">${l.skip}</button>
      </div>`;

    document.body.appendChild(overlay);

    // Fechar
    const close = () => {
      overlay.classList.remove('is-open');
      document.removeEventListener('keydown', onKeydown);
      setTimeout(() => overlay.remove(), 400);
    };

    // ESC fecha o popup
    function onKeydown(e) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKeydown);

    document.getElementById('leadPopupClose').addEventListener('click', close);
    document.getElementById('leadPopupSkip').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    // Submit
    document.getElementById('leadPopupForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name  = document.getElementById('lpName').value.trim();
      const phone = document.getElementById('lpPhone').value.trim();
      const goal  = document.getElementById('lpGoal').value;

      if (!name || !phone) return;

      const lead = {
        source:    'popup',
        page:      window.location.pathname,
        lang,
        name,
        phone,
        goal,
        timestamp: new Date().toISOString(),
      };

      // Salva localmente
      try {
        const leads = JSON.parse(localStorage.getItem('heleno_leads') || '[]');
        leads.push(lead);
        localStorage.setItem('heleno_leads', JSON.stringify(leads));
      } catch (_) {}

      // Envia ao webhook (melhor esforço)
      try {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'lead_popup', ...lead }),
        });
      } catch (_) {}

      // Feedback
      document.getElementById('leadPopupForm').hidden   = true;
      document.getElementById('leadPopupSuccess').hidden = false;

      // Fecha após 2.5s
      setTimeout(close, 2500);
    });

    // Abre com animação
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add('is-open'));
    });
  }

  // Dispara após 6 segundos
  setTimeout(() => {
    localStorage.setItem(POPUP_KEY, Date.now().toString());
    createPopup();
  }, 6000);
})();