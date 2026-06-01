import { Link } from 'react-router-dom'
import { useProducts } from '../lib/useProducts'
import { useCategories } from '../lib/useCategories'

export default function Footer() {
  const { products } = useProducts()
  const categories = useCategories(products)

  return (
    <footer className="site">
      <div className="container">
        <div className="foot-grid">
          <div>
            <h4>Diva Essentials</h4>
            <p style={{ maxWidth: 340 }}>
              Hand-poured luxury scented candles, crafted in Egypt. Quality, warmth,
              and atmosphere delivered to your door.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: 16 }}>Shop</h4>
            <ul>
              <li><Link to="/shop">All Candles</Link></li>
              {categories.map(c => (
                <li key={c.slug}><Link to={`/shop?category=${c.slug}`}>{c.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: 16 }}>Help</h4>
            <ul>
              <li><a href="https://wa.me/201147397783">WhatsApp Support</a></li>
              <li><Link to="/account">My Account</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/returns">Returns &amp; Replacement</Link></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          © {new Date().getFullYear()} Diva Essentials. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
