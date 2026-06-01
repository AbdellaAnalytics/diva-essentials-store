import React, { useEffect, useState, useMemo } from 'react'
import { Truck, RefreshCw, Search, ExternalLink } from 'lucide-react'
import { AC, serif, sans, Panel, KpiCard, Btn, Badge, Table, SectionTitle } from '../ui'
import { supabase } from '../../lib/supabase'

const hasSupabase =
  import.meta.env.VITE_SUPABASE_URL &&
  !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_PROJECT')

const STATUS_TONES = {
  created: 'warn', picked_up: 'info', in_transit: 'info',
  delivered: 'ok', returned: 'danger', cancelled: 'danger',
}

export default function Shipments() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(hasSupabase)
  const [q, setQ] = useState('')
  const [tracking, setTracking] = useState(null)

  const load = async () => {
    if (!hasSupabase) { setRows([]); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('shipments')
      .select('*, orders(order_number, ship_name, ship_city, total)')
      .order('created_at', { ascending: false })
    setRows((data || []).map(s => ({
      ...s,
      order_number: s.orders?.order_number || '—',
      customer: s.orders?.ship_name || '—',
      city: s.orders?.ship_city || '—',
    })))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() =>
    rows.filter(r =>
      !q ||
      (r.tracking_number || '').toLowerCase().includes(q.toLowerCase()) ||
      (r.order_number || '').toLowerCase().includes(q.toLowerCase()) ||
      (r.customer || '').toLowerCase().includes(q.toLowerCase())
    ), [rows, q])

  const counts = useMemo(() => {
    const c = {}; rows.forEach(r => { c[r.status] = (c[r.status] || 0) + 1 }); return c
  }, [rows])

  const track = async (s) => {
    if (!hasSupabase) return
    setTracking(s.id)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bosta-shipping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ action: 'track', tracking_number: s.tracking_number }),
      })
      const r = await res.json()
      const state = r?.tracking?.state?.value || r?.tracking?.state || r?.tracking?.status || 'unknown'
      alert(`Tracking ${s.tracking_number}\nStatus: ${state}`)
    } catch (e) { alert('Tracking failed: ' + e.message) }
    setTracking(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 22 }}>
        <SectionTitle eyebrow="Fulfilment" title="Shipments" />
        <Btn variant="ghost" onClick={load}><RefreshCw size={14} /> Refresh</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, marginBottom: 22 }}>
        <KpiCard label="Total" value={rows.length} accent={AC.ink} />
        <KpiCard label="In Transit" value={(counts.in_transit || 0) + (counts.picked_up || 0)} accent={AC.blue} />
        <KpiCard label="Delivered" value={counts.delivered || 0} accent={AC.green} />
        <KpiCard label="Returned" value={counts.returned || 0} accent={AC.red} />
      </div>

      <Panel title="All Shipments" action={
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${AC.line}`, borderRadius: 8, padding: '6px 10px' }}>
          <Search size={14} color={AC.sub} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search tracking / order / name"
            style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: sans, background: 'transparent', width: 200, color: AC.ink }} />
        </div>
      }>
        {loading ? <p style={{ color: AC.sub }}>Loading…</p> : (
          <Table
            empty="No shipments yet. Create one from the Orders tab (📦 Bosta)."
            columns={[
              { label: 'Tracking', render: r => <strong>{r.tracking_number || '—'}</strong> },
              { label: 'Order', render: r => r.order_number },
              { label: 'Customer', render: r => <div>{r.customer}<div style={{ fontSize: 12, color: AC.sub }}>{r.city}</div></div> },
              { label: 'Courier', render: r => <span style={{ textTransform: 'capitalize' }}>{r.courier}</span> },
              { label: 'Status', align: 'center', render: r => <Badge tone={STATUS_TONES[r.status] || 'neutral'}>{r.status}</Badge> },
              { label: 'Created', render: r => new Date(r.created_at).toLocaleDateString() },
              {
                label: 'Action', align: 'center', render: r => r.tracking_number
                  ? <Btn size="sm" variant="ghost" onClick={() => track(r)}>{tracking === r.id ? '…' : <><ExternalLink size={13} /> Track</>}</Btn>
                  : <span style={{ color: AC.sub, fontSize: 12 }}>—</span>
              },
            ]}
            rows={filtered}
          />
        )}
      </Panel>
    </div>
  )
}
