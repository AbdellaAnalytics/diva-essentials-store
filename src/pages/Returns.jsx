import { useSettings } from '../lib/useSettings'

export default function Returns() {
  const { settings } = useSettings()
  const custom = settings.returns_html

  return (
    <div className="page">
      <div className="eyebrow">Customer Care</div>
      <h1>Returns &amp; Replacement Policy</h1>
      {custom ? (
        <div className="page-body" dangerouslySetInnerHTML={{ __html: custom }} />
      ) : (
        <div className="page-body">
          <p>
            Your satisfaction matters to us. If something isn't right with your order,
            we're here to make it right. Please review our policy below.
          </p>

          <h2>Damaged or Defective Items</h2>
          <p>
            If your candle arrives damaged, broken, or defective, contact us within
            <strong> 48 hours</strong> of delivery with a photo of the item and your order
            number. We'll arrange a free replacement or a full refund.
          </p>

          <h2>Returns</h2>
          <p>
            Due to the nature of our products, we accept returns only on unused, unopened
            items in their original packaging, within <strong>7 days</strong> of delivery.
            Used or partially burned candles cannot be returned for hygiene and safety
            reasons.
          </p>

          <h2>How to Request a Return or Replacement</h2>
          <ul>
            <li>Message us on WhatsApp or email with your order number.</li>
            <li>Include a brief description and photos if the item is damaged.</li>
            <li>Our team will respond within 1–2 business days with next steps.</li>
          </ul>

          <h2>Refunds</h2>
          <p>
            Once your return is approved and received (where applicable), refunds are
            processed to your original payment method or as store credit, typically within
            5–7 business days.
          </p>

          <h2>Shipping Costs</h2>
          <p>
            Original shipping fees are non-refundable except in cases of damaged or
            incorrect items, where we cover all return shipping costs.
          </p>

          <h2>Need Help?</h2>
          <p>
            Reach out any time — we're happy to help. Contact us on
            {' '}<a href={`https://wa.me/${(settings.whatsapp || '').replace(/[^0-9]/g, '')}`} style={{ color: 'var(--gold-deep)' }}>WhatsApp</a>{' '}
            and our team will take care of you.
          </p>
        </div>
      )}
    </div>
  )
}
