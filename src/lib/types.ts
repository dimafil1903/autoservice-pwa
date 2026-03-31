export interface Client {
  id: string
  master_id: string
  name: string
  phone: string | null
  created_at: string
}

export interface Car {
  id: string
  client_id: string
  brand: string
  model: string
  year: number | null
  vin: string | null
  plate: string | null
  color: string | null
}

export interface Order {
  id: string
  car_id: string
  date_in: string | null
  date_out: string | null
  problem: string | null
  status: OrderStatus
  mileage: number | null
  mileage_out: number | null
  created_at: string
}

export type OrderStatus = 'new' | 'in_progress' | 'done' | 'closed'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Нове',
  in_progress: 'В роботі',
  done: 'Виконано',
  closed: 'Закрито',
}

export interface OrderItem {
  id: string
  order_id: string
  type: 'work' | 'part'
  name: string
  qty: number
  unit: string
  price: number
  total: number
}

export interface FinanceRecord {
  id: string
  master_id: string
  type: 'income' | 'expense'
  amount: number
  category: string | null
  date: string
  order_id: string | null
  comment: string | null
  created_at: string
}

export interface Master {
  id: string
  name: string | null
  phone: string | null
  status: 'active' | 'blocked' | 'pending'
  user_id: string | null
  invite_token: string | null
  registered_at: string
}

export interface Invite {
  id: string
  token: string
  status: 'pending' | 'used' | 'expired'
  master_id: string | null
  created_at: string
  used_at: string | null
}

export interface Session {
  access_token: string
  refresh_token: string
  user_id: string
  email: string
  role: 'master' | 'admin'
  master_id: string | null
  expires_at: number
}

export interface DashboardStats {
  ordersToday: number
  ordersActive: number
  revenueMonth: number
  totalClients: number
}
