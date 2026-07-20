import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { initMetaPixel, Pixel } from '../lib/metaPixel'

const hasSupabase =
  import.meta.env.VITE_SUPABASE_URL &&
  !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_PROJECT')

// Loads the Meta Pixel (from the integrations table) and fires PageView on
// every route change. Mount once, high in the app tree.
export default function PixelProvider() {
  const location = useLocation()
  const [ready, setReady] = useState(false)

  // Load the pixel id once
  useEffect(() => {
    let active = true
    async function load() {
      if (!hasSupabase) return
      const { data } = await supabase
        .from('integrations')
        .select('enabled, public_config')
        .eq('provider', 'meta_pixel')
        .maybeSingle()
      if (!active) return
      const pixelId = data?.public_config?.pixel_id
      if (data?.enabled && pixelId) {
        initMetaPixel(pixelId)
        setReady(true)
      }
    }
    load()
    return () => { active = false }
  }, [])

  // Fire PageView on navigation (after the initial one from init)
  useEffect(() => {
    if (ready) Pixel.pageView()
  }, [location.pathname, ready])

  return null
}
