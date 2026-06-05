import { useSettings } from '../lib/useSettings'
import Seo from '../components/Seo'

export default function Terms() {
  const { settings } = useSettings()
  const custom = settings.terms_html
  const email = settings.contact_email || 'info@divaessentialsgroup.com'

  return (
    <div className="page">
      <Seo title="Terms & Conditions — Diva Essentials" description="The terms that govern your use of the Diva Essentials website and your purchases." path="/terms" />
      <div className="eyebrow">Legal</div>
      <h1>Terms &amp; Conditions</h1>
      {custom ? (
        <div className="page-body" dangerouslySetInnerHTML={{ __html: custom }} />
      ) : (
        <div className="page-body">
          <p>Welcome to Diva Essentials. By accessing our website and placing an order, you agree to the following terms. Please read them carefully.</p>

          <h2>Products & Availability</h2>
          <p>We do our best to display our candles, their colors, and scents as accurately as possible. Slight variations may occur as our products are hand-poured in small batches. All products are subject to availability.</p>

          <h2>Pricing</h2>
          <p>All prices are listed in Egyptian Pounds (EGP) unless otherwise stated. We reserve the right to change prices at any time, but changes will not affect orders already confirmed.</p>

          <h2>Orders</h2>
          <p>Once you place an order, you'll receive a confirmation with your order number. We reserve the right to refuse or cancel any order in cases such as suspected fraud, inaccurate information, or product unavailability.</p>

          <h2>Payment</h2>
          <p>We accept Cash on Delivery and online payment methods shown at checkout. For bank transfer or wallet payments, your order is confirmed once payment is verified.</p>

          <h2>Shipping & Delivery</h2>
          <p>Delivery times and fees vary by location and are shown at checkout. We are not responsible for delays caused by the courier or circumstances beyond our control.</p>

          <h2>Returns & Replacements</h2>
          <p>Please see our Returns &amp; Replacement Policy for full details on damaged items, returns, and refunds.</p>

          <h2>Use of the Website</h2>
          <p>You agree not to misuse our website or attempt to access it in any unauthorized way. All content, including logos, images, and text, is the property of Diva Essentials and may not be used without permission.</p>

          <h2>Limitation of Liability</h2>
          <p>Candles are open-flame products. Please follow all safety instructions on the label. Diva Essentials is not liable for damage or injury resulting from improper use.</p>

          <h2>Contact Us</h2>
          <p>For any questions about these terms, contact us at <strong>{email}</strong>.</p>

          <p style={{ color: 'var(--sub)', fontSize: 14, marginTop: 24 }}>Last updated: {new Date().getFullYear()}</p>
        </div>
      )}
    </div>
  )
}
