/**
 * admin-login.js — Heleno Alves
 * Login do painel admin via webhook real (haimoveisDATABASE).
 * Toda a verificação acontece no backend N8n; o front apenas marca a
 * sessão (com TTL) para liberar o painel estático.
 *
 * NOTA DE SEGURANÇA: o painel admin é servido estático. Para uma
 * proteção real, recomenda-se também adicionar Netlify Identity /
 * Basic Auth nas rotas /admin/* — ver README de integração.
 */
(function () {
  const $ = (id) => document.getElementById(id);

  function showFeedback(message, type) {
    const feedback = $('loginFeedback');
    if (!feedback) return;
    feedback.textContent = message;
    feedback.className = `login-feedback ${type}`;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
    if (typeof HA_AUTH === 'undefined') {
      showFeedback('Falha ao carregar autenticação. Recarregue a página.', 'error');
      return;
    }

    showFeedback('Verificando...', 'info');

    try {
      const user = await HA_AUTH.checkLogin(email, password);
      if (!user) {
        await new Promise(r => setTimeout(r, 400));
        showFeedback('Credenciais inválidas.', 'error');
        return;
      }
      HA_AUTH.saveAdminSession(user);
      showFeedback('Acesso liberado. Redirecionando...', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
    } catch (err) {
      console.error('[ADMIN LOGIN] erro:', err);
      showFeedback('Não foi possível validar agora. Tente novamente.', 'error');
    }
  }

  // Se já logado, redireciona
  if (window.location.pathname.includes('login') &&
      typeof HA_AUTH !== 'undefined' && HA_AUTH.checkAdminToken()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form = document.getElementById('adminLoginForm') || document.querySelector('form');
  if (form) form.addEventListener('submit', handleLogin);

  // Expor para guards inline
  if (typeof HA_AUTH !== 'undefined') {
    window.checkAdminToken = HA_AUTH.checkAdminToken;
  }
})();
