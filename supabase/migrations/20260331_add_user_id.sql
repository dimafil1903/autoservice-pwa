-- Додаємо user_id до masters для зв'язку з Supabase Auth
alter table masters add column if not exists user_id uuid references auth.users(id);
create index if not exists idx_masters_user_id on masters(user_id);

-- Оновлюємо RLS щоб майстер бачив тільки свої дані
-- (поки anon policy, пізніше можна підтягнути auth.uid())
