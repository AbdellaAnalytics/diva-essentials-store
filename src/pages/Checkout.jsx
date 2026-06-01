import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CreditCard, Wallet, Smartphone, Banknote } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import { supabase } from '../lib/supabase'
import { useSettings, computeShipping } from '../lib/useSettings'

const hasSupabase =
  import.meta.env.VITE_SUPABASE_URL &&
  !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_PROJECT')

const PAYMENTS = [
  { id: 'cod',           label: 'Cash on Delivery',     sub: 'Pay when it arrives',             icon: Banknote },
  { id: 'paymob',        label: 'Paymob',               sub: 'Cards & wallets (Egypt)',         icon: Wallet },
  { id: 'instapay',      label: 'InstaPay / Bank',      sub: 'Transfer + upload proof',         icon: Smartphone },
  { id: 'vodafone_cash', label: 'Vodafone Cash',        sub: 'Transfer + upload proof',         icon: Smartphone },
  { id: 'stripe',        label: 'Credit / Debit Card',  sub: 'Visa, Mastercard — via Stripe',  icon: CreditCard },
]

export default function Checkout() {
  const { items, subtotal, clear } = useCart()
  const { money } = useUI()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', notes: '' })
  const [promo, setPromo] = useState('')
  const [applied, setApplied] = useState(null)
  const [method, setMethod] = useState('cod')   // COD is the default
  const [placing, setPlacing] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const discount = applied ? Math.round(subtotal * (applied.pct / 100)) : 0
  const shipping = computeShipping(settings, subtotal - discount, form.city)
  const total = subtotal - discount + shipping
  const minOrder = Number(settings?.min_order) || 0
  const belowMin = minOrder > 0 && subtotal < minOrder

  const applyPromo = () => {
    // DIVA10 hardcoded fallback; real validation hits Supabase promo_codes
    if (promo.trim().toUpperCase() === 'DIVA10') {
      setApplied({ code: 'DIVA10', pct: 10 })
    } else {
      setApplied(null)
      alert('Invalid promo code')
    }
  }

  const placeOrder = async () => {
    if (!form.name || !form.phone || !form.address) {
      alert('Please fill in your name, phone, and address.')
      return
    }
    if (belowMin) {
      alert(`Minimum order is ${money(minOrder)}. Please add more items.`)
      return
    }
    setPlacing(true)
    try {
      const orderNumber = 'DE-' + Date.now().toString().slice(-8)
      const orderRow = {
        order_number: orderNumber,
        status: method === 'cod' ? 'pending' : 'pending',
        payment_method: method,
        payment_status: (method === 'instapay' || method === 'vodafone_cash') ? 'awaiting_review' : 'unpaid',
        subtotal, discount, shipping, total,
        promo_code: applied?.code || null,
        ship_name: form.name, ship_phone: form.phone,
        ship_address: form.address, ship_city: form.city || '',
        email: form.email || null, notes: form.notes || '',
      }

      // Create the order in Supabase (if configured)
      let orderId = null
      if (hasSupabase) {
        const { data, error } = await supabase.from('orders').insert(orderRow).select('id').single()
        if (error) { alert('Could not create order: ' + error.message); setPlacing(false); return }
        orderId = data.id
        // save line items
        if (items.length) {
          await supabase.from('order_items').insert(items.map(i => ({
            order_id: orderId, product_id: typeof i.id === 'number' ? i.id : null,
            name: i.name, price: i.price, quantity: i.qty, line_total: i.price * i.qty,
          })))
        }
      }

      // Route by payment method
      if (method === 'paymob') {
        if (!hasSupabase) { alert('Paymob requires the live database.'); setPlacing(false); return }
        const payType = form.paymob_wallet ? 'wallet' : 'card'
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paymob-init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
          body: JSON.stringify({ order_id: orderId, method: payType, wallet_number: form.phone }),
        })
        const pay = await res.json()
        if (pay.iframe_url) { clear(); window.location.href = pay.iframe_url; return }
        if (pay.redirect_url) { clear(); window.location.href = pay.redirect_url; return }
        alert('Paymob error: ' + (pay.error || 'unknown')); setPlacing(false); return
      }

      // instapay / vodafone -> proof upload; cod -> straight to confirmation
      clear()
      navigate('/confirmation', { state: { orderNumber, method, total, orderId } })
    } catch (e) {
      alert('Something went wrong: ' + e.message)
    } finally {
      setPlacing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="container empty" style={{ padding: '120px 20px' }}>
        Your cart is empty. <Link to="/shop" style={{ color: 'var(--gold)' }}>Continue shopping</Link>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: '50px 24px' }}>
      <div className="section-head" style={{ marginBottom: 40 }}>
        <div className="eyebrow">Almost there</div>
        <h2>Checkout</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 48, alignItems: 'start' }}
           className="checkout-grid">
        {/* LEFT: forms */}
        <div>
          <h3 className="serif" style={{ fontSize: 24, marginBottom: 18 }}>Shipping Details</h3>
          <div className="field"><label>Full Name</label><input value={form.name} onChange={set('name')} /></div>
          <div className="field"><label>Phone</label><input value={form.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" /></div>
          <div className="field"><label>Address</label><input value={form.address} onChange={set('address')} /></div>
          <div className="field"><label>City</label><input value={form.city} onChange={set('city')} /></div>
          <div className="field"><label>Order Notes (optional)</label><textarea rows={2} value={form.notes} onChange={set('notes')} /></div>

          <h3 className="serif" style={{ fontSize: 24, margin: '28px 0 16px' }}>Payment Method</h3>
          {PAYMENTS.map(opt => {
            const Icon = opt.icon
            return (
              <label key={opt.id} className={`pay-opt ${method === opt.id ? 'sel' : ''}`}>
                <input type="radio" name="pay" checked={method === opt.id} onChange={() => setMethod(opt.id)} />
                <Icon size={20} color="var(--gold)" />
                <span style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontWeight: 500 }}>{opt.label}</strong>
                  <span style={{ color: 'var(--sub)', fontSize: 13 }}>{opt.sub}</span>
                </span>
              </label>
            )
          })}
        </div>

        {/* RIGHT: summary */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 26, position: 'sticky', top: 90 }}>
          <h3 className="serif" style={{ fontSize: 22, marginBottom: 16 }}>Order Summary</h3>
          {items.map(i => (
            <div className="foot-row" key={i.id}>
              <span style={{ color: 'var(--sub)' }}>{i.name} × {i.qty}</span>
              <span>{money(i.price * i.qty)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
            <input value={promo} onChange={e => setPromo(e.target.value)} placeholder="Promo code"
                   style={{ flex: 1, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', color: 'var(--cream)' }} />
            <button className="btn btn-ghost" onClick={applyPromo}>Apply</button>
          </div>
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
            <div className="foot-row"><span style={{ color: 'var(--sub)' }}>Subtotal</span><span>{money(subtotal)}</span></div>
            {discount > 0 && <div className="foot-row"><span style={{ color: 'var(--green)' }}>Discount ({applied.code})</span><span style={{ color: 'var(--green)' }}>−{money(discount)}</span></div>}
            <div className="foot-row"><span style={{ color: 'var(--sub)' }}>Shipping</span><span>{shipping === 0 ? 'Free' : money(shipping)}</span></div>
            <div className="foot-row total"><span>Total</span><span>{money(total)}</span></div>
          </div>
          {belowMin && (
            <div style={{ background: 'var(--paper)', border: '1px solid var(--gold)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--gold-deep)', marginTop: 10 }}>
              Minimum order is {money(minOrder)}. Add {money(minOrder - subtotal)} more to check out.
            </div>
          )}
          <button className="btn btn-gold" style={{ width: '100%', marginTop: 10 }} disabled={placing || belowMin} onClick={placeOrder}>
            {placing ? 'Processing…' : `Place Order · ${money(total)}`}
          </button>
          <p style={{ color: 'var(--sub)', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
            Secure checkout · Your details are protected
          </p>
        </div>
      </div>
    </div>
  )
}
