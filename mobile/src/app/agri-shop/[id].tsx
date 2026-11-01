import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { AcreageSlider } from '@/components/agri-shop/acreage-slider';
import { QuantityStepper } from '@/components/agri-shop/quantity-stepper';
import { ProductPhoto } from '@/components/ProductPhoto';
import { UnifiedPageShell } from '@/components/UnifiedPageShell';
import {
  CategoryMeta,
  ShopColors,
  ShopLayout,
} from '@/constants/agri-shop-theme';
import { getProductById } from '@/data/agriProducts';
import { useCart } from '@/context/CartContext';
import {
  canonicalizeDisease,
  findTreatmentRole,
  getDiseaseProfile,
  getProductMatchScore,
  getRoleLabel,
  normalizeCrop,
  normalizeSeverity,
} from '@/utils/recommendationEngine';
import {
  formatAcres,
  formatINR,
  formatRating,
  formatReviewCount,
} from '@/utils/format';
import {
  AGRI_SHOP_ROUTE,
  safeGoBack,
} from '@/utils/navigation';

const MAX_ACRES = 20;

function clampAcres(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0.5, Math.min(MAX_ACRES, Math.round(value * 10) / 10));
}

export default function ProductDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    disease?: string;
    crop?: string;
    severity?: string;
  }>();

  const { width } = useWindowDimensions();
  const { diagnosis, addItem } = useCart();

  const productId = typeof params.id === 'string' ? params.id : '';
  const product = getProductById(productId);

  const [acres, setAcres] = useState(1);
  const [acresText, setAcresText] = useState('1');
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const activeDisease =
    canonicalizeDisease(
      typeof params.disease === 'string' ? params.disease : null
    ) ??
    (diagnosis ? canonicalizeDisease(diagnosis.disease) : null) ??
    null;

  const profile = activeDisease
    ? getDiseaseProfile(activeDisease)
    : undefined;

  const activeCrop =
    normalizeCrop(typeof params.crop === 'string' ? params.crop : null) ??
    normalizeCrop(diagnosis?.crop) ??
    profile?.defaultCrop ??
    null;

  const matchScore = product
    ? getProductMatchScore(product, activeDisease, activeCrop)
    : null;

  const role = product
    ? findTreatmentRole(product.id, activeDisease)
    : undefined;

  const meta = product ? CategoryMeta[product.category] : null;

  const packCoverage =
    product && product.packCoverageAcres > 0
      ? product.packCoverageAcres
      : 1;
  const requiredPacks = Math.max(
    1,
    Math.ceil(acres / packCoverage)
  );

  const estimatedCost = (product?.price ?? 0) * requiredPacks;

  const showFeedback = (message: string) => {
    setFeedback(message);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2600);
  };

  const handleAcresChange = (value: number) => {
    const next = clampAcres(value);
    setAcres(next);
    setAcresText(formatAcres(next));
  };

  const handleAcresText = (text: string) => {
    setAcresText(text);

    const parsed = Number.parseFloat(text.replace(',', '.'));
    if (Number.isFinite(parsed) && parsed > 0) {
      setAcres(clampAcres(parsed));
    }
  };

  const commitAcresText = () => {
    const parsed = Number.parseFloat(acresText.replace(',', '.'));
    const next = clampAcres(parsed);
    setAcres(next);
    setAcresText(formatAcres(next));
  };

  const safeWidth = width > 0 ? width : 1024;
  const isWide = safeWidth >= 960;

  if (!product || !meta) {
    return (
      <UnifiedPageShell
        activeRoute="/agri-shop"
        title="Product Details"
        subtitle="Catalog & Purchase"
        statusPillText="Verified Inputs"
        onBack={() => safeGoBack(AGRI_SHOP_ROUTE)}
      >
        <View style={styles.notFoundCard}>
          <View style={styles.notFoundIconBox}>
            <Feather name="alert-circle" size={32} color="#15803D" />
          </View>
          <Text style={styles.notFoundTitle}>Product not found</Text>
          <Text style={styles.notFoundText}>
            This product may have been removed from the Agri-Shop catalog.
          </Text>
          <Pressable
            onPress={() => router.replace(AGRI_SHOP_ROUTE)}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>
              Back to Agri-Shop
            </Text>
          </Pressable>
        </View>
      </UnifiedPageShell>
    );
  }

  const activeDiagnosis = diagnosis;
  const activeSeverity = activeDisease
    ? normalizeSeverity(
        typeof params.severity === 'string'
          ? params.severity
          : activeDiagnosis?.severity ?? profile?.defaultSeverity
      )
    : null;

  const handleAddToCart = () => {
    addItem(product, quantity);
    showFeedback(
      `${quantity} × ${product.name} added to your cart.`
    );
  };

  const handleAddCalculated = () => {
    addItem(product, requiredPacks);
    showFeedback(
      `${requiredPacks} pack${requiredPacks === 1 ? '' : 's'} for ${formatAcres(acres)} acre${acres === 1 ? '' : 's'} added to your cart.`
    );
  };

  return (
    <UnifiedPageShell
      activeRoute="/agri-shop"
      title="Agri-Shop"
      subtitle={product.name}
      statusPillText="Verified Inputs"
      onBack={() => safeGoBack(AGRI_SHOP_ROUTE)}
      scrollable={true}
    >
      <View style={styles.contentInner}>

          <View
            style={[
              styles.columns,
              isWide ? styles.columnsWide : styles.columnsMobileReverse,
            ]}
          >
            <View style={styles.leftColumn}>
              <View style={styles.visualCard}>
                <ProductPhoto
                  product={product}
                  height={218}
                  showBadges={false}
                />

                <View style={styles.visualBody}>
                  <View style={styles.visualBadgeRow}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: meta.tint },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryBadgeText,
                          { color: meta.text },
                        ]}
                      >
                        {product.category}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.stockBadge,
                        !product.inStock && styles.stockBadgeOut,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stockBadgeText,
                          !product.inStock && styles.stockBadgeTextOut,
                        ]}
                      >
                        {product.inStock ? 'In stock' : 'Out of stock'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productBrand}>
                    by {product.brand} · {product.unit}
                  </Text>

                  <View style={styles.ratingRow}>
                    <Feather
                      name="star"
                      size={13}
                      color="#D97706"
                      style={{ marginRight: 3 }}
                    />
                    <Text style={styles.rating}>
                      {formatRating(product.rating)}
                    </Text>
                    <Text style={styles.reviews}>
                      {formatReviewCount(product.reviewsCount)} reviews
                    </Text>
                  </View>
                </View>
              </View>

              {activeDisease && matchScore !== null ? (
                <View style={styles.aiMatchCard}>
                  <View style={styles.aiMatchIcon}>
                    <Feather name="zap" size={14} color="#15803D" />
                  </View>
                  <View style={styles.aiMatchBody}>
                    <Text style={styles.aiMatchEyebrow}>
                      CROP DOCTOR MATCH
                    </Text>
                    <Text style={styles.aiMatchTitle}>
                      {matchScore}% match for {activeDisease}
                      {activeCrop ? ` on ${activeCrop}` : ''}
                    </Text>
                    <Text style={styles.aiMatchText}>
                      {role
                        ? `Included as the ${getRoleLabel(role).toLowerCase()} in your AI treatment bundle.`
                        : 'This product is relevant to your current diagnosis. Compare it with the full AI prescription in Agri-Shop.'}
                    </Text>
                    {role ? (
                      <View style={styles.rolePill}>
                        <Text style={styles.rolePillText}>
                          {getRoleLabel(role)} · {activeSeverity} severity
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}

              <View style={styles.card}>
                <Text style={styles.cardEyebrow}>PRODUCT OVERVIEW</Text>
                <Text style={styles.cardTitle}>About this input</Text>
                <Text style={styles.description}>{product.description}</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Active ingredient</Text>
                  <Text style={styles.infoValue}>
                    {product.activeIngredients}
                  </Text>
                </View>

                <View style={styles.chipSection}>
                  <Text style={styles.chipLabel}>Targeted diseases</Text>
                  <View style={styles.chipRow}>
                    {product.targetDiseases.map((disease) => (
                      <View key={disease} style={styles.diseaseChip}>
                        <Text style={styles.diseaseChipText}>
                          {disease}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.chipSection}>
                  <Text style={styles.chipLabel}>Suitable crops</Text>
                  <View style={styles.chipRow}>
                    {product.suitableCrops.map((crop) => (
                      <View key={crop} style={styles.cropChip}>
                        <Text style={styles.cropChipText}>{crop}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.calculatorCard}>
                <View style={styles.calculatorHeader}>
                  <View style={styles.calculatorTitleBlock}>
                    <Text style={styles.calculatorEyebrow}>
                      DOSAGE CALCULATOR
                    </Text>
                    <Text style={styles.calculatorTitle}>
                      How much do you need?
                    </Text>
                  </View>
                  <View style={styles.perAcrePill}>
                    <Text style={styles.perAcreText}>Per acre</Text>
                  </View>
                </View>

                <Text style={styles.calculatorDescription}>
                  Enter your farm size and we will calculate the exact number
                  of retail packs required at the labelled dosage.
                </Text>

                <View style={styles.acreControls}>
                  <Pressable
                    onPress={() => handleAcresChange(acres - 0.5)}
                    style={({ pressed }) => [
                      styles.acreStepButton,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease acreage"
                  >
                    <Text style={styles.acreStepText}>−</Text>
                  </Pressable>

                  <View style={styles.acreInputWrap}>
                    <TextInput
                      value={acresText}
                      onChangeText={handleAcresText}
                      onBlur={commitAcresText}
                      keyboardType="decimal-pad"
                      style={styles.acreInput}
                      maxLength={4}
                      accessibilityLabel="Farm size in acres"
                    />
                    <Text style={styles.acreUnit}>acres</Text>
                  </View>

                  <Pressable
                    onPress={() => handleAcresChange(acres + 0.5)}
                    style={({ pressed }) => [
                      styles.acreStepButton,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Increase acreage"
                  >
                    <Text style={styles.acreStepText}>+</Text>
                  </Pressable>
                </View>

                <View style={styles.presetRow}>
                  {[1, 2, 5, 10].map((preset) => (
                    <Pressable
                      key={preset}
                      onPress={() => handleAcresChange(preset)}
                      style={({ pressed }) => [
                        styles.presetChip,
                        acres === preset && styles.presetChipActive,
                        pressed && styles.pressed,
                      ]}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.presetText,
                          acres === preset && styles.presetTextActive,
                        ]}
                      >
                        {preset} acre{preset === 1 ? '' : 's'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <AcreageSlider
                  value={Math.min(acres, MAX_ACRES)}
                  onChange={handleAcresChange}
                  min={1}
                  max={MAX_ACRES}
                  step={1}
                />

                <View style={styles.calculatorResult}>
                  <View style={styles.calculatorResultBody}>
                    <Text style={styles.resultLabel}>You need</Text>
                    <Text style={styles.resultValue}>
                      {requiredPacks} pack{requiredPacks === 1 ? '' : 's'}
                    </Text>
                    <Text style={styles.resultNote}>
                      ≈ {requiredPacks} × {product.unit} for{' '}
                      {formatAcres(acres)} acre
                      {acres === 1 ? '' : 's'}
                    </Text>
                  </View>

                  <View style={styles.resultCostBlock}>
                    <Text style={styles.resultCostLabel}>Estimated cost</Text>
                    <Text style={styles.resultCost}>
                      {formatINR(estimatedCost)}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={handleAddCalculated}
                  disabled={!product.inStock}
                  style={({ pressed }) => [
                    styles.calculateAddButton,
                    !product.inStock && styles.disabledButton,
                    pressed && product.inStock && styles.pressed,
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={styles.calculateAddText}>
                    {product.inStock
                      ? `Add ${requiredPacks} pack${requiredPacks === 1 ? '' : 's'} to cart`
                      : 'Currently out of stock'}
                  </Text>
                </Pressable>

                <Text style={styles.calculatorFootnote}>
                  Based on label dosage: {product.dosagePerAcre}. Always
                  confirm with your local agronomist.
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardEyebrow}>APPLICATION GUIDE</Text>
                <Text style={styles.cardTitle}>How to apply</Text>

                <View style={styles.guideRow}>
                  <View style={styles.guideIcon}>
                    <Feather name="droplet" size={16} color="#15803D" />
                  </View>
                  <View style={styles.guideBody}>
                    <Text style={styles.guideLabel}>Dosage per acre</Text>
                    <Text style={styles.guideValue}>
                      {product.dosagePerAcre}
                    </Text>
                  </View>
                </View>

                <View style={styles.guideRow}>
                  <View style={styles.guideIcon}>
                    <Feather name="user-check" size={16} color="#15803D" />
                  </View>
                  <View style={styles.guideBody}>
                    <Text style={styles.guideLabel}>Application method</Text>
                    <Text style={styles.guideValue}>
                      {product.applicationMethod}
                    </Text>
                  </View>
                </View>

                <View style={styles.guideRow}>
                  <View style={styles.guideIcon}>
                    <Feather name="package" size={16} color="#15803D" />
                  </View>
                  <View style={styles.guideBody}>
                    <Text style={styles.guideLabel}>Pack coverage</Text>
                    <Text style={styles.guideValue}>
                       {product.packCoverageAcres} acre
                      {product.packCoverageAcres === 1 ? '' : 's'} per{' '}
                      {product.unit} pack
                    </Text>
                  </View>
                </View>

                <View style={styles.warningBox}>
                  <View style={styles.warningHeader}>
                    <Feather
                      name="alert-triangle"
                      size={15}
                      color="#D97706"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.warningTitle}>
                      Weather & safety warning
                    </Text>
                  </View>
                  <Text style={styles.warningText}>
                    {product.weatherAdvisory}
                  </Text>
                  <Text style={styles.warningText}>
                    Wear gloves, a mask, and protective clothing while mixing
                    and spraying. Keep away from children and livestock. Observe
                    the label pre-harvest interval.
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.purchaseColumn,
                isWide && styles.purchaseColumnWide,
              ]}
            >
              <View style={styles.purchaseCard}>
                <Text style={styles.purchaseEyebrow}>YOUR PRICE</Text>

                <View style={styles.priceRow}>
                  <Text style={styles.purchasePrice}>
                    {formatINR(product.price)}
                  </Text>
                  <Text style={styles.purchaseOriginal}>
                    {formatINR(product.originalPrice)}
                  </Text>
                </View>

                <Text style={styles.purchaseUnit}>
                  {product.unit} · incl. all taxes
                </Text>

                <View style={styles.savingsPill}>
                  <Text style={styles.savingsText}>
                    You save{' '}
                    {formatINR(
                      product.originalPrice - product.price
                    )}{' '}
                    on this pack
                  </Text>
                </View>

                <View style={styles.purchaseDivider} />

                <View style={styles.quantityRow}>
                  <View>
                    <Text style={styles.quantityLabel}>Pack quantity</Text>
                    <Text style={styles.quantityHint}>
                      Each pack: {product.unit}
                    </Text>
                  </View>
                  <QuantityStepper
                    value={quantity}
                    onChange={setQuantity}
                    compact
                  />
                </View>

                <Pressable
                  onPress={handleAddToCart}
                  disabled={!product.inStock}
                  style={({ pressed }) => [
                    styles.addToCartButton,
                    !product.inStock && styles.disabledButton,
                    pressed && product.inStock && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${quantity} packs of ${product.name} to cart`}
                >
                  <Text style={styles.addToCartText}>
                    {product.inStock
                      ? `Add to Cart · ${formatINR(
                          product.price * quantity
                        )}`
                      : 'Out of stock'}
                  </Text>
                </Pressable>

                {feedback ? (
                  <View style={styles.feedbackBox}>
                    <Feather name="check" size={14} color="#15803D" style={{ marginRight: 6 }} />
                    <Text style={styles.feedbackText}>{feedback}</Text>
                  </View>
                ) : null}

                <View style={styles.deliveryInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="truck" size={14} color="#15803D" />
                    <Text style={styles.deliveryLine}>
                      Free delivery on orders over {formatINR(999)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Feather name="check-circle" size={14} color="#15803D" />
                    <Text style={styles.deliveryLine}>
                      100% genuine, batch-verified inputs
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Feather name="refresh-cw" size={14} color="#15803D" />
                    <Text style={styles.deliveryLine}>
                      Easy replacement for damaged packs
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.consultCard}>
                <View style={styles.consultIconWrap}>
                  <Feather name="help-circle" size={18} color="#15803D" />
                </View>
                <View style={styles.consultBody}>
                  <Text style={styles.consultTitle}>
                    Not sure about dosage?
                  </Text>
                  <Text style={styles.consultText}>
                    Start with the AI prescription, then confirm the spray
                    schedule with your local agronomist.
                  </Text>
                  <Pressable
                    onPress={() => router.push('/crop-doctor')}
                    style={({ pressed }) => [
                      styles.consultLink,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.consultLinkText}>
                      Open Crop Doctor →
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>
      </UnifiedPageShell>
    );
  }

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ShopColors.background,
  },
  screen: {
    flex: 1,
  },
  content: {
    paddingTop: 14,
    paddingBottom: 40,
  },
  contentInner: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
  },
  columns: {
    gap: 18,
  },
  columnsWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  columnsMobileReverse: {
    flexDirection: 'column-reverse',
  },
  leftColumn: {
    flex: 1,
    minWidth: 0,
    gap: 18,
  },
  purchaseColumn: {
    width: '100%',
    gap: 14,
  },
  purchaseColumnWide: {
    width: 340,
    flexShrink: 0,
  },
  visualCard: {
    backgroundColor: ShopColors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ShopColors.border,
    overflow: 'hidden',
  },
  visualBody: {
    flex: 1,
    minWidth: 0,
    padding: 18,
  },
  visualBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  categoryBadge: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  stockBadge: {
    backgroundColor: ShopColors.softGreen,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  stockBadgeOut: {
    backgroundColor: ShopColors.dangerSoft,
  },
  stockBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: ShopColors.success,
  },
  stockBadgeTextOut: {
    color: ShopColors.danger,
  },
  productName: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: ShopColors.heading,
    marginTop: 9,
  },
  productBrand: {
    fontSize: 12,
    color: ShopColors.muted,
    marginTop: 5,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  star: {
    fontSize: 14,
    color: ShopColors.star,
  },
  rating: {
    fontSize: 12,
    fontWeight: '800',
    color: ShopColors.heading,
    fontVariant: ['tabular-nums'],
  },
  reviews: {
    fontSize: 11,
    color: ShopColors.soft,
    marginLeft: 3,
  },
  aiMatchCard: {
    backgroundColor: ShopColors.primaryDark,
    borderRadius: 18,
    padding: 17,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  aiMatchIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiMatchIconText: {
    color: ShopColors.white,
    fontSize: 18,
  },
  aiMatchBody: {
    flex: 1,
    minWidth: 0,
  },
  aiMatchEyebrow: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#BFE3BD',
  },
  aiMatchTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: ShopColors.white,
    marginTop: 4,
  },
  aiMatchText: {
    fontSize: 11,
    lineHeight: 17,
    color: '#D7EED5',
    marginTop: 4,
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 9,
    marginTop: 8,
  },
  rolePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: ShopColors.white,
  },
  card: {
    backgroundColor: ShopColors.white,
    borderRadius: ShopLayout.radiusLarge,
    borderWidth: 1,
    borderColor: ShopColors.border,
    padding: 24,
  },
  cardEyebrow: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: ShopColors.primary,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: ShopColors.heading,
    marginTop: 4,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 12,
    lineHeight: 19,
    color: ShopColors.body,
    marginTop: 9,
  },
  infoRow: {
    borderTopWidth: 1,
    borderTopColor: ShopColors.border,
    paddingTop: 13,
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ShopColors.muted,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '700',
    color: ShopColors.heading,
  },
  chipSection: {
    marginTop: 15,
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: ShopColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 7,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  diseaseChip: {
    backgroundColor: ShopColors.softGreen,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    borderRadius: 9,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  diseaseChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: ShopColors.primaryDark,
  },
  cropChip: {
    backgroundColor: ShopColors.mint,
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 9,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  cropChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: ShopColors.body,
  },
  calculatorCard: {
    backgroundColor: '#EDF6EA',
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    borderRadius: 24,
    padding: 24,
  },
  calculatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  calculatorTitleBlock: {
    flex: 1,
  },
  calculatorEyebrow: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: ShopColors.primary,
  },
  calculatorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: ShopColors.heading,
    marginTop: 4,
    letterSpacing: -0.3,
  },
  perAcrePill: {
    backgroundColor: ShopColors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  perAcreText: {
    fontSize: 9,
    fontWeight: '800',
    color: ShopColors.primaryDark,
  },
  calculatorDescription: {
    fontSize: 11,
    lineHeight: 17,
    color: ShopColors.body,
    marginTop: 8,
  },
  acreControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 17,
  },
  acreStepButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: ShopColors.white,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acreStepText: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '700',
    color: ShopColors.primaryDark,
  },
  acreInputWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: ShopColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 130,
  },
  acreInput: {
    fontSize: 24,
    fontWeight: '800',
    color: ShopColors.heading,
    minWidth: 46,
    textAlign: 'center',
    padding: 0,
    fontVariant: ['tabular-nums'],
  },
  acreUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: ShopColors.muted,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 12,
  },
  presetChip: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  presetChipActive: {
    backgroundColor: ShopColors.primary,
    borderColor: ShopColors.primary,
  },
  presetText: {
    fontSize: 9,
    fontWeight: '700',
    color: ShopColors.body,
  },
  presetTextActive: {
    color: ShopColors.white,
  },
  calculatorResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: ShopColors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    padding: 14,
    marginTop: 12,
  },
  calculatorResultBody: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: ShopColors.muted,
    textTransform: 'uppercase',
  },
  resultValue: {
    fontSize: 21,
    fontWeight: '800',
    color: ShopColors.heading,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  resultNote: {
    fontSize: 10,
    color: ShopColors.muted,
    marginTop: 2,
  },
  resultCostBlock: {
    alignItems: 'flex-end',
  },
  resultCostLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: ShopColors.muted,
  },
  resultCost: {
    fontSize: 20,
    fontWeight: '800',
    color: ShopColors.primaryDark,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  calculateAddButton: {
    backgroundColor: ShopColors.primaryDark,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  calculateAddText: {
    color: ShopColors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  calculatorFootnote: {
    fontSize: 9,
    lineHeight: 14,
    color: ShopColors.muted,
    marginTop: 9,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    marginTop: 14,
  },
  guideIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: ShopColors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideIconText: {
    fontSize: 16,
  },
  guideBody: {
    flex: 1,
    minWidth: 0,
  },
  guideLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: ShopColors.muted,
    textTransform: 'uppercase',
  },
  guideValue: {
    fontSize: 12,
    lineHeight: 18,
    color: ShopColors.body,
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  warningBox: {
    backgroundColor: ShopColors.amber,
    borderWidth: 1,
    borderColor: ShopColors.amberBorder,
    borderRadius: 13,
    padding: 14,
    marginTop: 18,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 6,
  },
  warningIcon: {
    fontSize: 14,
  },
  warningTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: ShopColors.amberText,
  },
  warningText: {
    fontSize: 11,
    lineHeight: 17,
    color: ShopColors.amberText,
    marginTop: 3,
  },
  purchaseCard: {
    backgroundColor: ShopColors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ShopColors.border,
    padding: 24,
  },
  purchaseEyebrow: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: ShopColors.primary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 5,
  },
  purchasePrice: {
    fontSize: 34,
    fontWeight: '800',
    color: ShopColors.heading,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  purchaseOriginal: {
    fontSize: 13,
    color: ShopColors.soft,
    textDecorationLine: 'line-through',
    fontVariant: ['tabular-nums'],
  },
  purchaseUnit: {
    fontSize: 11,
    color: ShopColors.muted,
    marginTop: 2,
  },
  savingsPill: {
    alignSelf: 'flex-start',
    backgroundColor: ShopColors.softGreen,
    borderRadius: 9,
    paddingVertical: 5,
    paddingHorizontal: 9,
    marginTop: 10,
  },
  savingsText: {
    fontSize: 9,
    fontWeight: '800',
    color: ShopColors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  purchaseDivider: {
    height: 1,
    backgroundColor: ShopColors.border,
    marginVertical: 15,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  quantityLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: ShopColors.heading,
  },
  quantityHint: {
    fontSize: 9,
    color: ShopColors.soft,
    marginTop: 2,
  },
  addToCartButton: {
    backgroundColor: ShopColors.primary,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  addToCartText: {
    color: ShopColors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  disabledButton: {
    backgroundColor: ShopColors.disabled,
  },
  feedbackBox: {
    backgroundColor: ShopColors.softGreen,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 11,
    marginTop: 10,
  },
  feedbackText: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '700',
    color: ShopColors.primaryDark,
  },
  deliveryInfo: {
    borderTopWidth: 1,
    borderTopColor: ShopColors.border,
    marginTop: 15,
    paddingTop: 13,
    gap: 7,
  },
  deliveryLine: {
    fontSize: 10,
    lineHeight: 15,
    color: ShopColors.muted,
  },
  consultCard: {
    backgroundColor: '#E8F3E5',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 11,
    alignItems: 'flex-start',
  },
  consultIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consultBody: {
    flex: 1,
  },
  consultTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: ShopColors.heading,
  },
  consultText: {
    fontSize: 10,
    lineHeight: 15,
    color: ShopColors.body,
    marginTop: 3,
  },
  consultLink: {
    marginTop: 7,
    alignSelf: 'flex-start',
  },
  consultLinkText: {
    fontSize: 10,
    fontWeight: '800',
    color: ShopColors.primaryDark,
  },
  notFoundScreen: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  notFoundCard: {
    backgroundColor: ShopColors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ShopColors.border,
    padding: 24,
    alignItems: 'center',
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  notFoundIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#EDF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: ShopColors.heading,
    marginTop: 10,
  },
  notFoundText: {
    fontSize: 12,
    lineHeight: 18,
    color: ShopColors.muted,
    textAlign: 'center',
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: ShopColors.primary,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: ShopColors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
});
