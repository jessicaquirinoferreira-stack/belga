import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Layers, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  Printer, 
  PhoneCall, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  TrendingUp, 
  Sliders, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Sparkles, 
  Menu, 
  Copy, 
  Check, 
  Download,
  ShieldCheck,
  Bell
} from 'lucide-react';
import { sendPushNotification, notifyCatalogPromotion } from '../../lib/notifications';
import { useAuth } from '../../context/AuthContext';
import { 
  Product, 
  Category, 
  Order, 
  Installment, 
  PaymentReceipt, 
  Customer, 
  ChatMessage, 
  StoreSettings, 
  DailyMessage, 
  PaymentFrequency 
} from '../../types';
import { 
  formatCurrency, 
  formatDateBR, 
  calculateCrediario, 
  getDaysDiffFromToday 
} from '../../lib/financial';
import { 
  subscribeProducts, 
  subscribeCategories, 
  subscribeOrders, 
  subscribeInstallments, 
  subscribePayments, 
  subscribeCustomers, 
  subscribeMessages, 
  subscribeSettings, 
  saveProduct, 
  deleteProduct, 
  registerInstallmentPayment, 
  updateOrderStatus, 
  updateCustomerStatus,
  saveCustomerRecord,
  saveSettings, 
  sendChatMessage, 
  createOrderWithCrediario 
} from '../../lib/dbService';
import { 
  buildInstallmentReminderWhatsAppMessage, 
  buildOverdueInstallmentWhatsAppMessage, 
  getWhatsAppUrl, 
  uploadFile 
} from '../../lib/api';
import { BELGA_LOGO_URL } from '../../lib/branding';

interface AdminDashboardProps {
  onExit: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const { currentUser, signOut } = useAuth();

  // Navigation State
  const [tab, setTab] = useState<
    | 'overview'
    | 'pdv'
    | 'orders'
    | 'customers'
    | 'installments'
    | 'payments'
    | 'products'
    | 'reports'
    | 'chat'
    | 'settings'
    | 'print-ficha'
  >('overview');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Firestore Realtime Collections
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<PaymentReceipt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  // Search & Filters
  const [globalSearch, setGlobalSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerStatusFilter, setCustomerStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [installmentFilter, setInstallmentFilter] = useState<'all' | 'today' | 'overdue' | 'paid'>('all');
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState<Customer | null>(null);

  // Modal / Form States
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [paymentModalInstallment, setPaymentModalInstallment] = useState<Installment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Dinheiro' | 'Pix' | 'Cartão' | 'Transferência' | 'Outro'>('Pix');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [renegotiateCustomer, setRenegotiateCustomer] = useState<Customer | null>(null);

  // PDV (Ponto de Venda) States
  const [pdvCustomerId, setPdvCustomerId] = useState('');
  const [pdvNewCustomerName, setPdvNewCustomerName] = useState('');
  const [pdvNewCustomerCpf, setPdvNewCustomerCpf] = useState('');
  const [pdvNewCustomerPhone, setPdvNewCustomerPhone] = useState('');
  const [pdvNewCustomerAddress, setPdvNewCustomerAddress] = useState('');
  const [pdvSelectedProductId, setPdvSelectedProductId] = useState('');
  const [pdvQuantity, setPdvQuantity] = useState(1);
  const [pdvEntry, setPdvEntry] = useState(0);
  const [pdvInstallmentsCount, setPdvInstallmentsCount] = useState(12);
  const [pdvFrequency, setPdvFrequency] = useState<PaymentFrequency>('Mensal');
  const [pdvNotes, setPdvNotes] = useState('');
  const [pdvSuccessMsg, setPdvSuccessMsg] = useState('');

  // Chat State
  const [selectedChatCustomerId, setSelectedChatCustomerId] = useState<string>('');
  const [adminReplyText, setAdminReplyText] = useState('');

  // Push Broadcast State
  const [pushTitle, setPushTitle] = useState('✨ Novidade no Catálogo Belga Móveis!');
  const [pushBody, setPushBody] = useState('Novos colchões Queen com molas ensacadas chegaram com facilidade no crediário próprio!');
  const [pushSentToast, setPushSentToast] = useState('');

  // Daily message
  const dailyMessage = "Cada cliente bem atendido é uma oportunidade de construir confiança.";

  // Subscribe to all Firestore collections
  useEffect(() => {
    const unsubProds = subscribeProducts(setProducts);
    const unsubCats = subscribeCategories(setCategories);
    const unsubOrders = subscribeOrders(setOrders);
    const unsubInsts = subscribeInstallments(setInstallments);
    const unsubPays = subscribePayments(setPayments);
    const unsubCusts = subscribeCustomers(setCustomers);
    const unsubMsgs = subscribeMessages(setMessages);
    const unsubSets = subscribeSettings(setSettings);

    return () => {
      unsubProds();
      unsubCats();
      unsubOrders();
      unsubInsts();
      unsubPays();
      unsubCusts();
      unsubMsgs();
      unsubSets();
    };
  }, []);

  // Financial Calculations & Metrics for Dashboard (Item 28)
  const todayStr = new Date().toISOString().split('T')[0];

  const revenueToday = payments
    .filter((p) => p.paidAt.startsWith(todayStr))
    .reduce((acc, p) => acc + p.amount, 0);

  const revenueMonth = payments
    .filter((p) => p.paidAt.startsWith(todayStr.slice(0, 7)))
    .reduce((acc, p) => acc + p.amount, 0);

  const totalReceivable = installments
    .filter((i) => i.status !== 'Pago' && i.status !== 'Cancelada')
    .reduce((acc, i) => acc + i.amount, 0);

  const totalReceived = payments.reduce((acc, p) => acc + p.amount, 0);

  const overdueInstallments = installments.filter((i) => {
    return i.status !== 'Pago' && i.status !== 'Cancelada' && getDaysDiffFromToday(i.dueDate) < 0;
  });

  const totalOverdue = overdueInstallments.reduce((acc, i) => acc + i.amount, 0);

  const installmentsDueToday = installments.filter((i) => {
    return i.status !== 'Pago' && i.status !== 'Cancelada' && getDaysDiffFromToday(i.dueDate) === 0;
  });

  const lowStockProducts = products.filter((p) => p.stock <= (p.minStock || 2));

  // PDV Calculations
  const pdvProduct = products.find((p) => p.id === pdvSelectedProductId);
  const pdvSubtotal = (pdvProduct?.price || 0) * pdvQuantity;
  const pdvPlan = calculateCrediario({
    totalAmount: pdvSubtotal,
    entryAmount: pdvEntry,
    installmentsCount: pdvInstallmentsCount,
    frequency: pdvFrequency,
  });

  const handlePdvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdvProduct) return;

