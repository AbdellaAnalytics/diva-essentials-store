// Supabase Edge Function: bosta-webhook
// Receives delivery status updates from Bosta and updates the order.
//
// Deploy from Supabase Dashboard → Edge Functions → New Function → name "bosta-webhook"
// Turn "Verify JWT" OFF (Bosta won't send a Supabase token).
// Secrets: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are auto-provided.
//
// Give this URL to Bosta support to register as your webhook:
//   https://<your-project>.supabase.co/functions/v1/bosta-webhook

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Map Bosta numeric state codes → friendly labels shown in your dashboard.
// (Bosta's exact codes come with your API docs; unknown codes fall back to the raw state text.)
const STATE_MAP: Record<string, string> = {
  '10': 'Pending Pickup',
  '20': 'Picked Up',
  '21': 'In Transit',
  '22': 'In Transit',
  '24': 'Out for Delivery',
  '25': 'Out for Delivery',
  '45': 'Delivered',
  '46': 'Returned to Business',
  '47': 'Exception',
  '48': 'Lost',
  '49': 'Damaged',
  '100': 'Delivered',
}

function labelFor(code: any, rawState: any): string {
  const c = String(code ?? '')
  if (STATE_MAP[c]) return STATE_MAP[c]
  if (rawState) return String(rawState)
  return 'Updated'
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('OK', { status: 200 })

  try {
    const body = await req.json()
    // Bosta payloads vary; pull the common fields defensively.
    const d = body?.data || body
    const trackingNumber = d?.trackingNumber || d?.tracking_number || d?.masterAirwaybillNumber || null
    const orderNumber = d?.businessReference || d?.businessRef || d?.orderId || null
    const stateCode = d?.state?.code ?? d?.stateCode ?? d?.exceptionCode ?? null
    const rawState = d?.state?.value ?? d?.state ?? d?.status ?? null
    const label = labelFor(stateCode, rawState)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Log every event
    await supabase.from('shipment_events').insert({
      order_number: orderNumber,
      tracking_number: trackingNumber,
      state: label,
      state_code: stateCode ? Number(stateCode) : null,
      raw: body,
    })

    // Update the order's current shipment status (match by tracking number or order number)
    const patch = {
      bosta_state: label,
      bosta_state_code: stateCode ? Number(stateCode) : null,
      bosta_updated_at: new Date().toISOString(),
    }
    if (trackingNumber) {
      await supabase.from('orders').update(patch).eq('bosta_tracking_number', trackingNumber)
    } else if (orderNumber) {
      await supabase.from('orders').update(patch).eq('order_number', orderNumber)
    }

    // Always 200 so Bosta doesn't retry endlessly
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
})
