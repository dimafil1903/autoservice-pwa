const Auth = {
  pin: '',
  MAX_PIN: 4,

  init() {
    this.renderNumpad();
    this.updateDots();

    // Ініціалізуємо DB з Supabase
    if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
      DB.init(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    }

    // Перевіряємо збережений master_id
    const savedMasterId = localStorage.getItem('masterId');
    if (savedMasterId) {
      DB.setMaster(savedMasterId);
      App.showMain();
      return;
    }

    App.showScreen('screen-auth');
  },

  renderNumpad() {
    const pad = document.getElementById('numpad');
    const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
    pad.innerHTML = keys.map(k => {
      if (k === '') return `<div class="numpad-btn empty"></div>`;
      if (k === '⌫') return `<div class="numpad-btn del" onclick="Auth.del()">⌫</div>`;
      return `<div class="numpad-btn" onclick="Auth.press('${k}')">${k}</div>`;
    }).join('');
  },

  press(digit) {
    if (this.pin.length >= this.MAX_PIN) return;
    this.pin += digit;
    this.updateDots();
    if (this.pin.length === this.MAX_PIN) {
      setTimeout(() => this.submit(), 100);
    }
  },

  del() {
    this.pin = this.pin.slice(0, -1);
    this.updateDots();
  },

  updateDots() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((d, i) => d.classList.toggle('filled', i < this.pin.length));
  },

  async submit() {
    // Шукаємо майстра за PIN (invite_token == pin для простоти)
    try {
      const masters = await DB._get('masters', { invite_token: `eq.${this.pin}`, status: 'eq.active' });
      if (masters.length) {
        const master = masters[0];
        localStorage.setItem('masterId', master.id);
        localStorage.setItem('masterName', master.name || '');
        DB.setMaster(master.id);
        // Оновлюємо last_active
        DB._patch('masters', master.id, { last_active: new Date().toISOString() });
        App.toast('Вхід виконано ✓', 'success');
        App.showMain();
      } else {
        document.getElementById('auth-error').textContent = '❌ Невірний PIN';
        this.pin = '';
        this.updateDots();
      }
    } catch (e) {
      document.getElementById('auth-error').textContent = '❌ Помилка з\'єднання';
      this.pin = '';
      this.updateDots();
    }
  },

  async loginWithUrl(url) {
    // Не використовується в Supabase версії, але залишаємо для сумісності
    App.toast('Використовуйте PIN для входу', '');
  },

  logout() {
    localStorage.removeItem('masterId');
    localStorage.removeItem('masterName');
    this.pin = '';
    App.showScreen('screen-auth');
    App.hideNav();
  }
};
