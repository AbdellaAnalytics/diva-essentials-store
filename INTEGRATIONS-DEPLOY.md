# Paymob + Bosta — Deployment Guide

These two need **Supabase Edge Functions** (server-side code) plus secrets.
The Settings tab in your admin stores the public IDs; the secret keys live as
Supabase secrets so the browser can never see them.

---

## Part A — Run the database updates

In Supabase → SQL Editor, run the **new block at the bottom** of
`schema-FIXED.sql` (everything under "Paymob:" near the end). It's safe to
re-run. It adds:
- `paymob_order_id` and `email` columns on `orders`
- a `paymob` integration row

---

## Part B — Install the Supabase CLI (one time)

Edge Functions deploy with the CLI (the website can't deploy them).

1. Install Node if you haven't, then:
   ```
   npm install -g supabase
   ```
2. Log in:
   ```
   supabase login
   ```
3. Link your project (project ref is in your dashboard URL —
   `dppdxfssqxornvlqntpj`):
   ```
   supabase link --project-ref dppdxfssqxornvlqntpj
   ```

---

## Part C — Set the secrets

These are read ONLY by the functions on Supabase's servers.

```
supabase secrets set PAYMOB_API_KEY="your-paymob-api-key"
supabase secrets set PAYMOB_HMAC="your-paymob-hmac-secret"
supabase secrets set PAYMOB_INTEGRATION_CARD="your-card-integration-id"
supabase secrets set PAYMOB_INTEGRATION_WALLET="your-wallet-integration-id"
supabase secrets set PAYMOB_IFRAME_ID="your-iframe-id"
supabase secrets set BOSTA_API_KEY="your-bosta-api-key"
```

(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.)

---

## Part D — Deploy the functions

From the project folder:
```
supabase functions deploy paymob-init --no-verify-jwt
supabase functions deploy paymob-callback --no-verify-jwt
supabase functions deploy bosta-shipping
```

`--no-verify-jwt` is needed on the two Paymob functions because the checkout
(and Paymob's callback) call them without a logged-in user.

---

## Part E — Tell Paymob where to send the callback

In the Paymob dashboard → Developers → your integration → set both:
- **Transaction processed callback** (server):
  `https://dppdxfssqxornvlqntpj.functions.supabase.co/paymob-callback`
- **Transaction response callback** (redirect, the shopper's browser):
  `https://dppdxfssqxornvlqntpj.functions.supabase.co/paymob-callback`

This is what flips an order to **paid** — and only after the HMAC signature is
verified, so a "paid" status can't be faked.

---

## Part F — Fill in the Settings tab

In your admin → Settings → Integrations:
- **Paymob**: paste Card Integration ID, Wallet Integration ID, iFrame ID
  (these are also used to build the payment). Tick **Enabled**, Save.
- **Bosta**: paste API Key, tick Enabled, Save.

---

## How it works once live

**Paymob (checkout):**
1. Customer picks Paymob, clicks Place Order.
2. The order is created (`unpaid`), then `paymob-init` builds the payment and
   redirects to Paymob's card iframe (or wallet prompt).
3. Customer pays → Paymob calls `paymob-callback` → HMAC verified → order set
   to **paid**.

**Bosta (admin → Orders):**
- On a paid/pending order, click **📦 Bosta** → `bosta-shipping` creates the
  delivery, saves the tracking number, and flips the order to **shipped**.

---

## Important testing notes

- **Test with a real (small) transaction first.** Payment flows must be
  verified end-to-end; use Paymob's test cards if your account has a test mode.
- If a Paymob payment doesn't flip to paid, check the function logs:
  Supabase → Edge Functions → paymob-callback → Logs. The usual cause is the
  HMAC secret not matching or the callback URL not set in Paymob.
- Bosta's `city`/`zoneName` must be valid Bosta zones; if create fails, the
  error detail from Bosta is shown in the alert.
- The other pixels (Meta/TikTok/GA/WhatsApp) only **store keys** so far — they
  don't fire yet. That's the next step when you want it.
