// Supabase Edge Function: scheduled-reports
// Deploy, then schedule via pg_cron (e.g. daily 07:00):
//   select cron.schedule('daily-report','0 7 * * *',
//     $$ select net.http_post(
//          url := 'https://YOUR_PROJECT.functions.supabase.co/scheduled-reports',
//          headers := '{"Authorization":"Bearer YOUR_ANON_OR_SERVICE_KEY"}'::jsonb,
//          body := '{"period":"daily"}'::jsonb) $$);
//
// Computes a sales summary and emails it. Plug in your email provider
// (Resend / SendGrid / Postmark) where indicated.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const EMAIL_API_KEY = Deno.env.get('EMAIL_API_KEY') // your provider key
const REPORT_TO = Deno.env.get('REPORT_TO') || 'Mohamed.abdullah969@gmail.com'

Deno.serve(async (req) => {
  try {
    const { period = 'daily' } = await req.json().catch(() => ({}))
    const supabase = createClient(supabaseUrl, serviceKey)

    const days = period === 'monthly' ? 30 : period === 'weekly' ? 7 : 1
    const since = new Date(Date.now() - days * 864e5).toISOString()

    const { data: orders } = await supabase
      .from('orders')
      .select('total,status,payment_status,created_at')
      .gte('created_at', since)

    const realized = (orders || []).filter(o => o.status !== 'cancelled' && o.payment_status !== 'refunded')
    const revenue = realized.reduce((s, o) => s + Number(o.total), 0)
    const count = realized.length
    const aov = count ? Math.round(revenue / count) : 0

    const html = `
      <h2>Diva Essentials — ${period[0].toUpperCase() + period.slice(1)} Summary</h2>
      <p>Window: last ${days} day(s)</p>
      <ul>
        <li><b>Revenue:</b> ${Math.round(revenue).toLocaleString()} EGP</li>
        <li><b>Orders:</b> ${count}</li>
        <li><b>Avg order value:</b> ${aov.toLocaleString()} EGP</li>
      </ul>`

    // ---- Send email (example: Resend) ----
    if (EMAIL_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${EMAIL_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'reports@divaessentials.example',
          to: REPORT_TO,
          subject: `Diva Essentials — ${period} summary`,
          html,
        }),
      })
    }

    return new Response(JSON.stringify({ ok: true, revenue, count, aov, emailed: !!EMAIL_API_KEY }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
