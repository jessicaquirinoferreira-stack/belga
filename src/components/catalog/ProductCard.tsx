import React, { useState } from 'react';
import { Heart, Sparkles, ShoppingBag, Eye, ShieldCheck } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency, calculateCrediario } from '../../lib/financial';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onOpenSimulator: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onOpenSimulator,
}) => {
  const { addToCart } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);

  const crediarioPlan = calculateCrediario({
    totalAmount: product.creditPrice || product.price,
    entryAmount: 0,
    installmentsCount: product.maxInstallments || 12,
    frequency: 'Mensal',
  });

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-orange-500/50 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image container */}
      <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          <span className="bg-orange-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-sm tracking-wider">
            Queen Size
          </span>
          {product.stock <= 3 && product.stock > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              Últimas {product.stock} un.
            </span>
          )}
        </div>

        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
            isFavorite
              ? 'bg-rose-50 text-rose-600 shadow-sm'
              : 'bg-white/80 hover:bg-white text-slate-400 hover:text-rose-500'
          }`}
          aria-label="Favoritar produto"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Quick View Overlay Button */}
        <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
          <button
            onClick={() => onSelect(product)}
            className="px-4 py-2 bg-white/95 hover:bg-white text-slate-900 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform"
          >
            <Eye className="w-3.5 h-3.5 text-orange-600" />
            Ver Detalhes
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider block mb-1">
            {product.categoryName || 'Colchões'}
          </span>
          <h3
            onClick={() => onSelect(product)}
            className="font-extrabold text-slate-900 text-sm sm:text-base group-hover:text-orange-600 transition-colors line-clamp-2 cursor-pointer"
          >
            {product.name}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
            {product.description}
          </p>
        </div>

        {/* Pricing Box */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 font-medium">À vista:</div>
          <div className="text-lg sm:text-xl font-black text-slate-900">
            {formatCurrency(product.price)}
          </div>

          {/* Crediário Box */}
          <div className="mt-2 p-2.5 bg-gradient-to-r from-orange-50 to-amber-50/60 rounded-xl border border-orange-200/60">
            <div className="flex items-center justify-between text-[11px] font-bold text-orange-800">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-600" />
                No Crediário:
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSimulator(product);
                }}
                className="text-[10px] text-blue-700 underline font-semibold hover:text-blue-900"
              >
                Simular
              </button>
            </div>
            <div className="text-sm font-black text-slate-900 mt-0.5">
              12x de {formatCurrency(crediarioPlan.installmentAmount)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => onSelect(product)}
            className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all flex items-center justify-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Detalhes</span>
          </button>

          <button
            onClick={() => addToCart(product, 1)}
            className="py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-1"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Comprar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
