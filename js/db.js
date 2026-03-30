// ─── Supabase REST client ────────────────────────────
const DB = {
  _url: null,
  _key: null,
  _masterId: null,
  _authToken: null,  // JWT access token після логіну

  init(url, key) {
    this._url = url.replace(/\/$/, '');
    this._key = key;
  },

  setMaster(id) { this._masterId = id; },

  _headers() {
    return {
      'apikey': this._key,
      'Authorization': `Bearer ${this._authToken || this._key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  },

  async _get(table, params = {}) {
    const u = new URL(`${this._url}/rest/v1/${table}`);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
    u.searchParams.set('select', '*');
    const r = await fetch(u.toString(), { headers: this._headers() });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async _post(table, body) {
    const r = await fetch(`${this._url}/rest/v1/${table}`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    return Array.isArray(data) ? data[0] : data;
  },

  async _patch(table, id, body) {
    const r = await fetch(`${this._url}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers: this._headers(),
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    return Array.isArray(data) ? data[0] : data;
  },

  async _delete(table, id) {
    const r = await fetch(`${this._url}/rest/v1/${table}?id=eq.${id}`, {
      method: 'DELETE',
      headers: this._headers()
    });
    if (!r.ok) throw new Error(await r.text());
    return { ok: true };
  },

  // ── PING ──────────────────────────────────────────
  async ping() {
    const r = await fetch(`${this._url}/rest/v1/masters?limit=1`, { headers: this._headers() });
    return { ok: r.ok };
  },

  // ── CLIENTS ───────────────────────────────────────
  getClients() {
    return this._get('clients', { master_id: `eq.${this._masterId}`, order: 'created_at.desc' });
  },
  addClient(d) {
    return this._post('clients', { ...d, master_id: this._masterId });
  },
  updateClient(d) {
    const { id, ...rest } = d;
    return this._patch('clients', id, rest);
  },

  // ── CARS ──────────────────────────────────────────
  getCars(clientId) {
    return this._get('cars', { client_id: `eq.${clientId}` });
  },
  addCar(d) {
    return this._post('cars', d);
  },

  // ── ORDERS ────────────────────────────────────────
  async getOrders(filters = {}) {
    // Потрібно JOIN через cars → clients → master_id
    // Використовуємо вбудований Supabase select з join
    const u = new URL(`${this._url}/rest/v1/orders`);
    u.searchParams.set('select', '*, cars!inner(client_id, clients!inner(master_id))');
    u.searchParams.set('cars.clients.master_id', `eq.${this._masterId}`);
    u.searchParams.set('order', 'created_at.desc');
    if (filters.status) u.searchParams.set('status', `eq.${filters.status}`);
    const r = await fetch(u.toString(), { headers: this._headers() });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    // Спростити структуру
    return data.map(o => { const { cars, ...rest } = o; return rest; });
  },
  addOrder(d) {
    return this._post('orders', d);
  },
  updateOrder(d) {
    const { id, ...rest } = d;
    return this._patch('orders', id, rest);
  },

  // ── ORDER ITEMS ───────────────────────────────────
  getOrderItems(orderId) {
    return this._get('order_items', { order_id: `eq.${orderId}` });
  },
  addOrderItem(d) {
    const qty   = parseFloat(d.qty || 1);
    const price = parseFloat(d.price || 0);
    const total = parseFloat(d.total || qty * price);
    return this._post('order_items', { ...d, qty, price, total });
  },
  deleteOrderItem(id) {
    return this._delete('order_items', id);
  },

  // ── FINANCE ───────────────────────────────────────
  getFinance(month = '') {
    const params = { master_id: `eq.${this._masterId}`, order: 'date.desc' };
    if (month) params.date = `gte.${month}-01`;
    return this._get('finance', params);
  },
  addFinance(d) {
    return this._post('finance', { ...d, master_id: this._masterId });
  },

  // ── STATS ─────────────────────────────────────────
  async getStats() {
    const today = new Date().toISOString().split('T')[0];
    const month = today.slice(0, 7);

    const [clients, orders, finance] = await Promise.all([
      this._get('clients', { master_id: `eq.${this._masterId}`, select: 'id' }),
      this.getOrders(),
      this._get('finance', { master_id: `eq.${this._masterId}`, type: 'eq.income', date: `gte.${month}-01` })
    ]);

    return {
      totalClients:  clients.length,
      ordersToday:   orders.filter(o => o.date_in === today).length,
      ordersActive:  orders.filter(o => ['new','in_progress'].includes(o.status)).length,
      revenueMonth:  finance.reduce((s, f) => s + parseFloat(f.amount || 0), 0)
    };
  },

  // ── INVITES (admin) ───────────────────────────────
  generateInvite() {
    const token = 'INV-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    return this._post('invites', { token, status: 'pending' }).then(r => ({
      ok: true,
      token: r.token,
      url: `${CONFIG.PWA_URL}?invite=${r.token}`
    }));
  },
  checkInvite(token) {
    return this._get('invites', { token: `eq.${token}` }).then(rows => {
      if (!rows.length) return { valid: false };
      return { valid: true, status: rows[0].status };
    });
  },
  useInvite(token, masterId) {
    return this._get('invites', { token: `eq.${token}` }).then(rows => {
      if (!rows.length) return;
      return this._patch('invites', rows[0].id, { status: 'used', master_id: masterId, used_at: new Date().toISOString() });
    });
  },

  // ── MASTERS (admin) ───────────────────────────────
  getMasters() {
    return this._get('masters', { order: 'registered_at.desc' });
  },
  addMaster(d) {
    return this._post('masters', d);
  },
  updateMasterStatus(id, status) {
    return this._patch('masters', id, { status });
  },
  async authWithToken(token) {
    // Перевіряємо invite токен → повертаємо master
    const invites = await this._get('invites', { token: `eq.${token}`, status: 'eq.pending' });
    if (!invites.length) return { valid: false };
    return { valid: true, inviteId: invites[0].id };
  },
  async registerMaster(name, inviteToken) {
    const master = await this._post('masters', {
      name, invite_token: inviteToken, status: 'active'
    });
    // Позначити invite як використаний
    const invites = await this._get('invites', { token: `eq.${inviteToken}` });
    if (invites.length) {
      await this._patch('invites', invites[0].id, { status: 'used', master_id: master.id, used_at: new Date().toISOString() });
    }
    return master;
  }
};
