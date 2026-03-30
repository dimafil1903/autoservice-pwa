// Admin DB — використовує anon key + JWT (RLS через is_admin())
const AdminDB = {
  _init() {
    if (!DB._url && CONFIG && CONFIG.SUPABASE_URL) {
      DB.init(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    }
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
