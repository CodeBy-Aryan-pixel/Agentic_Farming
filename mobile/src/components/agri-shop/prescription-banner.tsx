import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Feather } from '@expo/vector-icons';

import { ShopColors } from '@/constants/agri-shop-theme';
import type { ActiveDiagnosis } from '@/context/CartContext';
import { useCart } from '@/context/CartContext';
import type { TreatmentBundle } from '@/utils/recommendationEngine';
import { formatINR } from '@/utils/format';

import { DiseasePicker } from './disease-picker';

interface PrescriptionBannerProps {
  diagnosis: ActiveDiagnosis;
  bundle: TreatmentBundle;
  onDiseaseSelect: (disease: string) => void;
  onOpenProduct: (productId: string) => void;
  onClear: () => void;
}

export function PrescriptionBanner({
  diagnosis,
  bundle,
  onDiseaseSelect,
  onOpenProduct,
  onClear,
}: PrescriptionBannerProps) {
  const { addBundle } = useCart();
  const bundleKey = `${bundle.disease}|${bundle.crop}`;
  const [addedBundleKey, setAddedBundleKey] = useState<string | null>(
    null
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const added = addedBundleKey === bundleKey;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleBuyBundle = () => {
    addBundle(bundle.products);
    setAddedBundleKey(bundleKey);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(
      () => setAddedBundleKey(null),
      4000
    );
  };

  const severityTone =
    bundle.severity === 'High'
      ? { backgroundColor: '#FBE7D8', color: '#93411A' }
      : bundle.severity === 'Low'
        ? { backgroundColor: '#E4F3E3', color: '#25652A' }
        : { backgroundColor: '#FFF3D6', color: '#7A5B12' };

  return (
    <View style={styles.banner}>
      <View style={styles.top}>
        <View style={styles.circleOne} />
        <View style={styles.circleTwo} />

        <View style={styles.topBar}>
          <View style={styles.aiPill}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Feather name="shield" size={11} color={ShopColors.primaryDark} />
              <Text style={styles.aiPillText}>CROP DOCTOR AI PRESCRIPTION</Text>
            </View>
          </View>

          <Pressable
            onPress={onClear}
            style={({ pressed }) => [
              styles.dismissButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Dismiss AI prescription"
          >
            <Feather name="x" size={16} color="rgba(255, 255, 255, 0.85)" />
          </Pressable>
        </View>

        <Text style={styles.detectedLabel}>DETECTED DISEASE</Text>
        <Text style={styles.disease}>{bundle.disease}</Text>

        <View style={styles.metaRow}>
          <View
            style={[
              styles.severityPill,
              { backgroundColor: severityTone.backgroundColor },
            ]}
          >
            <Text
              style={[styles.severityText, { color: severityTone.color }]}
            >
              {bundle.severity} severity
            </Text>
          </View>

          <Text style={styles.cropText}>
            on {bundle.crop}
            {typeof diagnosis.confidence === 'number'
              ? ` · ${Math.round(diagnosis.confidence * 100)}% confidence`
              : ''}
          </Text>
        </View>

        <Text style={styles.summary}>{bundle.profile.summary}</Text>

        <DiseasePicker
          value={bundle.disease}
          onSelect={onDiseaseSelect}
          label="Switch disease"
          tone="dark"
          compact
        />
      </View>

      <View style={styles.body}>
        <View style={styles.bundleHeader}>
          <Text style={styles.bundleTitle}>Recommended treatment bundle</Text>
          <Text style={styles.bundleCaption}>3-step programme</Text>
        </View>

        <View style={styles.slotGrid}>
          {bundle.slots.map((slot, index) => (
            <Pressable
              key={slot.role}
              onPress={() => onOpenProduct(slot.product.id)}
              style={({ pressed }) => [
                styles.slot,
                pressed && styles.slotPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${slot.label}: ${slot.product.name}, ${formatINR(slot.product.price)}`}
            >
              <View style={styles.slotTop}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.slotLabel}>{slot.label}</Text>
              </View>

              <Text style={styles.slotName} numberOfLines={2}>
                {slot.product.name}
              </Text>
              <Text style={styles.slotMeta} numberOfLines={1}>
                {slot.product.brand} · {slot.product.unit}
              </Text>

              <View style={styles.slotFooter}>
                <Text style={styles.slotPrice}>
                  {formatINR(slot.product.price)}
                </Text>
                <Text style={styles.slotChevron}>›</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.bundleTotalRow}>
          <View>
            <Text style={styles.bundleTotalLabel}>Complete bundle</Text>
            <Text style={styles.bundleTotalNote}>
              Covers 1 acre at labelled dosage
            </Text>
          </View>

          <View style={styles.bundlePriceBlock}>
            <Text style={styles.bundleOriginal}>
              {formatINR(bundle.totalOriginalPrice)}
            </Text>
            <Text style={styles.bundleTotalPrice}>
              {formatINR(bundle.totalPrice)}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleBuyBundle}
          style={({ pressed }) => [
            styles.buyButton,
            added && styles.buyButtonAdded,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Buy complete treatment bundle for ${formatINR(bundle.totalPrice)}`}
        >
          <Text style={styles.buyButtonText}>
            {added
              ? 'Treatment bundle added to cart'
              : `Buy Complete Treatment Bundle · ${formatINR(bundle.totalPrice)}`}
          </Text>
        </Pressable>

        {added ? (
          <Pressable
            onPress={() => router.push('/agri-shop/cart')}
            style={({ pressed }) => [
              styles.viewCartLink,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.viewCartText}>View cart & checkout →</Text>
          </Pressable>
        ) : null}

        <Text style={styles.disclaimer}>
          AI guidance is a starting point. Follow the product label and consult
          your local agronomist before mixing or spraying chemicals.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: ShopColors.primary,
    overflow: 'hidden',
    backgroundColor: ShopColors.white,
  },
  top: {
    backgroundColor: ShopColors.primaryDark,
    padding: 20,
    overflow: 'hidden',
  },
  circleOne: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -80,
    right: -40,
  },
  circleTwo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -50,
    left: -20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  aiPill: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 11,
    flexShrink: 1,
  },
  aiPillText: {
    color: '#E8F5E6',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dismissButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: '#E8F5E6',
    fontSize: 12,
    fontWeight: '700',
  },
  detectedLabel: {
    color: '#BFE3BD',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginTop: 18,
  },
  disease: {
    color: ShopColors.white,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flexWrap: 'wrap',
    marginTop: 9,
  },
  severityPill: {
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  severityText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  cropText: {
    color: '#D7EED5',
    fontSize: 11,
    fontWeight: '600',
  },
  summary: {
    color: '#D7EED5',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 12,
    marginBottom: 16,
    maxWidth: 680,
  },
  body: {
    padding: 20,
  },
  bundleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 13,
  },
  bundleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: ShopColors.heading,
    letterSpacing: -0.2,
  },
  bundleCaption: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: ShopColors.primary,
    textTransform: 'uppercase',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  slot: {
    flexGrow: 1,
    flexBasis: 170,
    minWidth: 170,
    backgroundColor: '#F8FBF6',
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 14,
    padding: 13,
  },
  slotPressed: {
    opacity: 0.72,
  },
  slotTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 9,
  },
  stepBadge: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: ShopColors.softGreen,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 9,
    fontWeight: '800',
    color: ShopColors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  slotLabel: {
    flex: 1,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: ShopColors.primary,
    textTransform: 'uppercase',
  },
  slotName: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    color: ShopColors.heading,
  },
  slotMeta: {
    fontSize: 10,
    color: ShopColors.muted,
    marginTop: 3,
  },
  slotFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 11,
  },
  slotPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: ShopColors.heading,
    fontVariant: ['tabular-nums'],
  },
  slotChevron: {
    fontSize: 18,
    color: ShopColors.primary,
  },
  bundleTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: ShopColors.border,
    marginTop: 16,
    paddingTop: 14,
  },
  bundleTotalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: ShopColors.heading,
  },
  bundleTotalNote: {
    fontSize: 10,
    color: ShopColors.soft,
    marginTop: 2,
  },
  bundlePriceBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 7,
  },
  bundleOriginal: {
    fontSize: 11,
    color: ShopColors.soft,
    textDecorationLine: 'line-through',
  },
  bundleTotalPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: ShopColors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  buyButton: {
    backgroundColor: ShopColors.primary,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 13,
  },
  buyButtonAdded: {
    backgroundColor: ShopColors.success,
  },
  buyButtonText: {
    color: ShopColors.white,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  viewCartLink: {
    alignSelf: 'center',
    paddingVertical: 10,
  },
  viewCartText: {
    fontSize: 12,
    fontWeight: '800',
    color: ShopColors.primaryDark,
  },
  disclaimer: {
    fontSize: 9,
    lineHeight: 14,
    color: ShopColors.soft,
    marginTop: 10,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
