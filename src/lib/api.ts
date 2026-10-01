import { Address, Order, Installment } from '../types';
import { formatCurrency, formatDateBR } from './financial';

/**
 * ViaCEP Brazilian Postal Code lookup
 */
export async function fetchAddressByCep(cep: string): Promise<Partial<Address> | null> {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await res.json();
    if (data.erro) return null;

    return {
      cep: cleanCep.replace(/^(\d{5})(\d{3})$/, '$1-$2'),
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
}

/**
 * Upload file to server route /api/upload (Vercel Blob on server, dev fallback)
 */
export async function uploadFile(file: File, folder = 'belga-moveis'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
  } catch (err) {
    console.warn('Backend upload route not reachable or in preview dev, falling back to local base64/object URL:', err);
  }

  // Graceful client fallback for instant preview if no Vercel Blob token configured
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

/**
 * Normalizes Brazilian phone/whatsapp number to E.164 (5521999999999)
 */
export function cleanPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '5521973934438';
  if (digits.startsWith('55')) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

/**
 * Generates official wa.me link with encoded message
 */
export function getWhatsAppUrl(phone: string, message: string): string {
  const cleaned = cleanPhoneNumber(phone);
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

/**
 * Template: Order Summary for WhatsApp
 */
export function buildOrderWhatsAppMessage(order: Order, storePhone: string): string {
  const itemsText = order.items
    .map((item) => `• ${item.quantity}x ${item.productName} (${formatCurrency(item.unitPrice)})`)
    .join('\n');

  const paymentText =
    order.paymentType === 'crediario'
      ? `Crediário Belga Móveis:\nEntrada: ${formatCurrency(order.entry)}\nFinanciamento: ${order.installmentsCount}x de ${formatCurrency(order.installmentAmount)} (${order.frequency})\nPrimeiro vencimento: ${formatDateBR(order.firstDueDate)}`
      : `À Vista: ${formatCurrency(order.subtotal - order.discount)}`;

  return `*BELGA MÓVEIS*
*NOVO PEDIDO: #${order.orderNumber}*
Ficha Digital: #${order.fichaNumber}

*Cliente:* ${order.customerName}
*CPF:* ${order.customerCpf}
*Telefone:* ${order.customerPhone}

*Endereço de Entrega:*
${order.customerAddress.street}, ${order.customerAddress.number}
${order.customerAddress.neighborhood} - ${order.customerAddress.city}/${order.customerAddress.state}
CEP: ${order.customerAddress.cep}
${order.customerAddress.complement ? `Comp: ${order.customerAddress.complement}\n` : ''}${order.customerAddress.reference ? `Ref: ${order.customerAddress.reference}\n` : ''}
*Produtos:*
${itemsText}

*Valor Total:* ${formatCurrency(order.subtotal)}
${order.discount > 0 ? `*Desconto:* ${formatCurrency(order.discount)}\n` : ''}*Condição de Pagamento:*
${paymentText}

${order.notes ? `*Observações:* ${order.notes}\n` : ''}
Agradecemos pela preferência!
*Belga Móveis - Seu lar mais completo!*`;
}

/**
 * Template: Installment Reminder (Due soon / today)
 */
export function buildInstallmentReminderWhatsAppMessage(
  customerName: string,
  installment: Installment,
  pixKey: string,
  storePhone: string
): string {
  return `Olá, *${customerName}*! Tudo bem? Aqui é da *Belga Móveis*.

Passando para lembrar do vencimento da sua parcela do Crediário:
📄 *Ficha:* #${installment.fichaNumber}
🔢 *Parcela:* ${installment.number}/${installment.totalInstallments}
💰 *Valor:* ${formatCurrency(installment.amount)}
📅 *Vencimento:* ${formatDateBR(installment.dueDate)}

🔑 *Chave Pix para pagamento:*
${pixKey || '21 96656-7027'}

Após realizar o pagamento, por favor nos envie o comprovante por aqui.
Caso já tenha pago, desconsidere este lembrete!

*Belga Móveis - Seu lar mais completo!*
WhatsApp: ${storePhone || '(21) 97393-4438'}`;
}

/**
 * Template: Overdue Installment Alert
 */
export function buildOverdueInstallmentWhatsAppMessage(
  customerName: string,
  installment: Installment,
  daysLate: number,
  pixKey: string
): string {
  return `Olá, *${customerName}*. Aqui é do departamento financeiro da *Belga Móveis*.

Identificamos que a parcela *${installment.number}/${installment.totalInstallments}* (Ficha #${installment.fichaNumber}) no valor de *${formatCurrency(installment.amount)}*, vencida em *${formatDateBR(installment.dueDate)}* (${daysLate} dias em atraso), ainda se encontra em aberto.

Gostaríamos de ajudá-lo a regularizar sua situação para manter seu crediário ativo e sem complicações.

🔑 *Chave Pix:*
${pixKey || '21 96656-7027'}

Podemos te ajudar com a negociação? Responda a esta mensagem para conversarmos com você agora mesmo.

*Belga Móveis*`;
}

/**
 * Template: Payment Receipt Confirmation
 */
export function buildPaymentReceiptWhatsAppMessage(
  customerName: string,
  receiptNumber: string,
  installmentNumber: number,
  totalInstallments: number,
  amount: number,
  method: string,
  paidAt: string
): string {
  return `*BELGA MÓVEIS - COMPROVANTE DE PAGAMENTO*
Recibo: #${receiptNumber}

Olá, *${customerName}*!
Confirmamos o recebimento do pagamento da parcela *${installmentNumber}/${totalInstallments}*.

💰 *Valor Pago:* ${formatCurrency(amount)}
💳 *Forma de Pagamento:* ${method}
📅 *Data/Hora:* ${formatDateBR(paidAt)}

Sua parcela já consta como *PAGA* em nosso sistema e seu saldo foi atualizado.
Muito obrigado pela confiança!

*Belga Móveis - Seu lar mais completo!*`;
}
