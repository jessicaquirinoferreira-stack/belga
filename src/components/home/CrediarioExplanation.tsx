import React from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  PhoneCall, 
  Receipt 
} from 'lucide-react';
import { BELGA_LOGO_URL } from '../../lib/branding';

interface CrediarioExplanationProps {
  onOpenSimulator: () => void;
  whatsappPhone: string;
}

export const CrediarioExplanation: React.FC<CrediarioExplanationProps> = ({
  onOpenSimulator,
  whatsappPhone,
}) => {
  return (
    <section className="py-16 md:py-24 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Como Funciona o Crediário Belga
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Da tradicional ficha de papel para o{' '}
            <span className="text-orange-600">Crediário 100% Digital</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Mais praticidade e transparência para você mobiliar sua casa. Escolha o prazo, receba o comprovante no WhatsApp e pague por Pix ou dinheiro sem fila.
          </p>
        </div>

        {/* Comparison & Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Visual Digital Ficha Mockup (Item 13 & 79 from prompt) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-amber-50/50 to-orange-50/40 p-6 sm:p-8 rounded-3xl border-2 border-amber-200/70 shadow-lg relative">
            <div className="flex items-center justify-between border-b-2 border-dashed border-amber-300/80 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white p-1 border border-amber-200/80 shadow-2xs">
                  <img src={BELGA_LOGO_URL} alt="Belga Móveis" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-widest text-orange-600 uppercase block">
                    BELGA MÓVEIS
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-sm">FICHA DE CREDIÁRIO</h3>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Ficha Nº</span>
                <span className="text-sm font-mono font-black text-blue-800">#001428</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-200/50">
                <div>
                  <span className="text-slate-400 block text-[10px]">Sr.(a)</span>
                  <span className="font-bold text-slate-800">Cliente Belga Móveis</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">CPF</span>
                  <span className="font-mono text-slate-700">***.458.912-**</span>
                </div>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/50">
                <span className="text-slate-400 block text-[10px]">Endereço / Bairro</span>
                <span className="font-medium text-slate-800">Rua das Palmeiras, 142 - Rio de Janeiro/RJ</span>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/50">
                <span className="text-slate-400 block text-[10px]">Mercadorias</span>
                <span className="font-bold text-slate-900">1x Colchão Queen Smart Lis Mola</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded-xl bg-orange-100/60 border border-orange-200">
                  <span className="text-[10px] text-orange-800 font-bold block">TOTAL</span>
                  <span className="font-black text-slate-900 text-xs">R$ 2.716,80</span>
                </div>
                <div className="p-2 rounded-xl bg-blue-100/60 border border-blue-200">
                  <span className="text-[10px] text-blue-800 font-bold block">PLANO</span>
                  <span className="font-black text-blue-900 text-xs">12x Mensal</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-100/60 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-bold block">PARCELA</span>
                  <span className="font-black text-emerald-900 text-xs">R$ 226,40</span>
                </div>
              </div>

              {/* Table ledger mockup */}
              <div className="mt-3 bg-white rounded-xl border border-slate-200 p-2.5 text-[11px]">
                <div className="grid grid-cols-3 font-bold text-slate-500 border-b border-slate-100 pb-1 text-center">
                  <span>Vencimento</span>
                  <span>Pagou</span>
                  <span>Resta</span>
                </div>
                <div className="grid grid-cols-3 py-1 text-center border-b border-slate-50 font-medium">
                  <span className="text-slate-700">10/11/2026</span>
                  <span className="text-emerald-600 font-bold">R$ 226,40</span>
                  <span className="text-slate-500">R$ 2.490,40</span>
                </div>
                <div className="grid grid-cols-3 py-1 text-center font-medium">
                  <span className="text-slate-700">10/12/2026</span>
                  <span className="text-amber-600 font-bold">A vencer</span>
                  <span className="text-slate-500">R$ 2.264,00</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 font-medium pt-2 border-t border-amber-200/60">
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ficha Ativa no Sistema
              </span>
              <span>Belga Móveis • Rio de Janeiro</span>
            </div>
          </div>

          {/* Steps Right Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white font-extrabold flex items-center justify-center shrink-0 shadow-md shadow-orange-600/30 text-sm">
                1
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Escolha seus Colchões ou Móveis</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Navegue pelo nosso catálogo com os preços originais e dimensões detalhadas de cada produto.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-700 text-white font-extrabold flex items-center justify-center shrink-0 shadow-md shadow-blue-700/30 text-sm">
                2
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Defina as Condições de Pagamento</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Escolha se prefere pagar com entrada, em parcelas <strong>Semanais</strong>, <strong>Quinzenais</strong> ou <strong>Mensais em até 12x</strong>.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white font-extrabold flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30 text-sm">
                3
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Cadastro Rápido e Ficha Digital</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Informe seus dados com busca automática por CEP. Sua ficha de crediário é gerada no ato com número exclusivo.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-extrabold flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30 text-sm">
                4
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Acompanhamento e Pix via WhatsApp</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Receba o resumo completo do pedido no seu WhatsApp, pague suas parcelas com segurança via Pix e consulte seu extrato na Área do Cliente.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={onOpenSimulator}
                className="px-6 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/20 flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Simular Meu Crediário Agora</span>
              </button>

              <a
                href={`https://wa.me/55${whatsappPhone.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Gostaria de tirar dúvidas sobre o Crediário da Belga Móveis.')}`}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl flex items-center gap-2 transition-all"
              >
                <PhoneCall className="w-4 h-4 text-emerald-600" />
                <span>Tirar Dúvidas no WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
