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
    const { orderId, amount, currency = 'EGP', redirectUrl } = await req.json()

    if (!orderId || !amount) {
      return new Response(JSON.stringify({ error: 'orderId and amount are required' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const mid = Deno.env.get('KASHIER_MID')!
    const apiKey = Deno.env.get('KASHIER_API_KEY')!
    const mode = Deno.env.get('KASHIER_MODE') || 'live'

    // Kashier order hash: HMAC-SHA256 of "/?payment=mid.orderId.amount.currency" using the API key
    const path = `/?payment=${mid}.${orderId}.${amount}.${currency}`
    const hash = createHmac('sha256', apiKey).update(path).digest('hex')

    const baseUrl = 'https://checkout.kashier.io'
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
    const paymentUrl = `${baseUrl}?${params.toString()}`

    return new Response(JSON.stringify({ paymentUrl }),
      { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
