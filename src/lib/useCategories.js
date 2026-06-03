import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { CATEGORIES as FALLBACK_CATEGORIES } from './fallback'

const hasSupabase =
  import.meta.env.VITE_SUPABASE_URL &&
  !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_PROJECT')

// Returns the list of categories to drive nav / filters / footer.
// Pass the loaded products so we can fall back to whatever categories
// actually have products, keeping everything consistent and data-driven.
export function useCategories(products = []) {
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES)

  useEffect(() => {
    if (!hasSupabase) return
    let active = true
    ;(async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('name, slug, image_url')
        .order('sort_order')
      if (active && !error && data?.length) {
        setCategories(data)
      }
    })()
    return () => { active = false }
  }, [])

  // If for any reason categories didn't load, derive them from the products
  // we have, so a newly added collection still appears without code changes.
  if (categories.length === 0 && products.length) {
    const seen = new Map()
    products.forEach(p => {
      if (p.category_slug && !seen.has(p.category_slug)) {
        seen.set(p.category_slug, { slug: p.category_slug, name: p.category_name })
      }
    })
    return [...seen.values()]
  }

  return categories
}
