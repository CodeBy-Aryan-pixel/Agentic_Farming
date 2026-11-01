import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { UnifiedPageShell } from '@/components/UnifiedPageShell';
import { useFarm } from '@/context/FarmContext';
import { useAuth } from '@/context/AuthContext';

const PRIMARY = '#2D7A31';
const DARK = '#102A13';
const MUTED = '#64748B';
const CARD_BG = '#FFFFFF';
const BORDER = '#E2E8F0';
const BG = '#F6F9F5';

export default function FieldMonitorScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { plots, togglePlotValve } = useFarm();
  const { logAppActivity } = useAuth();
  const [selectedPlotId, setSelectedPlotId] = useState('plot-a');

  const activePlot = plots.find((p) => p.id === selectedPlotId) ?? plots[0];

  const handleToggleValve = () => {
    togglePlotValve(activePlot.id);
    const nextState = !activePlot.valveOpen;
    logAppActivity(
      'IRRIGATION',
      `${activePlot.name}: Drip Valve ${nextState ? 'Opened' : 'Closed'}`,
      `${nextState ? 'Automated drip cycle active' : 'Flow halted'} • ${activePlot.flowLpm} L/min • ${activePlot.acres} Acres (${activePlot.crop})`,
      'Completed'
    );
  };

  return (
    <UnifiedPageShell
      title="Field Digital Twin"
      subtitle="Satellite NDVI canopy health & IoT smart soil telemetry"
      statusText="4 Plots Live"
      backLabel="Back to Home"
      scrollable={true}
    >
      <View style={styles.pageInner}>
        {/* Plot Selector Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.plotSelectorRow}
          >
            {plots.map((plot) => {
              const active = plot.id === activePlot.id;
              return (
                <Pressable
                  key={plot.id}
                  style={[
                    styles.plotChip,
                    active && styles.plotChipActive,
                  ]}
                  onPress={() => setSelectedPlotId(plot.id)}
                >
                  <Text
                    style={[
                      styles.plotChipTitle,
                      active && styles.plotChipTitleActive,
                    ]}
                  >
                    {plot.name}
                  </Text>
                  <Text
                    style={[
                      styles.plotChipSubtitle,
                      active && styles.plotChipSubtitleActive,
                    ]}
                  >
                    {plot.crop} • {plot.acres} Ac
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* 2-Column Responsive Deck */}
          <View style={isDesktop ? styles.desktopSplit : styles.mobileStack}>
            {/* Left: Satellite NDVI Canopy Map & Harvest Predictor */}
            <View style={styles.column}>
              {/* Satellite NDVI Canopy Map */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.eyebrow}>SATELLITE SPECTRAL IMAGING</Text>
                    <Text style={styles.cardTitle}>Canopy Health & NDVI Map</Text>
                  </View>
                  <View style={styles.ndviBadge}>
                    <Text style={styles.ndviBadgeText}>
                      NDVI {activePlot.ndvi.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Simulated High-Res NDVI Canopy View */}
                <View style={styles.satelliteView}>
                  <View style={styles.canopyOverlay}>
                    <View style={styles.satGridRow}>
                      <View style={[styles.satCell, { backgroundColor: '#15803D' }]} />
                      <View style={[styles.satCell, { backgroundColor: '#16A34A' }]} />
                      <View style={[styles.satCell, { backgroundColor: '#22C55E' }]} />
                      <View style={[styles.satCell, { backgroundColor: '#16A34A' }]} />
                    </View>
                    <View style={styles.satGridRow}>
                      <View style={[styles.satCell, { backgroundColor: '#16A34A' }]} />
                      <View style={[styles.satCell, { backgroundColor: '#15803D' }]} />
                      <View style={[styles.satCell, { backgroundColor: '#15803D' }]} />
                      <View style={[styles.satCell, { backgroundColor: '#22C55E' }]} />
                    </View>
                    <View style={styles.satGridRow}>
                      <View style={[styles.satCell, { backgroundColor: '#22C55E' }]} />
                      <View style={[styles.satCell, { backgroundColor: '#16A34A' }]} />
                      <View style={[styles.satCell, { backgroundColor: '#15803D' }]} />
                      <View style={[styles.satCell, { backgroundColor: '#16A34A' }]} />
                    </View>
                  </View>

                  <View style={styles.satTelemetryRow}>
                    <Text style={styles.satMetaText}>
                      Sentinel-2 ESA Sat (10m res)
                    </Text>
                    <Text style={styles.satMetaText}>
                      Cloud: 2% • Status: {activePlot.ndviStatus}
                    </Text>
                  </View>
                </View>

                {/* NDVI Spectrum Scale */}
                <View style={styles.spectrumBar}>
                  <View style={[styles.spectrumSeg, { backgroundColor: '#EF4444' }]} />
                  <View style={[styles.spectrumSeg, { backgroundColor: '#F59E0B' }]} />
                  <View style={[styles.spectrumSeg, { backgroundColor: '#84CC16' }]} />
                  <View style={[styles.spectrumSeg, { backgroundColor: '#22C55E' }]} />
                  <View style={[styles.spectrumSeg, { backgroundColor: '#15803D' }]} />
                </View>
                <View style={styles.spectrumLabels}>
                  <Text style={styles.spectrumLabel}>0.2 Barren</Text>
                  <Text style={styles.spectrumLabel}>0.5 Moderate</Text>
                  <Text style={styles.spectrumLabel}>0.9 Dense Vigorous</Text>
                </View>
              </View>

              {/* Harvest & Yield Predictor */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.eyebrow}>AI HARVEST PREDICTOR</Text>
                    <Text style={styles.cardTitle}>Yield & Maturity Index</Text>
                  </View>
                  <View style={styles.harvestPill}>
                    <Text style={styles.harvestPillText}>
                      {activePlot.daysToHarvest} DAYS LEFT
                    </Text>
                  </View>
                </View>

                <View style={styles.harvestKpiRow}>
                  <View style={styles.harvestKpiCell}>
                    <Text style={styles.harvestKpiLabel}>EXPECTED YIELD</Text>
                    <Text style={styles.harvestKpiVal}>
                      {activePlot.projectedYieldTonnes} T/Ac
                    </Text>
                    <Text style={styles.harvestKpiSub}>+14% vs regional avg</Text>
                  </View>
                  <View style={styles.harvestKpiCell}>
                    <Text style={styles.harvestKpiLabel}>MATURITY GRADE</Text>
                    <Text style={styles.harvestKpiVal}>
                      {activePlot.healthPct}%
                    </Text>
                    <Text style={styles.harvestKpiSub}>Peak sugar & weight</Text>
                  </View>
                  <View style={styles.harvestKpiCell}>
                    <Text style={styles.harvestKpiLabel}>HARVEST WINDOW</Text>
                    <Text style={styles.harvestKpiVal}>Nov 10–14</Text>
                    <Text style={styles.harvestKpiSub}>Dry weather forecasted</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Right: NPK Soil Sensors & Smart Valves */}
            <View style={styles.column}>
              {/* NPK & Soil Sensor Array */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.eyebrow}>ROOT-ZONE TELEMETRY</Text>
                    <Text style={styles.cardTitle}>NPK & Soil Sensor Array</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Feather name="zap" size={12} color="#15803D" />
                    <Text style={styles.sensorStatus}>BLE Mesh Connected</Text>
                  </View>
                </View>

                <View style={styles.npkGrid}>
                  <View style={styles.npkCell}>
                    <Text style={styles.npkSymbol}>N</Text>
                    <Text style={styles.npkName}>Nitrogen</Text>
                    <Text style={styles.npkVal}>{activePlot.nitrogenKg} kg/ha</Text>
                    <View style={styles.npkTrack}>
                      <View style={[styles.npkFill, { width: '75%', backgroundColor: '#2D7A31' }]} />
                    </View>
                    <Text style={styles.npkTag}>Optimal Growth</Text>
                  </View>

                  <View style={styles.npkCell}>
                    <Text style={styles.npkSymbol}>P</Text>
                    <Text style={styles.npkName}>Phosphorus</Text>
                    <Text style={styles.npkVal}>{activePlot.phosphorusKg} kg/ha</Text>
                    <View style={styles.npkTrack}>
                      <View style={[styles.npkFill, { width: '45%', backgroundColor: '#F59E0B' }]} />
                    </View>
                    <Text style={styles.npkTag}>Bio-P Boost Suggested</Text>
                  </View>

                  <View style={styles.npkCell}>
                    <Text style={styles.npkSymbol}>K</Text>
                    <Text style={styles.npkName}>Potassium</Text>
                    <Text style={styles.npkVal}>{activePlot.potassiumKg} kg/ha</Text>
                    <View style={styles.npkTrack}>
                      <View style={[styles.npkFill, { width: '85%', backgroundColor: '#3B82F6' }]} />
                    </View>
                    <Text style={styles.npkTag}>Excellent Root Strength</Text>
                  </View>
                </View>

                {/* Additional Soil Health Indicators */}
                <View style={styles.soilIndicatorsRow}>
                  <View style={styles.soilIndicator}>
                    <Text style={styles.soilIndLabel}>SOIL pH</Text>
                    <Text style={styles.soilIndVal}>{activePlot.ph.toFixed(1)} pH</Text>
                    <Text style={styles.soilIndSub}>Neutral Loam</Text>
                  </View>
                  <View style={styles.soilIndicator}>
                    <Text style={styles.soilIndLabel}>ROOT MOISTURE</Text>
                    <Text style={styles.soilIndVal}>{activePlot.moisturePct}%</Text>
                    <Text style={styles.soilIndSub}>Optimal Hydration</Text>
                  </View>
                  <View style={styles.soilIndicator}>
                    <Text style={styles.soilIndLabel}>SOIL TEMP</Text>
                    <Text style={styles.soilIndVal}>23.8°C</Text>
                    <Text style={styles.soilIndSub}>Active Microbiology</Text>
                  </View>
                </View>
              </View>

              {/* Smart Valve & Precision Irrigation Controller */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.eyebrow}>AUTOMATED DRIP VALVES</Text>
                    <Text style={styles.cardTitle}>Smart Flow Controller</Text>
                  </View>
                  <View
                    style={[
                      styles.valveStateBadge,
                      {
                        backgroundColor: activePlot.valveOpen
                          ? '#DCFCE7'
                          : '#F1F5F9',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.valveStateText,
                        {
                          color: activePlot.valveOpen ? '#15803D' : '#64748B',
                        },
                      ]}
                    >
                      {activePlot.valveOpen ? 'FLOWING' : 'CLOSED'}
                    </Text>
                  </View>
                </View>

                <View style={styles.valveControlCard}>
                  <View style={styles.valveInfoBlock}>
                    <Text style={styles.valveTitle}>
                      Drip Line Zone #1 — {activePlot.name}
                    </Text>
                    <Text style={styles.valveSubtitle}>
                      {activePlot.valveOpen
                        ? `Dispensing ${activePlot.flowLpm} L/min • Auto-shutoff in 35 mins`
                        : 'Scheduled auto-irrigation at 05:30 AM'}
                    </Text>
                  </View>

                  <Pressable
                    style={[
                      styles.valveToggleButton,
                      {
                        backgroundColor: activePlot.valveOpen
                          ? '#EF4444'
                          : '#2D7A31',
                      },
                    ]}
                    onPress={handleToggleValve}
                  >
                    <Text style={styles.valveToggleText}>
                      {activePlot.valveOpen ? 'Stop Flow' : 'Start Valve'}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.waterUsageBar}>
                  <Text style={styles.waterUsageLabel}>
                    Today&apos;s Consumed: 3,450 L • Saved vs flood irrigation: 7,800 L
                  </Text>
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
    backgroundColor: BG,
  },
  topBar: {
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  topBarInner: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: DARK,
  },
  topBarTitleBlock: {
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: DARK,
  },
  topBarSubtitle: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  syncBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  pageInner: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    gap: 16,
  },
  plotSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 4,
  },
  plotChip: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  plotChipActive: {
    backgroundColor: '#2D7A31',
    borderColor: '#2D7A31',
  },
  plotChipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK,
  },
  plotChipTitleActive: {
    color: '#FFFFFF',
  },
  plotChipSubtitle: {
    fontSize: 10,
    color: MUTED,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  plotChipSubtitleActive: {
    color: '#DCFCE7',
  },
  desktopSplit: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  mobileStack: {
    flexDirection: 'column',
    gap: 16,
  },
  column: {
    flex: 1,
    gap: 16,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    color: PRIMARY,
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
    marginTop: 2,
  },
  ndviBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  ndviBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
    fontVariant: ['tabular-nums'],
  },
  satelliteView: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  canopyOverlay: {
    gap: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  satGridRow: {
    flexDirection: 'row',
    gap: 4,
  },
  satCell: {
    flex: 1,
    height: 48,
    borderRadius: 4,
    opacity: 0.9,
  },
  satTelemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  satMetaText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  spectrumBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  spectrumSeg: {
    flex: 1,
  },
  spectrumLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spectrumLabel: {
    fontSize: 10,
    color: MUTED,
    fontWeight: '600',
  },
  harvestPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  harvestPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  harvestKpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  harvestKpiCell: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  harvestKpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: MUTED,
    textAlign: 'center',
  },
  harvestKpiVal: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  harvestKpiSub: {
    fontSize: 9,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  sensorStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  npkGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  npkCell: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  npkSymbol: {
    fontSize: 18,
    fontWeight: '900',
    color: PRIMARY,
  },
  npkName: {
    fontSize: 11,
    fontWeight: '700',
    color: DARK,
    marginTop: 2,
  },
  npkVal: {
    fontSize: 13,
    fontWeight: '800',
    color: DARK,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  npkTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  npkFill: {
    height: '100%',
  },
  npkTag: {
    fontSize: 9,
    color: MUTED,
    marginTop: 6,
    textAlign: 'center',
  },
  soilIndicatorsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  soilIndicator: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  soilIndLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: MUTED,
  },
  soilIndVal: {
    fontSize: 14,
    fontWeight: '800',
    color: DARK,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  soilIndSub: {
    fontSize: 9,
    color: PRIMARY,
    fontWeight: '600',
    marginTop: 1,
  },
  valveStateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  valveStateText: {
    fontSize: 10,
    fontWeight: '800',
  },
  valveControlCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  valveInfoBlock: {
    flex: 1,
  },
  valveTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK,
  },
  valveSubtitle: {
    fontSize: 11,
    color: MUTED,
    marginTop: 3,
  },
  valveToggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  valveToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  waterUsageBar: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  waterUsageLabel: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '600',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
