-- =====================================================================
-- Diva Essentials Store — Supabase Schema
-- Public storefront + Admin dashboard share this database.
-- =====================================================================

-- ---------- CATEGORIES ----------
create table if not exists categories (
  id          bigint generated always as identity primary key,
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  sort_order  int default 0,
  created_at  timestamptz default now()
);

-- ---------- PRODUCTS ----------
create table if not exists products (
  id            bigint generated always as identity primary key,
  category_id   bigint references categories(id) on delete set null,
  name          text not null,
  slug          text not null unique,
  description   text,
  scent_notes   text,                       -- candle-specific
  burn_time     text,                       -- e.g. "45 hours"
  weight_grams  int,
  price         numeric(10,2) not null,      -- current sale price (EGP)
  compare_price numeric(10,2),               -- original price for "-X%" badge
  stock         int default 0,
  images        jsonb default '[]'::jsonb,   -- array of image URLs
  is_active     boolean default true,
  is_featured   boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ---------- CUSTOMERS (extends Supabase auth.users) ----------
create table if not exists customers (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  phone       text,
  address     text,
  city        text,
  created_at  timestamptz default now()
);

-- ---------- PROMO CODES ----------
create table if not exists promo_codes (
  id            bigint generated always as identity primary key,
  code          text not null unique,
  discount_pct  int not null check (discount_pct between 1 and 100),
  active        boolean default true,
  expires_at    timestamptz,
  usage_limit   int,
  used_count    int default 0,
  created_at    timestamptz default now()
);

-- ---------- ORDERS ----------
create table if not exists orders (
  id              bigint generated always as identity primary key,
  customer_id     uuid references customers(id) on delete set null,
  order_number    text not null unique,
  status          text default 'pending',     -- pending | paid | shipped | delivered | cancelled
  payment_method  text,                        -- stripe | paymob | instapay | vodafone_cash | cod
  payment_status  text default 'unpaid',       -- unpaid | awaiting_review | paid | refunded
  subtotal        numeric(10,2) not null,
  discount        numeric(10,2) default 0,
  shipping        numeric(10,2) default 0,
  total           numeric(10,2) not null,
  promo_code      text,
  -- snapshot of shipping details (so order is self-contained)
  ship_name       text,
  ship_phone      text,
  ship_address    text,
  ship_city       text,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ---------- ORDER ITEMS ----------
create table if not exists order_items (
  id          bigint generated always as identity primary key,
  order_id    bigint references orders(id) on delete cascade,
  product_id  bigint references products(id) on delete set null,
  name        text not null,        -- snapshot
  price       numeric(10,2) not null,
  quantity    int not null,
  line_total  numeric(10,2) not null
);

-- ---------- PAYMENT PROOFS (manual: Instapay / Vodafone Cash) ----------
create table if not exists payment_proofs (
  id          bigint generated always as identity primary key,
  order_id    bigint references orders(id) on delete cascade,
  image_url   text not null,
  method      text,
  amount      numeric(10,2),
  status      text default 'pending',   -- pending | approved | rejected
  reviewed_by uuid references auth.users(id),
  created_at  timestamptz default now()
);

-- ---------- SETTINGS (single JSONB row, your usual pattern) ----------
create table if not exists settings (
  id          int primary key default 1,
  data        jsonb default '{}'::jsonb,
  updated_at  timestamptz default now()
);
insert into settings (id, data) values (1, '{
  "store_name": "Diva Essentials",
  "free_shipping_threshold": 2000,
  "shipping_flat": 60,
  "whatsapp": "+201147397783",
  "instapay_handle": "",
  "vodafone_cash_number": ""
}'::jsonb) on conflict (id) do nothing;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table categories     enable row level security;
alter table products       enable row level security;
alter table customers      enable row level security;
alter table promo_codes    enable row level security;
alter table orders         enable row level security;
alter table order_items    enable row level security;
alter table payment_proofs enable row level security;
alter table settings       enable row level security;

-- Public can READ catalog + active promos + settings
create policy "public read categories" on categories for select using (true);
create policy "public read products"   on products   for select using (is_active = true);
create policy "public read settings"   on settings   for select using (true);
create policy "public read promos"     on promo_codes for select using (active = true);

-- Logged-in admin can manage catalog (products, collections, promos, settings).
-- Tighten later to a specific admin email/role if you add staff accounts.
create policy "auth manage products"   on products    for all to authenticated using (true) with check (true);
create policy "auth manage categories" on categories  for all to authenticated using (true) with check (true);
create policy "auth manage promos"     on promo_codes for all to authenticated using (true) with check (true);
create policy "auth manage settings"   on settings    for all to authenticated using (true) with check (true);

-- Customers manage their own profile
create policy "own profile select" on customers for select using (auth.uid() = id);
create policy "own profile upsert" on customers for insert with check (auth.uid() = id);
create policy "own profile update" on customers for update using (auth.uid() = id);

-- Customers see their own orders / items / proofs
create policy "own orders select" on orders for select using (auth.uid() = customer_id);
create policy "own orders insert" on orders for insert with check (auth.uid() = customer_id);
create policy "own items select"  on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy "own items insert"  on order_items for insert
  with check (exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy "own proofs"        on payment_proofs for all
  using (exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()))
  with check (exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()));

-- NOTE: Admin access is handled via the service-role key in Edge Functions
-- and the admin dashboard (server-side), which bypasses RLS. Lock the
-- admin dashboard behind your admin email check, same as ProSkill.

-- =====================================================================
-- SEED DATA (Diva Essentials candles)
-- =====================================================================
insert into categories (name, slug, description, sort_order) values
  ('100ml Glass Jar', 'glass-jar-100ml', 'Soy wax candles in glass jars — 40+ hour burn', 1),
  ('160ml Tin Can',   'tin-can-160ml',   'Premium double-wick soy candles in tins — 50+ hour burn', 2)
on conflict (slug) do nothing;

-- sku column for product codes
alter table products add column if not exists sku text;
alter table products add column if not exists volume_ml int;

insert into products (category_id, name, slug, sku, description, scent_notes, burn_time, weight_grams, volume_ml, price, compare_price, stock, is_featured, images) values
  ((select id from categories where slug='glass-jar-100ml'), 'Lavender Whisper', 'lavender-whisper-100ml', 'DIVA-LW-100',
    'A calming blend of pure lavender essential oil, crafted to melt away stress and bring peace to your space. Made with 100% natural soy wax, it fills your room with a soft, calming fragrance perfect for bedtime, meditation, or unwinding after a long day.',
    'Fresh Lavender · Herbal Lavender · Soft Musk', '40+ hours', 100, 100, 290, null, 30, false, '[]'),
  ((select id from categories where slug='glass-jar-100ml'), 'Vanilla Dreem', 'vanilla-dreem-100ml', 'DIVA-VD-100',
    'A warm, comforting vanilla scent that wraps your home in sweetness. Made with 100% natural soy wax and pure vanilla essential oil, its rich creamy scent transforms any room into a cozy haven — for quiet evenings and self-care Sundays.',
    'Sweet Vanilla Cream · Warm Caramel · Soft Sandalwood', '40+ hours', 100, 100, 290, null, 30, false, '[]'),
  ((select id from categories where slug='glass-jar-100ml'), 'Tulip Whisper', 'tulip-whisper-100ml', 'DIVA-TW-100',
    'A fresh, feminine floral scent inspired by spring blooms. Crafted with 100% natural soy wax and pure floral essential oils, it fills your space with a light, mood-lifting fragrance — perfect for mornings and daily use.',
    'Fresh Tulip Petals · Light Peony · Clean White Musk', '40+ hours', 100, 100, 290, null, 30, false, '[]'),
  ((select id from categories where slug='tin-can-160ml'), 'Lavender Musk', 'lavender-musk-160ml', 'DIVA-LM-160',
    'A sophisticated blend of calming lavender and deep musky warmth. This premium 160ml double-wick candle pairs soothing lavender with rich, sensual musk for a longer burn and larger throw — ideal for living rooms, open spaces, or gifting.',
    'Fresh Lavender Fields · Soft Floral Heart · Warm Musk & Amber', '50+ hours', 160, 160, 290, null, 25, false, '[]'),
  ((select id from categories where slug='tin-can-160ml'), 'Vanilla Rose', 'vanilla-rose-160ml', 'DIVA-VR-160',
    'The perfect harmony of sweet vanilla and romantic rose — a timeless, feminine scent in a premium 160ml double-wick tin. Romance in a tin, perfect for special evenings, self-care, or gifting. Our bestseller.',
    'Fresh Rose Petals · Creamy Vanilla Heart · Warm Sandalwood & Musk', '50+ hours', 160, 160, 290, null, 25, true, '[]'),
  ((select id from categories where slug='tin-can-160ml'), 'Autumn Woods', 'autumn-woods-160ml', 'DIVA-AW-160',
    'A deep, warm blend of woody notes and autumn spices that turns your home into a cozy forest retreat. This premium 160ml double-wick candle evokes crackling fireplaces and fallen leaves — for winter evenings and grounding moments.',
    'Cinnamon & Clove · Cedarwood & Pine · Deep Sandalwood & Amber', '50+ hours', 160, 160, 290, null, 25, false, '[]')
on conflict (slug) do nothing;

insert into promo_codes (code, discount_pct, active) values
  ('DIVA10', 10, true)
on conflict (code) do nothing;

-- =====================================================================
-- INTEGRATIONS — config for pixels, shipping couriers, and future add-ons
-- Single JSONB-per-provider so new integrations need no schema changes.
-- =====================================================================
create table if not exists integrations (
  id          bigint generated always as identity primary key,
  provider    text not null unique,        -- 'meta_pixel' | 'tiktok_pixel' | 'bosta' | ...
  kind        text not null,               -- 'pixel' | 'shipping' | 'other'
  enabled     boolean default false,
  -- public config is safe to expose to the browser (e.g. Pixel ID).
  -- secret config (API tokens) is read ONLY by Edge Functions via service role.
  public_config jsonb default '{}'::jsonb,
  secret_config jsonb default '{}'::jsonb,
  updated_at  timestamptz default now()
);

alter table integrations enable row level security;
-- Browser may read ONLY public_config of enabled integrations.
create policy "public read enabled integrations" on integrations
  for select using (enabled = true);
-- (secret_config must never be selected client-side; Edge Functions use the
--  service-role key which bypasses RLS. Consider a column-level view if you
--  want hard guarantees — see note in README.)

-- Track shipments created via courier APIs
create table if not exists shipments (
  id            bigint generated always as identity primary key,
  order_id      bigint references orders(id) on delete cascade,
  courier       text not null,              -- 'bosta' | ...
  tracking_number text,
  delivery_id   text,                       -- courier's own id
  status        text default 'created',     -- created | picked_up | in_transit | delivered | returned | cancelled
  cost          numeric(10,2),
  label_url     text,
  raw           jsonb default '{}'::jsonb,   -- full courier response
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table shipments enable row level security;
create policy "own shipment select" on shipments for select
  using (exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()));

-- Seed integration rows (disabled until you add keys in the admin)
insert into integrations (provider, kind, enabled, public_config) values
  ('meta_pixel',   'pixel',    false, '{"pixel_id":""}'),
  ('tiktok_pixel', 'pixel',    false, '{"pixel_id":""}'),
  ('google_ads',   'pixel',    false, '{"conversion_id":""}'),
  ('snap_pixel',   'pixel',    false, '{"pixel_id":""}'),
  ('bosta',        'shipping', false, '{"label":"Bosta"}')
on conflict (provider) do nothing;

-- =====================================================================
-- STORAGE — product images bucket (for admin uploads)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public can read images; authenticated users can upload/manage.
create policy "public read product images" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "auth upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');
create policy "auth update product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');
create policy "auth delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');

-- =====================================================================
-- INTEGRATIONS + SETTINGS write access (admin), hero media bucket,
-- and seed integration rows. (Added for Settings tab + editable hero.)
-- =====================================================================

-- Admin (logged-in) can manage integrations + settings
drop policy if exists "auth manage integrations" on integrations;
create policy "auth manage integrations" on integrations
  for all to authenticated using (true) with check (true);

drop policy if exists "auth manage settings" on settings;
create policy "auth manage settings" on settings
  for all to authenticated using (true) with check (true);

-- Seed the five integration rows (public_config is browser-safe; secret_config is Edge-only)
insert into integrations (provider, kind, enabled, public_config, secret_config) values
  ('meta_pixel',   'pixel',    false, '{"pixel_id":""}',  '{"capi_token":""}'),
  ('tiktok_pixel', 'pixel',    false, '{"pixel_id":""}',  '{}'),
  ('google_analytics','pixel', false, '{"measurement_id":""}', '{}'),
  ('bosta',        'shipping', false, '{}',               '{"api_key":""}'),
  ('whatsapp',     'other',    false, '{"phone_number_id":""}', '{"access_token":""}')
on conflict (provider) do nothing;

-- Hero / page media bucket (images + short videos)
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

drop policy if exists "public read site media" on storage.objects;
drop policy if exists "auth upload site media" on storage.objects;
drop policy if exists "auth update site media" on storage.objects;
drop policy if exists "auth delete site media" on storage.objects;
create policy "public read site media" on storage.objects for select using (bucket_id = 'site-media');
create policy "auth upload site media" on storage.objects for insert to authenticated with check (bucket_id = 'site-media');
create policy "auth update site media" on storage.objects for update to authenticated using (bucket_id = 'site-media');
create policy "auth delete site media" on storage.objects for delete to authenticated using (bucket_id = 'site-media');

-- Paymob: store the Paymob order id so the callback can match our order
alter table orders add column if not exists paymob_order_id bigint;
alter table orders add column if not exists email text;

-- Add Paymob to the integrations seed (card + wallet + iframe; secrets via Edge env)
insert into integrations (provider, kind, enabled, public_config, secret_config) values
  ('paymob', 'payment', false,
   '{"integration_card":"","integration_wallet":"","iframe_id":""}',
   '{"api_key":"","hmac":""}')
on conflict (provider) do nothing;
