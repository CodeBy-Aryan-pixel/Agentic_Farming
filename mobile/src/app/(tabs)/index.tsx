import React, { useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, type Href } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ActionButton } from '@/components/ActionButton';
import {
  ADMIN_ROUTE,
  AGRI_SHOP_ROUTE,
  AI_ASSISTANT_ROUTE,
  AUTH_ROUTE,
  CROP_ADVISOR_ROUTE,
  CROP_DOCTOR_ROUTE,
  FIELD_MONITOR_ROUTE,
  FPO_MARKET_ROUTE,
  GOVT_SCHEMES_ROUTE,
  GUIDE_ROUTE,
  MARKET_ADVISOR_ROUTE,
  WEATHER_IRRIGATION_ROUTE,
} from '@/utils/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLiveWeather } from '@/hooks/use-live-weather';
import { useGpsLocation } from '@/hooks/use-gps-location';
import {
  DEFAULT_FARM_CONTEXT,
  getCityDisplayName,
  runWeatherIrrigationAgent,
} from '@/services/weatherIrrigationAgent';

/* ─── Design Tokens (Apple Health / Stripe Clean Palette) ────────────── */
const BRAND_DARK = '#0F291E';
const BRAND_EMERALD = '#15803D';
const BG_PAGE = '#F7F9F7';
const CARD_BG = '#FFFFFF';
const BORDER_SUBTLE = '#E6ECE6';
const TEXT_PRIMARY = '#111827';
const TEXT_MUTED = '#6B7280';
const SAGE_TINT = '#EDF5EE';

/* ─── 8 Clean Farm Services & Tools Configuration ───────────────────── */
interface ServiceTool {
  id: string;
  title: string;
  pill: string;
  description: string;
  linkText: string;
  route: Href;
  renderIcon: () => React.ReactNode;
}

const SERVICES: ServiceTool[] = [
  {
    id: 'crop-doctor',
    title: 'Crop Doctor',
    pill: 'AI Leaf Scanner',
    description: 'Upload a leaf photo to detect diseases and get step-by-step cure instructions.',
    linkText: 'Scan a leaf',
    route: CROP_DOCTOR_ROUTE,
    renderIcon: () => (
      <MaterialCommunityIcons name="leaf-circle-outline" size={24} color={BRAND_EMERALD} />
    ),
  },
  {
    id: 'weather',
    title: 'Weather & Irrigation',
    pill: 'Live Forecast',
    description: 'Check All-India local weather, soil moisture, and exact daily drip water schedules.',
    linkText: 'View schedule',
    route: WEATHER_IRRIGATION_ROUTE,
    renderIcon: () => (
      <Ionicons name="water-outline" size={24} color={BRAND_EMERALD} />
    ),
  },
  {
    id: 'field',
    title: 'Field Digital Twin',
    pill: '4 Plots Active',
    description: 'Monitor plot-by-plot crop health, NPK soil levels, and smart irrigation valves.',
    linkText: 'View farm map',
    route: FIELD_MONITOR_ROUTE,
    renderIcon: () => (
      <Feather name="grid" size={22} color={BRAND_EMERALD} />
    ),
  },
  {
    id: 'advisor',
    title: 'Crop Advisor',
    pill: 'Season Planner',
    description: 'Find the most profitable crops to plant based on your soil type and season.',
    linkText: 'Explore crops',
    route: CROP_ADVISOR_ROUTE,
    renderIcon: () => (
      <MaterialCommunityIcons name="sprout-outline" size={24} color={BRAND_EMERALD} />
    ),
  },
  {
    id: 'market',
    title: 'Market Guard',
    pill: 'Mandi Prices',
    description: 'Track live APMC mandi rates, 14-day price trends, and check fair trader deductions.',
    linkText: 'Check prices',
    route: MARKET_ADVISOR_ROUTE,
    renderIcon: () => (
      <Feather name="trending-up" size={22} color={BRAND_EMERALD} />
    ),
  },
  {
    id: 'fpo',
    title: 'FPO Direct Market',
    pill: 'Zero Commission',
    description: 'Sell your harvest directly to verified Farmer Producer Organizations and bulk buyers.',
    linkText: 'Sell harvest',
    route: FPO_MARKET_ROUTE,
    renderIcon: () => (
      <Feather name="users" size={22} color={BRAND_EMERALD} />
    ),
  },
  {
    id: 'shop',
    title: 'Agri-Shop',
    pill: 'Verified Inputs',
    description: 'Order authentic pesticides, fungicides, seeds, and fertilizers prescribed for your crop.',
    linkText: 'Browse store',
    route: AGRI_SHOP_ROUTE,
    renderIcon: () => (
      <Feather name="shopping-bag" size={22} color={BRAND_EMERALD} />
    ),
  },
  {
    id: 'govt',
    title: 'Govt. Schemes',
    pill: 'Subsidies',
    description: 'Check eligibility and apply for PM-KISAN, drip irrigation grants, and crop insurance.',
    linkText: 'View schemes',
    route: GOVT_SCHEMES_ROUTE,
    renderIcon: () => (
      <MaterialCommunityIcons name="bank-outline" size={24} color={BRAND_EMERALD} />
    ),
  },
];

