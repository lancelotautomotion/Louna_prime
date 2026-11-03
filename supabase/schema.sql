-- ════════════════════════════════════════════════════════════════════
--  Primes — schéma Supabase (à coller dans SQL Editor → Run)
--  Chaque utilisateur ne voit et ne modifie QUE ses propres données (RLS).
-- ════════════════════════════════════════════════════════════════════

-- Ventes (suppression « douce » via deleted pour la propagation entre appareils)
create table if not exists public.sales (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id         text        not null,
  amount     integer     not null,               -- centimes TTC
  prime      integer     not null default 0,     -- euros
  ts         bigint      not null,               -- horodatage de la vente (ms)
  deleted    boolean     not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint sales_amount_ok check (deleted or amount > 0)
);
create index if not exists sales_user_updated_idx on public.sales (user_id, updated_at);

-- Profil + objectifs (une ligne par utilisateur)
create table if not exists public.user_data (
  user_id    uuid        primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- updated_at toujours fixé par le serveur (pas d'horloge d'appareil)
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

drop trigger if exists sales_touch on public.sales;
create trigger sales_touch before insert or update on public.sales
  for each row execute function public.touch_updated_at();

drop trigger if exists user_data_touch on public.user_data;
create trigger user_data_touch before insert or update on public.user_data
  for each row execute function public.touch_updated_at();

-- Sécurité : Row Level Security
alter table public.sales     enable row level security;
alter table public.user_data enable row level security;

drop policy if exists "sales: propriétaire" on public.sales;
create policy "sales: propriétaire" on public.sales
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_data: propriétaire" on public.user_data;
create policy "user_data: propriétaire" on public.user_data
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