    let targetCustomer: Customer;
    if (pdvCustomerId && pdvCustomerId !== 'new') {
      const existing = customers.find((c) => c.id === pdvCustomerId);
      if (!existing) return;
      targetCustomer = existing;
    } else {
      if (!pdvNewCustomerName || !pdvNewCustomerCpf) {
        alert('Informe ao menos Nome e CPF do novo cliente.');
        return;
      }
      targetCustomer = {
        id: `cust-${Date.now().toString().slice(-6)}`,
        name: pdvNewCustomerName,
        cpf: pdvNewCustomerCpf,
        email: 'balcao@belgamoveis.com.br',
        phone: pdvNewCustomerPhone || '(21) 99999-9999',
        whatsapp: pdvNewCustomerPhone || '(21) 99999-9999',
        address: {
          cep: '20000-000',
          street: pdvNewCustomerAddress || 'Balcão Loja',
          number: 'S/N',
          neighborhood: 'Centro',
          city: 'Rio de Janeiro',
          state: 'RJ',
        },
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const orderNumber = `${Date.now().toString().slice(-6)}`;
    const fichaNumber = `${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const orderRecord: Omit<Order, 'id'> = {
      orderNumber,
      fichaNumber,
      customerId: targetCustomer.id,
      customerName: targetCustomer.name,
      customerCpf: targetCustomer.cpf,
      customerPhone: targetCustomer.phone,
      customerAddress: targetCustomer.address,
      items: [
        {
          productId: pdvProduct.id,
          productName: pdvProduct.name,
          sku: pdvProduct.sku,
          quantity: pdvQuantity,
          unitPrice: pdvProduct.price,
          totalPrice: pdvSubtotal,
        },
      ],
      subtotal: pdvSubtotal,
      discount: 0,
      entry: pdvEntry,
      financedAmount: pdvPlan.financedAmount,
      installmentAmount: pdvPlan.installmentAmount,
      installmentsCount: pdvInstallmentsCount,
      frequency: pdvFrequency,
      firstDueDate: pdvPlan.dueDates[0],
      status: 'Aprovado',
      notes: pdvNotes || 'Venda realizada via PDV Balcão',
      paymentType: 'crediario',
      createdBy: currentUser?.email || 'Admin',
      createdAt: now,
      updatedAt: now,
    };

    const insts: Omit<Installment, 'id'>[] = [];
    for (let i = 0; i < pdvInstallmentsCount; i++) {
      insts.push({
        orderId: '',
        fichaNumber,
        customerId: targetCustomer.id,
        customerName: targetCustomer.name,
        number: i + 1,
        totalInstallments: pdvInstallmentsCount,
        amount: pdvPlan.installmentAmount,
        dueDate: pdvPlan.dueDates[i],
        status: 'Pendente',
        createdAt: now,
        updatedAt: now,
      });
    }

    await createOrderWithCrediario(orderRecord, insts, targetCustomer);
    setPdvSuccessMsg(`Venda realizada com sucesso! Ficha Digital #${fichaNumber} emitida.`);
    setTimeout(() => setPdvSuccessMsg(''), 4000);

    // Reset PDV
    setPdvQuantity(1);
    setPdvEntry(0);
  };

  const handleRegisterPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInstallment) return;

