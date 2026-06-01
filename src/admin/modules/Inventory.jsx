import React, { useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Download, AlertTriangle, PackageX, Boxes } from 'lucide-react'
import { AC, Panel, KpiCard, Btn, Badge, Table, SectionTitle } from '../ui'
import { inventoryAnalysis, fmtEGP } from '../lib/analytics'
import { exportCSV } from '../lib/exporters'

const tooltipStyle = { background: '#fff', border: `1px solid ${AC.line}`, borderRadius: 8, fontSize: 12 }

export default function Inventory({ data }) {
  const { products, orderItems, orders } = data
  const [filter, setFilter] = useState('all')
  const inv = useMemo(() => inventoryAnalysis(products, orderItems, orders), [products, orderItems, orders])

  const totalStockValue = inv.reduce((s, p) => s + p.stockValue, 0)
  const lowCount = inv.filter(p => p.status === 'low').length
  const outCount = inv.filter(p => p.status === 'out').length
  const totalUnits = inv.reduce((s, p) => s + p.stock, 0)

  const filtered = filter === 'all' ? inv : inv.filter(p => p.status === filter)
  const topMovers = [...inv].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 8)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <SectionTitle eyebrow="Operations" title="Inventory & Stock Control" />
        <Btn variant="solid" size="sm" onClick={() => exportCSV(inv.map(p => ({ product: p.name, sku: p.sku, category: p.category, stock: p.stock, units_sold: p.unitsSold, stock_value_egp: p.stockValue, status: p.status })), 'inventory.csv')}><Download size={14} /> Export CSV</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Stock Value" value={fmtEGP(totalStockValue)} accent={AC.gold} />
        <KpiCard label="Units in Stock" value={totalUnits} accent={AC.ink} />
        <KpiCard label="Low Stock" value={lowCount} sub="≤ 10 units" accent={AC.goldDeep} />
        <KpiCard label="Out of Stock" value={outCount} accent={AC.red} />
      </div>

      {(lowCount > 0 || outCount > 0) && (
        <div style={{ background: '#fbecd6', border: `1px solid #e9d3a3`, borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={20} color={AC.goldDeep} />
          <span style={{ fontSize: 13.5, color: AC.ink }}>
            {outCount > 0 && <strong>{outCount} product{outCount > 1 ? 's' : ''} out of stock. </strong>}
            {lowCount > 0 && <span>{lowCount} running low — consider restocking soon.</span>}
          </span>
        </div>
      )}

      <Panel title="Units Sold by Product" style={{ marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={topMovers} margin={{ left: -10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={AC.line} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: AC.sub }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11, fill: AC.sub }} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="unitsSold" name="Units sold" fill={AC.gold} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel
        title="Stock Levels"
        action={
          <div style={{ display: 'flex', gap: 6 }}>
            {[['all', 'All'], ['low', 'Low'], ['out', 'Out']].map(([f, l]) => (
              <Btn key={f} size="sm" variant={filter === f ? 'gold' : 'ghost'} onClick={() => setFilter(f)}>{l}</Btn>
            ))}
          </div>
        }
      >
        <Table
          columns={[
            { label: 'Product', key: 'name' },
            { label: 'SKU', key: 'sku' },
            { label: 'Collection', key: 'category' },
            { label: 'Stock', key: 'stock', align: 'right' },
            { label: 'Sold', key: 'unitsSold', align: 'right' },
            { label: 'Turnover', key: 'turnover', align: 'right' },
            { label: 'Stock Value', align: 'right', render: r => fmtEGP(r.stockValue) },
            { label: 'Status', align: 'center', render: r => <Badge tone={r.status === 'out' ? 'danger' : r.status === 'low' ? 'warn' : 'ok'}>{r.status === 'ok' ? 'In stock' : r.status === 'low' ? 'Low' : 'Out'}</Badge> },
          ]}
          rows={filtered}
        />
      </Panel>
    </div>
  )
}
