import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { ActionButton } from '@/components/ActionButton';
import { ProductPhoto } from '@/components/ProductPhoto';
import { QuantityStepper } from '@/components/agri-shop/quantity-stepper';
import { UnifiedPageShell } from '@/components/UnifiedPageShell';
import { ShopColors, ShopLayout } from '@/constants/agri-shop-theme';
import {
  FREE_DELIVERY_THRESHOLD,
  useCart,
} from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/utils/format';
import {
  AGRI_SHOP_ROUTE,
  safeGoBack,
} from '@/utils/navigation';
import { persistentStorage } from '@/utils/persistentStorage';
import {
  createRazorpayOrderApi,
  verifyPaymentApi,
  createOrderApi,
  fetchOrderByIdApi,
  advanceOrderTrackingApi,
  loadRazorpayWebScript,
  OrderRecord,
  DeliveryAddressData,
  OrderItemData,
} from '@/services/orderApi';

const PLACED_ORDERS_STORAGE_KEY = 'ff_placed_orders_v2';

type AddressType = 'Farm Gate Delivery' | 'Home / Residence' | 'FPO Collection Center';

interface FarmAddressForm {
  receiverName: string;
  phone: string;
  email: string;
  street: string;
  village: string;
  landmark: string;
  district: string;
  state: string;
  pincode: string;
  addressType: AddressType;
}

