// Admin DB — використовує service key для повного доступу
const AdminDB = {
  _init() {
    // Адмін використовує service key якщо є
    const key = CONFIG.SUPABASE_SERVICE_KEY || CONFIG.SUPABASE_ANON_KEY;
    DB.init(CONFIG.SUPABASE_URL, key);
  },

  async get(table, params) {
    this._init();
    return DB._get(table, params);
  },

  async post(action, data) {
    this._init();
    if (action === 'generateInvite') return DB.generateInvite();
    if (action === 'getMasters')     return DB.getMasters();
    if (action === 'registerMaster') return DB.addMaster(data);
    if (action === 'updateMasterStatus') return DB.updateMasterStatus(data.id, data.status);
    throw new Error('Unknown action: ' + action);
  }
};
