(function () {
  const page = document.body.dataset.page;

  if (page !== 'sobre') return;

  function revealSections() {
    const elements = document.querySelectorAll(
      '.bio-image, .bio-content, .value-card, .work-panel article, .senna-highlight, .pillar-card, .media-card, .media-note'
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

  function initSennaCarousel() {
    const carousel = document.getElementById('sennaCarousel');
    const prev = document.getElementById('sennaPrev');
    const next = document.getElementById('sennaNext');
    if (!carousel || !prev || !next) return;

    const scrollBy = () => carousel.querySelector('.senna-slide')?.offsetWidth + 14 || 360;

    prev.addEventListener('click', () => {
      carousel.scrollBy({ left: -scrollBy(), behavior: 'smooth' });
    });
    next.addEventListener('click', () => {
      carousel.scrollBy({ left: scrollBy(), behavior: 'smooth' });
    });
  }

  function init() {
    revealSections();
    initSmoothAnchors();
    initSennaCarousel();
  }

  document.addEventListener('DOMContentLoaded', init);
})();