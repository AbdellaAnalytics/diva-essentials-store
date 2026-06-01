import { Link } from 'react-router-dom'
import { ProductCard } from '../components/Shop'
import { useProducts } from '../lib/useProducts'
import { useSettings } from '../lib/useSettings'

export default function Home() {
  const { products } = useProducts()
  const { settings } = useSettings()
  const hero = settings.hero || {}
  const featured = products.filter(p => p.is_featured).slice(0, 6)
  const list = featured.length ? featured : products.slice(0, 6)

  return (
    <>
      <section className="hero-media">
        {/* background media */}
        {hero.media_url ? (
          hero.media_type === 'video' ? (
            <video className="hero-bg" src={hero.media_url} autoPlay muted loop playsInline />
          ) : (
            <img className="hero-bg" src={hero.media_url} alt="" />
          )
        ) : (
          <div className="hero-bg hero-bg-fallback" />
        )}
        {/* dark overlay for readability */}
        <div className="hero-overlay" style={{ background: `rgba(10,8,6,${hero.overlay ?? 0.4})` }} />
        {/* content */}
        <div className="container hero-content">
          {hero.eyebrow && <div className="eyebrow fade-up">{hero.eyebrow}</div>}
          <h1 className="fade-up d1">{hero.title || 'Light the atmosphere'}</h1>
          {hero.subtitle && <p className="fade-up d2">{hero.subtitle}</p>}
          <div className="fade-up d3" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            {(hero.buttons || []).map((b, i) => (
              <Link key={i} to={b.href || '/shop'} className={`btn ${b.style === 'ghost' ? 'btn-ghost-light' : 'btn-gold'}`}>
                {b.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Bestsellers</div>
            <h2>Featured Candles</h2>
          </div>
          <div className="grid">
            {list.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
          <div style={{ textAlign: 'center', marginTop: 44 }}>
            <Link to="/shop" className="btn btn-ghost">View All Candles</Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--paper)' }}>
        <div className="container">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))' }}>
            {[
              ['🚚', 'Free Shipping', 'On all orders over 2000 EGP'],
              ['🕯️', 'Clean Burn', 'Premium wax, up to 45 hours'],
              ['↩️', '14-Day Returns', 'Easy exchange & return policy'],
              ['💬', 'WhatsApp Support', 'We are here whenever you need'],
            ].map(([icon, title, sub]) => (
              <div key={title} style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 34, marginBottom: 10 }}>{icon}</div>
                <strong className="serif" style={{ fontSize: 20, display: 'block', marginBottom: 6 }}>{title}</strong>
                <p style={{ color: 'var(--sub)', fontSize: 14 }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
