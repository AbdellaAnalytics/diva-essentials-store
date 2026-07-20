// Supabase Edge Function: kashier-init
// Securely builds a Kashier Hosted Payment Page URL.
// The SECRET stays on the server (never sent to the browser).
//
// Deploy from Supabase Dashboard → Edge Functions → New Function → name it "kashier-init"
// Then set secrets:
//   KASHIER_MID         = MID-46634-787
//   KASHIER_API_KEY     = (your Payment API Key)
//   KASHIER_MODE        = live   (or test)

import { createHmac } from 'node:crypto'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { orderId, currency = 'EGP', redirectUrl } = await req.json()

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId is required' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    // SECURITY: never trust an amount sent from the browser.
    // Read the real order total from the database instead.
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supa = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: ord } = await supa.from('orders')
      .select('total, payment_status').eq('order_number', orderId).maybeSingle()
    if (!ord) {
      return new Response(JSON.stringify({ error: 'order not found' }),
        { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } })
    }
    const amount = Number(ord.total).toFixed(2)

    const mid = Deno.env.get('KASHIER_MID')!
    const apiKey = Deno.env.get('KASHIER_API_KEY')!
    const mode = Deno.env.get('KASHIER_MODE') || 'live'

    // Kashier order hash: HMAC-SHA256 of "/?payment=mid.orderId.amount.currency" using the API key
    const path = `/?payment=${mid}.${orderId}.${amount}.${currency}`
    const hash = createHmac('sha256', apiKey).update(path).digest('hex')

    const baseUrl = 'https://checkout.kashier.io'
    const webhookUrl = Deno.env.get('KASHIER_WEBHOOK_URL') || ''
    const params = new URLSearchParams({
      merchantId: mid,
      orderId: String(orderId),
      amount: String(amount),
      currency,
      hash,
      mode,
      merchantRedirect: redirectUrl || '',
      allowedMethods: 'card,wallet',
      display: 'en',
    })
    // Tell Kashier where to send the secure server-to-server notification.
    if (webhookUrl) params.set('serverWebhook', webhookUrl)
    const paymentUrl = `${baseUrl}?${params.toString()}`

    return new Response(JSON.stringify({ paymentUrl }),
      { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
