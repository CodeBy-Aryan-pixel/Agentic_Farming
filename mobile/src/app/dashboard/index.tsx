import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  PALETTE,
  UnifiedPageShell,
} from '@/components/UnifiedPageShell';
import { useLiveWeather } from '@/hooks/use-live-weather';
import { useGpsLocation } from '@/hooks/use-gps-location';
import {
  DEFAULT_FARM_CONTEXT,
  getCityDisplayName,
  runWeatherIrrigationAgent,
} from '@/services/weatherIrrigationAgent';
import {
  CROP_DOCTOR_ROUTE,
  WEATHER_IRRIGATION_ROUTE,
  FIELD_MONITOR_ROUTE,
  MARKET_ADVISOR_ROUTE,
  FPO_MARKET_ROUTE,
  CROP_ADVISOR_ROUTE,
  AGRI_SHOP_ROUTE,
  GOVT_SCHEMES_ROUTE,
} from '@/utils/navigation';

/* ─── Plot Telemetry Data ────────────────────────────────────────────── */
interface PlotItem {
  id: string;
  name: string;
  crop: string;
  acres: number;
  moisturePct: number;
  ndvi: number;
  ndviLabel: string;
  valveOpen: boolean;
}

const INITIAL_PLOTS: PlotItem[] = [
  {
    id: 'plot-a',
    name: 'Plot A (North Block)',
    crop: 'Sugarcane',
    acres: 2.5,
    moisturePct: 31,
    ndvi: 0.76,
    ndviLabel: 'Dense Canopy',
    valveOpen: false,
  },
  {
    id: 'plot-b',
    name: 'Plot B (East Ridge)',
    crop: 'Tomato',
    acres: 1.5,
    moisturePct: 19,
    ndvi: 0.84,
    ndviLabel: 'Vigorous',
    valveOpen: true,
  },
  {
    id: 'plot-c',
    name: 'Plot C (South Basin)',
    crop: 'Red Onion',
    acres: 1.8,
    moisturePct: 26,
    ndvi: 0.71,
    ndviLabel: 'Uniform',
    valveOpen: false,
  },
  {
    id: 'plot-d',
    name: 'Plot D (West Terrace)',
    crop: 'Soybean',
    acres: 1.2,
    moisturePct: 28,
    ndvi: 0.68,
    ndviLabel: 'Healthy',
    valveOpen: false,
  },
];

/* ─── 7-Day Mini Forecast Model ──────────────────────────────────────── */
const MINI_FORECAST = [
  { day: 'Mon', temp: 28, rain: 5, icon: 'sun' },
  { day: 'Tue', temp: 26, rain: 65, icon: 'cloud-rain' },
  { day: 'Wed', temp: 27, rain: 20, icon: 'cloud' },
  { day: 'Thu', temp: 29, rain: 0, icon: 'sun' },
  { day: 'Fri', temp: 31, rain: 0, icon: 'sun' },
  { day: 'Sat', temp: 30, rain: 10, icon: 'sun' },
  { day: 'Sun', temp: 29, rain: 15, icon: 'cloud' },
];

/* ─── Prescribed Inputs ──────────────────────────────────────────────── */
const PRESCRIBED_INPUTS = [
  {
    id: 'input-1',
    name: 'Amistar Top (Azoxystrobin + Difenoconazole)',
    category: 'Systemic Bio-Fungicide',
    dose: '200 ml / acre',
    price: 840,
    mrp: 960,
  },
  {
    id: 'input-2',
    name: 'Mahadhan 19-19-19 Soluble NPK',
    category: 'Water-Soluble Drip Fertilizer',
    dose: '5 kg / acre',
    price: 450,
    mrp: 520,
  },
  {
    id: 'input-3',
    name: 'Multiplex Bio-Neem 10,000 PPM',
    category: 'Botanical Insecticide',
    dose: '500 ml / acre',
    price: 360,
    mrp: 420,
  },
];

