import React, { useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { AC, Panel, KpiCard, Btn, Badge, Table, SectionTitle } from '../ui'
import { fmtEGP } from '../lib/analytics'
import { exportCSV } from '../lib/exporters'
import { format } from 'date-fns'

const STATUS_TONES = { pending: 'warn', paid: 'info', approved: 'info', shipped: 'info', delivered: 'ok', cancelled: 'danger', failed: 'danger', amount_mismatch: 'danger' }
const STATUS_FLOW = ['pending', 'paid', 'shipped', 'delivered']

// Color the Bosta shipment status badge
function bostaTone(state = '') {
  const s = state.toLowerCase()
  if (s.includes('delivered')) return 'ok'
  if (s.includes('return') || s.includes('lost') || s.includes('damage') || s.includes('exception')) return 'danger'
  if (s.includes('transit') || s.includes('out for')) return 'info'
  return 'warn'  // pending / picked up
}

export default function Orders({ data, onUpdate }) {
  const { orders } = data
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [local, setLocal] = useState({}) // optimistic status overrides

  const merged = useMemo(() => orders.map(o => ({ ...o, status: local[o.id] || o.status })), [orders, local])

  const filtered = useMemo(() => {
    return merged
      .filter(o => status === 'all' || o.status === status)
      .filter(o => !q || o.order_number.toLowerCase().includes(q.toLowerCase()) || (o.customer_name || '').toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [merged, status, q])

  const advance = (o) => {
    const idx = STATUS_FLOW.indexOf(o.status)
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) {
      const next = STATUS_FLOW[idx + 1]
      setLocal(p => ({ ...p, [o.id]: next }))
      onUpdate?.(o.id, next)
    }
  }

  const createShipment = async (o) => {
    if (!confirm(`Create a Bosta shipment for order ${o.order_number}?`)) return
    try {
      // COD amount: collect the total only if it's a cash order; 0 if already paid online
      const codAmount = (o.payment_method === 'cod') ? Number(o.total || 0) : 0
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bosta-ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          orderNumber: o.order_number,
          name: o.ship_name || o.customer_name || '',
          phone: o.ship_phone || '',
          email: o.email || '',
          city: o.ship_city || (o.city !== '—' ? o.city : '') || '',
          address: o.ship_address || '',
          notes: o.notes || '',
          cod: codAmount,
        }),
      })
      const r = await res.json()
      if (r.ok && r.trackingNumber) {
        alert(`Shipment created ✓\nTracking: ${r.trackingNumber}`)
        setLocal(p => ({ ...p, [o.id]: 'shipped' }))
      } else {
        alert('Bosta error: ' + (r.error || JSON.stringify(r)))
      }
    } catch (e) { alert('Failed: ' + e.message) }
  }

  const counts = useMemo(() => {
    const c = { all: merged.length }
    merged.forEach(o => { c[o.status] = (c[o.status] || 0) + 1 })
    return c
  }, [merged])

  const pendingRev = merged.filter(o => o.status === 'pending').reduce((s, o) => s + o.total, 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <SectionTitle eyebrow="Operations" title="Orders & Fulfillment" />
        <Btn variant="solid" size="sm" onClick={() => exportCSV(filtered.map(o => ({ order: o.order_number, customer: o.customer_name, city: o.city, status: o.status, payment: o.payment_method, total_egp: o.total, date: o.created_at })), 'orders.csv')}><Download size={14} /> Export CSV</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Total Orders" value={counts.all} accent={AC.ink} />
        <KpiCard label="Pending" value={counts.pending || 0} accent={AC.goldDeep} />
        <KpiCard label="Shipped" value={counts.shipped || 0} accent={AC.blue} />
        <KpiCard label="Delivered" value={counts.delivered || 0} accent={AC.green} />
        <KpiCard label="Pending Revenue" value={fmtEGP(pendingRev)} accent={AC.gold} />
      </div>

      <Panel
        title="All Orders"
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: AC.bg, border: `1px solid ${AC.line}`, borderRadius: 8, padding: '6px 10px' }}>
              <Search size={14} color={AC.sub} />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search order / customer" style={{ border: 'none', background: 'transparent', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: 170 }} />
            </div>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ border: `1px solid ${AC.line}`, borderRadius: 8, padding: '7px 10px', fontSize: 13, background: '#fff', fontFamily: 'inherit' }}>
              {['all', 'pending', 'paid', 'approved', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)} {s !== 'all' ? `(${counts[s] || 0})` : ''}</option>)}
            </select>
          </div>
        }
      >
        <Table
          columns={[
            { label: 'Order', key: 'order_number', render: r => <strong>{r.order_number}</strong> },
            { label: 'Customer', key: 'customer_name' },
            { label: 'City', key: 'city' },
            { label: 'Payment', render: r => <Badge tone="neutral">{labelPay(r.payment_method)}</Badge> },
            { label: 'Total', align: 'right', render: r => fmtEGP(r.total) },
            { label: 'Date', render: r => format(new Date(r.created_at), 'MMM d') },
            { label: 'Status', align: 'center', render: r => <Badge tone={STATUS_TONES[r.status]}>{r.status}</Badge> },
            { label: 'Shipment', align: 'center', render: r => r.bosta_state
                ? <Badge tone={bostaTone(r.bosta_state)}>{r.bosta_state}{r.bosta_tracking_number ? '' : ''}</Badge>
                : <span style={{ color: AC.sub, fontSize: 12 }}>—</span> },
            {
              label: 'Action', align: 'center', render: r => {
                const idx = STATUS_FLOW.indexOf(r.status)
                return (
                  <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    {(r.status === 'paid' || r.status === 'pending') && (
                      <Btn size="sm" variant="ghost" onClick={() => createShipment(r)}>📦 Bosta</Btn>
                    )}
                    {idx >= 0 && idx < STATUS_FLOW.length - 1 && (
                      <Btn size="sm" variant="ghost" onClick={() => advance(r)}>→ {STATUS_FLOW[idx + 1]}</Btn>
                    )}
                    {idx === STATUS_FLOW.length - 1 && <span style={{ color: AC.sub, fontSize: 12 }}>—</span>}
                  </div>
                )
              }
            },
          ]}
          rows={filtered}
        />
      </Panel>
    </div>
  )
}

function labelPay(m) {
  return { stripe: 'Card', paymob: 'Paymob', instapay: 'InstaPay', vodafone_cash: 'Vodafone', cod: 'COD' }[m] || m
}
