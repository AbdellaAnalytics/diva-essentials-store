import { createContext, useContext, useState, useEffect } from 'react'

const LangCtx = createContext(null)
export const useLang = () => useContext(LangCtx)

// UI string dictionary. Add keys as needed; missing keys fall back to the key text.
const STRINGS = {
  en: {
    shop_all: 'Shop All', cart: 'Cart', account: 'Account', checkout: 'Checkout',
    add_to_cart: 'Add to Cart', sold_out: 'Sold Out', view_all: 'View All Candles',
    the_collection: 'The Collection', our_candles: 'Our Candles',
    subtotal: 'Subtotal', total: 'Total', shipping: 'Shipping', free: 'Free',
    discount_code: 'Discount code', apply: 'Apply', proceed_checkout: 'Proceed to Checkout',
    your_cart_empty: 'Your cart is empty.', continue_shopping: 'Continue shopping',
    people_also_bought: 'People Also Bought', add: 'Add',
    full_name: 'Full Name', phone: 'Phone', email: 'Email', address: 'Street Address',
    city: 'City / Governorate', order_notes: 'Order Notes', optional: 'optional',
    contact: 'Contact', delivery_address: 'Delivery Address', payment_method: 'Payment Method',
    order_summary: 'Order Summary', place_order: 'Place Order', secure_checkout: 'Secure checkout · Your details are protected',
    almost_there: 'Almost there', thank_you: 'Thank you', order_received: 'has been received',
    about_us: 'About Us', returns: 'Returns & Replacement', my_account: 'My Account',
    free_shipping: 'Free Shipping', cod: 'Cash on Delivery', pay_on_delivery: 'Pay when it arrives',
    // product page
    description: 'Description', quantity: 'Quantity', buy_now: 'Buy Now', in_stock: 'In Stock',
    scent_notes: 'Scent Notes', related_products: 'You May Also Like',
    // cart / rewards
    your_cart: 'Cart', reserved: 'Your items are reserved just for you',
    exclusive_discount: 'Exclusive Discount', away_from: 'away from', unlocked_all: "You've unlocked every reward",
    // confirmation
    order_number: 'Order Number', whatsapp_us: 'WhatsApp Us', pay_cash_delivered: "You'll pay in cash when your candles are delivered.",
    // footer
    shop: 'Shop', help: 'Help', all_candles: 'All Candles', rights_reserved: 'All rights reserved.',
    footer_tagline: 'Hand-poured luxury scented candles, crafted in Egypt.',
    // payments
    paymob: 'Paymob', instapay: 'InstaPay / Bank', vodafone_cash: 'Vodafone Cash', card: 'Credit / Debit Card',
    // generic
    home: 'Home', loading: 'Loading…', search: 'Search',
    no_results: 'No candles match', clear_search: 'Clear search',
  },
  ar: {
    shop_all: 'كل المنتجات', cart: 'السلة', account: 'حسابي', checkout: 'الدفع',
    add_to_cart: 'أضف للسلة', sold_out: 'نفذت الكمية', view_all: 'شاهد كل الشموع',
    the_collection: 'المجموعة', our_candles: 'شموعنا',
    subtotal: 'المجموع الفرعي', total: 'الإجمالي', shipping: 'الشحن', free: 'مجاني',
    discount_code: 'كود الخصم', apply: 'تطبيق', proceed_checkout: 'إتمام الطلب',
    your_cart_empty: 'سلتك فارغة.', continue_shopping: 'تابع التسوق',
    people_also_bought: 'اشترى العملاء أيضاً', add: 'أضف',
    full_name: 'الاسم بالكامل', phone: 'رقم الهاتف', email: 'البريد الإلكتروني', address: 'العنوان',
    city: 'المدينة / المحافظة', order_notes: 'ملاحظات الطلب', optional: 'اختياري',
    contact: 'بيانات التواصل', delivery_address: 'عنوان التوصيل', payment_method: 'طريقة الدفع',
    order_summary: 'ملخص الطلب', place_order: 'تأكيد الطلب', secure_checkout: 'دفع آمن · بياناتك محمية',
    almost_there: 'خطوة أخيرة', thank_you: 'شكراً لك', order_received: 'تم استلام طلبك',
    about_us: 'من نحن', returns: 'الاستبدال والإرجاع', my_account: 'حسابي',
    free_shipping: 'شحن مجاني', cod: 'الدفع عند الاستلام', pay_on_delivery: 'ادفع عند الاستلام',
    // product page
    description: 'الوصف', quantity: 'الكمية', buy_now: 'اشترِ الآن', in_stock: 'متوفر',
    scent_notes: 'مكونات العطر', related_products: 'قد يعجبك أيضاً',
    // cart / rewards
    your_cart: 'السلة', reserved: 'منتجاتك محجوزة لك',
    exclusive_discount: 'خصم حصري', away_from: 'يفصلك عن', unlocked_all: 'لقد فتحت كل المكافآت',
    // confirmation
    order_number: 'رقم الطلب', whatsapp_us: 'راسلنا واتساب', pay_cash_delivered: 'هتدفع كاش لما الشموع توصلك.',
    // footer
    shop: 'تسوّق', help: 'مساعدة', all_candles: 'كل الشموع', rights_reserved: 'جميع الحقوق محفوظة.',
    footer_tagline: 'شموع عطرية فاخرة مصنوعة يدوياً في مصر.',
    // payments
    paymob: 'باي موب', instapay: 'إنستاباي / تحويل بنكي', vodafone_cash: 'فودافون كاش', card: 'بطاقة ائتمان / خصم',
    // generic
    home: 'الرئيسية', loading: 'جاري التحميل…', search: 'ابحث عن منتج',
    no_results: 'مفيش منتجات مطابقة لـ', clear_search: 'مسح البحث',
  },
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => (typeof window !== 'undefined' && localStorage.getItem('diva-lang')) || 'en')

  useEffect(() => {
    try { localStorage.setItem('diva-lang', lang) } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    }
  }, [lang])

  const t = (key) => (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key
  const toggleLang = () => setLang(l => (l === 'ar' ? 'en' : 'ar'))

  return (
    <LangCtx.Provider value={{ lang, setLang, toggleLang, t, dir: lang === 'ar' ? 'rtl' : 'ltr' }}>
      {children}
    </LangCtx.Provider>
  )
}
