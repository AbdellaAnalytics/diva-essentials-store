# Diva Essentials — Setup Guide

A complete walkthrough to get the store + admin running locally and live.
No prior steps assumed.

---

## 0. What you have

A single project that contains **two things**:
- **Storefront** (`/`) — the public shop: home, shop, product, cart, checkout, account
- **Admin dashboard** (`/admin`) — BI analytics, inventory, orders, customers, payment approvals, reports

Plus features: EGP/USD currency switch, light/dark mode, dynamic categories,
and an integrations layer (Meta Pixel + Bosta shipping) scaffolded for later.

It works **immediately on demo data** — you can run it before touching Supabase.

---

## 1. Install the tools (one time)

1. Install **Node.js v20+** from https://nodejs.org (LTS).
2. (Optional) Install **VS Code** to edit files.
3. Open a terminal in the project folder (the one with `package.json`).

Check Node is ready:
```bash
node -v      # should print v20.x or higher
```

---

## 2. Run it locally (5 minutes)

```bash
npm install        # downloads dependencies (one time)
npm run dev        # starts the local server
```

Open the URL it prints (usually http://localhost:5173).

- Storefront: http://localhost:5173/
- Admin: http://localhost:5173/admin

At this point everything runs on **demo data** — every chart, product, and
order is sample data so you can explore the whole thing first.

Try: the **EGP/USD** pill and the **sun/moon** toggle in the header.

---

## 3. Connect Supabase (your real database)

1. Create a free project at https://supabase.com.
2. In the Supabase dashboard → **SQL Editor**, open `supabase/schema.sql`
   from this project, paste it, and **Run**. This creates all tables
   (products, orders, customers, integrations, shipments, etc.) and seeds
   your 6 candles + 2 collections.
3. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon public key**
4. In the project root, copy `.env.example` to `.env` and fill in:
   ```
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Restart `npm run dev`.

Now the store reads/writes real data. With no orders yet, the admin still
shows demo data (so it isn't empty) — the header tells you the active source.

---

## 4. Deploy live on Vercel

1. Push this folder to a GitHub repo.
2. At https://vercel.com → **New Project** → import the repo.
3. Framework preset: **Vite**. Build command `npm run build`, output `dist`.
4. Add the same env vars (Settings → Environment Variables):
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
5. Deploy. `vercel.json` already handles SPA routing.

---

## 5. Admin access

- When Supabase is connected, `/admin` requires login (Supabase Auth).
- Create your admin user in Supabase → **Authentication → Users → Add user**
  (e.g. `Mohamed.abdullah969@gmail.com`).
- **Important:** to restrict `/admin` to only you, add an email check in
  `src/admin/AdminDashboard.jsx` (look for the auth gate) or a Supabase RLS
  policy. Right now any logged-in user can reach it.

---

## 6. Payments (when ready)

Secret keys must live server-side, never in the front-end. Each provider
needs a Supabase Edge Function:
- **Stripe** — `create-payment-intent` function (publishable key in `.env`,
  secret key in the function).
- **Paymob** — auth → order → payment-key function, then iframe redirect.
- **InstaPay / Vodafone Cash** — manual: order saved as `awaiting_review`,
  customer uploads proof, you approve in the admin **Approvals** tab.
- **COD** — works as-is.

The checkout already routes to these; the functions plug into the marked
spots in `src/pages/Checkout.jsx`.

---

## 7. Integrations (Meta Pixel, Bosta shipping)

Configured from the admin (no code):
- **Meta Pixel** — paste your Pixel ID; browser events fire automatically.
  Server-side Conversions API runs via `supabase/functions/meta-capi`.
- **Bosta shipping** — paste your API key; create shipments, get rates, and
  track from the Orders tab via `supabase/functions/shipping`.

Secret keys for these are stored in Supabase and read only by the Edge
Functions — never exposed to the browser.

---

## 8. Scheduled reports

`supabase/functions/scheduled-reports` emails sales summaries on a schedule.
Deploy it, add your email-provider key (Resend/SendGrid), and schedule with
pg_cron (example cron in the function file).

---

## Common questions

**Prices show in EGP but I want USD default** — change the initial value in
`src/context/UIContext.jsx` (`useState('EGP')` → `'USD'`). The fixed rate is
`USD_PER_EGP` in the same file; swap it for a live API later.

**Add a new product / collection** — add rows in Supabase (`products`,
`categories`). Nav, filters, and footer update automatically.

**Dark mode default** — it follows the visitor's system setting, then
remembers their choice. No config needed.

---

## Managing products (admin → Products tab)

The **Products** tab lets you run your whole catalog without touching Supabase:
- **Add / edit / delete** products (name, SKU, price, compare-at price, stock,
  scent notes, burn time, volume, description)
- **Images**: upload a file (stored in Supabase Storage) or paste an image URL
- **Featured / Bestseller** star toggle, **Active** (show/hide in store) toggle
- **Collections**: add, rename, delete (the "Collections" button) — these are the
  same categories that drive the storefront nav, so changes appear in the shop

**One-time storage setup:** the schema creates a public Storage bucket called
`product-images` automatically when you run `schema.sql`. If image upload ever
errors, go to Supabase → **Storage** and confirm a public bucket named
`product-images` exists.

New products you mark **Active** appear in the storefront immediately (they load
from the same database).