/* ─── Weather Condition Icon Resolver ───────────────────────────────── */
function getWeatherIcon(code: number) {
  if (code >= 51 && code <= 67) {
    return <Ionicons name="rainy-outline" size={30} color="#0284C7" />;
  }
  if (code >= 80 && code <= 82) {
    return <Ionicons name="rainy-outline" size={30} color="#0284C7" />;
  }
  if (code >= 95) {
    return <Ionicons name="thunderstorm-outline" size={30} color="#6366F1" />;
  }
  if (code === 0) {
    return <Ionicons name="sunny-outline" size={30} color="#F59E0B" />;
  }
  if (code === 1) {
    return <Ionicons name="partly-sunny-outline" size={30} color="#F59E0B" />;
  }
  if (code === 2 || code === 3) {
    return <Ionicons name="cloudy-outline" size={30} color="#6B7280" />;
  }
  return <Ionicons name="partly-sunny-outline" size={30} color={BRAND_EMERALD} />;
}

/* ─── Main Home Screen ──────────────────────────────────────────────── */
export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isLargeDesktop = width >= 1100;

  // Live Weather & GPS Telemetry
  const { city, weather, selectLocation } = useLiveWeather();
  const gps = useGpsLocation(selectLocation);
  const {
    user,
    activeBroadcast,
    logout,
    registrationBanner,
    dismissRegistrationBanner,
  } = useAuth();
  const [broadcastDismissed, setBroadcastDismissed] = useState(false);

  const report = useMemo(
    () => (weather ? runWeatherIrrigationAgent(weather, DEFAULT_FARM_CONTEXT) : null),
    [weather]
  );

  const current = report?.weather.current;
  const hydro = report?.hydro;
  const isRainExpected = (report?.weather.next24hRainProbabilityPct ?? 0) > 40;

  // Telemetry fallbacks
  const tempVal = current ? current.temperatureC.toFixed(1) : '22.8';
  const conditionLabel = current ? current.condition : 'Overcast';
  const feelsLikeVal = current ? current.apparentTemperatureC.toFixed(0) : '26';
  const humidityVal = current ? `${current.humidityPct}%` : '85%';
  const windVal = current ? `${current.windKmph} km/h` : '3.5 km/h';
  const soilVal = current ? `${current.soilMoistureRootZonePct}%` : '27.5%';
  const weatherCode = current ? current.weatherCode : 3;

  // 1-sentence live agronomic takeaway
  const agronomicAdvice = useMemo(() => {
    if (isRainExpected) {
      return 'Rain is likely in the next 24h — pause irrigation today and hold foliar chemical sprays.';
    }
    return 'Field conditions are calm today — optimal for foliar spray absorption and scheduled drip cycles.';
  }, [isRainExpected]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesk]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.wrapper, isDesktop && styles.wrapperDesk]}>

          {/* ════════ MOBILE APP BAR (Shown only on mobile viewports) ════════ */}
          {!isDesktop && (
            <View style={styles.mobileHeader}>
              <View style={styles.mobileBrandRow}>
                <MaterialCommunityIcons name="sprout" size={22} color={BRAND_EMERALD} />
                <Text style={styles.mobileBrandName}>Future Farming</Text>
              </View>

              <View style={styles.mobileHeaderRight}>
                <Pressable
                  style={styles.mobileLocationBtn}
                  onPress={() => router.push('/weather-irrigation')}
                  accessibilityRole="button"
                  accessibilityLabel="Location"
                >
                  <Feather name="map-pin" size={13} color={BRAND_EMERALD} />
                  <Text style={styles.mobileLocationText}>{city.shortName}</Text>
                </Pressable>

                {user ? (
                  <View style={styles.mobileUserPill}>
                    <Feather
                      name={user.role === 'admin' ? 'shield' : 'user'}
                      size={12}
                      color={BRAND_EMERALD}
                    />
                    <Text style={styles.mobileUserPillText} numberOfLines={1}>
                      {user.role.toUpperCase()}
                    </Text>
                  </View>
                ) : null}

                {user ? (
                  <Pressable
                    style={styles.mobileLogoutBtn}
                    onPress={async () => {
                      await logout();
                      router.replace(AUTH_ROUTE);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Log Out"
                  >
                    <Feather name="log-out" size={12} color="#B91C1C" />
                    <Text style={styles.mobileLogoutBtnText}>Logout</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )}

          {/* ════════ REGISTRATION & NOTIFICATION CONFIRMATION BANNER ════════ */}
          {registrationBanner && (
            <View style={styles.regSuccessBanner}>
              <View style={styles.regSuccessLeft}>
                <View style={styles.regSuccessIconBox}>
                  <Feather name="check-circle" size={18} color="#15803D" />
                </View>
                <View style={styles.regSuccessContent}>
                  <View style={styles.regSuccessTitleRow}>
                    <Text style={styles.regSuccessTitle}>
                      Registration Successfully Completed!
                    </Text>
                    <View style={styles.regSuccessBadge}>
                      <Text style={styles.regSuccessBadgeText}>SMS & Email Dispatched</Text>
                    </View>
                  </View>
                  <Text style={styles.regSuccessDetails}>
                    Welcome SMS sent to {registrationBanner.phone.startsWith('+91') ? registrationBanner.phone : `+91 ${registrationBanner.phone}`} and Confirmation Email sent to {registrationBanner.email}.
                  </Text>
                  {registrationBanner.emailPreviewUrl ? (
                    <TouchableOpacity
                      style={styles.emailReceiptBtn}
                      onPress={() => {
                        if (registrationBanner.emailPreviewUrl) {
                          Linking.openURL(registrationBanner.emailPreviewUrl).catch((err) =>
                            console.warn('[Home] Cannot open email receipt:', err)
                          );
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Feather name="external-link" size={12} color="#15803D" />
                      <Text style={styles.emailReceiptBtnText}>View Sent Email Receipt ↗</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
              <Pressable
                style={styles.regSuccessDismissBtn}
                onPress={dismissRegistrationBanner}
                accessibilityRole="button"
                accessibilityLabel="Dismiss confirmation banner"
              >
                <Feather name="x" size={16} color="#6B7280" />
              </Pressable>
            </View>
          )}

          {/* ════════ ADMIN BROADCAST ADVISORY BANNER (If Active) ════════ */}
          {activeBroadcast && !broadcastDismissed && (
            <View
              style={[
                styles.broadcastBanner,
                activeBroadcast.severity === 'critical'
                  ? styles.broadcastBannerCritical
                  : styles.broadcastBannerWarning,
              ]}
            >
              <View style={styles.broadcastLeft}>
                <View
                  style={[
                    styles.broadcastIconBox,
                    activeBroadcast.severity === 'critical'
                      ? styles.broadcastIconBoxCritical
                      : styles.broadcastIconBoxWarning,
                  ]}
                >
                  <Feather
                    name="alert-triangle"
                    size={16}
                    color={
                      activeBroadcast.severity === 'critical'
                        ? '#DC2626'
                        : '#D97706'
                    }
                  />
                </View>
                <View style={styles.broadcastContent}>
                  <View style={styles.broadcastHeadlineRow}>
                    <Text style={styles.broadcastDistrictBadge}>
                      {activeBroadcast.district}
                    </Text>
                    <Text style={styles.broadcastTitle}>
                      {activeBroadcast.title}
                    </Text>
                  </View>
                  <Text style={styles.broadcastMessage}>
                    {activeBroadcast.message}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.broadcastDismissBtn}
                onPress={() => setBroadcastDismissed(true)}
                accessibilityRole="button"
                accessibilityLabel="Dismiss advisory banner"
              >
                <Feather name="x" size={16} color="#6B7280" />
              </Pressable>
            </View>
          )}

          {/* ════════ SECTION 1: TODAY'S FARM OVERVIEW (2 Columns) ════════ */}
          <View style={[styles.todayOverview, isDesktop && styles.todayOverviewDesk]}>

            {/* Left Card: Deep Forest #0F291E Clean Welcome & Actions */}
            <View style={[styles.welcomeCard, isDesktop && styles.welcomeCardDesk]}>
              <Text style={styles.welcomeGreeting}>
                Good Day, {user ? user.fullName.split(' ')[0] : 'Farmer'}
              </Text>
              <Text style={styles.welcomeLocation}>
                {user?.district || getCityDisplayName(city)}
                {user?.role === 'farmer' && user?.farmSizeAcres
                  ? ` • ${user.farmSizeAcres} Acres (${user.primaryCrop || 'Sugarcane'})`
                  : ''}
              </Text>

              <Text style={styles.welcomeHeadline}>
                Your farm is protected & monitored.
              </Text>

              <Text style={styles.welcomeAdvice}>
                {agronomicAdvice}
              </Text>

              <View style={styles.welcomeActionRow}>
                <ActionButton
                  label="Scan Crop Leaf"
                  icon="camera"
                  iconSize={17}
                  variant="heroPrimary"
                  onPress={() => router.push(CROP_DOCTOR_ROUTE)}
                  accessibilityLabel="Scan Crop Leaf"
                  style={styles.welcomeActionButton}
                  textStyle={styles.heroPrimaryLabel}
                />

                <ActionButton
                  label="Ask Kisan Assistant"
                  icon="message-circle"
                  iconSize={17}
                  variant="heroGlass"
                  onPress={() => router.push(AI_ASSISTANT_ROUTE)}
                  accessibilityLabel="Ask Kisan Assistant"
                  style={styles.welcomeActionButton}
                  textStyle={styles.heroGlassLabel}
                />
              </View>
            </View>

            {/* Right Card: Crisp White #FFFFFF Live Weather & Irrigation */}
            <View style={[styles.weatherCard, isDesktop && styles.weatherCardDesk]}>
              {/* Top Row: Location + GPS Link on Left; Condition Icon on Right */}
              <View style={styles.weatherTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.weatherCityText} numberOfLines={1}>
                    {getCityDisplayName(city)}
                  </Text>
                  <TouchableOpacity
                    style={styles.gpsLink}
                    onPress={() => {
                      void gps.detect();
                    }}
                    activeOpacity={0.7}
                  >
                    <Feather name="navigation" size={12} color={BRAND_EMERALD} />
                    <Text style={styles.gpsLinkText}>
                      {gps.detecting ? 'Locating farm…' : 'Use My GPS'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.weatherIconContainer}>
                  {getWeatherIcon(weatherCode)}
                </View>
              </View>

              {/* Main Temperature Row */}
              <View style={styles.tempRow}>
                <Text style={styles.tempNumber}>
                  {tempVal}<Text style={styles.tempDegree}>°C</Text>
                </Text>
                <View style={styles.tempMeta}>
                  <Text style={styles.tempCondition}>{conditionLabel}</Text>
                  <Text style={styles.tempFeels}>Feels like {feelsLikeVal}°C</Text>
                </View>
              </View>

              {/* Clean 3-Metric Row (Separated by subtle hairlines) */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <View style={styles.metricHeader}>
                    <Ionicons name="water-outline" size={14} color={BRAND_EMERALD} />
                    <Text style={styles.metricLabel}>Humidity</Text>
                  </View>
                  <Text style={styles.metricValue}>{humidityVal}</Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricItem}>
                  <View style={styles.metricHeader}>
                    <Feather name="wind" size={13} color={BRAND_EMERALD} />
                    <Text style={styles.metricLabel}>Wind Speed</Text>
                  </View>
                  <Text style={styles.metricValue}>{windVal}</Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricItem}>
                  <View style={styles.metricHeader}>
                    <MaterialCommunityIcons name="sprout-outline" size={15} color={BRAND_EMERALD} />
                    <Text style={styles.metricLabel}>Soil Moisture</Text>
                  </View>
                  <Text style={styles.metricValue}>{soilVal}</Text>
                </View>
              </View>

              {/* Bottom Action Banner */}
              <TouchableOpacity
                style={[
                  styles.prescriptionBanner,
                  isRainExpected ? styles.bannerRain : styles.bannerWater,
                ]}
                onPress={() => router.push(WEATHER_IRRIGATION_ROUTE)}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 }}>
                  <Ionicons
                    name={isRainExpected ? 'shield-checkmark-outline' : 'water-outline'}
                    size={16}
                    color={isRainExpected ? '#0284C7' : BRAND_EMERALD}
                  />
                  <Text
                    style={[
                      styles.prescriptionText,
                      { color: isRainExpected ? '#0284C7' : BRAND_EMERALD },
                    ]}
                    numberOfLines={1}
                  >
                    {isRainExpected
                      ? 'Rain Lock Active — Skip irrigation today'
                      : hydro && hydro.totalLiters > 0
                      ? `Recommended: ${hydro.litersPerAcre.toLocaleString()} L/Acre`
                      : 'Soil moisture optimal — No irrigation needed'}
                  </Text>
                </View>

                <Text style={[styles.forecastLink, { color: isRainExpected ? '#0284C7' : BRAND_EMERALD }]}>
                  View 7-Day Forecast →
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ════════ FARMER ONBOARDING & USER MANUAL BANNER ════════ */}
          <View style={styles.guideBannerCard}>
            <View style={styles.guideBannerLeft}>
              <View style={styles.guideIconBox}>
                <Feather name="book-open" size={22} color={BRAND_EMERALD} />
              </View>
              <View style={styles.guideTextCol}>
                <View style={styles.guideBadgeRow}>
                  <View style={styles.guideBadge}>
                    <Text style={styles.guideBadgeText}>FIRST-TIME FARMER GUIDE</Text>
                  </View>
                  <View style={styles.guideLangBadge}>
                    <Text style={styles.guideLangBadgeText}>EN • मराठी • हिंदी</Text>
                  </View>
                </View>
                <Text style={styles.guideHeadline}>
                  New to Future Farming? Learn how to scan crops, schedule irrigation, and order farm inputs step-by-step.
                </Text>
                <Text style={styles.guideSub}>
                  Illustrated tutorials, audio voice assistant, and official government scheme guides.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.guideOpenButton}
              onPress={() => router.push(GUIDE_ROUTE)}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Open Step-by-Step User Manual"
            >
              <Feather name="book-open" size={15} color="#FFFFFF" />
              <Text style={styles.guideOpenButtonText}>
                Open Step-by-Step User Manual (EN / मराठी / हिंदी) →
              </Text>
            </TouchableOpacity>
          </View>

          {/* ════════ SECTION 2: FARM SERVICES & TOOLS ════════ */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Farm Services & Tools</Text>
            <Text style={styles.sectionSubtitle}>
              Essential management tools designed for your daily farm operations
            </Text>
          </View>

          <View style={[styles.servicesGrid, isDesktop && styles.servicesGridDesk]}>
            {SERVICES.map((tool) => {
              const cardWidth = isDesktop
                ? isLargeDesktop
                  ? styles.gridQuarter
                  : styles.gridHalf
                : styles.gridFull;

              return (
                <TouchableOpacity
                  key={tool.id}
                  style={[styles.serviceCard, cardWidth]}
                  onPress={() => router.push(tool.route)}
                  activeOpacity={0.88}
                >
                  {/* Top Row: 44x44 Sage Icon Box + Subtle Status Pill */}
                  <View style={styles.serviceTopRow}>
                    <View style={styles.iconSquare}>
                      {tool.renderIcon()}
                    </View>
                    <View style={styles.subtlePill}>
                      <Text style={styles.subtlePillText}>{tool.pill}</Text>
                    </View>
                  </View>

                  {/* Title & 2-Line Human Description */}
                  <Text style={styles.serviceTitle}>{tool.title}</Text>
                  <Text style={styles.serviceDescription} numberOfLines={2}>
                    {tool.description}
                  </Text>

                  {/* Clean Bottom Link */}
                  <View style={styles.serviceBottomLink}>
                    <Text style={styles.linkText}>{tool.linkText}</Text>
                    <Feather name="arrow-right" size={14} color={BRAND_EMERALD} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ════════ SECTION 3: KISAN HELP DESK BAR ════════ */}
          <View style={[styles.helpDeskCard, isDesktop && styles.helpDeskCardDesk]}>
            <View style={styles.helpDeskLeft}>
              <View style={styles.helpDeskIconBox}>
                <Feather name="mic" size={22} color={BRAND_EMERALD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.helpDeskTitle}>
                  Need farming advice in Marathi, Hindi, or English?
                </Text>
                <Text style={styles.helpDeskSubtitle}>
                  Ask our voice and chat assistant any question about your crops, weather, or market rates.
                </Text>
              </View>
            </View>

            <ActionButton
              label="Start Conversation"
              icon="arrow-right"
              variant="primary"
              onPress={() => router.push(AI_ASSISTANT_ROUTE)}
              accessibilityLabel="Start Conversation"
              style={styles.helpDeskAction}
            />
          </View>

          {/* ════════ CLEAN QUIET FOOTER ════════ */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>
              Future Farming • Designed for Indian Agriculture
            </Text>
            <Text style={styles.footerSub}>
              Satellite telemetry, crop diagnostics, and market intelligence.
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Stylesheet ────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_PAGE,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 48,
  },
  contentDesk: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 64,
  },
  wrapper: {
    width: '100%',
  },
  wrapperDesk: {
    maxWidth: 1240,
    alignSelf: 'center',
  },

  /* Mobile App Bar */
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  mobileBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileBrandName: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND_DARK,
    letterSpacing: -0.3,
  },
  mobileLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: CARD_BG,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
  },
  mobileLocationText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  mobileHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileUserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDF5EE',
    borderWidth: 1,
    borderColor: '#C6E2CD',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  mobileUserPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F291E',
  },
  mobileLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  mobileLogoutBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },

  /* Admin Broadcast Advisory Banner */
  broadcastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    gap: 12,
  },
  broadcastBannerWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  broadcastBannerCritical: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  broadcastLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  broadcastIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  broadcastIconBoxWarning: {
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
  },
  broadcastIconBoxCritical: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
  },
  broadcastContent: {
    flex: 1,
    gap: 2,
  },
  broadcastHeadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  broadcastDistrictBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  broadcastTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#78350F',
  },
  broadcastMessage: {
    fontSize: 12.5,
    color: '#92400E',
    lineHeight: 18,
    marginTop: 2,
  },
  broadcastDismissBtn: {
    padding: 6,
    alignSelf: 'flex-start',
  },

  /* Section 1: Today's Farm Overview (2 Columns) */
  todayOverview: {
    gap: 16,
    marginBottom: 28,
  },
  todayOverviewDesk: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 20,
  },

  /* Left Welcome Card */
  welcomeCard: {
    backgroundColor: BRAND_DARK,
    borderRadius: 24,
    padding: 24,
    shadowColor: BRAND_DARK,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    justifyContent: 'space-between',
  },
  welcomeCardDesk: {
    flex: 1.05,
    padding: 24,
  },
  welcomeGreeting: {
    fontSize: 13,
    fontWeight: '600',
    color: '#86EFAC',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  welcomeLocation: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  welcomeHeadline: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 14,
    letterSpacing: -0.3,
  },
  welcomeAdvice: {
    fontSize: 13.5,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.82)',
    marginTop: 10,
  },
  welcomeActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 22,
  },
  welcomeActionButton: {
    flexGrow: 1,
    flexBasis: 180,
  },
  heroPrimaryLabel: {
    color: '#0F291E',
    fontWeight: '700',
    fontSize: 14,
  },
  heroGlassLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  btnScan: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  btnScanText: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_DARK,
  },
  btnAsk: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnAskText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* Right Weather Card */
  weatherCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    shadowColor: BRAND_DARK,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    justifyContent: 'space-between',
  },
  weatherCardDesk: {
    flex: 1.15,
    padding: 24,
  },
  weatherTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  weatherCityText: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  gpsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  gpsLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND_EMERALD,
  },
  weatherIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
    marginBottom: 16,
  },
  tempNumber: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  tempDegree: {
    fontSize: 22,
    fontWeight: '500',
    color: TEXT_MUTED,
    fontVariant: ['tabular-nums'],
  },
  tempMeta: {
    justifyContent: 'center',
  },
  tempCondition: {
    fontSize: 14.5,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  tempFeels: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginVertical: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: TEXT_MUTED,
  },
  metricValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  metricDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#E5E7EB',
  },
  prescriptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
    gap: 10,
  },
  bannerRain: {
    backgroundColor: '#F0F9FF',
  },
  bannerWater: {
    backgroundColor: '#F0FDF4',
  },
  prescriptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  forecastLink: {
    fontSize: 11.5,
    fontWeight: '700',
    flexShrink: 0,
  },

  /* Section 2: Farm Services & Tools */
  sectionHeader: {
    marginBottom: 16,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13.5,
    color: TEXT_MUTED,
    marginTop: 4,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  servicesGridDesk: {
    gap: 16,
  },
  gridFull: {
    width: '100%',
  },
  gridHalf: {
    width: '48.6%',
  },
  gridQuarter: {
    width: '23.6%',
  },
  serviceCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    shadowColor: BRAND_DARK,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 185,
  },
  serviceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: SAGE_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtlePill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subtlePillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#374151',
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    letterSpacing: -0.2,
  },
  serviceDescription: {
    fontSize: 13.5,
    lineHeight: 19,
    color: TEXT_MUTED,
    marginTop: 5,
    minHeight: 38,
  },
  serviceBottomLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  linkText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: BRAND_EMERALD,
  },

  /* Section 3: Kisan Help Desk Card */
  helpDeskCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    padding: 24,
    marginTop: 28,
    shadowColor: BRAND_DARK,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  helpDeskCardDesk: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    gap: 24,
  },
  helpDeskLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    flex: 1,
  },
  helpDeskIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: SAGE_TINT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  helpDeskTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: -0.2,
  },
  helpDeskSubtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: TEXT_MUTED,
    marginTop: 4,
  },
  helpDeskAction: {
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  helpDeskBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Registration & Notification Confirmation Banner */
  regSuccessBanner: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    shadowColor: '#15803D',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  regSuccessLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  regSuccessIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  regSuccessContent: {
    flex: 1,
  },
  regSuccessTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  regSuccessTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#14532D',
  },
  regSuccessBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  regSuccessBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.2,
  },
  regSuccessDetails: {
    fontSize: 13,
    lineHeight: 18,
    color: '#166534',
    marginTop: 4,
  },
  emailReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 8,
  },
  emailReceiptBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  regSuccessDismissBtn: {
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Clean Quiet Footer */
  footer: {
    marginTop: 36,
    alignItems: 'center',
    paddingVertical: 14,
  },
  footerBrand: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.2,
  },
  footerSub: {
    fontSize: 10.5,
    color: '#CBD5E1',
    marginTop: 3,
  },

  /* Farmer Onboarding Guide Banner */
  guideBannerCard: {
    backgroundColor: '#EDF5EE',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
    marginBottom: 8,
    flexDirection: 'column',
    gap: 14,
  },
  guideBannerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  guideIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTextCol: {
    flex: 1,
  },
  guideBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  guideBadge: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  guideBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.3,
  },
  guideLangBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6ECE6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  guideLangBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#0F291E',
  },
  guideHeadline: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F291E',
    lineHeight: 20,
  },
  guideSub: {
    fontSize: 12.5,
    color: '#374151',
    lineHeight: 17,
    marginTop: 3,
  },
  guideOpenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#15803D',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  guideOpenButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
