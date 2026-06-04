import { useEffect } from 'react'

const SITE = 'Diva Essentials'
const BASE = 'https://divaessentialsgroup.com'

// Lightweight SEO: updates <title> and meta tags when a page mounts.
export default function Seo({ title, description, path = '', image }) {
  useEffect(() => {
    const fullTitle = title || `${SITE} — Luxury Scented Candles`
    document.title = fullTitle

    const set = (selector, attr, value) => {
      let el = document.head.querySelector(selector)
      if (!el) {
        el = document.createElement('meta')
        const [k, v] = selector.replace('meta[', '').replace(']', '').split('=')
        el.setAttribute(k, v.replace(/["']/g, ''))
        document.head.appendChild(el)
      }
      el.setAttribute(attr, value)
    }

    if (description) {
      set('meta[name="description"]', 'content', description)
      set('meta[property="og:description"]', 'content', description)
    }
    set('meta[property="og:title"]', 'content', fullTitle)
    set('meta[property="og:type"]', 'content', 'website')
    set('meta[property="og:site_name"]', 'content', SITE)
    set('meta[property="og:url"]', 'content', BASE + path)
    if (image) {
      set('meta[property="og:image"]', 'content', image)
      set('meta[name="twitter:card"]', 'content', 'summary_large_image')
    }

    // canonical
    let link = document.head.querySelector('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link) }
    link.setAttribute('href', BASE + path)
  }, [title, description, path, image])

  return null
}
