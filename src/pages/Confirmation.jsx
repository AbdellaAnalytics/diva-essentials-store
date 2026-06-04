import { Link, useLocation } from 'react-router-dom'
import { useUI } from '../context/UIContext'
import { useLang } from '../context/LangContext'
import { CheckCircle } from 'lucide-react'

export default function Confirmation() {
  const { money } = useUI()
  const { t } = useLang()
  const { state } = useLocation()
  const order = state || { orderNumber: 'DE-XXXXXXXX', method: 'cod', total: 0 }

  const manual = order.method === 'instapay' || order.method === 'vodafone_cash'

  return (
    <div className="container" style={{ padding: '90px 24px', maxWidth: 620, textAlign: 'center' }}>
      <CheckCircle size={64} color="var(--gold)" strokeWidth={1.2} style={{ margin: '0 auto 22px' }} />
      <h1 className="serif" style={{ fontSize: 44 }}>{t('thank_you')}</h1>
      <p style={{ color: 'var(--sub)', fontSize: 17, marginTop: 10 }}>
        Your order <strong style={{ color: 'var(--gold-soft)' }}>{order.orderNumber}</strong> {t('order_received')}.
      </p>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 28, margin: '32px 0', textAlign: 'left' }}>
        <div className="foot-row"><span style={{ color: 'var(--sub)' }}>{t('order_number')}</span><span>{order.orderNumber}</span></div>
        <div className="foot-row"><span style={{ color: 'var(--sub)' }}>Total</span><span>{money(order.total)}</span></div>
        {manual && (
          <p style={{ color: 'var(--gold)', fontSize: 14, marginTop: 14 }}>
            Please complete your transfer and upload the payment proof. Our team will confirm
            your order shortly after review.
          </p>
        )}
        {order.method === 'cod' && (
          <p style={{ color: 'var(--sub)', fontSize: 14, marginTop: 14 }}>
            {t('pay_cash_delivered')}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link to="/shop" className="btn btn-gold">{t('continue_shopping')}</Link>
        <a href="https://wa.me/201147397783" className="btn btn-ghost">{t('whatsapp_us')}</a>
      </div>
    </div>
  )
}
