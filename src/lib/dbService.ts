import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Product,
  Category,
  Order,
  Installment,
  PaymentReceipt,
  Customer,
  ChatMessage,
  SystemNotification,
  StoreSettings,
  ActivityLog,
  DailyMessage,
  Banner,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_DAILY_MESSAGES,
} from './seedData';

/**
 * Initializes Firestore data if empty (Seed)
 */
export async function seedInitialDatabaseIfNeeded(): Promise<void> {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);

    if (snapshot.empty) {
      console.log('Seeding initial Belga Móveis catalog and settings...');
      const batch = writeBatch(db);

      // Seed categories
      for (const cat of INITIAL_CATEGORIES) {
        batch.set(doc(db, 'categories', cat.id), cat);
      }

      // Seed initial 12 mattresses
      const now = new Date().toISOString();
      for (const prod of INITIAL_PRODUCTS) {
        batch.set(doc(db, 'products', prod.id), {
          ...prod,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Seed settings
      batch.set(doc(db, 'settings', 'store_config'), INITIAL_SETTINGS);

      // Seed daily messages
      for (const msg of INITIAL_DAILY_MESSAGES) {
        batch.set(doc(db, 'daily_messages', msg.id), msg);
      }

      // Initial banner
      batch.set(doc(db, 'banners', 'hero-colchoes'), {
        id: 'hero-colchoes',
        title: 'Seu lar mais completo!',
        subtitle: 'Colchões Queen de alto padrão com facilidade no crediário próprio.',
        imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
        buttonText: 'Ver Colchões Queen',
        buttonLink: '#catalogo',
        active: true,
        order: 1,
        createdAt: now,
      });

      await batch.commit();
      console.log('Database seeded successfully!');
    }
  } catch (error) {
    console.warn('Initial seed check error (safe to proceed):', error);
  }
}

/**
 * Real-time listener for Products
 */
export function subscribeProducts(callback: (products: Product[]) => void) {
  const path = 'products';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      if (snap.empty) {
        callback(INITIAL_PRODUCTS as Product[]);
        return;
      }
      const prods: Product[] = [];
      snap.forEach((docSnap) => {
        prods.push({ id: docSnap.id, ...(docSnap.data() as Omit<Product, 'id'>) });
      });
      callback(prods);
    },
    (err) => {
      callback(INITIAL_PRODUCTS as Product[]);
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

/**
 * Real-time listener for Categories
 */
export function subscribeCategories(callback: (categories: Category[]) => void) {
  const path = 'categories';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      if (snap.empty) {
        callback(INITIAL_CATEGORIES);
        return;
      }
      const cats: Category[] = [];
      snap.forEach((docSnap) => {
        cats.push({ id: docSnap.id, ...(docSnap.data() as Omit<Category, 'id'>) });
      });
      callback(cats.sort((a, b) => a.order - b.order));
    },
    (err) => {
      callback(INITIAL_CATEGORIES);
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

/**
 * Real-time listener for Store Settings
 */
export function subscribeSettings(callback: (settings: StoreSettings) => void) {
  const path = 'settings';
  return onSnapshot(
    doc(db, path, 'store_config'),
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as StoreSettings);
      } else {
        callback(INITIAL_SETTINGS);
      }
    },
    (err) => handleFirestoreError(err, OperationType.GET, path)
  );
}

/**
 * Real-time listener for Orders
 */
export function subscribeOrders(
  callback: (orders: Order[]) => void,
  filterCustomerId?: string
) {
  const path = 'orders';
  const colRef = collection(db, path);
  const q = filterCustomerId
    ? query(colRef, where('customerId', '==', filterCustomerId))
    : colRef;

  return onSnapshot(
    q,
    (snap) => {
      const orders: Order[] = [];
      snap.forEach((docSnap) => {
        orders.push({ id: docSnap.id, ...(docSnap.data() as Omit<Order, 'id'>) });
      });
      callback(orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    },
    (err) => handleFirestoreError(err, OperationType.GET, path)
  );
}

/**
 * Real-time listener for Installments
 */
export function subscribeInstallments(
  callback: (installments: Installment[]) => void,
  filterCustomerId?: string
) {
  const path = 'installments';
  const colRef = collection(db, path);
  const q = filterCustomerId
    ? query(colRef, where('customerId', '==', filterCustomerId))
    : colRef;

  return onSnapshot(
    q,
    (snap) => {
      const insts: Installment[] = [];
      snap.forEach((docSnap) => {
        insts.push({ id: docSnap.id, ...(docSnap.data() as Omit<Installment, 'id'>) });
      });
      callback(insts.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
    },
    (err) => handleFirestoreError(err, OperationType.GET, path)
  );
}

/**
 * Real-time listener for Payments
 */
export function subscribePayments(callback: (payments: PaymentReceipt[]) => void) {
  const path = 'payments';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const pays: PaymentReceipt[] = [];
      snap.forEach((docSnap) => {
        pays.push({ id: docSnap.id, ...(docSnap.data() as Omit<PaymentReceipt, 'id'>) });
      });
      callback(pays.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()));
    },
    (err) => handleFirestoreError(err, OperationType.GET, path)
  );
}

