import { useSettings } from '../lib/useSettings'
import Seo from '../components/Seo'

export default function Privacy() {
  const { settings } = useSettings()
  const custom = settings.privacy_html
  const email = settings.contact_email || 'info@divaessentialsgroup.com'

  return (
    <div className="page">
      <Seo title="Privacy Policy — Diva Essentials" description="How Diva Essentials collects, uses, and protects your personal information." path="/privacy" />
      <div className="eyebrow">Legal</div>
      <h1>Privacy Policy</h1>
      {custom ? (
        <div className="page-body" dangerouslySetInnerHTML={{ __html: custom }} />
      ) : (
        <div className="page-body">
          <p>At Diva Essentials, your privacy matters to us. This policy explains what information we collect, how we use it, and the choices you have. By using our website you agree to the practices described below.</p>

          <h2>Information We Collect</h2>
          <p>When you place an order or contact us, we may collect your name, phone number, email address, and delivery address. We also collect basic technical data (such as your device and browsing activity) to improve our website and your shopping experience.</p>

          <h2>How We Use Your Information</h2>
          <p>We use your information to process and deliver your orders, communicate with you about your purchase, provide customer support, and — only if you opt in — send you offers and updates. We never sell your personal data to third parties.</p>

          <h2>Sharing With Service Providers</h2>
          <p>To fulfil your order, we share necessary details with trusted partners such as shipping couriers and payment processors. These partners only receive what they need to perform their service and are required to keep your data secure.</p>

          <h2>Payments</h2>
          <p>Online card payments are processed securely by our payment provider. We do not store your full card details on our servers.</p>

          <h2>Cookies</h2>
          <p>Our website uses cookies and similar technologies to keep your cart working, remember your preferences, and understand how the site is used. You can disable cookies in your browser, though some features may not work as expected.</p>

          <h2>Your Rights</h2>
          <p>You may request to access, correct, or delete the personal information we hold about you at any time. To do so, contact us using the details below.</p>

          <h2>Data Security</h2>
          <p>We take reasonable measures to protect your information from loss, misuse, and unauthorized access. However, no method of transmission over the internet is completely secure.</p>

          <h2>Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please reach out at <strong>{email}</strong>.</p>

          <p style={{ color: 'var(--sub)', fontSize: 14, marginTop: 24 }}>Last updated: {new Date().getFullYear()}</p>
        </div>
      )}
    </div>
  )
}
