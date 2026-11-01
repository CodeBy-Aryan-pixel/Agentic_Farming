import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import {
  PALETTE,
  UnifiedPageShell,
} from '@/components/UnifiedPageShell';
import { AGRI_SHOP_ROUTE, MARKET_ADVISOR_ROUTE } from '@/utils/navigation';

interface CropRecommendation {
  id: string;
  name: string;
  variety: string;
  matchPct: number;
  season: string;
  soil: string;
  durationDays: number;
  netProfitPerAcre: number;
  roiMultiplier: number;
  inputCostPerAcre: number;
  marketDemand: 'High Surge' | 'Steady' | 'Premium Export';
  summary: string;
}

const CROP_RECOMMENDATIONS: CropRecommendation[] = [
  {
    id: 'crop-1',
    name: 'Sharbati Wheat',
    variety: 'HD-2967 (Rust-Resistant)',
    matchPct: 98,
    season: 'Rabi',
    soil: 'Black Loam',
    durationDays: 120,
    netProfitPerAcre: 68500,
    roiMultiplier: 3.4,
    inputCostPerAcre: 19500,
    marketDemand: 'High Surge',
    summary:
      'Ideal for heavy black loam soil with moderate winter chill. Exceptional grain luster commands a 15–20% premium over MSP.',
  },
  {
    id: 'crop-2',
    name: 'Organic Desi Tomato',
    variety: 'Pusa Ruby / Arka Rakshak',
    matchPct: 95,
    season: 'Rabi',
    soil: 'Alluvial Loam',
    durationDays: 105,
    netProfitPerAcre: 112000,
    roiMultiplier: 4.1,
    inputCostPerAcre: 26000,
    marketDemand: 'High Surge',
    summary:
      'High market surge forecasted for Q1. Deep root aeration paired with drip fertigation delivers 25+ tonnes/acre.',
  },
  {
    id: 'crop-3',
    name: 'Yellow Mustard',
    variety: 'Pusa Bold (High Oil Content)',
    matchPct: 91,
    season: 'Rabi',
    soil: 'Sandy Loam',
    durationDays: 95,
    netProfitPerAcre: 48000,
    roiMultiplier: 3.8,
    inputCostPerAcre: 12500,
    marketDemand: 'Steady',
    summary:
      'Low water footprint, excellent for secondary plots. 42% oil recovery qualifies for instant FPO procurement.',
  },
  {
    id: 'crop-4',
    name: 'Kabuli Chana (Chickpea)',
    variety: 'JAKI 9218',
    matchPct: 89,
    season: 'Rabi',
    soil: 'Clay Loam',
    durationDays: 110,
    netProfitPerAcre: 54000,
    roiMultiplier: 3.2,
    inputCostPerAcre: 16800,
    marketDemand: 'Premium Export',
    summary:
      'Fixes 40 kg atmospheric nitrogen per acre. Excellent drought resistance with guaranteed APMC Mandi liquidity.',
  },
];

