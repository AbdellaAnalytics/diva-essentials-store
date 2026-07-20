import { Link } from 'react-router-dom'
import { X, Minus, Plus, Trash2, Truck, Tag, Gift } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import { useLang } from '../context/LangContext'
import { useSettings } from '../lib/useSettings'
import { useProducts } from '../lib/useProducts'

export function ProductCard({ p }) {
  const { add } = useCart()
  const { money } = useUI()
  const { t } = useLang()
  const off = p.compare_price
    ? Math.round((1 - p.price / p.compare_price) * 100)
    : 0
  const outOfStock = p.stock <= 0
  // "New" = added within the last 30 days (needs created_at from the DB)
  const isNew = p.created_at
    ? (Date.now() - new Date(p.created_at).getTime()) < 30 * 24 * 60 * 60 * 1000
    : false
  const imgs = Array.isArray(p.images) ? p.images : []
  const img = imgs[0]
  const img2 = imgs[1]
  return (
    <div className="card">
      <Link to={`/product/${p.slug}`}>
        <div className="card-img">
          {off > 0 && !outOfStock && <span className="badge">-{off}%</span>}
          {isNew && !outOfStock && <span className={`badge new ${off > 0 ? 'badge-stack' : ''}`}>{t('new_badge')}</span>}
          {outOfStock && <span className="badge out">{t('sold_out')}</span>}
          {img ? (
            <>
              <img src={img} alt={p.name} className="card-photo card-photo-1" />
              {img2 && <img src={img2} alt={p.name} className="card-photo card-photo-2" />}
            </>
          ) : (
            <span className="flame">🕯️</span>
          )}
        </div>
      </Link>
      <div className="card-body">
        <span className="card-cat">{p.category_name || 'Candle'}</span>
        <Link to={`/product/${p.slug}`}>
          <h3 className="card-name">{p.name}</h3>
        </Link>
        <p className="card-notes">{p.scent_notes}</p>
        <div className="price-row">
          <span className="price">{money(p.price)}</span>
          {p.compare_price && <span className="price-old">{money(p.compare_price)}</span>}
        </div>
        <button
          className="btn btn-gold"
          style={{ width: '100%', marginTop: 12 }}
          disabled={outOfStock}
          onClick={() => add(p, 1)}
        >
          {outOfStock ? t('sold_out') : t('add_to_cart')}
        </button>
      </div>
    </div>
  )
}

export function CartDrawer() {
  const { items, open, setOpen, setQty, remove, add, subtotal, count } = useCart()
  const { money } = useUI()
  const { t } = useLang()
  const { settings } = useSettings()
  const { products } = useProducts()
  if (!open) return null

  const freeShip = Number(settings?.free_shipping_threshold) || 2000
  const discountAt = Math.round(freeShip * 1.5)   // "10% + free shipping" tier
  const exclusiveAt = freeShip * 2                  // "exclusive discount" tier
  const shipping = subtotal >= freeShip || subtotal === 0 ? 0 : (Number(settings?.shipping_flat) || 60)

  // progress toward the next milestone
  const milestones = [
    { label: 'Free Shipping', at: freeShip },
    { label: '10% + Free Shipping', at: discountAt },
    { label: 'Exclusive Discount', at: exclusiveAt },
  ]
  const pct = Math.min(100, (subtotal / exclusiveAt) * 100)
  const nextMs = milestones.find(m => subtotal < m.at)

  // cross-sell: products not already in the cart
  const inCart = new Set(items.map(i => i.id))
  const alsoBought = products.filter(p => !inCart.has(p.id) && p.is_active !== false).slice(0, 3)

  return (
    <>
      <div className="drawer-overlay" onClick={() => setOpen(false)} />
      <aside className="drawer cart2">
        <div className="drawer-head">
          <h3>{t('your_cart')} · {count}</h3>
          <button className="icon-btn" onClick={() => setOpen(false)}><X size={22} /></button>
        </div>

        {items.length === 0 ? (
          <div className="drawer-body"><div className="empty">{t('your_cart_empty')}</div></div>
        ) : (
          <>
            {/* urgency banner */}
            <div className="cart-reserve">{t('reserved')} ✨</div>

            <div className="drawer-body">
              {/* reward progress bar */}
              <div className="reward">
                <div className="reward-msg">
                  {nextMs
                    ? <>You're <strong>{money(nextMs.at - subtotal)}</strong> away from <strong>{nextMs.label}</strong>!</>
                    : <>You've unlocked every reward 🎉</>}
                </div>
                <div className="reward-track">
                  <div className="reward-fill" style={{ width: `${pct}%` }} />
                  {milestones.map((m, idx) => {
                    const reached = subtotal >= m.at
                    const left = (m.at / exclusiveAt) * 100
                    return (
                      <div key={idx} className={`reward-dot ${reached ? 'on' : ''}`} style={{ left: `${left}%` }}>
                        {m.label === 'Free Shipping' ? <Truck size={13} /> : m.label.includes('10') ? <Tag size={13} /> : <Gift size={13} />}
                      </div>
                    )
                  })}
                </div>
                <div className="reward-labels">
                  {milestones.map((m, idx) => <span key={idx} className={subtotal >= m.at ? 'on' : ''}>{m.label}</span>)}
                </div>
              </div>

              {/* items */}
              {items.map(i => (
                <div className="cart2-line" key={i.id}>
                  <div className="cart2-img">
                    {Array.isArray(i.images) && i.images[0]
                      ? <img src={i.images[0]} alt={i.name} />
                      : <span>🕯️</span>}
                  </div>
                  <div className="cart2-info">
                    <div className="cart2-top">
                      <strong>{i.name}</strong>
                      <button className="cart2-del" onClick={() => remove(i.id)} aria-label="Remove"><Trash2 size={17} /></button>
                    </div>
                    {i.category_name && <div className="cart2-variant">{i.category_name}</div>}
                    <div className="cart2-bottom">
                      <div className="qty">
                        <button onClick={() => setQty(i.id, i.qty - 1)}><Minus size={13} /></button>
                        <span>{i.qty}</span>
                        <button onClick={() => setQty(i.id, i.qty + 1)}><Plus size={13} /></button>
                      </div>
                      <span className="cart2-price">{money(i.price * i.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* cross-sell */}
              {alsoBought.length > 0 && (
                <div className="cross">
                  <div className="cross-head">{t('people_also_bought')}</div>
                  {alsoBought.map(p => (
                    <div className="cross-item" key={p.id}>
                      <div className="cross-img">
                        {Array.isArray(p.images) && p.images[0] ? <img src={p.images[0]} alt={p.name} /> : <span>🕯️</span>}
                      </div>
                      <div className="cross-info">
                        <strong>{p.name}</strong>
                        <span className="cross-price">{money(p.price)}</span>
                      </div>
                      <button className="cross-add" onClick={() => add(p, 1)}>{t('add')}</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* sticky footer */}
            <div className="drawer-foot">
              <div className="cart2-promo">
                <input placeholder={t('discount_code')} id="cart-promo" />
                <button onClick={() => setOpen(false)}>{t('apply')}</button>
              </div>
              <div className="foot-row total"><span>{t('subtotal')}</span><span>{money(subtotal)}</span></div>
              <Link to="/checkout" className="btn btn-gold cart2-checkout" onClick={() => setOpen(false)}>
                {t('checkout')} · {money(subtotal)}
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
