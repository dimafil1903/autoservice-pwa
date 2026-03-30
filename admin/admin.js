const Admin = {
  masters: [],

  init() {
    const savedUrl = localStorage.getItem('adminScriptUrl') || CONFIG.ADMIN_SCRIPT_URL;
    if (savedUrl) AdminDB.init(savedUrl);

    const authed = sessionStorage.getItem('adminAuthed');
    if (!authed) {
      this.showLogin();
    } else {
      this.showPanel();
      this.load();
    }
  },

  showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-panel').style.display = 'none';
  },

  checkPassword() {
    const pw = document.getElementById('admin-password').value;
    if (pw === CONFIG.ADMIN_PASSWORD) {
      sessionStorage.setItem('adminAuthed', '1');
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('admin-panel').style.display = 'block';
      this.load();
    } else {
      document.getElementById('login-error').textContent = '❌ Невірний пароль';
    }
  },

  showPanel() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
  },

  async load() {
    const tbody = document.getElementById('masters-tbody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px">Завантаження...</td></tr>';
    try {
      this.masters = await AdminDB.getMasters();
      this.render();
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#f44336">Помилка завантаження</td></tr>';
    }
  },

  render() {
    const tbody = document.getElementById('masters-tbody');
    if (!this.masters.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#888">Майстрів немає</td></tr>';
      return;
    }
    tbody.innerHTML = this.masters.map(m => `
      <tr>
        <td>${m.master_id || '—'}</td>
        <td>${m.name || '—'}</td>
        <td>${m.phone || '—'}</td>
        <td><small style="word-break:break-all">${m.script_url || '—'}</small></td>
        <td><span class="status-badge ${m.status}">${m.status === 'active' ? '✅ Активний' : '❌ Заблоковано'}</span></td>
        <td>${m.registered_at || '—'}</td>
        <td>
          ${m.status === 'active'
            ? `<button class="btn-action danger" onclick="Admin.block('${m.master_id}')">Блок</button>`
            : `<button class="btn-action success" onclick="Admin.unblock('${m.master_id}')">Розблок</button>`
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

  async saveMaster() {
    const name       = document.getElementById('master-name').value.trim();
    const phone      = document.getElementById('master-phone').value.trim();
    const script_url = document.getElementById('master-script-url').value.trim();
    const pin        = document.getElementById('master-pin').value.trim();

    if (!name || !pin) { alert('Ім\'я та PIN обов\'язкові'); return; }

    try {
      await AdminDB.addMaster({ name, phone, script_url, pin, status: 'active' });
      this.hideAddForm();
      this.load();
    } catch { alert('Помилка збереження'); }
  }
};

document.addEventListener('DOMContentLoaded', () => Admin.init());
