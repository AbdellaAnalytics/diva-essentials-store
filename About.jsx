// Fallback catalog — the real Diva Essentials product line.
// Mirrors the Supabase seed data so the storefront renders fully even
// before env keys are set. Once Supabase is connected, live data overrides this.
export const FALLBACK_PRODUCTS = [
  {
    id: 1, slug: 'lavender-whisper-100ml', name: 'Lavender Whisper',
    category_name: '100ml Glass Jar', category_slug: 'glass-jar-100ml',
    sku: 'DIVA-LW-100',
    scent_notes: 'Fresh Lavender · Herbal Lavender · Soft Musk',
    description: 'A calming blend of pure lavender essential oil, crafted to melt away stress and bring peace to your space. Made with 100% natural soy wax, it fills your room with a soft, calming fragrance perfect for bedtime, meditation, or unwinding after a long day.',
    burn_time: '40+ hours', weight_grams: 100, volume_ml: 100,
    price: 290, compare_price: null, stock: 30, is_featured: false,
  },
  {
    id: 2, slug: 'vanilla-dreem-100ml', name: 'Vanilla Dreem',
    category_name: '100ml Glass Jar', category_slug: 'glass-jar-100ml',
    sku: 'DIVA-VD-100',
    scent_notes: 'Sweet Vanilla Cream · Warm Caramel · Soft Sandalwood',
    description: 'A warm, comforting vanilla scent that wraps your home in sweetness. Made with 100% natural soy wax and pure vanilla essential oil, its rich creamy scent transforms any room into a cozy haven — for quiet evenings and self-care Sundays.',
    burn_time: '40+ hours', weight_grams: 100, volume_ml: 100,
    price: 290, compare_price: null, stock: 30, is_featured: false,
  },
  {
    id: 3, slug: 'tulip-whisper-100ml', name: 'Tulip Whisper',
    category_name: '100ml Glass Jar', category_slug: 'glass-jar-100ml',
    sku: 'DIVA-TW-100',
    scent_notes: 'Fresh Tulip Petals · Light Peony · Clean White Musk',
    description: 'A fresh, feminine floral scent inspired by spring blooms. Crafted with 100% natural soy wax and pure floral essential oils, it fills your space with a light, mood-lifting fragrance — perfect for mornings and daily use.',
    burn_time: '40+ hours', weight_grams: 100, volume_ml: 100,
    price: 290, compare_price: null, stock: 30, is_featured: false,
  },
  {
    id: 4, slug: 'lavender-musk-160ml', name: 'Lavender Musk',
    category_name: '160ml Tin Can', category_slug: 'tin-can-160ml',
    sku: 'DIVA-LM-160',
    scent_notes: 'Fresh Lavender Fields · Soft Floral Heart · Warm Musk & Amber',
    description: 'A sophisticated blend of calming lavender and deep musky warmth. This premium 160ml double-wick candle pairs soothing lavender with rich, sensual musk for a longer burn and larger throw — ideal for living rooms, open spaces, or gifting.',
    burn_time: '50+ hours', weight_grams: 160, volume_ml: 160,
    price: 290, compare_price: null, stock: 25, is_featured: false,
  },
  {
    id: 5, slug: 'vanilla-rose-160ml', name: 'Vanilla Rose',
    category_name: '160ml Tin Can', category_slug: 'tin-can-160ml',
    sku: 'DIVA-VR-160',
    scent_notes: 'Fresh Rose Petals · Creamy Vanilla Heart · Warm Sandalwood & Musk',
    description: 'The perfect harmony of sweet vanilla and romantic rose — a timeless, feminine scent in a premium 160ml double-wick tin. Romance in a tin, perfect for special evenings, self-care, or gifting. Our bestseller.',
    burn_time: '50+ hours', weight_grams: 160, volume_ml: 160,
    price: 290, compare_price: null, stock: 25, is_featured: true, is_bestseller: true,
  },
  {
    id: 6, slug: 'autumn-woods-160ml', name: 'Autumn Woods',
    category_name: '160ml Tin Can', category_slug: 'tin-can-160ml',
    sku: 'DIVA-AW-160',
    scent_notes: 'Cinnamon & Clove · Cedarwood & Pine · Deep Sandalwood & Amber',
    description: 'A deep, warm blend of woody notes and autumn spices that turns your home into a cozy forest retreat. This premium 160ml double-wick candle evokes crackling fireplaces and fallen leaves — for winter evenings and grounding moments.',
    burn_time: '50+ hours', weight_grams: 160, volume_ml: 160,
    price: 290, compare_price: null, stock: 25, is_featured: false,
  },
]

export const CATEGORIES = [
  { slug: 'glass-jar-100ml', name: '100ml Glass Jar' },
  { slug: 'tin-can-160ml', name: '160ml Tin Can' },
]
