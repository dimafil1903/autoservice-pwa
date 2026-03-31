const Onboarding = {
  // Called on app init — check URL params for invite token
  check() {
    const params = new URLSearchParams(window.location.search);

    // Invite link: ?invite=TOKEN → show register form
    if (params.get('invite')) {
      const token = params.get('invite');
      history.replaceState({}, '', location.pathname);
      DB.init(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
      App.showScreen('screen-login');
      setTimeout(() => Auth.showRegisterForm(token), 100);
      return true;
    }

    return false;
  }
};
