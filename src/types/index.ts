export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  reference?: string;
}

export interface Customer {
  id: string;
  userId?: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  whatsapp: string;
  birthDate?: string;
  address: Address;
  notes?: string;
  status: 'active' | 'blocked' | 'pending';
  totalPurchases?: number;
  openBalance?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  description: string;
  price: number;
  creditPrice: number;
  maxInstallments: number;
  stock: number;
  minStock?: number;
  sku: string;
  images: string[];
  videoUrl?: string;
  documents?: { name: string; url: string; size?: number }[];
  active: boolean;
  featured?: boolean;
  specifications?: {
    dimensao?: string;
    tipoMola?: string;
    tipoEspuma?: string;
    garantia?: string;
    pesoSuportado?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  order: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus =
  | 'Novo'
  | 'Em análise'
  | 'Aguardando pagamento'
  | 'Aprovado'
  | 'Em separação'
  | 'Enviado'
  | 'Entregue'
  | 'Cancelado'
  | 'Finalizado';

export type PaymentFrequency = 'Semanal' | 'Quinzenal' | 'Mensal';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  fichaNumber: string;
  customerId: string;
  userId?: string;
  customerName: string;
  customerCpf: string;
  customerPhone: string;
  customerAddress: Address;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  entry: number;
  financedAmount: number;
  installmentAmount: number;
  installmentsCount: number;
  frequency: PaymentFrequency;
  firstDueDate: string;
  status: OrderStatus;
  notes?: string;
  paymentType: 'a_vista' | 'crediario';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type InstallmentStatus =
  | 'Pendente'
  | 'Pago'
  | 'Vencendo hoje'
  | 'Atrasada'
  | 'Negociada'
  | 'Cancelada';

export interface Installment {
  id: string;
  orderId: string;
  fichaNumber: string;
  customerId: string;
  userId?: string;
  customerName: string;
  number: number;
  totalInstallments: number;
  amount: number;
  dueDate: string; // ISO date YYYY-MM-DD
  paidAt?: string;
  paidAmount?: number;
  status: InstallmentStatus;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentReceipt {
  id: string;
  orderId: string;
  installmentId: string;
  installmentNumber: number;
  customerId: string;
  customerName: string;
  amount: number;
  method: 'Dinheiro' | 'Pix' | 'Cartão' | 'Transferência' | 'Outro';
  paidAt: string;
  adminId: string;
  adminEmail: string;
  notes?: string;
  receiptNumber: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  customerId: string;
  customerName: string;
  text: string;
  senderId: string;
  senderRole: 'customer' | 'admin';
  senderName: string;
  read: boolean;
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  userId?: string;
  customerId?: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'due' | 'overdue' | 'system' | 'message';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  slogan: string;
  phone: string;
  whatsapp: string;
  crediarioPixPhone: string;
  pixKey: string;
  address: string;
  email: string;
  hours: string;
  defaultInterestRate: number;
  contractText: string;
  autoWaReminder: boolean;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    whatsapp?: string;
    website?: string;
  };
  updatedAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  videoUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  active: boolean;
  order: number;
  createdAt: string;
}

export interface DailyMessage {
  id: string;
  message: string;
  author: string;
  active: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  entityType: 'order' | 'payment' | 'product' | 'customer' | 'installment' | 'settings';
  entityId: string;
  details: string;
  createdAt: string;
}
