import { useSettings } from '../lib/useSettings'
import Seo from '../components/Seo'

const PHONE = '01111151190'
const EMAIL = 'info@divaessentialsgroup.com'

export default function Returns() {
  const { settings } = useSettings()
  const custom = settings.returns_html

  return (
    <div className="page">
      <Seo title="Returns & Replacement — Diva Essentials" description="Diva Essentials returns, replacement and refund policy for handmade candles." path="/returns" />
      <div className="eyebrow">Customer Care</div>
      <h1>Returns &amp; Replacement Policy</h1>
      {custom ? (
        <div className="page-body" dangerouslySetInnerHTML={{ __html: custom }} />
      ) : (
        <div className="page-body">
          <p>
            Your satisfaction means everything to us. Each Diva Essentials candle is
            hand-poured with care, and we want you to love what arrives at your door.
            If something isn't right, we're here to make it right. Please review our policy below.
          </p>

          <h2>Damaged or Defective Items</h2>
          <p>
            If your candle arrives damaged, broken, or defective, please contact us within
            <strong> 48 hours</strong> of delivery. Include a clear photo of the damaged item
            and your order number. Once verified, we'll arrange a <strong>free replacement</strong> or
            a <strong>full refund</strong> — whichever you prefer. There's no need to return the
            damaged item unless we ask.
          </p>

          <h2>Wrong Item Received</h2>
          <p>
            If you received the wrong product, contact us within <strong>48 hours</strong> of
            delivery with your order number and a photo. We'll send the correct item at no extra
            cost and arrange to collect the incorrect one.
          </p>

          <h2>Returns &amp; Exchanges</h2>
          <p>
            Because our candles are handmade and scent-sensitive products, we can only accept
            returns or exchanges on items that are:
          </p>
          <ul>
            <li>Unused and unburned.</li>
            <li>In their original, unopened packaging.</li>
            <li>Requested within <strong>7 days</strong> of delivery.</li>
          </ul>
          <p>
            To request a return or exchange, contact us with your order number and reason.
            Once approved, we'll guide you through the next steps. Please note that return
            shipping costs are the customer's responsibility unless the item was damaged,
            defective, or incorrect.
          </p>

          <h2>Non-Returnable Items</h2>
          <p>For hygiene and safety reasons, we cannot accept returns on:</p>
          <ul>
            <li>Candles that have been used, lit, or opened.</li>
            <li>Items returned without original packaging.</li>
            <li>Items returned after the 7-day window.</li>
            <li>Sale or clearance items (unless damaged or defective).</li>
          </ul>

          <h2>Refunds</h2>
          <p>
            Once your return is received and inspected, we'll notify you of the approval status.
            Approved refunds are processed to your original payment method, or as store credit
            if you prefer.
          </p>
          <ul>
            <li><strong>Cash on Delivery orders:</strong> refunds are issued via bank transfer or store credit.</li>
            <li><strong>Card / online payments:</strong> refunds are returned to the original card. Please allow a few business days for the amount to appear, depending on your bank.</li>
          </ul>
          <p>
            Shipping fees are non-refundable except where the item was damaged, defective, or incorrect.
          </p>

          <h2>Order Cancellations</h2>
          <p>
            You may cancel your order <strong>before it has been shipped</strong>. Once an order is
            out for delivery, it can no longer be cancelled, but you may refuse it at the door or
            follow our return process after delivery.
          </p>

          <h2>How to Request a Return or Replacement</h2>
          <ul>
            <li>Contact us at <strong>{EMAIL}</strong> or via WhatsApp / phone.</li>
            <li>Include your <strong>order number</strong>, a brief description, and photos if the item is damaged.</li>
            <li>Our team will respond within 1–2 business days with next steps.</li>
          </ul>

          <h2>Contact Us</h2>
          <p>
            <strong>Phone:</strong> <a href={`tel:${PHONE}`} style={{ color: 'var(--gold-deep)' }}>{PHONE}</a><br />
            <strong>Email:</strong> <a href={`mailto:${EMAIL}`} style={{ color: 'var(--gold-deep)' }}>{EMAIL}</a><br />
            <strong>Location:</strong> Cairo, Egypt
          </p>
          <p style={{ marginTop: 16 }}>Thank you for choosing Diva Essentials. Elegance never ends. ✨</p>
        </div>
      )}
    </div>
  )
}
