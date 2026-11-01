import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { ProductPhoto } from '@/components/ProductPhoto';
import { QuantityStepper } from '@/components/agri-shop/quantity-stepper';
import { ShopColors } from '@/constants/agri-shop-theme';
import type { AgriProduct } from '@/data/agriProducts';
import { useCart } from '@/context/CartContext';
import {
  formatINR,
  formatRating,
  formatReviewCount,
} from '@/utils/format';

interface ProductCardProps {
  product: AgriProduct;
  width: number;
  onOpen: () => void;
  matchScore?: number | null;
  activeDisease?: string | null;
}

export function ProductCard({
  product,
  width,
  onOpen,
  matchScore,
  activeDisease,
}: ProductCardProps) {
  const {
    addItem,
    quantityInCart,
    incrementItem,
    decrementItem,
    removeItem,
  } = useCart();

  const quantity = quantityInCart(product.id);
  const showMatch =
    typeof matchScore === 'number' && matchScore >= 75 && activeDisease;

  const handleAdd = () => {
    if (!product.inStock) return;
    addItem(product, 1);
  };

  const handleQuantityChange = (next: number) => {
    if (next <= 0) {
      removeItem(product.id);
      return;
    }

    if (next > quantity) {
      incrementItem(product.id);
    } else {
      decrementItem(product.id);
    }
  };

  return (
    <View style={[styles.card, { width }]}>
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [
          styles.body,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`View ${product.name}`}
      >
        <ProductPhoto product={product} height={180} />

        <View style={styles.info}>
          {showMatch ? (
            <View style={styles.matchBadge}>
              <Feather name="zap" size={10} color={ShopColors.primaryDark} />
              <Text style={styles.matchText} numberOfLines={1}>
                {matchScore}% match for {activeDisease}
              </Text>
            </View>
          ) : null}

          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.brand}>{product.brand}</Text>

          <View style={styles.ingredientPill}>
            <Feather name="box" size={10} color={ShopColors.muted} />
            <Text style={styles.ingredient} numberOfLines={1}>
              {product.activeIngredients}
            </Text>
          </View>

          <View style={styles.tagRow}>
            <View style={styles.cropTag}>
              <Feather name="map-pin" size={9} color={ShopColors.primaryDark} />
              <Text style={styles.cropTagText} numberOfLines={1}>
                {product.suitableCrops[0]}
              </Text>
            </View>
            <View style={styles.diseaseTag}>
              <Feather name="activity" size={9} color="#8A6414" />
              <Text style={styles.diseaseTagText} numberOfLines={1}>
                {product.targetDiseases[0]}
              </Text>
            </View>
          </View>

          <View style={styles.dosageRow}>
            <Feather
              name="droplet"
              size={12}
              color="#15803D"
              style={styles.dosageIcon}
            />
            <Text style={styles.dosage} numberOfLines={2}>
              {product.dosagePerAcre}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Feather
              name="star"
              size={12}
              color="#D97706"
              style={styles.star}
            />
            <Text style={styles.rating}>{formatRating(product.rating)}</Text>
            <Text style={styles.reviews}>
              ({formatReviewCount(product.reviewsCount)})
            </Text>
            <View style={styles.metaSpacer} />
            <Text style={styles.unit}>{product.unit}</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.footer}>
        <View style={styles.priceBlock}>
          <Text style={styles.price}>{formatINR(product.price)}</Text>
          <Text style={styles.originalPrice}>
            {formatINR(product.originalPrice)}
          </Text>
        </View>

        {quantity > 0 ? (
          <View style={styles.cartBlock}>
            <Text style={styles.cartQuantity}>{quantity} in cart</Text>
            <QuantityStepper
              value={quantity}
              onChange={handleQuantityChange}
              min={0}
              compact
            />
          </View>
        ) : (
          <Pressable
            onPress={handleAdd}
            disabled={!product.inStock}
            style={({ pressed }) => [
              styles.addButton,
              !product.inStock && styles.addButtonDisabled,
              pressed && product.inStock && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              product.inStock
                ? `Add ${product.name} to cart`
                : `${product.name} is out of stock`
            }
          >
            <Feather
              name={product.inStock ? 'shopping-bag' : 'slash'}
              size={12}
              color={product.inStock ? '#FFFFFF' : ShopColors.disabled}
            />
            <Text
              style={[
                styles.addButtonText,
                !product.inStock && styles.addButtonTextDisabled,
              ]}
              numberOfLines={1}
            >
              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ShopColors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ShopColors.border,
    overflow: 'hidden',
  },
  body: {
    paddingBottom: 2,
  },
  info: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  pressed: {
    opacity: 0.78,
  },
  matchBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ShopColors.softGreen,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginBottom: 8,
    maxWidth: '100%',
  },
  matchText: {
    flexShrink: 1,
    fontSize: 9,
    fontWeight: '800',
    color: ShopColors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  name: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: ShopColors.heading,
  },
  brand: {
    fontSize: 13,
    color: ShopColors.muted,
    marginTop: 3,
    fontWeight: '600',
  },
  ingredientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F7F9F7',
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 9,
  },
  ingredient: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
    color: ShopColors.body,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  cropTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: ShopColors.softGreen,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    maxWidth: '58%',
  },
  cropTagText: {
    flexShrink: 1,
    fontSize: 9,
    fontWeight: '700',
    color: ShopColors.primaryDark,
  },
  diseaseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: ShopColors.amber,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    maxWidth: '58%',
  },
  diseaseTagText: {
    flexShrink: 1,
    fontSize: 9,
    fontWeight: '700',
    color: '#8A6414',
  },
  dosageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    backgroundColor: '#F7F9F7',
    borderRadius: 9,
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  dosageIcon: {
    marginTop: 1,
  },
  dosage: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
    color: ShopColors.muted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 9,
    paddingBottom: 10,
  },
  star: {
    marginRight: 1,
  },
  rating: {
    fontSize: 11,
    fontWeight: '800',
    color: ShopColors.heading,
    fontVariant: ['tabular-nums'],
  },
  reviews: {
    fontSize: 10,
    color: ShopColors.soft,
    fontVariant: ['tabular-nums'],
  },
  metaSpacer: {
    flex: 1,
  },
  unit: {
    fontSize: 10,
    fontWeight: '700',
    color: ShopColors.muted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F0',
    marginTop: 2,
  },
  priceBlock: {
    flexShrink: 1,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: ShopColors.heading,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  originalPrice: {
    fontSize: 10,
    color: ShopColors.soft,
    textDecorationLine: 'line-through',
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: ShopColors.primary,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 11,
    minWidth: 102,
  },
  addButtonDisabled: {
    backgroundColor: ShopColors.mint,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  addButtonText: {
    color: ShopColors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  addButtonTextDisabled: {
    color: ShopColors.disabled,
  },
  cartBlock: {
    alignItems: 'flex-end',
    gap: 3,
  },
  cartQuantity: {
    fontSize: 9,
    fontWeight: '800',
    color: ShopColors.primaryDark,
  },
});
