import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard, BarChart3, Boxes, ClipboardList, Users, CreditCard,
  FileBarChart, LogOut, Menu, X, Flame, Package, Settings as SettingsIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAdminData } from './lib/useAdminData'
import { AC, serif, sans, Btn } from './ui'
import Overview from './modules/Overview'
import Analytics from './modules/Analytics'
import Products from './modules/Products'
import Inventory from './modules/Inventory'
import Orders from './modules/Orders'
import Customers from './modules/Customers'
import Approvals from './modules/Approvals'
import Reports from './modules/Reports'
import Settings from './modules/Settings'
import { useSettings } from '../lib/useSettings'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Jost:wght@300;400;500&display=swap');`

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'analytics', label: 'Sales Analytics', icon: BarChart3 },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'approvals', label: 'Approvals', icon: CreditCard },
  { id: 'reports', label: 'Reports', icon: FileBarChart },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

const hasSupabase =
  import.meta.env.VITE_SUPABASE_URL &&
  !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_PROJECT')

export default function AdminDashboard() {
  const [page, setPage] = useState('overview')
  const [navOpen, setNavOpen] = useState(false)
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const data = useAdminData()
  const { settings } = useSettings()

  useEffect(() => {
    if (!hasSupabase) { setAuthReady(true); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub?.subscription?.unsubscribe?.()
  }, [])

  // Auth gate (only when Supabase is configured; demo mode is open)
  if (hasSupabase && authReady && !session) return <Login />

  const goto = (id) => { setPage(id); setNavOpen(false) }

  const updateOrderStatus = async (id, status) => {
    if (hasSupabase) await supabase.from('orders').update({ status }).eq('id', id)
  }
  const decideProof = async (orderId, decision) => {
    if (hasSupabase) {
      await supabase.from('orders').update({
        payment_status: decision === 'approved' ? 'paid' : 'unpaid',
        status: decision === 'approved' ? 'paid' : 'cancelled',
      }).eq('id', orderId)
    }
  }

  const Module = {
    overview: <Overview data={data} goto={goto} />,
    analytics: <Analytics data={data} />,
    products: <Products data={data} reload={data.reload} />,
    inventory: <Inventory data={data} />,
    orders: <Orders data={data} onUpdate={updateOrderStatus} />,
    customers: <Customers data={data} />,
    approvals: <Approvals data={data} onDecision={decideProof} />,
    reports: <Reports data={data} />,
    settings: <Settings data={settings} reload={data.reload} />,
  }[page]

  return (
    <div style={{ background: AC.bg, minHeight: '100vh', fontFamily: sans, color: AC.ink, display: 'flex' }}>
      <style>{FONTS}{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:9px;height:9px}
        ::-webkit-scrollbar-thumb{background:#cfc6b4;border-radius:9px}
        .adm-nav-item:hover{background:rgba(255,255,255,.06)!important}
        @media(max-width:900px){ .adm-sidebar{position:fixed!important;z-index:200;transform:translateX(-100%);transition:transform .3s} .adm-sidebar.open{transform:none!important} }
        input{font-size:16px}
      `}</style>

      {/* Sidebar */}
      <aside className={`adm-sidebar ${navOpen ? 'open' : ''}`} style={{ width: 248, background: AC.sidebar, color: '#e8e1d2', minHeight: '100vh', flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '24px 22px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontFamily: serif, fontSize: 25, fontWeight: 500, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
            Diva <Flame size={16} color={AC.flame} style={{ marginLeft: -2 }} />
          </div>
          <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 13, color: AC.gold, marginTop: -2 }}>Essentials · Admin</div>
        </div>

        <nav style={{ padding: '14px 12px', flex: 1 }}>
          {NAV.map(n => {
            const active = page === n.id
            return (
              <div key={n.id} className="adm-nav-item" onClick={() => goto(n.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 3, background: active ? 'rgba(200,160,74,.16)' : 'transparent', color: active ? AC.gold : '#c5bca9', fontSize: 14, fontWeight: active ? 500 : 400, transition: 'background .2s' }}>
                <n.icon size={18} strokeWidth={active ? 2 : 1.5} />
                {n.label}
              </div>
            )
          })}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <div className="adm-nav-item" onClick={() => hasSupabase && supabase.auth.signOut()} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, cursor: 'pointer', color: '#c5bca9', fontSize: 14 }}>
            <LogOut size={18} strokeWidth={1.5} /> Sign Out
          </div>
        </div>
      </aside>

      {navOpen && <div onClick={() => setNavOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 150 }} />}

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: '#fff', borderBottom: `1px solid ${AC.line}`, padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => setNavOpen(true)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer' }} className="adm-burger"><Menu size={22} /></button>
            <div style={{ fontSize: 13.5, color: AC.sub }}>
              {data.loading ? 'Loading data…' : <>Data source: <strong style={{ color: AC.ink }}>{data.source}</strong></>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{session?.user?.email || 'Demo Admin'}</div>
              <div style={{ fontSize: 11, color: AC.sub }}>Administrator</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 999, background: AC.sidebar, color: AC.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontSize: 16 }}>D</div>
          </div>
        </header>

        <div style={{ padding: 28, maxWidth: 1280, width: '100%', margin: '0 auto' }}>
          {Module}
        </div>
      </main>

      <style>{`@media(max-width:900px){ .adm-burger{display:block!important} }`}</style>
    </div>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const submit = async () => {
    setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
    if (error) setErr(error.message)
  }
  return (
    <div style={{ minHeight: '100vh', background: AC.sidebar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans, padding: 20 }}>
      <style>{FONTS}</style>
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, width: 'min(400px,100%)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: serif, fontSize: 30, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5 }}>Diva <Flame size={18} color={AC.flame} /></div>
          <div style={{ fontFamily: serif, fontStyle: 'italic', color: AC.goldDeep, fontSize: 14 }}>Essentials · Admin</div>
        </div>
        {['Email', 'Password'].map((l, i) => (
          <div key={l} style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: AC.sub, marginBottom: 6 }}>{l}</label>
            <input type={i ? 'password' : 'email'} value={i ? pw : email} onChange={e => i ? setPw(e.target.value) : setEmail(e.target.value)}
              style={{ width: '100%', padding: '11px 13px', border: `1px solid ${AC.line}`, borderRadius: 9, fontSize: 15, fontFamily: 'inherit' }} />
          </div>
        ))}
        {err && <p style={{ color: AC.red, fontSize: 13, marginBottom: 12 }}>{err}</p>}
        <Btn variant="solid" onClick={submit} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>Sign In</Btn>
      </div>
    </div>
  )
}
