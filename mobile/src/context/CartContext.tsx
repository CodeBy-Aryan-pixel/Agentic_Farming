import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';

import { useFarm } from '@/context/FarmContext';
import type { AgriProduct } from '@/data/agriProducts';
import type {
  NormalizedDiagnosis,
  SeverityLevel,
} from '@/utils/recommendationEngine';
import type {
  ActiveDiagnosis,
  CartItem,
  DiagnosisSource,
} from '@/context/FarmContext';

export type { ActiveDiagnosis, CartItem, DiagnosisSource } from '@/context/FarmContext';

export const FREE_DELIVERY_THRESHOLD = 999;
export const DELIVERY_FEE = 49;
export const FARMER_SUBSIDY_RATE = 0.05;
export const BUNDLE_DISCOUNT_RATE = 0.1;

interface CartContextValue {
  items: CartItem[];
  diagnosis: ActiveDiagnosis | null;
  totalItems: number;
  distinctItems: number;
  subtotal: number;
  mrpTotal: number;
  productSavings: number;
  bundleDiscount: number;
  bundleDiscountRate: number;
  farmerSubsidy: number;
  deliveryFee: number;
  total: number;
  quantityInCart: (productId: string) => number;
  addItem: (product: AgriProduct, quantity?: number) => void;
  addBundle: (products: AgriProduct[]) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setDiagnosis: (diagnosis: ActiveDiagnosis | null) => void;
  toggleDiagnosisCureStep: (stepKey: string) => void;
  clearDiagnosis: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function clampQuantity(quantity: number): number {
  return Math.max(1, Math.min(99, Math.floor(quantity) || 1));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const {
    cartItems: items,
    setCartItems: setItems,
    diagnosis,
    setDiagnosis: setDiagnosisState,
    toggleDiagnosisCureStep,
  } = useFarm();

  const addItem = useCallback((product: AgriProduct, quantity = 1) => {
    const safeQuantity = clampQuantity(quantity);

    setItems((current) => {
      const existing = current.find(
        (item) => item.product.id === product.id
      );

      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: clampQuantity(item.quantity + safeQuantity),
              }
            : item
        );
      }

      return [...current, { product, quantity: safeQuantity }];
    });
  }, [setItems]);

  const addBundle = useCallback((products: AgriProduct[]) => {
    const uniqueProducts = Array.from(
      new Map(products.map((product) => [product.id, product])).values()
    );

    setItems((current) => {
      const next = [...current];

      for (const product of uniqueProducts) {
        const index = next.findIndex(
          (item) => item.product.id === product.id
        );

        if (index >= 0) {
          next[index] = {
            ...next[index],
            quantity: clampQuantity(next[index].quantity + 1),
          };
        } else {
          next.push({ product, quantity: 1 });
        }
      }

      return next;
    });
  }, [setItems]);

  const incrementItem = useCallback((productId: string) => {
    setItems((current) =>
      current.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: clampQuantity(item.quantity + 1) }
          : item
      )
    );
  }, [setItems]);

  const decrementItem = useCallback((productId: string) => {
    setItems((current) =>
      current.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  }, [setItems]);

  const removeItem = useCallback((productId: string) => {
    setItems((current) =>
      current.filter((item) => item.product.id !== productId)
    );
  }, [setItems]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, [setItems]);

  const setDiagnosis = useCallback(
    (nextDiagnosis: ActiveDiagnosis | null) => {
      setDiagnosisState(nextDiagnosis);
    },
    [setDiagnosisState]
  );

  const clearDiagnosis = useCallback(() => {
    setDiagnosisState(null);
  }, [setDiagnosisState]);

  const quantityInCart = useCallback(
    (productId: string) =>
      items.find((item) => item.product.id === productId)?.quantity ?? 0,
    [items]
  );

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const mrpTotal = items.reduce(
      (sum, item) => sum + item.product.originalPrice * item.quantity,
      0
    );
    const totalItems = items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const distinctItems = items.length;

    const bundleDiscountRate =
      distinctItems >= 3 ? BUNDLE_DISCOUNT_RATE : 0;
    const bundleDiscount = Math.round(subtotal * bundleDiscountRate);
    const farmerSubsidy = Math.round(subtotal * FARMER_SUBSIDY_RATE);
    const deliveryFee =
      items.length === 0 || subtotal >= FREE_DELIVERY_THRESHOLD
        ? 0
        : DELIVERY_FEE;

    return {
      subtotal,
      mrpTotal,
      totalItems,
      distinctItems,
      bundleDiscount,
      bundleDiscountRate,
      farmerSubsidy,
      deliveryFee,
      total: Math.max(
        0,
        subtotal - bundleDiscount - farmerSubsidy + deliveryFee
      ),
      productSavings: Math.max(0, mrpTotal - subtotal),
    };
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      diagnosis,
      ...totals,
      quantityInCart,
      addItem,
      addBundle,
      incrementItem,
      decrementItem,
      removeItem,
      clearCart,
      setDiagnosis,
      toggleDiagnosisCureStep,
      clearDiagnosis,
    }),
    [
      items,
      diagnosis,
      totals,
      quantityInCart,
      addItem,
      addBundle,
      incrementItem,
      decrementItem,
      removeItem,
      clearCart,
      setDiagnosis,
      toggleDiagnosisCureStep,
      clearDiagnosis,
    ]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider.');
  }

  return context;
}

export function createDiagnosis(
  diagnosis: NormalizedDiagnosis,
  source: DiagnosisSource
): ActiveDiagnosis {
  return {
    ...diagnosis,
    severity: diagnosis.severity as SeverityLevel,
    source,
    scannedAt: new Date().toISOString(),
    checkedCureSteps: [],
  };
}
