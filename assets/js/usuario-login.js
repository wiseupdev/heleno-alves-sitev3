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

  function handleLogin(event) {
    event.preventDefault();

    const email = $('userEmail')?.value.trim() || '';
    const password = $('userPassword')?.value.trim() || '';

    if (!email || !password) {
      showFeedback('Preencha e-mail e senha para continuar.', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showFeedback('Digite um e-mail válido.', 'error');
      return;
    }

    if (password.length < 4) {
      showFeedback('A senha precisa ter pelo menos 4 caracteres.', 'error');
      return;
    }

    localStorage.setItem('heleno_user_logged', 'true');
    localStorage.setItem('heleno_user_email', email);

    const savedProfile = JSON.parse(localStorage.getItem('heleno_user_profile') || '{}');

    localStorage.setItem('heleno_user_profile', JSON.stringify({
      ...savedProfile,
      email,
      lastLogin: new Date().toISOString()
    }));

    showFeedback('Login realizado. Redirecionando para sua conta...', 'success');

    setTimeout(() => {
      window.location.href = 'minha-conta.html';
    }, 700);
  }

  function initLogin() {
    const form = $('userLoginForm');

    if (!form) return;

    form.addEventListener('submit', handleLogin);
  }

  document.addEventListener('DOMContentLoaded', initLogin);
})();