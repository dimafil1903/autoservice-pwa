const AdminDB = {
  _url: null,

  init(url) { this._url = url; },

  async get(action, params = {}) {
    const u = new URL(this._url);
    u.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
    const r = await fetch(u.toString());
    if (!r.ok) throw new Error('Network error');
    return r.json();
  },

  async post(action, data = {}) {
    const r = await fetch(this._url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, ...data })
    });
    if (!r.ok) throw new Error('Network error');
    return r.json();
  },

  getMasters:    ()          => AdminDB.get('getMasters'),
  addMaster:     d           => AdminDB.post('addMaster', d),
  updateStatus:  (id, s)     => AdminDB.post('updateMasterStatus', { id, status: s }),
  logActivity:   (pin)       => AdminDB.post('logActivity', { pin }),
  authPin:       (pin)       => AdminDB.get('auth', { pin })
};
