import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { FALLBACK_PRODUCTS } from './fallback'

const hasSupabase =
  import.meta.env.VITE_SUPABASE_URL &&
  !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_PROJECT')

export function useProducts() {
  // When Supabase is configured, start empty and show ONLY live data.
  // The demo catalog is a fallback for preview mode (no Supabase) only.
  const [products, setProducts] = useState(hasSupabase ? [] : FALLBACK_PRODUCTS)
  const [loading, setLoading] = useState(hasSupabase)

  useEffect(() => {
    if (!hasSupabase) return
    let active = true
    ;(async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('is_active', true)
        .order('id')
      if (active) {
        if (error) {
          console.error('Product load error:', error.message)
        } else {
          // Use live data even if empty — never silently fall back to demo
          setProducts(
            (data || []).map(p => ({
              ...p,
              category_name: p.categories?.name,
              category_slug: p.categories?.slug,
            }))
          )
        }
        setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  return { products, loading }
}
