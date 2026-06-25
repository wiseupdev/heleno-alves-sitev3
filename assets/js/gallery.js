/**
 * gallery.js — Heleno Alves
 * Galeria fullscreen premium com swipe, contador, miniaturas e navegação por teclado.
 * Mobile-first. Trava scroll do body quando aberta.
 */
const HA_GALLERY = (function () {
  let images = [];
  let current = 0;
  let overlay = null;

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'ha-gallery-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Galeria de fotos');
    overlay.innerHTML = `
      <button class="ha-gallery-close" aria-label="Fechar galeria">×</button>
      <div class="ha-gallery-counter"><span id="haGalCurrent">1</span> / <span id="haGalTotal">1</span></div>
      <button class="ha-gallery-nav ha-gallery-prev" aria-label="Foto anterior">‹</button>
      <div class="ha-gallery-stage">
        <img id="haGalImg" src="" alt="" />
        <div class="ha-gallery-spinner" id="haGalSpinner"></div>
      </div>
      <button class="ha-gallery-nav ha-gallery-next" aria-label="Próxima foto">›</button>
      <div class="ha-gallery-thumbs" id="haGalThumbs"></div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('.ha-gallery-close').addEventListener('click', close);
    overlay.querySelector('.ha-gallery-prev').addEventListener('click', () => go(-1));
    overlay.querySelector('.ha-gallery-next').addEventListener('click', () => go(1));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    // Swipe mobile
    let startX = 0, startY = 0;
    const stage = overlay.querySelector('.ha-gallery-stage');
    stage.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    stage.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        go(dx > 0 ? -1 : 1);
      }
    }, { passive: true });

    // Teclado
    document.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    });
  }

  function renderThumbs() {
    const wrap = overlay.querySelector('#haGalThumbs');
    wrap.innerHTML = images.map((src, i) =>
      `<button class="ha-gallery-thumb ${i === current ? 'active' : ''}" data-idx="${i}" aria-label="Foto ${i+1}">
        <img loading="lazy" decoding="async" width="64" height="48" src="${src}" alt="" />
      </button>`
    ).join('');
    wrap.querySelectorAll('.ha-gallery-thumb').forEach(btn => {
      btn.addEventListener('click', () => show(parseInt(btn.dataset.idx, 10)));
    });
  }

  function show(idx) {
    current = (idx + images.length) % images.length;
    const img = overlay.querySelector('#haGalImg');
    const spinner = overlay.querySelector('#haGalSpinner');

    spinner.style.display = 'block';
    img.style.opacity = '0';

    const tmp = new Image();
    tmp.onload = () => {
      img.src = images[current];
      img.style.opacity = '1';
      spinner.style.display = 'none';
    };
    tmp.onerror = () => { spinner.style.display = 'none'; };
    tmp.src = images[current];

    overlay.querySelector('#haGalCurrent').textContent = current + 1;
    overlay.querySelectorAll('.ha-gallery-thumb').forEach((t, i) => {
      t.classList.toggle('active', i === current);
    });
  }

  function go(dir) { show(current + dir); }

  function open(imgList, startIdx) {
    if (!Array.isArray(imgList) || !imgList.length) return;
    images = imgList;
    if (!overlay) build();
    overlay.querySelector('#haGalTotal').textContent = images.length;
    renderThumbs();
    show(startIdx || 0);
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  return { open, close };
})();

if (typeof window !== 'undefined') window.HA_GALLERY = HA_GALLERY;