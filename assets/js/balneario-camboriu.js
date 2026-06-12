(function () {
  const page = document.body.dataset.page;

  if (page !== 'bc') return;

  function getRegionParamLink() {
    const links = document.querySelectorAll('a[href="imoveis.html?region=BC"]');
    links.forEach((link) => {
      link.addEventListener('click', function () {
        localStorage.setItem('heleno_region_filter', 'BC');
      });
    });
  }

  function animateNumbers() {
    const numberCards = document.querySelectorAll('.number-card strong');
    if (!numberCards.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('number-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    numberCards.forEach((card) => observer.observe(card));
  }

  function revealSections() {
    const elements = document.querySelectorAll(
      '.intro-card, .number-card, .timeline-item, .driver-card, .area-card, .premium-image'
    );
    if (!elements.length) return;
    elements.forEach((element) => { element.classList.add('reveal-item'); });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14 });
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
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function init() {
    getRegionParamLink();
    animateNumbers();
    revealSections();
    initSmoothAnchors();
    initMarketChart();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

function initMarketChart() {
  const chartCard = document.getElementById('marketChartCard');
  if (!chartCard) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      chartCard.classList.add('is-visible');
      observer.unobserve(chartCard);
    });
  }, { threshold: 0.35 });
  observer.observe(chartCard);
}

/* ─── Atualiza textos SVG do gráfico ao trocar idioma ─────────── */
function updateChartTexts() {
  if (typeof HA_I18N === 'undefined') return;
  const t = (k) => HA_I18N.t(k);
  const ids = {
    chartVal1: 'bc_chart_v1', chartVal2: 'bc_chart_v2',
    chartVal3: 'bc_chart_v3', chartVal4: 'bc_chart_v4',
    chartVal5: 'bc_chart_v5',
    chartAxis1: 'bc_chart_a1', chartAxis2: 'bc_chart_a2',
    chartAxis3: 'bc_chart_a3', chartAxis4: 'bc_chart_a4',
    chartAxis5: 'bc_chart_a5',
  };
  Object.entries(ids).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  });
}

window.addEventListener('ha:langchange', updateChartTexts);
document.addEventListener('DOMContentLoaded', updateChartTexts);