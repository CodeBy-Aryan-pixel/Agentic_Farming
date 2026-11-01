import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import { ActionButton } from '@/components/ActionButton';
import { UnifiedPageShell } from '@/components/UnifiedPageShell';
import { SchemeCard } from '@/components/govt-schemes/scheme-card';
import {
  ShopColors,
  ShopLayout,
} from '@/constants/agri-shop-theme';
import {
  FARMER_NEED_OPTIONS,
  GOVT_SCHEMES,
  LAND_SIZE_OPTIONS,
  NATIONAL_SCHEMES_PORTAL,
  SCHEME_CATEGORIES,
  SCHEME_TIMELINE_TABS,
  type FarmerNeed,
  type GovtScheme,
  type LandSize,
  type SchemeCategory,
  type SchemeTimelineTab,
} from '@/data/govtSchemes';
import { openOfficialPortal } from '@/utils/official-portal';

type CategoryFilter = 'All' | SchemeCategory;

const CATEGORY_FILTERS: CategoryFilter[] = [
  'All',
  ...SCHEME_CATEGORIES,
];

function matchesSearch(scheme: GovtScheme, query: string): boolean {
  const value = query.trim().toLowerCase();
  if (!value) return true;

  return [
    scheme.title,
    scheme.shortName,
    scheme.ministry,
    scheme.category,
    scheme.maxBenefit,
    scheme.summary,
    ...scheme.benefits,
    ...scheme.eligibility,
    ...scheme.requiredDocuments,
  ].some((field) => field.toLowerCase().includes(value));
}

function matchesEligibility(
  scheme: GovtScheme,
  landSize: LandSize | null,
  need: FarmerNeed | null
): boolean {
  if (!landSize && !need) return false;
  if (landSize && !scheme.eligibleLandSizes.includes(landSize)) {
    return false;
  }
  if (need && !scheme.farmerNeeds.includes(need)) {
    return false;
  }
  return true;
}

