// Analytics engine — pure functions that turn raw orders/items/customers
// into the BI metrics the dashboard renders. Kept framework-free and testable.
import { format, startOfMonth, startOfDay, subDays, eachDayOfInterval, eachMonthOfInterval } from 'date-fns'

const EGP = n => `${Math.round(n).toLocaleString()} EGP`
export const fmtEGP = EGP

const isRealized = o => o.status !== 'cancelled' && o.payment_status !== 'refunded'

// ---- Headline KPIs ----
export function kpis(orders, customers, orderItems) {
  const realized = orders.filter(isRealized)
  const revenue = realized.reduce((s, o) => s + o.total, 0)
  const orderCount = realized.length
  const aov = orderCount ? revenue / orderCount : 0
  const units = orderItems.reduce((s, i) => {
    const o = orders.find(x => x.id === i.order_id)
    return o && isRealized(o) ? s + i.quantity : s
  }, 0)

  // repeat customers
  const counts = {}
  realized.forEach(o => { counts[o.customer_id] = (counts[o.customer_id] || 0) + 1 })
  const buyers = Object.keys(counts).length
  const repeat = Object.values(counts).filter(c => c > 1).length
  const repeatRate = buyers ? (repeat / buyers) * 100 : 0

  const cancelled = orders.length - realized.length
  const cancelRate = orders.length ? (cancelled / orders.length) * 100 : 0

  return {
    revenue, orderCount, aov, units,
    customers: customers.length,
    repeatRate, cancelRate,
    clv: buyers ? revenue / buyers : 0,
  }
}

// Compare two windows (e.g. last 30d vs prior 30d) for trend arrows
export function periodComparison(orders, days = 30) {
  const now = new Date()
  const curStart = subDays(now, days)
  const prevStart = subDays(now, days * 2)
  const sum = (from, to) => orders.filter(o => isRealized(o) && new Date(o.created_at) >= from && new Date(o.created_at) < to)
    .reduce((s, o) => s + o.total, 0)
  const cur = sum(curStart, now)
  const prev = sum(prevStart, curStart)
  const delta = prev ? ((cur - prev) / prev) * 100 : 0
  return { cur, prev, delta }
}

// ---- Time series: revenue & orders per day/month ----
export function revenueSeries(orders, granularity = 'day', days = 90) {
  const now = new Date()
  const realized = orders.filter(isRealized)
  if (granularity === 'month') {
    const start = startOfMonth(subDays(now, days * 2))
    const months = eachMonthOfInterval({ start, end: now })
    return months.map(m => {
      const key = format(m, 'yyyy-MM')
      const rows = realized.filter(o => format(new Date(o.created_at), 'yyyy-MM') === key)
      return {
        label: format(m, 'MMM'),
        revenue: rows.reduce((s, o) => s + o.total, 0),
        orders: rows.length,
      }
    })
  }
  const start = subDays(now, days)
  const daysArr = eachDayOfInterval({ start, end: now })
  return daysArr.map(d => {
    const key = format(d, 'yyyy-MM-dd')
    const rows = realized.filter(o => format(new Date(o.created_at), 'yyyy-MM-dd') === key)
    return {
      label: format(d, 'MMM d'),
      revenue: rows.reduce((s, o) => s + o.total, 0),
      orders: rows.length,
    }
  })
}

// ---- Product performance ----
export function productPerformance(orderItems, orders) {
  const realizedIds = new Set(orders.filter(isRealized).map(o => o.id))
  const map = {}
  orderItems.forEach(i => {
    if (!realizedIds.has(i.order_id)) return
    const k = i.name
    if (!map[k]) map[k] = { name: i.name, category: i.category, units: 0, revenue: 0 }
    map[k].units += i.quantity
    map[k].revenue += i.line_total
  })
  return Object.values(map).sort((a, b) => b.revenue - a.revenue)
}

