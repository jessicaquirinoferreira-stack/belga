import React, { useState, useEffect } from 'react';
import { 
  User, 
  FileText, 
  CreditCard, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  MessageCircle, 
  LogOut, 
  ChevronRight, 
  Sparkles, 
  Copy, 
  Check, 
  PhoneCall, 
  Send,
  Bell 
} from 'lucide-react';
import { 
  getNotificationPermissionStatus, 
  requestPushPermission, 
  sendPushNotification,
  notifyOrderStatusChange,
  notifyCatalogPromotion
} from '../../lib/notifications';
import { useAuth } from '../../context/AuthContext';
import { 
  Order, 
  Installment, 
  PaymentReceipt, 
  ChatMessage, 
  StoreSettings 
} from '../../types';
import { 
  formatCurrency, 
  formatDateBR, 
  getDaysDiffFromToday 
} from '../../lib/financial';
import { 
  subscribeOrders, 
  subscribeInstallments, 
  subscribePayments, 
  subscribeMessages, 
  sendChatMessage 
} from '../../lib/dbService';
import { getWhatsAppUrl } from '../../lib/api';

interface CustomerPortalProps {
  settings: StoreSettings;
  onNavigateHome: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  settings,
  onNavigateHome,
}) => {
  const { currentUser, userProfile, customerProfile, saveCustomerProfile, signOut, updateUserPassword } = useAuth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'crediario' | 'payments' | 'chat' | 'profile'>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<PaymentReceipt[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [pushStatus, setPushStatus] = useState<string>(() => getNotificationPermissionStatus());

  // Profile editable fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [cep, setCep] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    if (customerProfile) {
      setName(customerProfile.name || '');
      setPhone(customerProfile.phone || '');
      setWhatsapp(customerProfile.whatsapp || '');
      if (customerProfile.address) {
        setStreet(customerProfile.address.street || '');
        setNumber(customerProfile.address.number || '');
        setNeighborhood(customerProfile.address.neighborhood || '');
        setCity(customerProfile.address.city || '');
        setCep(customerProfile.address.cep || '');
      }
    }
  }, [customerProfile]);

  // Real-time subscriptions
  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    const unsubOrders = subscribeOrders((data) => {
      // Filter for this customer across all linked IDs
      const myOrders = data.filter((o) => 
        o.customerId === uid || 
        o.userId === uid || 
        (customerProfile?.id && o.customerId === customerProfile.id) ||
        (customerProfile?.cpf && o.customerCpf === customerProfile.cpf) ||
        (currentUser.email && o.customerCpf && customerProfile?.cpf && o.customerCpf === customerProfile.cpf)
      );
      setOrders(myOrders);
    });

    const unsubInsts = subscribeInstallments((data) => {
      const myInsts = data.filter((i) => 
        i.customerId === uid || 
        i.userId === uid || 
        (customerProfile?.id && i.customerId === customerProfile.id) ||
        (customerProfile?.cpf && orders.some(o => o.id === i.orderId))
      );
      setInstallments(myInsts);
    });

    const unsubPays = subscribePayments((data) => {
      const myPays = data.filter((p) => 
        p.customerId === uid || 
        (customerProfile?.id && p.customerId === customerProfile.id)
      );
      setPayments(myPays);
    });

    const unsubMsgs = subscribeMessages((data) => {
      setMessages(data);
    }, uid);

    return () => {
      unsubOrders();
      unsubInsts();
      unsubPays();
      unsubMsgs();
    };
  }, [currentUser, customerProfile]);

  // Calculations for KPI Cards
  const openBalance = installments
    .filter((i) => i.status !== 'Pago' && i.status !== 'Cancelada')
    .reduce((acc, i) => acc + i.amount, 0);

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  const pendingInstallments = installments.filter(
    (i) => i.status !== 'Pago' && i.status !== 'Cancelada'
  );

  const overdueInstallments = pendingInstallments.filter((i) => {
    return getDaysDiffFromToday(i.dueDate) < 0 || i.status === 'Atrasada';
  });

  const nextInstallment = pendingInstallments[0] || null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;
    setSendingMsg(true);
    try {
      await sendChatMessage({
        customerId: currentUser.uid,
        customerName: userProfile?.displayName || customerProfile?.name || 'Cliente',
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderRole: 'customer',
        senderName: userProfile?.displayName || customerProfile?.name || 'Cliente',
        read: false,
      });
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleCopyPix = () => {
    const key = settings.pixKey || settings.crediarioPixPhone || '21966567027';
    navigator.clipboard.writeText(key);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await saveCustomerProfile({
        name,
        phone,
        whatsapp,
        address: {
          cep,
          street,
          number,
          neighborhood,
          city,
          state: customerProfile?.address?.state || 'RJ',
        },
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    try {
      await updateUserPassword(newPassword);
      setPasswordMsg('Senha alterada com sucesso!');
      setNewPassword('');
    } catch (err: any) {
      setPasswordMsg(err.message || 'Erro ao alterar senha.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              {userProfile?.displayName?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
                  PORTAL DO CLIENTE
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  Crediário Ativo
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
                Olá, {userProfile?.displayName || customerProfile?.name || 'Cliente'}!
              </h1>
              <p className="text-xs text-slate-500">
                Acompanhe seus pedidos, fichas digitais, parcelas e pagamentos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyPix}
              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
            >
              {pixCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{pixCopied ? 'Chave Pix Copiada!' : 'Copiar Chave Pix'}</span>
            </button>
            <button
              onClick={() => signOut()}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-600 transition-colors"
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('crediario')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'crediario'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Minhas Parcelas ({pendingInstallments.length})
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-blue-700 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Meus Pedidos ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Comprovantes ({payments.length})
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'chat'
                ? 'bg-purple-700 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Chat com a Loja
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            Meus Dados
          </button>
        </div>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* KPI Cards (Item 22 from prompt) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-400 block uppercase">Saldo em Aberto</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {formatCurrency(openBalance)}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {pendingInstallments.length} parcelas restantes
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-orange-600 block uppercase">Próxima Parcela</span>
                <div className="text-2xl font-black text-orange-600 mt-1">
                  {nextInstallment ? formatCurrency(nextInstallment.amount) : 'R$ 0,00'}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {nextInstallment ? `Vencimento: ${formatDateBR(nextInstallment.dueDate)}` : 'Nenhuma pendência'}
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-rose-600 block uppercase">Parcelas em Atraso</span>
                <div className="text-2xl font-black text-rose-600 mt-1">
                  {overdueInstallments.length}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {overdueInstallments.length > 0 ? 'Regularize via Pix' : 'Tudo em dia!'}
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-emerald-600 block uppercase">Total Já Quitado</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {formatCurrency(totalPaid)}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {payments.length} comprovantes emitidos
                </span>
              </div>
            </div>

            {/* Next Installment Banner with Pix instruction */}
            {nextInstallment && (
              <div className="p-6 rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase mb-2">
                    <Clock className="w-3.5 h-3.5" /> Próximo Vencimento
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold">
                    Parcela {nextInstallment.number} de {nextInstallment.totalInstallments} no valor de {formatCurrency(nextInstallment.amount)}
                  </h3>
                  <p className="text-xs text-orange-100 mt-1">
                    Vencimento previsto para <strong>{formatDateBR(nextInstallment.dueDate)}</strong> (Ficha #{nextInstallment.fichaNumber}).
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button
                    onClick={handleCopyPix}
                    className="px-5 py-3 bg-white text-orange-700 hover:bg-orange-50 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{pixCopied ? 'Chave Copiada!' : 'Copiar Chave Pix'}</span>
                  </button>

                  <a
                    href={getWhatsAppUrl(
                      settings.whatsapp || '21973934438',
                      `Olá, Belga Móveis! Gostaria de enviar o comprovante da minha parcela ${nextInstallment.number} (Ficha #${nextInstallment.fichaNumber}) no valor de ${formatCurrency(nextInstallment.amount)}.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Enviar Comprovante</span>
                  </a>
                </div>
              </div>
            )}

            {/* Quick table of recent orders */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4">Últimas Compras</h3>
              {orders.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Você ainda não possui pedidos registrados no sistema.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">Pedido #{order.orderNumber}</span>
                          <span className="text-xs text-orange-600 font-semibold font-mono">
                            (Ficha #{order.fichaNumber})
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {order.items.map((i) => i.productName).join(', ')} • {formatDateBR(order.createdAt)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="block text-sm font-black text-slate-900">
                          {formatCurrency(order.subtotal)}
                        </span>
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Push Notifications Status & Controls Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Notificações Push no Aparelho</h3>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      pushStatus === 'granted'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {pushStatus === 'granted' ? 'Ativadas' : 'Desativadas'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Receba no seu smartphone ou computador o andamento em tempo real dos seus pedidos e novidades do crediário.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                {pushStatus !== 'granted' ? (
                  <button
                    onClick={async () => {
                      const ok = await requestPushPermission(currentUser?.uid);
                      setPushStatus(ok ? 'granted' : 'denied');
                      if (ok) {
                        sendPushNotification({
                          title: 'Belga Móveis',
                          body: 'Notificações push ativadas com sucesso!',
                          tag: 'welcome',
                        });
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Ativar Notificações</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        notifyOrderStatusChange('104289', '001428', 'Em separação');
                      }}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                    >
                      Testar Aviso de Pedido
                    </button>
                    <button
                      onClick={() => {
                        notifyCatalogPromotion('Colchão Queen Smart Lis Mola', 'R$ 2.716,80', '12x de R$ 226,40');
                      }}
                      className="px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 rounded-xl text-xs font-bold transition-all"
                    >
                      Testar Novidade do Catálogo
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CREDIÁRIO & INSTALLMENTS */}
        {activeTab === 'crediario' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Tabela de Parcelas do Crediário</h2>
                <p className="text-xs text-slate-500">
                  Acompanhe cada vencimento, valores e comprovantes de pagamento.
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span>Chave Pix da Loja: <strong>{settings.pixKey || '21 96656-7027'}</strong></span>
              </div>
            </div>

            {installments.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                Nenhuma parcela cadastrada no momento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Parcela</th>
                      <th className="py-3 px-4">Ficha Nº</th>
                      <th className="py-3 px-4">Vencimento</th>
                      <th className="py-3 px-4">Valor</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {installments.map((inst) => {
                      const isOverdue = getDaysDiffFromToday(inst.dueDate) < 0 && inst.status !== 'Pago';
                      const isDueToday = getDaysDiffFromToday(inst.dueDate) === 0 && inst.status !== 'Pago';

                      return (
                        <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {inst.number}/{inst.totalInstallments}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                            #{inst.fichaNumber}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {formatDateBR(inst.dueDate)}
                          </td>
                          <td className="py-3.5 px-4 font-black text-slate-900">
                            {formatCurrency(inst.amount)}
                          </td>
                          <td className="py-3.5 px-4">
                            {inst.status === 'Pago' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Pago em {formatDateBR(inst.paidAt || '')}
                              </span>
                            ) : isOverdue ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                                Atrasada
                              </span>
                            ) : isDueToday ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                Vence Hoje
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                Pendente
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {inst.status !== 'Pago' ? (
                              <a
                                href={getWhatsAppUrl(
                                  settings.whatsapp || '21973934438',
                                  `Olá, Belga Móveis! Gostaria de realizar o pagamento da parcela ${inst.number}/${inst.totalInstallments} (Ficha #${inst.fichaNumber}) no valor de ${formatCurrency(inst.amount)}.`
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                              >
                                Pagar no Pix
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Quita</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <span className="text-xs font-bold text-orange-600 block uppercase">
                      Ficha Digital #{order.fichaNumber}
                    </span>
                    <h3 className="text-lg font-black text-slate-900">Pedido #{order.orderNumber}</h3>
                    <span className="text-xs text-slate-500">{formatDateBR(order.createdAt)}</span>
                  </div>

                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      {order.status}
                    </span>
                    <div className="text-sm font-black text-slate-900 mt-1">
                      {formatCurrency(order.subtotal)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">Mercadorias:</h4>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1">
                      <span className="text-slate-800 font-medium">
                        {item.quantity}x {item.productName}
                      </span>
                      <span className="font-bold text-slate-900">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>

                {order.paymentType === 'crediario' && (
                  <div className="mt-4 p-3 rounded-xl bg-orange-50 border border-orange-200/80 text-xs flex items-center justify-between">
                    <span>
                      Financiamento: <strong>{order.installmentsCount}x de {formatCurrency(order.installmentAmount)}</strong> ({order.frequency})
                    </span>
                    <span className="text-orange-800 font-semibold">
                      1º Vencimento: {formatDateBR(order.firstDueDate)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: PAYMENTS & RECEIPTS */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Comprovantes & Recibos Emitidos</h2>
            {payments.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Nenhum pagamento registrado até o momento.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <div key={p.id} className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-emerald-700 block">
                        Recibo #{p.receiptNumber}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Parcela {p.installmentNumber} • {p.method}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Pago em {formatDateBR(p.paidAt)} • Registrado por {p.adminEmail}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-emerald-600">
                        {formatCurrency(p.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: REALTIME CHAT */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[550px]">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-sm">
                  B
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Atendimento Belga Móveis</h3>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online em tempo real
                  </span>
                </div>
              </div>
            </div>

            {/* Chat Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  Inicie uma conversa diretamente com o suporte da Belga Móveis!
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderRole === 'customer';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-md p-3.5 rounded-2xl text-xs ${
                          isMe
                            ? 'bg-orange-600 text-white rounded-tr-xs'
                            : 'bg-slate-100 text-slate-900 rounded-tl-xs'
                        }`}
                      >
                        <span className="block text-[10px] opacity-75 font-semibold mb-0.5">
                          {m.senderName}
                        </span>
                        <p className="leading-relaxed">{m.text}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem para o atendente..."
                className="flex-1 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:bg-white focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={sendingMsg || !newMessage.trim()}
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 6: PROFILE & PASSWORD */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Data Form */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Meus Dados Cadastrais</h2>
              {profileSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                  Dados atualizados com sucesso!
                </div>
              )}
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Telefone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Rua / Logradouro</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Número</label>
                    <input
                      type="text"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Bairro</label>
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Cidade</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition-all"
                >
                  {savingProfile ? 'Salvando...' : 'Atualizar Dados'}
                </button>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Segurança & Alteração de Senha</h2>
              {passwordMsg && (
                <div className="mb-4 p-3 bg-blue-50 text-blue-800 text-xs font-bold rounded-xl border border-blue-200">
                  {passwordMsg}
                </div>
              )}
              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Nova Senha</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-md transition-all"
                >
                  Salvar Nova Senha
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
