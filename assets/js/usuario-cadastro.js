(function () {
  const $ = (id) => document.getElementById(id);

  function showFeedback(message, type) {
    const feedback = $('registerFeedback');

    if (!feedback) return;

    feedback.textContent = message;
    feedback.className = `register-feedback ${type}`;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function onlyNumbers(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function formatWhatsapp(value) {
    const numbers = onlyNumbers(value).slice(0, 11);

    if (numbers.length <= 2) {
      return numbers;
    }

    if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    }

    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }

  function handleWhatsappMask(event) {
    event.target.value = formatWhatsapp(event.target.value);
  }

  function handleRegister(event) {
    event.preventDefault();

    const name = $('userName')?.value.trim() || '';
    const whatsapp = $('userWhatsapp')?.value.trim() || '';
    const email = $('userEmail')?.value.trim() || '';
    const password = $('userPassword')?.value.trim() || '';

    if (!name || !whatsapp || !email || !password) {
      showFeedback('Preencha todos os campos para criar sua conta.', 'error');
      return;
    }

    if (name.length < 3) {
      showFeedback('Digite seu nome completo.', 'error');
      return;
    }

    if (onlyNumbers(whatsapp).length < 10) {
      showFeedback('Digite um WhatsApp válido.', 'error');
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

    const profile = {
      name,
      whatsapp,
      email,
      createdAt: new Date().toISOString(),
      preferences: {},
      favorites: JSON.parse(localStorage.getItem('heleno_favorites') || '[]')
    };

    localStorage.setItem('heleno_user_logged', 'true');
    localStorage.setItem('heleno_user_email', email);
    localStorage.setItem('heleno_user_profile', JSON.stringify(profile));

    showFeedback('Cadastro criado com sucesso. Redirecionando para sua conta...', 'success');

    setTimeout(() => {
      window.location.href = 'minha-conta.html';
    }, 700);
  }

  function initRegister() {
    const form = $('userRegisterForm');
    const whatsapp = $('userWhatsapp');

    if (whatsapp) {
      whatsapp.addEventListener('input', handleWhatsappMask);
    }

    if (form) {
      form.addEventListener('submit', handleRegister);
    }
  }

  document.addEventListener('DOMContentLoaded', initRegister);
})();