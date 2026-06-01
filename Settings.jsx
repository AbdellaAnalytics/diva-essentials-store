import React, { useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts'
import { Download, Crown, Repeat, UserPlus, UserMinus } from 'lucide-react'
import { AC, Panel, KpiCard, Btn, Badge, Table, SectionTitle, CHART_COLORS } from '../ui'
import { customerInsights, acquisitionSeries, kpis, fmtEGP } from '../lib/analytics'
import { exportCSV } from '../lib/exporters'
import { format } from 'date-fns'

const tooltipStyle = { background: '#fff', border: `1px solid ${AC.line}`, borderRadius: 8, fontSize: 12 }

export default function Customers({ data }) {
  const { orders, customers } = data
  const insights = useMemo(() => customerInsights(orders, customers), [orders, customers])
  const acq = useMemo(() => acquisitionSeries(customers), [customers])
  const k = useMemo(() => kpis(orders, customers, data.orderItems), [orders, customers, data.orderItems])

  const seg = insights.segments
  const segData = [
    { name: 'VIP (2000+ EGP)', value: seg.vip },
    { name: 'Repeat', value: seg.repeat },
    { name: 'One-time', value: seg.oneTime },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <SectionTitle eyebrow="Insights" title="Customer Intelligence" />
        <Btn variant="solid" size="sm" onClick={() => exportCSV(insights.top.map(c => ({ customer: c.name, city: c.city, orders: c.orders, total_spent_egp: Math.round(c.spent), last_order: c.last })), 'customers.csv')}><Download size={14} /> Export CSV</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Total Buyers" value={insights.totalBuyers} accent={AC.ink} />
        <KpiCard label="VIP Customers" value={seg.vip} sub="≥ 2000 EGP" accent={AC.gold} />
        <KpiCard label="Repeat Buyers" value={seg.repeat} sub={`${k.repeatRate.toFixed(0)}% rate`} accent={AC.green} />
        <KpiCard label="At Risk" value={seg.atRisk} sub=">90d inactive" accent={AC.red} />
        <KpiCard label="Avg LTV" value={fmtEGP(k.clv)} accent={AC.blue} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20, marginBottom: 20 }}>
        <Panel title="New Customers (12 mo)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={acq} margin={{ left: -15, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={AC.line} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: AC.sub }} />
              <YAxis tick={{ fontSize: 11, fill: AC.sub }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="customers" stroke={AC.gold} strokeWidth={2.5} dot={{ r: 3, fill: AC.gold }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Customer Segments">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={segData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                {segData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="Top Customers by Spend">
        <Table
          columns={[
            { label: 'Customer', key: 'name', render: r => <strong>{r.name}</strong> },
            { label: 'City', key: 'city' },
            { label: 'Orders', key: 'orders', align: 'right' },
            { label: 'Total Spent', align: 'right', render: r => fmtEGP(r.spent) },
            { label: 'Avg / Order', align: 'right', render: r => fmtEGP(r.spent / r.orders) },
            { label: 'Last Order', render: r => format(new Date(r.last), 'MMM d, yyyy') },
            { label: 'Tier', align: 'center', render: r => r.spent >= 2000 ? <Badge tone="warn">VIP</Badge> : r.orders > 1 ? <Badge tone="ok">Repeat</Badge> : <Badge tone="neutral">New</Badge> },
          ]}
          rows={insights.top.slice(0, 25)}
        />
      </Panel>
    </div>
  )
}
