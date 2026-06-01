import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const hasSupabase =
  import.meta.env.VITE_SUPABASE_URL &&
  !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_PROJECT')

// Defaults used in preview mode (no Supabase) and as fallback before load.
export const DEFAULT_SETTINGS = {
  store_name: 'Diva Essentials',
  free_shipping_threshold: 2000,
  shipping_flat: 60,
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
  const { data: cur } = await supabase.from('settings').select('data').eq('id', 1).single()
  const next = { ...(cur?.data || {}), ...patch }
  const { error } = await supabase.from('settings').update({ data: next, updated_at: new Date().toISOString() }).eq('id', 1)
  return { ok: !error, error }
}
