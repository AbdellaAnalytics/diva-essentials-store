import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const hasSupabase =
  import.meta.env.VITE_SUPABASE_URL &&
  !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_PROJECT')

// The store OWNER — full access always, and the only one who can manage managers.
// Change this to your email. (Lowercased compare.)
export const OWNER_EMAIL = 'mohamed.abdullah969@gmail.com'

// Sections that can be permissioned. Keep ids in sync with NAV ids in AdminDashboard.
export const PERMISSION_SECTIONS = [
  { id: 'orders', label: 'Orders' },
  { id: 'products', label: 'Products' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'shipments', label: 'Shipments' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'reports', label: 'Reports' },
  { id: 'customers', label: 'Customers' },
]

// overview is always visible to any allowed admin; settings + approvals are owner-only.
export const OWNER_ONLY = ['settings', 'approvals']
export const ALWAYS = ['overview']

// Returns { loading, allowed, isOwner, perms:Set, email }
export function useAdminAccess(session) {
  const email = (session?.user?.email || '').toLowerCase()
  const isOwner = !!email && email === OWNER_EMAIL.toLowerCase()
  const [state, setState] = useState({ loading: true, allowed: false, perms: new Set() })

  useEffect(() => {
    let active = true
    async function load() {
      if (!email) { if (active) setState({ loading: false, allowed: false, perms: new Set() }); return }
      if (isOwner) { if (active) setState({ loading: false, allowed: true, perms: new Set(PERMISSION_SECTIONS.map(s => s.id)) }); return }
      if (!hasSupabase) { if (active) setState({ loading: false, allowed: false, perms: new Set() }); return }
      // look up this email in the admins table
      const { data } = await supabase.from('admins').select('permissions, active').eq('email', email).maybeSingle()
      if (!active) return
      if (data && data.active !== false) {
        setState({ loading: false, allowed: true, perms: new Set(data.permissions || []) })
      } else {
        setState({ loading: false, allowed: false, perms: new Set() })
      }
    }
    load()
    return () => { active = false }
  }, [email, isOwner])

  return { ...state, isOwner, email }
}

// Manager CRUD (owner only — enforced by RLS too)
export async function listAdmins() {
  if (!hasSupabase) return []
  const { data } = await supabase.from('admins').select('*').order('created_at', { ascending: true })
  return data || []
}
export async function upsertAdmin(row) {
  if (!hasSupabase) return { ok: true, demo: true }
  const payload = { email: row.email.trim().toLowerCase(), permissions: row.permissions, active: row.active !== false }
  const { error } = await supabase.from('admins').upsert(payload, { onConflict: 'email' })
  return { ok: !error, error }
}
export async function deleteAdmin(email) {
  if (!hasSupabase) return { ok: true }
  const { error } = await supabase.from('admins').delete().eq('email', email.toLowerCase())
  return { ok: !error, error }
}
