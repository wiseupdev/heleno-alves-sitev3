/**
 * usuario-cadastro.js — Heleno Alves
 * Cadastro de usuário via webhook real (haimoveisDATABASE / create_account).
 */
(function () {
  const $ = (id) => document.getElementById(id);

  function showFeedback(message, type) {
    const feedback = $('registerFeedback');
    if (!feedback) return;
    feedback.textContent = message;
    feedback.className = `register-feedback ${type}`;
  }
  function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
  function onlyNumbers(value)  { return String(value || '').replace(/\D/g, ''); }

  function formatWhatsapp(value) {
    const numbers = onlyNumbers(value).slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }
  function handleWhatsappMask(event) { event.target.value = formatWhatsapp(event.target.value); }

  async function handleRegister(event) {
    event.preventDefault();
    const name     = $('userName')?.value.trim() || '';
    const whatsapp = $('userWhatsapp')?.value.trim() || '';
    const email    = $('userEmail')?.value.trim() || '';
    const password = $('userPassword')?.value || '';

    if (!name || !whatsapp || !email || !password) return showFeedback('Preencha todos os campos para criar sua conta.', 'error');
    if (name.length < 3) return showFeedback('Digite seu nome completo.', 'error');
    if (onlyNumbers(whatsapp).length < 10) return showFeedback('Digite um WhatsApp válido.', 'error');
    if (!isValidEmail(email)) return showFeedback('Digite um e-mail válido.', 'error');
    if (password.length < 4) return showFeedback('A senha precisa ter pelo menos 4 caracteres.', 'error');
    if (typeof HA_AUTH === 'undefined') return showFeedback('Falha ao carregar autenticação.', 'error');

    showFeedback('Criando conta...', 'info');
    try {
      const result = await HA_AUTH.createAccount({ nome: name, email, senha: password, whatsapp });
      if (!result.success) return showFeedback(result.message, 'error');
      showFeedback(result.message + ' Redirecionando para login...', 'success');
      setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    } catch (err) {
      console.error('[USER SIGNUP] erro:', err);
      showFeedback('Não foi possível criar a conta agora. Tente novamente.', 'error');
    }
  }

  function init() {
    const form = $('userRegisterForm');
    const whatsapp = $('userWhatsapp');
    if (whatsapp) whatsapp.addEventListener('input', handleWhatsappMask);
    if (form) form.addEventListener('submit', handleRegister);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
