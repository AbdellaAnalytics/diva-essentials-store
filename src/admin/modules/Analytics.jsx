import React, { useState, useMemo } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { Download, FileText } from 'lucide-react'
import { AC, serif, Panel, KpiCard, Btn, SectionTitle, CHART_COLORS, Table } from '../ui'
import {
  kpis, periodComparison, revenueSeries, productPerformance, byCategory,
  byPaymentMethod, byCity, fmtEGP,
  visitorKpis, visitorSeries, bySource, byDevice, topPages,
} from '../lib/analytics'
import { exportCSV, exportPDF } from '../lib/exporters'

const tooltipStyle = { background: '#fff', border: `1px solid ${AC.line}`, borderRadius: 8, fontSize: 12, fontFamily: "'Jost',sans-serif" }

export default function Analytics({ data }) {
  const { orders, orderItems, customers } = data
  const [gran, setGran] = useState('day')
  const [range, setRange] = useState(90)

  const k = useMemo(() => kpis(orders, customers, orderItems), [orders, customers, orderItems])
  const cmp = useMemo(() => periodComparison(orders, 30), [orders])
  const series = useMemo(() => revenueSeries(orders, gran, range), [orders, gran, range])
  const products = useMemo(() => productPerformance(orderItems, orders), [orderItems, orders])
  const cats = useMemo(() => byCategory(orderItems, orders), [orderItems, orders])
  const pays = useMemo(() => byPaymentMethod(orders), [orders])
  const cities = useMemo(() => byCity(orders), [orders])

  const exportReport = () => {
    exportPDF({
      title: 'Diva Essentials — Sales Report',
      subtitle: `Generated ${new Date().toLocaleDateString()} · Last ${range} days`,
      kpis: [
        { label: 'Total Revenue', value: fmtEGP(k.revenue) },
        { label: 'Orders', value: k.orderCount },
        { label: 'Avg Order Value', value: fmtEGP(k.aov) },
        { label: 'Repeat Rate', value: k.repeatRate.toFixed(1) + '%' },
      ],
      sections: [
        { title: 'Top Products', columns: ['Product', 'Units', 'Revenue'], rows: products.slice(0, 10).map(p => [p.name, p.units, fmtEGP(p.revenue)]) },
        { title: 'Revenue by Collection', columns: ['Collection', 'Revenue'], rows: cats.map(c => [c.name, fmtEGP(c.value)]) },
        { title: 'Payment Methods', columns: ['Method', 'Orders', 'Revenue'], rows: pays.map(p => [p.name, p.count, fmtEGP(p.value)]) },
        { title: 'Top Cities', columns: ['City', 'Orders', 'Revenue'], rows: cities.slice(0, 10).map(c => [c.name, c.orders, fmtEGP(c.revenue)]) },
      ],
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <SectionTitle eyebrow="Business Intelligence" title="Sales & Revenue Analytics" />
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" size="sm" onClick={() => exportCSV(series.map(s => ({ period: s.label, revenue: s.revenue, orders: s.orders })), 'revenue-series.csv')}><Download size={14} /> CSV</Btn>
          <Btn variant="solid" size="sm" onClick={exportReport}><FileText size={14} /> PDF Report</Btn>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Total Revenue" value={fmtEGP(k.revenue)} delta={cmp.delta} sub="vs prev 30d" accent={AC.gold} />
        <KpiCard label="Orders" value={k.orderCount} sub={`${k.units} units sold`} accent={AC.ink} />
        <KpiCard label="Avg Order Value" value={fmtEGP(k.aov)} accent={AC.goldDeep} />
        <KpiCard label="Repeat Rate" value={k.repeatRate.toFixed(1) + '%'} accent={AC.green} />
        <KpiCard label="Customer LTV" value={fmtEGP(k.clv)} accent={AC.blue} />
      </div>

      {/* Revenue trend */}
      <Panel
        title="Revenue Trend"
        action={
          <div style={{ display: 'flex', gap: 6 }}>
            {[['day', 'Daily'], ['month', 'Monthly']].map(([g, l]) => (
              <Btn key={g} size="sm" variant={gran === g ? 'gold' : 'ghost'} onClick={() => setGran(g)}>{l}</Btn>
            ))}
          </div>
        }
        style={{ marginBottom: 20 }}
      >
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={series} margin={{ left: -10, right: 10, top: 5 }}>
            <defs>
              <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={AC.gold} stopOpacity={0.35} />
                <stop offset="100%" stopColor={AC.gold} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={AC.line} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: AC.sub }} interval="preserveStartEnd" minTickGap={30} />
            <YAxis tick={{ fontSize: 11, fill: AC.sub }} tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => fmtEGP(v)} />
            <Area type="monotone" dataKey="revenue" stroke={AC.gold} strokeWidth={2} fill="url(#gRev)" />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      {/* Orders volume + category split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20, marginBottom: 20 }}>
        <Panel title="Order Volume">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={series} margin={{ left: -15, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={AC.line} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: AC.sub }} interval="preserveStartEnd" minTickGap={30} />
              <YAxis tick={{ fontSize: 11, fill: AC.sub }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="orders" fill={AC.ink} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Revenue by Collection">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={cats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                {cats.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={v => fmtEGP(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* Payment method + city */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20, marginBottom: 20 }}>
        <Panel title="Payment Methods">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={pays} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={AC.line} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: AC.sub }} tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: AC.sub }} width={110} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => fmtEGP(v)} />
              <Bar dataKey="value" fill={AC.gold} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Top Cities by Revenue">
          <Table
            columns={[
              { label: 'City', key: 'name' },
              { label: 'Orders', key: 'orders', align: 'right' },
              { label: 'Revenue', align: 'right', render: r => fmtEGP(r.revenue) },
            ]}
            rows={cities.slice(0, 8)}
          />
        </Panel>
      </div>

      {/* Product leaderboard */}
      <Panel title="Product Performance">
        <Table
          columns={[
            { label: '#', render: (_r) => '', key: '' },
            { label: 'Product', key: 'name' },
            { label: 'Collection', key: 'category' },
            { label: 'Units', key: 'units', align: 'right' },
            { label: 'Revenue', align: 'right', render: r => fmtEGP(r.revenue) },
          ].filter(c => c.label !== '#')}
          rows={products}
        />
      </Panel>

      <VisitorAnalytics data={data} range={range} />
    </div>
  )
}

