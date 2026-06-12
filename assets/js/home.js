(function () {
  const page = document.body.dataset.page;

  if (page !== 'home') return;

  function markHomeLoaded() {
    document.body.classList.add('home-loaded');
  }

  function applyHeroImage() {
    const hero = document.querySelector('.hero[data-hero-img]');
    if (!hero) return;
    const img = hero.dataset.heroImg;
    if (!img) return;
    // Resolve o caminho absoluto relativo ao index.html (raiz do site)
    // e aplica o background diretamente no ::before via style no elemento pai
    const absolute = new URL(img, window.location.href).href;
    hero.style.setProperty('--hero-img', `url("${absolute}")`);
  }

  function initHome() {
    markHomeLoaded();
    applyHeroImage();
  }

  document.addEventListener('DOMContentLoaded', initHome);
})();