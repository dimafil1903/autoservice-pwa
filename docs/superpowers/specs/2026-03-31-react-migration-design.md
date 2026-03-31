# AutoService PWA — React Migration Design

## Goal
Migrate vanilla JS PWA to Vite + React + TypeScript. Primary requirement: pixel-perfect rendering on all iPhones (SE to Pro Max), respecting safe areas, rounded corners, and notch/Dynamic Island.

## Stack
- **Build:** Vite 6
- **Framework:** React 19 + TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui (Radix primitives)
- **Icons:** lucide-react
- **Routing:** React Router 7 (SPA mode)
- **Forms:** react-hook-form + zod
- **PWA:** vite-plugin-pwa (Workbox)
- **Deploy:** GitHub Pages (static build)

## Project Structure

```
autoservice-pwa/
├── src/
│   ├── components/
│   │   ├── ui/                # shadcn: Button, Input, Dialog, Sheet, Card, Badge, etc.
│   │   └── layout/
│   │       ├── AppShell.tsx   # Safe area wrapper + bottom nav + main content
│   │       ├── BottomNav.tsx  # 5-tab navigation with safe-area-inset-bottom
│   │       ├── ScreenHeader.tsx
│   │       └── PageContainer.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ClientsPage.tsx
│   │   ├── ClientDetailPage.tsx
│   │   ├── OrdersPage.tsx
│   │   ├── OrderDetailPage.tsx
│   │   ├── FinancePage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── admin/
│   │       ├── AdminLoginPage.tsx
│   │       └── AdminPage.tsx
│   ├── lib/
│   │   ├── supabase.ts       # REST client (port of db.js)
│   │   ├── auth.tsx           # AuthProvider context + useAuth hook
│   │   ├── types.ts           # Client, Car, Order, OrderItem, Finance, Master, Invite
│   │   ├── validation.ts      # Zod schemas for all entities
│   │   └── utils.ts           # cn() helper
│   ├── hooks/
│   │   ├── useClients.ts
│   │   ├── useOrders.ts
│   │   ├── useFinance.ts
│   │   └── useMasters.ts
│   ├── App.tsx                # Router + AuthProvider + AppShell
│   └── main.tsx
├── public/
│   ├── manifest.json
│   ├── icon-192.png
│   └── icon-512.png
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── supabase/                  # Existing migrations (unchanged)
```

## iPhone Compatibility (Critical)

### Safe Areas
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- All fixed elements (BottomNav, headers, FAB, toasts) use `env(safe-area-inset-*)` padding
- Tailwind utility: `pb-[env(safe-area-inset-bottom)]`
- Content never hidden behind rounded screen corners, notch, or Dynamic Island

### Dynamic Viewport Height
- Use `min-h-dvh` (CSS `dvh` unit) instead of `min-h-screen` (100vh)
- 100vh on iOS Safari includes the URL bar area, `dvh` is the actual visible height

### Touch Targets
- All buttons, nav tabs, list items: min 44x44px touch area
- Spacing between touch targets: min 8px
- FAB: 56x56px

### Input Zoom Prevention
- All `<input>` and `<textarea>`: min font-size 16px
- Tailwind: `text-base` (1rem = 16px) on all form inputs

### Screen Sizes Supported
- iPhone SE 3rd (375x667) — smallest
- iPhone 14/15 (390x844) — standard
- iPhone 14/15 Plus (428x926)
- iPhone 14/15 Pro Max (430x932)
- iPhone 16 Pro Max (440x956) — largest

### Bottom Nav
- Height: 64px + `env(safe-area-inset-bottom)` (adds ~34px on Face ID iPhones)
- 5 tabs: Home, Clients, Orders, Finance, Settings
- Active state: accent color on icon + label

### Modals
- Use shadcn Sheet (bottom drawer) instead of Dialog for mobile
- Sheet respects safe areas, swipe-to-dismiss, proper iOS feel
- Handle height: always within safe area

## Pages & Features

### Login Page
- Email + password form
- Register form (shown on ?invite=TOKEN)
- Password reset
- Supabase Auth: signup, login, token refresh, logout

### Dashboard
- 4 stat cards (orders today, active, revenue, clients count)
- Quick actions grid (2x2): new order, new client, all orders, add transaction

