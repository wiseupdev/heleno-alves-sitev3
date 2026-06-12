/**
 * admin-login.js — Heleno Alves
 * Autenticação do painel admin
 * ATENÇÃO: credenciais protegidas por hash SHA-256 com salt
 * Nunca commitar senha em texto plano
 */
(function () {
  const $ = (id) => document.getElementById(id);

  // Credenciais — hash SHA-256(salt + senha), não reversível
  // Para alterar: gerar novo hash com scripts/gerar-hash-admin.js
  const ADMIN_EMAIL = 'admin@helenoalves.com.br';
  const ADMIN_SALT  = 'ccb1a4e3f481b4a234c8f88d350c2629';
  const ADMIN_HASH  = 'cce57547e0cce912524c323b48c381464cc342a7f36d60ccb78743c7cd8c81bb';

  function showFeedback(message, type) {
    const feedback = $('loginFeedback');
    if (!feedback) return;
    feedback.textContent = message;
    feedback.className = `login-feedback ${type}`;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function hashPassword(salt, password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(salt + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function handleLogin(event) {
    event.preventDefault();

    const email    = $('adminEmail')?.value.trim() || '';
    const password = $('adminPassword')?.value || '';

    if (!email || !password) {
      showFeedback('Preencha e-mail e senha para continuar.', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showFeedback('Digite um e-mail válido.', 'error');
      return;
    }

    // Verifica e-mail
    if (email !== ADMIN_EMAIL) {
      // Delay para evitar timing attack
      await new Promise(r => setTimeout(r, 800));
      showFeedback('Credenciais inválidas.', 'error');
      return;
    }

    // Verifica hash da senha
    const inputHash = await hashPassword(ADMIN_SALT, password);
    if (inputHash !== ADMIN_HASH) {
      await new Promise(r => setTimeout(r, 800));
      showFeedback('Credenciais inválidas.', 'error');
      return;
    }

    // Login válido — salva token com expiração de 8h
    const expiry = Date.now() + (8 * 60 * 60 * 1000);
    const tokenData = btoa(JSON.stringify({ email, expiry }));
    localStorage.setItem('heleno_admin_token', tokenData);
    localStorage.setItem('heleno_admin_logged', 'true');
    localStorage.setItem('heleno_admin_email', email);

    showFeedback('Acesso liberado. Redirecionando...', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
  }

  // Verificar token com expiração
  function checkAdminToken() {
    const raw = localStorage.getItem('heleno_admin_token');
    if (!raw) return false;
    try {
      const data = JSON.parse(atob(raw));
      if (Date.now() > data.expiry) {
        localStorage.removeItem('heleno_admin_token');
        return false;
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  // Se já logado e na login page, redireciona
  if (window.location.pathname.includes('login') && checkAdminToken()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form = document.getElementById('adminLoginForm') || document.querySelector('form');
  if (form) form.addEventListener('submit', handleLogin);

  // Expor para uso nos guards
  window.checkAdminToken = checkAdminToken;
})();