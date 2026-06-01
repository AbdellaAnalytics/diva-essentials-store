import { createContext, useContext, useEffect, useState } from 'react'

const UICtx = createContext(null)
export const useUI = () => useContext(UICtx)

// Currency: EGP is base/default. USD is display-only via a fixed rate.
// Swap FIXED_RATE for a live exchange-rate API later — formatter stays the same.
const USD_PER_EGP = 1 / 50 // 1 USD = 50 EGP

export function formatMoney(egp, currency) {
  if (currency === 'USD') {
    return `$${(egp * USD_PER_EGP).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${Math.round(egp).toLocaleString()} EGP`
}

export function UIProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem('diva-theme')
    if (saved) return saved
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [currency, setCurrency] = useState(() =>
    (typeof window !== 'undefined' && localStorage.getItem('diva-currency')) || 'EGP'
  )

  // Apply theme to <html data-theme> so CSS variables switch globally.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('diva-theme', theme) } catch {}
  }, [theme])

  useEffect(() => {
    try { localStorage.setItem('diva-currency', currency) } catch {}
  }, [currency])

  const value = {
    theme,
    currency,
    toggleTheme: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')),
    toggleCurrency: () => setCurrency(c => (c === 'EGP' ? 'USD' : 'EGP')),
    setCurrency,
    money: (egp) => formatMoney(egp, currency),
  }

  return <UICtx.Provider value={value}>{children}</UICtx.Provider>
}
