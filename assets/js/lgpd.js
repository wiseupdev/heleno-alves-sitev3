(function () {
  const LGPD_VERSION = '2026-01';

  function initLgpdPopup() {
    const banner = document.getElementById('lgpdBanner');
    const acceptButton = document.getElementById('acceptLgpd');

    if (!banner || !acceptButton) return;

    const acceptedVersion = localStorage.getItem('heleno_lgpd_version');

    if (acceptedVersion !== LGPD_VERSION) {
      banner.removeAttribute('hidden');
      banner.classList.add('is-visible');
    }

    acceptButton.addEventListener('click', function () {
      localStorage.setItem('heleno_lgpd_accept', new Date().toISOString());
      localStorage.setItem('heleno_lgpd_version', LGPD_VERSION);

      banner.classList.remove('is-visible');
      banner.setAttribute('hidden', '');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLgpdPopup);
  } else {
    initLgpdPopup();
  }
})();