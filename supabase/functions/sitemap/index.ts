// Supabase Edge Function: sitemap
// Generates sitemap.xml dynamically, including every active product.
// Deploy name: "sitemap"  (Verify JWT = OFF — search engines send no token)
//
// Then point your sitemap at it. Easiest: in robots.txt use
//   Sitemap: https://<project-ref>.supabase.co/functions/v1/sitemap
// (or add a Vercel rewrite from /sitemap.xml → this function).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SITE = 'https://divaessentialsgroup.com'

Deno.serve(async () => {
  const staticUrls = [
    { loc: '/', pri: '1.0' },
    { loc: '/shop', pri: '0.9' },
    { loc: '/about', pri: '0.6' },
    { loc: '/returns', pri: '0.5' },
    { loc: '/privacy', pri: '0.4' },
    { loc: '/terms', pri: '0.4' },
  ]

  let productUrls: { loc: string; pri: string }[] = []
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data } = await supabase.from('products').select('slug, is_active').eq('is_active', true)
    productUrls = (data || []).filter(p => p.slug).map(p => ({ loc: `/product/${p.slug}`, pri: '0.8' }))
  } catch (_) { /* fall back to static only */ }

  const all = [...staticUrls, ...productUrls]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all.map(u => `  <url><loc>${SITE}${u.loc}</loc><priority>${u.pri}</priority></url>`).join('\n')}
</urlset>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
})
