import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Calendar, 
  DollarSign, 
  ArrowRight, 
  FileText, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';
import { Product, PaymentFrequency } from '../../types';
import { 
  formatCurrency, 
  calculateCrediario, 
  formatDateBR 
} from '../../lib/financial';
import { useCart } from '../../context/CartContext';

interface CrediarioSimulatorModalProps {
  product: Product | null;
  onClose: () => void;
  products: Product[];
}

export const CrediarioSimulatorModal: React.FC<CrediarioSimulatorModalProps> = ({
  product,
  onClose,
  products,
}) => {
  const { addToCart, openCheckout } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    product || (products.length > 0 ? products[0] : null)
  );

  const [customValue, setCustomValue] = useState<number>(
    product ? product.price : (products[0]?.price || 2716.80)
  );
  const [useCustomValue, setUseCustomValue] = useState(false);
  const [entryAmount, setEntryAmount] = useState<number>(0);
  const [installmentsCount, setInstallmentsCount] = useState<number>(12);
  const [frequency, setFrequency] = useState<PaymentFrequency>('Mensal');
  const [firstDueDate, setFirstDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const baseAmount = useCustomValue ? customValue : (selectedProduct?.price || 0);

  const plan = useMemo(() => {
    return calculateCrediario({
      totalAmount: baseAmount,
      entryAmount,
      installmentsCount,
      frequency,
      interestRateMonthly: 0, // 0% standard promotional crediario
      firstDueDate,
    });
  }, [baseAmount, entryAmount, installmentsCount, frequency, firstDueDate]);

  const handleStartPurchase = () => {
    if (selectedProduct && !useCustomValue) {
      addToCart(selectedProduct, 1);
    }
    onClose();
    openCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 via-amber-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Simulador de Crediário Belga Móveis
              </h2>
              <p className="text-xs text-slate-500">
                Calcule entrada, prazos e vencimentos da sua Ficha Digital
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Product selector or custom value */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Produto para Simulação
              </label>
              <button
                onClick={() => setUseCustomValue(!useCustomValue)}
                className="text-xs font-bold text-orange-600 hover:underline"
              >
                {useCustomValue ? 'Escolher da lista de produtos' : 'Digitar valor manual'}
              </button>
            </div>

            {useCustomValue ? (
              <div className="relative">
                <input
                  type="number"
                  value={customValue}
                  onChange={(e) => setCustomValue(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
                  placeholder="Ex: 2716.80"
                />
                <span className="absolute left-3.5 top-3.5 text-xs font-bold text-slate-400">
                  R$
                </span>
              </div>
            ) : (
              <select
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const prod = products.find((p) => p.id === e.target.value);
                  if (prod) {
                    setSelectedProduct(prod);
                  }
                }}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-900 text-sm outline-none focus:bg-white focus:border-orange-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {formatCurrency(p.price)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Parameters grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Entry input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Valor da Entrada (Opcional)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={baseAmount}
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
                />
                <span className="absolute left-3 top-3 text-xs font-bold text-slate-400">R$</span>
              </div>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Periodicidade
              </label>
              <select
                value={frequency}
                onChange={(e) => {
                  const freq = e.target.value as PaymentFrequency;
                  setFrequency(freq);
                  if (freq === 'Semanal' && installmentsCount > 24) setInstallmentsCount(12);
                  if (freq === 'Quinzenal' && installmentsCount > 24) setInstallmentsCount(12);
                  if (freq === 'Mensal' && installmentsCount > 12) setInstallmentsCount(12);
                }}
                className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
              >
                <option value="Mensal">Mensal (Mais popular)</option>
                <option value="Quinzenal">Quinzenal</option>
                <option value="Semanal">Semanal</option>
              </select>
            </div>

            {/* Installments count */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nº de Parcelas
              </label>
              <select
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
              >
                {frequency === 'Mensal' ? (
                  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                    <option key={n} value={n}>
                      {n}x mensais
                    </option>
                  ))
                ) : (
                  [2, 4, 6, 8, 10, 12, 16, 20, 24].map((n) => (
                    <option key={n} value={n}>
                      {n}x {frequency.toLowerCase()}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-orange-400 font-bold uppercase tracking-wider block">
                  Condição Calculada
                </span>
                <div className="text-3xl font-black text-white mt-1">
                  {plan.installmentsCount}x de{' '}
                  <span className="text-amber-400">
                    {formatCurrency(plan.installmentAmount)}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Periodicidade: <strong>{plan.frequency}</strong>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 space-y-1">
                <div className="text-xs text-slate-400">
                  Total da Mercadoria: <strong className="text-white">{formatCurrency(plan.totalAmount)}</strong>
                </div>
                {plan.entryAmount > 0 && (
                  <div className="text-xs text-slate-400">
                    Entrada no ato: <strong className="text-emerald-400">{formatCurrency(plan.entryAmount)}</strong>
                  </div>
                )}
                <div className="text-xs text-slate-400">
                  Saldo Financiado: <strong className="text-white">{formatCurrency(plan.financedAmount)}</strong>
                </div>
              </div>
            </div>

            {/* Schedule of Due Dates */}
            <div className="pt-4">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Cronograma Previsto de Vencimentos:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                {plan.dueDates.map((dateStr, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/80 text-center"
                  >
                    <span className="block text-[10px] text-slate-400">
                      Parcela {idx + 1}/{plan.installmentsCount}
                    </span>
                    <span className="block text-xs font-bold text-amber-300">
                      {formatDateBR(dateStr)}
                    </span>
                    <span className="block text-[11px] text-white font-medium">
                      {formatCurrency(plan.installmentAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleStartPurchase}
            className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-2xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 text-base transition-all"
          >
            <span>AVANÇAR E CRIAR FICHA NO CREDIÁRIO</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
