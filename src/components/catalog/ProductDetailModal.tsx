import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ShoppingBag, 
  PhoneCall, 
  ShieldCheck, 
  Truck, 
  Check, 
  Share2, 
  Layers, 
  Calendar 
} from 'lucide-react';
import { Product, StoreSettings } from '../../types';
import { formatCurrency, calculateCrediario } from '../../lib/financial';
import { useCart } from '../../context/CartContext';
import { getWhatsAppUrl } from '../../lib/api';
import { updateSEOForProduct } from '../../lib/seo';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenSimulator: (product: Product) => void;
  settings: StoreSettings;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onOpenSimulator,
  settings,
}) => {
  const { addToCart, openCheckout } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Synchronize SEO Meta Tags dynamically when viewing product
  React.useEffect(() => {
    if (product) {
      updateSEOForProduct(product);
    }
  }, [product]);

  if (!product) return null;

  const crediarioPlan = calculateCrediario({
    totalAmount: product.creditPrice || product.price,
    entryAmount: 0,
    installmentsCount: product.maxInstallments || 12,
    frequency: 'Mensal',
  });

  const handleBuyNow = () => {
    addToCart(product, 1);
    onClose();
    openCheckout();
  };

  const handleShareProduct = async () => {
    const shareData = {
      title: `${product.name} | Belga Móveis`,
      text: `${product.name} por ${formatCurrency(product.price)} em até ${product.maxInstallments}x no crediário próprio!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Safe proceed
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleWhatsAppContact = () => {
    const text = `Olá, Belga Móveis! Tenho interesse no *${product.name}* (SKU: ${product.sku}) no valor de ${formatCurrency(product.price)} com opção no crediário. Pode me passar mais detalhes?`;
    const url = getWhatsAppUrl(settings.whatsapp || '21973934438', text);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-slate-800 shadow-md transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Gallery Column */}
            <div className="space-y-4">
              <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs relative">
                <img
                  src={
                    product.images[selectedImageIndex] ||
                    product.images[0] ||
                    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-orange-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md">
                  Queen Size Oficial
                </span>
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                        selectedImageIndex === idx
                          ? 'border-orange-600 scale-105'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Video Player if videoUrl exists */}
              {product.videoUrl && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-700 mb-1.5">Vídeo de Apresentação</h4>
                  <div className="aspect-video rounded-xl overflow-hidden bg-black">
                    <iframe
                      src={product.videoUrl}
                      title="Vídeo do Produto"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Info Column */}
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block mb-1">
                  {product.categoryName || 'Colchões'} • SKU: {product.sku}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {product.name}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <Check className="w-3.5 h-3.5" /> {product.stock > 0 ? `Em estoque (${product.stock} unidades)` : 'Sob encomenda'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Entrega em todo o RJ</span>
                </div>
              </div>

              {/* Price Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50/70 via-amber-50/50 to-white border border-orange-200/80">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 font-bold">À vista no Pix ou Dinheiro:</span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {formatCurrency(product.price)}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-orange-200/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-orange-600" />
                      Condição Especial no Crediário:
                    </span>
                    <button
                      onClick={() => onOpenSimulator(product)}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 underline"
                    >
                      Personalizar Parcelas
                    </button>
                  </div>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    12x de {formatCurrency(crediarioPlan.installmentAmount)}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Também disponível em planos <strong>semanais</strong> e <strong>quinzenais</strong> através da Ficha Digital.
                  </p>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Especificações Técnicas
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Dimensões</span>
                    <span className="font-semibold text-slate-800">
                      {product.specifications?.dimensao || '158 x 198 cm (Queen)'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Estrutura / Molas</span>
                    <span className="font-semibold text-slate-800">
                      {product.specifications?.tipoMola || 'Molas Ensacadas Pocket'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Garantia de Fábrica</span>
                    <span className="font-semibold text-slate-800">
                      {product.specifications?.garantia || '12 meses'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Suporte de Peso</span>
                    <span className="font-semibold text-slate-800">
                      {product.specifications?.pesoSuportado || 'Até 140 kg'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                  Descrição
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Action Buttons as requested in item 12 */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleBuyNow}
                  className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-all text-sm"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>COMPRAR NO CREDIÁRIO OU À VISTA</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onOpenSimulator(product)}
                    className="py-3 px-3 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold rounded-xl border border-blue-200 text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-blue-700" />
                    <span>SIMULAR CREDIÁRIO</span>
                  </button>

                  <button
                    onClick={handleWhatsAppContact}
                    className="py-3 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                    <span>FALAR NO WHATSAPP</span>
                  </button>
                </div>

                {/* Share Product Button using Dynamic SEO Metadata */}
                <button
                  onClick={handleShareProduct}
                  className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>{copiedLink ? 'Link do Produto Copiado!' : 'Compartilhar Produto com Amigos'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
