import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { ShopColors } from '@/constants/agri-shop-theme';
import { useCart } from '@/context/CartContext';
import { safeGoBack } from '@/utils/navigation';

interface ShopTopBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showCart?: boolean;
  onBack?: () => void;
}

export function ShopTopBar({
  title,
  subtitle,
  showBack = true,
  showCart = true,
  onBack,
}: ShopTopBarProps) {
  const { totalItems } = useCart();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    safeGoBack();
  };

  return (
    <View style={styles.bar}>
      {showBack ? (
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Feather name="arrow-left" size={18} color="#0F291E" />
        </Pressable>
      ) : (
        <View style={styles.backSpacer} />
      )}

      <View style={styles.titleBlock}>
        <View style={styles.brandRow}>
          <MaterialCommunityIcons name="sprout" size={14} color="#15803D" style={{ marginRight: 4 }} />
          <Text style={styles.brand}>FUTURE FARMING</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {showCart ? (
        <Pressable
          onPress={() => router.push('/agri-shop/cart')}
          style={({ pressed }) => [
            styles.cartButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Open cart, ${totalItems} items`}
          hitSlop={8}
        >
          <Feather name="shopping-bag" size={18} color="#0F291E" />
          {totalItems > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {totalItems > 99 ? '99+' : totalItems}
              </Text>
            </View>
          ) : null}
        </Pressable>
      ) : (
        <View style={styles.backSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: ShopColors.white,
    borderWidth: 1,
    borderColor: ShopColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: 42,
    height: 42,
  },
  backIcon: {
    fontSize: 30,
    lineHeight: 32,
    color: ShopColors.heading,
    marginTop: -3,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  brand: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: ShopColors.primary,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: ShopColors.heading,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: ShopColors.muted,
    marginTop: 2,
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ShopColors.white,
    borderWidth: 1,
    borderColor: ShopColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: ShopColors.primary,
    borderWidth: 2,
    borderColor: ShopColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: ShopColors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
