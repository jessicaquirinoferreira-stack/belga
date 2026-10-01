import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { BELGA_LOGO_URL } from './branding';

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  badge?: string;
}

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register Service Worker for Push Notifications
 */
export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported in this browser.');
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    console.log('Belga Móveis Push Service Worker registered successfully.');
    return reg;
  } catch (error) {
    console.warn('Service worker registration warning (normal in some sandboxes):', error);
    return null;
  }
}

/**
 * Check Current Notification Permission
 */
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request Push Notification Permission from the Customer
 */
export async function requestPushPermission(userId?: string): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const reg = await registerPushServiceWorker();
      
      // Save subscription state in Firestore if user is identified
      if (userId && db) {
        try {
          await setDoc(doc(db, 'push_subscriptions', userId), {
            userId,
            grantedAt: new Date().toISOString(),
            status: 'active',
            userAgent: navigator.userAgent,
          }, { merge: true });
        } catch {
          // Non-blocking
        }
      }
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Permission request error:', err);
    return false;
  }
}

/**
 * Send Rich Push Notification through Service Worker (with fallback)
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<void> {
  const title = payload.title || 'Belga Móveis';
  const options: NotificationOptions = {
    body: payload.body,
    icon: BELGA_LOGO_URL,
    badge: BELGA_LOGO_URL,
    tag: payload.tag || 'belga-alert',
    data: { url: payload.url || '/' },
  };

  // Method 1: Via Service Worker Registration (Standard PWA Push)
  if (swRegistration && swRegistration.showNotification) {
    try {
      await swRegistration.showNotification(title, options);
      return;
    } catch {
      // Fallback to active worker
    }
  }

  // Method 2: Via Service Worker postMessage
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      payload: {
        title,
        body: payload.body,
        url: payload.url || '/',
        tag: payload.tag,
      },
    });
    return;
  }

  // Method 3: Direct Desktop Notification API fallback
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body: payload.body,
        icon: BELGA_LOGO_URL,
      });
      notif.onclick = () => {
        window.focus();
        if (payload.url) {
          window.location.hash = payload.url;
        }
      };
    } catch {
      // Ignore if in restricted context
    }
  }
}

/**
 * Notification Template: Order Status Update
 */
export function notifyOrderStatusChange(
  orderNumber: string,
  fichaNumber: string,
  newStatus: string
): void {
  const statusMessages: Record<string, string> = {
    'Em análise': 'Seu pedido está em análise de crédito pela equipe Belga.',
    'Aprovado': '🎉 Parabéns! Seu pedido e crediário foram APROVADOS com sucesso!',
    'Em separação': '📦 Seu produto foi direcionado para separação e conferência.',
    'Enviado': '🚚 Oba! Seu pedido saiu para entrega com destino ao seu endereço.',
    'Entregue': '⭐ Pedido entregue! Esperamos que você ame sua compra na Belga Móveis.',
    'Cancelado': 'Informamos que o pedido foi cancelado. Dúvidas pelo nosso WhatsApp.',
  };

  const body = statusMessages[newStatus] || `O status do seu pedido #${orderNumber} foi atualizado para: ${newStatus}`;

  sendPushNotification({
    title: `Belga Móveis • Pedido #${orderNumber}`,
    body,
    tag: `order-${orderNumber}`,
    url: '/portal',
  });
}

/**
 * Notification Template: New Catalog Product / Promotion
 */
export function notifyCatalogPromotion(
  productName: string,
  priceText: string,
  installmentText: string
): void {
  sendPushNotification({
    title: '✨ Novidade no Catálogo Belga Móveis!',
    body: `${productName} disponível! Parcele em ${installmentText} no crediário próprio sem burocracia.`,
    tag: 'catalog-promo',
    url: '#catalogo',
  });
}

/**
 * Notification Template: Crediário Installment Due Alert
 */
export function notifyInstallmentDueAlert(
  installmentNumber: number,
  totalInstallments: number,
  amountFormatted: string,
  dueDateFormatted: string
): void {
  sendPushNotification({
    title: '📄 Lembrete de Crediário Belga',
    body: `A parcela ${installmentNumber}/${totalInstallments} no valor de ${amountFormatted} vence em ${dueDateFormatted}. Pague com facilidade via Pix!`,
    tag: `installment-${installmentNumber}`,
    url: '/portal',
  });
}