    try {
      await registerInstallmentPayment({
        installment: paymentModalInstallment,
        amount: paymentAmount || paymentModalInstallment.amount,
        method: paymentMethod,
        adminId: currentUser?.uid || 'admin',
        adminEmail: currentUser?.email || 'admin@belgamoveis.com.br',
        notes: paymentNotes,
      });
      setPaymentModalInstallment(null);
      setPaymentNotes('');
    } catch (err) {
      console.error('Payment registration error:', err);
    }
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct.price) return;
    await saveProduct(editingProduct as any);
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedChatCustomerId) return;
    const targetCust = customers.find((c) => c.id === selectedChatCustomerId);

    await sendChatMessage({
      customerId: selectedChatCustomerId,
      customerName: targetCust?.name || 'Cliente',
      text: adminReplyText.trim(),
      senderId: currentUser?.uid || 'admin',
      senderRole: 'admin',
      senderName: 'Atendimento Belga Móveis',
      read: true,
    });
    setAdminReplyText('');
  };

  // Group messages by customer
  const chatCustomerIds = Array.from(new Set(messages.map((m) => m.customerId)));

  // Export report to CSV
  const exportOrdersCSV = () => {
    const headers = ['Numero', 'Ficha', 'Cliente', 'CPF', 'Total', 'Entrada', 'Parcelas', 'Status', 'Data'];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.fichaNumber,
      `"${o.customerName}"`,
      o.customerCpf,
      o.subtotal.toFixed(2),
      o.entry.toFixed(2),
      `${o.installmentsCount}x`,
      o.status,
      formatDateBR(o.createdAt),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_pedidos_belga_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      onExit();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col lg:flex-row">
      {/* Mobile Header Bar */}
      <div className="lg:hidden bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs">
            <img src={BELGA_LOGO_URL} alt="Belga Móveis" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-white text-xs sm:text-sm">BELGA ADMIN</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Sair e Deslogar do Painel"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } lg:block w-full lg:w-64 bg-slate-950 border-r border-slate-800/80 p-5 flex flex-col justify-between shrink-0 z-30`}
      >
        <div className="space-y-6">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0">
              <img src={BELGA_LOGO_URL} alt="Belga Móveis" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-white text-base">BELGA</span>
                <span className="font-bold text-blue-400 text-base">MÓVEIS</span>
              </div>
              <span className="text-[10px] text-orange-400 font-bold tracking-widest block uppercase">
                Painel Gerencial
              </span>
            </div>
          </div>

          {/* Navigation Items (Item 46 from prompt) */}
          <nav className="space-y-1 text-xs font-semibold">
            <button
              onClick={() => {
                setTab('overview');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                tab === 'overview'
                  ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Geral</span>
            </button>

            <button
              onClick={() => {
                setTab('pdv');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                tab === 'pdv'
                  ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>PDV / Venda Balcão</span>
            </button>

            <button
              onClick={() => {
                setTab('orders');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                tab === 'orders'
                  ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Pedidos & Fichas ({orders.length})</span>
            </button>

            <button
              onClick={() => {
                setTab('customers');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                tab === 'customers'
                  ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Clientes ({customers.length})</span>
            </button>

            <button
              onClick={() => {
                setTab('installments');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                tab === 'installments'
                  ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Crediário & Parcelas</span>
            </button>

            <button
              onClick={() => {
                setTab('payments');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                tab === 'payments'
                  ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 text-teal-400" />
              <span>Recebimentos & Caixa</span>
            </button>

            <button
              onClick={() => {
                setTab('products');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                tab === 'products'
                  ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Produtos & Estoque ({products.length})</span>
            </button>

            <button
              onClick={() => {
                setTab('reports');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                tab === 'reports'
                  ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-rose-400" />
              <span>Relatórios & Gráficos</span>
            </button>

            <button
              onClick={() => {
                setTab('chat');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                tab === 'chat'
                  ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span>Chat Clientes</span>
            </button>

            <button
              onClick={() => {
                setTab('settings');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                tab === 'settings'
                  ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Configurações & WhatsApp</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-6 border-t border-slate-900 space-y-2.5">
          <div className="px-2">
            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Administrador:</span>
            <span className="block text-xs font-bold text-white truncate">
              {currentUser?.email || 'admin@x.com'}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-rose-950/70 hover:bg-rose-900 border border-rose-800/60 text-rose-200 transition-all cursor-pointer shadow-sm"
              title="Deslogar e encerrar sessão administrativa"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sair e Deslogar do Painel</span>
            </button>

            <button
              onClick={onExit}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer"
            >
              <span>Voltar para a Loja</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Administrative Workspace */}
      <main className="flex-1 p-5 sm:p-8 overflow-y-auto max-h-screen">
        {/* Desktop Admin Workspace Top Bar */}
        <div className="hidden lg:flex items-center justify-between pb-6 mb-6 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-black uppercase text-orange-400 tracking-widest block">
              PAINEL DE CONTROLE BELGA MÓVEIS
            </span>
            <h1 className="text-xl font-black text-white">
              Gestão de Vendas, Crediário & PDV
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Ver Loja Online
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sair / Deslogar</span>
            </button>
          </div>
        </div>
        {/* TAB 1: OVERVIEW & DASHBOARD */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Daily Motivational Message (Item 41 from prompt) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-600/20 via-amber-600/15 to-transparent border border-orange-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">
                    MENSAGEM DO DIA • BELGA MÓVEIS
                  </span>
                  <p className="text-xs sm:text-sm font-medium text-white italic mt-0.5">
                    "{dailyMessage}"
                  </p>
                </div>
              </div>
            </div>

            {/* Top Metrics Grid (Item 28) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 font-bold uppercase">Faturamento Hoje</span>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {formatCurrency(revenueToday)}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Pagamentos recebidos hoje</span>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 font-bold uppercase">Faturamento no Mês</span>
                <div className="text-2xl font-black text-white mt-1">
                  {formatCurrency(revenueMonth)}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Entradas e parcelas pagas</span>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                <span className="text-xs text-orange-400 font-bold uppercase">Total a Receber</span>
                <div className="text-2xl font-black text-orange-400 mt-1">
                  {formatCurrency(totalReceivable)}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Carteira ativa de crediário</span>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                <span className="text-xs text-rose-400 font-bold uppercase">Inadimplência / Atrasadas</span>
                <div className="text-2xl font-black text-rose-400 mt-1">
                  {formatCurrency(totalOverdue)}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {overdueInstallments.length} parcelas vencidas
                </span>
              </div>
            </div>

            {/* Overdue alerts & quick billing actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Overdue Installments Billing Box */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <h3 className="font-bold text-white text-base">Cobranças Prioritárias</h3>
                  </div>
                  <span className="text-xs bg-rose-500/20 text-rose-300 font-bold px-2.5 py-1 rounded-full">
                    {overdueInstallments.length} em atraso
                  </span>
                </div>

                {overdueInstallments.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Nenhuma parcela em atraso! Todos os pagamentos estão em dia.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {overdueInstallments.slice(0, 5).map((inst) => {
                      const daysLate = Math.abs(getDaysDiffFromToday(inst.dueDate));
                      return (
                        <div
                          key={inst.id}
                          className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-white">{inst.customerName}</span>
                            <span className="text-slate-400 block text-[11px]">
                              Parcela {inst.number}/{inst.totalInstallments} • Vencida há {daysLate} dias ({formatDateBR(inst.dueDate)})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-bold text-rose-400">{formatCurrency(inst.amount)}</span>
                            <a
                              href={getWhatsAppUrl(
                                '21973934438',
                                buildOverdueInstallmentWhatsAppMessage(
                                  inst.customerName,
                                  inst,
                                  daysLate,
                                  settings?.pixKey || '21966567027'
                                )
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                            >
                              <PhoneCall className="w-3 h-3" /> Cobrar WA
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Installments Due Today */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-white text-base">Vencendo Hoje</h3>
                  </div>
                  <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2.5 py-1 rounded-full">
                    {installmentsDueToday.length} hoje
                  </span>
                </div>

                {installmentsDueToday.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Nenhuma parcela programada com vencimento para hoje.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {installmentsDueToday.map((inst) => (
                      <div
                        key={inst.id}
                        className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">{inst.customerName}</span>
                          <span className="text-slate-400 block text-[11px]">
                            Ficha #{inst.fichaNumber} • Parcela {inst.number}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-400">{formatCurrency(inst.amount)}</span>
                          <button
                            onClick={() => {
                              setPaymentModalInstallment(inst);
                              setPaymentAmount(inst.amount);
                            }}
                            className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[10px] font-bold"
                          >
                            Dar Baixa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PDV (PONTO DE VENDA BALCÃO) (Item 24 from prompt) */}
        {tab === 'pdv' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">PDV - Ponto de Venda & Balcão</h2>
                <p className="text-xs text-slate-400">
                  Emita vendas com Crediário Digital e impressão de ficha no balcão da loja.
                </p>
              </div>

              {pdvSuccessMsg && (
                <div className="p-4 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>{pdvSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handlePdvSubmit} className="space-y-5 text-xs">
                {/* 1. Select Customer */}
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                  <label className="font-bold text-orange-400 uppercase text-[11px] block">
                    1. Identificação do Cliente
                  </label>
                  <select
                    value={pdvCustomerId}
                    onChange={(e) => setPdvCustomerId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 rounded-xl border border-slate-700 font-semibold text-white outline-none"
                  >
                    <option value="">Selecione um cliente já cadastrado...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.cpf})
                      </option>
                    ))}
                    <option value="new">+ Cadastrar Novo Cliente no Balcão</option>
                  </select>

                  {pdvCustomerId === 'new' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <input
                        type="text"
                        placeholder="Nome Completo *"
                        value={pdvNewCustomerName}
                        onChange={(e) => setPdvNewCustomerName(e.target.value)}
                        className="px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-white"
                      />
                      <input
                        type="text"
                        placeholder="CPF *"
                        value={pdvNewCustomerCpf}
                        onChange={(e) => setPdvNewCustomerCpf(e.target.value)}
                        className="px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-white"
                      />
                      <input
                        type="text"
                        placeholder="Telefone / WhatsApp"
                        value={pdvNewCustomerPhone}
                        onChange={(e) => setPdvNewCustomerPhone(e.target.value)}
                        className="px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-white"
                      />
                      <input
                        type="text"
                        placeholder="Endereço / Bairro"
                        value={pdvNewCustomerAddress}
                        onChange={(e) => setPdvNewCustomerAddress(e.target.value)}
                        className="px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-white"
                      />
                    </div>
                  )}
                </div>

                {/* 2. Select Product */}
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                  <label className="font-bold text-blue-400 uppercase text-[11px] block">
                    2. Seleção de Mercadorias
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-3">
                      <select
                        value={pdvSelectedProductId}
                        onChange={(e) => setPdvSelectedProductId(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 bg-slate-950 rounded-xl border border-slate-700 font-semibold text-white outline-none"
                      >
                        <option value="">Selecione o produto...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} - {formatCurrency(p.price)} (Estoque: {p.stock})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <input
                        type="number"
                        min="1"
                        value={pdvQuantity}
                        onChange={(e) => setPdvQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2.5 bg-slate-950 rounded-xl border border-slate-700 font-bold text-white text-center"
                        title="Quantidade"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Parcelamento Crediário */}
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                  <label className="font-bold text-amber-400 uppercase text-[11px] block">
                    3. Plano do Crediário
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400 block mb-1">Entrada (R$)</span>
                      <input
                        type="number"
                        min="0"
                        value={pdvEntry}
                        onChange={(e) => setPdvEntry(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Periodicidade</span>
                      <select
                        value={pdvFrequency}
                        onChange={(e) => setPdvFrequency(e.target.value as PaymentFrequency)}
                        className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-white font-bold"
                      >
                        <option value="Mensal">Mensal</option>
                        <option value="Quinzenal">Quinzenal</option>
                        <option value="Semanal">Semanal</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Parcelas</span>
                      <select
                        value={pdvInstallmentsCount}
                        onChange={(e) => setPdvInstallmentsCount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-white font-bold"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                          <option key={n} value={n}>
                            {n}x parcelas
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {pdvProduct && (
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <span>Total: <strong>{formatCurrency(pdvSubtotal)}</strong></span>
                      <span className="text-amber-400 font-extrabold text-sm">
                        {pdvInstallmentsCount}x de {formatCurrency(pdvPlan.installmentAmount)} ({pdvFrequency})
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!pdvProduct}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-black text-sm rounded-2xl shadow-lg transition-all disabled:opacity-50"
                >
                  FINALIZAR VENDA E EMITIR FICHA NO CREDIÁRIO
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS LIST & FICHA EMISSION */}
        {tab === 'orders' && (
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Pedidos & Fichas Digitais</h2>
                <p className="text-xs text-slate-400">
                  Gerencie o status dos pedidos e emita fichas para impressão física.
                </p>
              </div>
              <button
                onClick={exportOrdersCSV}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors self-start"
              >
                <Download className="w-4 h-4" /> Exportar CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Pedido</th>
                    <th className="p-3">Ficha Nº</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Condição</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-900/60">
                      <td className="p-3 font-bold text-white">#{order.orderNumber}</td>
                      <td className="p-3 font-mono font-bold text-orange-400">#{order.fichaNumber}</td>
                      <td className="p-3">
                        <span className="font-semibold text-white block">{order.customerName}</span>
                        <span className="text-[11px] text-slate-500">{order.customerPhone}</span>
                      </td>
                      <td className="p-3 font-black text-white">{formatCurrency(order.subtotal)}</td>
                      <td className="p-3 text-slate-300">
                        {order.installmentsCount}x {order.frequency}
                      </td>
                      <td className="p-3">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as any, currentUser?.email || 'admin')}
                          className="px-2 py-1 bg-slate-900 rounded-lg border border-slate-700 text-xs font-bold text-white outline-none"
                        >
                          <option value="Novo">Novo</option>
                          <option value="Em análise">Em análise</option>
                          <option value="Aprovado">Aprovado</option>
                          <option value="Em separação">Em separação</option>
                          <option value="Enviado">Enviado</option>
                          <option value="Entregue">Entregue</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            setSelectedOrderForPrint(order);
                            setTab('print-ficha');
                          }}
                          className="px-2.5 py-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" /> Imprimir Ficha
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3.5: CUSTOMERS MANAGEMENT IN REAL-TIME */}
        {tab === 'customers' && (
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Clientes & Cadastros</h2>
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Tempo Real (Firestore)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Base completa de clientes cadastrados pelo site e balcão com endereço, WhatsApp e histórico.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCustomerStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    customerStatusFilter === 'all' ? 'bg-orange-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Todos ({customers.length})
                </button>
                <button
                  onClick={() => setCustomerStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    customerStatusFilter === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Ativos ({customers.filter((c) => c.status !== 'blocked').length})
                </button>
                <button
                  onClick={() => setCustomerStatusFilter('blocked')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    customerStatusFilter === 'blocked' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Bloqueados ({customers.filter((c) => c.status === 'blocked').length})
                </button>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar cliente por nome, CPF, telefone, e-mail ou endereço..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs font-semibold text-white placeholder-slate-500 outline-none focus:border-orange-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>

            {/* Customers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">CPF</th>
                    <th className="p-3">Contato / WhatsApp</th>
                    <th className="p-3">Endereço de Entrega</th>
                    <th className="p-3">Total Compras</th>
                    <th className="p-3">Saldo Aberto</th>
                    <th className="p-3">Cadastrado em</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {customers
                    .filter((c) => {
                      if (customerStatusFilter === 'active' && c.status === 'blocked') return false;
                      if (customerStatusFilter === 'blocked' && c.status !== 'blocked') return false;
                      if (!customerSearch.trim()) return true;
                      const q = customerSearch.toLowerCase();
                      return (
                        c.name?.toLowerCase().includes(q) ||
                        c.cpf?.includes(q) ||
                        c.phone?.includes(q) ||
                        c.whatsapp?.includes(q) ||
                        c.email?.toLowerCase().includes(q) ||
                        c.address?.neighborhood?.toLowerCase().includes(q) ||
                        c.address?.street?.toLowerCase().includes(q) ||
                        c.address?.city?.toLowerCase().includes(q)
                      );
                    })
                    .map((c) => {
                      const customerOrders = orders.filter(
                        (o) => o.customerId === c.id || o.userId === c.id || o.customerCpf === c.cpf
                      );
                      const totalPurchases =
                        c.totalPurchases || customerOrders.reduce((sum, o) => sum + o.subtotal, 0);
                      const customerInsts = installments.filter(
                        (i) => i.customerId === c.id || i.userId === c.id
                      );
                      const openBal = customerInsts
                        .filter((i) => i.status !== 'Pago' && i.status !== 'Cancelada')
                        .reduce((sum, i) => sum + i.amount, 0);

                      return (
                        <tr key={c.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-orange-600/20 text-orange-400 border border-orange-500/30 font-black text-xs flex items-center justify-center shrink-0">
                                {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{c.name || 'Cliente'}</span>
                                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[140px] block">
                                  {c.email || 'Sem e-mail'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-slate-300 font-semibold">{c.cpf || 'Não informado'}</td>
                          <td className="p-3">
                            <div className="space-y-0.5">
                              <span className="text-white block font-semibold">
                                {c.phone || c.whatsapp || 'Não informado'}
                              </span>
                              {(c.whatsapp || c.phone) && (
                                <a
                                  href={getWhatsAppUrl(
                                    c.whatsapp || c.phone,
                                    `Olá, *${c.name}*! Aqui é da Belga Móveis.`
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold"
                                >
                                  <PhoneCall className="w-2.5 h-2.5" /> WhatsApp
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-slate-300 max-w-xs truncate">
                            {c.address ? (
                              <span>
                                {c.address.street ? `${c.address.street}, ${c.address.number || 'S/N'}` : ''}
                                {c.address.neighborhood ? ` - ${c.address.neighborhood}` : ''}
                                {c.address.city ? ` (${c.address.city}/${c.address.state || 'RJ'})` : ''}
                              </span>
                            ) : (
                              <span className="text-slate-500">Endereço não cadastrado</span>
                            )}
                          </td>
                          <td className="p-3 font-black text-white">{formatCurrency(totalPurchases)}</td>
                          <td className="p-3 font-black text-orange-400">
                            {formatCurrency(openBal || c.openBalance || 0)}
                          </td>
                          <td className="p-3 text-slate-400 text-[11px]">
                            {c.createdAt ? formatDateBR(c.createdAt) : 'Recente'}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={async () => {
                                const newStatus = c.status === 'blocked' ? 'active' : 'blocked';
                                await updateCustomerStatus(c.id, newStatus);
                              }}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                c.status === 'blocked'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {c.status === 'blocked' ? 'Bloqueado' : 'Ativo'}
                            </button>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => setSelectedCustomerForModal(c)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <FileText className="w-3 h-3 text-orange-400" />
                              <span>Ver Detalhes</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>

              {customers.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Nenhum cliente cadastrado até o momento. Os cadastros feitos pelo site aparecerão aqui instantaneamente.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: INSTALLMENTS & PAYMENTS MANAGEMENT */}
        {tab === 'installments' && (
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Controle de Parcelas & Crediário</h2>
                <p className="text-xs text-slate-400">
                  Gerencie vencimentos, registre baixas e cobre clientes via WhatsApp.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setInstallmentFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    installmentFilter === 'all' ? 'bg-orange-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setInstallmentFilter('overdue')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    installmentFilter === 'overdue' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Atrasadas
                </button>
                <button
                  onClick={() => setInstallmentFilter('today')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    installmentFilter === 'today' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Hoje
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Ficha Nº</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Parcela</th>
                    <th className="p-3">Vencimento</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {installments
                    .filter((inst) => {
                      if (installmentFilter === 'overdue') {
                        return inst.status !== 'Pago' && getDaysDiffFromToday(inst.dueDate) < 0;
                      }
                      if (installmentFilter === 'today') {
                        return inst.status !== 'Pago' && getDaysDiffFromToday(inst.dueDate) === 0;
                      }
                      return true;
                    })
                    .map((inst) => (
                      <tr key={inst.id} className="hover:bg-slate-900/60">
                        <td className="p-3 font-mono font-bold text-orange-400">#{inst.fichaNumber}</td>
                        <td className="p-3 font-semibold text-white">{inst.customerName}</td>
                        <td className="p-3 text-slate-300">
                          {inst.number}/{inst.totalInstallments}
                        </td>
                        <td className="p-3 text-slate-300">{formatDateBR(inst.dueDate)}</td>
                        <td className="p-3 font-black text-white">{formatCurrency(inst.amount)}</td>
                        <td className="p-3">
                          {inst.status === 'Pago' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                              Pago
                            </span>
                          ) : getDaysDiffFromToday(inst.dueDate) < 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300">
                              Atrasada
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                              Pendente
                            </span>
                          )}
                        </td>
                        <td className="p-3 flex items-center gap-2">
                          {inst.status !== 'Pago' && (
                            <button
                              onClick={() => {
                                setPaymentModalInstallment(inst);
                                setPaymentAmount(inst.amount);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold"
                            >
                              Receber
                            </button>
                          )}
                          <a
                            href={getWhatsAppUrl(
                              '21973934438',
                              buildInstallmentReminderWhatsAppMessage(
                                inst.customerName,
                                inst,
                                settings?.pixKey || '21966567027',
                                settings?.whatsapp || '21973934438'
                              )
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold"
                          >
                            Lembrete WA
                          </a>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PRODUCTS & STOCK MANAGEMENT */}
        {tab === 'products' && (
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Catálogo & Controle de Estoque</h2>
                <p className="text-xs text-slate-400">
                  Cadastre produtos, altere preços, gerencie imagens e monitore estoque.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingProduct({
                    name: '',
                    price: 2800,
                    creditPrice: 2800,
                    stock: 5,
                    minStock: 2,
                    sku: `BELGA-${Date.now().toString().slice(-4)}`,
                    description: '',
                    active: true,
                    images: [],
                  });
                  setIsProductModalOpen(true);
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" /> Cadastrar Produto
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Foto</th>
                    <th className="p-3">Produto</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Preço Normal</th>
                    <th className="p-3">Preço Crediário</th>
                    <th className="p-3">Estoque</th>
                    <th className="p-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-900/60">
                      <td className="p-3">
                        <img
                          src={prod.images[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=100&q=80'}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover bg-slate-800"
                        />
                      </td>
                      <td className="p-3 font-bold text-white">{prod.name}</td>
                      <td className="p-3 font-mono text-slate-400">{prod.sku}</td>
                      <td className="p-3 font-black text-white">{formatCurrency(prod.price)}</td>
                      <td className="p-3 text-orange-400 font-bold">{formatCurrency(prod.creditPrice || prod.price)}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            prod.stock <= (prod.minStock || 2)
                              ? 'bg-rose-500/20 text-rose-300 animate-pulse'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {prod.stock} un.
                        </span>
                      </td>
                      <td className="p-3 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(prod);
                            setIsProductModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Deseja excluir o produto ${prod.name}?`)) {
                              await deleteProduct(prod.id);
                            }
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-400 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: PRINT DIGITAL FICHA (Item 60 from prompt) */}
        {tab === 'print-ficha' && selectedOrderForPrint && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between print:hidden">
              <button
                onClick={() => setTab('orders')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
              >
                Voltar aos Pedidos
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg"
              >
                <Printer className="w-4 h-4" /> Imprimir Ficha Física
              </button>
            </div>

            {/* Reproduction of the traditional physical crediário card from image */}
            <div className="bg-white text-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-300 font-sans print:border-none print:shadow-none print:p-0">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <img src={BELGA_LOGO_URL} alt="Belga Móveis" className="w-16 h-16 object-contain" />
                  <div>
                    <h1 className="text-2xl font-black tracking-tight">BELGA MÓVEIS</h1>
                    <p className="text-xs font-bold text-orange-600 uppercase">Seu lar mais completo!</p>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-600 font-medium">
                  <p>Atendimento: <strong>(21) 97393-4438</strong></p>
                  <p>Crediário e Pix: <strong>(21) 96656-7027</strong></p>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-300 pb-3 mb-4">
                <span className="text-sm font-black uppercase">CREDIÁRIO BELGA</span>
                <span className="text-base font-black font-mono">
                  FICHA Nº: #{selectedOrderForPrint.fichaNumber}
                </span>
                <span className="text-xs text-slate-600 font-bold">
                  Data: {formatDateBR(selectedOrderForPrint.createdAt)}
                </span>
              </div>

              <div className="space-y-3 text-xs mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Sr.(a):</span>
                    <span className="font-extrabold text-sm">{selectedOrderForPrint.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">CPF:</span>
                    <span className="font-mono font-bold">{selectedOrderForPrint.customerCpf}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Endereço:</span>
                  <span className="font-semibold">
                    {selectedOrderForPrint.customerAddress.street}, Nº {selectedOrderForPrint.customerAddress.number} - Bairro: {selectedOrderForPrint.customerAddress.neighborhood}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Mercadorias:</span>
                  <div className="font-bold text-slate-800 space-y-1">
                    {selectedOrderForPrint.items.map((it, idx) => (
                      <div key={idx}>
                        • {it.quantity}x {it.productName} ({formatCurrency(it.unitPrice)})
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-100 rounded-xl text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">TOTAL</span>
                    <span className="font-black text-sm">{formatCurrency(selectedOrderForPrint.subtotal)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Plano</span>
                    <span className="font-black text-sm">
                      {selectedOrderForPrint.installmentsCount}x ({selectedOrderForPrint.frequency})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Valor Parcela</span>
                    <span className="font-black text-sm">{formatCurrency(selectedOrderForPrint.installmentAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Physical Ledger Table Format: Data | Pagou | Resta */}
              <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-200 text-slate-800 font-black uppercase text-[10px]">
                    <tr>
                      <th className="p-2 border-r border-slate-300 text-center">Nº</th>
                      <th className="p-2 border-r border-slate-300">Vencimento</th>
                      <th className="p-2 border-r border-slate-300 text-right">Valor</th>
                      <th className="p-2 border-r border-slate-300 text-center">Data Pagou</th>
                      <th className="p-2 text-right">Resta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[...Array(selectedOrderForPrint.installmentsCount)].map((_, i) => (
                      <tr key={i} className="h-7">
                        <td className="p-2 border-r border-slate-300 text-center font-bold">{i + 1}</td>
                        <td className="p-2 border-r border-slate-300">
                          {formatDateBR(
                            new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toISOString()
                          )}
                        </td>
                        <td className="p-2 border-r border-slate-300 text-right font-semibold">
                          {formatCurrency(selectedOrderForPrint.installmentAmount)}
                        </td>
                        <td className="p-2 border-r border-slate-300 text-center">_____/_____</td>
                        <td className="p-2 text-right">R$ ____________</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-8 border-t border-slate-300 flex items-center justify-between text-xs text-slate-500">
                <div className="text-center w-56 border-t border-slate-400 pt-1">
                  Assinatura do Cliente
                </div>
                <div className="text-center w-56 border-t border-slate-400 pt-1">
                  Visto Belga Móveis
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS & WHATSAPP (Item 43 from prompt) */}
        {tab === 'settings' && (
          <div className="max-w-3xl mx-auto bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white">Configurações do Sistema</h2>
              <p className="text-xs text-slate-400">
                Gerencie contatos comerciais, chave Pix, regras do crediário e integrações.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (settings) {
                  await saveSettings(settings);
                  alert('Configurações salvas com sucesso!');
                }
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">WhatsApp Comercial *</label>
                  <input
                    type="text"
                    value={settings?.whatsapp || ''}
                    onChange={(e) => setSettings((prev) => prev ? { ...prev, whatsapp: e.target.value } : null)}
                    className="w-full px-3 py-2 bg-slate-900 rounded-xl border border-slate-700 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Telefone da Loja</label>
                  <input
                    type="text"
                    value={settings?.phone || ''}
                    onChange={(e) => setSettings((prev) => prev ? { ...prev, phone: e.target.value } : null)}
                    className="w-full px-3 py-2 bg-slate-900 rounded-xl border border-slate-700 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Chave Pix do Crediário *</label>
                  <input
                    type="text"
                    value={settings?.pixKey || ''}
                    onChange={(e) => setSettings((prev) => prev ? { ...prev, pixKey: e.target.value } : null)}
                    className="w-full px-3 py-2 bg-slate-900 rounded-xl border border-slate-700 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">WhatsApp Cobrança / Pix</label>
                  <input
                    type="text"
                    value={settings?.crediarioPixPhone || ''}
                    onChange={(e) => setSettings((prev) => prev ? { ...prev, crediarioPixPhone: e.target.value } : null)}
                    className="w-full px-3 py-2 bg-slate-900 rounded-xl border border-slate-700 text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Texto Contratual do Crediário</label>
                <textarea
                  rows={4}
                  value={settings?.contractText || ''}
                  onChange={(e) => setSettings((prev) => prev ? { ...prev, contractText: e.target.value } : null)}
                  className="w-full px-3 py-2 bg-slate-900 rounded-xl border border-slate-700 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all"
              >
                Salvar Alterações
              </button>
            </form>

            {/* Push Notification Broadcast Console */}
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Central de Disparo de Notificações Push</h3>
                  <p className="text-[11px] text-slate-400">
                    Envie alertas em massa para o navegador e celular dos clientes cadastrados.
                  </p>
                </div>
              </div>

              {pushSentToast && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{pushSentToast}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Título da Notificação
                  </label>
                  <input
                    type="text"
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 rounded-xl border border-slate-700 text-xs text-white font-semibold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Mensagem Push
                  </label>
                  <textarea
                    rows={2}
                    value={pushBody}
                    onChange={(e) => setPushBody(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 rounded-xl border border-slate-700 text-xs text-white font-medium outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      sendPushNotification({
                        title: pushTitle || 'Belga Móveis',
                        body: pushBody || 'Confira os lançamentos no catálogo!',
                        url: '#catalogo',
                        tag: 'broadcast-promo',
                      });
                      setPushSentToast('Notificação push disparada com sucesso!');
                      setTimeout(() => setPushSentToast(''), 4000);
                    }}
                    className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-600/25"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Disparar Notificação para Clientes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      notifyCatalogPromotion('Colchão Queen Smart Lis Mola', 'R$ 2.716,80', '12x de R$ 226,40');
                      setPushSentToast('Aviso de promoção de colchão disparado!');
                      setTimeout(() => setPushSentToast(''), 4000);
                    }}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
                  >
                    Exemplo: Promoção Queen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: CHAT COM CLIENTES */}
        {tab === 'chat' && (
          <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden flex flex-col md:flex-row h-[600px]">
            {/* Conversations list */}
            <div className="w-full md:w-72 border-r border-slate-800 p-4 overflow-y-auto space-y-2">
              <h3 className="font-bold text-white text-xs uppercase mb-3">Conversas Ativas</h3>
              {chatCustomerIds.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhuma mensagem no momento.</p>
              ) : (
                chatCustomerIds.map((cId) => {
                  const cust = customers.find((c) => c.id === cId);
                  return (
                    <button
                      key={cId}
                      onClick={() => setSelectedChatCustomerId(cId)}
                      className={`w-full text-left p-3 rounded-xl text-xs transition-colors block ${
                        selectedChatCustomerId === cId ? 'bg-orange-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-bold block">{cust?.name || `Cliente (${cId.slice(0, 6)})`}</span>
                      <span className="text-[10px] opacity-75">{cust?.phone || ''}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Conversation Messages and Input */}
            <div className="flex-1 flex flex-col justify-between p-4">
              <div className="flex-1 overflow-y-auto space-y-3 p-2">
                {!selectedChatCustomerId ? (
                  <div className="text-center py-20 text-slate-500 text-xs">
                    Selecione um cliente para visualizar e responder as mensagens.
                  </div>
                ) : (
                  messages
                    .filter((m) => m.customerId === selectedChatCustomerId)
                    .map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.senderRole === 'admin' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-md p-3 rounded-2xl text-xs ${
                            msg.senderRole === 'admin'
                              ? 'bg-orange-600 text-white'
                              : 'bg-slate-800 text-slate-200'
                          }`}
                        >
                          <span className="block text-[10px] font-bold opacity-75">{msg.senderName}</span>
                          <p>{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                )}
              </div>

              {selectedChatCustomerId && (
                <form onSubmit={handleSendAdminReply} className="flex gap-2 pt-3 border-t border-slate-800">
                  <input
                    type="text"
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    placeholder="Digite a resposta oficial da Belga Móveis..."
                    className="flex-1 px-4 py-2.5 bg-slate-900 rounded-xl border border-slate-700 text-xs text-white outline-none"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold"
                  >
                    Enviar
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Payment Registration Modal (Item 25 from prompt) */}
      {paymentModalInstallment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Registrar Pagamento</h3>
              <button onClick={() => setPaymentModalInstallment(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterPaymentSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl space-y-1">
                <span className="text-slate-400 block">Cliente: <strong>{paymentModalInstallment.customerName}</strong></span>
                <span className="text-slate-400 block">Parcela: <strong>{paymentModalInstallment.number}/{paymentModalInstallment.totalInstallments}</strong> (Ficha #{paymentModalInstallment.fichaNumber})</span>
                <span className="text-slate-400 block">Valor Previsto: <strong>{formatCurrency(paymentModalInstallment.amount)}</strong></span>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Valor Pago (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-white font-black text-base"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Forma de Pagamento *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-white font-bold"
                >
                  <option value="Pix">Pix (Chave da Loja)</option>
                  <option value="Dinheiro">Dinheiro no Balcão</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Transferência">Transferência Bancária</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Observações do Recebimento</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ex: Comprovante verificado via WhatsApp"
                  className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg transition-all"
              >
                Confirmar Recebimento e Emitir Recibo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Create Product Modal */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingProduct.id ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Preço Normal (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Preço Crediário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.creditPrice || editingProduct.price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, creditPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Estoque Atual</label>
                  <input
                    type="number"
                    value={editingProduct.stock || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">SKU</label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Foto Principal (URL)</label>
                <input
                  type="text"
                  value={editingProduct.images?.[0] || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, images: [e.target.value] })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-700 text-white font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-md"
              >
                Salvar Produto
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Customer Detail & Ledger Modal */}
      {selectedCustomerForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-2xl w-full space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-600/20 border border-orange-500/30 text-orange-400 font-black text-lg flex items-center justify-center">
                  {selectedCustomerForModal.name ? selectedCustomerForModal.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">{selectedCustomerForModal.name}</h3>
                  <p className="text-xs text-slate-400">
                    CPF: <span className="font-mono text-slate-200">{selectedCustomerForModal.cpf || 'Não informado'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerForModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-500 font-bold block uppercase text-[10px]">E-mail</span>
                <span className="text-white font-semibold">{selectedCustomerForModal.email || 'Não informado'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Telefone / Celular</span>
                <span className="text-white font-semibold">{selectedCustomerForModal.phone || 'Não informado'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block uppercase text-[10px]">WhatsApp</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-white font-semibold">{selectedCustomerForModal.whatsapp || selectedCustomerForModal.phone || 'Não informado'}</span>
                  {(selectedCustomerForModal.whatsapp || selectedCustomerForModal.phone) && (
                    <a
                      href={getWhatsAppUrl(selectedCustomerForModal.whatsapp || selectedCustomerForModal.phone, `Olá, ${selectedCustomerForModal.name}! Atendimento Belga Móveis.`)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-0.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded font-bold text-[10px]"
                    >
                      Abrir WhatsApp
                    </a>
                  )}
                </div>
              </div>
              <div>
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Data de Nascimento</span>
                <span className="text-white font-semibold">{selectedCustomerForModal.birthDate ? formatDateBR(selectedCustomerForModal.birthDate) : 'Não informada'}</span>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-slate-900">
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Endereço Completo de Entrega</span>
                <span className="text-white font-semibold block mt-0.5">
                  {selectedCustomerForModal.address?.street
                    ? `${selectedCustomerForModal.address.street}, Nº ${selectedCustomerForModal.address.number || 'S/N'}${
                        selectedCustomerForModal.address.complement ? ` (${selectedCustomerForModal.address.complement})` : ''
                      } - ${selectedCustomerForModal.address.neighborhood || ''}, ${selectedCustomerForModal.address.city || ''}/${
                        selectedCustomerForModal.address.state || 'RJ'
                      } - CEP: ${selectedCustomerForModal.address.cep || ''}`
                    : 'Endereço ainda não preenchido'}
                </span>
              </div>
            </div>

            {/* Orders by this Customer */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
                Fichas & Pedidos Vinculados ({orders.filter(o => o.customerId === selectedCustomerForModal.id || o.userId === selectedCustomerForModal.id || o.customerCpf === selectedCustomerForModal.cpf).length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {orders
                  .filter(o => o.customerId === selectedCustomerForModal.id || o.userId === selectedCustomerForModal.id || o.customerCpf === selectedCustomerForModal.cpf)
                  .map((ord) => (
                    <div key={ord.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white block">Pedido #{ord.orderNumber} • Ficha #{ord.fichaNumber}</span>
                        <span className="text-slate-400 text-[11px]">{formatDateBR(ord.createdAt)} • {ord.items.length} itens • {ord.paymentType === 'crediario' ? `${ord.installmentsCount}x no Crediário` : 'À Vista'}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-orange-400 block">{formatCurrency(ord.subtotal)}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">{ord.status}</span>
                      </div>
                    </div>
                  ))}
                {orders.filter(o => o.customerId === selectedCustomerForModal.id || o.userId === selectedCustomerForModal.id || o.customerCpf === selectedCustomerForModal.cpf).length === 0 && (
                  <p className="text-slate-500 py-3 text-center">Nenhum pedido realizado até o momento.</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedCustomerForModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
