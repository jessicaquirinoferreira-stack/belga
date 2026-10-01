import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Search, 
  FileText, 
  ShieldCheck, 
  ShoppingBag, 
  Calendar, 
  MessageCircle, 
  Sparkles, 
  CheckCircle2, 
  Lock,
  User 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { 
  Customer, 
  Order, 
  Installment, 
  PaymentFrequency, 
  StoreSettings 
} from '../../types';
import { 
  formatCurrency, 
  calculateCrediario, 
  formatDateBR 
} from '../../lib/financial';
import { fetchAddressByCep, buildOrderWhatsAppMessage, getWhatsAppUrl } from '../../lib/api';
import { createOrderWithCrediario } from '../../lib/dbService';

interface CheckoutModalProps {
  settings: StoreSettings;
  onOrderCompleted?: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  settings,
  onOrderCompleted,
}) => {
  const { currentUser, customerProfile, createOrConnectCustomerAccountFromFicha } = useAuth();
  const { items, subtotal, isCheckoutOpen, setIsCheckoutOpen, clearCart } = useCart();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step 1: Customer Personal Details
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Address Details
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('Rio de Janeiro');
  const [state, setState] = useState('RJ');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);

  // Step 4 & 5: Payment & Parcelamento
  const [paymentType, setPaymentType] = useState<'crediario' | 'a_vista'>('crediario');
  const [entryAmount, setEntryAmount] = useState<number>(0);
  const [installmentsCount, setInstallmentsCount] = useState<number>(12);
  const [frequency, setFrequency] = useState<PaymentFrequency>('Mensal');
  const [firstDueDate, setFirstDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // Step 6: Contract Acceptance
  const [contractAccepted, setContractAccepted] = useState(true);

  // Step 7: Completed Order
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Prefill from authenticated user/profile if available and auto-skip personal/address steps
  useEffect(() => {
    if (isCheckoutOpen) {
      if (currentUser || customerProfile) {
        const userEmail = customerProfile?.email || currentUser?.email || '';
        const userName = customerProfile?.name || currentUser?.displayName || '';
        if (userEmail) setEmail(userEmail);
        if (userName) setName(userName);
        if (customerProfile) {
          if (customerProfile.cpf) setCpf(customerProfile.cpf);
          if (customerProfile.phone) setPhone(customerProfile.phone);
          if (customerProfile.whatsapp) setWhatsapp(customerProfile.whatsapp || customerProfile.phone || '');
          if (customerProfile.birthDate) setBirthDate(customerProfile.birthDate);
          if (customerProfile.address) {
            setCep(customerProfile.address.cep || '');
            setStreet(customerProfile.address.street || '');
            setNumber(customerProfile.address.number || '');
            setComplement(customerProfile.address.complement || '');
            setNeighborhood(customerProfile.address.neighborhood || '');
            setCity(customerProfile.address.city || 'Rio de Janeiro');
            setState(customerProfile.address.state || 'RJ');
            setReference(customerProfile.address.reference || '');
          }
        }
        // Auto-skip steps 1 and 2 directly to step 3 (Items & Delivery confirmation)
        setStep(3);
      } else {
        setStep(1);
      }
    }
  }, [isCheckoutOpen, currentUser, customerProfile]);

  if (!isCheckoutOpen) return null;

  const crediarioPlan = calculateCrediario({
    totalAmount: subtotal,
    entryAmount,
    installmentsCount,
    frequency,
    interestRateMonthly: 0,
    firstDueDate,
  });

  const handleCepLookup = async () => {
    if (!cep) return;
    setLoadingCep(true);
    const data = await fetchAddressByCep(cep);
    if (data) {
      if (data.street) setStreet(data.street);
      if (data.neighborhood) setNeighborhood(data.neighborhood);
      if (data.city) setCity(data.city);
      if (data.state) setState(data.state);
      if (data.cep) setCep(data.cep);
    }
    setLoadingCep(false);
  };

  const handleNext = async () => {
    setErrorMessage('');

    // Step 1 Validation
    if (step === 1) {
      if (!name.trim()) return setErrorMessage('Informe seu nome completo.');
      if (!cpf.trim()) return setErrorMessage('Informe seu CPF.');
      if (!phone.trim()) return setErrorMessage('Informe seu telefone / celular.');
      if (!email.trim() || !email.includes('@')) return setErrorMessage('Informe um e-mail válido para acessar a Área do Cliente.');
      if (!currentUser && (!password || password.length < 6)) {
        return setErrorMessage('Crie uma senha de no mínimo 6 dígitos para acessar sua Área do Cliente.');
      }
      setStep(2);
      return;
    }

    // Step 2 Validation
    if (step === 2) {
      if (!street.trim()) return setErrorMessage('Informe o nome da rua/logradouro.');
      if (!number.trim()) return setErrorMessage('Informe o número do endereço.');
      if (!neighborhood.trim()) return setErrorMessage('Informe o bairro.');
      if (!city.trim()) return setErrorMessage('Informe a cidade.');
      setStep(3);
      return;
    }

    // Step 3: Review Products -> Step 4
    if (step === 3) {
      setStep(4);
      return;
    }

    // Step 4: Payment condition -> Step 5 or 6
    if (step === 4) {
      if (paymentType === 'crediario') {
        setStep(5);
      } else {
        setStep(6);
      }
      return;
    }

    // Step 5: Parcelamento -> Step 6
    if (step === 5) {
      setStep(6);
      return;
    }

    // Step 6: Confirmation & Order Creation
    if (step === 6) {
      if (!contractAccepted) {
        return setErrorMessage('Você precisa aceitar os termos do contrato de crediário para prosseguir.');
      }

      setLoading(true);
      try {
        const addressData = {
          cep,
          street,
          number,
          complement,
          neighborhood,
          city,
          state,
          reference,
        };

        // Automatically register and persist customer account in Firebase with 6-digit credentials
        const customerAccount = await createOrConnectCustomerAccountFromFicha({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          pass: password || '123456',
          cpf: cpf.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || phone.trim(),
          birthDate,
          address: addressData,
        });

        const authUserId = customerAccount.uid;
        const customerId = authUserId;
        const orderNumber = `${Date.now().toString().slice(-6)}`;
        const fichaNumber = `${Math.floor(100000 + Math.random() * 900000)}`;
        const now = new Date().toISOString();

        const customerRecord: Customer = {
          id: customerId,
          userId: authUserId,
          name: name.trim(),
          cpf: cpf.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || phone.trim(),
          birthDate,
          address: addressData,
          notes,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        };

        const finalItems = items.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          productImage: i.product.images[0] || '',
          sku: i.product.sku,
          quantity: i.quantity,
          unitPrice: i.product.price,
          totalPrice: i.product.price * i.quantity,
        }));

        const orderRecord: Omit<Order, 'id'> = {
          orderNumber,
          fichaNumber,
          customerId,
          userId: authUserId,
          customerName: name,
          customerCpf: cpf,
          customerPhone: phone,
          customerAddress: customerRecord.address,
          items: finalItems,
          subtotal,
          discount: 0,
          entry: paymentType === 'crediario' ? entryAmount : 0,
          financedAmount: paymentType === 'crediario' ? crediarioPlan.financedAmount : 0,
          installmentAmount: paymentType === 'crediario' ? crediarioPlan.installmentAmount : 0,
          installmentsCount: paymentType === 'crediario' ? installmentsCount : 1,
          frequency: paymentType === 'crediario' ? frequency : 'Mensal',
          firstDueDate: paymentType === 'crediario' ? firstDueDate : now.split('T')[0],
          status: 'Novo',
          notes,
          paymentType,
          createdBy: name,
          createdAt: now,
          updatedAt: now,
        };

        // Generate Installments data
        const installmentsToCreate: Omit<Installment, 'id'>[] = [];
        if (paymentType === 'crediario') {
          for (let i = 0; i < installmentsCount; i++) {
            installmentsToCreate.push({
              orderId: '', // populated in batch
              fichaNumber,
              customerId,
              userId: authUserId,
              customerName: name,
              number: i + 1,
              totalInstallments: installmentsCount,
              amount: crediarioPlan.installmentAmount,
              dueDate: crediarioPlan.dueDates[i],
              status: 'Pendente',
              createdAt: now,
              updatedAt: now,
            });
          }
        }

        const res = await createOrderWithCrediario(orderRecord, installmentsToCreate, customerRecord);
        const completeOrder: Order = {
          ...orderRecord,
          id: res.orderId,
        };

        setCreatedOrder(completeOrder);
        clearCart();
        setStep(7);
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        if (onOrderCompleted) onOrderCompleted(completeOrder);

        // AUTOMATIC DISPATCH: Send WhatsApp summary directly via wa.me without requiring manual click
        const waUrl = getWhatsAppUrl(
          settings.whatsapp || settings.phone || '21973934438',
          buildOrderWhatsAppMessage(completeOrder, settings.phone || '(21) 97393-4438')
        );

        setTimeout(() => {
          try {
            const autoLink = document.createElement('a');
            autoLink.href = waUrl;
            autoLink.target = '_blank';
            autoLink.rel = 'noopener noreferrer';
            document.body.appendChild(autoLink);
            autoLink.click();
            document.body.removeChild(autoLink);
          } catch {
            window.location.href = waUrl;
          }
        }, 300);
      } catch (err: any) {
        console.error('Order creation error:', err);
        setErrorMessage(err.message || 'Erro ao processar pedido. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  const stepsList = [
    'Dados Pessoais',
    'Endereço',
    'Produtos',
    'Pagamento',
    'Parcelamento',
    'Confirmação',
    'Pedido Realizado',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (step !== 7) setIsCheckoutOpen(false);
        }}
      />

      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[94vh] flex flex-col">
        {/* Top Progress Bar */}
        <div className="bg-slate-900 text-white p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-600 text-xs font-black flex items-center justify-center">
                {step}
              </span>
              <span className="text-xs sm:text-sm font-bold tracking-tight">
                Etapa {step} de 7: {stepsList[step - 1]}
              </span>
            </div>
            {step !== 7 && (
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Progress bar line */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-amber-400 h-full transition-all duration-300"
              style={{ width: `${(step / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-xs font-bold text-rose-700 flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Wizard Body */}
        <div className="overflow-y-auto p-6 sm:p-8 flex-1">
          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Seus Dados Pessoais</h3>
                <p className="text-xs text-slate-500">
                  Preencha para emissão da Ficha Digital do Crediário Belga Móveis.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: João da Silva Santos"
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    CPF / CNPJ *
                  </label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Telefone / Celular *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(21) 99999-9999"
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    WhatsApp (para envio de carnê e Pix)
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(21) 99999-9999"
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div className={currentUser ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    E-mail para Acesso à Área do Cliente *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                {!currentUser && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                      <span>Crie uma Senha de 6 Dígitos *</span>
                      <span className="text-[10px] text-slate-400 font-medium normal-case">6 dígitos</span>
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="6 dígitos"
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-orange-500 font-mono tracking-widest"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Address */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Endereço de Entrega</h3>
                <p className="text-xs text-slate-500">
                  Digite seu CEP para preenchimento automático das informações.
                </p>
              </div>

              {/* CEP lookup */}
              <div className="flex gap-2">
                <div className="flex-1 max-w-xs">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    CEP *
                  </label>
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="20000-000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleCepLookup}
                    disabled={loadingCep}
                    className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{loadingCep ? 'Buscando...' : 'BUSCAR CEP'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Rua / Logradouro *
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Ex: Av. Automóvel Clube"
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="123"
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Centro"
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Rio de Janeiro"
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Estado *
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="RJ"
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Apto 201, Bloco B"
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ponto de Referência
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Próximo à padaria"
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Products Review & Customer Auto-Recognition */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Authenticated Customer Recognition Card */}
              {(currentUser || customerProfile) && (
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{name || currentUser?.displayName || 'Cliente Belga'}</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-black">
                          CONTA CONECTADA
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">
                        E-mail: <strong>{email}</strong> {cpf && <>• CPF: <strong>{cpf}</strong></>}
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Entrega: {street ? `${street}, Nº ${number || 'S/N'} - ${neighborhood}, ${city}/${state}` : 'Endereço cadastrado na sua conta'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    ✏️ Alterar Dados
                  </button>
                </div>
              )}

              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Itens Selecionados</h3>
                <p className="text-xs text-slate-500">
                  Confira as mercadorias que constarão na sua Ficha Digital.
                </p>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200"
                  >
                    <img
                      src={item.product.images[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=200&q=80'}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm">{item.product.name}</h4>
                      <p className="text-xs text-slate-500">
                        {item.quantity}x de {formatCurrency(item.product.price)}
                      </p>
                    </div>
                    <div className="text-right font-black text-slate-900 text-sm">
                      {formatCurrency(item.product.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-between">
                <span className="text-xs font-bold text-orange-900 uppercase">Total das Mercadorias:</span>
                <span className="text-xl font-black text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
            </div>
          )}

          {/* STEP 4: Payment Condition */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Forma de Pagamento</h3>
                <p className="text-xs text-slate-500">
                  Escolha como prefere pagar sua compra na Belga Móveis.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setPaymentType('crediario')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentType === 'crediario'
                      ? 'border-orange-600 bg-orange-50/50 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-orange-600 uppercase tracking-wider">
                      Recomendado
                    </span>
                    <Sparkles className="w-4 h-4 text-orange-600" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    Crediário Próprio Belga
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Sem necessidade de cartão de crédito. Parcele semanal, quinzenal ou em até 12x mensais com carnê digital.
                  </p>
                  <div className="mt-4 text-xs font-bold text-orange-800">
                    A partir de 12x de {formatCurrency(crediarioPlan.installmentAmount)}
                  </div>
                </div>

                <div
                  onClick={() => setPaymentType('a_vista')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentType === 'a_vista'
                      ? 'border-blue-700 bg-blue-50/50 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      Pagamento Direto
                    </span>
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    À Vista (Pix ou Dinheiro)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Pagamento único no ato da entrega ou via chave Pix comercial da Belga Móveis.
                  </p>
                  <div className="mt-4 text-xs font-bold text-blue-900">
                    Total: {formatCurrency(subtotal)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Crediário Parcelamento */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Condições do Parcelamento</h3>
                <p className="text-xs text-slate-500">
                  Configure o plano que melhor se adapta ao seu orçamento familiar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Entrada no Ato (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    value={entryAmount}
                    onChange={(e) => setEntryAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Periodicidade
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as PaymentFrequency)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
                  >
                    <option value="Mensal">Mensal</option>
                    <option value="Quinzenal">Quinzenal</option>
                    <option value="Semanal">Semanal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Número de Parcelas
                  </label>
                  <select
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-orange-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <option key={n} value={n}>
                        {n}x parcelas
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Simulation Result */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold uppercase">Resultado do Plano:</span>
                  <span className="text-2xl font-black text-amber-400">
                    {crediarioPlan.installmentsCount}x de {formatCurrency(crediarioPlan.installmentAmount)}
                  </span>
                </div>
                <div className="text-xs text-slate-300 flex items-center justify-between pt-2 border-t border-slate-800">
                  <span>Saldo Financiado: {formatCurrency(crediarioPlan.financedAmount)}</span>
                  <span>1º Vencimento: {formatDateBR(crediarioPlan.dueDates[0])}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Confirmation & Digital Ficha Agreement */}
          {step === 6 && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Resumo da Ficha Digital</h3>
                <p className="text-xs text-slate-500">
                  Revise todos os dados antes de gerar sua ficha no sistema.
                </p>
              </div>

              {/* Ficha Card Layout */}
              <div className="p-5 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl border border-amber-200 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <span className="font-extrabold text-orange-600 text-sm">BELGA MÓVEIS • CREDIÁRIO</span>
                  <span className="font-mono text-slate-500 font-bold">PRE-VIEW</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cliente:</span>
                    <span className="font-bold text-slate-900">{name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">CPF:</span>
                    <span className="font-bold text-slate-900">{cpf}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Entrega:</span>
                    <span className="font-medium text-slate-800">
                      {street}, {number} - {neighborhood}, {city}/{state}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Condição:</span>
                    <span className="font-bold text-slate-900">
                      {paymentType === 'crediario' ? `${installmentsCount}x de ${formatCurrency(crediarioPlan.installmentAmount)} (${frequency})` : 'À Vista'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total:</span>
                    <span className="font-black text-orange-600 text-sm">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              </div>

              {/* Digital Contract Acceptance */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="contractAccept"
                    checked={contractAccepted}
                    onChange={(e) => setContractAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                  />
                  <label htmlFor="contractAccept" className="text-xs text-slate-700 leading-snug cursor-pointer">
                    Li e concordo com os termos da <strong>Ficha Digital do Crediário Belga Móveis</strong>. Autorizo o contato via WhatsApp para confirmação do pedido e envio de lembretes de parcelas.
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Completed Success Screen */}
          {step === 7 && createdOrder && (
            <div className="py-6 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">
                  PEDIDO RECEBIDO COM SUCESSO!
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  Parabéns, {createdOrder.customerName.split(' ')[0]}!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Sua ficha digital foi cadastrada no sistema da Belga Móveis.
                </p>
              </div>

              {/* Numbers highlight card */}
              <div className="max-w-md mx-auto grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="p-3 bg-white rounded-xl shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Número do Pedido</span>
                  <span className="text-base font-black text-slate-900">#{createdOrder.orderNumber}</span>
                </div>
                <div className="p-3 bg-white rounded-xl shadow-2xs">
                  <span className="text-[10px] text-orange-600 font-bold block uppercase">Ficha Digital Nº</span>
                  <span className="text-base font-black text-blue-900">#{createdOrder.fichaNumber}</span>
                </div>
              </div>

              {/* Credentials summary card */}
              <div className="max-w-md mx-auto p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <span>Seu Acesso Criado na Área do Cliente:</span>
                </div>
                <div className="text-xs text-slate-700 space-y-1 bg-white p-3 rounded-xl border border-emerald-100">
                  <p><strong>E-mail:</strong> {email}</p>
                  <p><strong>Senha:</strong> {password ? '•••••• (6 dígitos cadastrados)' : 'Sua senha habitual'}</p>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Você já está conectado! Acesse seu painel para ver carnês, datas de vencimento e pagamentos via Pix.
                </p>
              </div>

              {/* Automatic WhatsApp confirmation banner & actions */}
              <div className="max-w-md mx-auto space-y-2.5">
                <div className="p-3 bg-emerald-100/90 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border border-emerald-300 shadow-2xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>🚀 Resumo do pedido enviado automaticamente via WhatsApp!</span>
                </div>

                <a
                  href={getWhatsAppUrl(
                    settings.whatsapp || '21973934438',
                    buildOrderWhatsAppMessage(createdOrder, settings.phone || '(21) 97393-4438')
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Reabrir Conversa no WhatsApp</span>
                </a>

                <button
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    if (onOrderCompleted) {
                      onOrderCompleted(createdOrder);
                    }
                  }}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <User className="w-4 h-4 text-amber-400" />
                  <span>ACESSAR MINHA ÁREA DO CLIENTE</span>
                </button>

                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Fechar e Continuar Comprando
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        {step < 7 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shadow-md shadow-orange-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Processando...' : step === 6 ? 'CONFIRMAR E GERAR FICHA' : 'Avançar'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
