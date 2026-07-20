// Supabase Edge Function: bosta-ship
// Creates a Bosta delivery for an order. Keeps the API key server-side.
//
// Deploy from Supabase Dashboard → Edge Functions → New Function → name "bosta-ship"
// Secret needed:
//   BOSTA_API_KEY  = (your Bosta API key from the dashboard → API Integration)
//   BOSTA_BASE_URL = https://app.bosta.co/api/v2   (production)
//                    (staging: https://stg-app.bosta.co/api/v2)
//   BOSTA_PICKUP_CITY = Cairo   (your default pickup city, optional)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const order = await req.json()
    // Expected fields from the dashboard:
    // { orderNumber, name, phone, city, address, notes, cod, secondPhone }

    const apiKey = Deno.env.get('BOSTA_API_KEY')!
    const baseUrl = Deno.env.get('BOSTA_BASE_URL') || 'https://app.bosta.co/api/v2'

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'BOSTA_API_KEY not set' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    // Split name into first / last (Bosta requires both)
    const fullName = (order.name || '').trim()
    const parts = fullName.split(' ')
    const firstName = parts[0] || 'Customer'
    const lastName = parts.slice(1).join(' ') || '-'

    const payload = {
      type: 10,                      // 10 = Send (normal delivery)
      specs: { packageType: 'Parcel', size: 'SMALL', packageDetails: { itemsCount: 1, description: order.notes || 'Diva Essentials candles' } },
      notes: order.notes || '',
      cod: Number(order.cod) || 0,   // cash to collect (0 if already paid online)
      dropOffAddress: {
        city: order.city || '',      // Bosta city name
        zone: order.zone || '',
        firstLine: order.address || '',
        secondLine: order.address2 || '',
      },
      receiver: {
        firstName,
        lastName,
        phone: order.phone || '',
        secondPhone: order.secondPhone || '',
        email: order.email || '',
      },
      businessReference: order.orderNumber || '',
    }

    const res = await fetch(`${baseUrl}/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: apiKey },
      body: JSON.stringify(payload),
    })
    const out = await res.json()

    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: out?.message || 'Bosta error', detail: out }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    // Bosta returns a tracking number + delivery id
    const trackingNumber = out?.data?.trackingNumber || out?.trackingNumber || null
    const deliveryId = out?.data?._id || out?._id || null

    // Save tracking info back to the order
    if (trackingNumber || deliveryId) {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        )
        await supabase.from('orders').update({
          bosta_tracking_number: trackingNumber,
          bosta_delivery_id: deliveryId,
          bosta_state: 'Pending Pickup',
          bosta_updated_at: new Date().toISOString(),
        }).eq('order_number', order.orderNumber)
      } catch (e) { /* non-fatal */ }
    }

    return new Response(JSON.stringify({ ok: true, trackingNumber, deliveryId }),
      { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
