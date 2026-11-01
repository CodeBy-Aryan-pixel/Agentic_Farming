import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { ShopColors } from '@/constants/agri-shop-theme';
import { useCart } from '@/context/CartContext';
import { formatINR } from '@/utils/format';

export function CartFab() {
  const { totalItems, total } = useCart();

  return (
    <View pointerEvents="box-none" style={styles.layer}>
      <Pressable
        onPress={() => router.push('/agri-shop/cart')}
        style={({ pressed }) => [
          styles.fab,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Cart, ${totalItems} items, total ${formatINR(total)}`}
      >
        <View style={styles.iconWrap}>
          <Feather name="shopping-bag" size={18} color="#FFFFFF" />
          {totalItems > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {totalItems > 99 ? '99+' : totalItems}
              </Text>
            </View>
          ) : null}
        </View>

        <View>
          <Text style={styles.label}>
            {totalItems > 0 ? `${totalItems} item${totalItems === 1 ? '' : 's'}` : 'Cart'}
          </Text>
          <Text style={styles.total}>
            {totalItems > 0 ? formatINR(total) : 'View cart'}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: ShopColors.primaryDark,
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#3E8B43',
    elevation: 6,
    shadowColor: '#102A13',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  iconWrap: {
    position: 'relative',
  },
  icon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: ShopColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: ShopColors.primaryDark,
    fontSize: 9,
    fontWeight: '800',
  },
  label: {
    color: '#D9EFD8',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  total: {
    color: ShopColors.white,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  pressed: {
    opacity: 0.85,
  },
});