// ---- Revenue by category / collection ----
export function byCategory(orderItems, orders) {
  const realizedIds = new Set(orders.filter(isRealized).map(o => o.id))
  const map = {}
  orderItems.forEach(i => {
    if (!realizedIds.has(i.order_id)) return
    const k = i.category || 'Uncategorized'
    map[k] = (map[k] || 0) + i.line_total
  })
  return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

// ---- Payment method split ----
export function byPaymentMethod(orders) {
  const labels = { stripe: 'Card (Stripe)', paymob: 'Paymob', instapay: 'InstaPay', vodafone_cash: 'Vodafone Cash', cod: 'Cash on Delivery' }
  const map = {}
  orders.filter(isRealized).forEach(o => {
    const k = labels[o.payment_method] || o.payment_method
    if (!map[k]) map[k] = { name: k, value: 0, count: 0 }
    map[k].value += o.total
    map[k].count += 1
  })
  return Object.values(map).sort((a, b) => b.value - a.value)
}

// ---- Geographic (by city) ----
export function byCity(orders) {
  const map = {}
  orders.filter(isRealized).forEach(o => {
    const k = o.city || '—'
    if (!map[k]) map[k] = { name: k, revenue: 0, orders: 0 }
    map[k].revenue += o.total
    map[k].orders += 1
  })
  return Object.values(map).sort((a, b) => b.revenue - a.revenue)
}

// ---- Order status breakdown ----
export function statusBreakdown(orders) {
  const map = {}
  orders.forEach(o => { map[o.status] = (map[o.status] || 0) + 1 })
  return Object.entries(map).map(([name, value]) => ({ name, value }))
}

// ---- Inventory analysis ----
export function inventoryAnalysis(products, orderItems, orders) {
  const realizedIds = new Set(orders.filter(isRealized).map(o => o.id))
  const sold = {}
  orderItems.forEach(i => { if (realizedIds.has(i.order_id)) sold[i.name] = (sold[i.name] || 0) + i.quantity })
  return products.map(p => {
    const unitsSold = sold[p.name] || 0
    const stock = p.stock ?? 0
    const status = stock <= 0 ? 'out' : stock <= 10 ? 'low' : 'ok'
    return {
      name: p.name, sku: p.sku, category: p.category_name,
      stock, unitsSold, price: p.price,
      stockValue: stock * p.price,
      status,
      // simple turnover proxy: sold relative to current stock
      turnover: stock ? +(unitsSold / stock).toFixed(2) : unitsSold,
    }
  }).sort((a, b) => b.unitsSold - a.unitsSold)
}

// ---- Customer segments & top customers ----
export function customerInsights(orders, customers) {
  const realized = orders.filter(isRealized)
  const stats = {}
  realized.forEach(o => {
    if (!stats[o.customer_id]) stats[o.customer_id] = { id: o.customer_id, name: o.customer_name, city: o.city, orders: 0, spent: 0, last: o.created_at }
    const s = stats[o.customer_id]
    s.orders += 1; s.spent += o.total
    if (new Date(o.created_at) > new Date(s.last)) s.last = o.created_at
  })
  const list = Object.values(stats).sort((a, b) => b.spent - a.spent)
  const now = new Date()
  const segments = { vip: 0, repeat: 0, oneTime: 0, atRisk: 0 }
  list.forEach(c => {
    if (c.spent >= 2000) segments.vip += 1
    if (c.orders > 1) segments.repeat += 1; else segments.oneTime += 1
    const daysSince = (now - new Date(c.last)) / 864e5
    if (daysSince > 90 && c.orders > 1) segments.atRisk += 1
  })
  return { top: list, segments, totalBuyers: list.length }
}

// ---- New customers per month (acquisition) ----
export function acquisitionSeries(customers) {
  const now = new Date()
  const start = startOfMonth(subDays(now, 365))
  const months = eachMonthOfInterval({ start, end: now })
  return months.map(m => {
    const key = format(m, 'yyyy-MM')
    const n = customers.filter(c => c.created_at && format(new Date(c.created_at), 'yyyy-MM') === key).length
    return { label: format(m, 'MMM'), customers: n }
  })
}

// ---- Pending payment proofs (approvals queue) ----
export function pendingApprovals(orders) {
  return orders.filter(o => {
    // 1) Transfer orders awaiting proof review (InstaPay / Vodafone)
    const isTransfer = (o.payment_method === 'instapay' || o.payment_method === 'vodafone_cash')
    // 2) Card orders (Stripe) where payment isn't confirmed yet
    const isCardUnpaid = o.payment_method === 'stripe' && o.payment_status !== 'paid'
    // 3) Any brand-new order still pending (not yet approved/shipped/cancelled)
    const isNewPending = o.status === 'pending' && !o.approved
    return isTransfer || isCardUnpaid || isNewPending
  })
}

// ==================== VISITOR ANALYTICS ====================

// Group visits into daily counts of views + unique sessions.
export function visitorSeries(visits = [], days = 30) {
  const now = new Date()
  const buckets = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    buckets[key] = { date: key, views: 0, sessions: new Set() }
  }
  visits.forEach(v => {
    const key = (v.created_at || '').slice(0, 10)
    if (buckets[key]) { buckets[key].views++; buckets[key].sessions.add(v.session_id) }
  })
  return Object.values(buckets).map(b => ({ date: b.date, views: b.views, visitors: b.sessions.size }))
}

// Totals for a period (in days).
export function visitorKpis(visits = [], orders = [], days = 30) {
  const cutoff = Date.now() - days * 864e5
  const inRange = visits.filter(v => new Date(v.created_at).getTime() >= cutoff)
  const sessions = new Set(inRange.map(v => v.session_id))
  const views = inRange.length
  const visitors = sessions.size
  // conversion = orders in range / unique visitors
  const ordersInRange = orders.filter(o => new Date(o.created_at).getTime() >= cutoff).length
  const convRate = visitors ? (ordersInRange / visitors) * 100 : 0
  return { views, visitors, ordersInRange, convRate }
}

// Breakdown helpers → [{ name, value }]
export function bySource(visits = []) {
  const m = {}
  visits.forEach(v => { const s = v.source || 'direct'; m[s] = (m[s] || 0) + 1 })
  return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}
export function byDevice(visits = []) {
  const m = {}
  visits.forEach(v => { const d = v.device || 'desktop'; m[d] = (m[d] || 0) + 1 })
  return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}
export function topPages(visits = [], n = 8) {
  const m = {}
  visits.forEach(v => { const p = v.path || '/'; m[p] = (m[p] || 0) + 1 })
  return Object.entries(m).map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views).slice(0, n)
}
