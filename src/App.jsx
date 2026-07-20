import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PixelProvider from './components/PixelProvider'
import { lazy, Suspense } from 'react'
import { CartProvider } from './context/CartContext'
import { UIProvider } from './context/UIContext'
import { LangProvider } from './context/LangContext'
import { CartDrawer } from './components/Shop'
import Header from './components/Header'
import AnnouncementBar from './components/AnnouncementBar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Product from './pages/Product'
import Checkout from './pages/Checkout'
import Confirmation from './pages/Confirmation'
import Account from './pages/Account'
import About from './pages/About'
import Returns from './pages/Returns'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'

// Admin (with its heavy chart/PDF libs) is split into its own chunk and only
// loaded when visiting /admin — the storefront stays lightweight.
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'))

// Storefront layout (header + cart + footer) wraps the shopping routes.
function Storefront({ children }) {
  return (
    <UIProvider>
      <LangProvider>
      <CartProvider>
        <AnnouncementBar />
        <Header />
        <CartDrawer />
        <main style={{ minHeight: '60vh' }}>{children}</main>
        <Footer />
      </CartProvider>
      </LangProvider>
    </UIProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <PixelProvider />
      <Routes>
        {/* Admin runs standalone, no storefront chrome */}
        <Route path="/admin" element={
          <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Jost, sans-serif', color: '#8a8173' }}>Loading dashboard…</div>}>
            <AdminDashboard />
          </Suspense>
        } />

        {/* Storefront */}
        <Route path="/" element={<Storefront><Home /></Storefront>} />
        <Route path="/shop" element={<Storefront><Shop /></Storefront>} />
        <Route path="/product/:slug" element={<Storefront><Product /></Storefront>} />
        <Route path="/checkout" element={<Storefront><Checkout /></Storefront>} />
        <Route path="/confirmation" element={<Storefront><Confirmation /></Storefront>} />
        <Route path="/account" element={<Storefront><Account /></Storefront>} />
        <Route path="/about" element={<Storefront><About /></Storefront>} />
        <Route path="/returns" element={<Storefront><Returns /></Storefront>} />
        <Route path="/privacy" element={<Storefront><Privacy /></Storefront>} />
        <Route path="/terms" element={<Storefront><Terms /></Storefront>} />
      </Routes>
    </BrowserRouter>
  )
}