/**
 * Real-time listener for Customers
 */
export function subscribeCustomers(callback: (customers: Customer[]) => void) {
  const path = 'customers';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const custs: Customer[] = [];
      snap.forEach((docSnap) => {
        custs.push({ id: docSnap.id, ...(docSnap.data() as Omit<Customer, 'id'>) });
      });
      callback(custs);
    },
    (err) => handleFirestoreError(err, OperationType.GET, path)
  );
}

/**
 * Real-time listener for Chat Messages
 */
export function subscribeMessages(
  callback: (messages: ChatMessage[]) => void,
  customerId?: string
) {
  const path = 'messages';
  const colRef = collection(db, path);
  const q = customerId
    ? query(colRef, where('customerId', '==', customerId))
    : colRef;

  return onSnapshot(
    q,
    (snap) => {
      const msgs: ChatMessage[] = [];
      snap.forEach((docSnap) => {
        msgs.push({ id: docSnap.id, ...(docSnap.data() as Omit<ChatMessage, 'id'>) });
      });
      callback(msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    },
    (err) => handleFirestoreError(err, OperationType.GET, path)
  );
}

/**
 * Create Order with Crediário Ficha Digital and Installments atomically
 */
export async function createOrderWithCrediario(
  orderData: Omit<Order, 'id'>,
  installmentsData: Omit<Installment, 'id'>[],
  customerData: Customer
): Promise<{ orderId: string; fichaNumber: string }> {
  const batch = writeBatch(db);
  const orderRef = doc(collection(db, 'orders'));
  const orderId = orderRef.id;

  const finalOrder: Order = {
    ...orderData,
    id: orderId,
  };

  batch.set(orderRef, finalOrder);

  // Save/Update Customer record
  const customerRef = doc(db, 'customers', customerData.id);
  const currentOpenBalance = (customerData.openBalance || 0) + orderData.financedAmount;
  const currentPurchases = (customerData.totalPurchases || 0) + orderData.subtotal;

  batch.set(
    customerRef,
    {
      ...customerData,
      openBalance: currentOpenBalance,
      totalPurchases: currentPurchases,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  // Create Installments
  for (const inst of installmentsData) {
    const instRef = doc(collection(db, 'installments'));
    const finalInst: Installment = {
      ...inst,
      id: instRef.id,
      orderId,
    };
    batch.set(instRef, finalInst);
  }

  // Deduct product inventory
  for (const item of orderData.items) {
    try {
      const prodRef = doc(db, 'products', item.productId);
      const prodSnap = await getDoc(prodRef);
      if (prodSnap.exists()) {
        const currentStock = prodSnap.data().stock || 0;
        batch.update(prodRef, {
          stock: Math.max(0, currentStock - item.quantity),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch {
      // Continue batch
    }
  }

  // Add activity log
  const logRef = doc(collection(db, 'activity_logs'));
  batch.set(logRef, {
    id: logRef.id,
    adminId: orderData.createdBy || 'sistema',
    adminEmail: 'sistema@belgamoveis.com.br',
    action: 'Criação de Pedido / Ficha Digital',
    entityType: 'order',
    entityId: orderId,
    details: `Pedido #${orderData.orderNumber} criado para ${orderData.customerName}. Ficha #${orderData.fichaNumber}. Total: R$ ${orderData.subtotal}`,
    createdAt: new Date().toISOString(),
  });

  await batch.commit();
  return { orderId, fichaNumber: orderData.fichaNumber };
}

/**
 * Register a Payment for an Installment
 */
export async function registerInstallmentPayment(params: {
  installment: Installment;
  amount: number;
  method: 'Dinheiro' | 'Pix' | 'Cartão' | 'Transferência' | 'Outro';
  adminId: string;
  adminEmail: string;
  notes?: string;
}): Promise<string> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;

  // Update installment
  const instRef = doc(db, 'installments', params.installment.id);
  batch.update(instRef, {
    status: 'Pago',
    paidAt: now,
    paidAmount: params.amount,
    paymentMethod: params.method,
    notes: params.notes || '',
    updatedAt: now,
  });

  // Create payment receipt document
  const paymentRef = doc(collection(db, 'payments'));
  const paymentRecord: PaymentReceipt = {
    id: paymentRef.id,
    orderId: params.installment.orderId,
    installmentId: params.installment.id,
    installmentNumber: params.installment.number,
    customerId: params.installment.customerId,
    customerName: params.installment.customerName,
    amount: params.amount,
    method: params.method,
    paidAt: now,
    adminId: params.adminId,
    adminEmail: params.adminEmail,
    notes: params.notes || '',
    receiptNumber,
    createdAt: now,
  };
  batch.set(paymentRef, paymentRecord);

  // Update Customer open balance
  try {
    const custRef = doc(db, 'customers', params.installment.customerId);
    const custSnap = await getDoc(custRef);
    if (custSnap.exists()) {
      const currentBalance = custSnap.data().openBalance || 0;
      batch.update(custRef, {
        openBalance: Math.max(0, currentBalance - params.amount),
        updatedAt: now,
      });
    }
  } catch (err) {
    console.warn('Customer balance update warning:', err);
  }

  // Create activity log
  const logRef = doc(collection(db, 'activity_logs'));
  batch.set(logRef, {
    id: logRef.id,
    adminId: params.adminId,
    adminEmail: params.adminEmail,
    action: 'Registro de Pagamento',
    entityType: 'payment',
    entityId: paymentRef.id,
    details: `Pagamento de R$ ${params.amount} recebido via ${params.method}. Recibo #${receiptNumber}. Parcela ${params.installment.number}/${params.installment.totalInstallments}.`,
    createdAt: now,
  });

  await batch.commit();
  return receiptNumber;
}

/**
 * Save or update product
 */
export async function saveProduct(product: Partial<Product> & { name: string; price: number }): Promise<string> {
  const path = 'products';
  try {
    const now = new Date().toISOString();
    if (product.id) {
      const ref = doc(db, path, product.id);
      await updateDoc(ref, {
        ...product,
        updatedAt: now,
      });
      return product.id;
    } else {
      const ref = doc(collection(db, path));
      const newProduct: Product = {
        id: ref.id,
        name: product.name,
        categoryId: product.categoryId || 'cat-colchoes',
        categoryName: product.categoryName || 'Colchões',
        description: product.description || '',
        price: product.price,
        creditPrice: product.creditPrice || product.price,
        maxInstallments: product.maxInstallments || 12,
        stock: product.stock ?? 1,
        minStock: product.minStock ?? 1,
        sku: product.sku || `BELGA-${Date.now().toString().slice(-4)}`,
        images: product.images && product.images.length > 0 ? product.images : [
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80',
        ],
        videoUrl: product.videoUrl || '',
        active: product.active ?? true,
        featured: product.featured ?? false,
        specifications: product.specifications || {
          dimensao: '158 x 198 cm (Queen)',
          garantia: '12 meses',
        },
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(ref, newProduct);

      // Trigger Catalog News push notification
      try {
        const { notifyCatalogPromotion } = await import('./notifications');
        notifyCatalogPromotion(
          newProduct.name,
          `R$ ${newProduct.price.toFixed(2)}`,
          `${newProduct.maxInstallments}x de R$ ${(newProduct.price / newProduct.maxInstallments).toFixed(2)}`
        );
      } catch {
        // Non-blocking
      }

      return ref.id;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return product.id || `prod_${Date.now()}`;
  }
}

/**
 * Update Customer Status (Active / Blocked)
 */
export async function updateCustomerStatus(customerId: string, status: 'active' | 'blocked' | 'pending'): Promise<void> {
  const path = 'customers';
  try {
    const ref = doc(db, path, customerId);
    await updateDoc(ref, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Save or update Customer Record
 */
export async function saveCustomerRecord(customer: Partial<Customer> & { id: string; name: string }): Promise<void> {
  const path = 'customers';
  try {
    const ref = doc(db, path, customer.id);
    await setDoc(ref, {
      ...customer,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Delete product
 */
export async function deleteProduct(productId: string): Promise<void> {
  const path = 'products';
  try {
    await deleteDoc(doc(db, path, productId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Update order status and trigger push notification
 */
export async function updateOrderStatus(orderId: string, newStatus: Order['status'], adminEmail: string): Promise<void> {
  const path = 'orders';
  try {
    const ref = doc(db, path, orderId);
    const existingSnap = await getDoc(ref);
    const existingData = existingSnap.exists() ? (existingSnap.data() as Order) : null;

    await updateDoc(ref, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    // Trigger Push Notification for the customer
    if (existingData) {
      try {
        const { notifyOrderStatusChange } = await import('./notifications');
        notifyOrderStatusChange(existingData.orderNumber, existingData.fichaNumber, newStatus);
      } catch (e) {
        console.warn('Push notification dispatch note:', e);
      }
    }

    const logRef = doc(collection(db, 'activity_logs'));
    await setDoc(logRef, {
      id: logRef.id,
      adminId: adminEmail,
      adminEmail,
      action: 'Alteração de Status do Pedido',
      entityType: 'order',
      entityId: orderId,
      details: `Status alterado para: ${newStatus}`,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Send chat message
 */
export async function sendChatMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<string> {
  const path = 'messages';
  try {
    const ref = doc(collection(db, path));
    const newMsg: ChatMessage = {
      ...message,
      id: ref.id,
      createdAt: new Date().toISOString(),
    };
    await setDoc(ref, newMsg);
    return ref.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return `msg_${Date.now()}`;
  }
}

/**
 * Save store settings
 */
export async function saveSettings(settings: Partial<StoreSettings>): Promise<void> {
  const path = 'settings';
  try {
    const ref = doc(db, path, 'store_config');
    await setDoc(ref, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
