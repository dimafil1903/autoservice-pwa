-- AutoService PWA — схема БД
-- Запустити в Supabase Dashboard → SQL Editor

-- ─── MASTERS (адмін реєстр) ─────────────────────────
create table if not exists masters (
  id uuid primary key default gen_random_uuid(),
  invite_token text unique,
  name text,
  phone text,
  status text not null default 'active' check (status in ('active', 'blocked', 'pending')),
  registered_at timestamptz default now(),
  last_active timestamptz
);

-- ─── INVITES ────────────────────────────────────────
create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  status text not null default 'pending' check (status in ('pending', 'used', 'expired')),
  master_id uuid references masters(id),
  created_at timestamptz default now(),
  used_at timestamptz
);

-- ─── CLIENTS ────────────────────────────────────────
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references masters(id) on delete cascade,
  name text not null,
  phone text,
  created_at timestamptz default now()
);

-- ─── CARS ───────────────────────────────────────────
create table if not exists cars (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  brand text not null,
  model text not null,
  year int,
  vin text,
  plate text,
  color text,
  notes text
);

-- ─── ORDERS ─────────────────────────────────────────
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references cars(id) on delete cascade,
  date_in date default current_date,
  date_out date,
  problem text,
  status text not null default 'new' check (status in ('new', 'in_progress', 'done', 'closed')),
  mileage int,
  mileage_out int,
  notes text,
  created_at timestamptz default now()
);

-- ─── ORDER ITEMS ────────────────────────────────────
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  type text not null default 'work' check (type in ('work', 'part')),
  name text not null,
  qty numeric not null default 1,
  unit text default 'шт',
  price numeric not null default 0,
  total numeric not null default 0
);

-- ─── FINANCE ────────────────────────────────────────
create table if not exists finance (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references masters(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null,
  category text,
  date date default current_date,
  order_id uuid references orders(id),
  comment text,
  created_at timestamptz default now()
);

-- ─── RLS (Row Level Security) ────────────────────────
-- Вмикаємо RLS на всіх таблицях
alter table masters     enable row level security;
alter table invites     enable row level security;
alter table clients     enable row level security;
alter table cars        enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;
alter table finance     enable row level security;

-- Тимчасові відкриті policies (через anon key + master_id фільтрацію в коді)
-- В майбутньому замінити на auth.uid() policies

create policy "anon_masters_read"     on masters     for select using (true);
create policy "anon_masters_insert"   on masters     for insert with check (true);
create policy "anon_masters_update"   on masters     for update using (true);

create policy "anon_invites_all"      on invites     for all using (true) with check (true);

create policy "anon_clients_all"      on clients     for all using (true) with check (true);
create policy "anon_cars_all"         on cars        for all using (true) with check (true);
create policy "anon_orders_all"       on orders      for all using (true) with check (true);
create policy "anon_order_items_all"  on order_items for all using (true) with check (true);
create policy "anon_finance_all"      on finance     for all using (true) with check (true);

-- ─── INDEXES ─────────────────────────────────────────
create index if not exists idx_clients_master   on clients(master_id);
create index if not exists idx_cars_client      on cars(client_id);
create index if not exists idx_orders_car       on orders(car_id);
create index if not exists idx_orders_status    on orders(status);
create index if not exists idx_order_items_ord  on order_items(order_id);
create index if not exists idx_finance_master   on finance(master_id);
create index if not exists idx_invites_token    on invites(token);
