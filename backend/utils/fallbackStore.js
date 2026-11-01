const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'fallback_db.json');

const DEFAULT_STORE = {
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

function ensureStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_STORE, null, 2), 'utf8');
    }
  } catch (err) {
    console.warn('[FallbackStore] Could not initialize disk store:', err.message);
  }
}

function readStore() {
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

function writeStore(data) {
  ensureStore();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('[FallbackStore] Write warning:', err.message);
  }
}

function getFallbackUserByQuery(query) {
  const store = readStore();
  const cleanEmail = query.email ? query.email.toLowerCase().trim() : '';
  const cleanPhone = query.phone ? query.phone.replace(/\D/g, '').trim() : '';
  const cleanId = query.identifier ? query.identifier.toLowerCase().trim() : '';

  return store.users.find((u) => {
    if (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) return true;
    if (cleanPhone && u.phone && u.phone.replace(/\D/g, '') === cleanPhone) return true;
    if (cleanId && ((u.email && u.email.toLowerCase() === cleanId) || (u.phone && u.phone.replace(/\D/g, '') === cleanId) || (u.identifier && u.identifier.toLowerCase() === cleanId))) return true;
    return false;
  });
}

function saveFallbackUser(user) {
  const store = readStore();
  const now = new Date().toISOString();
  const _id = user._id || `user_fallback_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const newUser = {
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

function saveFallbackOrder(order) {
  const store = readStore();
  const now = new Date().toISOString();
  const fallbackOrder = {
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

function getFallbackOrderById(orderId) {
  const store = readStore();
  return store.orders.find((o) => o.orderId === orderId);
}

function getFallbackRecentOrders(limit = 20) {
  const store = readStore();
  return store.orders.slice(0, limit);
}

function addFallbackActivityLog(log) {
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

function addFallbackNotificationLog(log) {
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

module.exports = {
  readStore,
  writeStore,
  ensureStore,
  getFallbackUserByQuery,
  saveFallbackUser,
  saveFallbackOrder,
  getFallbackOrderById,
  getFallbackRecentOrders,
  addFallbackActivityLog,
  addFallbackNotificationLog,
};
