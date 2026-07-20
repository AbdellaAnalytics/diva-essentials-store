// Meta (Facebook) Pixel — loads once from the Pixel ID stored in settings,
// then exposes helpers to fire standard e-commerce events.

let loaded = false
let currentId = null

// Inject the standard Meta Pixel base code with the given ID.
export function initMetaPixel(pixelId) {
  if (!pixelId || typeof window === 'undefined') return
  if (loaded && currentId === pixelId) return
  currentId = pixelId

  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return
    n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }
    if (!f._fbq) f._fbq = n
    n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []
    t = b.createElement(e); t.async = !0; t.src = v
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
  /* eslint-enable */

  window.fbq('init', pixelId)
  window.fbq('track', 'PageView')
  loaded = true
}

// Fire a standard event (no-op if pixel isn't loaded).
export function pixelTrack(event, params = {}) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, params)
  }
}

// Convenience wrappers for the key funnel events.
export const Pixel = {
  pageView: () => pixelTrack('PageView'),
  viewContent: (p) => pixelTrack('ViewContent', {
    content_ids: [String(p.id)], content_name: p.name,
    content_type: 'product', value: Number(p.price) || 0, currency: 'EGP',
  }),
  addToCart: (p, qty = 1) => pixelTrack('AddToCart', {
    content_ids: [String(p.id)], content_name: p.name,
    content_type: 'product', value: (Number(p.price) || 0) * qty, currency: 'EGP',
  }),
  initiateCheckout: (items, total) => pixelTrack('InitiateCheckout', {
    content_ids: items.map(i => String(i.id)), content_type: 'product',
    num_items: items.reduce((n, i) => n + i.qty, 0), value: Number(total) || 0, currency: 'EGP',
  }),
  purchase: (orderNumber, items, total) => pixelTrack('Purchase', {
    content_ids: items.map(i => String(i.id)), content_type: 'product',
    value: Number(total) || 0, currency: 'EGP', order_id: orderNumber,
  }),
}
