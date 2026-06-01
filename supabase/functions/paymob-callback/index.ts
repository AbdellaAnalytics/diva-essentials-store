// supabase/functions/paymob-callback/index.ts
// Paymob calls this after payment. We VERIFY the HMAC signature before
// trusting anything, then mark the order paid. Never trust the browser for this.
//
// Secrets:
//   PAYMOB_HMAC              — HMAC secret from Paymob dashboard
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Configure this URL as your Transaction Processed Callback in Paymob:
//   https://<project>.functions.supabase.co/paymob-callback

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts'

// The exact field order Paymob uses to build the HMAC string.
const HMAC_KEYS = [
  'amount_cents', 'created_at', 'currency', 'error_occured', 'has_parent_transaction',
  'id', 'integration_id', 'is_3d_secure', 'is_auth', 'is_capture', 'is_refunded',
  'is_standalone_payment', 'is_voided', 'order', 'owner', 'pending',
  'source_data.pan', 'source_data.sub_type', 'source_data.type', 'success',
]

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url)
    // Paymob sends a GET (redirect) and a POST (server callback). Handle both.
    let obj: Record<string, unknown> = {}
    let hmacReceived = url.searchParams.get('hmac') || ''

    if (req.method === 'POST') {
      const body = await req.json()
      obj = body.obj || body
      hmacReceived = hmacReceived || body.hmac || ''
    } else {
      // GET redirect: values are flat query params
      for (const [k, v] of url.searchParams) obj[k] = v
    }

    const secret = Deno.env.get('PAYMOB_HMAC')
    if (!secret) return new Response('HMAC not configured', { status: 500 })

    // Build the concatenated string in Paymob's required order
    const concat = HMAC_KEYS.map((k) => {
      if (k.includes('.')) {
        const [a, b] = k.split('.')
        const parent = (obj[a] ?? obj[`${a}_${b}`]) as Record<string, unknown> | undefined
        const val = parent && typeof parent === 'object' ? parent[b] : obj[`source_data_${b}`]
        return String(val ?? '')
      }
      return String(obj[k] ?? '')
    }).join('')

    const computed = await hmacSha512(secret, concat)
    if (computed.toLowerCase() !== String(hmacReceived).toLowerCase()) {
      return new Response('Invalid HMAC', { status: 401 })
    }

    // Signature valid — now mark the order
    const success = String(obj['success']) === 'true'
    const paymobOrderId = (obj['order'] as any)?.id ?? obj['order']
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    if (paymobOrderId) {
      await supabase.from('orders').update({
        payment_status: success ? 'paid' : 'unpaid',
        status: success ? 'paid' : 'pending',
        updated_at: new Date().toISOString(),
      }).eq('paymob_order_id', paymobOrderId)
    }

    // For the GET redirect, send the shopper to a friendly page
    if (req.method === 'GET') {
      const dest = success ? '/confirmation?paid=1' : '/checkout?failed=1'
      return new Response(null, { status: 302, headers: { Location: dest } })
    }
    return new Response(JSON.stringify({ ok: true, success }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(String(e), { status: 500 })
  }
})

async function hmacSha512(key: string, msg: string) {
  const enc = new TextEncoder()
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(msg))
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('')
}
