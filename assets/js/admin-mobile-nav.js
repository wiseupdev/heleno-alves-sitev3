/**
 * admin-mobile-nav.js — Heleno Alves
 * Drawer de navegação mobile para o painel admin.
 * Injetado automaticamente em ≤1023px. Desktop: sem efeito.
 */
(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  // ── Detectar página ativa ────────────────────────────────────────
  function getActivePage() {
    const path = window.location.pathname;
    if (path.includes('dashboard'))   return 'dashboard.html';
    if (path.includes('imovel-form')) return 'imovel-form.html';
    if (path.includes('imoveis'))     return 'imoveis.html';
    if (path.includes('leads'))       return 'leads.html';
    if (path.includes('analytics'))   return 'analytics.html';
    return '';
  }

  // ── Itens do menu ────────────────────────────────────────────────
  const NAV_ITEMS = [
    { href: 'dashboard.html',   label: 'Dashboard' },
    { href: 'imoveis.html',     label: 'Imóveis' },
    { href: 'imovel-form.html', label: 'Cadastrar imóvel' },
    { href: 'leads.html',       label: 'Leads' },
    { href: 'analytics.html',   label: 'Analytics' },
    { href: '../index.html',    label: 'Ver site ↗', external: true },
  ];

  const active = getActivePage();

  // ── Criar estrutura do drawer ────────────────────────────────────
  function buildDrawer() {
    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'adm-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    // Drawer
    const drawer = document.createElement('div');
    drawer.className = 'adm-drawer';
    drawer.setAttribute('role', 'navigation');
    drawer.setAttribute('aria-label', 'Menu admin');
    drawer.setAttribute('aria-hidden', 'true');

    // Cabeçalho do drawer
    drawer.innerHTML = `
      <div class="adm-drawer-head">
        <div class="adm-drawer-brand">
          <strong>Heleno Alves</strong>
          <span>Painel Admin</span>
        </div>
        <button class="adm-close" aria-label="Fechar menu">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <nav class="adm-mobile-nav">
        ${NAV_ITEMS.map(item => `
          <a href="${item.href}"
             class="adm-mobile-link${item.href === active ? ' is-active' : ''}"
             ${item.external ? 'target="_blank" rel="noopener"' : ''}>
            ${item.label}
          </a>`).join('')}
      </nav>`;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    return { overlay, drawer };
  }

  // ── Criar header mobile do admin ─────────────────────────────────
  function buildMobileHeader(onToggle) {
    const header = document.createElement('header');
    header.className = 'adm-mobile-header';
    header.innerHTML = `
      <a href="../index.html" class="adm-mobile-brand">
        <strong>Heleno Alves</strong>
        <span>Painel Admin</span>
      </a>
      <button class="adm-toggle" aria-label="Abrir menu" aria-expanded="false">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>`;

    header.querySelector('.adm-toggle').addEventListener('click', onToggle);
    return header;
  }

  // ── Lógica abrir/fechar ──────────────────────────────────────────
  function initDrawer() {
    const sidebar = document.querySelector('.admin-sidebar');
    const adminPage = document.querySelector('.admin-page');
    if (!sidebar || !adminPage) return;

    const { overlay, drawer } = buildDrawer();
    let isOpen = false;

    function open() {
      isOpen = true;
      overlay.classList.add('is-open');
      drawer.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('adm-drawer-open');
      // Foco no primeiro link
      const first = drawer.querySelector('.adm-mobile-link');
      if (first) setTimeout(() => first.focus(), 80);
      const btn = document.querySelector('.adm-toggle');
      if (btn) btn.setAttribute('aria-expanded', 'true');
    }

    function close() {
      isOpen = false;
      overlay.classList.remove('is-open');
      drawer.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('adm-drawer-open');
      const btn = document.querySelector('.adm-toggle');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    function toggle() {
      isOpen ? close() : open();
    }

    // Header mobile
    const mobileHeader = buildMobileHeader(toggle);
    adminPage.insertBefore(mobileHeader, adminPage.firstChild);

    // Fechar ao clicar no overlay
    overlay.addEventListener('click', close);

    // Fechar ao clicar em link do drawer
    drawer.querySelectorAll('.adm-mobile-link').forEach(link => {
      link.addEventListener('click', close);
    });

    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) close();
    });

    // Botão fechar dentro do drawer
    drawer.querySelector('.adm-close').addEventListener('click', close);
  }

  // ── Init apenas no mobile/tablet ─────────────────────────────────
  function init() {
    if (window.innerWidth > 1023) return;
    initDrawer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();