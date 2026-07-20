import { useSettings } from '../lib/useSettings'
import { useLang } from '../context/LangContext'

// Scrolling announcement bar (like big stores). Text comes from settings:
//   settings.announcement = { enabled, text_en, text_ar }
// If no custom text is set, it auto-generates the free-shipping message
// from settings.free_shipping_threshold — so it works with zero setup.
export default function AnnouncementBar() {
  const { settings } = useSettings()
  const { lang } = useLang()

  const ann = settings.announcement || {}
  if (ann.enabled === false) return null

  const threshold = settings.free_shipping_threshold || 2000
  const text = lang === 'ar'
    ? (ann.text_ar || `شحن مجاني للطلبات فوق ${threshold} جنيه`)
    : (ann.text_en || `Free shipping on orders above ${threshold} EGP`)

  // Repeat the message so the loop is seamless at any screen width.
  const items = Array(8).fill(text)

  return (
    <div className="announce-bar" aria-hidden="false">
      <div className="announce-track">
        {items.map((t, i) => <span key={i} className="announce-item">{t} <span className="announce-dot">✦</span></span>)}
        {items.map((t, i) => <span key={'b' + i} className="announce-item">{t} <span className="announce-dot">✦</span></span>)}
      </div>
    </div>
  )
}
