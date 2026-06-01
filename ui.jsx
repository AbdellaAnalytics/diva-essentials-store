import React, { useMemo, useState } from 'react'
import { FileText, Download, Calendar, Mail, Check } from 'lucide-react'
import { AC, Panel, Btn, Badge, SectionTitle, serif } from '../ui'
import {
  kpis, productPerformance, byCategory, byPaymentMethod, byCity,
  inventoryAnalysis, customerInsights, fmtEGP,
} from '../lib/analytics'
import { exportCSV, exportPDF } from '../lib/exporters'

export default function Reports({ data }) {
  const { orders, orderItems, customers, products } = data
  const [schedule, setSchedule] = useState({ daily: false, weekly: true, monthly: true })
  const [email, setEmail] = useState('Mohamed.abdullah969@gmail.com')
  const [saved, setSaved] = useState(false)

  const k = useMemo(() => kpis(orders, customers, orderItems), [orders, customers, orderItems])
  const prods = useMemo(() => productPerformance(orderItems, orders), [orderItems, orders])
  const cats = useMemo(() => byCategory(orderItems, orders), [orderItems, orders])
  const pays = useMemo(() => byPaymentMethod(orders), [orders])
  const cities = useMemo(() => byCity(orders), [orders])
  const inv = useMemo(() => inventoryAnalysis(products, orderItems, orders), [products, orderItems, orders])
  const cust = useMemo(() => customerInsights(orders, customers), [orders, customers])

  const fullPDF = () => exportPDF({
    title: 'Diva Essentials — Full Business Report',
    subtitle: `Generated ${new Date().toLocaleString()}`,
    kpis: [
      { label: 'Total Revenue', value: fmtEGP(k.revenue) },
      { label: 'Orders', value: k.orderCount },
      { label: 'Avg Order Value', value: fmtEGP(k.aov) },
      { label: 'Units Sold', value: k.units },
      { label: 'Customers', value: k.customers },
      { label: 'Repeat Rate', value: k.repeatRate.toFixed(1) + '%' },
    ],
    sections: [
      { title: 'Product Performance', columns: ['Product', 'Units', 'Revenue'], rows: prods.map(p => [p.name, p.units, fmtEGP(p.revenue)]) },
      { title: 'Revenue by Collection', columns: ['Collection', 'Revenue'], rows: cats.map(c => [c.name, fmtEGP(c.value)]) },
      { title: 'Payment Methods', columns: ['Method', 'Orders', 'Revenue'], rows: pays.map(p => [p.name, p.count, fmtEGP(p.value)]) },
      { title: 'Sales by City', columns: ['City', 'Orders', 'Revenue'], rows: cities.map(c => [c.name, c.orders, fmtEGP(c.revenue)]) },
      { title: 'Inventory', columns: ['Product', 'Stock', 'Sold', 'Status'], rows: inv.map(p => [p.name, p.stock, p.unitsSold, p.status]) },
      { title: 'Top Customers', columns: ['Customer', 'Orders', 'Spent'], rows: cust.top.slice(0, 15).map(c => [c.name, c.orders, fmtEGP(c.spent)]) },
    ],
  })

  const reports = [
    { name: 'Sales Report', desc: 'Revenue, AOV, top products, collections', pdf: () => exportPDF({ title: 'Diva Essentials — Sales Report', kpis: [{ label: 'Revenue', value: fmtEGP(k.revenue) }, { label: 'Orders', value: k.orderCount }, { label: 'AOV', value: fmtEGP(k.aov) }, { label: 'Units', value: k.units }], sections: [{ title: 'Top Products', columns: ['Product', 'Units', 'Revenue'], rows: prods.map(p => [p.name, p.units, fmtEGP(p.revenue)]) }, { title: 'By Collection', columns: ['Collection', 'Revenue'], rows: cats.map(c => [c.name, fmtEGP(c.value)]) }] }), csv: () => exportCSV(prods.map(p => ({ product: p.name, units: p.units, revenue_egp: Math.round(p.revenue) })), 'sales-report.csv') },
    { name: 'Inventory Report', desc: 'Stock levels, value, turnover, alerts', pdf: () => exportPDF({ title: 'Diva Essentials — Inventory Report', sections: [{ title: 'Inventory', columns: ['Product', 'SKU', 'Stock', 'Sold', 'Status'], rows: inv.map(p => [p.name, p.sku, p.stock, p.unitsSold, p.status]) }] }), csv: () => exportCSV(inv.map(p => ({ product: p.name, sku: p.sku, stock: p.stock, sold: p.unitsSold, value_egp: p.stockValue, status: p.status })), 'inventory-report.csv') },
    { name: 'Customer Report', desc: 'Segments, top spenders, retention', pdf: () => exportPDF({ title: 'Diva Essentials — Customer Report', kpis: [{ label: 'Buyers', value: cust.totalBuyers }, { label: 'VIP', value: cust.segments.vip }, { label: 'Repeat', value: cust.segments.repeat }, { label: 'At Risk', value: cust.segments.atRisk }], sections: [{ title: 'Top Customers', columns: ['Customer', 'City', 'Orders', 'Spent'], rows: cust.top.slice(0, 25).map(c => [c.name, c.city, c.orders, fmtEGP(c.spent)]) }] }), csv: () => exportCSV(cust.top.map(c => ({ customer: c.name, city: c.city, orders: c.orders, spent_egp: Math.round(c.spent) })), 'customer-report.csv') },
    { name: 'Financial Summary', desc: 'Revenue, payment split, geography', pdf: () => exportPDF({ title: 'Diva Essentials — Financial Summary', kpis: [{ label: 'Revenue', value: fmtEGP(k.revenue) }, { label: 'AOV', value: fmtEGP(k.aov) }, { label: 'LTV', value: fmtEGP(k.clv) }], sections: [{ title: 'Payment Methods', columns: ['Method', 'Orders', 'Revenue'], rows: pays.map(p => [p.name, p.count, fmtEGP(p.value)]) }, { title: 'By City', columns: ['City', 'Orders', 'Revenue'], rows: cities.map(c => [c.name, c.orders, fmtEGP(c.revenue)]) }] }), csv: () => exportCSV(pays.map(p => ({ method: p.name, orders: p.count, revenue_egp: Math.round(p.value) })), 'financial-summary.csv') },
  ]

  const saveSchedule = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <SectionTitle eyebrow="Reporting" title="Reports & Exports" />
        <Btn variant="solid" onClick={fullPDF}><FileText size={15} /> Full Business Report (PDF)</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 24 }}>
        {reports.map(r => (
          <Panel key={r.name}>
            <h3 style={{ fontFamily: serif, fontSize: 19, fontWeight: 500, color: AC.ink, margin: '0 0 6px' }}>{r.name}</h3>
            <p style={{ fontSize: 13, color: AC.sub, margin: '0 0 16px', lineHeight: 1.5 }}>{r.desc}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="gold" size="sm" onClick={r.pdf}><FileText size={13} /> PDF</Btn>
              <Btn variant="ghost" size="sm" onClick={r.csv}><Download size={13} /> CSV</Btn>
            </div>
          </Panel>
        ))}
      </div>

      <Panel title="Scheduled Summaries">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, color: AC.sub, fontSize: 13.5 }}>
          <Calendar size={17} color={AC.goldDeep} />
          Automatically email business summaries on a schedule.
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          {[['daily', 'Daily digest'], ['weekly', 'Weekly summary'], ['monthly', 'Monthly report']].map(([key, label]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: `1px solid ${schedule[key] ? AC.gold : AC.line}`, borderRadius: 10, cursor: 'pointer', background: schedule[key] ? '#fbf6ea' : '#fff' }}>
              <input type="checkbox" checked={schedule[key]} onChange={e => setSchedule(s => ({ ...s, [key]: e.target.checked }))} style={{ accentColor: AC.gold, width: 16, height: 16 }} />
              <span style={{ fontSize: 14, color: AC.ink }}>{label}</span>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: AC.bg, border: `1px solid ${AC.line}`, borderRadius: 9, padding: '9px 12px', flex: 1, minWidth: 240 }}>
            <Mail size={15} color={AC.sub} />
            <input value={email} onChange={e => setEmail(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', flex: 1 }} />
          </div>
          <Btn variant="solid" onClick={saveSchedule}>{saved ? <><Check size={14} /> Saved</> : 'Save Schedule'}</Btn>
        </div>

        <p style={{ fontSize: 12, color: AC.sub, marginTop: 14, lineHeight: 1.5 }}>
          Delivery runs via a Supabase scheduled Edge Function (pg_cron) — included as <code style={{ background: AC.bg, padding: '1px 5px', borderRadius: 4 }}>supabase/functions/scheduled-reports</code> in the project. Configure the cron interval and email provider key on deploy.
        </p>
      </Panel>
    </div>
  )
}
