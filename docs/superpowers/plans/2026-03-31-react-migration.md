# React Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate autoservice-pwa from vanilla JS to Vite + React + TypeScript with native iOS feel on all iPhones.

**Architecture:** SPA with React Router, Supabase REST client (raw fetch, no SDK), shadcn/ui components with bottom-sheet forms, Tailwind for styling with safe-area support. Auth via React Context. PWA via vite-plugin-pwa.

**Tech Stack:** Vite 6, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, React Router 7, react-hook-form + zod, lucide-react, vite-plugin-pwa

**iPhone Compatibility:** `viewport-fit=cover`, `env(safe-area-inset-*)` on all fixed elements, `min-h-dvh`, 16px min input font, 44px min touch targets.

---

## File Structure

```
src/
├── main.tsx                    # Entry: render App
├── App.tsx                     # AuthProvider + RouterProvider
├── index.css                   # Tailwind imports + CSS variables + safe-area utilities
├── lib/
│   ├── supabase.ts             # REST client (port of db.js)
│   ├── auth.tsx                # AuthContext + AuthProvider + useAuth
│   ├── types.ts                # All entity interfaces
│   ├── validation.ts           # Zod schemas
│   └── utils.ts                # cn() helper
├── components/
│   ├── ui/                     # shadcn components (auto-generated)
│   ├── layout/
│   │   ├── AppShell.tsx        # Main layout: header + content + bottom nav
│   │   ├── BottomNav.tsx       # 5-tab nav with safe area
│   │   └── PageHeader.tsx      # Screen header with back button
│   ├── forms/
│   │   ├── ClientForm.tsx      # Add/edit client (Sheet)
│   │   ├── CarForm.tsx         # Add car (Sheet)
│   │   ├── OrderForm.tsx       # New order (Sheet)
│   │   ├── OrderItemForm.tsx   # Add order item (Sheet)
│   │   └── FinanceForm.tsx     # Add transaction (Sheet)
│   └── ActDocument.tsx         # Generate printable Act HTML
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── ClientsPage.tsx
│   ├── ClientDetailPage.tsx
│   ├── OrdersPage.tsx
│   ├── OrderDetailPage.tsx
│   ├── FinancePage.tsx
│   ├── SettingsPage.tsx
│   └── admin/
│       ├── AdminLoginPage.tsx
│       └── AdminPanel.tsx
├── hooks/
│   ├── useClients.ts
│   ├── useOrders.ts
│   ├── useFinance.ts
│   └── useToast.ts
└── vite-env.d.ts
```

---

### Task 1: Scaffold Vite + React + TypeScript Project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`

- [ ] **Step 1: Initialize Vite project in-place**

Since we have existing files, initialize manually:

```bash
npm init -y
npm install react react-dom react-router
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom
```

- [ ] **Step 2: Create vite.config.ts**

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/autoservice-pwa/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Create tsconfig files**

```jsonc
// tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

```jsonc
// tsconfig.app.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

```jsonc
// tsconfig.node.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Create index.html (Vite entry)**

```html
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#2563EB">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Автосервіс">
  <title>Автосервіс</title>
  <link rel="manifest" href="/autoservice-pwa/manifest.json">
  <link rel="icon" href="/autoservice-pwa/icon-192.png">
  <link rel="apple-touch-icon" href="/autoservice-pwa/icon-192.png">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 5: Create minimal src/main.tsx and src/App.tsx**

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

```tsx
// src/App.tsx
export default function App() {
  return <div className="min-h-dvh bg-background text-foreground">AutoService loading...</div>
}
```

```ts
// src/vite-env.d.ts
/// <reference types="vite/client" />
```

- [ ] **Step 6: Verify dev server starts**

```bash
npx vite dev
```
Expected: opens on localhost, shows "AutoService loading..."

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig*.json index.html src/
git commit -m "feat: scaffold Vite + React + TypeScript project"
```

---

### Task 2: Install and Configure Tailwind CSS + shadcn/ui

**Files:**
- Create: `src/index.css`, `src/lib/utils.ts`, `components.json`, `tailwind.config.ts`
- Modify: `package.json` (deps)

- [ ] **Step 1: Install Tailwind and shadcn deps**

```bash
npm install tailwindcss @tailwindcss/vite
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react
```

- [ ] **Step 2: Update vite.config.ts with Tailwind plugin**

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/autoservice-pwa/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Create src/index.css with theme variables and safe-area utilities**

```css
@import "tailwindcss";

@theme {
  --color-background: #0F172A;
  --color-foreground: #F8FAFC;
  --color-card: #1E293B;
  --color-card-foreground: #F8FAFC;
  --color-primary: #2563EB;
  --color-primary-foreground: #FFFFFF;
  --color-secondary: #334155;
  --color-secondary-foreground: #F8FAFC;
  --color-muted: #1E293B;
  --color-muted-foreground: #94A3B8;
  --color-accent: #1E40AF;
  --color-accent-foreground: #F8FAFC;
  --color-destructive: #EF4444;
  --color-destructive-foreground: #FFFFFF;
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-border: #334155;
  --color-input: #334155;
  --color-ring: #2563EB;
  --radius: 0.75rem;
}

