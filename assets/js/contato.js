(function () {
  const page = document.body.dataset.page;

  if (page !== 'contato') return;

  const $ = (id) => document.getElementById(id);

  const whatsappNumber = '5585988085349';

  function maskWhatsapp(value) {
    const numbers = String(value || '').replace(/\D/g, '').slice(0, 11);

    if (numbers.length <= 2) {
      return numbers;
    }

    if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    }

    if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }

    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }

  function getLeadData() {
    return {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      name: $('leadName')?.value.trim() || '',
      whatsapp: $('leadWhatsapp')?.value.trim() || '',
      email: $('leadEmail')?.value.trim() || '',
      region: $('leadRegion')?.value || '',
      type: $('leadType')?.value || '',
      goal: $('leadGoal')?.value || '',
      budget: $('leadBudget')?.value || '',
      moment: $('leadMoment')?.value || '',
      message: $('leadMessage')?.value.trim() || '',
      source: 'Página de contato',
      status: 'Novo'
    };
  }

  function validateLead(lead) {
    if (!lead.name) {
      return 'Preencha o nome para continuar.';
    }

    if (!lead.whatsapp) {
      return 'Preencha o WhatsApp para continuar.';
    }

    return '';
  }

  function saveLead(lead) {
    const currentLeads = JSON.parse(localStorage.getItem('heleno_contact_leads') || '[]');

    const updatedLeads = [lead, ...currentLeads];

    localStorage.setItem('heleno_contact_leads', JSON.stringify(updatedLeads));

    const adminLeads = JSON.parse(localStorage.getItem('admin_leads_list') || '[]');

    const adminLead = {
      id: lead.id,
      name: lead.name,
      phone: lead.whatsapp,
      email: lead.email,
      region: lead.region,
      type: lead.type,
      goal: lead.goal,
      budget: lead.budget,
      moment: lead.moment,
      message: lead.message,
      source: lead.source,
      status: lead.status,
      createdAt: lead.createdAt
    };

    localStorage.setItem('admin_leads_list', JSON.stringify([adminLead, ...adminLeads]));
  }

  function buildWhatsappMessage(lead) {
    const lines = [
      'Olá, Heleno. Quero receber uma curadoria de imóveis de alto padrão.',
      '',
      `Nome: ${lead.name}`,
      `WhatsApp: ${lead.whatsapp}`,
      lead.email ? `E-mail: ${lead.email}` : '',
      lead.region ? `Região de interesse: ${lead.region}` : '',
      lead.type ? `Tipo de imóvel: ${lead.type}` : '',
      lead.goal ? `Objetivo: ${lead.goal}` : '',
      lead.budget ? `Faixa de investimento: ${lead.budget}` : '',
      lead.moment ? `Momento de compra: ${lead.moment}` : '',
      lead.message ? `Mensagem: ${lead.message}` : ''
    ].filter(Boolean);

    return encodeURIComponent(lines.join('\n'));
  }

  function setFeedback(message, type) {
    const feedback = $('formFeedback');

    if (!feedback) return;

    feedback.textContent = message;
    feedback.dataset.type = type || 'success';
  }

  function resetForm() {
    const form = $('contactForm');

    if (form) {
      form.reset();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    // Verificar LGPD
    const lgpdCheck = document.getElementById('lgpdConsent');
    if (lgpdCheck && !lgpdCheck.checked) {
      const lang = (typeof HA_I18N !== 'undefined') ? HA_I18N.getLang() : 'pt';
      const msgs = {
        pt: 'Autorize o uso das informações para continuar.',
        en: 'Please accept the privacy policy to continue.',
        es: 'Autorice el uso de la información para continuar.',
        fr: 'Veuillez accepter la politique de confidentialité pour continuer.',
      };
      setFeedback(msgs[lang] || msgs.pt, 'error');
      lgpdCheck.focus();
      return;
    }

    const lead = getLeadData();
    const error = validateLead(lead);

    if (error) {
      setFeedback(error, 'error');
      return;
    }

    // Loading state
    const btn = document.getElementById('formSubmitBtn');
    if (btn) { btn.disabled = true; btn.textContent = '...'; }

    saveLead(lead);

    const lang = (typeof HA_I18N !== 'undefined') ? HA_I18N.getLang() : 'pt';
    const successMsgs = {
      pt: 'Informações enviadas. Abrindo WhatsApp...',
      en: 'Information sent. Opening WhatsApp...',
      es: 'Información enviada. Abriendo WhatsApp...',
      fr: 'Informations envoyées. Ouverture de WhatsApp...',
    };
    setFeedback(successMsgs[lang] || successMsgs.pt, 'success');

    const message = buildWhatsappMessage(lead);
    const url = `https://wa.me/${whatsappNumber}?text=${message}`;

    setTimeout(() => {
      window.open(url, '_blank');
      resetForm();
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.originalText || 'Enviar'; }
    }, 600);
  }

  function handleSaveOnly() {
    const lead = getLeadData();
    const error = validateLead(lead);

    if (error) {
      setFeedback(error, 'error');
      return;
    }

    saveLead(lead);
    setFeedback('Informações enviadas para Heleno com sucesso.', 'success');
    resetForm();
  }

  function initWhatsappMask() {
    const field = $('leadWhatsapp');

    if (!field) return;

    field.addEventListener('input', () => {
      field.value = maskWhatsapp(field.value);
    });
  }

  function revealSections() {
    const elements = document.querySelectorAll(
      '.contact-info-card, .contact-form, .channel-card'
    );

    if (!elements.length) return;

    elements.forEach((element) => {
      element.classList.add('reveal-item');
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.14
    });

    elements.forEach((element) => observer.observe(element));
  }

  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const targetId = link.getAttribute('href');

        if (!targetId || targetId === '#') return;

        const target = document.querySelector(targetId);

        if (!target) return;

        event.preventDefault();

        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      });
    });
  }

  function bindEvents() {
    $('contactForm')?.addEventListener('submit', handleSubmit);
    $('saveLeadOnly')?.addEventListener('click', handleSaveOnly);
  }

  function init() {
    bindEvents();
    initWhatsappMask();
    revealSections();
    initSmoothAnchors();
  }

  document.addEventListener('DOMContentLoaded', init);
})();