### Clients
- Search bar (filter by name/phone)
- Client list with user icon
- Client detail: contact info + cars list
- Add client form (Sheet)
- Add car form (Sheet)

### Orders
- Tab filter: All / New / In Progress / Done / Closed
- Order list with status badges
- Order detail: problem, dates, mileage, items table, status change buttons, generate Act
- Add order form (Sheet) with car select
- Add order item form (Sheet)

### Finance
- Month picker
- Income/Expense summary cards
- Transaction list with type icons (trending-up/down)
- Add transaction form (Sheet)

### Settings
- FOP business data fields (name, IPN, address, phone, city)
- Connection test button
- Save + Logout

### Admin (/admin)
- Separate login (admin role check)
- Masters table (id, name, phone, status, registered_at, actions)
- Generate invite link
- Add master manually
- Block/unblock master

### Act Generator
- Same HTML generation as current docs.js
- Opens in new tab for printing
- No changes to the document format

## Data Layer

### Supabase Client (supabase.ts)
Port of current db.js — direct REST calls via fetch:
- `_get(table, params)` → GET /rest/v1/{table}
- `_post(table, body)` → POST with Prefer: return=representation
- `_patch(table, id, body)` → PATCH
- `_delete(table, id)` → DELETE

Keep the same approach (raw fetch, no @supabase/supabase-js SDK) to minimize bundle and maintain control.

### Auth (auth.tsx)
React Context with:
- `session` state (access_token, refresh_token, user_id, email, role, master_id)
- `login(email, password)`
- `register(email, password, name, inviteToken)`
- `logout()`
- `refresh()` on token expiry
- Auto-init from localStorage on mount

### TypeScript Types (types.ts)
```ts
interface Client { id: string; master_id: string; name: string; phone: string | null; created_at: string; }
interface Car { id: string; client_id: string; brand: string; model: string; year: number | null; vin: string | null; plate: string | null; color: string | null; }
interface Order { id: string; car_id: string; date_in: string | null; date_out: string | null; problem: string | null; status: 'new' | 'in_progress' | 'done' | 'closed'; mileage: number | null; mileage_out: number | null; created_at: string; }
interface OrderItem { id: string; order_id: string; type: 'work' | 'part'; name: string; qty: number; unit: string; price: number; total: number; }
interface Finance { id: string; master_id: string; type: 'income' | 'expense'; amount: number; category: string | null; date: string; order_id: string | null; comment: string | null; }
interface Master { id: string; name: string | null; phone: string | null; status: 'active' | 'blocked' | 'pending'; user_id: string | null; invite_token: string | null; registered_at: string; }
```

### Zod Validation (validation.ts)
Schemas for every form:
- `clientSchema`: name required, phone optional
- `carSchema`: brand + model required, year optional int 1960-2030, plate/vin/color optional → null
- `orderSchema`: car_id required, problem required, mileage optional int → null, date_in optional → null
- `orderItemSchema`: name required, qty > 0, price >= 0, type enum
- `financeSchema`: type enum, amount > 0, date required, category optional → null, comment optional → null

All numeric fields validated as numbers (not strings). All optional text fields → null when empty.

## Color Palette (same as current)
```
bg: #0F172A
surface: #1E293B
accent: #2563EB
text: #F8FAFC
muted: #94A3B8
border: #334155
success: #22C55E
warning: #F59E0B
danger: #EF4444
```

Configured in Tailwind theme, referenced via CSS variables for shadcn.

## PWA Configuration
- vite-plugin-pwa with Workbox
- precache: all static assets
- runtime cache: skip Supabase API calls
- manifest: same as current (name, icons, theme_color)
- Service worker auto-update with skipWaiting

## Deployment
- `vite build` → `dist/` folder
- GitHub Actions: install → build → deploy dist/ to GitHub Pages
- SPA fallback: 404.html trick for GitHub Pages (copy index.html → 404.html)

## Migration Strategy
Build the React app in a new `src/` directory alongside the existing vanilla JS files. Once complete, update the build/deploy pipeline to use Vite. The old files (js/, css/, admin/) remain in the repo for reference but are no longer served.
