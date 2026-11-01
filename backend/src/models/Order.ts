import mongoose, { Document, Schema } from 'mongoose';

export interface OrderItem {
  id?: string;
  name: string;
  brand: string;
  packSize?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  price: number;
  image?: string;
}

export interface DeliveryAddress {
  receiverName: string;
  phone: string;
  email: string;
  street: string; // Farm Gate / House No., Survey / Gat No., Building or Street
  village: string; // Village / Post Office & Taluka
  landmark: string; // Nearest Landmark
  district: string;
  state: string;
  pincode: string; // 6-digit PIN code
  addressType: 'Farm Gate Delivery' | 'Home / Residence' | 'FPO Collection Center';
}

export interface PricingSummary {
  subtotal: number;
  subsidyDiscount: number;
  bundleDiscount?: number;
  deliveryFee: number;
  grandTotal: number;
}

export interface TrackingStage {
  stageIndex: number;
  title: string;
  subtitle: string;
  timestamp: string;
  completed: boolean;
  active: boolean;
  hubLocation?: string;
}

export interface TrackingStatus {
  currentStage: number; // 0..4
  currentHubLocation: string;
  estimatedDelivery: string;
  assignedDriver?: string;
  vehicleNumber?: string;
  lastUpdated: string;
  stageHistory: TrackingStage[];
}

export interface IOrder extends Document {
  orderId: string; // FF-ORD-2026-XXXX
  transactionId: string; // FF-PAY-XXXX or razorpay payment id
  userId?: string;
  items: OrderItem[];
  pricing: PricingSummary;
  deliveryAddress: DeliveryAddress;
  paymentMethod: 'RAZORPAY' | 'UPI' | 'CARD' | 'NETBANKING' | 'COD';
  paymentStatus: 'PAID' | 'COD_PENDING' | 'FAILED';
  trackingStatus: TrackingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<OrderItem>(
  {
    id: { type: String },
    name: { type: String, required: true },
    brand: { type: String, default: 'Future Farming' },
    packSize: { type: String },
    unit: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    price: { type: Number, required: true },
    image: { type: String },
  },
  { _id: false }
);

const DeliveryAddressSchema = new Schema<DeliveryAddress>(
  {
    receiverName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    street: { type: String, required: true },
    village: { type: String, required: true },
    landmark: { type: String, default: '' },
    district: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    addressType: {
      type: String,
      enum: ['Farm Gate Delivery', 'Home / Residence', 'FPO Collection Center'],
      default: 'Farm Gate Delivery',
    },
  },
  { _id: false }
);

const PricingSummarySchema = new Schema<PricingSummary>(
  {
    subtotal: { type: Number, required: true },
    subsidyDiscount: { type: Number, required: true },
    bundleDiscount: { type: Number, default: 0 },
    deliveryFee: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
  },
  { _id: false }
);

const TrackingStageSchema = new Schema<TrackingStage>(
  {
    stageIndex: { type: Number, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    timestamp: { type: String, required: true },
    completed: { type: Boolean, default: false },
    active: { type: Boolean, default: false },
    hubLocation: { type: String },
  },
  { _id: false }
);

const TrackingStatusSchema = new Schema<TrackingStatus>(
  {
    currentStage: { type: Number, default: 0, min: 0, max: 4 },
    currentHubLocation: {
      type: String,
      default: 'Future Farming FPO Central Desk, Kolhapur Hub',
    },
    estimatedDelivery: { type: String, required: true },
    assignedDriver: { type: String, default: '+91 94220-88319 (Ramesh Patil)' },
    vehicleNumber: { type: String, default: 'MH-09-CV-4821 (Agro-Express)' },
    lastUpdated: { type: String, required: true },
    stageHistory: [TrackingStageSchema],
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    transactionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
    },
    pricing: {
      type: PricingSummarySchema,
      required: true,
    },
    deliveryAddress: {
      type: DeliveryAddressSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['RAZORPAY', 'UPI', 'CARD', 'NETBANKING', 'COD'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'COD_PENDING', 'FAILED'],
      default: 'COD_PENDING',
      index: true,
    },
    trackingStatus: {
      type: TrackingStatusSchema,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'orders',
  }
);

export function generateDefaultTrackingStages(
  address: DeliveryAddress,
  currentStage = 0
): TrackingStatus {
  const now = new Date();
  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }) + ', ' +
    d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });

  const estDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const estimatedDelivery = estDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const stages: TrackingStage[] = [
    {
      stageIndex: 0,
      title: 'Order Confirmed & Invoice Generated',
      subtitle: 'Verified at Future Farming FPO Central Desk',
      timestamp: formatTime(now),
      completed: currentStage >= 0,
      active: currentStage === 0,
      hubLocation: 'Kolhapur Central FPO Hub',
    },
    {
      stageIndex: 1,
      title: 'Quality Checked & Packed at Regional Agro-Warehouse',
      subtitle: `Batch & Expiry Verified (${address.district || 'Kolhapur'} / Pune Regional Hub)`,
      timestamp: currentStage >= 1 ? formatTime(new Date(now.getTime() + 45 * 60 * 1000)) : 'Pending',
      completed: currentStage >= 1,
      active: currentStage === 1,
      hubLocation: `${address.district || 'Kolhapur'} Regional Logistics Warehouse`,
    },
    {
      stageIndex: 2,
      title: 'Dispatched & In Transit via Kisan Logistics',
      subtitle: `Loaded on Agro-Express Vehicle (MH-09-CV-4821) • En route to ${address.district}`,
      timestamp: currentStage >= 2 ? formatTime(new Date(now.getTime() + 3 * 3600 * 1000)) : 'Pending',
      completed: currentStage >= 2,
      active: currentStage === 2,
      hubLocation: `State Highway 115 Transit Corridor • Near ${address.district}`,
    },
    {
      stageIndex: 3,
      title: 'Arrived at Nearest Taluka Distribution Hub / Out for Delivery',
      subtitle: `Reached ${address.village} Local Hub • Delivery Executive Assigned (+91 94220-88319)`,
      timestamp: currentStage >= 3 ? formatTime(new Date(now.getTime() + 6 * 3600 * 1000)) : 'Pending',
      completed: currentStage >= 3,
      active: currentStage === 3,
      hubLocation: `${address.village} Gram Panchayat Kisan Hub`,
    },
    {
      stageIndex: 4,
      title: 'Delivered at Farm Gate',
      subtitle: `Handed over at ${address.street}, PIN ${address.pincode}`,
      timestamp: currentStage >= 4 ? formatTime(new Date(now.getTime() + 8 * 3600 * 1000)) : 'Pending',
      completed: currentStage >= 4,
      active: currentStage === 4,
      hubLocation: `${address.village}, PIN ${address.pincode}`,
    },
  ];

  const hubLocationsByStage = [
    'Future Farming FPO Central Desk, Kolhapur Hub',
    `${address.district} Regional Agro-Warehouse (Section B-4)`,
    `Loaded on Agro-Express (MH-09-CV-4821) — 14.2 km from ${address.village}`,
    `${address.village} Taluka Distribution Point — Out with Courier`,
    `Delivered at Farm Gate (${address.street}, ${address.village})`,
  ];

  return {
    currentStage,
    currentHubLocation: hubLocationsByStage[currentStage] || hubLocationsByStage[0],
    estimatedDelivery,
    assignedDriver: '+91 94220-88319 (Ramesh Patil)',
    vehicleNumber: 'MH-09-CV-4821 (Agro-Express)',
    lastUpdated: formatTime(now),
    stageHistory: stages,
  };
}

export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