export default function GovtSchemesScreen() {
  const { width } = useWindowDimensions();

  const [search, setSearch] = useState('');
  const [activeTimeline, setActiveTimeline] =
    useState<SchemeTimelineTab>('all');
  const [activeCategory, setActiveCategory] =
    useState<CategoryFilter>('All');
  const [landSize, setLandSize] = useState<LandSize | null>(null);
  const [need, setNeed] = useState<FarmerNeed | null>(null);

  const hasEligibilitySelection = Boolean(landSize || need);

  const matchingCount = useMemo(() => {
    if (!hasEligibilitySelection) return 0;

    return GOVT_SCHEMES.filter((scheme) =>
      matchesEligibility(scheme, landSize, need)
    ).length;
  }, [hasEligibilitySelection, landSize, need]);

  const filteredSchemes = useMemo(() => {
    const timeline = SCHEME_TIMELINE_TABS.find(
      (tab) => tab.id === activeTimeline
    )?.timeline;

    return GOVT_SCHEMES.filter((scheme) => {
      if (!matchesSearch(scheme, search)) return false;
      if (timeline && scheme.timeline !== timeline) return false;
      if (
        activeCategory !== 'All' &&
        scheme.category !== activeCategory
      ) {
        return false;
      }
      return true;
    });
  }, [search, activeTimeline, activeCategory]);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    activeTimeline !== 'all' ||
    activeCategory !== 'All' ||
    hasEligibilitySelection;

  const clearFilters = () => {
    setSearch('');
    setActiveTimeline('all');
    setActiveCategory('All');
    setLandSize(null);
    setNeed(null);
  };

  const safeWidth = width > 0 ? width : 1024;
  const horizontalPadding = safeWidth < 480 ? 16 : 24;

  return (
    <UnifiedPageShell
      title="Govt. Schemes & Subsidies"
      subtitle="Central & state agricultural grants, PM-KISAN & PMKSY drip subsidies"
      statusText="Official Portals"
      backLabel="Back to Home"
      contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 40 }}
    >
      <View style={styles.contentInner}>
        <View style={styles.hero}>
          <View style={styles.heroCircleOne} />
          <View style={styles.heroCircleTwo} />

          <Text style={styles.heroEyebrow}>
            KISAN SUPPORT · CENTRAL & STATE
          </Text>

          <Text
            style={[
              styles.heroTitle,
              safeWidth < 520 && styles.heroTitleCompact,
            ]}
          >
            Government Schemes & Subsidies
          </Text>

          <Text style={styles.heroDescription}>
            Explore income support, crop insurance, solar, equipment,
            credit and soil programmes. Check what fits your farm, keep
            your documents ready and apply on the official government
            portal.
          </Text>

          <View style={styles.heroBadges}>
            <View style={styles.heroBadge}>
              <Feather name="check" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.heroBadgeText}>
                {GOVT_SCHEMES.length} verified schemes
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <Feather name="external-link" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.heroBadgeText}>
                Official .gov.in links
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() =>
              void openOfficialPortal(NATIONAL_SCHEMES_PORTAL)
            }
            style={({ pressed }) => [
              styles.nationalLink,
              pressed && styles.pressed,
            ]}
            accessibilityRole="link"
            accessibilityLabel="Open the National Scheme Finder on myscheme.gov.in in a new tab"
          >
            <View style={styles.nationalLinkBody}>
              <Text style={styles.nationalLinkLabel}>
                NATIONAL SCHEME FINDER
              </Text>
              <Text style={styles.nationalLinkText}>
                Find every scheme you may qualify for
              </Text>
            </View>
            <Text style={styles.nationalLinkArrow}>↗</Text>
          </Pressable>
        </View>

        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={ShopColors.soft} style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search PM-KISAN, solar pump, loan, drone…"
            placeholderTextColor={ShopColors.soft}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Search government schemes"
          />
          {search ? (
            <Pressable
              onPress={() => setSearch('')}
              style={styles.clearSearch}
              accessibilityRole="button"
              accessibilityLabel="Clear scheme search"
              hitSlop={8}
            >
              <Feather name="x" size={14} color="#6B7280" />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.finderCard}>
          <View style={styles.finderHeader}>
            <View style={styles.finderIconTile}>
              <Feather name="target" size={20} color="#15803D" />
            </View>
            <View style={styles.finderHeading}>
              <Text style={styles.finderEyebrow}>
                SMART ELIGIBILITY FILTER
              </Text>
              <Text style={styles.finderTitle}>
                Tell us about your farm
              </Text>
            </View>
          </View>

            <Text style={styles.finderDescription}>
              Choose your land size and the support you need. Matching
              schemes will be highlighted with a green badge.
            </Text>

            <Text style={styles.filterLabel}>LAND SIZE</Text>
            <View style={styles.filterChips}>
              {LAND_SIZE_OPTIONS.map((option) => {
                const selected = landSize === option.id;

                return (
                  <Pressable
                    key={option.id}
                    onPress={() =>
                      setLandSize(selected ? null : option.id)
                    }
                    style={({ pressed }) => [
                      styles.filterChip,
                      selected && styles.filterChipSelected,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selected && styles.filterChipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.filterLabel}>WHAT DO YOU NEED?</Text>
            <View style={styles.filterChips}>
              {FARMER_NEED_OPTIONS.map((option) => {
                const selected = need === option.id;

                return (
                  <Pressable
                    key={option.id}
                    onPress={() =>
                      setNeed(selected ? null : option.id)
                    }
                    style={({ pressed }) => [
                      styles.filterChip,
                      selected && styles.filterChipSelected,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selected && styles.filterChipTextSelected,
                      ]}
                    >
                      {option.emoji} {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {hasEligibilitySelection ? (
              <View style={styles.finderResult}>
                <View style={styles.finderResultDot} />
                <Text style={styles.finderResultText}>
                  <Text style={styles.finderResultCount}>
                    {matchingCount}
                  </Text>{' '}
                  {matchingCount === 1 ? 'scheme matches' : 'schemes match'}{' '}
                  your selection. Look for the green{' '}
                  <Text style={styles.finderResultStrong}>
                    Eligible Match
                  </Text>{' '}
                  badge.
                </Text>
              </View>
            ) : (
              <Text style={styles.finderHint}>
                Pick one or both filters to see eligible matches.
              </Text>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timelineTabs}
          >
            {SCHEME_TIMELINE_TABS.map((tab) => {
              const active = activeTimeline === tab.id;

              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTimeline(tab.id)}
                  style={({ pressed }) => [
                    styles.timelineTab,
                    active && styles.timelineTabActive,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[
                      styles.timelineTabText,
                      active && styles.timelineTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryPills}
          >
            {CATEGORY_FILTERS.map((category) => {
              const active = activeCategory === category;

              return (
                <Pressable
                  key={category}
                  onPress={() => setActiveCategory(category)}
                  style={({ pressed }) => [
                    styles.categoryPill,
                    active && styles.categoryPillActive,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      active && styles.categoryPillTextActive,
                    ]}
                  >
                    {category === 'All' ? 'All' : category}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.resultsHeader}>
            <View style={styles.resultsHeading}>
              <Text style={styles.resultsTitle}>
                {filteredSchemes.length}{' '}
                {filteredSchemes.length === 1 ? 'scheme' : 'schemes'}
              </Text>
              <Text style={styles.resultsSubtitle}>
                Central & State programmes with official portal links
              </Text>
            </View>

            {hasActiveFilters ? (
              <Pressable
                onPress={clearFilters}
                style={({ pressed }) => [
                  styles.clearFiltersButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.clearFiltersText}>
                  Clear filters
                </Text>
              </Pressable>
            ) : null}
          </View>

          {filteredSchemes.length > 0 ? (
            <View style={styles.grid}>
              {filteredSchemes.map((scheme) => (
                <View key={scheme.id} style={styles.gridItem}>
                  <SchemeCard
                    scheme={scheme}
                    eligible={matchesEligibility(scheme, landSize, need)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconBox}>
                <Feather name="search" size={24} color="#15803D" />
              </View>
              <Text style={styles.emptyTitle}>No schemes found</Text>
              <Text style={styles.emptyText}>
                Try a different search term, category or timeline. You can
                also clear all filters and browse every scheme.
              </Text>
              <ActionButton
                label="Reset filters"
                icon="refresh-cw"
                variant="secondary"
                onPress={clearFilters}
                style={styles.emptyAction}
              />
            </View>
          )}

          <View style={styles.disclaimer}>
            <Feather name="info" size={18} color="#15803D" style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={styles.disclaimerText}>
              Scheme benefits, eligibility and deadlines can change. This
              directory is for guidance only — always verify the latest
              notification on the official .gov.in portal before applying
              or paying any fee.
            </Text>
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
    paddingTop: 16,
    paddingBottom: 40,
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
    marginBottom: 16,
  },
  heroCircleOne: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -95,
    right: -60,
  },
  heroCircleTwo: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -65,
    left: -30,
  },
  heroEyebrow: {
    color: '#D7F2D8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: ShopColors.white,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 14,
    maxWidth: 690,
  },
  heroTitleCompact: {
    fontSize: 26,
    lineHeight: 32,
  },
  heroDescription: {
    color: '#E4F3E2',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
    maxWidth: 720,
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 17,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  heroBadgeText: {
    color: '#F0F9EE',
    fontSize: 9,
    fontWeight: '700',
  },
  nationalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: ShopColors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 18,
  },
  nationalLinkBody: {
    flex: 1,
    minWidth: 0,
  },
  nationalLinkLabel: {
    color: ShopColors.primary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  nationalLinkText: {
    color: ShopColors.heading,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  nationalLinkArrow: {
    color: ShopColors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: ShopColors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ShopColors.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 22,
    color: ShopColors.primary,
    marginTop: -2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 13,
    color: ShopColors.heading,
  },
  clearSearch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ShopColors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    fontSize: 11,
    fontWeight: '800',
    color: ShopColors.muted,
  },
  finderCard: {
    backgroundColor: ShopColors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ShopColors.border,
    padding: 24,
    marginBottom: 18,
  },
  finderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  finderIconTile: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: ShopColors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finderIcon: {
    fontSize: 21,
  },
  finderHeading: {
    flex: 1,
    minWidth: 0,
  },
  finderEyebrow: {
    color: ShopColors.primary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  finderTitle: {
    color: ShopColors.heading,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  finderDescription: {
    color: ShopColors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 12,
  },
  filterLabel: {
    color: ShopColors.soft,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginTop: 16,
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  filterChip: {
    backgroundColor: '#F7FAF6',
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  filterChipSelected: {
    backgroundColor: ShopColors.primary,
    borderColor: ShopColors.primary,
  },
  filterChipText: {
    color: ShopColors.body,
    fontSize: 10,
    fontWeight: '700',
  },
  filterChipTextSelected: {
    color: ShopColors.white,
  },
  finderResult: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: ShopColors.softGreen,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    borderRadius: 11,
    padding: 11,
    marginTop: 15,
  },
  finderResultDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ShopColors.primary,
    marginTop: 5,
  },
  finderResultText: {
    flex: 1,
    color: ShopColors.primaryDeep,
    fontSize: 11,
    lineHeight: 17,
  },
  finderResultCount: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  finderResultStrong: {
    fontWeight: '800',
  },
  finderHint: {
    color: ShopColors.soft,
    fontSize: 9,
    marginTop: 13,
  },
  timelineTabs: {
    gap: 8,
    paddingBottom: 13,
  },
  timelineTab: {
    backgroundColor: ShopColors.white,
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  timelineTabActive: {
    backgroundColor: ShopColors.primary,
    borderColor: ShopColors.primary,
  },
  timelineTabText: {
    color: ShopColors.body,
    fontSize: 10,
    fontWeight: '700',
  },
  timelineTabTextActive: {
    color: ShopColors.white,
  },
  categoryPills: {
    gap: 7,
    paddingBottom: 20,
  },
  categoryPill: {
    backgroundColor: ShopColors.white,
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryPillActive: {
    backgroundColor: ShopColors.primary,
    borderColor: ShopColors.primary,
  },
  categoryPillText: {
    color: ShopColors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  categoryPillTextActive: {
    color: ShopColors.white,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 13,
  },
  resultsHeading: {
    flex: 1,
    minWidth: 0,
  },
  resultsTitle: {
    color: ShopColors.heading,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  resultsSubtitle: {
    color: ShopColors.soft,
    fontSize: 9,
    marginTop: 3,
  },
  clearFiltersButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: ShopColors.mint,
    borderRadius: 9,
  },
  clearFiltersText: {
    color: ShopColors.primaryDark,
    fontSize: 9,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ShopLayout.gap,
  },
  gridItem: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 410,
    minWidth: 0,
    maxWidth: 582,
  },
  emptyCard: {
    backgroundColor: ShopColors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ShopColors.border,
    padding: 24,
    alignItems: 'center',
  },
  emptyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EDF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    color: ShopColors.heading,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyText: {
    color: ShopColors.muted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 420,
    marginTop: 7,
  },
  emptyAction: {
    marginTop: 15,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: '#F4F8F2',
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 14,
    padding: 14,
    marginTop: 22,
  },
  disclaimerIcon: {
    fontSize: 13,
    marginTop: 1,
  },
  disclaimerText: {
    flex: 1,
    color: ShopColors.muted,
    fontSize: 9,
    lineHeight: 15,
  },
  pressed: {
    opacity: 0.72,
  },
});
