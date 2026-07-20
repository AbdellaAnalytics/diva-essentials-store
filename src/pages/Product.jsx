import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import { Minus, Plus, ArrowLeft } from 'lucide-react'
import { useProducts } from '../lib/useProducts'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import Seo from '../components/Seo'
import JsonLd, { productSchema } from '../components/JsonLd'
import { useEffect } from 'react'
import { Pixel } from '../lib/metaPixel'

export default function Product() {
  const { slug } = useParams()
  const { products, loading } = useProducts()
  const { add } = useCart()
  const { money } = useUI()
  const [qty, setQty] = useState(1)
  const navigate = useNavigate()

  const p = products.find(x => x.slug === slug)

  useEffect(() => {
    if (p) Pixel.viewContent(p)
  }, [p?.id])

  if (loading && !p) return <div className="container empty">Loading…</div>
  if (!p) return (
    <div className="container empty" style={{ padding: '120px 20px' }}>
      Product not found. <Link to="/shop" style={{ color: 'var(--gold)' }}>Back to shop</Link>
    </div>
  )

  const off = p.compare_price ? Math.round((1 - p.price / p.compare_price) * 100) : 0
  const outOfStock = p.stock <= 0

  return (
    <div className="container">
      <Seo
        title={`${p.name} — Diva Essentials`}
        description={p.description || `${p.name}, a hand-poured luxury soy candle by Diva Essentials.`}
        path={`/product/${p.slug}`}
        image={Array.isArray(p.images) && p.images[0] ? p.images[0] : undefined}
      />
      <JsonLd data={productSchema(p)} id="product-jsonld" />
      <button className="btn btn-ghost" style={{ marginTop: 24 }} onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>
      <div className="pdp">
        <ProductGallery images={Array.isArray(p.images) ? p.images : []} name={p.name} />
        <div>
          <span className="card-cat">{p.category_name || 'Candle'}</span>
          <h1>{p.name}</h1>
          <p style={{ color: 'var(--sub)', fontSize: 16 }}>{p.description}</p>

          <div className="price-row">
            <span className="price">{money(p.price)}</span>
            {p.compare_price && <span className="price-old">{money(p.compare_price)}</span>}
            {off > 0 && <span className="badge" style={{ position: 'static' }}>-{off}%</span>}
          </div>

          <div className="spec">
            <div><span>Scent Notes</span><strong>{p.scent_notes || '—'}</strong></div>
            <div><span>Burn Time</span><strong>{p.burn_time || '—'}</strong></div>
            <div><span>Weight</span><strong>{p.weight_grams ? `${p.weight_grams}g` : '—'}</strong></div>
          </div>

          {!outOfStock ? (
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div className="qty">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}><Minus size={16} /></button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => q + 1)}><Plus size={16} /></button>
              </div>
              <button className="btn btn-gold" style={{ flex: 1 }} onClick={() => add(p, qty)}>
                Add to Cart · {money(p.price * qty)}
              </button>
            </div>
          ) : (
            <button className="btn btn-ghost" disabled style={{ width: '100%' }}>Sold Out</button>
          )}
          {p.stock > 0 && p.stock <= 10 && (
            <p style={{ color: 'var(--gold)', marginTop: 14, fontSize: 13 }}>Only {p.stock} left in stock</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Premium product gallery: large main image + thumbnail row.
// Click/tap a thumb to switch; swipeable on mobile.
function ProductGallery({ images, name }) {
  const [active, setActive] = useState(0)
  const touch = useRef(null)

  if (!images.length) {
    return <div className="pdp-img"><span className="flame">🕯️</span></div>
  }

  const go = (i) => setActive(Math.max(0, Math.min(images.length - 1, i)))
  const onStart = (e) => { touch.current = e.touches[0].clientX }
  const onEnd = (e) => {
    if (touch.current == null) return
    const dx = e.changedTouches[0].clientX - touch.current
    if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1))
    touch.current = null
  }

  return (
    <div className="gallery">
      <div className="gallery-main" onTouchStart={onStart} onTouchEnd={onEnd}>
        <img src={images[active]} alt={name} className="pdp-photo" />
        {images.length > 1 && (
          <div className="gallery-dots">
            {images.map((_, i) => (
              <span key={i} className={`gdot ${i === active ? 'on' : ''}`} onClick={() => go(i)} />
            ))}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((src, i) => (
            <button
              key={i}
              className={`gthumb ${i === active ? 'on' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
            >
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