/* Safe-area utilities for iPhone */
.safe-top { padding-top: env(safe-area-inset-top); }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
.safe-left { padding-left: env(safe-area-inset-left); }
.safe-right { padding-right: env(safe-area-inset-right); }

/* Prevent iOS input zoom */
input, select, textarea { font-size: 16px !important; }

/* iOS momentum scroll */
.scroll-touch { -webkit-overflow-scrolling: touch; }

/* Disable iOS tap highlight */
* { -webkit-tap-highlight-color: transparent; }

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
  overscroll-behavior: none;
}
```

- [ ] **Step 4: Create src/lib/utils.ts**

```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 5: Initialize shadcn**

```bash
npx shadcn@latest init
```
Select: TypeScript, default style, slate color, CSS variables yes, path alias @/components, utils alias @/lib/utils

- [ ] **Step 6: Add core shadcn components**

```bash
npx shadcn@latest add button input label card badge sheet dialog toast sonner separator tabs scroll-area select
```

- [ ] **Step 7: Verify Tailwind renders**

Update App.tsx:
```tsx
export default function App() {
  return (
    <div className="min-h-dvh bg-background text-foreground flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary">Автосервіс</h1>
        <p className="text-muted-foreground mt-2">Tailwind working</p>
      </div>
    </div>
  )
}
```

```bash
npx vite dev
```
Expected: dark background, blue title, gray subtitle

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: configure Tailwind CSS + shadcn/ui with dark theme"
```

---

### Task 3: Core Library — Types, Supabase Client, Validation

**Files:**
- Create: `src/lib/types.ts`, `src/lib/supabase.ts`, `src/lib/validation.ts`

- [ ] **Step 1: Create src/lib/types.ts**

```ts
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
```

- [ ] **Step 2: Create src/lib/supabase.ts**

Port of db.js with TypeScript types. This is the full Supabase REST client:

```ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const PWA_URL = import.meta.env.VITE_PWA_URL || 'https://dimafil1903.github.io/autoservice-pwa/'

class SupabaseClient {
  private url = SUPABASE_URL.replace(/\/$/, '')
  private key = SUPABASE_ANON_KEY
  private masterId: string | null = null
  private authToken: string | null = null

  setAuth(token: string | null) { this.authToken = token }
  setMaster(id: string | null) { this.masterId = id }
  getMasterId() { return this.masterId }
  getUrl() { return this.url }
  getKey() { return this.key }
  getPwaUrl() { return PWA_URL }

