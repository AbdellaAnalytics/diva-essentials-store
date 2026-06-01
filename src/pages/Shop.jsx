import { useSearchParams, Link } from 'react-router-dom'
import { ProductCard } from '../components/Shop'
import { useProducts } from '../lib/useProducts'
import { useCategories } from '../lib/useCategories'

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const active = params.get('category')
  const { products, loading } = useProducts()
  const categories = useCategories(products)

  const filtered = active
    ? products.filter(p => p.category_slug === active)
    : products

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">The Collection</div>
          <h2>Shop Candles</h2>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 40, flexWrap: 'wrap' }}>
          <button
            className={`btn ${!active ? 'btn-gold' : 'btn-ghost'}`}
            onClick={() => setParams({})}
          >All</button>
          {categories.map(c => (
            <button
              key={c.slug}
              className={`btn ${active === c.slug ? 'btn-gold' : 'btn-ghost'}`}
              onClick={() => setParams({ category: c.slug })}
            >{c.name}</button>
          ))}
        </div>

        {loading && <div className="empty">Loading…</div>}
        {!loading && filtered.length === 0 && (
          <div className="empty">No candles in this category yet. <Link to="/shop" style={{ color: 'var(--gold)' }}>View all</Link></div>
        )}
        <div className="grid">
          {filtered.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  )
}
