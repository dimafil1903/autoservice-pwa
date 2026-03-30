const Onboarding = {

  // Called on app init — check URL params first
  check() {
    const params = new URLSearchParams(window.location.search);

    // Case 1: setup done — came back from Sheet with scriptUrl
    if (params.get('setup') === 'done') {
      const scriptUrl = params.get('scriptUrl');
      if (scriptUrl) {
        localStorage.setItem('scriptUrl', scriptUrl);
        DB.init(scriptUrl);
        history.replaceState({}, '', location.pathname);
        this.showComplete();
        return true;
      }
    }

    // Case 2: invite link — ?invite=TOKEN → показуємо форму реєстрації
    if (params.get('invite')) {
      const token = params.get('invite');
      history.replaceState({}, '', location.pathname);
      // Ініціалізуємо DB перед реєстрацією
      if (CONFIG && CONFIG.SUPABASE_URL) {
        DB.init(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
      }
      App.showScreen('screen-login');
      setTimeout(() => Auth.showRegisterForm(token), 100);
      return true;
    }

    // Case 3: already set up
    const saved = localStorage.getItem('scriptUrl');
    if (saved) {
      DB.init(saved);
      return false; // let Auth.init handle it
    }

    // Case 4: no script url, no invite — show plain URL entry
    return false;
  },

  showWelcome(token) {
    App.hideNav();
    App.showScreen('screen-onboarding-welcome');
    document.getElementById('onboarding-token').textContent = token;
  },

  startSetup() {
    if (!CONFIG.TEMPLATE_SHEET_ID) {
      // Fallback if not configured — show manual URL entry
      App.showScreen('screen-auth');
      return;
    }
    App.showScreen('screen-onboarding-sheet');
    const copyUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.TEMPLATE_SHEET_ID}/copy`;
    window.open(copyUrl, '_blank');
  },

  sheetCopied() {
    // User confirmed they copied the sheet — nothing to do here,
    // we wait for redirect back from Apps Script setup()
    // Show a "waiting" hint
    document.getElementById('onboarding-waiting-hint').classList.remove('hidden');
  },

  showComplete() {
    App.hideNav();
    App.showScreen('screen-onboarding-complete');
    // Detect iOS for install instructions
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    document.getElementById('ios-install-hint').classList.toggle('hidden', !isIOS);
  },

  enterApp() {
    App.showMain();
  },

  // Fallback: manual URL paste (skip onboarding)
  manualUrl() {
    App.showScreen('screen-auth');
  }
};
