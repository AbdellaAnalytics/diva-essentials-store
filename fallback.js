import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { generateDemoData } from './demoData'

const hasSupabase =
  import.meta.env.VITE_SUPABASE_URL &&
  !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_PROJECT')

// Central data source for the whole admin dashboard.
// Loads products, orders, order_items, customers, categories. Falls back to a
// rich demo dataset so every chart and report works out of the box.
export function useAdminData() {
  const [data, setData] = useState(() => ({ ...generateDemoData(), categories: [], source: 'demo', loading: hasSupabase }))
  const [nonce, setNonce] = useState(0)
  const reload = useCallback(() => setNonce(n => n + 1), [])

  useEffect(() => {
    if (!hasSupabase) return
    let active = true
    ;(async () => {
      try {
        const [prodRes, ordRes, itemRes, custRes, catRes] = await Promise.all([
          supabase.from('products').select('*, categories(name, slug)'),
          supabase.from('orders').select('*'),
          supabase.from('order_items').select('*'),
          supabase.from('customers').select('*'),
          supabase.from('categories').select('*').order('sort_order'),
        ])

        const orders = ordRes.data || []
        const orderItems = itemRes.data || []
        const categories = catRes.data || []
        const products = (prodRes.data || []).map(p => ({
          ...p, category_name: p.categories?.name, category_slug: p.categories?.slug,
        }))

        // If there are no real orders yet, keep demo analytics data but use
        // REAL products/categories so the Products tab manages live catalog.
        if (!orders.length) {
          const demo = generateDemoData()
          if (active) setData({
            ...demo,
            products: products.length ? products : demo.products,
            categories,
            source: 'demo analytics · live catalog',
            loading: false,
          })
          return
        }

        const customers = custRes.data || []
        const custById = Object.fromEntries(customers.map(c => [c.id, c]))
        const enrichedOrders = orders.map(o => ({
          ...o,
          customer_name: custById[o.customer_id]?.full_name || o.ship_name || 'Guest',
          city: custById[o.customer_id]?.city || o.ship_city || '—',
        }))

        if (active) setData({ products, orders: enrichedOrders, orderItems, customers, categories, source: 'supabase', loading: false })
      } catch (e) {
        if (active) setData(d => ({ ...d, source: 'demo (load error)', loading: false }))
      }
    })()
    return () => { active = false }
  }, [nonce])

  return { ...data, reload }
}
