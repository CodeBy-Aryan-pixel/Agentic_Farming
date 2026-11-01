import React, { useState } from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { CategoryMeta, ShopColors } from '@/constants/agri-shop-theme';
import type { AgriProduct } from '@/data/agriProducts';

interface ProductPhotoProps {
  product: AgriProduct;
  height?: number;
  compact?: boolean;
  showBadges?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ProductPhoto({
  product,
  height = 180,
  compact = false,
  showBadges = true,
  style,
}: ProductPhotoProps) {
  const [failed, setFailed] = useState(false);
  const meta = CategoryMeta[product.category];
  const discount = Math.max(
    0,
    Math.round((1 - product.price / product.originalPrice) * 100)
  );
  const padding = compact ? 8 : 16;
  const photoHeight = Math.max(0, height - padding * 2);

  return (
    <View
      style={[
        styles.root,
        { height, padding },
        !compact && styles.rootCard,
        style,
      ]}
    >
      {failed ? (
        <View style={styles.fallback}>
          <Feather name="image" size={compact ? 18 : 26} color={ShopColors.soft} />
          {!compact ? (
            <Text style={styles.fallbackText}>Photo unavailable</Text>
          ) : null}
        </View>
      ) : (
        <Image
          source={product.imageSource}
          style={{ width: '100%', height: photoHeight }}
          resizeMode="contain"
          accessibilityLabel={`${product.name} product photo`}
          onError={() => setFailed(true)}
        />
      )}

      {showBadges ? (
        <>
          <View style={[styles.categoryBadge, { backgroundColor: meta.tint }]}>
            <Text style={[styles.categoryText, { color: meta.text }]}>
              {meta.shortLabel}
            </Text>
          </View>

          {discount > 0 ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rootCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F1',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  fallbackText: {
    fontSize: 10,
    fontWeight: '600',
    color: ShopColors.soft,
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '58%',
  },
  categoryText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFF1D6',
    borderWidth: 1,
    borderColor: '#F2D49A',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  discountText: {
    color: '#9A5B06',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
