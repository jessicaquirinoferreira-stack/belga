import React, { useState } from 'react';
import { 
  ShoppingBag, 
  User, 
  Menu, 
  X, 
  FileText, 
  Phone, 
  Sparkles,
  ShieldCheck,
  Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { StoreSettings } from '../../types';
import { BELGA_LOGO_URL } from '../../lib/branding';

interface HeaderProps {
  settings: StoreSettings;
  activeView: string;
  setActiveView: (view: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeView,
  setActiveView,
  searchQuery,
  setSearchQuery,
}) => {
  const { currentUser, userProfile, isAdmin, signOut } = useAuth();
  const { totalItems, setIsCartOpen, setSelectedProductForSimulator } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (view: string) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top micro announcement bar */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-blue-700 text-white text-xs py-1.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">
              Crediário Belga
            </span>
            <span className="hidden sm:inline">Compre sem burocracia em até 12x no carnê ou semanal/quinzenal!</span>
            <span className="sm:hidden">Crediário próprio em até 12x!</span>
          </div>
          <div className="flex items-center gap-4 text-white/90 text-xs">
            <a
              href={`https://wa.me/55${settings.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              <Phone className="w-3 h-3" />
              <span className="hidden md:inline">WhatsApp Vendas:</span>
              <span className="font-semibold">{settings.whatsapp || '(21) 97393-4438'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo Belga Móveis Oficial - Maior, Nítida e Legível */}
          <button
            onClick={() => handleNav('home')}
            className="flex items-center gap-2.5 sm:gap-3.5 text-left group focus:outline-none cursor-pointer py-1"
            title="Belga Móveis - Página Inicial"
          >
            {/* Logo Livre e Ampliada */}
            <img
              src={BELGA_LOGO_URL}
              alt="Belga Móveis"
              className="h-14 sm:h-16 md:h-17 w-auto max-w-[180px] sm:max-w-[220px] object-contain drop-shadow-sm group-hover:scale-105 transition-all duration-300"
            />
            
            <div className="hidden sm:block border-l border-slate-200/90 pl-3">
              <div className="flex items-center gap-1 leading-none">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
                  BELGA
                </span>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-blue-800">
                  MÓVEIS
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-bold text-orange-600 tracking-wide line-clamp-1 mt-1">
                {settings.slogan || 'Seu lar mais completo!'}
              </p>
            </div>
          </button>

          {/* Search bar desktop */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Buscar colchões Queen, sofás, camas..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeView !== 'catalog' && activeView !== 'home') {
                    setActiveView('catalog');
                  }
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-sm rounded-full border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => handleNav('home')}
              className={`text-sm font-semibold transition-colors ${
                activeView === 'home' ? 'text-orange-600' : 'text-slate-700 hover:text-orange-600'
              }`}
            >
              Início
            </button>
            <button
              onClick={() => handleNav('catalog')}
              className={`text-sm font-semibold transition-colors ${
                activeView === 'catalog' ? 'text-orange-600' : 'text-slate-700 hover:text-orange-600'
              }`}
            >
              Produtos
            </button>
            <button
              onClick={() => {
                setSelectedProductForSimulator(null);
                handleNav('simulator');
              }}
              className="text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Simular Crediário
            </button>
            <button
              onClick={() => handleNav(currentUser ? 'portal' : 'auth')}
              className="text-sm font-semibold text-slate-700 hover:text-blue-700 transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              Meu Crediário
            </button>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {/* User Account Button */}
            {currentUser ? (
              <div className="relative group">
                <button
                  onClick={() => handleNav(isAdmin ? 'admin' : 'portal')}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 hover:border-orange-500/40 bg-slate-50 hover:bg-white text-slate-700 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm">
                    {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="block text-xs font-bold text-slate-800 line-clamp-1 max-w-[100px]">
                      {userProfile?.displayName || 'Minha Conta'}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-medium">
                      {isAdmin ? 'Administrador' : 'Cliente'}
                    </span>
                  </div>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNav('auth')}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition-colors"
              >
                <User className="w-4 h-4" />
                Entrar
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl border border-slate-200 hover:border-orange-500 bg-white text-slate-800 hover:text-orange-600 transition-all shadow-xs"
              aria-label="Ver Carrinho de Compras"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none"
              aria-label="Abrir Menu de Navegação"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="lg:hidden pb-3">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Buscar colchões Queen, camas, sofás..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeView !== 'catalog') setActiveView('catalog');
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 text-sm rounded-xl border border-slate-200 focus:bg-white focus:border-orange-500 outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top duration-200">
          <button
            onClick={() => handleNav('home')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold ${
              activeView === 'home' ? 'bg-orange-50 text-orange-600' : 'text-slate-800'
            }`}
          >
            Início
          </button>
          <button
            onClick={() => handleNav('catalog')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold ${
              activeView === 'catalog' ? 'bg-orange-50 text-orange-600' : 'text-slate-800'
            }`}
          >
            Catálogo de Colchões & Móveis
          </button>
          <button
            onClick={() => {
              setSelectedProductForSimulator(null);
              handleNav('simulator');
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-800 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Simulador de Crediário
          </button>
          <button
            onClick={() => handleNav(currentUser ? 'portal' : 'auth')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-800 flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Meu Crediário & Ficha Digital
          </button>

          {isAdmin && (
            <button
              onClick={() => handleNav('admin')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold text-purple-700 bg-purple-50 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Painel Administrativo
            </button>
          )}

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {currentUser ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">
                  Logado como: <strong>{currentUser.email}</strong>
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNav('auth')}
                className="w-full py-2.5 rounded-xl bg-orange-600 text-white font-bold text-center text-sm shadow-md"
              >
                Entrar ou Criar Conta
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
