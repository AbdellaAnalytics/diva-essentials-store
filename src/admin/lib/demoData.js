// Demo dataset generator — produces realistic orders, customers, and order
// items so the BI dashboard is fully populated before real Supabase data
// exists. Once Supabase has real data, the loader uses that instead.
import { FALLBACK_PRODUCTS } from '../../lib/fallback'

const CITIES = ['Cairo', 'Giza', 'Alexandria', 'Mansoura', 'Tanta', 'Port Said', 'Suez', '6th October', 'Sheikh Zayed', 'Nasr City']
const NAMES = ['Mariam Hassan','Youssef Ali','Nour Ibrahim','Omar Khaled','Salma Adel','Ahmed Mostafa','Hana Tarek','Karim Sayed','Layla Fouad','Mohamed Reda','Farida Samir','Tarek Nabil','Dina Ashraf','Hassan Gamal','Yara Magdy','Amr Sherif','Rana Wael','Mostafa Hany','Aya Ezzat','Khaled Fathy']
const METHODS = ['stripe', 'paymob', 'instapay', 'vodafone_cash', 'cod']
const STATUSES = ['delivered', 'delivered', 'delivered', 'shipped', 'paid', 'pending', 'cancelled']

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a }

// Seeded-ish randomness so the demo is stable within a session
let seed = 42
function rng() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
function pick(arr) { return arr[Math.floor(rng() * arr.length)] }
function pint(a, b) { return Math.floor(rng() * (b - a + 1)) + a }

export function generateDemoData() {
  const products = FALLBACK_PRODUCTS
  const now = new Date()
  const customers = []
  const orders = []
  const orderItems = []

  // Build a pool of customers
  const customerPool = NAMES.map((name, i) => ({
    id: `cust-${i + 1}`,
    full_name: name,
    email: name.toLowerCase().replace(/\s+/g, '.') + '@example.com',
    phone: '01' + pint(0, 2) + String(pint(10000000, 99999999)),
    city: pick(CITIES),
    created_at: new Date(now.getTime() - pint(1, 300) * 864e5).toISOString(),
    orderCount: 0,
    totalSpent: 0,
  }))

  // Generate ~180 orders across the last 180 days (denser recently)
  const ORDER_COUNT = 180
  for (let i = 0; i < ORDER_COUNT; i++) {
    // bias toward recent dates
    const daysAgo = Math.floor(Math.pow(rng(), 1.6) * 180)
    const created = new Date(now.getTime() - daysAgo * 864e5)
    const customer = pick(customerPool)
    const status = pick(STATUSES)
    const method = pick(METHODS)

    // 1-4 line items
    const lineCount = pint(1, 4)
    const items = []
    let subtotal = 0
    const used = new Set()
    for (let j = 0; j < lineCount; j++) {
      const product = pick(products)
      if (used.has(product.id)) continue
      used.add(product.id)
      const qty = pint(1, 3)
      const line = product.price * qty
      subtotal += line
      items.push({ product, qty, line })
    }
    if (!items.length) continue

    const discountPct = rng() < 0.3 ? 10 : 0
    const discount = Math.round(subtotal * discountPct / 100)
    const shipping = subtotal - discount >= 2000 ? 0 : 60
    const total = subtotal - discount + shipping

    const orderId = `ord-${i + 1}`
    orders.push({
      id: orderId,
      order_number: 'DE-' + String(100000 + i),
      customer_id: customer.id,
      customer_name: customer.full_name,
      city: customer.city,
      status,
      payment_method: method,
      payment_status: status === 'cancelled' ? 'refunded' : (status === 'pending' ? 'unpaid' : 'paid'),
      subtotal, discount, shipping, total,
      promo_code: discountPct ? 'DIVA10' : null,
      created_at: created.toISOString(),
    })

    items.forEach(it => {
      orderItems.push({
        order_id: orderId,
        product_id: it.product.id,
        name: it.product.name,
        category: it.product.category_name,
        price: it.product.price,
        quantity: it.qty,
        line_total: it.line,
        created_at: created.toISOString(),
      })
    })

    if (status !== 'cancelled') {
      customer.orderCount += 1
      customer.totalSpent += total
    }
  }

  customerPool.forEach(c => customers.push(c))

  return { products, customers, orders, orderItems }
}
