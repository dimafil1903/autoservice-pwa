const App = {
  currentScreen: null,

  async init() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
    Finance.init();

    // Onboarding check comes first (invite tokens, setup=done redirect)
    const handled = Onboarding.check();
    if (!handled) Auth.init();
  },

  showMain() {
    this.showNav();
    this.navigate('dashboard');
  },

  showNav() {
    document.getElementById('bottom-nav').classList.remove('hidden');
  },

  hideNav() {
    document.getElementById('bottom-nav').classList.add('hidden');
  },

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const s = document.getElementById(id);
    if (s) s.classList.add('active');
    this.currentScreen = id;
  },

  navigate(tab) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    const active = document.querySelector(`.nav-tab[data-tab="${tab}"]`);
    if (active) active.classList.add('active');

    switch (tab) {
      case 'dashboard':
        this.showScreen('screen-dashboard');
        this.loadDashboard();
        break;
      case 'clients':
        this.showScreen('screen-clients');
        Clients.load();
        break;
      case 'orders':
        this.showScreen('screen-orders');
        Orders.load();
        break;
      case 'finance':
        this.showScreen('screen-finance');
        Finance.load();
        break;
      case 'settings':
        this.showScreen('screen-settings');
        this.loadSettings();
        break;
    }
  },

  async loadDashboard() {
    try {
      const stats = await DB.getStats();
      document.getElementById('stat-today').textContent   = stats.ordersToday  || 0;
      document.getElementById('stat-active').textContent  = stats.ordersActive || 0;
      document.getElementById('stat-revenue').textContent = (stats.revenueMonth || 0).toFixed(0) + ' грн';
      document.getElementById('stat-clients').textContent = stats.totalClients  || 0;
    } catch {
      // silent fail
    }
  },

  loadSettings() {
    document.getElementById('settings-fop-name').value    = localStorage.getItem('fopName')    || '';
    document.getElementById('settings-fop-ipn').value     = localStorage.getItem('fopIpn')     || '';
    document.getElementById('settings-fop-address').value = localStorage.getItem('fopAddress') || '';
    document.getElementById('settings-fop-phone').value   = localStorage.getItem('fopPhone')   || '';
    document.getElementById('settings-fop-city').value    = localStorage.getItem('fopCity')    || '';
    document.getElementById('settings-script-url').value  = localStorage.getItem('scriptUrl')  || '';
  },

  saveSettings() {
    localStorage.setItem('fopName',    document.getElementById('settings-fop-name').value.trim());
    localStorage.setItem('fopIpn',     document.getElementById('settings-fop-ipn').value.trim());
    localStorage.setItem('fopAddress', document.getElementById('settings-fop-address').value.trim());
    localStorage.setItem('fopPhone',   document.getElementById('settings-fop-phone').value.trim());
    localStorage.setItem('fopCity',    document.getElementById('settings-fop-city').value.trim());
    const url = document.getElementById('settings-script-url').value.trim();
    if (url) { localStorage.setItem('scriptUrl', url); DB.init(url); }
    this.toast('Збережено ✓', 'success');
  },

  async testConnection() {
    try {
      const r = await DB.ping();
      this.toast(r.ok ? 'З\'єднання OK ✓' : 'Помилка відповіді', r.ok ? 'success' : 'error');
    } catch {
      this.toast('Немає з\'єднання', 'error');
    }
  },

  setLoading(screenId, on) {
    const s = document.getElementById(screenId);
    if (!s) return;
    let loader = s.querySelector('.screen-loader');
    if (on) {
      if (!loader) {
        loader = document.createElement('div');
        loader.className = 'screen-loader loading-center';
        loader.innerHTML = '<div class="spinner"></div>';
        s.querySelector('.screen-body')?.prepend(loader);
      }
    } else {
      loader?.remove();
    }
  },

  toast(msg, type = '') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'show' + (type ? ' ' + type : '');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
  },

  goBack() {
    history.back();
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
