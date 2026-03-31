const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const PWA_URL = import.meta.env.VITE_PWA_URL || 'https://dimafil1903.github.io/autoservice-pwa/'

class SupabaseClient {
  private masterId: string | null = null
  private authToken: string | null = null

  setAuth(token: string | null) { this.authToken = token }
  setMaster(id: string | null) { this.masterId = id }
  getMasterId() { return this.masterId }
  getUrl() { return SUPABASE_URL }
  getKey() { return SUPABASE_ANON_KEY }
  getPwaUrl() { return PWA_URL }

  private headers() {
    return {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${this.authToken || SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    }
  }

  async get<T = any>(table: string, params: Record<string, string> = {}): Promise<T[]> {
    const u = new URL(`${SUPABASE_URL}/rest/v1/${table}`)
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v))
    if (!params.select) u.searchParams.set('select', '*')
    const r = await fetch(u.toString(), { headers: this.headers() })
    if (!r.ok) throw new Error(await r.text())
    return r.json()
  }

  async post<T = any>(table: string, body: Record<string, any>): Promise<T> {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST', headers: this.headers(), body: JSON.stringify(body),
    })
    if (!r.ok) throw new Error(await r.text())
    const data = await r.json()
    return Array.isArray(data) ? data[0] : data
  }

  async patch<T = any>(table: string, id: string, body: Record<string, any>): Promise<T> {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH', headers: this.headers(), body: JSON.stringify(body),
    })
    if (!r.ok) throw new Error(await r.text())
    const data = await r.json()
    return Array.isArray(data) ? data[0] : data
  }

  async del(table: string, id: string): Promise<void> {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'DELETE', headers: this.headers(),
    })
    if (!r.ok) throw new Error(await r.text())
  }

  async ping() {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/masters?limit=1`, { headers: this.headers() })
    return { ok: r.ok }
  }

  // -- Clients --
  getClients() { return this.get('clients', { master_id: `eq.${this.masterId}`, order: 'created_at.desc' }) }
  addClient(d: { name: string; phone: string | null }) { return this.post('clients', { ...d, master_id: this.masterId }) }

  // -- Cars --
  getCars(clientId: string) { return this.get('cars', { client_id: `eq.${clientId}` }) }
  addCar(d: Record<string, any>) { return this.post('cars', d) }

  // -- Orders (JOIN through cars->clients->master_id) --
  async getOrders(statusFilter?: string) {
    const u = new URL(`${SUPABASE_URL}/rest/v1/orders`)
    u.searchParams.set('select', '*, cars!inner(client_id, clients!inner(master_id))')
    u.searchParams.set('cars.clients.master_id', `eq.${this.masterId}`)
    u.searchParams.set('order', 'created_at.desc')
    if (statusFilter) u.searchParams.set('status', `eq.${statusFilter}`)
    const r = await fetch(u.toString(), { headers: this.headers() })
    if (!r.ok) throw new Error(await r.text())
    const data = await r.json()
    // Remove nested cars structure from response
    return data.map((o: any) => { const { cars, ...rest } = o; return rest })
  }
  addOrder(d: Record<string, any>) { return this.post('orders', d) }
  updateOrder(id: string, body: Record<string, any>) { return this.patch('orders', id, body) }

  // -- Order Items --
  getOrderItems(orderId: string) { return this.get('order_items', { order_id: `eq.${orderId}` }) }
  addOrderItem(d: Record<string, any>) {
    const qty = parseFloat(d.qty || 1)
    const price = parseFloat(d.price || 0)
    const total = parseFloat(d.total || String(qty * price))
    return this.post('order_items', { ...d, qty, price, total })
  }
  deleteOrderItem(id: string) { return this.del('order_items', id) }

  // -- Finance --
  getFinance(month?: string) {
    const params: Record<string, string> = { master_id: `eq.${this.masterId}`, order: 'date.desc' }
    if (month) params.date = `gte.${month}-01`
    return this.get('finance', params)
  }
  addFinance(d: Record<string, any>) { return this.post('finance', { ...d, master_id: this.masterId }) }

  // -- Stats --
  async getStats() {
    const today = new Date().toISOString().split('T')[0]
    const month = today.slice(0, 7)
    const [clients, orders, finance] = await Promise.all([
      this.get('clients', { master_id: `eq.${this.masterId}`, select: 'id' }),
      this.getOrders(),
      this.get('finance', { master_id: `eq.${this.masterId}`, type: 'eq.income', date: `gte.${month}-01` }),
    ])
    return {
      totalClients: clients.length,
      ordersToday: orders.filter((o: any) => o.date_in === today).length,
      ordersActive: orders.filter((o: any) => ['new', 'in_progress'].includes(o.status)).length,
      revenueMonth: finance.reduce((s: number, f: any) => s + parseFloat(f.amount || 0), 0),
    }
  }

  // -- Invites (admin) --
  generateInvite() {
    const token = 'INV-' + Math.random().toString(36).substr(2, 8).toUpperCase()
    return this.post('invites', { token, status: 'pending' }).then((r: any) => ({
      ok: true, token: r.token, url: `${PWA_URL}?invite=${r.token}`,
    }))
  }

  // -- Masters (admin) --
  getMasters() { return this.get('masters', { order: 'registered_at.desc' }) }
  addMaster(d: Record<string, any>) { return this.post('masters', d) }
  updateMasterStatus(id: string, status: string) { return this.patch('masters', id, { status }) }
}

export const db = new SupabaseClient()
