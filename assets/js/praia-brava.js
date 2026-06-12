(function () {
  const page = document.body.dataset.page;

  if (page !== 'brava') return;

  function getRegionParamLink() {
    const links = document.querySelectorAll('a[href="imoveis.html?region=Praia%20Brava"]');

    links.forEach((link) => {
      link.addEventListener('click', function () {
        localStorage.setItem('heleno_region_filter', 'Praia Brava');
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
    }, {
      threshold: 0.4
    });

    numberCards.forEach((card) => observer.observe(card));
  }

  function revealSections() {
    const elements = document.querySelectorAll(
      '.intro-card, .number-card, .profile-card, .driver-card, .lifestyle-image, .lifestyle-point'
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

  function initValueChart() {
    const chartCard = document.getElementById('bravaValueChart');

    if (!chartCard) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        chartCard.classList.add('is-visible');
        observer.unobserve(chartCard);
      });
    }, {
      threshold: 0.3
    });

    observer.observe(chartCard);
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

  function init() {
    getRegionParamLink();
    animateNumbers();
    revealSections();
    initValueChart();
    initSmoothAnchors();
  }

  document.addEventListener('DOMContentLoaded', init);
})();