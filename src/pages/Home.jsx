import { Link } from 'react-router-dom'
import { Truck, Leaf, Shield, Heart, Sparkles, Award, Clock, RotateCcw } from 'lucide-react'
import { ProductCard } from '../components/Shop'
import { useProducts } from '../lib/useProducts'
import { useCategories } from '../lib/useCategories'
import { useSettings } from '../lib/useSettings'
import { useLang } from '../context/LangContext'
import Seo from '../components/Seo'

const FEATURE_ICONS = { truck: Truck, leaf: Leaf, shield: Shield, heart: Heart, award: Award, clock: Clock, returns: RotateCcw, sparkles: Sparkles }

export default function Home() {
  const { products } = useProducts()
  const { settings } = useSettings()
  const categories = useCategories(products)
  const hero = settings.hero || {}
  const features = settings.features || {}
  const promo = settings.promo || {}
  const story = settings.brand_story || {}
  const collections = settings.collections_section || {}
  const { t } = useLang()
  // Show ALL products on the homepage. Featured ones come first (if any flagged),
  // then the rest — so the section always reflects the full catalog.
  const featured = products.filter(p => p.is_featured)
  const rest = products.filter(p => !p.is_featured)
  const list = [...featured, ...rest]

  return (
    <>
      <Seo title="Diva Essentials — Luxury Scented Candles" description="Hand-poured luxury soy candles crafted in Egypt. Lavender, vanilla & woody scents. Cash on delivery & fast shipping." path="/" />
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
            <div className="eyebrow">{t('our_candles')}</div>
            <h2>{t('the_collection')}</h2>
          </div>
          <div className="grid">
            {list.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
          <div style={{ textAlign: 'center', marginTop: 44 }}>
            <Link to="/shop" className="btn btn-ghost">{t('view_all')}</Link>
          </div>
        </div>
      </section>

      {/* Features bar */}
      {features.enabled !== false && (
        <section className="section feature-bar" style={{ background: 'var(--paper)', paddingTop: 50, paddingBottom: 50 }}>
          <div className="container">
            <div className="feature-grid">
              {(features.items || []).map((f, i) => {
                const Icon = FEATURE_ICONS[f.icon] || Sparkles
                return (
                  <div key={i} className="feature-item">
                    <Icon size={30} strokeWidth={1.4} color="var(--gold-deep)" />
                    <strong className="serif">{f.title}</strong>
                    <p>{f.text}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Collections (category images) */}
      {collections.enabled !== false && categories.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <h2>{collections.title || 'Shop by Collection'}</h2>
            </div>
            <div className="collection-grid">
              {categories.map(c => (
                <Link key={c.slug} to={`/shop?category=${c.slug}`} className="collection-card">
                  {c.image_url
                    ? <img src={c.image_url} alt={c.name} />
                    : <div className="collection-fallback" />}
                  <div className="collection-overlay">
                    <span className="collection-name serif">{c.name}</span>
                    <span className="collection-cta">Shop Now →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Promo banner */}
      {promo.enabled !== false && (
        <section className="promo-banner" style={promo.image_url ? { backgroundImage: `url(${promo.image_url})` } : {}}>
          <div className="promo-overlay" />
          <div className="container promo-content">
            {promo.eyebrow && <div className="eyebrow">{promo.eyebrow}</div>}
            <h2 className="serif">{promo.title}</h2>
            {promo.subtitle && <p>{promo.subtitle}</p>}
            {promo.button_label && (
              <Link to={promo.button_href || '/shop'} className="btn btn-gold">{promo.button_label}</Link>
            )}
          </div>
        </section>
      )}

      {/* Brand story */}
      {story.enabled !== false && (
        <section className="section brand-story">
          <div className="container story-grid">
            <div className="story-media">
              {story.image_url ? <img src={story.image_url} alt="" /> : <div className="story-fallback" />}
            </div>
            <div className="story-text">
              {story.eyebrow && <div className="eyebrow">{story.eyebrow}</div>}
              <h2 className="serif">{story.title}</h2>
              <p>{story.text}</p>
              {story.button_label && (
                <Link to={story.button_href || '/about'} className="btn btn-ghost">{story.button_label}</Link>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