  private headers() {
    return {
      'apikey': this.key,
      'Authorization': `Bearer ${this.authToken || this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    }
  }

  async get<T = any>(table: string, params: Record<string, string> = {}): Promise<T[]> {
    const u = new URL(`${this.url}/rest/v1/${table}`)
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v))
    if (!params.select) u.searchParams.set('select', '*')
    const r = await fetch(u.toString(), { headers: this.headers() })
    if (!r.ok) throw new Error(await r.text())
    return r.json()
  }

  async post<T = any>(table: string, body: Record<string, any>): Promise<T> {
    const r = await fetch(`${this.url}/rest/v1/${table}`, {
      method: 'POST', headers: this.headers(), body: JSON.stringify(body),
    })
    if (!r.ok) throw new Error(await r.text())
    const data = await r.json()
    return Array.isArray(data) ? data[0] : data
  }

  async patch<T = any>(table: string, id: string, body: Record<string, any>): Promise<T> {
    const r = await fetch(`${this.url}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH', headers: this.headers(), body: JSON.stringify(body),
    })
    if (!r.ok) throw new Error(await r.text())
    const data = await r.json()
    return Array.isArray(data) ? data[0] : data
  }

  async del(table: string, id: string): Promise<void> {
    const r = await fetch(`${this.url}/rest/v1/${table}?id=eq.${id}`, {
      method: 'DELETE', headers: this.headers(),
    })
    if (!r.ok) throw new Error(await r.text())
  }

  // ── Domain methods ──────────────────────────
  async ping() {
    const r = await fetch(`${this.url}/rest/v1/masters?limit=1`, { headers: this.headers() })
    return { ok: r.ok }
  }

  // Clients
  getClients() { return this.get('clients', { master_id: `eq.${this.masterId}`, order: 'created_at.desc' }) }
  addClient(d: { name: string; phone: string | null }) { return this.post('clients', { ...d, master_id: this.masterId }) }

  // Cars
  getCars(clientId: string) { return this.get('cars', { client_id: `eq.${clientId}` }) }
  addCar(d: Record<string, any>) { return this.post('cars', d) }

  // Orders (with JOIN for master filtering)
  async getOrders(statusFilter?: string) {
    const u = new URL(`${this.url}/rest/v1/orders`)
    u.searchParams.set('select', '*, cars!inner(client_id, clients!inner(master_id))')
    u.searchParams.set('cars.clients.master_id', `eq.${this.masterId}`)
    u.searchParams.set('order', 'created_at.desc')
    if (statusFilter) u.searchParams.set('status', `eq.${statusFilter}`)
    const r = await fetch(u.toString(), { headers: this.headers() })
    if (!r.ok) throw new Error(await r.text())
    const data = await r.json()
    return data.map((o: any) => { const { cars, ...rest } = o; return rest })
  }
  addOrder(d: Record<string, any>) { return this.post('orders', d) }
  updateOrder(id: string, body: Record<string, any>) { return this.patch('orders', id, body) }

  // Order Items
  getOrderItems(orderId: string) { return this.get('order_items', { order_id: `eq.${orderId}` }) }
  addOrderItem(d: Record<string, any>) {
    const qty = parseFloat(d.qty || 1)
    const price = parseFloat(d.price || 0)
    const total = parseFloat(d.total || String(qty * price))
    return this.post('order_items', { ...d, qty, price, total })
  }
  deleteOrderItem(id: string) { return this.del('order_items', id) }

  // Finance
  getFinance(month?: string) {
    const params: Record<string, string> = { master_id: `eq.${this.masterId}`, order: 'date.desc' }
    if (month) params.date = `gte.${month}-01`
    return this.get('finance', params)
  }
  addFinance(d: Record<string, any>) { return this.post('finance', { ...d, master_id: this.masterId }) }

  // Stats
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

  // Invites (admin)
  generateInvite() {
    const token = 'INV-' + Math.random().toString(36).substr(2, 8).toUpperCase()
    return this.post('invites', { token, status: 'pending' }).then((r: any) => ({
      ok: true, token: r.token, url: `${PWA_URL}?invite=${r.token}`,
    }))
  }

  // Masters (admin)
  getMasters() { return this.get('masters', { order: 'registered_at.desc' }) }
  addMaster(d: Record<string, any>) { return this.post('masters', d) }
  updateMasterStatus(id: string, status: string) { return this.patch('masters', id, { status }) }
}

export const db = new SupabaseClient()
```

- [ ] **Step 3: Create src/lib/validation.ts**

```ts
import { z } from 'zod'

export const clientSchema = z.object({
  name: z.string().min(1, 'Введіть ім\'я'),
  phone: z.string().optional().transform(v => v || null),
})

export const carSchema = z.object({
  client_id: z.string(),
  brand: z.string().min(1, 'Введіть марку'),
  model: z.string().min(1, 'Введіть модель'),
  year: z.coerce.number().int().min(1960).max(2030).nullable().optional()
    .transform(v => v || null),
  plate: z.string().optional().transform(v => v || null),
  vin: z.string().optional().transform(v => v || null),
  color: z.string().optional().transform(v => v || null),
})

export const orderSchema = z.object({
  car_id: z.string().min(1, 'Оберіть авто'),
  problem: z.string().min(1, 'Опишіть проблему'),
  mileage: z.coerce.number().int().positive().nullable().optional()
    .transform(v => v || null),
  date_in: z.string().optional().transform(v => v || null),
})

export const orderItemSchema = z.object({
  order_id: z.string(),
  type: z.enum(['work', 'part']),
  name: z.string().min(1, 'Введіть назву'),
  qty: z.coerce.number().positive('Кількість > 0'),
  unit: z.string().default('шт'),
  price: z.coerce.number().min(0, 'Ціна >= 0'),
})

export const financeSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('Сума > 0'),
  category: z.string().optional().transform(v => v || null),
  date: z.string().min(1, 'Вкажіть дату'),
  comment: z.string().optional().transform(v => v || null),
})

export const masterSchema = z.object({
  name: z.string().min(1, 'Введіть ім\'я'),
  phone: z.string().optional().transform(v => v || null),
})

export type ClientInput = z.infer<typeof clientSchema>
export type CarInput = z.infer<typeof carSchema>
export type OrderInput = z.infer<typeof orderSchema>
export type OrderItemInput = z.infer<typeof orderItemSchema>
export type FinanceInput = z.infer<typeof financeSchema>
export type MasterInput = z.infer<typeof masterSchema>
```

- [ ] **Step 4: Install zod + react-hook-form**

```bash
npm install zod react-hook-form @hookform/resolvers
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/
git commit -m "feat: add types, Supabase client, and Zod validation schemas"
```

---

### Task 4: Auth Context + Provider

**Files:**
- Create: `src/lib/auth.tsx`

- [ ] **Step 1: Create src/lib/auth.tsx**

Full auth provider with login, register, logout, refresh, invite handling:

```tsx
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { db } from './supabase'
import type { Session } from './types'

