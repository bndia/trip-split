-- Run in Supabase SQL Editor. Public demo data; no authentication or protection.
create table if not exists public.expenses (
 id uuid primary key default gen_random_uuid(),
 cents bigint not null check (cents > 0),
 currency text not null check (currency in ('EUR','ILS','USD')),
 payer text not null check (payer in ('רובי','גרציאני','ג׳ורדן','בן')),
 participants jsonb not null check (jsonb_typeof(participants) = 'array' and jsonb_array_length(participants)>0),
 description text not null default '',
 created_at timestamptz not null default now()
);
alter table public.expenses enable row level security;
create policy "public read trip" on public.expenses for select to anon using (true);
create policy "public add trip" on public.expenses for insert to anon with check (true);
create policy "public delete trip" on public.expenses for delete to anon using (true);
-- The password is only a visual gate in the browser, not server-side authorization.