export default function UnifiedDashboardScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 680 && width < 1024;

  const { city, weather, selectLocation } = useLiveWeather();
  const gps = useGpsLocation(selectLocation);

  const report = useMemo(
    () => (weather ? runWeatherIrrigationAgent(weather, DEFAULT_FARM_CONTEXT) : null),
    [weather]
  );

  const current = report?.weather.current;
  const tempVal = current ? current.temperatureC.toFixed(1) : '27.4';
  const conditionLabel = current ? current.condition : 'Partly Cloudy';
  const humidityVal = current ? `${current.humidityPct}%` : '68%';
  const windVal = current ? `${current.windKmph} km/h` : '6.4 km/h';
  const soilMoistureVal = current ? `${current.soilMoistureRootZonePct}%` : '28.5%';
  const isRainExpected = (report?.weather.next24hRainProbabilityPct ?? 0) > 40;

  const [plots, setPlots] = useState<PlotItem[]>(INITIAL_PLOTS);

  const toggleValve = (plotId: string) => {
    setPlots((prev) =>
      prev.map((p) => (p.id === plotId ? { ...p, valveOpen: !p.valveOpen } : p))
    );
  };

  const activeValvesCount = plots.filter((p) => p.valveOpen).length;

  return (
    <UnifiedPageShell
      title="Farm Executive Dashboard"
      subtitle="Unified command center combining live telemetry, pathology, field twin, markets and agri-inputs"
      statusText="All 8 Systems Synced"
      backLabel="Back to Home"
      scrollable={true}
    >
      <View style={styles.mainContainer}>

        {/* ════════ ROW 1: WEATHER & IRRIGATION + FIELD TWIN (2-COL) ════════ */}
        <View style={[styles.rowSplit, isDesktop && styles.rowSplitDesk]}>

          {/* Card 1: Weather & Irrigation Live Status */}
          <View style={[styles.card, styles.colCard]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconBox}>
                  <Ionicons name="water-outline" size={20} color={PALETTE.brandEmerald} />
                </View>
                <View>
                  <Text style={styles.cardEyebrow}>LIVE TELEMETRY & WATER SCHEDULE</Text>
                  <Text style={styles.cardTitle}>Weather & Irrigation</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.gpsSmallBtn}
                onPress={() => gps.detect()}
                activeOpacity={0.7}
              >
                <Feather name="navigation" size={11} color={PALETTE.brandEmerald} />
                <Text style={styles.gpsSmallBtnText}>
                  {gps.detecting ? 'Locating…' : 'Sync GPS'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Location & Conditions */}
            <View style={styles.weatherSummaryRow}>
              <View>
                <Text style={styles.cityNameText}>{getCityDisplayName(city)}</Text>
                <Text style={styles.conditionText}>{conditionLabel} · Feels like 29°C</Text>
              </View>
              <Text style={styles.tempLargeText}>{tempVal}°C</Text>
            </View>

            {/* 3 Metrics Strip */}
            <View style={styles.metricsStrip}>
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>HUMIDITY</Text>
                <Text style={styles.metricVal}>{humidityVal}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>WIND SPEED</Text>
                <Text style={styles.metricVal}>{windVal}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>ROOT SOIL MOISTURE</Text>
                <Text style={styles.metricVal}>{soilMoistureVal}</Text>
              </View>
            </View>

            {/* Drip Prescription Callout */}
            <View style={styles.prescriptionBox}>
              <View style={styles.prescriptionLeft}>
                <Text style={styles.prescriptionLabel}>TODAY&apos;S DRIP PRESCRIPTION</Text>
                <Text style={styles.prescriptionVal}>
                  {isRainExpected ? '0 L/Acre (Rain Hold)' : '4,200 L/Acre (22 min cycle)'}
                </Text>
                <Text style={styles.prescriptionSub}>
                  {isRainExpected
                    ? 'Rain probability > 40% in next 24h. Postpone irrigation to prevent root rot.'
                    : 'Optimal evapotranspiration window between 06:30 – 09:00 AM.'}
                </Text>
              </View>
            </View>

            {/* 7-Day Mini Bar Forecast */}
            <View style={styles.forecastStrip}>
              {MINI_FORECAST.map((item) => (
                <View key={item.day} style={styles.forecastItem}>
                  <Text style={styles.forecastDay}>{item.day}</Text>
                  <Feather
                    name={item.icon === 'cloud-rain' ? 'cloud-rain' : item.icon === 'cloud' ? 'cloud' : 'sun'}
                    size={14}
                    color={item.rain > 30 ? '#0284C7' : '#D97706'}
                  />
                  <Text style={styles.forecastTemp}>{item.temp}°</Text>
                </View>
              ))}
            </View>

            {/* Action Link */}
            <TouchableOpacity
              style={styles.cardActionLink}
              onPress={() => router.push(WEATHER_IRRIGATION_ROUTE)}
              activeOpacity={0.7}
            >
              <Text style={styles.cardActionLinkText}>Open Irrigation Schedule</Text>
              <Feather name="arrow-right" size={14} color={PALETTE.brandEmerald} />
            </TouchableOpacity>
          </View>

          {/* Card 2: Field Digital Twin — 4 Plots Status */}
          <View style={[styles.card, styles.colCard]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconBox}>
                  <Feather name="grid" size={18} color={PALETTE.brandEmerald} />
                </View>
                <View>
                  <Text style={styles.cardEyebrow}>SATELLITE NDVI & VALVE ACTUATORS</Text>
                  <Text style={styles.cardTitle}>Field Digital Twin</Text>
                </View>
              </View>

              <View style={styles.plotSummaryPill}>
                <Text style={styles.plotSummaryPillText}>
                  {activeValvesCount} of 4 Valves Active
                </Text>
              </View>
            </View>

            {/* Interactive 4 Plots List */}
            <View style={styles.plotsList}>
              {plots.map((plot) => (
                <View key={plot.id} style={styles.plotRowItem}>
                  <View style={styles.plotLeftInfo}>
                    <View style={styles.plotTitleRow}>
                      <Text style={styles.plotName}>{plot.name}</Text>
                      <View style={styles.cropTag}>
                        <Text style={styles.cropTagText}>{plot.crop}</Text>
                      </View>
                    </View>

                    <View style={styles.plotMetricsRow}>
                      <Text style={styles.plotMetaText}>
                        NDVI <Text style={{ fontWeight: '700', color: PALETTE.brandDark }}>{plot.ndvi}</Text> ({plot.ndviLabel})
                      </Text>
                      <Text style={styles.plotMetaBullet}>•</Text>
                      <Text style={styles.plotMetaText}>
                        Moisture <Text style={{ fontWeight: '700', color: PALETTE.brandDark }}>{plot.moisturePct}%</Text>
                      </Text>
                    </View>
                  </View>

                  {/* 1-Tap Valve Toggle */}
                  <TouchableOpacity
                    style={[
                      styles.valveToggleBtn,
                      plot.valveOpen ? styles.valveToggleBtnOpen : styles.valveToggleBtnClosed,
                    ]}
                    onPress={() => toggleValve(plot.id)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.valveDot,
                        plot.valveOpen ? styles.valveDotOpen : styles.valveDotClosed,
                      ]}
                    />
                    <Text
                      style={[
                        styles.valveToggleText,
                        plot.valveOpen ? styles.valveToggleTextOpen : styles.valveToggleTextClosed,
                      ]}
                    >
                      {plot.valveOpen ? 'Valve Open' : 'Valve Closed'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Action Link */}
            <TouchableOpacity
              style={[styles.cardActionLink, { marginTop: 16 }]}
              onPress={() => router.push(FIELD_MONITOR_ROUTE)}
              activeOpacity={0.7}
            >
              <Text style={styles.cardActionLinkText}>Open Field Map</Text>
              <Feather name="arrow-right" size={14} color={PALETTE.brandEmerald} />
            </TouchableOpacity>
          </View>

        </View>

        {/* ════════ ROW 2: CROP DOCTOR + AGRI-SHOP RX KIT (2-COL) ════════ */}
        <View style={[styles.rowSplit, isDesktop && styles.rowSplitDesk]}>

          {/* Left Card: Deep Forest #0F291E Hero Card */}
          <View style={[styles.forestCard, styles.colCard]}>
            <View style={styles.forestCardHeader}>
              <View style={styles.forestIconBox}>
                <MaterialCommunityIcons name="leaf" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.forestEyebrow}>AI LEAF VISION & SPRAY WINDOW</Text>
                <Text style={styles.forestTitle}>Crop Doctor & Spray Sentinel</Text>
              </View>

              <View style={styles.forestStatusPill}>
                <Text style={styles.forestStatusPillText}>
                  {isRainExpected ? 'Rain Hold' : 'Safe to Spray'}
                </Text>
              </View>
            </View>

            <Text style={styles.forestHeadline}>
              Dual-Engine Leaf Pathology Scanner Online
            </Text>
            <Text style={styles.forestDescription}>
              Ensemble AI scans 38+ crop diseases, verifies non-leaf objects with Gatekeeper Shield, and checks wind & rain limits before recommending foliar cures.
            </Text>

            {/* Spray Sentinel Status Box */}
            <View style={styles.forestSprayBox}>
              <View style={styles.forestSprayItem}>
                <Feather name="wind" size={14} color="#86EFAC" />
                <Text style={styles.forestSprayText}>Wind: {windVal} (Max 15 km/h)</Text>
              </View>
              <View style={styles.forestSprayItem}>
                <Ionicons name="rainy-outline" size={14} color="#86EFAC" />
                <Text style={styles.forestSprayText}>Rain 24h: {isRainExpected ? '65% (Hold)' : '10% (Safe)'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.whiteScanBtn}
              onPress={() => router.push(CROP_DOCTOR_ROUTE)}
              activeOpacity={0.88}
            >
              <Feather name="camera" size={16} color={PALETTE.brandDark} />
              <Text style={styles.whiteScanBtnText}>Scan Crop Leaf</Text>
            </TouchableOpacity>
          </View>

          {/* Right Card: Agri-Shop Prescribed Cure & Fertilizer Kit */}
          <View style={[styles.card, styles.colCard]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconBox}>
                  <Feather name="shopping-bag" size={18} color={PALETTE.brandEmerald} />
                </View>
                <View>
                  <Text style={styles.cardEyebrow}>AUTHENTIC INPUTS & PRESCRIPTIONS</Text>
                  <Text style={styles.cardTitle}>Agri-Shop Input Kit</Text>
                </View>
              </View>

              <View style={styles.kitPill}>
                <Text style={styles.kitPillText}>Acreage Scaled</Text>
              </View>
            </View>

            {/* Inputs List */}
            <View style={styles.inputsList}>
              {PRESCRIBED_INPUTS.map((item) => (
                <View key={item.id} style={styles.inputItemRow}>
                  <View style={styles.inputIconBox}>
                    <Feather name="package" size={16} color={PALETTE.brandEmerald} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputName}>{item.name}</Text>
                    <Text style={styles.inputCat}>
                      {item.category} · {item.dose}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.inputPrice}>₹{item.price}</Text>
                    <Text style={styles.inputMrp}>MRP ₹{item.mrp}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Kit Total & Action */}
            <View style={styles.kitTotalRow}>
              <Text style={styles.kitTotalLabel}>Total Prescribed Kit (2 Acres):</Text>
              <Text style={styles.kitTotalPrice}>₹1,650</Text>
            </View>

            <TouchableOpacity
              style={styles.greenShopBtn}
              onPress={() => router.push(AGRI_SHOP_ROUTE)}
              activeOpacity={0.88}
            >
              <Feather name="shopping-bag" size={15} color="#FFFFFF" />
              <Text style={styles.greenShopBtnText}>Order in Agri-Shop</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* ════════ ROW 3: MARKETS + FPO + CROP ADVISOR + SCHEMES (4-GRID) ════ */}
        <View style={styles.gridSection}>
          <Text style={styles.sectionHeaderTitle}>Markets, FPO Buyers & Agronomic Planning</Text>

          <View style={[styles.quadGrid, (isDesktop || isTablet) && styles.quadGridMulti]}>

            {/* Card 1: Market Guard */}
            <View style={styles.gridCard}>
              <View style={styles.gridCardHeader}>
                <View style={styles.iconBox}>
                  <Feather name="trending-up" size={18} color={PALETTE.brandEmerald} />
                </View>
                <View style={styles.trendTag}>
                  <Text style={styles.trendTagText}>+4.2% This Week</Text>
                </View>
              </View>
              <Text style={styles.gridCardTitle}>Market Guard Live Rates</Text>
              <Text style={styles.gridCardDesc}>
                Track live APMC mandi prices and 14-day price trends across Maharashtra and Karnataka.
              </Text>

              <View style={styles.rateRows}>
                <View style={styles.rateRow}>
                  <Text style={styles.rateCommodity}>Red Onion (Nashik)</Text>
                  <Text style={styles.ratePrice}>₹2,140/q</Text>
                </View>
                <View style={styles.rateRow}>
                  <Text style={styles.rateCommodity}>Soybean (Latur)</Text>
                  <Text style={styles.ratePrice}>₹4,820/q</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.cardActionLink}
                onPress={() => router.push(MARKET_ADVISOR_ROUTE)}
                activeOpacity={0.7}
              >
                <Text style={styles.cardActionLinkText}>Check Mandi</Text>
                <Feather name="arrow-right" size={13} color={PALETTE.brandEmerald} />
              </TouchableOpacity>
            </View>

            {/* Card 2: FPO Direct Market */}
            <View style={styles.gridCard}>
              <View style={styles.gridCardHeader}>
                <View style={styles.iconBox}>
                  <Feather name="users" size={18} color={PALETTE.brandEmerald} />
                </View>
                <View style={styles.zeroComTag}>
                  <Text style={styles.zeroComTagText}>Zero Commission</Text>
                </View>
              </View>
              <Text style={styles.gridCardTitle}>FPO Direct Market</Text>
              <Text style={styles.gridCardDesc}>
                Bypass arhatiyas and brokers. Sell harvest directly to verified FPOs with guaranteed DBT payment.
              </Text>

              <View style={styles.fpoOfferBox}>
                <Text style={styles.fpoBuyerName}>Sahyadri Farmers Producer Co.</Text>
                <Text style={styles.fpoOfferPrice}>₹2,680/q • Onion (50Q target)</Text>
              </View>

              <TouchableOpacity
                style={styles.cardActionLink}
                onPress={() => router.push(FPO_MARKET_ROUTE)}
                activeOpacity={0.7}
              >
                <Text style={styles.cardActionLinkText}>Sell Direct</Text>
                <Feather name="arrow-right" size={13} color={PALETTE.brandEmerald} />
              </TouchableOpacity>
            </View>

            {/* Card 3: Crop Advisor ROI */}
            <View style={styles.gridCard}>
              <View style={styles.gridCardHeader}>
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons name="sprout" size={18} color={PALETTE.brandEmerald} />
                </View>
                <View style={styles.roiTag}>
                  <Text style={styles.roiTagText}>3.4× ROI Potential</Text>
                </View>
              </View>
              <Text style={styles.gridCardTitle}>Crop Advisor ROI Planner</Text>
              <Text style={styles.gridCardDesc}>
                Agronomic matching based on your black loam soil, water source, and upcoming Rabi/Kharif season.
              </Text>

              <View style={styles.cropPickBox}>
                <Text style={styles.cropPickName}>Sharbati Wheat (HD-2967)</Text>
                <Text style={styles.cropPickProfit}>Est. Net Profit: ₹68,500/Acre</Text>
              </View>

              <TouchableOpacity
                style={styles.cardActionLink}
                onPress={() => router.push(CROP_ADVISOR_ROUTE)}
                activeOpacity={0.7}
              >
                <Text style={styles.cardActionLinkText}>Explore Crops</Text>
                <Feather name="arrow-right" size={13} color={PALETTE.brandEmerald} />
              </TouchableOpacity>
            </View>

            {/* Card 4: Govt Schemes & Subsidies */}
            <View style={styles.gridCard}>
              <View style={styles.gridCardHeader}>
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons name="bank" size={18} color={PALETTE.brandEmerald} />
                </View>
                <View style={styles.schemeTag}>
                  <Text style={styles.schemeTagText}>2 Eligible Grants</Text>
                </View>
              </View>
              <Text style={styles.gridCardTitle}>Govt. Schemes & Subsidies</Text>
              <Text style={styles.gridCardDesc}>
                Eligibility checker and 1-tap direct links to official ministry portals for agricultural grants.
              </Text>

              <View style={styles.schemesListBox}>
                <Text style={styles.schemeItem}>• PMKSY: 55% Drip Subsidy</Text>
                <Text style={styles.schemeItem}>• PM-KISAN: ₹6,000/yr Direct DBT</Text>
              </View>

              <TouchableOpacity
                style={styles.cardActionLink}
                onPress={() => router.push(GOVT_SCHEMES_ROUTE)}
                activeOpacity={0.7}
              >
                <Text style={styles.cardActionLinkText}>View Schemes</Text>
                <Feather name="arrow-right" size={13} color={PALETTE.brandEmerald} />
              </TouchableOpacity>
            </View>

          </View>
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

  /* 2-Column Split Layout */
  rowSplit: {
    flexDirection: 'column',
    gap: 20,
  },
  rowSplitDesk: {
    flexDirection: 'row',
  },
  colCard: {
    flex: 1,
  },

  /* Clean Standard Card */
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

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: PALETTE.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    color: PALETTE.brandEmerald,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.brandDark,
    letterSpacing: -0.3,
  },

  gpsSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PALETTE.sageTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gpsSmallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.brandEmerald,
  },

  weatherSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cityNameText: {
    fontSize: 17,
    fontWeight: '700',
    color: PALETTE.brandDark,
  },
  conditionText: {
    fontSize: 12.5,
    color: PALETTE.textMuted,
    marginTop: 2,
  },
  tempLargeText: {
    fontSize: 32,
    fontWeight: '700',
    color: PALETTE.brandDark,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },

  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.pillBg,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: PALETTE.border,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: PALETTE.textMuted,
    letterSpacing: 0.5,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.brandDark,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },

  prescriptionBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: PALETTE.sageTint,
    borderWidth: 1,
    borderColor: '#D4E7D6',
    marginBottom: 14,
  },
  prescriptionLeft: {},
  prescriptionLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: PALETTE.brandEmerald,
    letterSpacing: 0.8,
  },
  prescriptionVal: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.brandDark,
    marginTop: 2,
  },
  prescriptionSub: {
    fontSize: 11.5,
    color: PALETTE.textMuted,
    marginTop: 3,
    lineHeight: 16,
  },

  forecastStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    marginBottom: 14,
  },
  forecastItem: {
    alignItems: 'center',
    gap: 4,
  },
  forecastDay: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textMuted,
  },
  forecastTemp: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.brandDark,
    fontVariant: ['tabular-nums'],
  },

  cardActionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  cardActionLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.brandEmerald,
  },

  /* Plot Digital Twin */
  plotSummaryPill: {
    backgroundColor: PALETTE.pillBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  plotSummaryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.pillText,
  },
  plotsList: {
    gap: 10,
  },
  plotRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#FAFCFA',
    gap: 12,
  },
  plotLeftInfo: {
    flex: 1,
  },
  plotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plotName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.brandDark,
  },
  cropTag: {
    backgroundColor: PALETTE.sageTint,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  cropTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.brandEmerald,
  },
  plotMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  plotMetaText: {
    fontSize: 11.5,
    color: PALETTE.textMuted,
  },
  plotMetaBullet: {
    fontSize: 10,
    color: PALETTE.border,
  },

  valveToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  valveToggleBtnOpen: {
    backgroundColor: PALETTE.sageTint,
    borderWidth: 1,
    borderColor: '#BFE3BD',
  },
  valveToggleBtnClosed: {
    backgroundColor: PALETTE.pillBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  valveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  valveDotOpen: {
    backgroundColor: PALETTE.brandEmerald,
  },
  valveDotClosed: {
    backgroundColor: '#9CA3AF',
  },
  valveToggleText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  valveToggleTextOpen: {
    color: PALETTE.brandEmerald,
  },
  valveToggleTextClosed: {
    color: '#6B7280',
  },

  /* Row 2: Deep Forest Card */
  forestCard: {
    backgroundColor: PALETTE.brandDark,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#102A13',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  forestCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  forestIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  forestEyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#86EFAC',
    letterSpacing: 1,
  },
  forestTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  forestStatusPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  forestStatusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#86EFAC',
  },
  forestHeadline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  forestDescription: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 16,
  },
  forestSprayBox: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  forestSprayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  forestSprayText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  whiteScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
    paddingVertical: 12,
    borderRadius: 12,
  },
  whiteScanBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.brandDark,
  },

  /* Agri-Shop Inputs */
  kitPill: {
    backgroundColor: PALETTE.sageTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  kitPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.brandEmerald,
  },
  inputsList: {
    gap: 10,
    marginBottom: 14,
  },
  inputItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#FAFCFA',
  },
  inputIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: PALETTE.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.brandDark,
  },
  inputCat: {
    fontSize: 11,
    color: PALETTE.textMuted,
    marginTop: 1,
  },
  inputPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.brandDark,
    fontVariant: ['tabular-nums'],
  },
  inputMrp: {
    fontSize: 10.5,
    color: PALETTE.textSubtle,
    textDecorationLine: 'line-through',
    fontVariant: ['tabular-nums'],
  },
  kitTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    marginBottom: 14,
  },
  kitTotalLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.textMuted,
  },
  kitTotalPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.brandDark,
    fontVariant: ['tabular-nums'],
  },
  greenShopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PALETTE.brandEmerald,
    minHeight: 48,
    paddingVertical: 12,
    borderRadius: 12,
  },
  greenShopBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Row 3: 4-Card Summary Grid */
  gridSection: {
    marginTop: 10,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.brandDark,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  quadGrid: {
    flexDirection: 'column',
    gap: 20,
  },
  quadGridMulti: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCard: {
    flex: 1,
    minWidth: 260,
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
  gridCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trendTag: {
    backgroundColor: PALETTE.sageTint,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.brandEmerald,
  },
  zeroComTag: {
    backgroundColor: PALETTE.sageTint,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  zeroComTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.brandEmerald,
  },
  roiTag: {
    backgroundColor: PALETTE.sageTint,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roiTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.brandEmerald,
  },
  schemeTag: {
    backgroundColor: PALETTE.sageTint,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  schemeTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.brandEmerald,
  },
  gridCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.brandDark,
    marginBottom: 4,
  },
  gridCardDesc: {
    fontSize: 12,
    color: PALETTE.textMuted,
    lineHeight: 16,
    marginBottom: 14,
  },

  rateRows: {
    gap: 6,
    padding: 10,
    borderRadius: 8,
    backgroundColor: PALETTE.pillBg,
    marginBottom: 14,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rateCommodity: {
    fontSize: 12,
    color: PALETTE.textMuted,
  },
  ratePrice: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.brandDark,
    fontVariant: ['tabular-nums'],
  },

  fpoOfferBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: PALETTE.pillBg,
    marginBottom: 14,
  },
  fpoBuyerName: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.brandDark,
  },
  fpoOfferPrice: {
    fontSize: 11.5,
    color: PALETTE.brandEmerald,
    fontWeight: '600',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },

  cropPickBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: PALETTE.pillBg,
    marginBottom: 14,
  },
  cropPickName: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.brandDark,
  },
  cropPickProfit: {
    fontSize: 11.5,
    color: PALETTE.brandEmerald,
    fontWeight: '600',
    marginTop: 2,
  },

  schemesListBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: PALETTE.pillBg,
    marginBottom: 14,
    gap: 3,
  },
  schemeItem: {
    fontSize: 11.5,
    color: PALETTE.textMuted,
  },
});
