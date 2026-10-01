import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/home/Hero';
import { CrediarioExplanation } from './components/home/CrediarioExplanation';
import { ProductCatalog } from './components/catalog/ProductCatalog';
import { ProductDetailModal } from './components/catalog/ProductDetailModal';
import { CrediarioSimulatorModal } from './components/crediario/CrediarioSimulatorModal';
import { CartDrawer } from './components/layout/CartDrawer';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthModal } from './components/auth/AuthModal';
import { CinematicIntro } from './components/common/CinematicIntro';
import { PushNotificationPrompt } from './components/common/PushNotificationPrompt';
import { registerPushServiceWorker } from './lib/notifications';
import { 
  subscribeProducts, 
  subscribeCategories, 
  subscribeSettings 
} from './lib/dbService';
import { Product, Category, StoreSettings } from './types';
import { INITIAL_SETTINGS, INITIAL_PRODUCTS, INITIAL_CATEGORIES } from './lib/seedData';
import { BELGA_LOGO_URL } from './lib/branding';
import { updateSEOForSection, updateSEOForProduct } from './lib/seo';
import { 
  Home, 
  ShoppingBag, 
  Sparkles, 
  User, 
  Layers 
} from 'lucide-react';

function MainApp() {
  const { currentUser, isAdmin } = useAuth();
  const { 
    selectedProductForDetail, 
    setSelectedProductForDetail,
    selectedProductForSimulator,
    setSelectedProductForSimulator,
    totalItems,
    setIsCartOpen,
  } = useCart();

  const [activeView, setActiveView] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS as Product[]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES as Category[]);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(false);

  // 5-second Cinematic intro state
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    // Shows on first entry, user can also re-trigger anytime
    return !sessionStorage.getItem('belga_intro_seen');
  });

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'customer-login' | 'customer-register' | 'admin-login'>('customer-login');

  // Real-time store data subscription & Service Worker registration
  useEffect(() => {
    // Register Push Notification Service Worker
    registerPushServiceWorker().catch(() => {});

    const unsubProds = subscribeProducts((prods) => {
      setProducts(prods);
      setLoading(false);
    });
    const unsubCats = subscribeCategories(setCategories);
    const unsubSets = subscribeSettings(setSettings);

    return () => {
      unsubProds();
      unsubCats();
      unsubSets();
    };
  }, []);

  // Dynamic SEO Metatags synchronization based on active section or viewed product
  useEffect(() => {
    if (selectedProductForDetail) {
      updateSEOForProduct(selectedProductForDetail);
    } else {
      updateSEOForSection(activeView, settings);
    }
  }, [activeView, selectedProductForDetail, settings]);

  const handleOpenAuth = (mode: 'customer-login' | 'customer-register' | 'admin-login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleNavigate = (view: string) => {
    if (view === 'admin-login') {
      if (isAdmin) {
        setActiveView('admin');
      } else {
        handleOpenAuth('admin-login');
      }
      return;
    }
    if (view === 'auth') {
      handleOpenAuth('customer-login');
      return;
    }
    if (view === 'portal' && !currentUser) {
      handleOpenAuth('customer-login');
      return;
    }
    if (view === 'intro') {
      setShowIntro(true);
      return;
    }
    if (view === 'simulator') {
      setSelectedProductForSimulator(products[0] || null);
      return;
    }
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleIntroComplete = () => {
    sessionStorage.setItem('belga_intro_seen', 'true');
    setShowIntro(false);
  };

  // If in Admin view
  if (activeView === 'admin' && isAdmin) {
    return <AdminDashboard onExit={() => setActiveView('home')} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-orange-500 selection:text-white pb-20 md:pb-0 relative">
      {/* 5-Second Cinematic Intro */}
      {showIntro && (
        <CinematicIntro
          onComplete={handleIntroComplete}
          logoUrl={BELGA_LOGO_URL}
        />
      )}

      {/* Header */}
      <Header
        settings={settings}
        activeView={activeView}
        setActiveView={handleNavigate}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {activeView === 'portal' && currentUser ? (
          <CustomerPortal
            settings={settings}
            onNavigateHome={() => setActiveView('home')}
          />
        ) : (
          <>
            {/* Home Hero & Highlights (Visible on Home or when viewing catalog) */}
            {activeView === 'home' && (
              <>
                <Hero
                  settings={settings}
                  onExploreProducts={() => {
                    setActiveView('catalog');
                    const catElem = document.getElementById('catalogo');
                    if (catElem) catElem.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onOpenSimulator={() => setSelectedProductForSimulator(products[0] || null)}
                />

                <CrediarioExplanation
                  onOpenSimulator={() => setSelectedProductForSimulator(products[0] || null)}
                  whatsappPhone={settings.whatsapp}
                />
              </>
            )}

            {/* Product Catalog */}
            <ProductCatalog
              products={products}
              categories={categories}
              loading={loading}
              onSelectProduct={(p) => setSelectedProductForDetail(p)}
              onOpenSimulator={(p) => setSelectedProductForSimulator(p)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer settings={settings} onNavigate={handleNavigate} />

      {/* Mobile Bottom Quick Navigation Bar (Smartphone App-like feel) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => handleNavigate('home')}
          className={`flex flex-col items-center gap-0.5 p-1.5 transition-colors ${
            activeView === 'home' ? 'text-orange-600 font-bold' : 'text-slate-600'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Início</span>
        </button>

        <button
          onClick={() => handleNavigate('catalog')}
          className={`flex flex-col items-center gap-0.5 p-1.5 transition-colors ${
            activeView === 'catalog' ? 'text-orange-600 font-bold' : 'text-slate-600'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px]">Produtos</span>
        </button>

        <button
          onClick={() => handleNavigate('simulator')}
          className="flex flex-col items-center gap-0.5 p-1.5 text-slate-600 hover:text-orange-600 transition-colors"
        >
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span className="text-[10px]">Crediário</span>
        </button>

        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center gap-0.5 p-1.5 text-slate-600 hover:text-orange-600 transition-colors relative"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px]">Carrinho</span>
          {totalItems > 0 && (
            <span className="absolute top-1 right-2 bg-orange-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>

        <button
          onClick={() => handleNavigate(currentUser ? 'portal' : 'auth')}
          className={`flex flex-col items-center gap-0.5 p-1.5 transition-colors ${
            activeView === 'portal' ? 'text-blue-700 font-bold' : 'text-slate-600'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">{currentUser ? 'Conta' : 'Entrar'}</span>
        </button>
      </nav>

      {/* Modals & Overlays */}
      <ProductDetailModal
        product={selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        onOpenSimulator={(p) => {
          setSelectedProductForDetail(null);
          setSelectedProductForSimulator(p);
        }}
        settings={settings}
      />

      {selectedProductForSimulator && (
        <CrediarioSimulatorModal
          product={selectedProductForSimulator}
          products={products}
          onClose={() => setSelectedProductForSimulator(null)}
        />
      )}

      <CartDrawer />

      <CheckoutModal
        settings={settings}
        onOrderCompleted={() => {
          setActiveView('portal');
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(wasAdmin) => {
          if (wasAdmin) {
            setActiveView('admin');
          } else {
            setActiveView('portal');
          }
        }}
      />

      {/* Push Notification Opt-In Prompt */}
      <PushNotificationPrompt />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
