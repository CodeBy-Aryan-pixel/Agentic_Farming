import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { ProductPhoto } from '@/components/ProductPhoto';
import {
  CategoryMeta,
  ShopColors,
} from '@/constants/agri-shop-theme';
import {
  getAssistantCardCopy,
  getCropLabel,
  getDiseaseLabel,
  getProductCategoryLabel,
  localize,
  type AssistantLanguage,
} from '@/constants/assistant-i18n';
import type { AgriProduct } from '@/data/agriProducts';
import { formatINR } from '@/utils/format';
import { agriShopRoute } from '@/utils/navigation';

interface AssistantProductCardProps {
  product: AgriProduct;
  language: AssistantLanguage;
  disease?: string;
  crop?: string;
}

export function AssistantProductCard({
  product,
  language,
  disease,
  crop,
}: AssistantProductCardProps) {
  const meta = CategoryMeta[product.category];
  const copy = getAssistantCardCopy(language);
  const categoryLabel = getProductCategoryLabel(
    language,
    product.category
  );
  const diseaseLabel = disease
    ? getDiseaseLabel(language, disease)
    : null;
  const cropLabel = crop ? getCropLabel(language, crop) : null;
  const context = diseaseLabel
    ? cropLabel
      ? localize(language, {
          en: `${diseaseLabel} on ${cropLabel}`,
          hi: `${cropLabel} में ${diseaseLabel}`,
          mr: `${cropLabel} वरील ${diseaseLabel}`,
        })
      : diseaseLabel
    : cropLabel;

  const openInShop = () => {
    router.push(
      agriShopRoute({
        disease,
        crop,
      })
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.thumb}>
          <ProductPhoto
            product={product}
            height={100}
            compact
            showBadges={false}
          />
        </View>

        <View style={styles.identity}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: meta.tint },
            ]}
          >
            <Text
              style={[styles.categoryText, { color: meta.text }]}
            >
              {categoryLabel}
            </Text>
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.brand}>
            {product.brand} · {product.unit}
          </Text>
        </View>

        <View style={styles.priceBlock}>
          <Text style={styles.price}>{formatINR(product.price)}</Text>
          <Text style={styles.originalPrice}>
            {formatINR(product.originalPrice)}
          </Text>
        </View>
      </View>

      {context ? (
        <View style={styles.contextPill}>
          <Text style={styles.contextText} numberOfLines={1}>
            {copy.product.recommendedFor(context)}
          </Text>
        </View>
      ) : null}

      <View style={styles.dosageRow}>
        <Feather name="droplet" size={14} color="#15803D" style={{ marginRight: 6, marginTop: 2 }} />
        <View style={styles.dosageBody}>
          <Text style={styles.dosageLabel}>
            {copy.product.dosagePerAcre}
          </Text>
          <Text style={styles.dosageText}>{product.dosagePerAcre}</Text>
        </View>
      </View>

      <Pressable
        onPress={openInShop}
        style={({ pressed }) => [
          styles.shopButton,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={copy.product.buyAccessibility(product.name)}
      >
        <Text style={styles.shopButtonText}>{copy.product.buy}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: ShopColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ShopColors.border,
    padding: 15,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  thumb: {
    width: 76,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ShopColors.border,
    overflow: 'hidden',
  },
  identity: {
    flex: 1,
    minWidth: 0,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  name: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
    color: ShopColors.heading,
    marginTop: 5,
  },
  brand: {
    fontSize: 9,
    color: ShopColors.muted,
    marginTop: 3,
  },
  priceBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: ShopColors.heading,
    letterSpacing: -0.3,
  },
  originalPrice: {
    fontSize: 9,
    color: ShopColors.soft,
    textDecorationLine: 'line-through',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  contextPill: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: ShopColors.mint,
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 10,
  },
  contextText: {
    color: ShopColors.primaryDark,
    fontSize: 9,
    fontWeight: '700',
  },
  dosageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: '#FAFCF8',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
  },
  dosageIcon: {
    fontSize: 11,
    marginTop: 1,
  },
  dosageBody: {
    flex: 1,
    minWidth: 0,
  },
  dosageLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: ShopColors.soft,
  },
  dosageText: {
    fontSize: 10,
    lineHeight: 15,
    color: ShopColors.body,
    marginTop: 2,
  },
  shopButton: {
    backgroundColor: ShopColors.primary,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 11,
  },
  shopButtonText: {
    color: ShopColors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
});
