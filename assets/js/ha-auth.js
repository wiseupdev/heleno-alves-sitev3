/**
 * ha-auth.js — Heleno Alves
 * Autenticação real via webhook antigo haimoveisDATABASE
 *   - event_name: "check_login" / "create_account"
 *   - tenant_id : "1911202511"
 *
 * IMPORTANTE — limitação conhecida: o painel admin é estático
 * (HTML/JS no front). Mesmo com login real, qualquer pessoa pode
 * abrir o DevTools e setar a flag de sessão. O ideal é proteger as
 * rotas admin atrás de Netlify Identity / Basic Auth. Aqui mantemos
 * apenas a integração com o backend antigo, sem alterar o webhook.
 */
(function (root) {
  const URL_DB     = 'https://webhook.wiseuptech.com.br/webhook/haimoveisDATABASE';
  const TENANT_ID  = '1911202511';

  async function postJSON(body) {
    const res = await fetch(URL_DB, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`auth HTTP ${res.status}`);
    return res.json().catch(() => null);
  }

  async function checkLogin(email, password) {
    const data = await postJSON({
      event_name: 'check_login',
      email, password,
      tenant_id: TENANT_ID,
    });
    if (Array.isArray(data) && data.length > 0) {
      const user = data[0];
      // Heurística: se vier full_name/user_email, é login válido
      if (user && (user.user_email || user.username || user.full_name)) {
        return user;
      }
    }
    return null;
  }

  async function createAccount({ nome, email, senha, whatsapp }) {
    const data = await postJSON({
      event_name: 'create_account',
      name: nome,
      email,
      password: senha,
      whatsapp,
      tenant_id: TENANT_ID,
    });
    if (Array.isArray(data) && data.length > 0) {
      const status = data[0].account_status;
      if (status === 'Conta criada com sucesso!') {
        return { success: true, message: 'Cadastro realizado com sucesso! Acesse com seu e-mail e senha.' };
      }
      if (status === 'Este email já está sendo usado!') {
        return { success: false, message: 'Já existe uma conta com esse e-mail.' };
      }
    }
    return { success: false, message: 'Não foi possível criar a conta. Tente novamente.' };
  }

  /* ─── Sessão (cliente) ────────────────────────────────────────── */
  const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8h

  function saveAdminSession(user) {
    const payload = {
      email: user.user_email || user.username || '',
      name:  user.full_name || '',
      expiry: Date.now() + SESSION_TTL_MS,
      user,
    };
    localStorage.setItem('heleno_admin_token',  btoa(unescape(encodeURIComponent(JSON.stringify(payload)))));
    localStorage.setItem('heleno_admin_logged', 'true');
    localStorage.setItem('heleno_admin_email',  payload.email);
  }

  function clearAdminSession() {
    localStorage.removeItem('heleno_admin_token');
    localStorage.removeItem('heleno_admin_logged');
    localStorage.removeItem('heleno_admin_email');
  }

  function checkAdminToken() {
    try {
      const raw = localStorage.getItem('heleno_admin_token');
      if (!raw) return false;
      const data = JSON.parse(decodeURIComponent(escape(atob(raw))));
      if (!data || !data.expiry || Date.now() > data.expiry) {
        clearAdminSession();
        return false;
      }
      return true;
    } catch (_) {
      clearAdminSession();
      return false;
    }
  }

  function saveUserSession(user) {
    localStorage.setItem('heleno_user_logged', 'true');
    localStorage.setItem('heleno_user_email',  user.user_email || user.email || '');
    const profile = {
      email: user.user_email || user.email || '',
      name:  user.full_name || user.name || '',
      lastLogin: new Date().toISOString(),
      user,
    };
    localStorage.setItem('heleno_user_profile', JSON.stringify(profile));
  }

  root.HA_AUTH = {
    checkLogin, createAccount,
    saveAdminSession, clearAdminSession, checkAdminToken,
    saveUserSession,
  };
})(window);
