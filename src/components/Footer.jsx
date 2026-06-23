import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Instagram, Facebook, MessageCircle, MapPin, Mail, Phone } from 'lucide-react'
import { useProducts } from '../lib/useProducts'
import { useCategories } from '../lib/useCategories'
import { useSettings } from '../lib/useSettings'
import { useLang } from '../context/LangContext'

function TikTokIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.5 3c.3 2.1 1.5 3.6 3.5 3.9v2.4c-1.2.1-2.4-.2-3.5-.8v5.9c0 3.2-2.3 5.6-5.4 5.6-2.9 0-5.1-2.2-5.1-5 0-2.9 2.3-5.1 5.4-4.9v2.5c-.4-.1-.9-.2-1.3-.1-1.2.1-2.1 1.1-2 2.4 0 1.3 1 2.3 2.3 2.3 1.4 0 2.4-1 2.4-2.7V3h3.2z"/>
    </svg>
  )
}

export default function Footer() {
  const { products } = useProducts()
  const categories = useCategories(products)
  const { settings } = useSettings()
  const social = settings.social || {}
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const links = [
    { key: 'instagram', url: social.instagram, Icon: Instagram, label: 'Instagram' },
    { key: 'facebook', url: social.facebook, Icon: Facebook, label: 'Facebook' },
    { key: 'tiktok', url: social.tiktok, Icon: TikTokIcon, label: 'TikTok' },
    { key: 'whatsapp', url: social.whatsapp ? `https://wa.me/${social.whatsapp.replace(/[^0-9]/g, '')}` : '', Icon: MessageCircle, label: 'WhatsApp' },
  ].filter(l => l.url)

  const storeEmail = settings.contact_email || 'info@divaessentialsgroup.com'
  const storeLocation = settings.contact_location || 'Cairo, Egypt'
  const storePhone = settings.contact_phone || ''

  const subscribe = () => {
    if (!email.trim() || !email.includes('@')) return
    setSubscribed(true); setEmail('')
    setTimeout(() => setSubscribed(false), 4000)
  }

  return (
    <footer className="site">
      <div className="container">
        <div className="foot-grid foot-grid-4">
          <div>
            <h4>Diva Essentials</h4>
            <p style={{ maxWidth: 320 }}>{t('footer_tagline')}</p>
            <div className="foot-contact">
              <span><MapPin size={14} /> {storeLocation}</span>
              {storePhone && <a href={`tel:${storePhone.replace(/\s/g, '')}`}><Phone size={14} /> {storePhone}</a>}
              <a href={`mailto:${storeEmail}`}><Mail size={14} /> {storeEmail}</a>
            </div>
            {links.length > 0 && (
              <div className="social-row">
                {links.map(({ key, url, Icon, label }) => (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}><Icon size={17} /></a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 style={{ fontSize: 16 }}>{t('shop')}</h4>
            <ul>
              <li><Link to="/shop">{t('all_candles')}</Link></li>
              {categories.map(c => (
                <li key={c.slug}><Link to={`/shop?category=${c.slug}`}>{c.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: 16 }}>{t('help')}</h4>
            <ul>
              <li><Link to="/account">{t('my_account')}</Link></li>
              <li><Link to="/about">{t('about_us')}</Link></li>
              <li><Link to="/returns">{t('returns')}</Link></li>
              <li><Link to="/privacy">{t('privacy_policy')}</Link></li>
              <li><Link to="/terms">{t('terms')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: 16 }}>{t('newsletter')}</h4>
            <p style={{ fontSize: 13.5, marginBottom: 12 }}>{t('newsletter_text')}</p>
            <div className="foot-news">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('email')}
                onKeyDown={e => e.key === 'Enter' && subscribe()}
              />
              <button onClick={subscribe}>{t('subscribe')}</button>
            </div>
            {subscribed && <p style={{ fontSize: 12.5, color: 'var(--green)', marginTop: 8 }}>{t('subscribed')}</p>}
          </div>
        </div>

        <div className="foot-bottom">
          © {new Date().getFullYear()} Diva Essentials. {t('rights_reserved')}
        </div>
      </div>
    </footer>
  )
}
