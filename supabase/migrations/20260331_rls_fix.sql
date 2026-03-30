-- ═══════════════════════════════════════════════════
-- Правильні RLS policies для Supabase Auth
-- Виконати в: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════

-- 1. Додати user_id в masters
alter table masters add column if not exists user_id uuid references auth.users(id);
create index if not exists idx_masters_user_id on masters(user_id);

-- 2. Видалити старі відкриті policies
drop policy if exists "anon_masters_read"    on masters;
drop policy if exists "anon_masters_insert"  on masters;
drop policy if exists "anon_masters_update"  on masters;
drop policy if exists "anon_invites_all"     on invites;
drop policy if exists "anon_clients_all"     on clients;
drop policy if exists "anon_cars_all"        on cars;
drop policy if exists "anon_orders_all"      on orders;
drop policy if exists "anon_order_items_all" on order_items;
drop policy if exists "anon_finance_all"     on finance;

-- 3. Masters — адмін бачить всіх, майстер тільки себе
create policy "masters_select" on masters for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from auth.users
      where id = auth.uid()
      and raw_user_meta_data->>'role' = 'admin'
    )
  );

create policy "masters_insert" on masters for insert
  with check (true);  -- реєстрація дозволена

create policy "masters_update" on masters for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from auth.users
      where id = auth.uid()
      and raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 4. Invites — адмін може все, майстер може читати свій токен
create policy "invites_admin_all" on invites for all
  using (
    exists (
      select 1 from auth.users
      where id = auth.uid()
      and raw_user_meta_data->>'role' = 'admin'
    )
  )
  with check (
    exists (
      select 1 from auth.users
      where id = auth.uid()
      and raw_user_meta_data->>'role' = 'admin'
    )
  );

create policy "invites_read_own" on invites for select
  using (true);  -- перевірка токену при реєстрації

-- 5. Clients — майстер бачить тільки своїх
create policy "clients_own" on clients for all
  using (
    master_id in (
      select id from masters where user_id = auth.uid()
    )
  )
  with check (
    master_id in (
      select id from masters where user_id = auth.uid()
    )
  );

-- 6. Cars — через client_id → master
create policy "cars_own" on cars for all
  using (
    client_id in (
      select id from clients where master_id in (
        select id from masters where user_id = auth.uid()
      )
    )
  )
  with check (
    client_id in (
      select id from clients where master_id in (
        select id from masters where user_id = auth.uid()
      )
    )
  );

-- 7. Orders — через car_id → client → master
create policy "orders_own" on orders for all
  using (
    car_id in (
      select c.id from cars c
      join clients cl on cl.id = c.client_id
      join masters m on m.id = cl.master_id
      where m.user_id = auth.uid()
    )
  )
  with check (
    car_id in (
      select c.id from cars c
      join clients cl on cl.id = c.client_id
      join masters m on m.id = cl.master_id
      where m.user_id = auth.uid()
    )
  );

-- 8. Order items — через order_id → car → client → master
create policy "order_items_own" on order_items for all
  using (
    order_id in (
      select o.id from orders o
      join cars c on c.id = o.car_id
      join clients cl on cl.id = c.client_id
      join masters m on m.id = cl.master_id
      where m.user_id = auth.uid()
    )
  )
  with check (
    order_id in (
      select o.id from orders o
      join cars c on c.id = o.car_id
      join clients cl on cl.id = c.client_id
      join masters m on m.id = cl.master_id
      where m.user_id = auth.uid()
    )
  );

-- 9. Finance — по master_id
create policy "finance_own" on finance for all
  using (
    master_id in (
      select id from masters where user_id = auth.uid()
    )
  )
  with check (
    master_id in (
      select id from masters where user_id = auth.uid()
    )
  );
