const Admin = {
  masters: [],

  init() {
    // Ініціалізуємо DB одразу при старті
    if (CONFIG && CONFIG.SUPABASE_URL) {
      DB.init(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    }

    // Перевіряємо сесію
    const session = JSON.parse(localStorage.getItem('as_session') || 'null');
    if (session && session.role === 'admin') {
      DB._authToken = session.access_token;
      this.showPanel();
      this.load();
    } else {
      this.showLogin();
    }
  },

  showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-panel').style.display = 'none';
  },

  async login() {
    const email    = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const err      = document.getElementById('login-error');
    err.textContent = '';

    try {
      const res = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) { err.textContent = '❌ ' + (data.error_description || 'Невірний логін'); return; }

      const role = data.user?.user_metadata?.role;
      if (role !== 'admin') { err.textContent = '❌ Немає прав адміна'; return; }

      // Зберігаємо сесію (30 днів)
      localStorage.setItem('as_session', JSON.stringify({
        access_token: data.access_token, refresh_token: data.refresh_token,
        role: 'admin', user_id: data.user.id,
        expires_at: Date.now() + 30 * 24 * 3600 * 1000
      }));

      DB._authToken = data.access_token;
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('admin-panel').style.display = 'block';
      this.load();
    } catch (e) {
      err.textContent = '❌ Помилка з\'єднання';
    }
  },

  // Залишаємо для сумісності
  checkPassword() { this.login(); },

  showPanel() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
  },

  async load() {
    const tbody = document.getElementById('masters-tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px">Завантаження...</td></tr>';
    try {
      this.masters = await AdminDB.getMasters();
      this.render();
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#f44336">Помилка завантаження</td></tr>';
    }
  },

  render() {
    const tbody = document.getElementById('masters-tbody');
    if (!this.masters.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#888">Майстрів немає</td></tr>';
      return;
    }
    tbody.innerHTML = this.masters.map(m => `
      <tr>
        <td>${m.id ? m.id.slice(-8) : '—'}</td>
        <td>${m.name || '—'}</td>
        <td>${m.phone || '—'}</td>
        <td><span class="status-badge ${m.status}">${m.status === 'active' ? '✅ Активний' : '❌ Заблоковано'}</span></td>
        <td>${m.registered_at || '—'}</td>
        <td>
          ${m.status === 'active'
            ? `<button class="btn-action danger" onclick="Admin.block('${m.id}')">Блок</button>`
            : `<button class="btn-action success" onclick="Admin.unblock('${m.id}')">Розблок</button>`
          }
        </td>
      </tr>
    `).join('');
  },

  async block(id) {
    if (!confirm('Заблокувати майстра?')) return;
    try {
      await AdminDB.updateStatus(id, 'blocked');
      this.load();
    } catch { alert('Помилка'); }
  },

  async unblock(id) {
    try {
      await AdminDB.updateStatus(id, 'active');
      this.load();
    } catch { alert('Помилка'); }
  },

  showAddForm() {
    document.getElementById('modal-add-master').style.display = 'flex';
  },

  hideAddForm() {
    document.getElementById('modal-add-master').style.display = 'none';
  },

  async generateInvite() {
    try {
      const res = await AdminDB.generateInvite();
      const box = document.getElementById('invite-result');
      box.classList.remove('hidden');
      document.getElementById('invite-url').textContent = res.url;
      document.getElementById('invite-token').textContent = res.token;
    } catch { alert('Помилка генерації токену'); }
  },

  copyInvite() {
    const url = document.getElementById('invite-url').textContent;
    navigator.clipboard.writeText(url).then(() => alert('Посилання скопійовано!'));
  },

  async saveMaster() {
    const name  = document.getElementById('master-name').value.trim();
    const phone = document.getElementById('master-phone').value.trim();

    try {
      await AdminDB.addMaster({ name, phone, status: 'active' });
      this.hideAddForm();
      this.load();
    } catch { alert('Помилка збереження'); }
  }
};

document.addEventListener('DOMContentLoaded', () => Admin.init());
