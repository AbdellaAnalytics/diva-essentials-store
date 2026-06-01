import { useSettings } from '../lib/useSettings'

export default function About() {
  const { settings } = useSettings()
  const custom = settings.about_html

  return (
    <div className="page">
      <div className="eyebrow">Our Story</div>
      <h1>About Diva Essentials</h1>
      {custom ? (
        <div className="page-body" dangerouslySetInnerHTML={{ __html: custom }} />
      ) : (
        <div className="page-body">
          <p>
            Diva Essentials began with a simple belief: that scent has the power to
            transform a space, shift a mood, and turn an ordinary moment into something
            worth savoring. Every candle we make is hand-poured in small batches, using
            clean soy wax and carefully composed fragrance oils.
          </p>
          <h2>Crafted with Care</h2>
          <p>
            We obsess over the details — the purity of the wax, the balance of each
            fragrance, the steady, even burn. Our candles are designed not just to smell
            beautiful, but to last, filling your home with warmth from the first light to
            the very last.
          </p>
          <h2>Made for Your Everyday Luxury</h2>
          <p>
            Whether it's a quiet evening alone, a gathering with the people you love, or a
            gift for someone special, Diva Essentials is here to make the moment feel
            considered. We're proud to bring a touch of accessible luxury to homes across
            Egypt and beyond.
          </p>
          <h2>Our Promise</h2>
          <p>
            Quality you can feel, fragrances you'll return to, and a brand that treats
            every order — and every customer — with genuine care.
          </p>
          <p style={{ fontStyle: 'italic', fontFamily: "'Fraunces', serif", color: 'var(--gold-deep)' }}>
            — The Diva Essentials Team
          </p>
        </div>
      )}
    </div>
  )
}
