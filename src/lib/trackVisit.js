import { supabase } from './supabase'

const hasSupabase =
  import.meta.env.VITE_SUPABASE_URL &&
  !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_PROJECT')

// Detect a rough traffic source from the referrer / UTM.
function detectSource() {
  try {
    const url = new URL(window.location.href)
    const utm = url.searchParams.get('utm_source')
    if (utm) return utm.toLowerCase()
    const ref = document.referrer || ''
    if (!ref) return 'direct'
    const h = new URL(ref).hostname.replace('www.', '')
    if (h.includes('google')) return 'google'
    if (h.includes('facebook') || h.includes('fb.')) return 'facebook'
    if (h.includes('instagram')) return 'instagram'
    if (h.includes('tiktok')) return 'tiktok'
    if (h.includes('t.co') || h.includes('twitter') || h.includes('x.com')) return 'twitter'
    if (h.includes(location.hostname)) return 'internal'
    return h  // some other referring site
  } catch (e) { return 'direct' }
}

function detectDevice() {
  const ua = navigator.userAgent || ''
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  if (/mobi|android|iphone/i.test(ua)) return 'mobile'
  return 'desktop'
}

// A per-day session id kept in sessionStorage (rough unique-visit grouping).
function sessionId() {
  try {
    let id = sessionStorage.getItem('diva_sid')
    if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('diva_sid', id) }
    return id
  } catch (e) { return 'na' }
}

// Record a page view. Safe & silent on failure — never blocks the UI.
export async function trackVisit(path) {
  if (!hasSupabase) return
  try {
    await supabase.from('visits').insert({
      path: path || location.pathname,
      referrer: (document.referrer || '').slice(0, 300),
      source: detectSource(),
      device: detectDevice(),
      session_id: sessionId(),
    })
  } catch (e) { /* ignore */ }
}
