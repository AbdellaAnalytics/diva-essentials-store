import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CreditCard, Wallet, Smartphone, Banknote } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import { useLang } from '../context/LangContext'
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
  const { t } = useLang()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', notes: '', email: '' })
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
      // Navigate to confirmation FIRST, then clear the cart.
      // (Clearing before navigation makes the empty-cart guard fire and
      //  shows the "cart is empty" page instead of the confirmation.)
      navigate('/confirmation', { state: { orderNumber, method, total, orderId } })
      setTimeout(() => clear(), 0)
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
    <div className="container checkout-wrap" style={{ padding: '46px 24px 80px' }}>
      <div className="checkout-head" style={{ textAlign: 'center', marginBottom: 38 }}>
        <div className="eyebrow" style={{ color: 'var(--gold-deep)', letterSpacing: '.3em', fontSize: 11, textTransform: 'uppercase' }}>{t('almost_there')}</div>
        <h2 className="serif" style={{ fontSize: 'clamp(30px,5vw,44px)', fontWeight: 300, marginTop: 8 }}>{t('checkout')}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 52, alignItems: 'start' }}
           className="checkout-grid">
        {/* LEFT: forms */}
        <div>
          {/* Contact */}
          <section className="co-card">
            <div className="co-step"><span className="co-num">1</span><h3>{t('contact')}</h3></div>
            <div className="co-row">
              <div className="field"><label>{t('full_name')} *</label><input value={form.name} onChange={set('name')} placeholder="Your name" /></div>
              <div className="field"><label>{t('phone')} *</label><input value={form.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" inputMode="tel" /></div>
            </div>
            <div className="field"><label>{t('email')} ({t('optional')})</label><input value={form.email || ''} onChange={set('email')} placeholder="you@email.com" inputMode="email" /></div>
          </section>

          {/* Delivery */}
          <section className="co-card">
            <div className="co-step"><span className="co-num">2</span><h3>{t('delivery_address')}</h3></div>
            <div className="field"><label>{t('address')} *</label><input value={form.address} onChange={set('address')} placeholder="Building, street, area" /></div>
            <div className="co-row">
              <div className="field"><label>{t('city')} *</label><input value={form.city} onChange={set('city')} placeholder="e.g. Cairo" /></div>
              <div className="field"><label>{t('order_notes')}</label><input value={form.notes} onChange={set('notes')} placeholder="Optional" /></div>
            </div>
          </section>

          {/* Payment */}
          <section className="co-card">
            <div className="co-step"><span className="co-num">3</span><h3>{t('payment_method')}</h3></div>
            {PAYMENTS.map(opt => {
              const Icon = opt.icon
              return (
                <label key={opt.id} className={`pay-opt ${method === opt.id ? 'sel' : ''}`}>
                  <input type="radio" name="pay" checked={method === opt.id} onChange={() => setMethod(opt.id)} />
                  <span className="pay-radio" />
                  <Icon size={20} color="var(--gold-deep)" />
                  <span style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontWeight: 500 }}>{opt.label}</strong>
                    <span style={{ color: 'var(--sub)', fontSize: 13 }}>{opt.sub}</span>
                  </span>
                </label>
              )
            })}
          </section>
        </div>

        {/* RIGHT: summary */}
        <div className="co-summary" style={{ position: 'sticky', top: 90 }}>
          <h3 className="serif" style={{ fontSize: 22, marginBottom: 18 }}>{t('order_summary')}</h3>
          {items.map(i => (
            <div className="co-line" key={i.id}>
              <div className="co-line-img">
                {Array.isArray(i.images) && i.images[0]
                  ? <img src={i.images[0]} alt="" />
                  : <span>🕯️</span>}
                <span className="co-line-qty">{i.qty}</span>
              </div>
              <span className="co-line-name">{i.name}</span>
              <span className="co-line-price">{money(i.price * i.qty)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, margin: '18px 0' }}>
            <input value={promo} onChange={e => setPromo(e.target.value)} placeholder={t('discount_code')} className="co-promo" />
            <button className="btn btn-ghost" onClick={applyPromo} style={{ padding: '0 18px' }}>{t('apply')}</button>
          </div>
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
            <div className="foot-row"><span style={{ color: 'var(--sub)' }}>{t('subtotal')}</span><span>{money(subtotal)}</span></div>
            {discount > 0 && <div className="foot-row"><span style={{ color: 'var(--green)' }}>Discount ({applied.code})</span><span style={{ color: 'var(--green)' }}>−{money(discount)}</span></div>}
            <div className="foot-row"><span style={{ color: 'var(--sub)' }}>Shipping{form.city ? ` · ${form.city}` : ''}</span><span>{shipping === 0 ? 'Free' : money(shipping)}</span></div>
            <div className="foot-row total"><span>{t('total')}</span><span>{money(total)}</span></div>
          </div>
          {belowMin && (
            <div style={{ background: 'var(--paper)', border: '1px solid var(--gold)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--gold-deep)', marginTop: 12 }}>
              Minimum order is {money(minOrder)}. Add {money(minOrder - subtotal)} more to check out.
            </div>
          )}
          <button className="btn btn-gold" style={{ width: '100%', marginTop: 14 }} disabled={placing || belowMin} onClick={placeOrder}>
            {placing ? 'Processing…' : `${t('place_order')} · ${money(total)}`}
          </button>
          <p style={{ color: 'var(--sub)', fontSize: 12, textAlign: 'center', marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            🔒 {t('secure_checkout')}
          </p>
        </div>
      </div>
    </div>
  )
}
