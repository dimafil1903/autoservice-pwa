// ─── Supabase Auth ────────────────────────────────────
const Auth = {
  SESSION_KEY: 'as_session',
  SESSION_DAYS: 30,

  // ── Init ─────────────────────────────────────────────
  async init() {
    DB.init(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

    const session = this.loadSession();
    if (session) {
      // Перевіряємо чи не протух токен
      if (this.isExpired(session)) {
        const refreshed = await this.refresh(session.refresh_token);
        if (refreshed) {
          this.applySession(refreshed);
          return;
        }
        this.logout();
        return;
      }
      this.applySession(session);
      return;
    }

    this.showLoginScreen();
  },

  // ── Session storage ───────────────────────────────────
  saveSession(data) {
    const session = {
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      user_id:       data.user?.id || data.user_id,
      email:         data.user?.email || data.email,
      role:          data.user?.user_metadata?.role || data.role || 'master',
      master_id:     data.user?.user_metadata?.master_id || data.master_id || null,
      expires_at:    Date.now() + this.SESSION_DAYS * 24 * 3600 * 1000
    };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    return session;
  },

  loadSession() {
    try {
      return JSON.parse(localStorage.getItem(this.SESSION_KEY));
    } catch { return null; }
  },

  isExpired(session) {
    return !session.expires_at || Date.now() > session.expires_at - 5 * 60 * 1000;
  },

  async applySession(session) {
    // Оновлюємо DB з поточним токеном
    DB.init(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    DB._authToken = session.access_token;
    DB._headers = function() {
      return {
        'apikey': this._key,
        'Authorization': `Bearer ${this._authToken || this._key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };
    };

    // Завантажуємо master_id якщо немає
    let masterId = session.master_id;
    if (!masterId && session.role !== 'admin') {
      const masters = await DB._get('masters', { user_id: `eq.${session.user_id}` }).catch(() => []);
      masterId = masters[0]?.id || null;
    }

    if (masterId) DB.setMaster(masterId);

    App.currentRole = session.role;
    App.currentUser = session;
    App.showMain();
  },

  // ── Login ─────────────────────────────────────────────
  showLoginScreen() {
    App.hideNav();
    App.showScreen('screen-login');
  },

  async login(email, password) {
    const btn = document.getElementById('btn-login');
    const err = document.getElementById('login-error');
    err.textContent = '';
    btn.disabled = true;
    btn.textContent = '...';

    try {
      const res = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        err.textContent = '❌ ' + (data.error_description || data.msg || 'Невірний логін або пароль');
        return;
      }

      const session = this.saveSession(data);
      await this.applySession(session);
      App.toast('Вхід виконано ✓', 'success');

    } catch (e) {
      err.textContent = '❌ Помилка з\'єднання';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Увійти';
    }
  },

  // ── Refresh ───────────────────────────────────────────
  async refresh(refreshToken) {
    try {
      const res = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return this.saveSession(data);
    } catch { return null; }
  },

  // ── Register (для майстра по invite) ──────────────────
  async register(email, password, name, inviteToken) {
    const err = document.getElementById('register-error');
    err.textContent = '';

    try {
      // Перевіряємо invite
      const invite = await DB._get('invites', { token: `eq.${inviteToken}`, status: 'eq.pending' });
      if (!invite.length) {
        err.textContent = '❌ Невірний або використаний invite токен';
        return;
      }

      // Реєструємо в Supabase Auth
      const res = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, password,
          data: { role: 'master', name, invite_token: inviteToken }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        err.textContent = '❌ ' + (data.msg || data.error_description || 'Помилка реєстрації');
        return;
      }

      // Встановлюємо JWT перед запитами до БД (RLS потребує auth.uid())
      DB._authToken = data.access_token;

      // Створюємо майстра в БД
      const master = await DB.addMaster({ name, invite_token: inviteToken, user_id: data.user?.id, status: 'active' });

      // Позначаємо invite як використаний
      await DB._patch('invites', invite[0].id, { status: 'used', master_id: master.id, used_at: new Date().toISOString() });

      // Оновлюємо user_metadata з master_id
      // (після логіну)
      const session = this.saveSession({ ...data, master_id: master.id, role: 'master' });
      await this.applySession(session);
      App.toast('Акаунт створено ✓', 'success');

    } catch (e) {
      err.textContent = '❌ Помилка: ' + e.message;
    }
  },

  // ── Form switching ────────────────────────────────────
  showLoginForm() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('reset-form').classList.add('hidden');
  },
  showRegisterForm(inviteToken) {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
    document.getElementById('reset-form').classList.add('hidden');
    if (inviteToken) {
      document.getElementById('register-invite-token').value = inviteToken;
      document.getElementById('register-invite-info').textContent = `Invite: ${inviteToken}`;
    }
  },
  showResetForm() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('reset-form').classList.remove('hidden');
  },

  // ── Logout ────────────────────────────────────────────
  async logout() {
    const session = this.loadSession();
    if (session?.access_token) {
      fetch(`${CONFIG.SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': `Bearer ${session.access_token}` }
      }).catch(() => {});
    }
    localStorage.removeItem(this.SESSION_KEY);
    DB._authToken = null;
    App.hideNav();
    App.showScreen('screen-login');
  },

  // ── Password reset ────────────────────────────────────
  async resetPassword(email) {
    await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/recover`, {
      method: 'POST',
      headers: { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    App.toast('Лист надіслано на ' + email, 'success');
  }
};
