const DB = {
  _url: null,

  init(url) {
    this._url = url;
  },

  async get(action, params = {}) {
    const u = new URL(this._url);
    u.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
    const r = await fetch(u.toString());
    if (!r.ok) throw new Error('Network error: ' + r.status);
    return r.json();
  },

  async post(action, data = {}) {
    const r = await fetch(this._url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, ...data })
    });
    if (!r.ok) throw new Error('Network error: ' + r.status);
    return r.json();
  },

  ping: ()                 => DB.get('ping'),
  getClients: ()           => DB.get('getClients'),
  addClient: d             => DB.post('addClient', d),
  updateClient: d          => DB.post('updateClient', d),
  getCars: clientId        => DB.get('getCars', { client_id: clientId }),
  addCar: d                => DB.post('addCar', d),
  getOrders: (f = {})      => DB.get('getOrders', f),
  addOrder: d              => DB.post('addOrder', d),
  updateOrder: d           => DB.post('updateOrder', d),
  getOrderItems: orderId   => DB.get('getOrderItems', { order_id: orderId }),
  addOrderItem: d          => DB.post('addOrderItem', d),
  deleteOrderItem: id      => DB.post('deleteOrderItem', { id }),
  getFinance: (month = '') => DB.get('getFinance', { month }),
  addFinance: d            => DB.post('addFinance', d),
  getStats: ()             => DB.get('getStats')
};
