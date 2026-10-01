import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Calendar, Clock, CreditCard } from 'lucide-react';
import { StoreSettings } from '../../types';

interface HeroProps {
  settings: StoreSettings;
  onExploreProducts: () => void;
  onOpenSimulator: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  settings,
  onExploreProducts,
  onOpenSimulator,
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/60 via-white to-slate-50 py-12 md:py-20 lg:py-24 border-b border-slate-100">
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-orange-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/80 border border-orange-200 text-orange-800 text-xs font-bold tracking-wide shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>BELGA MÓVEIS • CREDIÁRIO DIGITAL PRÓPRIO</span>
            </div>

            {/* Slogan & Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              {settings.slogan || 'Seu lar mais completo!'}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-blue-700">
                Colchões Queen & Móveis
              </span>
            </h1>

            {/* Subtext from prompt */}
            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Móveis, colchões e muito mais com opções de pagamento no crediário. Escolha pagar semanal, quinzenal ou em até 12x mensais sem burocracia.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onExploreProducts}
                className="w-full sm:w-auto px-8 py-4 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-extrabold rounded-2xl shadow-xl shadow-orange-600/30 transition-all flex items-center justify-center gap-2 text-base group"
              >
                <span>VER PRODUTOS</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onOpenSimulator}
                className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-slate-50 active:scale-95 text-blue-900 font-bold rounded-2xl border-2 border-blue-900/15 shadow-sm transition-all flex items-center justify-center gap-2 text-base"
              >
                <CreditCard className="w-5 h-5 text-blue-700" />
                <span>SIMULAR CREDIÁRIO</span>
              </button>
            </div>

            {/* Key bullet benefits */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-200/80 max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Semanal ou Mensal</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Aprovação Ágil</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Ficha Digital Segura</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Card with Mattress Highlight */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 group">
                <img
                  src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80"
                  alt="Colchão Queen Belga Móveis"
                  className="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-500 opacity-95"
                />
                
                {/* Floating highlight badge */}
                <div className="absolute top-4 left-4 bg-orange-600/95 backdrop-blur-md text-white text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-lg">
                  DESTAQUE QUEEN
                </div>

                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent p-6 text-white">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                    Linha Molas Ensacadas
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Colchão Queen Smart Lis Mola
                  </h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-white">R$ 2.716,80</span>
                    <span className="text-xs text-slate-300 font-medium">ou 12x de R$ 226,40</span>
                  </div>
                </div>
              </div>

              {/* Floating Digital Ficha Mini Card */}
              <div className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 hidden sm:flex items-center gap-3 max-w-xs animate-bounce-subtle">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Crediário sem Cartão</div>
                  <div className="text-[11px] text-slate-500">Carnê digital com lembrete no WhatsApp</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
