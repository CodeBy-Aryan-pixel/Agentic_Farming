import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { CartFab } from '@/components/agri-shop/cart-fab';
import { DiseasePicker } from '@/components/agri-shop/disease-picker';
import { PrescriptionBanner } from '@/components/agri-shop/prescription-banner';
import { ProductCard } from '@/components/agri-shop/product-card';
import { UnifiedPageShell } from '@/components/UnifiedPageShell';
import {
  ShopColors,
  ShopLayout,
} from '@/constants/agri-shop-theme';
import {
  AGRI_PRODUCTS,
  PRODUCT_CATEGORIES,
  type AgriProduct,
  type ProductCategory,
} from '@/data/agriProducts';
import {
  createDiagnosis,
  useCart,
  type ActiveDiagnosis,
} from '@/context/CartContext';
import {
  canonicalizeDisease,
  getDiseaseProfile,
  getProductMatchScore,
  getRecommendedProducts,
  getTreatmentBundle,
  normalizeCrop,
  normalizeSeverity,
  productMatchesQuery,
} from '@/utils/recommendationEngine';
import { AGRI_SHOP_ROUTE } from '@/utils/navigation';
import { formatINR } from '@/utils/format';

type CategoryFilter = 'All' | 'AI Recommended' | ProductCategory;

type SortOption =
  | 'recommended'
  | 'price-asc'
  | 'price-desc'
  | 'rating'
  | 'discount';

const CATEGORY_FILTERS: CategoryFilter[] = [
  'All',
  'AI Recommended',
  ...PRODUCT_CATEGORIES,
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'discount', label: 'Biggest Discount' },
];

function pillLabel(filter: CategoryFilter): string {
  if (filter === 'All') return 'All Products';
  if (filter === 'Bio-Cures & Organics') return 'Bio-Cures';
  return filter;
}

function filterLabel(filter: CategoryFilter, count: number): string {
  return `${pillLabel(filter)} (${count})`;
}

function parseConfidence(value?: string): number | undefined {
  if (!value) return undefined;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;

  const ratio = parsed > 1 && parsed <= 100 ? parsed / 100 : parsed;
  return Math.max(0, Math.min(1, ratio));
}

