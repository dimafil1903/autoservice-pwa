const Auth = {
  pin: '',
  MAX_PIN: 4,

  init() {
    this.renderNumpad();
    this.updateDots();

    // Check saved scriptUrl
    const saved = localStorage.getItem('scriptUrl');
    if (saved) {
      DB.init(saved);
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
    if (!CONFIG.ADMIN_SCRIPT_URL) {
      // No admin script — direct URL entry mode
      App.toast('Введіть URL скрипту нижче', 'error');
      this.pin = '';
      this.updateDots();
      return;
    }

    try {
      const url = CONFIG.ADMIN_SCRIPT_URL + '?action=auth&pin=' + this.pin;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'active' && data.scriptUrl) {
        localStorage.setItem('scriptUrl', data.scriptUrl);
        DB.init(data.scriptUrl);
        App.toast('Вхід виконано ✓', 'success');
        App.showMain();
      } else if (data.status === 'blocked') {
        document.getElementById('auth-error').textContent = '❌ Акаунт заблоковано. Зверніться до адміністратора.';
        this.pin = '';
        this.updateDots();
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
    if (!url.startsWith('https://script.google.com')) {
      App.toast('Невірний URL', 'error');
      return;
    }
    try {
      DB.init(url);
      const res = await DB.ping();
      if (res.ok) {
        localStorage.setItem('scriptUrl', url);
        App.toast('Підключено ✓', 'success');
        App.showMain();
      } else {
        App.toast('Скрипт не відповів', 'error');
      }
    } catch {
      App.toast('Помилка з\'єднання', 'error');
    }
  },

  logout() {
    localStorage.removeItem('scriptUrl');
    this.pin = '';
    App.showScreen('screen-auth');
    App.hideNav();
  }
};
