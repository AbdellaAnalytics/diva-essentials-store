// Derives actionable notifications from the dashboard data.
// Categories: new orders, payment reviews, low stock, shipments to action.

const LOW_STOCK_THRESHOLD = 10

export function buildNotifications(data) {
  const orders = data?.orders || []
  const products = data?.products || []
  const notes = []

  // 1) New orders (pending, just placed)
  const newOrders = orders.filter(o => o.status === 'pending')
  newOrders.forEach(o => {
    notes.push({
      id: `order-${o.id}`,
      type: 'order',
      title: 'New order',
      detail: `${o.order_number} · ${o.ship_name || o.customer_name || 'Guest'}`,
      time: o.created_at,
      goto: 'orders',
    })
  })

  // 2) Orders awaiting payment review (InstaPay / Vodafone proof)
  const reviews = orders.filter(o => o.payment_status === 'awaiting_review')
  reviews.forEach(o => {
    notes.push({
      id: `review-${o.id}`,
      type: 'review',
      title: 'Payment needs review',
      detail: `${o.order_number} · ${o.payment_method}`,
      time: o.created_at,
      goto: 'approvals',
    })
  })

  // 3) Low / out-of-stock products
  products.forEach(p => {
    const stock = Number(p.stock ?? 0)
    if (p.is_active !== false && stock <= LOW_STOCK_THRESHOLD) {
      notes.push({
        id: `stock-${p.id}`,
        type: 'stock',
        title: stock <= 0 ? 'Out of stock' : 'Low stock',
        detail: `${p.name} · ${stock} left`,
        time: null,
        goto: 'inventory',
        urgent: stock <= 0,
      })
    }
  })

  // 4) Shipments needing action — orders paid/pending but not yet shipped
  const toShip = orders.filter(o => (o.status === 'paid' || o.status === 'pending'))
  // (only flag if there are real orders; avoids demo noise is handled by caller)
  if (toShip.length) {
    notes.push({
      id: 'ship-batch',
      type: 'shipment',
      title: 'Orders to ship',
      detail: `${toShip.length} order${toShip.length > 1 ? 's' : ''} awaiting shipment`,
      time: null,
      goto: 'orders',
    })
  }

  // newest first where we have a time
  notes.sort((a, b) => {
    if (a.time && b.time) return new Date(b.time) - new Date(a.time)
    if (a.time) return -1
    if (b.time) return 1
    return 0
  })

  return notes
}

export const NOTE_META = {
  order:    { label: 'Orders',    color: '#2f6f4f' },
  review:   { label: 'Payments',  color: '#a8741a' },
  stock:    { label: 'Stock',     color: '#b4471f' },
  shipment: { label: 'Shipping',  color: '#3d5a80' },
}
