import { useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, X, SlidersHorizontal, LayoutGrid } from 'lucide-react'
import { ProductCard } from '../components/Shop'
import { useProducts } from '../lib/useProducts'
import { useCategories } from '../lib/useCategories'
import { useLang } from '../context/LangContext'
import { useUI } from '../context/UIContext'
import Seo from '../components/Seo'

function norm(s) {
  return (s || '').toString().toLowerCase().normalize('NFKD')
    .replace(/[\u064B-\u0652]/g, '').replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim()
}

const SORTS = [
  { id: 'default', key: 'sort_default' },
  { id: 'price_asc', key: 'sort_price_low' },
  { id: 'price_desc', key: 'sort_price_high' },
  { id: 'newest', key: 'sort_newest' },
]

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const active = params.get('category')
  const { products, loading } = useProducts()
  const categories = useCategories(products)
  const { t } = useLang()
  const { money } = useUI()
  const [q, setQ] = useState('')
  const [cols, setCols] = useState(3)          // 2 / 3 / 4 columns
  const [sort, setSort] = useState('default')
  const [showFilters, setShowFilters] = useState(false)

  // price bounds from the catalog
  const prices = products.map(p => Number(p.price)).filter(Boolean)
  const minAll = prices.length ? Math.floor(Math.min(...prices)) : 0
  const maxAll = prices.length ? Math.ceil(Math.max(...prices)) : 1000
  const [minP, setMinP] = useState(null)
  const [maxP, setMaxP] = useState(null)
  const lo = minP == null ? minAll : minP
  const hi = maxP == null ? maxAll : maxP
  // Only show the price filter when there's an actual price range to filter.
  const hasPriceRange = maxAll > minAll

  const filtered = useMemo(() => {
    let list = active ? products.filter(p => p.category_slug === active) : products.slice()
    const term = norm(q)
    if (term) {
      list = list.filter(p => {
        const hay = norm([p.name, p.scent_notes, p.description, p.category_name].filter(Boolean).join(' '))
        return term.split(' ').every(w => hay.includes(w))
      })
    }
    // price filter
    list = list.filter(p => Number(p.price) >= lo && Number(p.price) <= hi)
    // sort
    if (sort === 'price_asc') list.sort((a, b) => a.price - b.price)
    else if (sort === 'price_desc') list.sort((a, b) => b.price - a.price)
    else if (sort === 'newest') list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    return list
  }, [products, active, q, lo, hi, sort])

  const clearPrice = () => { setMinP(null); setMaxP(null) }
  const priceActive = minP != null || maxP != null

  return (
    <section className="section">
      <Seo title="Shop Candles — Diva Essentials"
        description="Browse hand-poured luxury soy candles by Diva Essentials. Lavender, vanilla, floral and woody scents. Free shipping over 2000 EGP across Egypt."
        path="/shop" />
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">{t('the_collection')}</div>
          <h2>{t('shop_all')}</h2>
        </div>

        <div className="shop-search">
          <Search size={17} color="var(--sub)" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder={t('search') + '… (عربي / English)'} aria-label={t('search')} />
          {q && <button onClick={() => setQ('')} aria-label="Clear" className="shop-search-x"><X size={15} /></button>}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 22, flexWrap: 'wrap' }}>
          <button className={`btn ${!active ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setParams({})}>{t('all_candles')}</button>
          {categories.map(c => (
            <button key={c.slug} className={`btn ${active === c.slug ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setParams({ category: c.slug })}>{c.name}</button>
          ))}
        </div>

        {/* toolbar: filters toggle · sort · column switcher */}
        <div className="shop-toolbar">
          {hasPriceRange ? (
            <button className={`shop-tool-btn ${showFilters || priceActive ? 'on' : ''}`} onClick={() => setShowFilters(s => !s)}>
              <SlidersHorizontal size={15} /> {t('filter_price')}{priceActive ? ' •' : ''}
            </button>
          ) : <span />}

          <div className="shop-toolbar-right">
            <select className="shop-sort" value={sort} onChange={e => setSort(e.target.value)} aria-label={t('sort_by')}>
              {SORTS.map(s => <option key={s.id} value={s.id}>{t(s.key)}</option>)}
            </select>
            <div className="col-switch" role="group" aria-label="Columns">
              {[2, 3, 4].map(n => (
                <button key={n} className={`col-btn ${cols === n ? 'on' : ''}`} onClick={() => setCols(n)} aria-label={`${n} columns`}>
                  <LayoutGrid size={15} /><span>{n}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* price filter panel */}
        {showFilters && hasPriceRange && (
          <div className="price-panel">
            <div className="price-panel-head">
              <span>{t('filter_price')}</span>
              {priceActive && <button onClick={clearPrice} className="price-clear">{t('clear_search')}</button>}
            </div>
            <div className="price-inputs">
              <label>{t('min_price')}<input type="number" value={lo} min={minAll} max={hi}
                onChange={e => setMinP(Math.max(minAll, Math.min(Number(e.target.value), hi)))} /></label>
              <span className="price-dash">—</span>
              <label>{t('max_price')}<input type="number" value={hi} min={lo} max={maxAll}
                onChange={e => setMaxP(Math.min(maxAll, Math.max(Number(e.target.value), lo)))} /></label>
            </div>
            <input type="range" className="price-range" min={minAll} max={maxAll} value={hi}
              onChange={e => setMaxP(Number(e.target.value))} />
            <div className="price-caption">{money(lo)} — {money(hi)}</div>
          </div>
        )}

        <div className="shop-count">{filtered.length} {filtered.length === 1 ? t('product_one') : t('product_many')}</div>

        {loading && <div className="empty">{t('loading')}</div>}
        {!loading && filtered.length === 0 && (
          <div className="empty">
            {q || priceActive
              ? <>{t('no_results')}{q ? ` "${q}"` : ''}. <button onClick={() => { setQ(''); clearPrice() }} style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>{t('clear_search')}</button></>
              : <>No candles in this category yet. <Link to="/shop" style={{ color: 'var(--gold)' }}>{t('all_candles')}</Link></>}
          </div>
        )}
        <div className={`grid grid-cols-${cols}`}>
          {filtered.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  )
}
