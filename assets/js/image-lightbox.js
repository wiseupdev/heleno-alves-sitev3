(function () {
  function initImageLightbox() {
    const triggers = document.querySelectorAll('[data-lightbox-src]');
    if (!triggers.length) return;

    let lightbox = document.getElementById('imageLightbox');

    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'imageLightbox';
      lightbox.className = 'image-lightbox';
      lightbox.setAttribute('aria-hidden', 'true');

      lightbox.innerHTML = [
        '<button class="image-lightbox-close" type="button" aria-label="Fechar imagem">×</button>',
        '<div class="image-lightbox-backdrop"></div>',
        '<figure class="image-lightbox-content" role="dialog" aria-modal="true" aria-label="Imagem ampliada">',
        '  <img id="imageLightboxImg" src="" alt="">',
        '</figure>',
      ].join('');

      document.body.appendChild(lightbox);
    }

    const img = lightbox.querySelector('#imageLightboxImg');
    const closeBtn = lightbox.querySelector('.image-lightbox-close');
    const backdrop = lightbox.querySelector('.image-lightbox-backdrop');

    function openLightbox(src, alt) {
      if (!src || !img) return;
      img.src = src;
      img.alt = alt || 'Imagem ampliada';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
      if (img) {
        img.removeAttribute('src');
        img.alt = '';
      }
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var src = trigger.getAttribute('data-lightbox-src');
        var alt = trigger.getAttribute('alt') || 'Imagem ampliada';
        openLightbox(src, alt);
      });

      trigger.setAttribute('tabindex', '0');
      trigger.setAttribute('role', 'button');

      trigger.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          var src = trigger.getAttribute('data-lightbox-src');
          var alt = trigger.getAttribute('alt') || 'Imagem ampliada';
          openLightbox(src, alt);
        }
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (backdrop) backdrop.addEventListener('click', closeLightbox);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && lightbox.classList.contains('is-open')) {
        closeLightbox();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initImageLightbox);
})();
