import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency, calculateCrediario } from '../../lib/financial';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    openCheckout,
  } = useCart();

  if (!isCartOpen) return null;

  const crediarioPreview = calculateCrediario({
    totalAmount: subtotal,
    entryAmount: 0,
    installmentsCount: 12,
    frequency: 'Mensal',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-600" />
              <h2 className="text-base font-bold text-slate-900">Seu Carrinho</h2>
              <span className="bg-orange-100 text-orange-700 text-xs font-black px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-700 text-base">Seu carrinho está vazio</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Aproveite nossos colchões Queen de alta qualidade e parcele em até 12x no Crediário Belga!
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20"
                >
                  Ver Catálogo de Produtos
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 p-3 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-2xs"
                >
                  <img
                    src={item.product.images[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400&q=80'}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-xl bg-slate-50 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
                      {item.product.name}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      SKU: {item.product.sku}
                    </span>
                    <div className="text-sm font-extrabold text-orange-600 mt-1">
                      {formatCurrency(item.product.price)}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity selector */}
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2.5 py-0.5 text-xs text-slate-600 hover:bg-slate-200"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2.5 py-0.5 text-xs text-slate-600 hover:bg-slate-200"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
              {/* Crediário Highlight Box */}
              <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl">
                <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Facilidade no Crediário Belga:
                </div>
                <div className="mt-1 text-sm font-extrabold text-slate-900">
                  12x de {formatCurrency(crediarioPreview.installmentAmount)}
                </div>
                <div className="text-[11px] text-amber-800/80 mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  Sem necessidade de cartão de crédito. Ficha digital rápida.
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-medium">Subtotal à vista</span>
                <span className="font-black text-slate-900 text-lg">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={openCheckout}
                  className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 group transition-all"
                >
                  <span>Comprar no Crediário ou à Vista</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors text-center"
                >
                  Continuar Escolhendo Produtos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