// ==================== VISITOR ANALYTICS SECTION ====================
function VisitorAnalytics({ data, range }) {
  const visits = data.visits || []
  const orders = data.orders || []

  const vk = useMemo(() => visitorKpis(visits, orders, range), [visits, orders, range])
  const vseries = useMemo(() => visitorSeries(visits, Math.min(range, 60)), [visits, range])
  const sources = useMemo(() => bySource(visits), [visits])
  const devices = useMemo(() => byDevice(visits), [visits])
  const pages = useMemo(() => topPages(visits), [visits])

  const noData = visits.length === 0

  return (
    <>
      <div style={{ marginTop: 34, marginBottom: 8 }}>
        <SectionTitle eyebrow="Traffic" title="Visitor Analytics" />
      </div>

      {noData ? (
        <Panel>
          <p style={{ color: AC.sub, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            No visitor data yet. Once your site is live with the latest code, every page view is recorded here —
            you'll see visitors, traffic sources, devices, top pages, and your visitor-to-order conversion rate.
          </p>
        </Panel>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
            <KpiCard label="Visitors" value={vk.visitors.toLocaleString()} sub={`last ${range}d`} accent={AC.blue} />
            <KpiCard label="Page Views" value={vk.views.toLocaleString()} sub={`${(vk.views / (vk.visitors || 1)).toFixed(1)} per visitor`} accent={AC.ink} />
            <KpiCard label="Orders" value={vk.ordersInRange} sub="from traffic" accent={AC.gold} />
            <KpiCard label="Conversion Rate" value={vk.convRate.toFixed(1) + '%'} sub="visitors → orders" accent={AC.green} />
          </div>

          <Panel title="Visitors & Page Views" style={{ marginBottom: 20 }}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={vseries}>
                <defs>
                  <linearGradient id="gVis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={AC.blue} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={AC.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={AC.line} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="views" name="Page Views" stroke={AC.ink} fill="none" strokeWidth={1.5} />
                <Area type="monotone" dataKey="visitors" name="Visitors" stroke={AC.blue} fill="url(#gVis)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20, marginBottom: 20 }}>
            <Panel title="Traffic Sources">
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={sources} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={e => e.name}>
                    {sources.map((s, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Devices">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={devices}>
                  <CartesianGrid strokeDasharray="3 3" stroke={AC.line} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" name="Visits" radius={[6, 6, 0, 0]}>
                    {devices.map((d, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>

          <Panel title="Top Pages">
            <Table
              columns={[
                { label: 'Page', key: 'path' },
                { label: 'Views', key: 'views', align: 'right' },
              ]}
              rows={pages}
            />
          </Panel>
        </>
      )}
    </>
  )
}
