# Diva Essentials — Store (Storefront)

Luxury scented candle e-commerce store. React + Vite + Supabase, deployable to Vercel.
This is **Phase 1: the storefront + cart + checkout**. The admin dashboard and live
payment Edge Functions (Stripe / Paymob) come next.

## What's included
- Home, Shop (with category filter), Product detail, Cart drawer
- Checkout with shipping form, promo code (DIVA10), and payment method selection:
  Stripe, Paymob, InstaPay, Vodafone Cash, Cash on Delivery
- Order confirmation page
- Customer auth (email/password + Google) via Supabase
- Full Supabase schema with RLS + seed data
- Works out of the box on **fallback seed data** before Supabase is connected

## Setup
1. Install: `npm install`
2. Create a Supabase project, then run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` → `.env` and fill in:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Supabase → Settings → API)
   - `VITE_STRIPE_PUBLISHABLE_KEY` (when wiring Stripe)
4. Run locally: `npm run dev`

## Deploy to Vercel
- Push to GitHub, import in Vercel.
- Framework preset: **Vite**. Build: `npm run build`. Output: `dist`.
- Add the same env vars in Vercel → Settings → Environment Variables.
- `vercel.json` already handles SPA routing rewrites.

## Payments — important
Secret keys must NEVER live in this front-end. Real processing needs server endpoints:
- **Stripe**: a `create-payment-intent` Supabase Edge Function (secret key server-side),
  front-end uses the publishable key + Stripe.js.
- **Paymob**: Edge Function does auth token → order register → payment key, then redirect to iframe.
- **InstaPay / Vodafone Cash**: manual — order is created with `awaiting_review`, customer
  uploads proof, admin approves in the dashboard (same pattern as the Telegram bot).
- **COD**: order created as `pending`.

The checkout currently creates the order and routes to confirmation. The payment-routing
hooks are marked in `src/pages/Checkout.jsx` (`placeOrder`) — the Edge Functions plug in there.

## Next phases
1. Admin dashboard (products, orders, payment-proof approvals, promos, settings)
2. Stripe + Paymob Edge Functions (deployable, with your keys)
3. Proof-upload flow for manual payments

---

## Admin Dashboard (`/admin`)

A full BI-grade admin platform, lazy-loaded so it never weighs down the storefront.

**Modules**
- **Overview** — KPIs, 30-day revenue, action items (approvals, low stock, trend), top products, recent orders
- **Sales Analytics** — revenue trend (daily/monthly), order volume, revenue by collection, payment-method split, sales by city, product leaderboard
- **Inventory** — stock value, low/out-of-stock alerts, units-sold chart, turnover, full stock table with status
- **Orders** — searchable/filterable order list, status pipeline (pending → paid → shipped → delivered), pending-revenue KPI
- **Customers** — segments (VIP / repeat / one-time / at-risk), acquisition trend, CLV, top-spenders table
- **Approvals** — InstaPay / Vodafone Cash proof review queue with approve/reject
- **Reports** — one-click PDF + CSV per report, a full business-report PDF, and scheduled email summaries (daily/weekly/monthly)

**Data**: loads from Supabase (`orders`, `order_items`, `products`, `customers`). With no live orders yet, it runs on a rich demo dataset so every chart works immediately. The header shows the active data source.

**Auth**: when Supabase is configured, `/admin` is gated by Supabase login. Lock it to your admin email in RLS / a profile check. In demo mode (no env keys) it's open for preview.

**Scheduled reports**: `supabase/functions/scheduled-reports/` — deploy and schedule with pg_cron; plug in an email provider key (Resend/SendGrid). Recipient defaults to the admin email.

**Libraries added**: recharts (charts), papaparse (CSV), jspdf + jspdf-autotable (PDF), date-fns.
