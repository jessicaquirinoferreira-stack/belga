import { PaymentFrequency } from '../types';

export interface CrediarioCalculationParams {
  totalAmount: number; // e.g. 2716.80
  entryAmount: number; // e.g. 300.00
  installmentsCount: number; // e.g. 12
  frequency: PaymentFrequency; // 'Semanal' | 'Quinzenal' | 'Mensal'
  interestRateMonthly?: number; // e.g. 0% or custom percentage
  firstDueDate?: string; // YYYY-MM-DD
}

export interface GeneratedInstallmentPlan {
  totalAmount: number;
  entryAmount: number;
  financedAmount: number;
  totalWithInterest: number;
  interestAmount: number;
  installmentsCount: number;
  installmentAmount: number;
  frequency: PaymentFrequency;
  dueDates: string[];
}

/**
 * Formats Brazilian Real currency safely
 */
export function formatCurrency(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Parses currency input string (e.g. "R$ 1.250,50" -> 1250.50)
 */
export function parseCurrency(input: string): number {
  if (!input) return 0;
  const cleaned = input
    .replace(/[R$\s.]/g, '')
    .replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Formats a Date to Brazilian format DD/MM/YYYY
 */
export function formatDateBR(dateStringOrDate: string | Date): string {
  if (!dateStringOrDate) return '-';
  const d = typeof dateStringOrDate === 'string' ? new Date(dateStringOrDate) : dateStringOrDate;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

/**
 * Calculates days difference between target date and today
 */
export function getDaysDiffFromToday(dueDateStr: string): number {
  const [year, month, day] = dueDateStr.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1, day));
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determines current status of an installment based on dueDate and payment status
 */
export function calculateInstallmentStatus(
  currentStatus: string,
  dueDateStr: string,
  paidAt?: string
): 'Pendente' | 'Pago' | 'Vencendo hoje' | 'Atrasada' | 'Negociada' | 'Cancelada' {
  if (currentStatus === 'Pago' || paidAt) return 'Pago';
  if (currentStatus === 'Negociada') return 'Negociada';
  if (currentStatus === 'Cancelada') return 'Cancelada';

  const diffDays = getDaysDiffFromToday(dueDateStr);
  if (diffDays < 0) return 'Atrasada';
  if (diffDays === 0) return 'Vencendo hoje';
  return 'Pendente';
}

/**
 * Centralized Crediário Calculator using integer cents to guarantee 100% precision
 */
export function calculateCrediario(params: CrediarioCalculationParams): GeneratedInstallmentPlan {
  const totalCents = Math.round(params.totalAmount * 100);
  const entryCents = Math.min(totalCents, Math.max(0, Math.round((params.entryAmount || 0) * 100)));
  const financedCents = Math.max(0, totalCents - entryCents);
  const installments = Math.max(1, params.installmentsCount || 1);

  // Interest calculation
  const interestRate = (params.interestRateMonthly || 0) / 100;
  let totalWithInterestCents = financedCents;
  if (interestRate > 0) {
    // Simple interest for crediário
    totalWithInterestCents = Math.round(financedCents * (1 + interestRate * (installments / (params.frequency === 'Semanal' ? 4 : params.frequency === 'Quinzenal' ? 2 : 1))));
  }

  // Exact installment amount per parcel
  const installmentAmountCents = Math.ceil(totalWithInterestCents / installments);
  const installmentAmount = installmentAmountCents / 100;

  // Generate due dates schedule
  const dueDates: string[] = [];
  const baseDate = params.firstDueDate ? new Date(params.firstDueDate) : new Date();
  
  // If no first due date specified, default to +30 days (Mensal), +15 days (Quinzenal), +7 days (Semanal)
  if (!params.firstDueDate) {
    const daysToAdd = params.frequency === 'Semanal' ? 7 : params.frequency === 'Quinzenal' ? 15 : 30;
    baseDate.setDate(baseDate.getDate() + daysToAdd);
  }

  for (let i = 0; i < installments; i++) {
    const curDate = new Date(baseDate);
    if (params.frequency === 'Semanal') {
      curDate.setDate(curDate.getDate() + i * 7);
    } else if (params.frequency === 'Quinzenal') {
      curDate.setDate(curDate.getDate() + i * 15);
    } else {
      // Mensal - advance month preserving day
      curDate.setMonth(curDate.getMonth() + i);
    }
    dueDates.push(curDate.toISOString().split('T')[0]);
  }

  return {
    totalAmount: totalCents / 100,
    entryAmount: entryCents / 100,
    financedAmount: financedCents / 100,
    totalWithInterest: totalWithInterestCents / 100,
    interestAmount: (totalWithInterestCents - financedCents) / 100,
    installmentsCount: installments,
    installmentAmount,
    frequency: params.frequency,
    dueDates,
  };
}