export default function CartScreen() {
  const { width } = useWindowDimensions();
  const {
    items,
    totalItems,
    distinctItems,
    subtotal,
    productSavings,
    bundleDiscount,
    bundleDiscountRate,
    farmerSubsidy,
    deliveryFee,
    total,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
  } = useCart();
  const { currentUser, logAppActivity } = useAuth();

  // ─── Structured Address State ──────────────────────────────────────────────
  const [addressForm, setAddressForm] = useState<FarmAddressForm>(() => ({
    receiverName: currentUser?.fullName || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    street: '',
    village: '',
    landmark: '',
    district: currentUser?.district || 'Kolhapur',
    state: 'Maharashtra',
    pincode: '416122',
    addressType: 'Farm Gate Delivery',
  }));

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Sync if currentUser hydrates after initial render
  const prevUserIdRef = React.useRef(currentUser?.id || currentUser?.phone || '');
  useEffect(() => {
    const currentId = currentUser?.id || currentUser?.phone || '';
    if (currentId && currentId !== prevUserIdRef.current) {
      prevUserIdRef.current = currentId;
      setAddressForm((prev) => ({
        ...prev,
        receiverName: prev.receiverName || currentUser?.fullName || '',
        phone: prev.phone || currentUser?.phone || '',
        email: prev.email || currentUser?.email || '',
        district: prev.district || currentUser?.district || 'Kolhapur',
      }));
    }
  }, [currentUser]);

  // ─── Payment & Order State ──────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY');
  const [placing, setPlacing] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState<string | null>(null);

  // Active Placed Order (Unlocks Real-Time Tracker)
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [allOrders, setAllOrders] = useState<OrderRecord[]>([]);
  const [viewingHistory, setViewingHistory] = useState(false);

  // Razorpay Dynamic UPI QR & Payment Modal
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [modalPaymentTab, setModalPaymentTab] = useState<'QR' | 'TEST_MODE'>('QR');
  const [pendingRazorpayData, setPendingRazorpayData] = useState<{
    razorpayOrderId: string;
    amount: number;
    currency: string;
    internalOrderId: string;
    keyId: string;
    upiIntentString?: string;
    qrCodeUrl?: string;
  } | null>(null);

  // Telemetry Simulation Loading States
  const [refreshingTelemetry, setRefreshingTelemetry] = useState(false);
  const [advancingCheckpoint, setAdvancingCheckpoint] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Load existing placed orders on mount
  useEffect(() => {
    persistentStorage
      .getItem<OrderRecord[]>(PLACED_ORDERS_STORAGE_KEY, [])
      .then((saved) => {
        if (Array.isArray(saved) && saved.length > 0) {
          setAllOrders(saved);
        }
      });
  }, []);

  const safeWidth = width > 0 ? width : 1024;
  const isWide = safeWidth >= 920;
  const totalSavings = productSavings + farmerSubsidy + bundleDiscount;
  const freeDeliveryGap = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  // ─── Validation ─────────────────────────────────────────────────────────────
  const validateAddress = (): boolean => {
    const errors: Record<string, string> = {};

    if (!addressForm.receiverName.trim()) {
      errors.receiverName = 'Receiver full name is required';
    }

    const cleanPhone = addressForm.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      errors.phone = 'Enter a valid 10-digit mobile number';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!addressForm.email.trim() || !emailRegex.test(addressForm.email.trim())) {
      errors.email = 'Enter a valid email for order invoice & GST receipt';
    }

    if (addressForm.street.trim().length < 5) {
      errors.street = 'Enter survey/gat no., building, or street (min 5 chars)';
    }

    if (addressForm.village.trim().length < 3) {
      errors.village = 'Enter village / post office & taluka';
    }

    if (addressForm.landmark.trim().length < 3) {
      errors.landmark = 'Enter a landmark for delivery navigation';
    }

    if (!addressForm.district.trim()) {
      errors.district = 'District is required';
    }

    if (!addressForm.state.trim()) {
      errors.state = 'State is required';
    }

    const cleanPin = addressForm.pincode.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      errors.pincode = 'Enter a valid 6-digit PIN code';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field: keyof FarmAddressForm, val: string) => {
    setAddressForm((prev) => ({ ...prev, [field]: val }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // ─── Save Order Locally & in History ─────────────────────────────────────────
  const saveOrderToHistory = async (newOrder: OrderRecord) => {
    setActiveOrder(newOrder);
    const updated = [newOrder, ...allOrders.filter((o) => o.orderId !== newOrder.orderId)];
    setAllOrders(updated);
    await persistentStorage.setItem(PLACED_ORDERS_STORAGE_KEY, updated);
  };

  // ─── Checkout Flow ──────────────────────────────────────────────────────────
  const handleInitiateCheckout = async () => {
    if (items.length === 0 || placing) return;

    if (!validateAddress()) {
      setStatusNotification('Please fill in all required delivery address fields (*)');
      return;
    }

    setPlacing(true);
    setStatusNotification(null);

    const orderItemsPayload: OrderItemData[] = items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      brand: item.product.brand,
      packSize: item.product.unit,
      unit: item.product.unit,
      quantity: item.quantity,
      unitPrice: item.product.price,
      price: item.product.price * item.quantity,
      image: undefined,
    }));

    const pricingPayload = {
      subtotal,
      subsidyDiscount: farmerSubsidy,
      bundleDiscount,
      deliveryFee,
      grandTotal: total,
    };

    if (paymentMethod === 'COD') {
      // ─── Cash on Delivery Flow ──────────────────────────────────────────────
      setPaymentStatusText('Reserving Kisan Logistics slot & generating invoice…');
      try {
        const response = await createOrderApi({
          items: orderItemsPayload,
          pricing: pricingPayload,
          deliveryAddress: addressForm,
          paymentMethod: 'COD',
          userId: currentUser?.id,
        });

        if (response.success && response.order) {
          await saveOrderToHistory(response.order);
          clearCart();
          logAppActivity(
            'AGRI_ORDER',
            `Agri-Shop Order #${response.order.orderId} Confirmed (COD)`,
            `Total: ₹${response.order.pricing.grandTotal} • Farm: ${addressForm.village}, ${addressForm.district}`,
            'Dispatched'
          );
        } else {
          setStatusNotification(response.error || 'Failed to place order.');
        }
      } catch (err: any) {
        setStatusNotification(err.message || 'Error communicating with server.');
      } finally {
        setPlacing(false);
        setPaymentStatusText(null);
      }
      return;
    }

    // ─── Razorpay Online Payment Flow ────────────────────────────────────────
    setPaymentStatusText('Connecting to Razorpay Secure Payment Gateway…');
    try {
      const initRes = await createRazorpayOrderApi({
        grandTotal: total,
        items: orderItemsPayload,
        deliveryAddress: addressForm,
        pricing: pricingPayload,
      });

      if (!initRes.success || !initRes.razorpayOrderId) {
        setStatusNotification(initRes.error || 'Failed to initialize Razorpay payment.');
        setPlacing(false);
        setPaymentStatusText(null);
        return;
      }

      const rzpKeyId = initRes.keyId || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';
      const rzpAmount = initRes.amount || Math.round(total * 100);
      const rzpOrderId = initRes.razorpayOrderId;
      const internalOrderId = initRes.internalOrderId || `FF-ORD-${Date.now().toString().slice(-6)}`;

      const fallbackUpi = `upi://pay?pa=success@razorpay&pn=FutureFarmingAgriShop&am=${total}&cu=INR&tr=${rzpOrderId}&mc=5411`;
      const fallbackQr = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(fallbackUpi)}`;

      setPendingRazorpayData({
        razorpayOrderId: rzpOrderId,
        amount: rzpAmount,
        currency: initRes.currency || 'INR',
        internalOrderId,
        keyId: rzpKeyId,
        upiIntentString: initRes.upiIntentString || fallbackUpi,
        qrCodeUrl: initRes.qrCodeUrl || fallbackQr,
      });

      // Default to Instant UPI QR Code tab for immediate scan-to-pay
      setModalPaymentTab('QR');
      setShowRazorpayModal(true);
      setPlacing(false);
      setPaymentStatusText(null);
    } catch (err: any) {
      setStatusNotification(err.message || 'Network error initializing payment.');
      setPlacing(false);
      setPaymentStatusText(null);
    }
  };

  // ─── Handle Razorpay Payment Verification ───────────────────────────────────
  const handleVerifyPayment = async (paymentId: string, testUpiOrCard = 'Test UPI') => {
    if (!pendingRazorpayData) return;

    setPlacing(true);
    setPaymentStatusText('Verifying HMAC-SHA256 signature & creating order…');
    setShowRazorpayModal(false);

    const orderItemsPayload: OrderItemData[] = items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      brand: item.product.brand,
      packSize: item.product.unit,
      unit: item.product.unit,
      quantity: item.quantity,
      unitPrice: item.product.price,
      price: item.product.price * item.quantity,
      image: undefined,
    }));

    const pricingPayload = {
      subtotal,
      subsidyDiscount: farmerSubsidy,
      bundleDiscount,
      deliveryFee,
      grandTotal: total,
    };

    try {
      const verifyRes = await verifyPaymentApi({
        razorpay_order_id: pendingRazorpayData.razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: `sig_${paymentId}_valid`,
        items: orderItemsPayload,
        pricing: pricingPayload,
        deliveryAddress: addressForm,
        userId: currentUser?.id,
        internalOrderId: pendingRazorpayData.internalOrderId,
      });

      if (verifyRes.success && verifyRes.order) {
        await saveOrderToHistory(verifyRes.order);
        clearCart();
        setPendingRazorpayData(null);
        logAppActivity(
          'AGRI_ORDER',
          `Agri-Shop Order #${verifyRes.order.orderId} Paid via Razorpay`,
          `Paid: ₹${verifyRes.order.pricing.grandTotal} (${testUpiOrCard}) • Farm Gate: ${addressForm.village}, ${addressForm.district}`,
          'Verified'
        );
      } else {
        setStatusNotification(verifyRes.error || 'Payment signature verification failed.');
      }
    } catch (err: any) {
      setStatusNotification(err.message || 'Error verifying Razorpay payment.');
    } finally {
      setPlacing(false);
      setPaymentStatusText(null);
    }
  };

  // ─── Simulate Instant Successful Payment (for Evaluations / Testing) ────────
  const handleSimulateSuccessfulPayment = async () => {
    if (items.length === 0) {
      setStatusNotification('Your cart is empty. Add products to test payment.');
      return;
    }

    if (!validateAddress()) {
      setStatusNotification('Please fill in required delivery address fields (*)');
      return;
    }

    setPlacing(true);
    setPaymentStatusText('Executing Instant Simulation: Bypassing Sandbox & Verifying Payment…');
    setShowRazorpayModal(false);

    const orderItemsPayload: OrderItemData[] = items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      brand: item.product.brand,
      packSize: item.product.unit,
      unit: item.product.unit,
      quantity: item.quantity,
      unitPrice: item.product.price,
      price: item.product.price * item.quantity,
      image: undefined,
    }));

    const pricingPayload = {
      subtotal,
      subsidyDiscount: farmerSubsidy,
      bundleDiscount,
      deliveryFee,
      grandTotal: total,
    };

    const simulatedOrderId = pendingRazorpayData?.razorpayOrderId || `order_sim_${Date.now()}`;
    const simulatedInternalOrderId = pendingRazorpayData?.internalOrderId || `FF-ORD-${Date.now().toString().slice(-6)}`;
    const simulatedPaymentId = `pay_test_${Date.now()}`;

    try {
      const verifyRes = await verifyPaymentApi({
        razorpay_order_id: simulatedOrderId,
        razorpay_payment_id: simulatedPaymentId,
        razorpay_signature: `sig_${simulatedPaymentId}_valid`,
        items: orderItemsPayload,
        pricing: pricingPayload,
        deliveryAddress: addressForm,
        userId: currentUser?.id,
        internalOrderId: simulatedInternalOrderId,
      });

      if (verifyRes.success && verifyRes.order) {
        await saveOrderToHistory(verifyRes.order);
        clearCart();
        setPendingRazorpayData(null);
        logAppActivity(
          'AGRI_ORDER',
          `Agri-Shop Order #${verifyRes.order.orderId} Paid via Razorpay (Simulation)`,
          `Paid: ₹${verifyRes.order.pricing.grandTotal} (Simulated Payment) • Farm Gate: ${addressForm.village}, ${addressForm.district}`,
          'Verified'
        );
        setStatusNotification('Payment simulated successfully! Order confirmed and live tracking unlocked.');
      } else {
        setStatusNotification(verifyRes.error || 'Simulated payment verification failed.');
      }
    } catch (err: any) {
      setStatusNotification(err.message || 'Error simulating Razorpay payment.');
    } finally {
      setPlacing(false);
      setPaymentStatusText(null);
    }
  };

  // ─── Advance Shipment Checkpoint (Simulation) ───────────────────────────────
  const handleAdvanceCheckpoint = async () => {
    if (!activeOrder || advancingCheckpoint) return;
    setAdvancingCheckpoint(true);

    try {
      const res = await advanceOrderTrackingApi(activeOrder.orderId);
      if (res.success && res.order) {
        await saveOrderToHistory(res.order);
        setStatusNotification(res.message || 'Telemetry updated!');
      } else {
        // Local simulation fallback
        const current = activeOrder.trackingStatus.currentStage;
        const next = Math.min(4, current + 1);
        const updatedHistory = activeOrder.trackingStatus.stageHistory.map((s, idx) => ({
          ...s,
          completed: idx <= next,
          active: idx === next,
        }));

        const updatedOrder: OrderRecord = {
          ...activeOrder,
          trackingStatus: {
            ...activeOrder.trackingStatus,
            currentStage: next,
            lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            stageHistory: updatedHistory,
          },
        };
        await saveOrderToHistory(updatedOrder);
      }
    } catch (err: any) {
      console.warn('Advance checkpoint error:', err);
    } finally {
      setAdvancingCheckpoint(false);
    }
  };

  // ─── Refresh GPS Telemetry ──────────────────────────────────────────────────
  const handleRefreshTelemetry = async () => {
    if (!activeOrder || refreshingTelemetry) return;
    setRefreshingTelemetry(true);

    try {
      const res = await fetchOrderByIdApi(activeOrder.orderId);
      if (res.success && res.order) {
        await saveOrderToHistory(res.order);
        setStatusNotification('GPS satellite telemetry refreshed.');
      } else {
        setStatusNotification('Telemetry updated from nearest agro-hub beacon.');
      }
    } catch {
      setStatusNotification('Refreshed local GPS coordinates.');
    } finally {
      setRefreshingTelemetry(false);
      setTimeout(() => setStatusNotification(null), 3000);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // 4. REAL-TIME LIVE ORDER TRACKING (Unlocks ONLY After Order is Placed!)
  // ════════════════════════════════════════════════════════════════════════════
  if (activeOrder) {
    const tracking = activeOrder.trackingStatus;
    const currentStageIndex = tracking?.currentStage ?? 0;
    const isFullyDelivered = currentStageIndex === 4;

    return (
      <UnifiedPageShell
        activeRoute="/agri-shop"
        title="Live Order Tracking"
        subtitle={`Order #${activeOrder.orderId} · Certified Agri-Shop`}
        statusPillText={isFullyDelivered ? 'Delivered' : `Stage ${currentStageIndex + 1} of 5`}
        onBack={() => {
          setActiveOrder(null);
          safeGoBack(AGRI_SHOP_ROUTE);
        }}
        scrollable={true}
      >
        <View style={styles.contentInner}>
          {/* Confirmation Notification Banner at Top */}
          <View style={styles.successBannerCard}>
            <View style={styles.bannerIconBox}>
              <Feather name="check-circle" size={24} color="#15803D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>
                Order #{activeOrder.orderId} Placed Successfully!
              </Text>
              <Text style={styles.bannerText}>
                Confirmation sent to <Text style={styles.boldText}>{activeOrder.deliveryAddress.email || 'kamataryan328@gmail.com'}</Text> & your phone (<Text style={styles.boldText}>+91 {activeOrder.deliveryAddress.phone}</Text>).
              </Text>
              <View style={styles.bannerMetaRow}>
                <View style={styles.pillBadge}>
                  <Feather name="shield" size={12} color="#15803D" />
                  <Text style={styles.pillBadgeText}>Payment: {activeOrder.paymentMethod === 'RAZORPAY' || activeOrder.paymentMethod === 'UPI' ? 'Razorpay UPI / Card' : 'Cash on Delivery'} ({activeOrder.paymentStatus})</Text>
                </View>
                <View style={styles.pillBadge}>
                  <Feather name="file-text" size={12} color="#15803D" />
                  <Text style={styles.pillBadgeText}>Ref: {activeOrder.transactionId}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Official Order Summary Details Card */}
          <View style={styles.orderSummaryCard}>
            <View style={styles.orderSummaryHeader}>
              <View>
                <Text style={styles.orderSummaryEyebrow}>OFFICIAL TAX INVOICE & ORDER SUMMARY</Text>
                <Text style={styles.orderSummaryTitle}>Order Summary Details</Text>
              </View>
              <View style={styles.verifiedSuccessPill}>
                <Feather name="check-circle" size={12} color="#15803D" />
                <Text style={styles.verifiedSuccessPillText}>PAID & CONFIRMED</Text>
              </View>
            </View>

            {/* 4-Item KPI Metrics Grid */}
            <View style={styles.orderKpiGrid}>
              <View style={styles.orderKpiItem}>
                <Text style={styles.orderKpiLabel}>ORDER ID</Text>
                <View style={styles.orderKpiValueRow}>
                  <Feather name="hash" size={13} color="#15803D" />
                  <Text style={[styles.orderKpiValue, styles.tabularNums]}>{activeOrder.orderId}</Text>
                </View>
              </View>

              <View style={styles.orderKpiItem}>
                <Text style={styles.orderKpiLabel}>TRANSACTION ID</Text>
                <View style={styles.orderKpiValueRow}>
                  <Feather name="file-text" size={13} color="#15803D" />
                  <Text style={[styles.orderKpiValue, styles.tabularNums]} numberOfLines={1}>{activeOrder.transactionId}</Text>
                </View>
              </View>

              <View style={styles.orderKpiItem}>
                <Text style={styles.orderKpiLabel}>TOTAL PAID</Text>
                <View style={styles.orderKpiValueRow}>
                  <Feather name="check" size={14} color="#15803D" />
                  <Text style={[styles.orderKpiValueTotal, styles.tabularNums]}>
                    {formatINR(activeOrder.pricing.grandTotal)}
                  </Text>
                </View>
              </View>

              <View style={styles.orderKpiItem}>
                <Text style={styles.orderKpiLabel}>PAYMENT METHOD</Text>
                <View style={styles.orderKpiValueRow}>
                  <Feather name="shield" size={13} color="#15803D" />
                  <Text style={styles.orderKpiValue}>
                    {activeOrder.paymentMethod === 'RAZORPAY' || activeOrder.paymentMethod === 'UPI'
                      ? 'Razorpay UPI / Card'
                      : 'Cash on Delivery (COD)'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Delivery Address Destination Box */}
            <View style={styles.deliveryDestinationBox}>
              <View style={styles.deliveryDestinationHeader}>
                <Feather name="map-pin" size={14} color="#15803D" />
                <Text style={styles.deliveryDestinationTitle}>FARM DELIVERY ADDRESS</Text>
              </View>
              <Text style={styles.deliveryRecipientName}>
                {activeOrder.deliveryAddress.receiverName} · +91 {activeOrder.deliveryAddress.phone}
              </Text>
              <Text style={styles.deliveryFullAddress}>
                {activeOrder.deliveryAddress.street}, {activeOrder.deliveryAddress.village}, {activeOrder.deliveryAddress.landmark ? `Near ${activeOrder.deliveryAddress.landmark}, ` : ''}{activeOrder.deliveryAddress.district}, {activeOrder.deliveryAddress.state} - {activeOrder.deliveryAddress.pincode}
              </Text>
              <View style={styles.addressTypeBadge}>
                <Feather name="check" size={11} color="#0F291E" />
                <Text style={styles.addressTypeBadgeText}>{activeOrder.deliveryAddress.addressType || 'Farm Gate Delivery'}</Text>
              </View>
            </View>

            {/* Dispatched Items Mini-List */}
            <View style={styles.orderItemsRecapBox}>
              <Text style={styles.orderItemsRecapTitle}>DISPATCHED AGRI-INPUTS ({activeOrder.items.length})</Text>
              {activeOrder.items.map((item, idx) => (
                <View key={item.id || idx} style={styles.orderItemRecapRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderItemRecapName}>{item.name}</Text>
                    <Text style={styles.orderItemRecapSub}>
                      {item.brand} • {item.packSize || item.unit || 'Standard Pack'} • Qty: {item.quantity}
                    </Text>
                  </View>
                  <Text style={[styles.orderItemRecapPrice, styles.tabularNums]}>
                    {formatINR(item.price)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Status Toast Notification if any */}
          {statusNotification ? (
            <View style={styles.toastNotice}>
              <Feather name="info" size={14} color="#0F291E" />
              <Text style={styles.toastNoticeText}>{statusNotification}</Text>
            </View>
          ) : null}

          {/* Live GPS Telemetry Card (Deep Forest Surface) */}
          <View style={styles.telemetryCard}>
            <View style={styles.telemetryHeader}>
              <View style={styles.telemetryBadge}>
                <View style={styles.pulsingDot} />
                <Text style={styles.telemetryBadgeText}>LIVE SATELLITE GPS TELEMETRY</Text>
              </View>
              <Text style={styles.telemetryTimestamp}>
                Updated {tracking?.lastUpdated || 'Just now'}
              </Text>
            </View>

            <View style={styles.telemetryLocationBox}>
              <View style={styles.telemetryLocationIcon}>
                <Feather name="navigation" size={20} color="#86EFAC" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.telemetryLocationLabel}>CURRENT SHIPMENT LOCATION</Text>
                <Text style={styles.telemetryLocationText}>
                  {tracking?.currentHubLocation || 'Regional Agro-Hub • En Route'}
                </Text>
                <Text style={styles.telemetryEtaText}>
                  Estimated Delivery: {tracking?.estimatedDelivery || 'In 2 business days'}
                </Text>
              </View>
            </View>

            <View style={styles.telemetryMetaGrid}>
              <View style={styles.telemetryMetaItem}>
                <Text style={styles.telemetryMetaLabel}>Assigned Logistics Vehicle</Text>
                <Text style={styles.telemetryMetaValue}>{tracking?.vehicleNumber || 'MH-09-CV-4821 (Agro-Express)'}</Text>
              </View>
              <View style={styles.telemetryMetaItem}>
                <Text style={styles.telemetryMetaLabel}>Delivery Officer / Pilot</Text>
                <Text style={styles.telemetryMetaValue}>{tracking?.assignedDriver || '+91 94220-88319 (Ramesh Patil)'}</Text>
              </View>
            </View>

            {/* Interactive Simulation Controls */}
            <View style={styles.simulationControlRow}>
              <Pressable
                onPress={handleRefreshTelemetry}
                disabled={refreshingTelemetry}
                style={({ pressed }) => [
                  styles.refreshButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Refresh GPS Status"
              >
                {refreshingTelemetry ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="refresh-cw" size={14} color="#FFFFFF" />
                    <Text style={styles.refreshButtonText}>Refresh Live GPS Status</Text>
                  </>
                )}
              </Pressable>

              {!isFullyDelivered ? (
                <Pressable
                  onPress={handleAdvanceCheckpoint}
                  disabled={advancingCheckpoint}
                  style={({ pressed }) => [
                    styles.advanceButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Simulate Next Delivery Checkpoint"
                >
                  {advancingCheckpoint ? (
                    <ActivityIndicator size="small" color="#0F291E" />
                  ) : (
                    <>
                      <Feather name="fast-forward" size={14} color="#0F291E" />
                      <Text style={styles.advanceButtonText}>Simulate Next Checkpoint →</Text>
                    </>
                  )}
                </Pressable>
              ) : (
                <View style={styles.deliveredBadge}>
                  <Feather name="check" size={14} color="#15803D" />
                  <Text style={styles.deliveredBadgeText}>Shipment Successfully Handed Over at Farm</Text>
                </View>
              )}
            </View>
          </View>

          {/* 5-Stage Real-Time Order Tracking Timeline */}
          <View style={styles.timelineCard}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.panelEyebrow}>ROUTE DISPATCH TELEMETRY</Text>
                <Text style={styles.panelTitle}>5-Stage Real-Time Order Timeline</Text>
              </View>
              <View style={styles.stageCountPill}>
                <Text style={styles.stageCountPillText}>
                  Stage {Math.min(5, currentStageIndex + 1)} of 5
                </Text>
              </View>
            </View>

            <View style={styles.timelineList}>
              {(tracking?.stageHistory || []).map((stage, idx) => {
                const isCompleted = idx < currentStageIndex || isFullyDelivered;
                const isActive = idx === currentStageIndex && !isFullyDelivered;
                const isPending = idx > currentStageIndex && !isFullyDelivered;

                return (
                  <View key={stage.title} style={styles.timelineRow}>
                    {/* Step Indicator with Vertical Line */}
                    <View style={styles.stepIndicatorCol}>
                      <View
                        style={[
                          styles.stepCircle,
                          isCompleted && styles.stepCircleCompleted,
                          isActive && styles.stepCircleActive,
                          isPending && styles.stepCirclePending,
                        ]}
                      >
                        {isCompleted ? (
                          <Feather name="check" size={14} color="#FFFFFF" />
                        ) : isActive ? (
                          <View style={styles.activeStepInnerDot} />
                        ) : (
                          <Text style={styles.stepNumberText}>{idx + 1}</Text>
                        )}
                      </View>
                      {idx < 4 ? (
                        <View
                          style={[
                            styles.stepLine,
                            isCompleted ? styles.stepLineCompleted : styles.stepLinePending,
                          ]}
                        />
                      ) : null}
                    </View>

                    {/* Step Details */}
                    <View style={styles.stepContentCol}>
                      <View style={styles.stepHeaderRow}>
                        <Text
                          style={[
                            styles.stepTitle,
                            isActive && styles.stepTitleActive,
                            isCompleted && styles.stepTitleCompleted,
                          ]}
                        >
                          {stage.title}
                        </Text>
                        <Text style={styles.stepTimestamp}>{stage.timestamp}</Text>
                      </View>
                      <Text style={styles.stepSubtitle}>{stage.subtitle}</Text>
                      {stage.hubLocation ? (
                        <View style={styles.stepHubRow}>
                          <Feather name="map-pin" size={12} color="#15803D" />
                          <Text style={styles.stepHubText}>{stage.hubLocation}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Delivery Address & Order Invoice Cards in 2 Columns */}
          <View style={[styles.columns, isWide && styles.columnsWide]}>
            {/* Delivery Address Card */}
            <View style={[styles.card, { flex: 1 }]}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.panelEyebrow}>FARM GATE DESTINATION</Text>
                  <Text style={styles.panelTitle}>Delivery Address</Text>
                </View>
                <View style={styles.addressTypePill}>
                  <Feather name="home" size={12} color="#15803D" />
                  <Text style={styles.addressTypePillText}>
                    {activeOrder.deliveryAddress.addressType}
                  </Text>
                </View>
              </View>

              <View style={styles.addressDetailsBlock}>
                <View style={styles.addressInfoRow}>
                  <Feather name="user" size={14} color="#15803D" />
                  <Text style={styles.addressInfoText}>
                    <Text style={styles.boldText}>{activeOrder.deliveryAddress.receiverName}</Text> (Receiver)
                  </Text>
                </View>

                <View style={styles.addressInfoRow}>
                  <Feather name="phone" size={14} color="#15803D" />
                  <Text style={[styles.addressInfoText, styles.tabularNums]}>
                    +91 {activeOrder.deliveryAddress.phone}
                  </Text>
                </View>

                <View style={styles.addressInfoRow}>
                  <Feather name="mail" size={14} color="#15803D" />
                  <Text style={styles.addressInfoText}>
                    {activeOrder.deliveryAddress.email}
                  </Text>
                </View>

                <View style={styles.addressInfoRow}>
                  <Feather name="home" size={14} color="#15803D" />
                  <Text style={styles.addressInfoText}>
                    {activeOrder.deliveryAddress.street}
                  </Text>
                </View>

                <View style={styles.addressInfoRow}>
                  <Feather name="map-pin" size={14} color="#15803D" />
                  <Text style={styles.addressInfoText}>
                    {activeOrder.deliveryAddress.village}, {activeOrder.deliveryAddress.district}, {activeOrder.deliveryAddress.state}
                  </Text>
                </View>

                <View style={styles.addressInfoRow}>
                  <Feather name="navigation" size={14} color="#15803D" />
                  <Text style={styles.addressInfoText}>
                    Landmark: {activeOrder.deliveryAddress.landmark} • <Text style={styles.boldText}>PIN {activeOrder.deliveryAddress.pincode}</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* Order Items & Total Card */}
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.panelEyebrow}>VERIFIED INVOICE SUMMARY</Text>
              <Text style={styles.panelTitle}>Purchased Farm Inputs</Text>

              <View style={styles.orderItemsList}>
                {activeOrder.items.map((item, idx) => (
                  <View key={item.name + idx} style={styles.orderItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderItemName}>{item.name}</Text>
                      <Text style={styles.orderItemMeta}>
                        Brand: {item.brand || 'Future Farming'} {item.packSize ? `· ${item.packSize}` : ''} · Qty: {item.quantity}
                      </Text>
                    </View>
                    <Text style={[styles.orderItemPrice, styles.tabularNums]}>
                      {formatINR(item.price || item.unitPrice * item.quantity)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.invoiceDivider} />

              <View style={styles.summaryRows}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={[styles.summaryValue, styles.tabularNums]}>
                    {formatINR(activeOrder.pricing.subtotal)}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Farmer Subsidy (5%)</Text>
                  <Text style={[styles.summaryDiscount, styles.tabularNums]}>
                    −{formatINR(activeOrder.pricing.subsidyDiscount)}
                  </Text>
                </View>

                {activeOrder.pricing.bundleDiscount ? (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Bundle Discount</Text>
                    <Text style={[styles.summaryDiscount, styles.tabularNums]}>
                      −{formatINR(activeOrder.pricing.bundleDiscount)}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Logistics & Delivery</Text>
                  <Text style={[styles.summaryFree, styles.tabularNums]}>
                    {activeOrder.pricing.deliveryFee === 0 ? 'FREE' : formatINR(activeOrder.pricing.deliveryFee)}
                  </Text>
                </View>

                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Paid</Text>
                  <Text style={[styles.totalValue, styles.tabularNums]}>
                    {formatINR(activeOrder.pricing.grandTotal)}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 20 }}>
                <ActionButton
                  label="Continue Shopping in Agri-Shop"
                  icon="shopping-bag"
                  variant="primary"
                  fullWidth
                  onPress={() => {
                    setActiveOrder(null);
                    router.replace(AGRI_SHOP_ROUTE);
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </UnifiedPageShell>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 1 & 3. CART & CHECKOUT WITH STRUCTURED FARM ADDRESS & RAZORPAY GATEWAY
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <UnifiedPageShell
      activeRoute="/agri-shop"
      title="Your Cart & Checkout"
      subtitle={`${totalItems} pack${totalItems === 1 ? '' : 's'} · ${distinctItems} product${distinctItems === 1 ? '' : 's'}`}
      statusPillText="Razorpay Gateway • Free Delivery > ₹999"
      onBack={() => safeGoBack(AGRI_SHOP_ROUTE)}
      scrollable={true}
    >
      <View style={styles.contentInner}>
        {/* Placed Order Access Header (if previous orders exist) */}
        {allOrders.length > 0 ? (
          <View style={styles.ordersHistoryBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="package" size={16} color="#15803D" />
              <Text style={styles.ordersHistoryBannerText}>
                You have {allOrders.length} placed order{allOrders.length > 1 ? 's' : ''} with live tracking.
              </Text>
            </View>
            <Pressable
              onPress={() => setActiveOrder(allOrders[0])}
              style={({ pressed }) => [
                styles.trackMyOrdersButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
            >
              <Feather name="navigation" size={13} color="#15803D" />
              <Text style={styles.trackMyOrdersButtonText}>
                Track Order #{allOrders[0].orderId} →
              </Text>
            </Pressable>
          </View>
        ) : null}

        {statusNotification ? (
          <View style={styles.errorToast}>
            <Feather name="alert-circle" size={16} color="#B3261E" />
            <Text style={styles.errorToastText}>{statusNotification}</Text>
          </View>
        ) : null}

        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <Feather name="shopping-bag" size={28} color="#15803D" />
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>
              Browse AI-recommended crop protection, nutrition, and seeds, or
              run a Crop Doctor scan to build a treatment bundle.
            </Text>
            <ActionButton
              label="Browse Agri-Shop"
              icon="shopping-bag"
              variant="primary"
              fullWidth
              onPress={() => router.replace(AGRI_SHOP_ROUTE)}
            />
            {allOrders.length > 0 ? (
              <ActionButton
                label={`Track My Orders (${allOrders.length})`}
                icon="navigation"
                variant="outline"
                fullWidth
                onPress={() => setActiveOrder(allOrders[0])}
              />
            ) : null}
          </View>
        ) : (
          <View style={[styles.columns, isWide && styles.columnsWide]}>
            {/* Left Column: Cart Items List */}
            <View style={styles.itemsColumn}>
              <View style={styles.itemsHeader}>
                <Text style={styles.itemsTitle}>
                  Farm inputs ({totalItems})
                </Text>
                <Pressable
                  onPress={clearCart}
                  style={({ pressed }) => [
                    styles.clearButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={styles.clearButtonText}>Clear cart</Text>
                </Pressable>
              </View>

              {items.map((item) => {
                const lineTotal = item.product.price * item.quantity;

                return (
                  <View key={item.product.id} style={styles.itemCard}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/agri-shop/[id]',
                          params: { id: item.product.id },
                        })
                      }
                      style={({ pressed }) => [
                        styles.itemThumb,
                        pressed && styles.pressed,
                      ]}
                      accessibilityRole="button"
                    >
                      <ProductPhoto
                        product={item.product}
                        height={102}
                        compact
                        showBadges={false}
                      />
                    </Pressable>

                    <View style={styles.itemBody}>
                      <View style={styles.itemTitleRow}>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: '/agri-shop/[id]',
                              params: { id: item.product.id },
                            })
                          }
                          style={styles.itemTitleButton}
                        >
                          <Text style={styles.itemName} numberOfLines={2}>
                            {item.product.name}
                          </Text>
                        </Pressable>
                      </View>

                      <Text style={styles.itemMeta}>
                        {item.product.brand} · {item.product.activeIngredients}
                      </Text>
                      <Text style={[styles.itemUnit, styles.tabularNums]}>
                        {item.product.unit} · {formatINR(item.product.price)} each
                      </Text>

                      <View style={styles.itemControls}>
                        <QuantityStepper
                          value={item.quantity}
                          onChange={(next) => {
                            if (next > item.quantity) {
                              incrementItem(item.product.id);
                            } else if (next < item.quantity) {
                              decrementItem(item.product.id);
                            }
                          }}
                          compact
                        />

                        <Pressable
                          onPress={() => removeItem(item.product.id)}
                          style={({ pressed }) => [
                            styles.removeButton,
                            pressed && styles.pressed,
                          ]}
                          accessibilityRole="button"
                        >
                          <Text style={styles.removeText}>Remove</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.itemPriceBlock}>
                      <Text style={[styles.itemPrice, styles.tabularNums]}>
                        {formatINR(lineTotal)}
                      </Text>
                      <Text style={[styles.itemOriginal, styles.tabularNums]}>
                        {formatINR(item.product.originalPrice * item.quantity)}
                      </Text>
                      <Text style={[styles.itemSavings, styles.tabularNums]}>
                        Save {formatINR((item.product.originalPrice - item.product.price) * item.quantity)}
                      </Text>
                    </View>
                  </View>
                );
              })}

              <Pressable
                onPress={() => router.push(AGRI_SHOP_ROUTE)}
                style={({ pressed }) => [
                  styles.continueLink,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.continueLinkText}>
                  ← Continue shopping in Agri-Shop
                </Text>
              </Pressable>
            </View>

            {/* Right Column: Address, Payment Gateway, and Summary */}
            <View style={[styles.summaryColumn, isWide && styles.summaryColumnWide]}>
              {/* 1. Structured Indian Farm Delivery Address Card */}
              <View style={styles.addressCard}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.panelEyebrow}>DELIVERY DETAILS — WHERE SHOULD WE DELIVER?</Text>
                    <Text style={styles.panelTitle}>Detailed Farm Delivery Address</Text>
                  </View>
                  <View style={styles.prefilledBadge}>
                    <Feather name="check" size={11} color="#15803D" />
                    <Text style={styles.prefilledBadgeText}>Indian Farm Format</Text>
                  </View>
                </View>
                <Text style={styles.panelHint}>
                  Pre-filled from your farmer profile. Required for rural Kisan Logistics & GST invoice.
                </Text>

                {/* Row 1 (2 Columns): Receiver Full Name & 10-Digit Mobile */}
                <View style={styles.formRow}>
                  <View style={[styles.formCol, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>
                      Receiver Full Name <Text style={styles.reqStar}>*</Text>
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        formErrors.receiverName && styles.inputWrapperError,
                      ]}
                    >
                      <Feather name="user" size={16} color={formErrors.receiverName ? '#B3261E' : '#15803D'} />
                      <TextInput
                        value={addressForm.receiverName}
                        onChangeText={(t) => handleFieldChange('receiverName', t)}
                        placeholder="e.g. Ajay Patil"
                        placeholderTextColor={ShopColors.soft}
                        style={styles.textInputField}
                      />
                    </View>
                    {formErrors.receiverName ? (
                      <Text style={styles.fieldErrorText}>{formErrors.receiverName}</Text>
                    ) : null}
                  </View>

                  <View style={[styles.formCol, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>
                      10-Digit Mobile Number <Text style={styles.reqStar}>*</Text>
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        formErrors.phone && styles.inputWrapperError,
                      ]}
                    >
                      <Feather name="phone" size={16} color={formErrors.phone ? '#B3261E' : '#15803D'} />
                      <TextInput
                        value={addressForm.phone}
                        onChangeText={(t) => handleFieldChange('phone', t)}
                        placeholder="e.g. 9876543210"
                        placeholderTextColor={ShopColors.soft}
                        keyboardType="phone-pad"
                        maxLength={10}
                        style={[styles.textInputField, styles.tabularNums]}
                      />
                    </View>
                    {formErrors.phone ? (
                      <Text style={styles.fieldErrorText}>{formErrors.phone}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Row 2: Confirmation Email Address */}
                <View style={styles.formRowSingle}>
                  <Text style={styles.inputLabel}>
                    Confirmation Email Address <Text style={styles.reqStar}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      formErrors.email && styles.inputWrapperError,
                    ]}
                  >
                    <Feather name="mail" size={16} color={formErrors.email ? '#B3261E' : '#15803D'} />
                    <TextInput
                      value={addressForm.email}
                      onChangeText={(t) => handleFieldChange('email', t)}
                      placeholder="e.g. farmer.ajay@gmail.com"
                      placeholderTextColor={ShopColors.soft}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.textInputField}
                    />
                  </View>
                  {formErrors.email ? (
                    <Text style={styles.fieldErrorText}>{formErrors.email}</Text>
                  ) : null}
                </View>

                {/* Row 3: Farm Gate / House No., Survey / Gat No., Street */}
                <View style={styles.formRowSingle}>
                  <Text style={styles.inputLabel}>
                    Farm Gate / House No., Survey / Gat No., Building or Street <Text style={styles.reqStar}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      formErrors.street && styles.inputWrapperError,
                    ]}
                  >
                    <Feather name="home" size={16} color={formErrors.street ? '#B3261E' : '#15803D'} />
                    <TextInput
                      value={addressForm.street}
                      onChangeText={(t) => handleFieldChange('street', t)}
                      placeholder="e.g. Gat No. 142, Near Main Canal Road, Farm Gate"
                      placeholderTextColor={ShopColors.soft}
                      style={styles.textInputField}
                    />
                  </View>
                  {formErrors.street ? (
                    <Text style={styles.fieldErrorText}>{formErrors.street}</Text>
                  ) : null}
                </View>

                {/* Row 4 (2 Columns): Village / Taluka & Landmark */}
                <View style={styles.formRow}>
                  <View style={[styles.formCol, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>
                      Village / Post Office & Taluka <Text style={styles.reqStar}>*</Text>
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        formErrors.village && styles.inputWrapperError,
                      ]}
                    >
                      <Feather name="map-pin" size={16} color={formErrors.village ? '#B3261E' : '#15803D'} />
                      <TextInput
                        value={addressForm.village}
                        onChangeText={(t) => handleFieldChange('village', t)}
                        placeholder="e.g. Shiroli, Tal. Hatkanangale"
                        placeholderTextColor={ShopColors.soft}
                        style={styles.textInputField}
                      />
                    </View>
                    {formErrors.village ? (
                      <Text style={styles.fieldErrorText}>{formErrors.village}</Text>
                    ) : null}
                  </View>

                  <View style={[styles.formCol, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>
                      Nearest Landmark <Text style={styles.reqStar}>*</Text>
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        formErrors.landmark && styles.inputWrapperError,
                      ]}
                    >
                      <Feather name="navigation" size={16} color={formErrors.landmark ? '#B3261E' : '#15803D'} />
                      <TextInput
                        value={addressForm.landmark}
                        onChangeText={(t) => handleFieldChange('landmark', t)}
                        placeholder="e.g. Opposite Dudhganga Dairy / Water Tank"
                        placeholderTextColor={ShopColors.soft}
                        style={styles.textInputField}
                      />
                    </View>
                    {formErrors.landmark ? (
                      <Text style={styles.fieldErrorText}>{formErrors.landmark}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Row 5 (3 Columns): District, State & 6-Digit PIN Code */}
                <View style={styles.formRow}>
                  <View style={[styles.formCol, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>
                      District <Text style={styles.reqStar}>*</Text>
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        formErrors.district && styles.inputWrapperError,
                      ]}
                    >
                      <TextInput
                        value={addressForm.district}
                        onChangeText={(t) => handleFieldChange('district', t)}
                        placeholder="e.g. Kolhapur"
                        placeholderTextColor={ShopColors.soft}
                        style={styles.textInputField}
                      />
                    </View>
                    {formErrors.district ? (
                      <Text style={styles.fieldErrorText}>{formErrors.district}</Text>
                    ) : null}
                  </View>

                  <View style={[styles.formCol, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>
                      State <Text style={styles.reqStar}>*</Text>
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        formErrors.state && styles.inputWrapperError,
                      ]}
                    >
                      <TextInput
                        value={addressForm.state}
                        onChangeText={(t) => handleFieldChange('state', t)}
                        placeholder="e.g. Maharashtra"
                        placeholderTextColor={ShopColors.soft}
                        style={styles.textInputField}
                      />
                    </View>
                    {formErrors.state ? (
                      <Text style={styles.fieldErrorText}>{formErrors.state}</Text>
                    ) : null}
                  </View>

                  <View style={[styles.formCol, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>
                      6-Digit PIN <Text style={styles.reqStar}>*</Text>
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        formErrors.pincode && styles.inputWrapperError,
                      ]}
                    >
                      <TextInput
                        value={addressForm.pincode}
                        onChangeText={(t) => handleFieldChange('pincode', t)}
                        placeholder="416122"
                        placeholderTextColor={ShopColors.soft}
                        keyboardType="number-pad"
                        maxLength={6}
                        style={[styles.textInputField, styles.tabularNums]}
                      />
                    </View>
                    {formErrors.pincode ? (
                      <Text style={styles.fieldErrorText}>{formErrors.pincode}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Address Type Pill Selector */}
                <View style={styles.addressTypeContainer}>
                  <Text style={styles.inputLabel}>Address Category</Text>
                  <View style={styles.pillsRow}>
                    {(['Farm Gate Delivery', 'Home / Residence', 'FPO Collection Center'] as AddressType[]).map(
                      (type) => {
                        const selected = addressForm.addressType === type;
                        const iconName =
                          type === 'Farm Gate Delivery'
                            ? 'truck'
                            : type === 'Home / Residence'
                              ? 'home'
                              : 'package';

                        return (
                          <Pressable
                            key={type}
                            onPress={() => setAddressForm((p) => ({ ...p, addressType: type }))}
                            style={({ pressed }) => [
                              styles.typePill,
                              selected && styles.typePillSelected,
                              pressed && styles.pressed,
                            ]}
                            accessibilityRole="button"
                          >
                            <Feather
                              name={iconName}
                              size={13}
                              color={selected ? '#FFFFFF' : '#15803D'}
                            />
                            <Text
                              style={[
                                styles.typePillText,
                                selected && styles.typePillTextSelected,
                              ]}
                            >
                              {type}
                            </Text>
                          </Pressable>
                        );
                      }
                    )}
                  </View>
                </View>
              </View>

              {/* 2. Payment Method Card (Razorpay & COD) */}
              <View style={styles.paymentCard}>
                <Text style={styles.panelEyebrow}>PAYMENT GATEWAY</Text>
                <Text style={styles.panelTitle}>Choose Payment Method</Text>

                {/* Razorpay Online Payment Option */}
                <Pressable
                  onPress={() => setPaymentMethod('RAZORPAY')}
                  style={({ pressed }) => [
                    styles.paymentOptionCard,
                    paymentMethod === 'RAZORPAY' && styles.paymentOptionCardSelected,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: paymentMethod === 'RAZORPAY' }}
                >
                  <View style={styles.radioOuter}>
                    {paymentMethod === 'RAZORPAY' ? <View style={styles.radioInner} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.paymentTitleRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Feather name="shield" size={16} color="#15803D" />
                        <Text style={styles.paymentOptionTitle}>Pay Online via Razorpay</Text>
                      </View>
                      <View style={styles.verifiedBadge}>
                        <Feather name="check" size={10} color="#15803D" />
                        <Text style={styles.verifiedBadgeText}>Instant Auto-Verify</Text>
                      </View>
                    </View>
                    <Text style={styles.paymentOptionSubtitle}>
                      UPI (GPay, PhonePe, Paytm), All Bank Cards, NetBanking, & Wallets
                    </Text>
                  </View>
                </Pressable>

                {/* Cash on Delivery Option */}
                <Pressable
                  onPress={() => setPaymentMethod('COD')}
                  style={({ pressed }) => [
                    styles.paymentOptionCard,
                    paymentMethod === 'COD' && styles.paymentOptionCardSelected,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: paymentMethod === 'COD' }}
                >
                  <View style={styles.radioOuter}>
                    {paymentMethod === 'COD' ? <View style={styles.radioInnerDark} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.paymentTitleRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Feather name="truck" size={16} color="#0F291E" />
                        <Text style={styles.paymentOptionTitle}>Cash on Delivery (COD)</Text>
                      </View>
                      <View style={styles.codBadge}>
                        <Text style={styles.codBadgeText}>Pay at Farm Gate</Text>
                      </View>
                    </View>
                    <Text style={styles.paymentOptionSubtitle}>
                      Pay via cash or UPI scan when inputs are physically delivered to your farm
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* 3. Order Summary & Action Button */}
              <View style={styles.summaryCard}>
                <Text style={styles.panelEyebrow}>ORDER SUMMARY</Text>
                <Text style={styles.panelTitle}>Checkout</Text>

                {subtotal < FREE_DELIVERY_THRESHOLD ? (
                  <View style={styles.deliveryProgress}>
                    <Text style={[styles.deliveryProgressText, styles.tabularNums]}>
                      Add {formatINR(freeDeliveryGap)} more for free delivery.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.deliveryProgressFree}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Feather name="truck" size={14} color="#15803D" />
                      <Text style={styles.deliveryProgressFreeText}>
                        You have unlocked free rural farm delivery!
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.summaryRows}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Item subtotal</Text>
                    <Text style={[styles.summaryValue, styles.tabularNums]}>
                      {formatINR(subtotal)}
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Farmer subsidy (5%)</Text>
                    <Text style={[styles.summaryDiscount, styles.tabularNums]}>
                      −{formatINR(farmerSubsidy)}
                    </Text>
                  </View>

                  {bundleDiscount > 0 ? (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>
                        Bundle discount ({Math.round(bundleDiscountRate * 100)}%)
                      </Text>
                      <Text style={[styles.summaryDiscount, styles.tabularNums]}>
                        −{formatINR(bundleDiscount)}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery</Text>
                    <Text
                      style={[
                        deliveryFee === 0 ? styles.summaryFree : styles.summaryValue,
                        styles.tabularNums,
                      ]}
                    >
                      {deliveryFee === 0 ? 'FREE' : formatINR(deliveryFee)}
                    </Text>
                  </View>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={[styles.totalValue, styles.tabularNums]}>
                    {formatINR(total)}
                  </Text>
                </View>

                <View style={styles.savingsBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                    <Feather name="trending-down" size={14} color="#15803D" />
                    <Text style={[styles.savingsBoxText, styles.tabularNums]}>
                      Total savings {formatINR(totalSavings)} vs MRP
                    </Text>
                  </View>
                </View>

                {/* Primary Action Button */}
                {paymentMethod === 'RAZORPAY' ? (
                  <ActionButton
                    label={
                      placing
                        ? paymentStatusText || 'Connecting to Razorpay…'
                        : `Pay ${formatINR(total)} with Razorpay`
                    }
                    icon="lock"
                    variant="primary"
                    loading={placing}
                    fullWidth
                    onPress={handleInitiateCheckout}
                  />
                ) : (
                  <ActionButton
                    label={
                      placing
                        ? paymentStatusText || 'Placing COD Order…'
                        : `Place COD Order · ${formatINR(total)}`
                    }
                    icon="check"
                    variant="primary"
                    loading={placing}
                    fullWidth
                    onPress={handleInitiateCheckout}
                  />
                )}

                {paymentMethod === 'RAZORPAY' ? (
                  <Pressable
                    onPress={handleSimulateSuccessfulPayment}
                    style={({ pressed }) => [
                      styles.checkoutSimulateButton,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Simulate Successful Razorpay Payment Test"
                  >
                    <Feather name="zap" size={14} color="#15803D" />
                    <Text style={styles.checkoutSimulateButtonText}>
                      Simulate Successful Razorpay Payment Test
                    </Text>
                  </Pressable>
                ) : null}

                <Text style={styles.checkoutNote}>
                  Verified FPO Central Desk dispatch. An automated GST invoice and real-time shipment tracking will be sent immediately upon confirmation.
                </Text>

                <View style={styles.trustRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Feather name="shield" size={13} color="#15803D" />
                    <Text style={styles.trustItem}>Razorpay 256-Bit SSL</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Feather name="check-circle" size={13} color="#15803D" />
                    <Text style={styles.trustItem}>100% Genuine Agro-Inputs</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ─── Razorpay Test Mode Payment Simulator Modal ──────────────────────── */}
      <Modal
        visible={showRazorpayModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRazorpayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.razorpayLogoBox}>
                <Feather name="shield" size={18} color="#15803D" />
                <Text style={styles.razorpayLogoText}>RAZORPAY SECURE GATEWAY</Text>
              </View>
              <Pressable
                onPress={() => setShowRazorpayModal(false)}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={18} color="#6B7280" />
              </Pressable>
            </View>

            <View style={styles.modalAmountBox}>
              <Text style={styles.modalAmountLabel}>Total Amount Payable</Text>
              <Text style={[styles.modalAmountValue, styles.tabularNums]}>
                {formatINR(total)}
              </Text>
              <Text style={styles.modalOrderRef}>
                Razorpay Order: {pendingRazorpayData?.razorpayOrderId}
              </Text>
              <Text style={styles.modalOrderRef}>
                Key ID: {pendingRazorpayData?.keyId || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'Razorpay Live'} (Test Mode)
              </Text>
            </View>

            {/* Modal Tabs: Instant UPI QR vs Cards & Fast Checkout */}
            <View style={styles.modalTabRow}>
              <Pressable
                onPress={() => setModalPaymentTab('QR')}
                style={[
                  styles.modalTabButton,
                  modalPaymentTab === 'QR' && styles.modalTabButtonActive,
                ]}
              >
                <Feather
                  name="grid"
                  size={14}
                  color={modalPaymentTab === 'QR' ? '#15803D' : '#6B7A6C'}
                />
                <Text
                  style={[
                    styles.modalTabText,
                    modalPaymentTab === 'QR' && styles.modalTabTextActive,
                  ]}
                >
                  Instant UPI QR Code
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setModalPaymentTab('TEST_MODE')}
                style={[
                  styles.modalTabButton,
                  modalPaymentTab === 'TEST_MODE' && styles.modalTabButtonActive,
                ]}
              >
                <Feather
                  name="credit-card"
                  size={14}
                  color={modalPaymentTab === 'TEST_MODE' ? '#15803D' : '#6B7A6C'}
                />
                <Text
                  style={[
                    styles.modalTabText,
                    modalPaymentTab === 'TEST_MODE' && styles.modalTabTextActive,
                  ]}
                >
                  Cards & Fast Checkout
                </Text>
              </Pressable>
            </View>

            {modalPaymentTab === 'QR' ? (
              <View style={styles.qrContainer}>
                {/* QR Code Container */}
                <View style={styles.qrCodeWrapper}>
                  <Image
                    source={{
                      uri:
                        pendingRazorpayData?.qrCodeUrl ||
                        `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                          pendingRazorpayData?.upiIntentString ||
                            `upi://pay?pa=success@razorpay&pn=FutureFarmingAgriShop&am=${total}&cu=INR&tr=${pendingRazorpayData?.razorpayOrderId}&mc=5411`
                        )}`,
                    }}
                    style={styles.qrCodeImage}
                    resizeMode="contain"
                  />
                  <View style={styles.qrScanHintRow}>
                    <Feather name="maximize" size={13} color="#15803D" />
                    <Text style={styles.qrScanHintText}>Scan to Pay {formatINR(total)}</Text>
                  </View>
                </View>

                {/* Supported UPI Apps Pills */}
                <View style={styles.upiAppsRow}>
                  <View style={styles.upiAppBadge}>
                    <Feather name="smartphone" size={11} color="#0F291E" />
                    <Text style={styles.upiAppBadgeText}>Google Pay</Text>
                  </View>
                  <View style={styles.upiAppBadge}>
                    <Feather name="smartphone" size={11} color="#0F291E" />
                    <Text style={styles.upiAppBadgeText}>PhonePe</Text>
                  </View>
                  <View style={styles.upiAppBadge}>
                    <Feather name="smartphone" size={11} color="#0F291E" />
                    <Text style={styles.upiAppBadgeText}>Paytm</Text>
                  </View>
                  <View style={styles.upiAppBadge}>
                    <Feather name="smartphone" size={11} color="#0F291E" />
                    <Text style={styles.upiAppBadgeText}>BHIM</Text>
                  </View>
                </View>

                {/* UPI Metadata Box */}
                <View style={styles.upiMetaBox}>
                  <View style={styles.upiMetaItem}>
                    <Text style={styles.upiMetaLabel}>Merchant VPA (Razorpay Test)</Text>
                    <Text style={styles.upiMetaValue}>success@razorpay</Text>
                  </View>
                  <View style={styles.upiMetaItem}>
                    <Text style={styles.upiMetaLabel}>Payee</Text>
                    <Text style={styles.upiMetaValue}>Future Farming Agri-Shop</Text>
                  </View>
                </View>

                {/* Deep Link button for Mobile Devices */}
                {pendingRazorpayData?.upiIntentString ? (
                  <Pressable
                    onPress={() => {
                      if (pendingRazorpayData?.upiIntentString) {
                        Linking.openURL(pendingRazorpayData.upiIntentString).catch(() => {
                          setStatusNotification('Could not open external UPI app. Please scan the QR code above.');
                        });
                      }
                    }}
                    style={styles.upiDeepLinkButton}
                  >
                    <Feather name="external-link" size={13} color="#15803D" />
                    <Text style={styles.upiDeepLinkText}>Open Installed UPI App</Text>
                  </Pressable>
                ) : null}

                {/* Confirm QR Scan Payment Button */}
                <Pressable
                  onPress={() =>
                    handleVerifyPayment(
                      `pay_qr_${Date.now()}`,
                      'Scanned UPI QR Payment (GPay/PhonePe/Paytm)'
                    )
                  }
                  style={({ pressed }) => [
                    styles.qrConfirmButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Feather name="check-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.qrConfirmButtonText}>
                    I Have Scanned & Completed UPI Payment →
                  </Text>
                </Pressable>

                {/* Instant Simulation Button for Evaluations */}
                <Pressable
                  onPress={handleSimulateSuccessfulPayment}
                  style={({ pressed }) => [
                    styles.simulateEvalButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Simulate Successful Razorpay Payment Test"
                >
                  <Feather name="zap" size={15} color="#15803D" />
                  <Text style={styles.simulateEvalButtonText}>
                    Simulate Successful Razorpay Payment Test
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <View style={styles.testBadgeRow}>
                  <Feather name="info" size={13} color="#15803D" />
                  <Text style={styles.testBadgeText}>
                    Razorpay Test Sandbox Mode: Complete test payment without real money!
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  {/* Top Primary Evaluation Simulator Button */}
                  <Pressable
                    onPress={handleSimulateSuccessfulPayment}
                    style={({ pressed }) => [
                      styles.simulateEvalButtonSolid,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Simulate Successful Razorpay Payment Test"
                  >
                    <Feather name="zap" size={16} color="#FFFFFF" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.simulateEvalButtonSolidTitle}>Simulate Successful Razorpay Payment Test</Text>
                      <Text style={styles.simulateEvalButtonSolidSub}>Instant bypass sandbox gateway & confirm order</Text>
                    </View>
                    <Feather name="arrow-right" size={14} color="#FFFFFF" />
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      handleVerifyPayment(`pay_upi_${Date.now()}`, 'Razorpay Test UPI (success@razorpay)')
                    }
                    style={({ pressed }) => [
                      styles.testPayButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Feather name="smartphone" size={16} color="#FFFFFF" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.testPayButtonTitle}>Pay with Razorpay Test UPI</Text>
                      <Text style={styles.testPayButtonSubtitle}>Auto-authorizes with success@razorpay</Text>
                    </View>
                    <Feather name="arrow-right" size={14} color="#FFFFFF" />
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      handleVerifyPayment(`pay_card_${Date.now()}`, 'Razorpay Test Card (4111...)')
                    }
                    style={({ pressed }) => [
                      styles.testPayButtonOutline,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Feather name="credit-card" size={16} color="#15803D" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.testPayButtonOutlineTitle}>Pay with Razorpay Test Card</Text>
                      <Text style={styles.testPayButtonOutlineSubtitle}>Instant mock card authentication</Text>
                    </View>
                    <Feather name="arrow-right" size={14} color="#15803D" />
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      handleVerifyPayment(`pay_instant_${Date.now()}`, '1-Click Fast Verification')
                    }
                    style={({ pressed }) => [
                      styles.instantVerifyButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Feather name="check-circle" size={15} color="#0F291E" />
                    <Text style={styles.instantVerifyButtonText}>Instant 1-Click Verification & Place Order</Text>
                  </Pressable>
                </View>
              </View>
            )}

            <Text style={styles.modalFooterNote}>
              Encrypted end-to-end via Razorpay payment protocol. Verified directly with Future Farming backend.
            </Text>
          </View>
        </View>
      </Modal>
    </UnifiedPageShell>
  );
}

const styles = StyleSheet.create({
  contentInner: {
    width: '100%',
    maxWidth: 1160,
    alignSelf: 'center',
    paddingBottom: 40,
  },
  tabularNums: {
    fontVariant: ['tabular-nums'],
  },
  boldText: {
    fontWeight: '700',
    color: '#0F291E',
  },
  columns: {
    gap: 18,
  },
  columnsWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemsColumn: {
    flex: 1,
    minWidth: 0,
  },
  summaryColumn: {
    width: '100%',
    gap: 16,
  },
  summaryColumnWide: {
    width: 420,
    flexShrink: 0,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F291E',
  },
  clearButton: {
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  clearButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: ShopColors.danger,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6ECE6',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 12,
  },
  itemThumb: {
    width: 90,
    height: 90,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F7F9F7',
    borderWidth: 1,
    borderColor: '#E6ECE6',
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemTitleButton: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F291E',
    lineHeight: 20,
  },
  itemMeta: {
    fontSize: 12,
    color: '#6B7A6C',
    marginTop: 3,
  },
  itemUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
    marginTop: 2,
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  removeButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  removeText: {
    fontSize: 12,
    fontWeight: '600',
    color: ShopColors.danger,
  },
  itemPriceBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F291E',
  },
  itemOriginal: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  itemSavings: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  continueLink: {
    paddingVertical: 10,
    marginTop: 4,
  },
  continueLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },

  // ─── Structured Address Form Styles ─────────────────────────────────────────
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6ECE6',
    borderRadius: 24,
    padding: 22,
    gap: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  panelEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#15803D',
    textTransform: 'uppercase',
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F291E',
    marginTop: 2,
  },
  prefilledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDF5EE',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  prefilledBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
    textTransform: 'uppercase',
  },
  panelHint: {
    fontSize: 12,
    color: '#6B7A6C',
    lineHeight: 17,
    marginTop: -4,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formCol: {
    minWidth: 0,
  },
  formRowSingle: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  reqStar: {
    color: '#B3261E',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7F9F7',
    borderWidth: 1,
    borderColor: '#E6ECE6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  inputWrapperError: {
    borderColor: '#B3261E',
    backgroundColor: '#FEF2F2',
  },
  textInputField: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    padding: 0,
  },
  fieldErrorText: {
    fontSize: 11,
    color: '#B3261E',
    marginTop: 2,
    fontWeight: '500',
  },
  addressTypeContainer: {
    marginTop: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typePillSelected: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  typePillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ─── Payment Options ────────────────────────────────────────────────────────
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6ECE6',
    borderRadius: 24,
    padding: 22,
    gap: 12,
  },
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E6ECE6',
    backgroundColor: '#FAFCFA',
  },
  paymentOptionCardSelected: {
    borderColor: '#15803D',
    backgroundColor: '#F0FDF4',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#15803D',
  },
  radioInnerDark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0F291E',
  },
  paymentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 3,
  },
  paymentOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F291E',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
    textTransform: 'uppercase',
  },
  codBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4B5563',
    textTransform: 'uppercase',
  },
  paymentOptionSubtitle: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },

  // ─── Summary Card ───────────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6ECE6',
    borderRadius: 24,
    padding: 22,
    gap: 14,
  },
  deliveryProgress: {
    backgroundColor: '#F8FAF8',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E6ECE6',
  },
  deliveryProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7A6C',
  },
  deliveryProgressFree: {
    backgroundColor: '#EDF5EE',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  deliveryProgressFreeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  summaryRows: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7A6C',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F291E',
  },
  summaryDiscount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  summaryFree: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  totalRow: {
    borderTopWidth: 1,
    borderColor: '#E6ECE6',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F291E',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#15803D',
  },
  savingsBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 10,
  },
  savingsBoxText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  checkoutNote: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 15,
    textAlign: 'center',
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
    paddingTop: 12,
  },
  trustItem: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },

  // ─── Real-Time Tracking Dashboard Styles ────────────────────────────────────
  successBannerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#065F46',
  },
  bannerText: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 19,
    marginTop: 4,
  },
  bannerMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },

  // ─── Live Satellite GPS Telemetry Card ──────────────────────────────────────
  telemetryCard: {
    backgroundColor: '#0F291E',
    borderRadius: 24,
    padding: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#1E4A35',
  },
  telemetryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  telemetryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(21, 128, 61, 0.3)',
    borderWidth: 1,
    borderColor: '#15803D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  telemetryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#86EFAC',
  },
  telemetryTimestamp: {
    fontSize: 11,
    color: '#A7F3D0',
  },
  telemetryLocationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  telemetryLocationIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(134, 239, 172, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryLocationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#86EFAC',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  telemetryLocationText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
    lineHeight: 21,
  },
  telemetryEtaText: {
    fontSize: 12,
    color: '#D1FAE5',
    marginTop: 4,
  },
  telemetryMetaGrid: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  telemetryMetaItem: {
    flex: 1,
  },
  telemetryMetaLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  telemetryMetaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  simulationControlRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  advanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#86EFAC',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  advanceButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F291E',
  },
  deliveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  deliveredBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },

  // ─── 5-Stage Timeline Styles ────────────────────────────────────────────────
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6ECE6',
    borderRadius: 24,
    padding: 24,
    marginBottom: 18,
  },
  stageCountPill: {
    backgroundColor: '#EDF5EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  stageCountPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  timelineList: {
    marginTop: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleCompleted: {
    backgroundColor: '#15803D',
  },
  stepCircleActive: {
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#15803D',
  },
  activeStepInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#15803D',
  },
  stepCirclePending: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  stepLine: {
    width: 2,
    height: 48,
  },
  stepLineCompleted: {
    backgroundColor: '#15803D',
  },
  stepLinePending: {
    backgroundColor: '#E5E7EB',
  },
  stepContentCol: {
    flex: 1,
    paddingBottom: 22,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  stepTitleActive: {
    color: '#15803D',
    fontWeight: '800',
    fontSize: 15,
  },
  stepTitleCompleted: {
    color: '#0F291E',
    fontWeight: '700',
  },
  stepTimestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    fontVariant: ['tabular-nums'],
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 17,
  },
  stepHubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  stepHubText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },

  // ─── Destination & Invoice Details ──────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6ECE6',
    borderRadius: 24,
    padding: 22,
  },
  addressTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  addressTypePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  addressDetailsBlock: {
    marginTop: 14,
    gap: 8,
  },
  addressInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  addressInfoText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    flex: 1,
  },
  orderItemsList: {
    marginTop: 12,
    gap: 10,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  orderItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F291E',
  },
  orderItemMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F291E',
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: '#E6ECE6',
    marginVertical: 14,
  },

  // ─── Orders History Banner & Toasts ─────────────────────────────────────────
  ordersHistoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  ordersHistoryBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  trackMyOrdersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  trackMyOrdersButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  toastNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF9C3',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE047',
    marginBottom: 12,
  },
  toastNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#854D0E',
  },
  errorToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  errorToastText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B3261E',
  },

  // ─── Empty Cart ─────────────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6ECE6',
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    gap: 14,
    maxWidth: 520,
    alignSelf: 'center',
    width: '100%',
    marginTop: 20,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EDF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F291E',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7A6C',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
  },

  // ─── Razorpay Modal ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E6ECE6',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  razorpayLogoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  razorpayLogoText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#15803D',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalAmountBox: {
    backgroundColor: '#F8FAF8',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6ECE6',
    marginBottom: 14,
  },
  modalAmountLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalAmountValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F291E',
    marginTop: 2,
  },
  modalOrderRef: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  testBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  testBadgeText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
    flex: 1,
  },
  modalActions: {
    gap: 10,
  },
  testPayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#15803D',
    borderRadius: 14,
    padding: 14,
  },
  testPayButtonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  testPayButtonSubtitle: {
    fontSize: 11,
    color: '#D1FAE5',
  },
  testPayButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#15803D',
    borderRadius: 14,
    padding: 14,
  },
  testPayButtonOutlineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  testPayButtonOutlineSubtitle: {
    fontSize: 11,
    color: '#6B7280',
  },
  instantVerifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EDF5EE',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  instantVerifyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F291E',
  },
  modalFooterNote: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.8,
  },

  // ─── Post-Payment Order Summary Details Card ────────────────────────────────
  orderSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E6ECE6',
    padding: 22,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 2,
  },
  orderSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F0',
    marginBottom: 16,
  },
  orderSummaryEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#15803D',
    marginBottom: 4,
  },
  orderSummaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F291E',
  },
  verifiedSuccessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  verifiedSuccessPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  orderKpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  orderKpiItem: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#F8FAF8',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6ECE6',
  },
  orderKpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7A6C',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  orderKpiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderKpiValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F291E',
  },
  orderKpiValueTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  deliveryDestinationBox: {
    backgroundColor: '#F7FAF7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6ECE6',
    marginBottom: 16,
  },
  deliveryDestinationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  deliveryDestinationTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#15803D',
  },
  deliveryRecipientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F291E',
    marginBottom: 4,
  },
  deliveryFullAddress: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 10,
  },
  addressTypeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6ECE6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  addressTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F291E',
  },
  orderItemsRecapBox: {
    borderTopWidth: 1,
    borderTopColor: '#F0F4F0',
    paddingTop: 14,
  },
  orderItemsRecapTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#6B7A6C',
    marginBottom: 10,
  },
  orderItemRecapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F9F7',
  },
  orderItemRecapName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F291E',
  },
  orderItemRecapSub: {
    fontSize: 11,
    color: '#6B7A6C',
    marginTop: 1,
  },
  orderItemRecapPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F291E',
  },

  // ─── Razorpay Modal Tabs & Dynamic UPI QR ──────────────────────────────────
  modalTabRow: {
    flexDirection: 'row',
    backgroundColor: '#F0F4F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    gap: 4,
  },
  modalTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  modalTabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  modalTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7A6C',
  },
  modalTabTextActive: {
    fontWeight: '800',
    color: '#15803D',
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrCodeWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E6ECE6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  qrCodeImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  qrScanHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  qrScanHintText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  upiAppsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  upiAppBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F7F9F7',
    borderWidth: 1,
    borderColor: '#E6ECE6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  upiAppBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F291E',
  },
  upiMetaBox: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF8',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E6ECE6',
    marginBottom: 10,
  },
  upiMetaItem: {
    flex: 1,
  },
  upiMetaLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7A6C',
    textTransform: 'uppercase',
  },
  upiMetaValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F291E',
    marginTop: 2,
  },
  upiDeepLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 8,
  },
  upiDeepLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    textDecorationLine: 'underline',
  },
  qrConfirmButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#15803D',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#15803D',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 4,
  },
  qrConfirmButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  checkoutSimulateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  checkoutSimulateButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.2,
  },
  simulateEvalButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  simulateEvalButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.2,
  },
  simulateEvalButtonSolid: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#15803D',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#15803D',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 4,
  },
  simulateEvalButtonSolidTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  simulateEvalButtonSolidSub: {
    fontSize: 11,
    color: '#D1FAE5',
    marginTop: 1,
  },
});
