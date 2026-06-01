import React, { useMemo } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { ArrowUpRight, Package, Users, ClipboardCheck, TrendingUp } from 'lucide-react'
import { AC, Panel, KpiCard, Badge, Table, SectionTitle, serif } from '../ui'
import { kpis, periodComparison, revenueSeries, productPerformance, inventoryAnalysis, pendingApprovals, fmtEGP } from '../lib/analytics'
import { format } from 'date-fns'

const tooltipStyle = { background: '#fff', border: `1px solid ${AC.line}`, borderRadius: 8, fontSize: 12 }

export default function Overview({ data, goto }) {
  const { orders, orderItems, customers, products } = data
  const k = useMemo(() => kpis(orders, customers, orderItems), [orders, customers, orderItems])
  const cmp = useMemo(() => periodComparison(orders, 30), [orders])
  const series = useMemo(() => revenueSeries(orders, 'day', 30), [orders])
  const topProducts = useMemo(() => productPerformance(orderItems, orders).slice(0, 5), [orderItems, orders])
  const inv = useMemo(() => inventoryAnalysis(products, orderItems, orders), [products, orderItems, orders])
  const lowStock = inv.filter(p => p.status !== 'ok')
  const approvals = useMemo(() => pendingApprovals(orders), [orders])
  const recent = useMemo(() => [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6), [orders])

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <SectionTitle eyebrow="Dashboard" title="Overview" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Revenue (30d)" value={fmtEGP(cmp.cur)} delta={cmp.delta} sub="vs prev 30d" accent={AC.gold} />
        <KpiCard label="Total Orders" value={k.orderCount} accent={AC.ink} />
        <KpiCard label="Avg Order Value" value={fmtEGP(k.aov)} accent={AC.goldDeep} />
        <KpiCard label="Customers" value={k.customers} accent={AC.blue} />
      </div>

      <Panel title="Revenue — Last 30 Days" style={{ marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={series} margin={{ left: -10, right: 10, top: 5 }}>
            <defs>
              <linearGradient id="ovRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={AC.gold} stopOpacity={0.35} />
                <stop offset="100%" stopColor={AC.gold} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={AC.line} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: AC.sub }} interval="preserveStartEnd" minTickGap={28} />
            <YAxis tick={{ fontSize: 11, fill: AC.sub }} tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => fmtEGP(v)} />
            <Area type="monotone" dataKey="revenue" stroke={AC.gold} strokeWidth={2} fill="url(#ovRev)" />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20, marginBottom: 20 }}>
        {/* action items */}
        <Panel title="Needs Attention">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ActionRow icon={ClipboardCheck} tone="info" label={`${approvals.length} payment${approvals.length !== 1 ? 's' : ''} awaiting approval`} onClick={() => goto('approvals')} />
            <ActionRow icon={Package} tone={lowStock.length ? 'warn' : 'ok'} label={lowStock.length ? `${lowStock.length} product${lowStock.length !== 1 ? 's' : ''} low / out of stock` : 'Stock levels healthy'} onClick={() => goto('inventory')} />
            <ActionRow icon={TrendingUp} tone={cmp.delta >= 0 ? 'ok' : 'danger'} label={`Revenue ${cmp.delta >= 0 ? 'up' : 'down'} ${Math.abs(cmp.delta).toFixed(1)}% vs last month`} onClick={() => goto('analytics')} />
          </div>
        </Panel>

        {/* top products */}
        <Panel title="Top Products" action={<span style={{ fontSize: 12, color: AC.goldDeep, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }} onClick={() => goto('analytics')}>View all <ArrowUpRight size={13} /></span>}>
          <Table
            columns={[
              { label: 'Product', key: 'name' },
              { label: 'Units', key: 'units', align: 'right' },
              { label: 'Revenue', align: 'right', render: r => fmtEGP(r.revenue) },
            ]}
            rows={topProducts}
          />
        </Panel>
      </div>

      <Panel title="Recent Orders" action={<span style={{ fontSize: 12, color: AC.goldDeep, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }} onClick={() => goto('orders')}>All orders <ArrowUpRight size={13} /></span>}>
        <Table
          columns={[
            { label: 'Order', key: 'order_number', render: r => <strong>{r.order_number}</strong> },
            { label: 'Customer', key: 'customer_name' },
            { label: 'Total', align: 'right', render: r => fmtEGP(r.total) },
            { label: 'Date', render: r => format(new Date(r.created_at), 'MMM d') },
            { label: 'Status', align: 'center', render: r => <Badge tone={{ pending: 'warn', paid: 'info', shipped: 'info', delivered: 'ok', cancelled: 'danger' }[r.status]}>{r.status}</Badge> },
          ]}
          rows={recent}
        />
      </Panel>
    </div>
  )
}

function ActionRow({ icon: Icon, label, tone, onClick }) {
  const c = { ok: AC.green, warn: AC.goldDeep, danger: AC.red, info: AC.blue }[tone] || AC.sub
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1px solid ${AC.line}`, borderRadius: 10, cursor: 'pointer', transition: 'background .2s' }}
      onMouseEnter={e => e.currentTarget.style.background = AC.bg} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: AC.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={17} color={c} /></div>
      <span style={{ fontSize: 13.5, color: AC.ink, flex: 1 }}>{label}</span>
      <ArrowUpRight size={15} color={AC.sub} />
    </div>
  )
}
