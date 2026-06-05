import React, { useMemo, useState } from 'react'
import { Check, X, Clock, FileImage } from 'lucide-react'
import { AC, Panel, KpiCard, Btn, Badge, Table, SectionTitle } from '../ui'
import { pendingApprovals, fmtEGP } from '../lib/analytics'
import { format } from 'date-fns'

export default function Approvals({ data, onDecision }) {
  const { orders } = data
  const [decisions, setDecisions] = useState({}) // id -> 'approved' | 'rejected'

  const pending = useMemo(() => pendingApprovals(orders).filter(o => !decisions[o.id]), [orders, decisions])
  const decidedToday = Object.keys(decisions).length
  const pendingValue = pending.reduce((s, o) => s + o.total, 0)

  const decide = (o, decision) => {
    setDecisions(p => ({ ...p, [o.id]: decision }))
    onDecision?.(o.id, decision)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <SectionTitle eyebrow="Operations" title="Order Approvals" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Awaiting Review" value={pending.length} accent={AC.goldDeep} />
        <KpiCard label="Pending Value" value={fmtEGP(pendingValue)} accent={AC.gold} />
        <KpiCard label="Reviewed (session)" value={decidedToday} accent={AC.green} />
      </div>

      <div style={{ background: '#dfe9ef', border: `1px solid #c4d6e0`, borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Clock size={20} color={AC.blue} />
        <span style={{ fontSize: 13.5, color: AC.ink }}>
          New orders, card payments, and transfer (InstaPay / Vodafone) orders appear here for review. Approve once you've confirmed payment or the order details; approved orders move on to fulfillment.
        </span>
      </div>

      <Panel title="Review Queue">
        <Table
          empty="No payments awaiting review 🎉"
          columns={[
            { label: 'Order', key: 'order_number', render: r => <strong>{r.order_number}</strong> },
            { label: 'Customer', key: 'customer_name' },
            { label: 'Type', render: r => {
                const m = r.payment_method
                if (m === 'instapay') return <Badge tone="info">InstaPay transfer</Badge>
                if (m === 'vodafone_cash') return <Badge tone="warn">Vodafone Cash</Badge>
                if (m === 'stripe') return <Badge tone="info">Card — confirm paid</Badge>
                if (m === 'cod') return <Badge tone="neutral">COD — new order</Badge>
                return <Badge tone="neutral">{m || 'new order'}</Badge>
              } },
            { label: 'Amount', align: 'right', render: r => fmtEGP(r.total) },
            { label: 'Submitted', render: r => format(new Date(r.created_at), 'MMM d, HH:mm') },
            { label: 'Proof', align: 'center', render: r => (r.payment_method === 'instapay' || r.payment_method === 'vodafone_cash')
                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: AC.blue, fontSize: 12.5, cursor: 'pointer' }}><FileImage size={15} /> View</span>
                : <span style={{ color: AC.sub, fontSize: 12 }}>—</span> },
            {
              label: 'Decision', align: 'center', render: r => (
                <div style={{ display: 'inline-flex', gap: 6 }}>
                  <Btn size="sm" variant="gold" onClick={() => decide(r, 'approved')}><Check size={14} /> Approve</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => decide(r, 'rejected')} style={{ color: AC.red, borderColor: '#e6c4bc' }}><X size={14} /></Btn>
                </div>
              )
            },
          ]}
          rows={pending}
        />
      </Panel>

      {decidedToday > 0 && (
        <Panel title="Reviewed This Session" style={{ marginTop: 20 }}>
          <Table
            columns={[
              { label: 'Order', render: r => orders.find(o => o.id === r.id)?.order_number },
              { label: 'Decision', align: 'center', render: r => <Badge tone={r.decision === 'approved' ? 'ok' : 'danger'}>{r.decision}</Badge> },
            ]}
            rows={Object.entries(decisions).map(([id, decision]) => ({ id, decision }))}
          />
        </Panel>
      )}
    </div>
  )
}