const SESSION_KEY = 'as_session'
const SESSION_DAYS = 30

interface AuthContextType {
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<string | null>
  register: (email: string, password: string, name: string, inviteToken: string) => Promise<string | null>
  logout: () => void
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

function saveSession(data: any): Session {
  const session: Session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user_id: data.user?.id || data.user_id,
    email: data.user?.email || data.email,
    role: data.user?.user_metadata?.role || data.role || 'master',
    master_id: data.user?.user_metadata?.master_id || data.master_id || null,
    expires_at: Date.now() + SESSION_DAYS * 24 * 3600 * 1000,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

function loadSession(): Session | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') }
  catch { return null }
}

function isExpired(session: Session) {
  return !session.expires_at || Date.now() > session.expires_at - 5 * 60 * 1000
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const applySession = useCallback(async (s: Session) => {
    db.setAuth(s.access_token)
    let masterId = s.master_id
    if (!masterId && s.role !== 'admin') {
      const masters = await db.get('masters', { user_id: `eq.${s.user_id}` }).catch(() => [])
      masterId = masters[0]?.id || null
      if (masterId) {
        s = { ...s, master_id: masterId }
        localStorage.setItem(SESSION_KEY, JSON.stringify(s))
      }
    }
    if (masterId) db.setMaster(masterId)
    setSession(s)
  }, [])

  const refresh = useCallback(async (refreshToken: string): Promise<Session | null> => {
    try {
      const res = await fetch(`${db.getUrl()}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { 'apikey': db.getKey(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!res.ok) return null
      return saveSession(await res.json())
    } catch { return null }
  }, [])

  useEffect(() => {
    (async () => {
      const saved = loadSession()
      if (saved) {
        if (isExpired(saved)) {
          const refreshed = await refresh(saved.refresh_token)
          if (refreshed) { await applySession(refreshed); setLoading(false); return }
          localStorage.removeItem(SESSION_KEY)
        } else {
          await applySession(saved)
        }
      }
      setLoading(false)
    })()
  }, [applySession, refresh])

  const login = async (email: string, password: string): Promise<string | null> => {
    const res = await fetch(`${db.getUrl()}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': db.getKey(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) return data.error_description || data.msg || 'Невірний логін або пароль'
    const s = saveSession(data)
    await applySession(s)
    return null
  }

  const register = async (email: string, password: string, name: string, inviteToken: string): Promise<string | null> => {
    // Check invite
    const invites = await db.get('invites', { token: `eq.${inviteToken}`, status: 'eq.pending' })
    if (!invites.length) return 'Невірний або використаний invite токен'

    // Sign up
    const res = await fetch(`${db.getUrl()}/auth/v1/signup`, {
      method: 'POST',
      headers: { 'apikey': db.getKey(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, data: { role: 'master', name, invite_token: inviteToken } }),
    })
    const data = await res.json()
    if (!res.ok) return data.msg || data.error_description || 'Помилка реєстрації'

    // Set auth token before DB operations
    db.setAuth(data.access_token)

    // Create master
    const master = await db.addMaster({ name, invite_token: inviteToken, user_id: data.user?.id, status: 'active' })

    // Mark invite as used
    await db.patch('invites', invites[0].id, { status: 'used', master_id: master.id, used_at: new Date().toISOString() })

    const s = saveSession({ ...data, master_id: master.id, role: 'master' })
    await applySession(s)
    return null
  }

  const logout = () => {
    const s = loadSession()
    if (s?.access_token) {
      fetch(`${db.getUrl()}/auth/v1/logout`, {
        method: 'POST',
        headers: { 'apikey': db.getKey(), 'Authorization': `Bearer ${s.access_token}` },
      }).catch(() => {})
    }
    localStorage.removeItem(SESSION_KEY)
    db.setAuth(null)
    setSession(null)
  }

  const resetPassword = async (email: string) => {
    await fetch(`${db.getUrl()}/auth/v1/recover`, {
      method: 'POST',
      headers: { 'apikey': db.getKey(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
  }

  return (
    <AuthContext.Provider value={{ session, loading, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth.tsx
git commit -m "feat: add AuthProvider with login, register, refresh, logout"
```

---

### Task 5: App Shell — Layout, Bottom Nav, Routing

**Files:**
- Create: `src/components/layout/AppShell.tsx`, `src/components/layout/BottomNav.tsx`, `src/components/layout/PageHeader.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create BottomNav component**

```tsx
// src/components/layout/BottomNav.tsx
import { useLocation, useNavigate } from 'react-router'
import { Home, Users, ClipboardList, Wallet, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { path: '/', icon: Home, label: 'Головна' },
  { path: '/clients', icon: Users, label: 'Клієнти' },
  { path: '/orders', icon: ClipboardList, label: 'Замовлення' },
  { path: '/finance', icon: Wallet, label: 'Фінанси' },
  { path: '/settings', icon: Settings, label: 'Налаштування' },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex h-16">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px]',
                'transition-colors duration-200',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon size={22} />
              <span className="text-[0.65rem]">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Create PageHeader component**

```tsx
// src/components/layout/PageHeader.tsx
import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  icon?: ReactNode
  back?: boolean
}

export function PageHeader({ title, icon, back }: Props) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-card border-b border-border safe-top">
      {back && (
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary">
          <ArrowLeft size={18} />
        </button>
      )}
      <h1 className="text-lg font-semibold flex items-center gap-2">
        {icon}
        {title}
      </h1>
    </header>
  )
}
```

- [ ] **Step 3: Create AppShell component**

```tsx
// src/components/layout/AppShell.tsx
import { Outlet } from 'react-router'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 4: Update App.tsx with routing**

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider, useAuth } from '@/lib/auth'
import { AppShell } from '@/components/layout/AppShell'
import { Toaster } from 'sonner'

// Lazy load pages
import { lazy, Suspense } from 'react'
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ClientsPage = lazy(() => import('@/pages/ClientsPage'))
const ClientDetailPage = lazy(() => import('@/pages/ClientDetailPage'))
const OrdersPage = lazy(() => import('@/pages/OrdersPage'))
const OrderDetailPage = lazy(() => import('@/pages/OrderDetailPage'))
const FinancePage = lazy(() => import('@/pages/FinancePage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'))
const AdminPanel = lazy(() => import('@/pages/admin/AdminPanel'))

function Loading() {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <Loading />
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { session, loading } = useAuth()

  if (loading) return <Loading />

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/panel" element={<AdminPanel />} />
        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route index element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/autoservice-pwa">
      <AuthProvider>
        <AppRoutes />
        <Toaster position="bottom-center" richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  )
}
```

- [ ] **Step 5: Create placeholder pages**

Create each page as a minimal placeholder so routing works. Example for each:

```tsx
// src/pages/DashboardPage.tsx
import { PageHeader } from '@/components/layout/PageHeader'
import { Home } from 'lucide-react'

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Дашборд" icon={<Home size={20} />} />
      <div className="p-4">Dashboard placeholder</div>
    </>
  )
}
```

Create similar placeholders for: `LoginPage`, `ClientsPage`, `ClientDetailPage`, `OrdersPage`, `OrderDetailPage`, `FinancePage`, `SettingsPage`, `admin/AdminLoginPage`, `admin/AdminPanel`.

- [ ] **Step 6: Install sonner + react-router**

```bash
npm install sonner
```

- [ ] **Step 7: Verify routing works**

```bash
npx vite dev
```
Expected: Login page at /login, main pages navigate via bottom nav, back button works.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add AppShell, BottomNav, routing, and placeholder pages"
```

---

### Task 6: Login Page + Invite Registration

**Files:**
- Create: `src/pages/LoginPage.tsx` (replace placeholder)

- [ ] **Step 1: Implement LoginPage with login, register, and reset forms**

Full implementation with three form states, invite token detection from URL, react-hook-form + zod:

```tsx
// src/pages/LoginPage.tsx
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wrench } from 'lucide-react'
import { toast } from 'sonner'

type FormMode = 'login' | 'register' | 'reset'

export default function LoginPage() {
  const { login, register, resetPassword } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mode, setMode] = useState<FormMode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteToken, setInviteToken] = useState('')

  useEffect(() => {
    const invite = searchParams.get('invite')
    if (invite) {
      setInviteToken(invite)
      setMode('register')
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const err = await login(fd.get('email') as string, fd.get('password') as string)
    setLoading(false)
    if (err) setError(err)
    else toast.success('Вхід виконано')
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const name = (fd.get('name') as string).trim()
    if (!name) { setError('Введіть ваше ім\'я'); return }
    setLoading(true)
    const err = await register(
      fd.get('email') as string,
      fd.get('password') as string,
      name,
      inviteToken,
    )
    setLoading(false)
    if (err) setError(err)
    else toast.success('Акаунт створено')
  }

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await resetPassword(fd.get('email') as string)
    toast.success('Лист надіслано')
    setMode('login')
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-8 safe-top safe-bottom">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Wrench size={32} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold">Автосервіс</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'register' ? 'Створити акаунт' : mode === 'reset' ? 'Відновлення пароля' : 'Увійдіть у свій акаунт'}
          </p>
        </div>

        {error && <p className="text-destructive text-sm mb-4 text-center">{error}</p>}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div><Label>Email</Label><Input name="email" type="email" autoComplete="email" required /></div>
            <div><Label>Пароль</Label><Input name="password" type="password" autoComplete="current-password" required /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? '...' : 'Увійти'}</Button>
            <div className="flex justify-center gap-4 text-sm">
              <button type="button" onClick={() => setMode('reset')} className="text-muted-foreground">Забули пароль?</button>
              <button type="button" onClick={() => setMode('register')} className="text-primary">Реєстрація</button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            {inviteToken && <p className="text-xs text-muted-foreground text-center">Invite: {inviteToken}</p>}
            <div><Label>Ваше ім'я</Label><Input name="name" required /></div>
            <div><Label>Email</Label><Input name="email" type="email" required /></div>
            <div><Label>Пароль (мін. 6 символів)</Label><Input name="password" type="password" minLength={6} required /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? '...' : 'Зареєструватись'}</Button>
            <button type="button" onClick={() => setMode('login')} className="block mx-auto text-sm text-muted-foreground">← Назад до входу</button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleReset} className="space-y-4">
            <div><Label>Email</Label><Input name="email" type="email" required /></div>
            <Button type="submit" className="w-full">Надіслати лист</Button>
            <button type="button" onClick={() => setMode('login')} className="block mx-auto text-sm text-muted-foreground">← Назад</button>
          </form>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/LoginPage.tsx
git commit -m "feat: implement LoginPage with login, register, and reset forms"
```

---

### Task 7: Dashboard Page

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 1: Implement DashboardPage**

Stats cards + quick actions grid. Uses `db.getStats()`:

```tsx
// src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Home, Plus, UserPlus, ClipboardList, CreditCard } from 'lucide-react'
import { db } from '@/lib/supabase'
import type { DashboardStats } from '@/lib/types'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    db.getStats().then(setStats).catch(() => {})
  }, [])

  const quickActions = [
    { icon: Plus, label: 'Нове замовлення', onClick: () => navigate('/orders?new=1') },
    { icon: UserPlus, label: 'Новий клієнт', onClick: () => navigate('/clients?new=1') },
    { icon: ClipboardList, label: 'Всі замовлення', onClick: () => navigate('/orders') },
    { icon: CreditCard, label: 'Транзакція', onClick: () => navigate('/finance?new=1') },
  ]

  return (
    <>
      <PageHeader title="Дашборд" icon={<Home size={20} />} />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Замовлень сьогодні', value: stats?.ordersToday ?? '—' },
            { label: 'В роботі', value: stats?.ordersActive ?? '—' },
            { label: 'Виручка за місяць', value: stats ? `${stats.revenueMonth.toFixed(0)} грн` : '—' },
            { label: 'Клієнтів', value: stats?.totalClients ?? '—' },
          ].map(s => (
            <Card key={s.label} className="p-4 text-center bg-card border-border">
              <div className="text-2xl font-extrabold text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </Card>
          ))}
        </div>

        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Швидкі дії</p>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(a => (
            <button key={a.label} onClick={a.onClick}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border active:bg-secondary transition-colors">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <a.icon size={22} className="text-primary" />
              </div>
              <span className="text-sm">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/DashboardPage.tsx
git commit -m "feat: implement DashboardPage with stats and quick actions"
```

---

### Task 8: Clients Page + Client Detail + Forms

**Files:**
- Modify: `src/pages/ClientsPage.tsx`, `src/pages/ClientDetailPage.tsx`
- Create: `src/components/forms/ClientForm.tsx`, `src/components/forms/CarForm.tsx`

- [ ] **Step 1: Create ClientForm (bottom sheet)**

Compact form with Sheet for native iOS feel:

```tsx
// src/components/forms/ClientForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clientSchema, type ClientInput } from '@/lib/validation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: ClientInput) => Promise<void>
}

export function ClientForm({ open, onClose, onSave }: Props) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
  })

  const submit = async (data: ClientInput) => {
    await onSave(data)
    reset()
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="safe-bottom rounded-t-2xl">
        <SheetHeader><SheetTitle>Новий клієнт</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4 mt-4">
          <div>
            <Label>Ім'я / Компанія *</Label>
            <Input {...register('name')} placeholder="Іваненко Іван" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label>Телефон</Label>
            <Input {...register('phone')} type="tel" placeholder="+380..." />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? '...' : 'Зберегти'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Create CarForm (bottom sheet)**

```tsx
// src/components/forms/CarForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { carSchema, type CarInput } from '@/lib/validation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  clientId: string
  onClose: () => void
  onSave: (data: CarInput) => Promise<void>
}

export function CarForm({ open, clientId, onClose, onSave }: Props) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CarInput>({
    resolver: zodResolver(carSchema),
    defaultValues: { client_id: clientId },
  })

  const submit = async (data: CarInput) => {
    await onSave({ ...data, client_id: clientId })
    reset()
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="safe-bottom rounded-t-2xl">
        <SheetHeader><SheetTitle>Нове авто</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-3 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Марка *</Label>
              <Input {...register('brand')} placeholder="Toyota" />
              {errors.brand && <p className="text-xs text-destructive mt-1">{errors.brand.message}</p>}
            </div>
            <div>
              <Label>Модель *</Label>
              <Input {...register('model')} placeholder="Camry" />
              {errors.model && <p className="text-xs text-destructive mt-1">{errors.model.message}</p>}
            </div>
            <div>
              <Label>Рік</Label>
              <Input {...register('year')} type="number" placeholder="2018" />
            </div>
            <div>
              <Label>Колір</Label>
              <Input {...register('color')} placeholder="Сірий" />
            </div>
            <div>
              <Label>Держ. номер</Label>
              <Input {...register('plate')} placeholder="АА0000АА" />
            </div>
            <div>
              <Label>VIN</Label>
              <Input {...register('vin')} placeholder="VF1..." />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? '...' : 'Зберегти'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 3: Implement ClientsPage**

List with search, FAB, and ClientForm sheet:

```tsx
// src/pages/ClientsPage.tsx
import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { ClientForm } from '@/components/forms/ClientForm'
import { Users, User, Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { db } from '@/lib/supabase'
import type { Client } from '@/lib/types'
import { toast } from 'sonner'

export default function ClientsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try { setClients(await db.getClients()) }
    catch { toast.error('Помилка завантаження') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (searchParams.get('new')) { setShowForm(true); setSearchParams({}, { replace: true }) }
  }, [searchParams, setSearchParams])

  const filtered = useMemo(() => {
    if (!search) return clients
    const q = search.toLowerCase()
    return clients.filter(c => c.name.toLowerCase().includes(q) || (c.phone || '').includes(q))
  }, [clients, search])

  return (
    <>
      <PageHeader title="Клієнти" icon={<Users size={20} />} />
      <div className="p-4">
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 mb-4">
          <Search size={18} className="text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук клієнта..."
            className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0" />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users size={48} className="mx-auto mb-3 opacity-50" />
            <p>Клієнтів поки немає</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <button key={c.id} onClick={() => navigate(`/clients/${c.id}`)}
                className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl active:bg-secondary transition-colors text-left">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <User size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.phone || '—'}</div>
                </div>
                <span className="text-muted-foreground">›</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => setShowForm(true)}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center active:opacity-80 z-40">
        <Plus size={24} />
      </button>

      <ClientForm open={showForm} onClose={() => setShowForm(false)}
        onSave={async data => { await db.addClient(data); toast.success('Клієнта додано'); load() }} />
    </>
  )
}
```

- [ ] **Step 4: Implement ClientDetailPage**

Client info + cars list + add car:

```tsx
// src/pages/ClientDetailPage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { CarForm } from '@/components/forms/CarForm'
import { Car, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/supabase'
import type { Client, Car as CarType } from '@/lib/types'
import { toast } from 'sonner'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)
  const [cars, setCars] = useState<CarType[]>([])
  const [showCarForm, setShowCarForm] = useState(false)

  const load = async () => {
    if (!id) return
    const clients = await db.getClients()
    setClient(clients.find((c: Client) => c.id === id) || null)
    setCars(await db.getCars(id))
  }

  useEffect(() => { load() }, [id])

  if (!client) return null

  return (
    <>
      <PageHeader title={client.name} back />
      <div className="p-4 space-y-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Контакти</p>
          <p>{client.phone || '—'}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Автомобілі</p>
            <Button size="sm" variant="secondary" onClick={() => setShowCarForm(true)}>
              <Plus size={14} /> Авто
            </Button>
          </div>
          {cars.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Авто не додано</p>
          ) : (
            <div className="space-y-2">
              {cars.map(car => (
                <button key={car.id}
                  onClick={() => navigate(`/orders?new=1&carId=${car.id}&clientName=${client.name}`)}
                  className="w-full flex items-center gap-3 p-3 bg-secondary rounded-lg active:opacity-80 text-left">
                  <Car size={20} className="text-primary" />
                  <div>
                    <div className="font-medium text-sm">{car.brand} {car.model} {car.year || ''}</div>
                    <div className="text-xs text-muted-foreground">{car.plate || ''} {car.vin ? `· ${car.vin}` : ''}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <CarForm open={showCarForm} clientId={id!} onClose={() => setShowCarForm(false)}
        onSave={async data => { await db.addCar(data); toast.success('Авто додано'); load() }} />
    </>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/ClientsPage.tsx src/pages/ClientDetailPage.tsx src/components/forms/ClientForm.tsx src/components/forms/CarForm.tsx
git commit -m "feat: implement Clients pages with search, detail, and car/client forms"
```

---

### Task 9: Orders Page + Order Detail + Forms

**Files:**
- Modify: `src/pages/OrdersPage.tsx`, `src/pages/OrderDetailPage.tsx`
- Create: `src/components/forms/OrderForm.tsx`, `src/components/forms/OrderItemForm.tsx`, `src/components/ActDocument.tsx`

This is the largest page. Implementation follows the same pattern as Clients — Sheet forms, Zod validation, lucide icons.

- [ ] **Step 1: Create OrderForm, OrderItemForm**

Same pattern as ClientForm/CarForm — Sheet with react-hook-form + zod. OrderForm includes a car select that loads all clients+cars. OrderItemForm has qty*price auto-calculation.

- [ ] **Step 2: Implement OrdersPage**

Tab filter (All/New/In Progress/Done/Closed), order list with status badges, FAB.

- [ ] **Step 3: Implement OrderDetailPage**

Order info card, items table with totals, status change buttons, "Сформувати Акт" button. Delete item with confirm.

- [ ] **Step 4: Create ActDocument component**

Port of docs.js — generates standalone HTML, opens in new window via `URL.createObjectURL(new Blob([html], { type: 'text/html' }))`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Orders*.tsx src/components/forms/Order*.tsx src/components/ActDocument.tsx
git commit -m "feat: implement Orders pages with forms, detail, and Act generation"
```

---

### Task 10: Finance Page + Form

**Files:**
- Modify: `src/pages/FinancePage.tsx`
- Create: `src/components/forms/FinanceForm.tsx`

- [ ] **Step 1: Create FinanceForm**

Sheet with type select, amount, category, date, comment. Zod validation ensures amount is a number.

- [ ] **Step 2: Implement FinancePage**

Month picker, income/expense summary cards, transaction list with trending-up/down icons, FAB.

- [ ] **Step 3: Commit**

```bash
git add src/pages/FinancePage.tsx src/components/forms/FinanceForm.tsx
git commit -m "feat: implement Finance page with month filtering and transaction form"
```

---

### Task 11: Settings Page

**Files:**
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Implement SettingsPage**

FOP data fields (localStorage), connection test, logout. Same localStorage keys as current app.

- [ ] **Step 2: Commit**

```bash
git add src/pages/SettingsPage.tsx
git commit -m "feat: implement Settings page with FOP data and connection test"
```

---

### Task 12: Admin Pages

**Files:**
- Modify: `src/pages/admin/AdminLoginPage.tsx`, `src/pages/admin/AdminPanel.tsx`

- [ ] **Step 1: Implement AdminLoginPage**

Separate login that checks `user_metadata.role === 'admin'`.

- [ ] **Step 2: Implement AdminPanel**

Masters table, invite generation, block/unblock, add master form.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/
git commit -m "feat: implement Admin pages with masters management and invites"
```

---

### Task 13: PWA Configuration

**Files:**
- Create/Modify: `vite.config.ts`, `public/manifest.json`

- [ ] **Step 1: Install vite-plugin-pwa**

```bash
npm install -D vite-plugin-pwa
```

- [ ] **Step 2: Update vite.config.ts**

Add PWA plugin with Workbox configuration — precache static assets, skip Supabase API in runtime cache.

- [ ] **Step 3: Move icons to public/**

Move `icon-192.png` and `icon-512.png` to `public/`.

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts public/
git commit -m "feat: configure vite-plugin-pwa with Workbox"
```

---

### Task 14: GitHub Actions Deploy Pipeline

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Update deploy workflow**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          VITE_PWA_URL: https://dimafil1903.github.io/autoservice-pwa/
        run: npm run build
      - name: Copy index.html to 404.html for SPA routing
        run: cp dist/index.html dist/404.html
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
        id: deployment
```

- [ ] **Step 2: Add .env.example**

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PWA_URL=http://localhost:5173/autoservice-pwa/
```

- [ ] **Step 3: Update .gitignore**

Add: `node_modules/`, `dist/`, `.env`, `.env.local`

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml .env.example .gitignore
git commit -m "feat: update deploy pipeline for Vite React build"
```

---

### Task 15: Cleanup Old Files

**Files:**
- Delete: `js/`, `css/`, `admin/`, `config.js`, `sw.js`, old `index.html` (replaced by Vite's), `scripts/inject-config.py`

- [ ] **Step 1: Remove old vanilla JS files**

```bash
git rm -r js/ css/ admin/ config.js sw.js scripts/
git rm admin.html
```

Note: keep `supabase/` directory (migrations), `docs/` (specs), `CLAUDE.md`, `README.md`, `public/` assets.

- [ ] **Step 2: Update CLAUDE.md**

Rewrite to reflect the new React architecture.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove old vanilla JS files, update CLAUDE.md for React"
```

---

## Verification

1. `npm run dev` — app starts, login page shows
2. Login with existing credentials → dashboard with stats
3. Navigate all tabs — smooth transitions, no layout shifts
4. Test on iPhone SE (375px) via Chrome DevTools — no overflow, safe areas respected
5. Test on iPhone 15 Pro Max (430px) — proper spacing, no edge cutoff
6. Add client → sheet slides up, form validates, saves to DB
7. Add car, order, order item, finance — all forms validate correctly
8. Generate Act → opens in new tab, printable
9. Admin panel — login, view masters, generate invite
10. `npm run build` — no TS errors, dist/ generated
11. Deploy via GitHub Actions → live on GitHub Pages