export default function AgriShopScreen() {
  const params = useLocalSearchParams<{
    disease?: string;
    crop?: string;
    severity?: string;
    confidence?: string;
    products?: string;
    quantities?: string;
    kit?: string;
  }>();

  const { width } = useWindowDimensions();
  const {
    diagnosis: savedDiagnosis,
    addItem,
    setDiagnosis,
    clearDiagnosis,
  } = useCart();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('All');
  const [sortOption, setSortOption] = useState<SortOption>('recommended');
  const [sortOpen, setSortOpen] = useState(false);
  const [pinnedAdded, setPinnedAdded] = useState(false);

  const paramDisease = canonicalizeDisease(
    typeof params.disease === 'string' ? params.disease : null
  );
  const paramCrop = normalizeCrop(
    typeof params.crop === 'string' ? params.crop : null
  );
  const paramSeverity =
    typeof params.severity === 'string' ? params.severity : undefined;
  const paramConfidence = parseConfidence(
    typeof params.confidence === 'string' ? params.confidence : undefined
  );

  const activeDisease =
    paramDisease ??
    (savedDiagnosis && canonicalizeDisease(savedDiagnosis.disease)) ??
    null;

  const profile = activeDisease
    ? getDiseaseProfile(activeDisease)
    : undefined;

  const activeCrop =
    paramCrop ??
    normalizeCrop(savedDiagnosis?.crop) ??
    profile?.defaultCrop ??
    null;

  const activeSeverity = activeDisease
    ? normalizeSeverity(
        paramSeverity ??
          savedDiagnosis?.severity ??
          profile?.defaultSeverity
      )
    : null;

  useEffect(() => {
    if (!paramDisease) return;

    const nextProfile = getDiseaseProfile(paramDisease);
    const nextCrop =
      paramCrop ?? nextProfile?.defaultCrop ?? 'Tomato';
    const nextConfidence =
      paramConfidence ?? savedDiagnosis?.confidence;
    const nextSeverity = normalizeSeverity(
      paramSeverity ?? nextProfile?.defaultSeverity,
      nextConfidence
    );

    const alreadySynced =
      savedDiagnosis?.disease === paramDisease &&
      savedDiagnosis?.crop === nextCrop &&
      savedDiagnosis?.severity === nextSeverity;

    if (alreadySynced) return;

    setDiagnosis({
      disease: paramDisease,
      crop: nextCrop,
      severity: nextSeverity,
      confidence: nextConfidence,
      source: 'link',
      scannedAt: new Date().toISOString(),
      checkedCureSteps: [],
    });
  }, [
    paramDisease,
    paramCrop,
    paramSeverity,
    paramConfidence,
    savedDiagnosis,
    setDiagnosis,
  ]);

  const bundle = useMemo(
    () =>
      activeDisease
        ? getTreatmentBundle(
            activeDisease,
            activeCrop,
            activeSeverity ?? undefined
          )
        : null,
    [activeDisease, activeCrop, activeSeverity]
  );

  const activeDiagnosis = useMemo<ActiveDiagnosis | null>(() => {
    if (!bundle || !activeDisease) return null;

    if (
      savedDiagnosis &&
      savedDiagnosis.disease === bundle.disease &&
      savedDiagnosis.crop === bundle.crop
    ) {
      return savedDiagnosis;
    }

    return {
      disease: bundle.disease,
      crop: bundle.crop,
      severity: bundle.severity,
      confidence:
        paramConfidence ?? savedDiagnosis?.confidence,
      rawLabel: savedDiagnosis?.rawLabel,
      source: paramDisease ? 'link' : 'agri-shop',
      scannedAt: savedDiagnosis?.scannedAt ?? new Date().toISOString(),
      checkedCureSteps: savedDiagnosis?.checkedCureSteps ?? [],
    };
  }, [
    bundle,
    activeDisease,
    savedDiagnosis,
    paramConfidence,
    paramDisease,
  ]);

  const pinnedProductIds = useMemo(() => {
    const raw = params.products;
    const value = Array.isArray(raw) ? raw.join(',') : raw;

    if (!value) return [];

    return Array.from(
      new Set(
        value
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      )
    );
  }, [params.products]);

  const pinnedProducts = useMemo(
    () =>
      pinnedProductIds
        .map((id) => AGRI_PRODUCTS.find((product) => product.id === id))
        .filter(
          (product): product is AgriProduct => Boolean(product)
        ),
    [pinnedProductIds]
  );

  const pinnedQuantities = useMemo(() => {
    const raw = params.quantities;
    const value = Array.isArray(raw) ? raw.join(',') : raw ?? '';

    return value.split(',').map((entry) => {
      const parsed = Number(entry);

      return Number.isFinite(parsed) && parsed > 0
        ? Math.max(1, Math.min(99, Math.round(parsed)))
        : 1;
    });
  }, [params.quantities]);

  const isPinnedKit = params.kit === '1';

  const handleAddPinnedKit = () => {
    if (pinnedProducts.length === 0) return;

    pinnedProducts.forEach((product, index) => {
      addItem(product, pinnedQuantities[index] ?? 1);
    });
    setPinnedAdded(true);
  };

  const matchScores = useMemo(() => {
    const scores = new Map<string, number | null>();

    for (const product of AGRI_PRODUCTS) {
      scores.set(
        product.id,
        activeDisease
          ? getProductMatchScore(product, activeDisease, activeCrop)
          : null
      );
    }

    return scores;
  }, [activeDisease, activeCrop]);

  const recommendedIds = useMemo(() => {
    const recommended = activeDisease
      ? getRecommendedProducts(activeDisease, activeCrop)
      : [...AGRI_PRODUCTS]
          .filter((product) => product.inStock)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 6);

    return new Set(recommended.map((product) => product.id));
  }, [activeDisease, activeCrop]);

  const filterCounts = useMemo(() => {
    const counts = new Map<CategoryFilter, number>();
    counts.set('All', AGRI_PRODUCTS.length);
    counts.set('AI Recommended', recommendedIds.size);

    for (const category of PRODUCT_CATEGORIES) {
      counts.set(
        category,
        AGRI_PRODUCTS.filter((product) => product.category === category)
          .length
      );
    }

    return counts;
  }, [recommendedIds]);

  const filteredProducts = useMemo(() => {
    let list = AGRI_PRODUCTS.filter((product) =>
      productMatchesQuery(product, search)
    );

    if (activeFilter === 'AI Recommended') {
      list = list.filter((product) => recommendedIds.has(product.id));
    } else if (activeFilter !== 'All') {
      list = list.filter(
        (product) => product.category === activeFilter
      );
    }

    return [...list].sort((a, b) => {
      if (sortOption === 'price-asc') return a.price - b.price;
      if (sortOption === 'price-desc') return b.price - a.price;
      if (sortOption === 'rating') return b.rating - a.rating;
      if (sortOption === 'discount') {
        const discountA = (a.originalPrice - a.price) / a.originalPrice;
        const discountB = (b.originalPrice - b.price) / b.originalPrice;
        return discountB - discountA;
      }

      if (activeDisease) {
        const scoreA = matchScores.get(a.id) ?? 0;
        const scoreB = matchScores.get(b.id) ?? 0;

        if (scoreB !== scoreA) return scoreB - scoreA;
      }

      return b.rating - a.rating;
    });
  }, [
    search,
    activeFilter,
    recommendedIds,
    sortOption,
    activeDisease,
    matchScores,
  ]);

  const safeWidth = width > 0 ? width : 1024;
  const horizontalPadding = safeWidth < 480 ? 16 : 24;
  const contentWidth =
    Math.min(safeWidth, ShopLayout.maxContentWidth) -
    horizontalPadding * 2;
  const columns =
    safeWidth >= 1240
      ? 4
      : safeWidth >= 940
        ? 3
        : safeWidth >= 600
          ? 2
          : 1;
  const productWidth = Math.floor(
    (contentWidth - ShopLayout.gap * (columns - 1)) / columns
  );

  const handleDiseaseSelect = (disease: string) => {
    const nextProfile = getDiseaseProfile(disease);
    const nextCrop = nextProfile?.defaultCrop ?? 'Tomato';
    const nextSeverity = nextProfile?.defaultSeverity ?? 'Moderate';

    setDiagnosis(
      createDiagnosis(
        {
          disease,
          crop: nextCrop,
          severity: nextSeverity,
        },
        'agri-shop'
      )
    );

    setActiveFilter('All');
    router.setParams({
      disease,
      crop: nextCrop,
      severity: nextSeverity,
    });
  };

  const clearPrescription = () => {
    clearDiagnosis();
    router.replace(AGRI_SHOP_ROUTE);
    setActiveFilter('All');
  };

  const openProduct = (productId: string) => {
    router.push({
      pathname: '/agri-shop/[id]',
      params: {
        id: productId,
        ...(activeDisease
          ? {
              disease: activeDisease,
              crop: activeCrop ?? undefined,
              severity: activeSeverity ?? undefined,
            }
          : {}),
      },
    });
  };

  return (
    <UnifiedPageShell
      title="Agri-Shop"
      subtitle="Authentic seeds, crop nutrients & pathologist-prescribed cure kits"
      statusText="Verified Inputs"
      backLabel="Back to Home"
      contentContainerStyle={{
        paddingHorizontal: horizontalPadding,
        paddingBottom: 120,
      }}
    >
      <View style={styles.contentInner}>
        <View style={styles.hero}>
          <View style={styles.heroCircleOne} />
          <View style={styles.heroCircleTwo} />

          <Text style={styles.heroEyebrow}>
            FARM INPUTS · AI PRESCRIBED
          </Text>
          <Text
            style={[
              styles.heroTitle,
              safeWidth < 520 && styles.heroTitleCompact,
            ]}
          >
            Everything your crop needs,{'\n'}matched to its health.
          </Text>
          <Text style={styles.heroDescription}>
            Trusted seeds, nutrition, and crop protection delivered to your
            farm. Scan with Crop Doctor to unlock a personalised treatment
            plan.
          </Text>

          <View style={styles.heroBadges}>
            <View style={styles.heroBadge}>
              <Feather name="shield" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.heroBadgeText}>
                100% genuine inputs
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <Feather name="truck" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.heroBadgeText}>
                Free delivery over ₹999
              </Text>
            </View>
          </View>

          <View style={styles.searchBar}>
            <Feather name="search" size={16} color={ShopColors.soft} style={{ marginRight: 8 }} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search products, crops, or symptoms"
              placeholderTextColor={ShopColors.soft}
              style={styles.searchInput}
              returnKeyType="search"
              accessibilityLabel="Search products"
            />
            {search ? (
              <Pressable
                onPress={() => setSearch('')}
                style={styles.clearSearch}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Feather name="x" size={14} color="#6B7280" />
              </Pressable>
            ) : null}
          </View>
        </View>

          <View style={styles.pillsWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsContent}
            >
              {CATEGORY_FILTERS.map((filter) => {
                const active = activeFilter === filter;

                return (
                  <Pressable
                    key={filter}
                    onPress={() => {
                      setActiveFilter(filter);
                      setSortOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.pill,
                      active && styles.pillActive,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        active && styles.pillTextActive,
                      ]}
                    >
                      {filterLabel(filter, filterCounts.get(filter) ?? 0)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {pinnedProducts.length > 0 ? (
            <View style={styles.pinnedCard}>
              <View style={styles.pinnedHeader}>
                <View style={styles.pinnedHeaderText}>
                  <Text style={styles.pinnedEyebrow}>
                    CROP DOCTOR PRESCRIPTION
                  </Text>
                  <Text style={styles.pinnedTitle}>
                    Pinned cure kit for {activeCrop ?? 'your crop'}
                  </Text>
                  <Text style={styles.pinnedSubtitle}>
                    {pinnedProducts.length} inputs selected by the
                    AgriShopCureAgent
                    {isPinnedKit
                      ? ' and scaled to your acreage'
                      : ''}
                    .
                  </Text>
                </View>
                <View style={styles.pinnedBadge}>
                  <Text style={styles.pinnedBadgeText}>PINNED</Text>
                </View>
              </View>

              <View style={styles.pinnedList}>
                {pinnedProducts.map((product, index) => (
                  <Pressable
                    key={product.id}
                    onPress={() => openProduct(product.id)}
                    style={({ pressed }) => [
                      styles.pinnedRow,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${product.name}`}
                  >
                    <View style={styles.pinnedIconWrap}>
                      <Feather name="package" size={18} color="#15803D" />
                    </View>
                    <View style={styles.pinnedRowText}>
                      <Text
                        style={styles.pinnedName}
                        numberOfLines={2}
                      >
                        {product.name}
                      </Text>
                      <Text style={styles.pinnedMeta}>
                        {product.brand} · {product.unit} · Qty{' '}
                        {pinnedQuantities[index] ?? 1} ·{' '}
                        {formatINR(product.price)}
                      </Text>
                    </View>
                    <Text style={styles.pinnedAction}>VIEW →</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={handleAddPinnedKit}
                disabled={pinnedAdded}
                style={({ pressed }) => [
                  styles.pinnedKitButton,
                  pinnedAdded && styles.pinnedKitButtonAdded,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Add complete pinned cure kit to cart"
              >
                <Text style={styles.pinnedKitButtonText}>
                  {pinnedAdded
                    ? 'Complete kit added to cart'
                    : 'Add Complete Cure Kit to Cart'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {activeDiagnosis && bundle ? (
            <PrescriptionBanner
              diagnosis={activeDiagnosis}
              bundle={bundle}
              onDiseaseSelect={handleDiseaseSelect}
              onOpenProduct={openProduct}
              onClear={clearPrescription}
            />
          ) : (
            <View style={styles.aiCta}>
              <View style={styles.aiCtaGlow} />
              <View style={styles.aiCtaHeader}>
                <View style={styles.aiCtaIcon}>
                  <Feather name="zap" size={16} color="#15803D" />
                </View>
                <View style={styles.aiCtaText}>
                  <Text style={styles.aiCtaEyebrow}>
                    CROP DOCTOR AI PRESCRIPTION
                  </Text>
                  <Text style={styles.aiCtaTitle}>
                    Scan a leaf. Get a complete treatment bundle.
                  </Text>
                  <Text style={styles.aiCtaDescription}>
                    Crop Doctor turns a diagnosis into a primary cure, a
                    recovery nutrition plan, and an organic alternative.
                  </Text>
                </View>
              </View>

              <View style={styles.aiCtaActions}>
                <Pressable
                  onPress={() => router.push('/crop-doctor')}
                  style={({ pressed }) => [
                    styles.scanButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="camera" size={16} color="#FFFFFF" />
                    <Text style={styles.scanButtonText}>
                      Scan with Crop Doctor
                    </Text>
                  </View>
                </Pressable>

                <DiseasePicker
                  value={null}
                  onSelect={handleDiseaseSelect}
                  label="Try a demo disease"
                  compact
                />
              </View>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleBlock}>
              <Text style={styles.sectionTitle}>
                {activeFilter === 'AI Recommended'
                  ? 'AI recommended for you'
                  : activeFilter === 'All'
                    ? 'Farm inputs'
                    : pillLabel(activeFilter)}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {filteredProducts.length} product
                {filteredProducts.length === 1 ? '' : 's'}
                {activeDisease
                  ? ` · ranked for ${activeDisease}`
                  : ' · verified for Indian farms'}
              </Text>
            </View>

            <View style={styles.sectionActions}>
              <View style={styles.sortWrap}>
                <Pressable
                  onPress={() => setSortOpen((open) => !open)}
                  style={({ pressed }) => [
                    styles.sortButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Sort products"
                  accessibilityState={{ expanded: sortOpen }}
                >
                  <Feather
                    name="sliders"
                    size={12}
                    color={ShopColors.primaryDark}
                  />
                  <Text style={styles.sortButtonText} numberOfLines={1}>
                    {SORT_OPTIONS.find((option) => option.value === sortOption)
                      ?.label ?? 'Recommended'}
                  </Text>
                  <Feather
                    name={sortOpen ? 'chevron-up' : 'chevron-down'}
                    size={12}
                    color={ShopColors.primaryDark}
                  />
                </Pressable>

                {sortOpen ? (
                  <View style={styles.sortMenu}>
                    {SORT_OPTIONS.map((option) => {
                      const selected = option.value === sortOption;

                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => {
                            setSortOption(option.value);
                            setSortOpen(false);
                          }}
                          style={({ pressed }) => [
                            styles.sortOption,
                            selected && styles.sortOptionActive,
                            pressed && styles.pressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                        >
                          <Text
                            style={[
                              styles.sortOptionText,
                              selected && styles.sortOptionTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                          {selected ? (
                            <Feather
                              name="check"
                              size={12}
                              color={ShopColors.primary}
                            />
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {filteredProducts.length > 0 ? (
            <View style={styles.productGrid}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  width={productWidth}
                  matchScore={matchScores.get(product.id)}
                  activeDisease={activeDisease}
                  onOpen={() => openProduct(product.id)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#EDF5EE', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <MaterialCommunityIcons name="sprout-outline" size={28} color="#15803D" />
              </View>
              <Text style={styles.emptyTitle}>No matching products</Text>
              <Text style={styles.emptyText}>
                Try a different search term, category, or switch the disease
                diagnosis.
              </Text>
              <Pressable
                onPress={() => {
                  setSearch('');
                  setActiveFilter('All');
                }}
                style={({ pressed }) => [
                  styles.emptyButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.emptyButtonText}>Reset filters</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.footer}>
            AGENTIC FUTURE FARMING · FARM INPUTS DELIVERED WITH CARE
          </Text>
        </View>
      <CartFab />
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
  },
  contentInner: {
    width: '100%',
    maxWidth: ShopLayout.maxContentWidth,
    alignSelf: 'center',
  },
  hero: {
    backgroundColor: ShopColors.primary,
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    marginBottom: 18,
  },
  heroCircleOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -120,
    right: -60,
  },
  heroCircleTwo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -80,
    left: 80,
  },
  heroEyebrow: {
    color: '#D6F0D4',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.7,
  },
  heroTitle: {
    color: ShopColors.white,
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 12,
  },
  heroTitleCompact: {
    fontSize: 27,
    lineHeight: 34,
  },
  heroDescription: {
    color: '#DDF0DB',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    maxWidth: 620,
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  heroBadgeText: {
    color: ShopColors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: ShopColors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginTop: 18,
    minHeight: 48,
  },
  searchIcon: {
    fontSize: 23,
    color: ShopColors.primaryDark,
    marginTop: -3,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 13,
    color: ShopColors.heading,
  },
  clearSearch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ShopColors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    fontSize: 10,
    fontWeight: '800',
    color: ShopColors.muted,
  },
  pillsWrap: {
    marginBottom: 18,
    marginHorizontal: -4,
  },
  pillsContent: {
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  pill: {
    backgroundColor: ShopColors.white,
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  pillActive: {
    backgroundColor: ShopColors.primary,
    borderColor: ShopColors.primary,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: ShopColors.body,
  },
  pillTextActive: {
    color: ShopColors.white,
  },
  aiCta: {
    backgroundColor: ShopColors.white,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  aiCtaGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: ShopColors.softGreen,
    top: -90,
    right: -40,
  },
  aiCtaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
  },
  aiCtaIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: ShopColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCtaIconText: {
    color: ShopColors.white,
    fontSize: 20,
  },
  aiCtaText: {
    flex: 1,
    minWidth: 0,
  },
  aiCtaEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: ShopColors.primary,
  },
  aiCtaTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    color: ShopColors.heading,
    marginTop: 5,
  },
  aiCtaDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: ShopColors.muted,
    marginTop: 5,
    maxWidth: 640,
  },
  aiCtaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 15,
  },
  scanButton: {
    backgroundColor: ShopColors.primary,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: {
    color: ShopColors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
    zIndex: 8,
  },
  sectionTitleBlock: {
    flex: 1,
    minWidth: 180,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: ShopColors.heading,
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: ShopColors.muted,
    marginTop: 3,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  sortWrap: {
    position: 'relative',
    zIndex: 20,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: ShopColors.white,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    maxWidth: 180,
  },
  sortButtonText: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '800',
    color: ShopColors.primaryDark,
  },
  sortMenu: {
    position: 'absolute',
    top: 39,
    right: 0,
    width: 190,
    backgroundColor: ShopColors.white,
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 12,
    paddingVertical: 5,
    shadowColor: '#102A13',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
    zIndex: 30,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  sortOptionActive: {
    backgroundColor: ShopColors.softGreen,
  },
  sortOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: ShopColors.body,
  },
  sortOptionTextActive: {
    fontWeight: '800',
    color: ShopColors.primaryDark,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ShopLayout.gap,
  },
  emptyState: {
    backgroundColor: ShopColors.white,
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 34,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: ShopColors.heading,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 12,
    lineHeight: 18,
    color: ShopColors.muted,
    textAlign: 'center',
    marginTop: 5,
    maxWidth: 340,
  },
  emptyButton: {
    backgroundColor: ShopColors.primary,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: {
    color: ShopColors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  footer: {
    textAlign: 'center',
    fontSize: 8,
    letterSpacing: 1.2,
    color: ShopColors.soft,
    marginTop: 30,
  },
  pinnedCard: {
    backgroundColor: ShopColors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ShopColors.border,
    padding: 24,
    marginBottom: 18,
    gap: 12,
  },
  pinnedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  pinnedHeaderText: {
    flex: 1,
    gap: 3,
  },
  pinnedEyebrow: {
    color: ShopColors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pinnedTitle: {
    color: ShopColors.heading,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  pinnedSubtitle: {
    color: ShopColors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  pinnedBadge: {
    backgroundColor: ShopColors.softGreen,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  pinnedBadgeText: {
    color: ShopColors.primaryDark,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pinnedList: {
    gap: 8,
  },
  pinnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ShopColors.border,
    backgroundColor: ShopColors.mint,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  pinnedIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: ShopColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedIcon: {
    fontSize: 17,
  },
  pinnedRowText: {
    flex: 1,
    gap: 2,
  },
  pinnedName: {
    color: ShopColors.heading,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  pinnedMeta: {
    color: ShopColors.muted,
    fontSize: 10,
  },
  pinnedAction: {
    color: ShopColors.primary,
    fontSize: 9,
    fontWeight: '800',
  },
  pinnedKitButton: {
    backgroundColor: ShopColors.primary,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedKitButtonAdded: {
    backgroundColor: ShopColors.success,
  },
  pinnedKitButtonText: {
    color: ShopColors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
});
