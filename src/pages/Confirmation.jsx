import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useUI } from '../context/UIContext'
import { useLang } from '../context/LangContext'
import { CheckCircle } from 'lucide-react'
import { Pixel } from '../lib/metaPixel'

function readSavedOrder() {
  try {
    const raw = localStorage.getItem('diva_last_order')
    if (raw) return JSON.parse(raw)
  } catch (e) { /* ignore */ }
  return null
}

export default function Confirmation() {
  const { money } = useUI()
  const { t } = useLang()
  const { state } = useLocation()
  const [params] = useSearchParams()

  // Read once (state wins; else what we saved before the Kashier redirect).
  // Kept in React state so re-renders (e.g. language toggle) don't lose it.
  const [saved] = useState(() => state || readSavedOrder() || {})
  const kashierOrderId = params.get('merchantOrderId') || params.get('orderId')
  const kashierStatus = (params.get('paymentStatus') || params.get('status') || '').toUpperCase()

  const orderNumber = saved.orderNumber || kashierOrderId || '—'
  const total = saved.total != null ? saved.total : null
  const method = saved.method || (kashierOrderId ? 'kashier' : 'cod')

  useEffect(() => {
    // Card purchases return here from Kashier — fire Purchase once (COD already fired at checkout).
    const cardOk = (saved.method === 'kashier' || saved.method === 'stripe')
      && (!kashierStatus || kashierStatus === 'SUCCESS')
    if (cardOk && saved.orderNumber && !sessionStorage.getItem('purch_' + saved.orderNumber)) {
      try {
        Pixel.purchase(saved.orderNumber, saved.items || [], saved.total || 0)
        sessionStorage.setItem('purch_' + saved.orderNumber, '1')
      } catch (e) {}
    }
    try { if (saved.orderNumber) localStorage.removeItem('diva_last_order') } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const manual = method === 'instapay' || method === 'vodafone_cash'
  const isCard = method === 'kashier' || method === 'stripe'
  const paymentFailed = kashierStatus && kashierStatus !== 'SUCCESS'

  return (
    <div className="container" style={{ padding: '90px 24px', maxWidth: 620, textAlign: 'center' }}>
      <CheckCircle size={64} color="var(--gold)" strokeWidth={1.2} style={{ margin: '0 auto 22px' }} />
      <h1 className="serif" style={{ fontSize: 44 }}>{t('thank_you')}</h1>
      <p style={{ color: 'var(--sub)', fontSize: 17, marginTop: 10 }}>
        Your order <strong style={{ color: 'var(--gold-soft)' }}>{orderNumber}</strong> {t('order_received')}.
      </p>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 28, margin: '32px 0', textAlign: 'left' }}>
        <div className="foot-row"><span style={{ color: 'var(--sub)' }}>{t('order_number')}</span><span>{orderNumber}</span></div>
        {total != null && total > 0 && (
          <div className="foot-row"><span style={{ color: 'var(--sub)' }}>Total</span><span>{money(total)}</span></div>
        )}
        {manual && (
          <p style={{ color: 'var(--gold)', fontSize: 14, marginTop: 14 }}>
            Please complete your transfer and upload the payment proof. Our team will confirm
            your order shortly after review.
          </p>
        )}
        {method === 'cod' && (
          <p style={{ color: 'var(--sub)', fontSize: 14, marginTop: 14 }}>
            {t('pay_cash_delivered')}
          </p>
        )}
        {isCard && !paymentFailed && (
          <p style={{ color: 'var(--sub)', fontSize: 14, marginTop: 14 }}>
            Thank you! Your payment is being confirmed. You'll receive your order shortly. 🕯️
          </p>
        )}
        {paymentFailed && (
          <p style={{ color: 'var(--gold)', fontSize: 14, marginTop: 14 }}>
            We couldn't confirm your payment yet. If you were charged, don't worry — contact us and we'll sort it out right away.
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link to="/shop" className="btn btn-gold">{t('continue_shopping')}</Link>
        <a href="https://wa.me/201111151190" className="btn btn-ghost">{t('whatsapp_us')}</a>
      </div>
    </div>
  )
}
