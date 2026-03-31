// Admin DB — використовує anon key + JWT (RLS через is_admin())
const AdminDB = {
  _init() {
    if (!DB._url && CONFIG && CONFIG.SUPABASE_URL) {
      DB.init(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    }
  },

  async getMasters() {
    this._init();
    return DB.getMasters();
  },

  async updateStatus(id, status) {
    this._init();
    return DB.updateMasterStatus(id, status);
  },

  async generateInvite() {
    this._init();
    return DB.generateInvite();
  },

  async addMaster(data) {
    this._init();
    return DB.addMaster(data);
  }
};
