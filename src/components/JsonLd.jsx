import { useEffect } from 'react'

const SITE = 'https://divaessentialsgroup.com'

// Injects a <script type="application/ld+json"> into <head> so Google can show
// rich results (product price, availability, brand, breadcrumbs). Cleans up on unmount.
export default function JsonLd({ data, id = 'jsonld' }) {
  useEffect(() => {
    if (!data) return
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = id
    el.text = JSON.stringify(data)
    document.head.appendChild(el)
    return () => { document.getElementById(id)?.remove() }
  }, [data, id])
  return null
}

// Builders — keep the shapes in one place.
export function productSchema(p, priceStr) {
  const img = Array.isArray(p.images) && p.images[0] ? p.images[0] : `${SITE}/favicon-512.png`
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description || `${p.name} — hand-poured luxury soy candle by Diva Essentials.`,
    image: img,
    sku: p.sku || undefined,
    brand: { '@type': 'Brand', name: 'Diva Essentials' },
    category: p.category_name || 'Candles',
    offers: {
      '@type': 'Offer',
      url: `${SITE}/product/${p.slug}`,
      priceCurrency: 'EGP',
      price: Number(p.price).toFixed(2),
      availability: (p.stock > 0)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Diva Essentials' },
    },
  }
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'Diva Essentials',
    description: 'Hand-poured luxury scented soy candles, crafted in Egypt.',
    url: SITE,
    logo: `${SITE}/favicon-512.png`,
    image: `${SITE}/favicon-512.png`,
    address: { '@type': 'PostalAddress', addressLocality: 'Cairo', addressCountry: 'EG' },
    email: 'info@divaessentialsgroup.com',
  }
}
