import { Link } from 'react-router-dom'
import { X, Minus, Plus } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'

export function ProductCard({ p }) {
  const { add } = useCart()
  const { money } = useUI()
  const off = p.compare_price
    ? Math.round((1 - p.price / p.compare_price) * 100)
    : 0
  const outOfStock = p.stock <= 0
  const imgs = Array.isArray(p.images) ? p.images : []
  const img = imgs[0]
  const img2 = imgs[1]
  return (
    <div className="card">
      <Link to={`/product/${p.slug}`}>
        <div className="card-img">
          {off > 0 && !outOfStock && <span className="badge">-{off}%</span>}
          {outOfStock && <span className="badge out">Sold Out</span>}
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
          style={{ width: '100%' }}
          disabled={outOfStock}
          onClick={() => add(p, 1)}
        >
          {outOfStock ? 'Sold Out' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}

export function CartDrawer() {
  const { items, open, setOpen, setQty, remove, subtotal, count } = useCart()
  const { money } = useUI()
  if (!open) return null
  const FREE_SHIP = 2000
  const shipping = subtotal >= FREE_SHIP || subtotal === 0 ? 0 : 60
  return (
    <>
      <div className="drawer-overlay" onClick={() => setOpen(false)} />
      <aside className="drawer">
        <div className="drawer-head">
          <h3>Your Cart ({count})</h3>
          <button className="icon-btn" onClick={() => setOpen(false)}>
            <X size={22} />
          </button>
        </div>
        <div className="drawer-body">
          {items.length === 0 && <div className="empty">Your cart is empty.</div>}
          {items.map(i => (
            <div className="cart-line" key={i.id}>
              <div className="thumb">
                {Array.isArray(i.images) && i.images[0]
                  ? <img src={i.images[0]} alt={i.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 26 }}>🕯️</span>}
              </div>
              <div className="info">
                <strong>{i.name}</strong>
                <div className="sub">{money(i.price)}</div>
                <div className="qty" style={{ marginTop: 8, width: 'fit-content' }}>
                  <button onClick={() => setQty(i.id, i.qty - 1)}><Minus size={14} /></button>
                  <span>{i.qty}</span>
                  <button onClick={() => setQty(i.id, i.qty + 1)}><Plus size={14} /></button>
                </div>
              </div>
              <button className="link-x" onClick={() => remove(i.id)}>Remove</button>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="drawer-foot">
            <div className="foot-row">
              <span style={{ color: 'var(--sub)' }}>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="foot-row">
              <span style={{ color: 'var(--sub)' }}>Shipping</span>
              <span>{shipping === 0 ? 'Free' : money(shipping)}</span>
            </div>
            <div className="foot-row total">
              <span>Total</span>
              <span>{money(subtotal + shipping)}</span>
            </div>
            <Link to="/checkout" className="btn btn-gold" style={{ width: '100%' }}
               onClick={() => setOpen(false)}>
              Proceed to Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}
