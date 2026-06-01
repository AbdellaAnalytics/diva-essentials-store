// supabase/functions/paymob-init/index.ts
// Starts a Paymob payment. Returns an iframe URL (card) or redirect URL (wallet).
//
// Secrets (set with: supabase secrets set ...):
//   PAYMOB_API_KEY           — your Paymob API key
//   PAYMOB_INTEGRATION_CARD  — card integration ID (number)
//   PAYMOB_INTEGRATION_WALLET— wallet integration ID (number)
//   PAYMOB_IFRAME_ID         — iframe ID (number) for card
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — to read/update orders
//
// Request body: { order_id: number, method: 'card' | 'wallet', wallet_number?: string }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PAYMOB = 'https://accept.paymob.com/api'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { order_id, method = 'card', wallet_number } = await req.json()
    if (!order_id) return json({ error: 'order_id required' }, 400)

    const apiKey = Deno.env.get('PAYMOB_API_KEY')
    const iframeId = Deno.env.get('PAYMOB_IFRAME_ID')
    const intCard = Deno.env.get('PAYMOB_INTEGRATION_CARD')
    const intWallet = Deno.env.get('PAYMOB_INTEGRATION_WALLET')
    if (!apiKey) return json({ error: 'Paymob not configured (missing API key)' }, 500)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 1) Load the order (authoritative amount — never trust the client)
    const { data: order, error } = await supabase
      .from('orders').select('*').eq('id', order_id).single()
    if (error || !order) return json({ error: 'Order not found' }, 404)

    const amountCents = Math.round(Number(order.total) * 100)

    // 2) Auth token
    const auth = await (await fetch(`${PAYMOB}/auth/tokens`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey }),
    })).json()
    const token = auth.token
    if (!token) return json({ error: 'Paymob auth failed' }, 502)

    // 3) Register order with Paymob
    const pmOrder = await (await fetch(`${PAYMOB}/ecommerce/orders`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: token, delivery_needed: false, amount_cents: amountCents,
        currency: 'EGP', merchant_order_id: `${order.order_number}-${Date.now()}`,
        items: [],
      }),
    })).json()
    if (!pmOrder.id) return json({ error: 'Paymob order failed', detail: pmOrder }, 502)

    // 4) Payment key
    const [first, ...rest] = (order.ship_name || 'Customer').split(' ')
    const integrationId = method === 'wallet' ? intWallet : intCard
    if (!integrationId) return json({ error: `No integration ID for ${method}` }, 500)

    const pk = await (await fetch(`${PAYMOB}/acceptance/payment_keys`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: token, amount_cents: amountCents, expiration: 3600,
        order_id: pmOrder.id, currency: 'EGP',
        integration_id: Number(integrationId),
        billing_data: {
          first_name: first || 'Customer', last_name: rest.join(' ') || '-',
          phone_number: order.ship_phone || '+200000000000',
          email: order.email || 'customer@diva.com',
          street: order.ship_address || 'NA', city: order.ship_city || 'Cairo',
          country: 'EG', apartment: 'NA', floor: 'NA', building: 'NA',
          shipping_method: 'NA', postal_code: 'NA', state: 'NA',
        },
      }),
    })).json()
    if (!pk.token) return json({ error: 'Paymob payment key failed', detail: pk }, 502)

    // 5) Save the Paymob order id on our order for callback matching
    await supabase.from('orders')
      .update({ payment_method: 'paymob', payment_status: 'unpaid', paymob_order_id: pmOrder.id })
      .eq('id', order_id)

    // 6) Return the right URL
    if (method === 'wallet') {
      const w = await (await fetch(`${PAYMOB}/acceptance/payments/pay`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: { identifier: wallet_number || order.ship_phone, subtype: 'WALLET' },
          payment_token: pk.token,
        }),
      })).json()
      return json({ type: 'wallet', redirect_url: w.redirect_url || w.iframe_redirection_url, raw: w })
    }
    return json({ type: 'card', iframe_url: `${PAYMOB}/acceptance/iframes/${iframeId}?payment_token=${pk.token}` })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}
