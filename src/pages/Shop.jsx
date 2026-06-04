import { useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { ProductCard } from '../components/Shop'
import { useProducts } from '../lib/useProducts'
import { useCategories } from '../lib/useCategories'
import { useLang } from '../context/LangContext'
import Seo from '../components/Seo'

// Normalize for bilingual search: lowercase + strip Arabic diacritics + unify letter variants.
function norm(s) {
  return (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const active = params.get('category')
  const { products, loading } = useProducts()
  const categories = useCategories(products)
  const { t } = useLang()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    let list = active ? products.filter(p => p.category_slug === active) : products
    const term = norm(q)
    if (term) {
      list = list.filter(p => {
        const hay = norm([p.name, p.notes, p.description, p.category_name].filter(Boolean).join(' '))
        return term.split(' ').every(w => hay.includes(w))
      })
    }
    return list
  }, [products, active, q])

  return (
    <section className="section">
      <Seo
        title="Shop Candles — Diva Essentials"
        description="Browse hand-poured luxury soy candles by Diva Essentials. Lavender, vanilla, floral and woody scents. Free shipping over 2000 EGP across Egypt."
        path="/shop"
      />
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">{t('the_collection')}</div>
          <h2>{t('shop_all')}</h2>
        </div>

        <div className="shop-search">
          <Search size={17} color="var(--sub)" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={t('search') + '… (عربي / English)'}
            aria-label={t('search')}
          />
          {q && <button onClick={() => setQ('')} aria-label="Clear" className="shop-search-x"><X size={15} /></button>}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 40, flexWrap: 'wrap' }}>
          <button className={`btn ${!active ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setParams({})}>{t('all_candles')}</button>
          {categories.map(c => (
            <button key={c.slug} className={`btn ${active === c.slug ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setParams({ category: c.slug })}>{c.name}</button>
          ))}
        </div>

        {loading && <div className="empty">{t('loading')}</div>}
        {!loading && filtered.length === 0 && (
          <div className="empty">
            {q
              ? <>{t('no_results')} "{q}". <button onClick={() => setQ('')} style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>{t('clear_search')}</button></>
              : <>No candles in this category yet. <Link to="/shop" style={{ color: 'var(--gold)' }}>{t('all_candles')}</Link></>}
          </div>
        )}
        <div className="grid">
          {filtered.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  )
}
