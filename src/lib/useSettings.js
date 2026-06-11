import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const hasSupabase =
  import.meta.env.VITE_SUPABASE_URL &&
  !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_PROJECT')

// Defaults used in preview mode (no Supabase) and as fallback before load.
export const DEFAULT_SETTINGS = {
  store_name: 'Diva Essentials',
  free_shipping_threshold: 2000,
  min_order: 0,                       // 0 = no minimum
  shipping_flat: 60,                  // default flat rate (EGP)
  shipping_cities: [                  // per-city overrides
    // { city: 'Cairo', price: 50 }, ...
  ],
  whatsapp: '+201147397783',
  instapay_handle: '',
  vodafone_cash_number: '',
  hero: {
    media_type: 'image',          // 'image' | 'video'
    media_url: '',                // uploaded hero image/video
    eyebrow: 'Hand-poured in small batches',
    title: 'Light that feels like home',
    subtitle: 'Luxury soy candles with fragrances composed to transform any room into a sanctuary.',
    overlay: 0.4,                 // 0..1 dark overlay opacity
    buttons: [
      { label: 'Shop the Collection', href: '/shop', style: 'solid' },
      { label: 'Our Story', href: '/about', style: 'ghost' },
    ],
  },
  about_html: '',
  returns_html: '',

  // Social links (footer). Empty = hidden.
  social: { instagram: '', facebook: '', tiktok: '', whatsapp: '' },
  contact_email: 'info@divaessentialsgroup.com',
  contact_location: 'Cairo, Egypt',
  contact_phone: '',
  privacy_html: '',
  terms_html: '',

  // Homepage sections (each can be toggled + edited from the dashboard)
  promo: {
    enabled: true,
    image_url: '',
    eyebrow: 'Limited Edition',
    title: 'The Autumn Collection',
    subtitle: 'Warm, woody scents for the season',
    button_label: 'Shop Now',
    button_href: '/shop',
  },
  features: {
    enabled: true,
    items: [
      { icon: 'truck', title: 'Free Shipping', text: 'On orders over 2000 EGP' },
      { icon: 'leaf', title: '100% Natural Soy Wax', text: 'Clean, long-lasting burn' },
      { icon: 'shield', title: 'Secure Checkout', text: 'Your details are protected' },
      { icon: 'heart', title: 'Hand-Poured', text: 'Made in small batches' },
    ],
  },
  brand_story: {
    enabled: true,
    image_url: '',
    eyebrow: 'Our Story',
    title: 'Crafted with intention',
    text: 'Every Diva Essentials candle is hand-poured in small batches using clean soy wax and carefully composed fragrances — designed to turn any room into a sanctuary.',
    button_label: 'Learn More',
    button_href: '/about',
  },
  collections_section: { enabled: true, title: 'Shop by Collection' },
}

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(hasSupabase)

  useEffect(() => {
    if (!hasSupabase) return
    let active = true
    ;(async () => {
      const { data, error } = await supabase.from('settings').select('data').eq('id', 1).single()
      if (active) {
        if (!error && data?.data) {
          // merge so new fields (hero, pages) always exist even on old rows
          setSettings(s => ({ ...DEFAULT_SETTINGS, ...data.data, hero: { ...DEFAULT_SETTINGS.hero, ...(data.data.hero || {}) } }))
        }
        setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  return { settings, loading }
}

// Save helper (admin). Merges patch into settings.data row 1.
export async function saveSettings(patch) {
  if (!hasSupabase) return { ok: true, demo: true }
  const { data: cur } = await supabase.from('settings').select('data').eq('id', 1).maybeSingle()
  const next = { ...(cur?.data || {}), ...patch }
  // upsert so it works whether or not row id=1 already exists
  const { error } = await supabase
    .from('settings')
    .upsert({ id: 1, data: next, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  return { ok: !error, error }
}

// Compute shipping cost given the cart subtotal and selected city.
// Rules: free if subtotal >= free_shipping_threshold (when threshold > 0);
// otherwise a city-specific override if present, else the default flat rate.
export function computeShipping(settings, subtotal, city) {
  const s = settings || DEFAULT_SETTINGS
  const threshold = Number(s.free_shipping_threshold) || 0
  if (threshold > 0 && subtotal >= threshold) return 0
  if (city && Array.isArray(s.shipping_cities)) {
    const match = s.shipping_cities.find(c => (c.city || '').trim().toLowerCase() === city.trim().toLowerCase())
    if (match) return Number(match.price) || 0
  }
  return Number(s.shipping_flat) || 0
}
