// Supabase Edge Function: kashier-webhook
// Kashier calls this server-to-server after a payment. We verify the
// x-kashier-signature header, and ONLY then mark the order paid.
// This is the secure source of truth (the browser redirect cannot fake it).
//
// Deploy from Supabase Dashboard → Edge Functions → New Function → name "kashier-webhook"
// Secrets needed (same project):
//   KASHIER_API_KEY            = your Payment API Key (used to verify signature)
//   SUPABASE_URL               = (auto-provided)
//   SUPABASE_SERVICE_ROLE_KEY  = (auto-provided)  ← lets us update orders securely
//
// IMPORTANT: In Supabase, this function must allow unauthenticated calls
// (Kashier won't send a Supabase JWT). Toggle "Verify JWT" OFF for this function.
//
// Then in Kashier portal, set the Webhook URL to:
//   https://<your-project>.supabase.co/functions/v1/kashier-webhook

import { createHmac } from 'node:crypto'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = await req.json()
    // Kashier may wrap info as { data: {...} } or { event, data } or flat.
    const data = body?.data || body?.payload || body
    const receivedSig = req.headers.get('x-kashier-signature') || data?.signature || ''
    const apiKey = Deno.env.get('KASHIER_API_KEY')!

    // Build the signature payload from signatureKeys, ordered alphabetically.
    const signatureKeys: string[] = data?.signatureKeys || [
      'amount', 'channel', 'currency', 'kashierOrderId', 'merchantOrderId',
      'method', 'orderReference', 'status', 'transactionId', 'transactionResponseCode',
    ]
    const ordered = [...signatureKeys].sort()
    const queryString = ordered
      .filter((k) => data[k] !== undefined && data[k] !== null)
      .map((k) => `${k}=${data[k]}`)
      .join('&')

    const expectedSig = createHmac('sha256', apiKey).update(queryString).digest('hex')

    if (!receivedSig || expectedSig !== receivedSig) {
      // Signature mismatch → could be a forgery. Do NOT update the order.
      // Still return 200 so Kashier doesn't retry for 24h (we've handled it).
      console.warn('Kashier webhook: signature mismatch for order', data?.merchantOrderId)
      return new Response(JSON.stringify({ ok: false, reason: 'invalid signature' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    // Signature valid. Update the matching order.
    const orderNumber = data.merchantOrderId
    let paid = String(data.status).toUpperCase() === 'SUCCESS'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Defense in depth: the paid amount must match the order total.
    const { data: ord } = await supabase.from('orders')
      .select('total, ship_name, ship_phone, ship_address, ship_city, email, notes, order_number, bosta_tracking_number')
      .eq('order_number', orderNumber).maybeSingle()
    if (paid && ord && data.amount != null) {
      const paidAmt = Number(data.amount)
      const orderAmt = Number(ord.total)
      if (Math.abs(paidAmt - orderAmt) > 0.01) {
        // Amount mismatch → do NOT mark paid; flag for manual review.
        await supabase.from('orders').update({
          payment_status: 'amount_mismatch',
          kashier_txn_id: data.transactionId || null,
        }).eq('order_number', orderNumber)
        return new Response(JSON.stringify({ ok: true, flagged: 'amount mismatch' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    }
    await supabase.from('orders').update({
      payment_status: paid ? 'paid' : 'failed',
      status: paid ? 'approved' : 'cancelled',
      approved: paid,
      kashier_txn_id: data.transactionId || null,
    }).eq('order_number', orderNumber)

    // AUTO-SYNC TO BOSTA: when payment succeeds, create the shipment automatically.
    // Controlled by BOSTA_AUTO_SHIP secret ('on' to enable). Safe if Bosta isn't set up yet.
    if (paid && Deno.env.get('BOSTA_AUTO_SHIP') === 'on') {
      try {
        if (ord && !ord.bosta_tracking_number) {
          const base = Deno.env.get('SUPABASE_URL')!
          await fetch(`${base}/functions/v1/bosta-ship`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
            body: JSON.stringify({
              orderNumber: ord.order_number,
              name: ord.ship_name || '',
              phone: ord.ship_phone || '',
              email: ord.email || '',
              city: ord.ship_city || '',
              address: ord.ship_address || '',
              notes: ord.notes || '',
              cod: 0,  // already paid online
            }),
          })
        }
      } catch (e) { /* non-fatal: shipment can still be created manually */ }
    }

    return new Response(JSON.stringify({ ok: true }),
      { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
