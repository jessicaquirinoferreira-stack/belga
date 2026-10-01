import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { 
  getNotificationPermissionStatus, 
  requestPushPermission, 
  sendPushNotification 
} from '../../lib/notifications';
import { useAuth } from '../../context/AuthContext';

export const PushNotificationPrompt: React.FC = () => {
  const { currentUser } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [grantedToast, setGrantedToast] = useState(false);

  useEffect(() => {
    // Only prompt if permission is 'default' and user has not dismissed in this session
    const status = getNotificationPermissionStatus();
    const dismissed = sessionStorage.getItem('belga_notif_prompt_dismissed');

    if (status === 'default' && !dismissed) {
      // Delay prompt slightly so user is not interrupted instantly on entry
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    const success = await requestPushPermission(currentUser?.uid);
    setShowPrompt(false);
    if (success) {
      setGrantedToast(true);
      // Send a welcome push test notification!
      sendPushNotification({
        title: 'Belga Móveis • Notificações Ativadas!',
        body: 'Você receberá avisos em tempo real sobre seus pedidos, parcelas e lançamentos.',
        tag: 'welcome',
      });
      setTimeout(() => setGrantedToast(false), 4500);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('belga_notif_prompt_dismissed', 'true');
    setShowPrompt(false);
  };

  if (grantedToast) {
    return (
      <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom duration-300 max-w-sm">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <Check className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-xs text-white">Notificações Ativadas!</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Você será informado no celular ou computador sempre que houver novidades.
          </p>
        </div>
      </div>
    );
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 sm:p-5 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 animate-bounce-subtle" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-orange-600 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Fique Atualizado</span>
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">
            Ativar Notificações do Pedido?
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Receba avisos instantâneos quando seu pedido for aprovado, enviado ou quando surgirem ofertas exclusivas de colchões.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 p-1 -mr-1"
          aria-label="Dispensar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 pt-1">
        <button
          onClick={handleEnable}
          className="flex-1 py-2.5 px-3 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/25 transition-all text-center"
        >
          Ativar Notificações
        </button>
        <button
          onClick={handleDismiss}
          className="py-2.5 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          Agora Não
        </button>
      </div>
    </div>
  );
};
