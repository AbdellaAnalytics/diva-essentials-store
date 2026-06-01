// supabase/functions/bosta-shipping/index.ts
// Create a Bosta delivery for an order, and track existing ones.
//
// Secrets:
//   BOSTA_API_KEY  — from Bosta dashboard (Settings → API)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Request body:
//   { action: 'create', order_id: number }   -> creates a delivery
//   { action: 'track',  tracking_number: string }
//
// Bosta API docs: https://docs.bosta.co  (base: https://app.bosta.co/api/v2)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const BOSTA = 'https://app.bosta.co/api/v2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const apiKey = Deno.env.get('BOSTA_API_KEY')
    if (!apiKey) return json({ error: 'Bosta not configured (missing API key)' }, 500)
    const headers = { 'Content-Type': 'application/json', Authorization: apiKey }

    const { action, order_id, tracking_number } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    if (action === 'track') {
      const r = await (await fetch(`${BOSTA}/deliveries/business/${tracking_number}`, { headers })).json()
      return json({ ok: true, tracking: r })
    }

    if (action === 'create') {
      const { data: order, error } = await supabase.from('orders').select('*').eq('id', order_id).single()
      if (error || !order) return json({ error: 'Order not found' }, 404)

      // type 10 = Send (delivery). Adjust city to a valid Bosta city.
      const payload = {
        type: 10,
        specs: { packageType: 'Parcel', size: 'SMALL', packageDetails: { itemsCount: 1, description: 'Candles' } },
        notes: order.notes || '',
        cod: order.payment_method === 'cod' ? Number(order.total) : 0,
        dropOffAddress: {
          city: order.ship_city || 'Cairo',
          zoneName: order.ship_city || 'Cairo',
          firstLine: order.ship_address || '',
        },
        receiver: {
          firstName: (order.ship_name || 'Customer').split(' ')[0],
          lastName: (order.ship_name || 'Customer').split(' ').slice(1).join(' ') || '-',
          phone: order.ship_phone || '',
        },
        businessReference: order.order_number,
      }

      const r = await (await fetch(`${BOSTA}/deliveries`, { method: 'POST', headers, body: JSON.stringify(payload) })).json()
      const tracking = r?.data?.trackingNumber || r?.trackingNumber
      if (!tracking) return json({ error: 'Bosta create failed', detail: r }, 502)

      // record shipment + flip order to shipped
      await supabase.from('shipments').insert({
        order_id, courier: 'bosta', tracking_number: tracking, status: 'created',
      })
      await supabase.from('orders').update({ status: 'shipped', updated_at: new Date().toISOString() }).eq('id', order_id)

      return json({ ok: true, tracking_number: tracking, raw: r })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}
