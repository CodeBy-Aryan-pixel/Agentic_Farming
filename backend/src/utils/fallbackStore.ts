import fs from 'fs';
import path from 'path';

export interface FallbackUser {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
  identifier: string;
  password?: string;
  role: 'farmer' | 'admin';
  district: string;
  farmSizeAcres?: number;
  primaryCrop?: string;
  department?: string;
  kisanId?: string;
  notificationsSent?: {
    sms: boolean;
    email: boolean;
    sentAt?: any;
  };
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface FallbackOrder {
  _id?: string;
  orderId: string;
  transactionId: string;
  userId?: string;
  items: any[];
  pricing: {
    subtotal: number;
    subsidyDiscount: number;
    bundleDiscount?: number;
    deliveryFee: number;
    grandTotal: number;
  };
  deliveryAddress: any;
  paymentMethod: string;
  paymentStatus: string;
  trackingStatus: any;
  createdAt: string;
  updatedAt?: string;
}

export interface FallbackStoreData {
  users: FallbackUser[];
  orders: FallbackOrder[];
  activity_logs: any[];
  notification_logs: any[];
}

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'fallback_db.json');

const DEFAULT_STORE: FallbackStoreData = {
  users: [
    {
      _id: 'fallback_farmer_ramesh',
      fullName: 'Ramesh Patil',
      phone: '9876543210',
      email: 'farmer@futurefarming.in',
      identifier: 'farmer@futurefarming.in',
      password: '$2b$10$AJHpxjEHssgRkGv90B4PouPSDxJZFwUoaZWhAng0XidvgIq028DMW', // Farmer@123
      role: 'farmer',
      district: 'Kolhapur, MH',
      farmSizeAcres: 5.0,
      primaryCrop: 'Sugarcane',
      kisanId: 'FF-MH-2026-8841',
      notificationsSent: { sms: true, email: true },
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      _id: 'fallback_admin_sunita',
      fullName: 'Dr. Sunita Deshmukh',
      phone: '9999999999',
      email: 'admin@futurefarming.in',
      identifier: 'admin@futurefarming.in',
      password: '$2b$10$HrtVT449FQt.Dca9PiI89./BNGgQiszBF5yzZz3cNwhHDJfJfkhgy', // Admin@123
      role: 'admin',
      district: 'Pune, MH',
      department: 'District Agriculture & Pathology Command',
      kisanId: 'FF-ADMIN-2026-0001',
      notificationsSent: { sms: true, email: true },
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  orders: [],
  activity_logs: [],
  notification_logs: [],
};

export function ensureStore(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_STORE, null, 2), 'utf8');
    }
  } catch (err: any) {
    console.warn('[FallbackStore] Could not initialize disk store:', err.message);
  }
}

export function readStore(): FallbackStoreData {
  ensureStore();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : DEFAULT_STORE.users,
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      activity_logs: Array.isArray(parsed.activity_logs) ? parsed.activity_logs : [],
      notification_logs: Array.isArray(parsed.notification_logs) ? parsed.notification_logs : [],
    };
  } catch (_) {
    return { ...DEFAULT_STORE };
  }
}

export function writeStore(data: FallbackStoreData): void {
  ensureStore();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err: any) {
    console.warn('[FallbackStore] Write warning:', err.message);
  }
}

// ─── High-Level Helpers ───────────────────────────────────────────────────────

export function getFallbackUserByQuery(query: { email?: string; phone?: string; identifier?: string }): FallbackUser | undefined {
  const store = readStore();
  const cleanEmail = query.email?.toLowerCase().trim();
  const cleanPhone = query.phone?.replace(/\D/g, '').trim();
  const cleanId = query.identifier?.toLowerCase().trim();

  return store.users.find((u) => {
    if (cleanEmail && u.email?.toLowerCase() === cleanEmail) return true;
    if (cleanPhone && u.phone?.replace(/\D/g, '') === cleanPhone) return true;
    if (cleanId && (u.email?.toLowerCase() === cleanId || u.phone?.replace(/\D/g, '') === cleanId || u.identifier?.toLowerCase() === cleanId)) return true;
    return false;
  });
}

export function saveFallbackUser(user: Partial<FallbackUser>): FallbackUser {
  const store = readStore();
  const now = new Date().toISOString();
  const _id = user._id || `user_fallback_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const newUser: FallbackUser = {
    _id,
    fullName: user.fullName || 'Farmer',
    phone: user.phone || '',
    email: user.email || '',
    identifier: user.identifier || user.email || user.phone || '',
    password: user.password,
    role: user.role || 'farmer',
    district: user.district || 'Kolhapur, MH',
    farmSizeAcres: user.farmSizeAcres || 5.0,
    primaryCrop: user.primaryCrop || 'Sugarcane',
    department: user.department,
    kisanId: user.kisanId || `FF-MH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    notificationsSent: user.notificationsSent || { sms: false, email: false },
    isActive: true,
    createdAt: user.createdAt || now,
    updatedAt: now,
  };

  const existingIdx = store.users.findIndex((u) => u._id === newUser._id || (newUser.email && u.email === newUser.email) || (newUser.phone && u.phone === newUser.phone));
  if (existingIdx >= 0) {
    store.users[existingIdx] = { ...store.users[existingIdx], ...newUser };
  } else {
    store.users.unshift(newUser);
  }

  writeStore(store);
  return newUser;
}

export function saveFallbackOrder(order: any): FallbackOrder {
  const store = readStore();
  const now = new Date().toISOString();
  const fallbackOrder: FallbackOrder = {
    _id: order._id || `order_fb_${Date.now()}`,
    orderId: order.orderId || `FF-ORD-${Date.now().toString().slice(-6)}`,
    transactionId: order.transactionId || `pay_fb_${Date.now()}`,
    userId: order.userId,
    items: order.items || [],
    pricing: order.pricing || {
      subtotal: 0,
      subsidyDiscount: 0,
      deliveryFee: 0,
      grandTotal: 0,
    },
    deliveryAddress: order.deliveryAddress,
    paymentMethod: order.paymentMethod || 'RAZORPAY',
    paymentStatus: order.paymentStatus || 'PAID',
    trackingStatus: order.trackingStatus,
    createdAt: order.createdAt || now,
    updatedAt: now,
  };

  const existingIdx = store.orders.findIndex((o) => o.orderId === fallbackOrder.orderId);
  if (existingIdx >= 0) {
    store.orders[existingIdx] = fallbackOrder;
  } else {
    store.orders.unshift(fallbackOrder);
  }

  writeStore(store);
  return fallbackOrder;
}

export function getFallbackOrderById(orderId: string): FallbackOrder | undefined {
  const store = readStore();
  return store.orders.find((o) => o.orderId === orderId);
}

export function getFallbackRecentOrders(limit: number = 20): FallbackOrder[] {
  const store = readStore();
  return store.orders.slice(0, limit);
}

export function addFallbackActivityLog(log: any): void {
  try {
    const store = readStore();
    store.activity_logs.unshift({
      _id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...log,
    });
    if (store.activity_logs.length > 200) {
      store.activity_logs = store.activity_logs.slice(0, 200);
    }
    writeStore(store);
  } catch (_) {}
}

export function addFallbackNotificationLog(log: any): void {
  try {
    const store = readStore();
    store.notification_logs.unshift({
      _id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...log,
    });
    if (store.notification_logs.length > 200) {
      store.notification_logs = store.notification_logs.slice(0, 200);
    }
    writeStore(store);
  } catch (_) {}
}