export default function CropAdvisorScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [selectedSoil, setSelectedSoil] = useState('Black Loam');
  const [selectedWater, setSelectedWater] = useState('Drip / Borewell (High)');

  const soils = ['Black Loam', 'Alluvial Loam', 'Sandy Loam', 'Clay Loam'];
  const waters = ['Drip / Borewell (High)', 'Rainfed (Medium)', 'Dryland (Low)'];

  return (
    <UnifiedPageShell
      title="AI Crop Advisor"
      subtitle="Soil, season & agronomic ROI crop recommendation engine"
      statusText="Soil Match ML"
      backLabel="Back to Home"
      scrollable={true}
    >
      <View style={styles.mainContainer}>
        {/* Farm Parameters Card */}
        <View style={styles.card}>
          <Text style={styles.eyebrow}>FARM PARAMETERS</Text>
          <Text style={styles.cardTitle}>Customize Soil Type & Water Availability</Text>
          <Text style={styles.cardSubtitle}>
            Select your farm conditions to dynamically recalculate crop compatibility and profit forecasts.
          </Text>

          <Text style={styles.filterLabel}>SELECT SOIL TYPE</Text>
          <View style={styles.filterRow}>
            {soils.map((s) => {
              const active = s === selectedSoil;
              return (
                <Pressable
                  key={s}
                  style={[
                    styles.filterChip,
                    active && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedSoil(s)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.filterLabel, { marginTop: 14 }]}>
            WATER SOURCE & IRRIGATION CAPABILITY
          </Text>
          <View style={styles.filterRow}>
            {waters.map((w) => {
              const active = w === selectedWater;
              return (
                <Pressable
                  key={w}
                  style={[
                    styles.filterChip,
                    active && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedWater(w)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    {w}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionHeadingTitle}>
            Ranked High-ROI Crops for Your Field (Rabi Season)
          </Text>
          <View style={styles.rabiPill}>
            <Text style={styles.rabiPillText}>Rabi Cycle</Text>
          </View>
        </View>

        {/* Recommendations Grid */}
        <View style={isDesktop ? styles.desktopGrid : styles.mobileStack}>
          {CROP_RECOMMENDATIONS.map((crop) => (
            <View key={crop.id} style={styles.cropCard}>
              <View style={styles.cropTopRow}>
                <View style={styles.cropIconBox}>
                  <MaterialCommunityIcons
                    name="sprout"
                    size={22}
                    color={PALETTE.brandEmerald}
                  />
                </View>
                <View style={styles.cropTitleBlock}>
                  <Text style={styles.cropName}>{crop.name}</Text>
                  <Text style={styles.cropVariety}>{crop.variety}</Text>
                </View>
                <View style={styles.matchPill}>
                  <Text style={styles.matchPillText}>{crop.matchPct}% Match</Text>
                </View>
              </View>

              <Text style={styles.cropSummary}>{crop.summary}</Text>

              {/* Financial & Agronomic Metrics */}
              <View style={styles.metricsBox}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>NET PROFIT / AC</Text>
                  <Text style={styles.metricValue}>
                    ₹{crop.netProfitPerAcre.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>PROJECTED ROI</Text>
                  <Text style={[styles.metricValue, { color: PALETTE.brandEmerald }]}>
                    {crop.roiMultiplier}x
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>HARVEST CYCLE</Text>
                  <Text style={styles.metricValue}>
                    {crop.durationDays} Days
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <Pressable
                  style={styles.primaryActionButton}
                  onPress={() => router.push(AGRI_SHOP_ROUTE)}
                >
                  <Feather name="shopping-bag" size={14} color="#FFFFFF" />
                  <Text style={styles.primaryActionText}>Order Seeds & Inputs</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryActionButton}
                  onPress={() => router.push(MARKET_ADVISOR_ROUTE)}
                >
                  <Feather name="trending-up" size={14} color={PALETTE.brandEmerald} />
                  <Text style={styles.secondaryActionText}>Mandi Surge</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </View>
    </UnifiedPageShell>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 20,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 24,
    shadowColor: '#102A13',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  eyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    color: PALETTE.brandEmerald,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.brandDark,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: PALETTE.textMuted,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: PALETTE.brandEmerald,
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: PALETTE.pillBg,
  },
  filterChipActive: {
    backgroundColor: PALETTE.brandDark,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.pillText,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionHeadingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: PALETTE.brandDark,
    letterSpacing: -0.3,
  },
  rabiPill: {
    backgroundColor: PALETTE.sageTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rabiPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.brandEmerald,
  },

  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  mobileStack: {
    gap: 16,
  },
  cropCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 20,
    shadowColor: '#102A13',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cropTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  cropIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: PALETTE.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropTitleBlock: {
    flex: 1,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.brandDark,
  },
  cropVariety: {
    fontSize: 12,
    color: PALETTE.textMuted,
    marginTop: 1,
  },
  matchPill: {
    backgroundColor: PALETTE.sageTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.brandEmerald,
  },
  cropSummary: {
    fontSize: 12.5,
    color: PALETTE.textMuted,
    lineHeight: 17,
    marginBottom: 14,
  },
  metricsBox: {
    flexDirection: 'row',
    backgroundColor: PALETTE.pillBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: PALETTE.textMuted,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.brandDark,
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: PALETTE.brandEmerald,
    minHeight: 48,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    minHeight: 48,
    paddingVertical: 10,
    borderRadius: 12,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.brandEmerald,
  },
});
