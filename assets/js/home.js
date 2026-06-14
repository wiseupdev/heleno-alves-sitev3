(function () {
  const page = document.body.dataset.page;

  if (page !== 'home') return;

  function markHomeLoaded() {
    document.body.classList.add('home-loaded');
  }

  function applyHeroImage() {
    const hero = document.querySelector('.hero[data-hero-img]');
    if (!hero) return;
    // Escolhe imagem conforme a largura (mobile vs desktop)
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const img = (isMobile ? hero.dataset.heroImg : (hero.dataset.heroImgDesktop || hero.dataset.heroImg));
    if (!img) return;
    const absolute = new URL(img, window.location.href).href;
    hero.style.setProperty('--hero-img', `url("${absolute}")`);
  }

  function initHome() {
    markHomeLoaded();
    applyHeroImage();
  }

  document.addEventListener('DOMContentLoaded', initHome);
})();