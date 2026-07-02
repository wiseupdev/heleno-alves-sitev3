/**
 * usuario-login.js — Heleno Alves
 * Login do usuário final via webhook real (haimoveisDATABASE).
 */
(function () {
  const $ = (id) => document.getElementById(id);

  function showFeedback(message, type) {
    const feedback = $('loginFeedback');
    if (!feedback) return;
    feedback.textContent = message;
    feedback.className = `login-feedback ${type}`;
  }
  function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

  async function handleLogin(event) {
    event.preventDefault();
    const email    = $('userEmail')?.value.trim() || '';
    const password = $('userPassword')?.value || '';

    if (!email || !password) return showFeedback('Preencha e-mail e senha para continuar.', 'error');
    if (!isValidEmail(email)) return showFeedback('Digite um e-mail válido.', 'error');
    if (password.length < 4)  return showFeedback('A senha precisa ter pelo menos 4 caracteres.', 'error');
    if (typeof HA_AUTH === 'undefined') return showFeedback('Falha ao carregar autenticação.', 'error');

    showFeedback('Verificando...', 'info');
    try {
      const user = await HA_AUTH.checkLogin(email, password);
      if (!user) { await new Promise(r => setTimeout(r, 400)); return showFeedback('E-mail ou senha inválidos.', 'error'); }
      HA_AUTH.saveUserSession(user);
      showFeedback('Login realizado. Redirecionando para sua conta...', 'success');
      setTimeout(() => { window.location.href = 'minha-conta.html'; }, 700);
    } catch (err) {
      console.error('[USER LOGIN] erro:', err);
      showFeedback('Não foi possível validar agora. Tente novamente.', 'error');
    }
  }

  function init() {
    const form = $('userLoginForm');
    if (form) form.addEventListener('submit', handleLogin);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
