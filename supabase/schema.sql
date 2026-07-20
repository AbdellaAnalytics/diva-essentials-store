
-- Product size variants: [{label, price, stock}] (null = single-price product)
alter table products add column if not exists variants jsonb default null;

-- =====================================================================
-- VISITS — lightweight visitor analytics (page views)
-- =====================================================================
create table if not exists visits (
  id          bigint generated always as identity primary key,
  path        text,
  referrer    text,
  source      text,             -- google / facebook / instagram / direct / …
  device      text,             -- mobile / desktop / tablet
  session_id  text,             -- random id kept in the browser for the day
  created_at  timestamptz default now()
);
create index if not exists visits_created_idx on visits (created_at);
create index if not exists visits_session_idx on visits (session_id);

alter table visits enable row level security;
-- Anyone (anon visitor) can INSERT a visit; only admins can read.
drop policy if exists "public insert visits" on visits;
create policy "public insert visits" on visits for insert to anon, authenticated with check (true);
drop policy if exists "auth read visits" on visits;
create policy "auth read visits" on visits for select to authenticated using (true);
