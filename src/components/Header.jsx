import { Link } from 'react-router-dom'
import { ShoppingBag, User, Sun, Moon } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'
import { useUI } from '../context/UIContext'
import { useProducts } from '../lib/useProducts'
import { useCategories } from '../lib/useCategories'

export default function Header() {
  const { count, setOpen } = useCart()
  const { theme, toggleTheme, currency, toggleCurrency } = useUI()
  const { lang, toggleLang, t } = useLang()
  const { products } = useProducts()
  const categories = useCategories(products)

  return (
    <>
      <div className="promo-bar">
        Use code DIVA10 at checkout for 10% off · Free shipping over 2000 EGP
      </div>
      <header className="site">
        <div className="container nav">
          <Link to="/" className="logo">
            Diva<small>Essentials</small>
          </Link>
          <nav className="nav-links">
            <Link to="/shop">{t('shop_all')}</Link>
            {categories.map(c => (
              <Link key={c.slug} to={`/shop?category=${c.slug}`}>{c.name}</Link>
            ))}
          </nav>
          <div className="nav-actions">
            <button className="toggle-pill" onClick={toggleLang} aria-label="Switch language" title="Switch language">
              {lang === 'ar' ? 'EN' : 'ع'}
            </button>
            <button className="toggle-pill" onClick={toggleCurrency} aria-label="Switch currency" title="Switch currency">
              {currency}
            </button>
            <button className="toggle-pill" onClick={toggleTheme} aria-label="Switch theme" title="Switch theme"
              style={{ padding: 7, width: 32, height: 32, justifyContent: 'center' }}>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link to="/account" className="icon-btn" aria-label="Account">
              <User size={19} strokeWidth={1.4} />
            </Link>
            <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Cart">
              <ShoppingBag size={19} strokeWidth={1.4} />
              {count > 0 && <span className="cart-badge">{count}</span>}
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
