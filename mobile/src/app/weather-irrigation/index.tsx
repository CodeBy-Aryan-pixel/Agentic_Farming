import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { ActionButton } from '@/components/ActionButton';
import { ExportReportButton } from '@/components/ExportReportButton';
import { GpsLocationButton } from '@/components/weather/gps-location-button';
import { LiveTelemetryDot } from '@/components/weather/live-telemetry-dot';
import { useGpsLocation } from '@/hooks/use-gps-location';
import { useLiveWeather } from '@/hooks/use-live-weather';
import { useNow } from '@/hooks/use-now';
import {
  AGENT_META,
  CROP_OPTIONS,
  DEFAULT_FARM_CONTEXT,
  INDIA_PRESETS,
  METHOD_OPTIONS,
  RISK_META,
  SOIL_OPTIONS,
  STAGE_OPTIONS,
  getCityDisplayName,
  indianLocationToCity,
  isAbortError,
  runWeatherIrrigationAgent,
  searchIndianLocations,
  type AgentName,
  type AgentTrace,
  type City,
  type DayPlan,
  type FarmContext as AgroFarmContext,
  type IndianLocation,
  type IrrigationReport,
  type LiveWeather,
  type WeatherAlert,
} from '@/services/weatherIrrigationAgent';
import { buildIrrigationAgronomistReport } from '@/utils/agronomistReport';
import {
  formatFetchedAt,
  formatGpsCoordinate,
  formatINR,
  formatNumber,
  formatPumpDuration,
  formatRelativeUpdated,
} from '@/utils/format';
import {
  AGRI_SHOP_ROUTE,
  GOVT_SCHEMES_ROUTE,
} from '@/utils/navigation';

const BG = '#F6F9F5';
const CARD = '#FFFFFF';
const PRIMARY = '#2D7A31';
const PRIMARY_BG = '#EAF6E9';
const DARK = '#102A13';
const MUTED = '#6B776B';
const BORDER = '#E8F0E8';
const SOFT = '#F5FAF4';
const BLUE = '#2563EB';
const BLUE_BG = '#EAF1FE';
const AMBER = '#B7791F';
const AMBER_BG = '#FFF7E6';
const RED = '#B42318';
const RED_BG = '#FDECEA';
const MAX_WIDTH = 960;

function weatherIconName(icon: string): any {
  if (icon === 'sun') return 'sun';
  if (icon === 'cloud-drizzle') return 'cloud-drizzle';
  if (icon === 'cloud-rain') return 'cloud-rain';
  if (icon === 'cloud-lightning') return 'cloud-lightning';
  if (icon === 'cloud-snow') return 'cloud-snow';
  if (icon === 'wind') return 'wind';
  return 'cloud';
}

export default function WeatherIrrigationScreen() {
  const {
    city,
    weather,
    loading,
    refreshing,
    error,
    isOffline,
    selectLocation,
    refresh,
  } = useLiveWeather();

  const [farm, setFarm] = useState<AgroFarmContext>(
    DEFAULT_FARM_CONTEXT
  );
  const [reasoningOpen, setReasoningOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    IndianLocation[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(
    null
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const now = useNow(30000);

  const report = useMemo(
    () =>
      weather
        ? runWeatherIrrigationAgent(weather, farm)
        : null,
    [weather, farm]
  );

  const agronomistReport = useMemo(
    () => (report ? buildIrrigationAgronomistReport(report) : null),
    [report]
  );

  const updatedLabel = weather
    ? formatRelativeUpdated(weather.fetchedAt, now)
    : 'just now';

  const handleFarmChange = useCallback(
    (patch: Partial<AgroFarmContext>) => {
      setFarm((previous) => ({ ...previous, ...patch }));
    },
    []
  );

  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (trimmed.length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      void searchIndianLocations(trimmed, controller.signal)
        .then((locations) => {
          if (controller.signal.aborted) return;
          setSearchResults(locations);
          setSearchError(null);
        })
        .catch((caught) => {
          if (
            controller.signal.aborted ||
            isAbortError(caught)
          ) {
            return;
          }

          setSearchResults([]);
          setSearchError(
            caught instanceof Error
              ? caught.message
              : 'Indian location search is unavailable.'
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setSearching(false);
          }
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);

      if (value.trim().length < 2) {
        setSearchResults([]);
        setSearching(false);
        setSearchError(null);
        setSearchOpen(false);
        return;
      }

      setSearchResults([]);
      setSearching(true);
      setSearchError(null);
      setSearchOpen(true);
    },
    []
  );

  const closeSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setSearchOpen(false);
    Keyboard.dismiss();
  }, []);

  const handleSelectSearchResult = useCallback(
    (result: IndianLocation) => {
      selectLocation(indianLocationToCity(result));
      closeSearch();
    },
    [closeSearch, selectLocation]
  );

  const handleSelectPreset = useCallback(
    (preset: City) => {
      selectLocation(preset);
      closeSearch();
    },
    [closeSearch, selectLocation]
  );

  const handleDetectedLocation = useCallback(
    (location: City) => {
      selectLocation(location);
      closeSearch();
    },
    [closeSearch, selectLocation]
  );

  const gps = useGpsLocation(handleDetectedLocation);

  return (
    <UnifiedPageShell
      title="Weather & Irrigation"
      subtitle="Open-Meteo live agricultural telemetry & precision drip schedule"
      statusText="Telemetry Synced"
      backLabel="Back to Home"
      scrollable={true}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={PALETTE.brandEmerald}
          colors={[PALETTE.brandEmerald]}
        />
      }
    >
      <View style={styles.pageInner}>
          <LocationSearchCard
            query={searchQuery}
            onChange={handleSearchChange}
            results={searchResults}
            searching={searching}
            error={searchError}
            open={searchOpen}
            onSelect={handleSelectSearchResult}
            onClear={closeSearch}
            gpsAction={
              <GpsLocationButton
                compact
                loading={gps.detecting}
                onPress={() => {
                  void gps.detect();
                }}
              />
            }
            gpsMessage={gps.message}
            gpsDetected={gps.isGpsDetected}
          />

          <CityTelemetryCard
            city={city}
            weather={weather}
            loading={loading}
            refreshing={refreshing}
            error={error}
            isOffline={isOffline}
            updatedLabel={updatedLabel}
            onSelectPreset={handleSelectPreset}
            onRefresh={refresh}
          />

          {!report ? (
            <LoadingCard
              cityName={city.name}
              loading={loading}
              error={error}
              onRetry={refresh}
            />
          ) : (
            <>
              <FarmContextCard
                farm={farm}
                onChange={handleFarmChange}
              />

              <HeroCard report={report} />

              {agronomistReport ? (
                <ExportReportButton
                  report={agronomistReport}
                  style={styles.reportExportCard}
                />
              ) : null}

              <WeatherAlertsCard report={report} />

              <ReasoningCard
                report={report}
                open={reasoningOpen}
                onToggle={() =>
                  setReasoningOpen((previous) => !previous)
                }
              />

              <ProfitCard report={report} />

              <ForecastCard
                report={report}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
              />

              <ActionsCard />

              <Text style={styles.footer}>
                LIVE DATA © OPEN-METEO.COM · AGENTIC FUTURE
                FARMING
              </Text>
              <Text style={styles.footerSub}>
                Weather data by Open-Meteo (CC BY 4.0). Field
                decisions are advisory; verify with a local
                agronomist or soil test before large
                interventions.
              </Text>
            </>
          )}
        </View>
    </UnifiedPageShell>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderText}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

function MiniStat({
  icon,
  iconComponent,
  label,
  value,
  sub,
}: {
  icon?: string;
  iconComponent?: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <View style={styles.miniStat}>
      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#EDF5EE', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
        {iconComponent ? iconComponent : <Feather name="activity" size={15} color="#15803D" />}
      </View>
      <Text style={styles.miniStatLabel}>{label}</Text>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatSub} numberOfLines={1}>
        {sub}
      </Text>
    </View>
  );
}

function formatGps(
  latitude: number,
  longitude: number
): string {
  const latDirection = latitude >= 0 ? 'N' : 'S';
  const lonDirection = longitude >= 0 ? 'E' : 'W';

  return `${Math.abs(latitude).toFixed(3)}° ${latDirection}, ${Math.abs(
    longitude
  ).toFixed(3)}° ${lonDirection}`;
}

function LocationSearchCard({
  query,
  onChange,
  results,
  searching,
  error,
  open,
  onSelect,
  onClear,
  gpsAction,
  gpsMessage,
  gpsDetected,
}: {
  query: string;
  onChange: (value: string) => void;
  results: IndianLocation[];
  searching: boolean;
  error: string | null;
  open: boolean;
  onSelect: (location: IndianLocation) => void;
  onClear: () => void;
  gpsAction: React.ReactNode;
  gpsMessage: string | null;
  gpsDetected: boolean | null;
}) {
  return (
    <View style={styles.card}>
      <SectionHeader
        eyebrow="SEARCH INDIA"
        title="Find your field"
        subtitle="Search any city, district, town, village or state. Results use Open-Meteo India geocoding."
      />

      <View style={styles.searchActionRow}>
        <View style={styles.searchInputRow}>
          <TextInput
            value={query}
            onChangeText={onChange}
            placeholder="Search any city, district, village or state in India (e.g., Amritsar, Nashik, Madurai, Bhopal)..."
            placeholderTextColor={MUTED}
            style={styles.searchInput}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
            accessibilityLabel="Search Indian locations"
          />
          {searching ? (
            <ActivityIndicator size="small" color={PRIMARY} />
          ) : query.length > 0 ? (
            <Pressable
              onPress={onClear}
              accessibilityRole="button"
              accessibilityLabel="Clear location search"
            >
              <Feather name="x" size={16} color="#6B7280" />
            </Pressable>
          ) : null}
        </View>

        {gpsAction}
      </View>

      {gpsMessage ? (
        <Text
          style={[
            styles.gpsMessage,
            gpsDetected
              ? styles.gpsMessageSuccess
              : styles.gpsMessageFallback,
          ]}
        >
          {gpsMessage}
        </Text>
      ) : null}

      {open ? (
        <View style={styles.searchDropdown}>
          {searching && results.length === 0 ? (
            <Text style={styles.searchMessage}>
              Searching India…
            </Text>
          ) : null}

          {!searching && error ? (
            <Text style={styles.searchError}>{error}</Text>
          ) : null}

          {!searching && !error && results.length === 0 ? (
            <Text style={styles.searchMessage}>
              No Indian locations found. Try a nearby town or
              district.
            </Text>
          ) : null}

          {results.map((result, index) => (
            <Pressable
              key={`${result.id}-${result.latitude}-${result.longitude}`}
              style={[
                styles.searchResult,
                index === results.length - 1 &&
                  styles.searchResultLast,
              ]}
              onPress={() => onSelect(result)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${result.name}, ${result.state}`}
            >
              <Text style={styles.searchResultTitle}>
                {result.name},{' '}
                {result.district
                  ? `${result.district}, `
                  : ''}
                {result.state} ({result.latitude.toFixed(4)},{' '}
                {result.longitude.toFixed(4)} •{' '}
                {result.elevation !== null
                  ? `${Math.round(result.elevation)} m`
                  : '— m'}
                )
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function CityTelemetryCard({
  city,
  weather,
  loading,
  refreshing,
  error,
  isOffline,
  updatedLabel,
  onSelectPreset,
  onRefresh,
}: {
  city: City;
  weather: LiveWeather | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  isOffline: boolean;
  updatedLabel: string;
  onSelectPreset: (location: City) => void;
  onRefresh: () => void;
}) {
  const busy = loading || refreshing;
  const accent = isOffline ? AMBER : PRIMARY;
  const activeCity = weather?.city ?? city;
  const activeElevation =
    activeCity.elevationM ?? weather?.elevationM ?? 0;
  const districtLabel = activeCity.district
    ? /district/i.test(activeCity.district)
      ? activeCity.district
      : `${activeCity.district} district`
    : '';

  return (
    <View style={styles.card}>
      <SectionHeader
        eyebrow="LIVE TELEMETRY REGIONS"
        title="Open-Meteo agricultural feed"
        subtitle="Search any Indian location or tap an agro-climatic preset to re-fetch live temperature, ET₀, rainfall and soil moisture."
        right={
          <View
            style={[
              styles.sourcePill,
              {
                backgroundColor: isOffline
                  ? AMBER_BG
                  : PRIMARY_BG,
                borderColor: isOffline
                  ? `${AMBER}33`
                  : `${PRIMARY}33`,
              },
            ]}
          >
            <LiveTelemetryDot color={accent} size={6} />
            <Text
              style={[
                styles.sourcePillText,
                { color: accent },
              ]}
            >
              {isOffline ? 'OFFLINE CACHE' : 'LIVE API'}
            </Text>
          </View>
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cityPillRow}
      >
        {INDIA_PRESETS.map((region) => {
          const selected =
            region.id === city.id ||
            (Math.abs(region.latitude - city.latitude) <
              0.0001 &&
              Math.abs(region.longitude - city.longitude) <
                0.0001);

          return (
            <Pressable
              key={region.id}
              style={[
                styles.cityPill,
                selected && styles.cityPillActive,
              ]}
              onPress={() => onSelectPreset(region)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                style={[
                  styles.cityPillText,
                  selected && styles.cityPillTextActive,
                ]}
              >
                {region.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.activeLocationBlock}>
        <View style={styles.telemetryLocationRow}>
          <Text style={styles.telemetryLocation}>
            {getCityDisplayName(activeCity)}
          </Text>
          {activeCity.isGpsDetected ? (
            <View style={styles.gpsBadge}>
              <Feather name="navigation" size={10} color={PRIMARY} />
              <Text style={styles.gpsBadgeText}>
                LIVE GPS
              </Text>
            </View>
          ) : null}
        </View>
        {activeCity.isGpsDetected ? (
          <Text style={styles.gpsCoords}>
            {formatGpsCoordinate(
              activeCity.latitude,
              activeCity.longitude
            )}
          </Text>
        ) : null}
        <Text style={styles.telemetrySub}>
          {districtLabel ? `${districtLabel} · ` : ''}
          {activeCity.isGpsDetected
            ? `Elevation ${Math.round(activeElevation)} m`
            : `GPS ${formatGps(
                activeCity.latitude,
                activeCity.longitude
              )} · ${Math.round(activeElevation)} m`}
        </Text>
      </View>

      {weather ? (
        <>
          <View style={styles.telemetryMetaRow}>
            <View style={styles.telemetryMetaText}>
              <Text style={styles.telemetryFetched}>
                Synced {formatFetchedAt(weather.fetchedAt)}
              </Text>
              <Text style={styles.telemetrySub}>
                Updated {updatedLabel} · {weather.timezone}
              </Text>
            </View>

            <Pressable
              style={[
                styles.refreshButton,
                busy && styles.refreshButtonDisabled,
              ]}
              onPress={onRefresh}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Sync live telemetry"
            >
              {busy ? (
                <ActivityIndicator
                  size="small"
                  color={PRIMARY}
                />
              ) : (
                <Text style={styles.refreshIcon}>↻</Text>
              )}
              <Text style={styles.refreshText}>
                {busy ? 'Syncing…' : 'Sync Live'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.miniStatGrid}>
            <MiniStat
              iconComponent={<Feather name="sun" size={16} color="#D97706" />}
              label="NOW"
              value={`${weather.current.temperatureC.toFixed(1)}°C`}
              sub={weather.current.condition}
            />
            <MiniStat
              iconComponent={<MaterialCommunityIcons name="sprout" size={16} color="#15803D" />}
              label="ET₀ TODAY"
              value={`${weather.current.et0TodayMm.toFixed(2)} mm`}
              sub="FAO reference"
            />
            <MiniStat
              iconComponent={<Feather name="cloud-rain" size={16} color="#2563EB" />}
              label="RAIN · 24H"
              value={`${weather.next24hRainProbabilityPct}%`}
              sub={`${weather.next24hRainMm.toFixed(1)} mm forecast`}
            />
            <MiniStat
              iconComponent={<Feather name="droplet" size={16} color="#15803D" />}
              label="SOIL · ROOT"
              value={`${weather.current.soilMoistureRootZonePct}%`}
              sub={`surface ${weather.current.soilMoistureSurfacePct}%`}
            />
          </View>
        </>
      ) : loading ? (
        <View style={styles.fetchingRow}>
          <ActivityIndicator color={PRIMARY} />
          <Text style={styles.fetchingText}>
            Fetching live telemetry for {city.name}…
          </Text>
        </View>
      ) : null}

      {error ? (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: isOffline
                ? AMBER_BG
                : RED_BG,
              borderColor: isOffline
                ? `${AMBER}33`
                : `${RED}33`,
            },
          ]}
        >
          <Text
            style={[
              styles.errorBannerText,
              { color: isOffline ? AMBER : RED },
            ]}
          >
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function FarmContextCard({
  farm,
  onChange,
}: {
  farm: AgroFarmContext;
  onChange: (patch: Partial<AgroFarmContext>) => void;
}) {
  const crop =
    CROP_OPTIONS.find((item) => item.id === farm.cropId) ??
    CROP_OPTIONS[0];
  const stage =
    STAGE_OPTIONS.find((item) => item.id === farm.stageId) ??
    STAGE_OPTIONS[1];
  const soil =
    SOIL_OPTIONS.find((item) => item.id === farm.soilId) ??
    SOIL_OPTIONS[0];
  const method =
    METHOD_OPTIONS.find(
      (item) => item.id === farm.methodId
    ) ?? METHOD_OPTIONS[0];

  return (
    <View style={styles.card}>
      <SectionHeader
        eyebrow="INTERACTIVE FARM CONTEXT"
        title="Tune the three agents to your field"
        subtitle="Every change recalculates water volume, pump runtime and profit from the same live telemetry."
      />

      <Text style={styles.controlLabel}>CROP</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cropChipRow}
      >
        {CROP_OPTIONS.map((option) => {
          const selected = option.id === farm.cropId;
          return (
            <Pressable
              key={option.id}
              style={[
                styles.cropPill,
                selected && styles.cropPillActive,
              ]}
              onPress={() => onChange({ cropId: option.id })}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <MaterialCommunityIcons
                name="sprout-outline"
                size={14}
                color={selected ? '#FFFFFF' : '#15803D'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.cropPillText,
                  selected && styles.cropPillTextActive,
                ]}
              >
                {option.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.controlLabel}>GROWTH STAGE</Text>
      <View style={styles.chipWrap}>
        {STAGE_OPTIONS.map((option) => {
          const selected = option.id === farm.stageId;
          return (
            <Pressable
              key={option.id}
              style={[
                styles.stagePill,
                selected && styles.stagePillActive,
              ]}
              onPress={() => onChange({ stageId: option.id })}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <View
                style={[
                  styles.stageNumBadge,
                  selected && styles.stageNumBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.stageNumText,
                    selected && styles.stageNumTextActive,
                  ]}
                >
                  {option.stepNumber}
                </Text>
              </View>
              <Text
                style={[
                  styles.stagePillText,
                  selected && styles.stagePillTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.controlLabel}>SOIL TYPE</Text>
      <View style={styles.chipWrap}>
        {SOIL_OPTIONS.map((option) => {
          const selected = option.id === farm.soilId;
          return (
            <Pressable
              key={option.id}
              style={[
                styles.soilPill,
                selected && styles.soilPillActive,
              ]}
              onPress={() => onChange({ soilId: option.id })}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <View
                style={[
                  styles.soilSwatch,
                  { backgroundColor: option.swatchColor },
                ]}
              />
              <Text
                style={[
                  styles.soilPillText,
                  selected && styles.soilPillTextActive,
                ]}
              >
                {option.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.controlLabel}>
        IRRIGATION SYSTEM
      </Text>
      <View style={styles.chipWrap}>
        {METHOD_OPTIONS.map((option) => {
          const selected = option.id === farm.methodId;
          return (
            <Pressable
              key={option.id}
              style={[
                styles.methodPill,
                selected && styles.methodPillActive,
              ]}
              onPress={() => onChange({ methodId: option.id })}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              {option.id === 'drip' ? (
                <Feather
                  name="droplet"
                  size={14}
                  color={selected ? '#FFFFFF' : '#15803D'}
                  style={{ marginRight: 6 }}
                />
              ) : option.id === 'sprinkler' ? (
                <MaterialCommunityIcons
                  name="sprinkler-variant"
                  size={16}
                  color={selected ? '#FFFFFF' : '#15803D'}
                  style={{ marginRight: 6 }}
                />
              ) : (
                <Feather
                  name="layers"
                  size={14}
                  color={selected ? '#FFFFFF' : '#15803D'}
                  style={{ marginRight: 6 }}
                />
              )}
              <Text
                style={[
                  styles.methodPillText,
                  selected && styles.methodPillTextActive,
                ]}
              >
                {option.name}
              </Text>
              <View
                style={[
                  styles.efficiencyBadge,
                  selected && styles.efficiencyBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.efficiencyBadgeText,
                    selected && styles.efficiencyBadgeTextActive,
                  ]}
                >
                  {option.efficiencyPct}%
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.acresRow}>
        <View>
          <Text style={styles.controlLabel}>FARM SIZE</Text>
          <Text style={styles.acresValue}>
            {farm.acres} acres
          </Text>
        </View>

        <View style={styles.stepper}>
          <Pressable
            style={styles.stepButton}
            onPress={() =>
              onChange({
                acres: Math.max(1, farm.acres - 1),
              })
            }
            disabled={farm.acres <= 1}
            accessibilityRole="button"
            accessibilityLabel="Decrease farm size"
          >
            <Text
              style={[
                styles.stepButtonText,
                farm.acres <= 1 && styles.stepButtonDisabled,
              ]}
            >
              −
            </Text>
          </Pressable>

          <Text style={styles.stepValue}>{farm.acres}</Text>

          <Pressable
            style={styles.stepButton}
            onPress={() =>
              onChange({
                acres: Math.min(50, farm.acres + 1),
              })
            }
            disabled={farm.acres >= 50}
            accessibilityRole="button"
            accessibilityLabel="Increase farm size"
          >
            <Text
              style={[
                styles.stepButtonText,
                farm.acres >= 50 &&
                  styles.stepButtonDisabled,
              ]}
            >
              +
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.calibrationRow}>
        <LiveTelemetryDot color={PRIMARY} size={6} />
        <Text style={styles.calibrationText}>
          Live recalibration · {crop.name} · {stage.label} ·{' '}
          {soil.shortName} · {method.shortName} · {farm.acres}{' '}
          acres
        </Text>
      </View>
    </View>
  );
}

function MetricTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricTileLabel}>{label}</Text>
      <Text style={styles.metricTileValue}>{value}</Text>
      <Text style={styles.metricTileSub}>{sub}</Text>
    </View>
  );
}

function HeroCard({ report }: { report: IrrigationReport }) {
  const { hydro, method, sentinel, farm, soil, crop, stage } =
    report;
  const statusTitle = hydro.statusLabel
    .replace(hydro.statusEmoji, '')
    .trim();
  const pulse = hydro.schedule[0];

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.heroStatusBanner,
          {
            backgroundColor: `${hydro.statusColor}10`,
            borderColor: `${hydro.statusColor}33`,
          },
        ]}
      >
        <View style={{ marginRight: 10, alignSelf: 'center' }}>
          <MaterialCommunityIcons
            name="water"
            size={24}
            color={hydro.statusColor}
          />
        </View>
        <View style={styles.heroStatusBody}>
          <Text
            style={[
              styles.heroStatusLabel,
              { color: hydro.statusColor },
            ]}
          >
            {statusTitle}
          </Text>
          <Text style={styles.heroStatusMessage}>
            {hydro.statusMessage}
          </Text>
        </View>
      </View>

      <SectionHeader
        eyebrow="AGENTIC PRESCRIPTION"
        title="Today's precise water plan"
        subtitle={`${crop.name} · ${stage.label} · ${soil.name} · ${method.name}`}
        right={
          <View
            style={[
              styles.riskPill,
              {
                backgroundColor:
                  RISK_META[sentinel.riskLevel].background,
              },
            ]}
          >
            <Text
              style={[
                styles.riskPillText,
                {
                  color: RISK_META[sentinel.riskLevel].color,
                },
              ]}
            >
              {RISK_META[sentinel.riskLevel].label.toUpperCase()}
            </Text>
          </View>
        }
      />

      <Text style={styles.heroWaterLabel}>
        WATER TO SUPPLY TODAY
      </Text>
      <Text style={styles.heroWaterValue}>
        {formatNumber(hydro.totalLiters)}
        <Text style={styles.heroWaterUnit}> L</Text>
      </Text>
      <Text style={styles.heroWaterSub}>
        {formatNumber(hydro.litersPerAcre)} L/acre ·{' '}
        {farm.acres} acres · {method.name} (
        {hydro.efficiencyPct}% efficient)
      </Text>

      <View style={styles.metricGrid}>
        <MetricTile
          label="PUMP DURATION"
          value={hydro.pumpRuntimeLabel}
          sub={`${hydro.pumpRuntimePerAcreLabel}/acre · 5 HP pump`}
        />
        <MetricTile
          label="BEST WINDOW"
          value={hydro.bestWindowLabel}
          sub={hydro.nextCheckLabel}
        />
        <MetricTile
          label="CROP DEMAND"
          value={`${hydro.etcMm.toFixed(2)} mm`}
          sub={`ET₀ ${hydro.et0Mm.toFixed(2)} × Kc ${hydro.kc.toFixed(2)}`}
        />
        <MetricTile
          label="AI CONFIDENCE"
          value={`${report.confidencePct}%`}
          sub={`${crop.name} · ${stage.shortLabel} · ${soil.shortName}`}
        />
      </View>

      <View style={styles.pulseCard}>
        <View style={styles.pulseTop}>
          <Text style={styles.pulseLabel}>TODAY&apos;S PULSE</Text>
          <Text style={styles.pulseTime}>
            {pulse?.timeLabel ?? '—'}
          </Text>
        </View>
        <Text style={styles.pulseTitle}>
          {pulse?.label ?? 'No pump run'}
        </Text>
        <Text style={styles.pulseMeta}>
          {pulse
            ? `${formatNumber(pulse.liters)} L · ${formatPumpDuration(pulse.minutes)} · ${method.shortName}`
            : 'Rain lock active'}
        </Text>
        <Text style={styles.pulseNote}>{pulse?.note}</Text>
      </View>

      {sentinel.rainLock &&
      hydro.calculatedLitersPerAcre > 0 ? (
        <Text style={styles.overrideNote}>
          Sentinel override: calculated demand{' '}
          {formatNumber(hydro.calculatedLitersPerAcre)}{' '}
          L/acre was zeroed by the rain lock.
        </Text>
      ) : null}

      <View style={styles.heroFooter}>
        <Text style={styles.heroFooterText}>
          {report.weather.source === 'live'
            ? 'Open-Meteo live feed'
            : 'Offline snapshot'}{' '}
          · observed{' '}
          {formatFetchedAt(report.weather.observedAt)}
        </Text>
        <Text style={styles.heroFooterLink}>
          Reasoning below ↓
        </Text>
      </View>
    </View>
  );
}

function alertTheme(severity: WeatherAlert['severity']) {
  if (severity === 'critical') {
    return { background: RED_BG, border: `${RED}33`, color: RED };
  }

  if (severity === 'warning') {
    return {
      background: AMBER_BG,
      border: `${AMBER}33`,
      color: AMBER,
    };
  }

  if (severity === 'success') {
    return {
      background: PRIMARY_BG,
      border: `${PRIMARY}33`,
      color: PRIMARY,
    };
  }

  return {
    background: BLUE_BG,
    border: `${BLUE}33`,
    color: BLUE,
  };
}

function WeatherAlertsCard({
  report,
}: {
  report: IrrigationReport;
}) {
  const { sentinel } = report;
  const spray = sentinel.spraySafety;

  return (
    <View style={styles.card}>
      <SectionHeader
        eyebrow="SENTINEL FIELD ALERTS"
        title="Weather risk & spray safety"
        subtitle={`${sentinel.alerts.length} operational signal${sentinel.alerts.length === 1 ? '' : 's'} generated from the live 24-hour forecast.`}
        right={
          <View
            style={[
              styles.riskPill,
              {
                backgroundColor:
                  RISK_META[sentinel.riskLevel].background,
              },
            ]}
          >
            <Text
              style={[
                styles.riskPillText,
                {
                  color: RISK_META[sentinel.riskLevel].color,
                },
              ]}
            >
              {RISK_META[sentinel.riskLevel].label.toUpperCase()}
            </Text>
          </View>
        }
      />

      {sentinel.alerts.map((alert) => {
        const theme = alertTheme(alert.severity);

        return (
          <View
            key={alert.id}
            style={[
              styles.alertCard,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.alertIconBox}>
              <Feather
                name={
                  alert.icon === 'alert-octagon'
                    ? 'alert-octagon'
                    : alert.icon === 'wind'
                    ? 'wind'
                    : alert.icon === 'sun'
                    ? 'sun'
                    : alert.icon === 'cloud-rain'
                    ? 'cloud-rain'
                    : 'check-circle'
                }
                size={18}
                color={theme.color}
              />
            </View>
            <View style={styles.alertBody}>
              <Text
                style={[styles.alertTitle, { color: theme.color }]}
              >
                {alert.title}
              </Text>
              <Text style={styles.alertMessage}>
                {alert.message}
              </Text>
              <Text
                style={[
                  styles.alertAction,
                  { color: theme.color },
                ]}
              >
                {alert.action}
              </Text>
            </View>
          </View>
        );
      })}

      <View
        style={[
          styles.sprayCard,
          {
            backgroundColor: `${spray.color}0D`,
            borderColor: `${spray.color}33`,
          },
        ]}
      >
        <View style={styles.sprayHeader}>
          <View style={styles.sprayIconBox}>
            <Feather
              name={
                spray.status === 'unsafe'
                  ? 'slash'
                  : spray.status === 'caution'
                  ? 'alert-triangle'
                  : 'check-circle'
              }
              size={18}
              color={spray.color}
            />
          </View>
          <View style={styles.sprayBody}>
            <Text
              style={[styles.sprayLabel, { color: spray.color }]}
            >
              {spray.label}
            </Text>
            <Text style={styles.sprayMessage}>
              {spray.message}
            </Text>
          </View>
        </View>

        <View style={styles.sprayWindowRow}>
          <Text style={styles.sprayWindowLabel}>
            Best spray window
          </Text>
          <Text style={styles.sprayWindowValue}>
            {spray.bestWindow}
          </Text>
        </View>

        <View style={styles.chipWrap}>
          {spray.reasons.map((reason) => (
            <View key={reason} style={styles.reasonChip}>
              <Text style={styles.reasonChipText}>
                {reason}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function traceStatusColor(
  status: AgentTrace['status']
): string {
  if (status === 'critical') return RED;
  if (status === 'warning') return AMBER;
  if (status === 'ok') return PRIMARY;
  return BLUE;
}

function AgentBlock({
  agent,
  traces,
}: {
  agent: AgentName;
  traces: AgentTrace[];
}) {
  const meta = AGENT_META[agent];
  const iconName =
    agent === 'WeatherSentinel'
      ? 'shield'
      : agent === 'HydroAgronomist'
      ? 'droplet'
      : 'trending-up';

  return (
    <View style={styles.agentAuditCard}>
      <View style={styles.agentAuditHeader}>
        <View style={styles.agentAuditIconBox}>
          <Feather name={iconName} size={20} color="#15803D" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={styles.agentAuditTitle}>{meta.label}</Text>
            <View style={styles.agentVerifiedBadge}>
              <View style={styles.verifiedDot} />
              <Text style={styles.agentVerifiedText}>Verified</Text>
            </View>
          </View>
          <Text style={styles.agentAuditRole}>{meta.role}</Text>
        </View>
      </View>

      <View style={styles.agentAuditRowsContainer}>
        {traces.map((trace, idx) => (
          <View
            key={trace.id}
            style={[
              styles.auditRow,
              idx === traces.length - 1 && styles.auditRowLast,
            ]}
          >
            <View style={styles.auditRowHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View
                  style={[
                    styles.auditDot,
                    { backgroundColor: traceStatusColor(trace.status) },
                  ]}
                />
                <Text style={styles.auditMetricLabel}>{trace.step}</Text>
              </View>
            </View>
            <Text style={styles.auditFormulaDetail}>{trace.detail}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ReasoningCard({
  report,
  open,
  onToggle,
}: {
  report: IrrigationReport;
  open: boolean;
  onToggle: () => void;
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const agents: AgentName[] = [
    'WeatherSentinel',
    'HydroAgronomist',
    'ProfitOptimizer',
  ];

  const tracesFor = (agent: AgentName) => {
    if (agent === 'WeatherSentinel') {
      return report.sentinel.reasoning;
    }

    if (agent === 'HydroAgronomist') {
      return report.hydro.reasoning;
    }

    return report.profit.reasoning;
  };

  return (
    <View style={styles.card}>
      <SectionHeader
        eyebrow="LIVE MULTI-AGENT REASONING"
        title="3-stage agentic workflow"
        subtitle="Inspect every live decision, formula and override the agents used."
        right={
          <Pressable
            style={styles.toggleButton}
            onPress={onToggle}
            accessibilityRole="button"
          >
            <Text style={styles.toggleButtonText}>
              {open ? 'Hide trace' : 'Show trace'}
            </Text>
          </Pressable>
        }
      />

      <View style={styles.workflowGrid}>
        {report.workflow.map((step) => {
          const meta = AGENT_META[step.agent];

          return (
            <View key={step.step} style={styles.workflowStep}>
              <View
                style={[
                  styles.workflowNumber,
                  { backgroundColor: meta.background },
                ]}
              >
                <Text
                  style={[
                    styles.workflowNumberText,
                    { color: meta.color },
                  ]}
                >
                  {step.step}
                </Text>
              </View>
              <View style={styles.workflowBody}>
                <Text style={styles.workflowAgent}>
                  {meta.label}
                </Text>
                <Text style={styles.workflowTitle}>
                  {step.title}
                </Text>
                <Text style={styles.workflowSummary}>
                  {step.summary}
                </Text>
              </View>
              <View
                style={[
                  styles.workflowDot,
                  {
                    backgroundColor: traceStatusColor(
                      step.status
                    ),
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      {open ? (
        <View style={[styles.agentAuditGrid, isDesktop && styles.agentAuditGridDesktop]}>
          {agents.map((agent) => (
            <View key={agent} style={isDesktop ? { flex: 1, minWidth: 0 } : { width: '100%' }}>
              <AgentBlock
                agent={agent}
                traces={tracesFor(agent)}
              />
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.collapsedHint}>
          Reasoning hidden. Tap “Show trace” to inspect the
          live ET₀ × Kc math, soil adjustment, rain lock and
          profit calculation.
        </Text>
      )}
    </View>
  );
}

function ImpactStat({
  label,
  value,
  sub,
  accent = DARK,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <View style={styles.impactStat}>
      <Text style={styles.impactLabel}>{label}</Text>
      <Text style={[styles.impactValue, { color: accent }]}>
        {value}
      </Text>
      <Text style={styles.impactSub}>{sub}</Text>
    </View>
  );
}

function ProfitCard({
  report,
}: {
  report: IrrigationReport;
}) {
  const { profit, sentinel, method } = report;
  const maxLiters = Math.max(
    profit.floodLiters,
    profit.aiLiters,
    1
  );
  const aiWidth = `${Math.round(
    (profit.aiLiters / maxLiters) * 100
  )}%` as `${number}%`;

  return (
    <View style={styles.card}>
      <SectionHeader
        eyebrow="PROFIT & WATER SAVINGS IMPACT"
        title="AI precision vs blind flood"
        subtitle="Today's resource impact, plus the projected weekly protection score."
        right={
          <View style={styles.daysPill}>
            <Text style={styles.daysPillText}>TODAY</Text>
          </View>
        }
      />

      <View style={styles.projectedBanner}>
        <Text style={styles.projectedText}>
          {profit.projectedScoreLabel}
        </Text>
        <Text style={styles.projectedSub}>
          Based on 5 irrigation events/week, ₹12/1,000 L
          pumping cost and {method.shortName.toLowerCase()}{' '}
          efficiency.
        </Text>
      </View>

      <View style={styles.barBlock}>
        <View style={styles.barLabelRow}>
          <Text style={styles.barLabel}>
            AI agentic schedule
          </Text>
          <Text style={styles.barValue}>
            {formatNumber(profit.aiLiters)} L ·{' '}
            {formatINR(profit.pumpCostAi)}
          </Text>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: aiWidth,
                backgroundColor: PRIMARY,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.barBlock}>
        <View style={styles.barLabelRow}>
          <Text style={styles.barLabel}>
            Traditional flood
          </Text>
          <Text style={styles.barValue}>
            {formatNumber(profit.floodLiters)} L ·{' '}
            {formatINR(profit.pumpCostFlood)}
          </Text>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: '100%',
                backgroundColor: AMBER,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.impactGrid}>
        <ImpactStat
          label="WATER SAVED"
          value={`${formatNumber(profit.waterSavedLiters)} L`}
          sub={`${profit.waterSavedPct}% less than flood`}
          accent={PRIMARY}
        />
        <ImpactStat
          label="PUMP ENERGY SAVED"
          value={formatINR(profit.pumpSaving)}
          sub="today"
          accent={PRIMARY}
        />
        <ImpactStat
          label="RUNOFF AVOIDED"
          value={formatINR(profit.fertilizerRunoffSaved)}
          sub="fertilizer loss today"
        />
        <ImpactStat
          label="WEEKLY BENEFIT"
          value={`${formatINR(profit.weeklyBenefitPerAcre)}/acre`}
          sub={`${formatINR(profit.weeklyBenefitTotal)} total`}
        />
      </View>

      {sentinel.rainLock ? (
        <Text style={styles.rainSavingsNote}>
          AI prescribed 0 L because of the rain lock. The flood
          bar shows what a blind schedule would still waste.
        </Text>
      ) : null}

      <Text style={styles.assumptionText}>
        Flood baseline assumes 50% application efficiency.
        Pump cost is ₹12 per 1,000 L of electricity/diesel and
        upkeep. Yield protection uses 0.3% weekly stress loss
        scaled by crop stage sensitivity.
      </Text>
    </View>
  );
}

function ForecastDayCard({
  day,
  selected,
  onPress,
}: {
  day: DayPlan;
  selected: boolean;
  onPress: () => void;
}) {
  const isSkip = day.status === 'skip';
  const statusBg = selected
    ? 'rgba(255, 255, 255, 0.16)'
    : '#EDF5EE';
  const statusColor = selected
    ? '#FFFFFF'
    : isSkip
    ? '#2563EB'
    : '#15803D';

  const iconName = weatherIconName(day.icon);

  return (
    <Pressable
      style={[
        styles.forecastDayCard,
        selected ? styles.forecastDayCardActive : styles.forecastDayCardInactive,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text
        style={[
          styles.forecastWeekday,
          selected && styles.forecastTextActive,
        ]}
      >
        {day.weekday}
      </Text>
      <Text
        style={[
          styles.forecastDate,
          selected ? styles.forecastDateActive : styles.forecastDateInactive,
        ]}
      >
        {day.dateLabel}
      </Text>

      <View style={styles.forecastIconBox}>
        <Feather
          name={iconName}
          size={24}
          color={selected ? '#FFFFFF' : '#15803D'}
        />
      </View>

      <View style={styles.forecastTempRow}>
        <Text
          style={[
            styles.forecastTempMax,
            selected && styles.forecastTextActive,
          ]}
        >
          {day.maxTempC.toFixed(1)}°
        </Text>
        <Text
          style={[
            styles.forecastTempMin,
            selected ? styles.forecastMutedActive : styles.forecastMutedInactive,
          ]}
        >
          {day.minTempC.toFixed(1)}°
        </Text>
      </View>

      <View style={styles.forecastRainRow}>
        <Feather
          name="cloud-rain"
          size={12}
          color={selected ? '#FFFFFF' : '#2563EB'}
          style={{ marginRight: 4 }}
        />
        <Text
          style={[
            styles.forecastRainText,
            selected ? styles.forecastTextActive : styles.forecastRainTextInactive,
          ]}
        >
          {day.precipitationProbabilityMaxPct}%
        </Text>
      </View>

      <Text
        style={[
          styles.forecastEt0,
          selected ? styles.forecastMutedActive : styles.forecastEt0Inactive,
        ]}
      >
        ET₀ {day.et0Mm.toFixed(2)}
      </Text>

      <View
        style={[
          styles.forecastStatusPill,
          { backgroundColor: statusBg },
        ]}
      >
        <Text
          style={[
            styles.forecastStatusPillText,
            { color: statusColor },
          ]}
        >
          {isSkip ? 'HOLD' : 'IRRIGATE'}
        </Text>
      </View>
    </Pressable>
  );
}

function ForecastCard({
  report,
  selectedDate,
  onSelect,
}: {
  report: IrrigationReport;
  selectedDate: string | null;
  onSelect: (date: string) => void;
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const selected =
    report.days.find((day) => day.date === selectedDate) ??
    report.days[0];

  return (
    <View style={styles.card}>
      <SectionHeader
        eyebrow="7-DAY LIVE ET₀ & RAIN SCHEDULE"
        title="Forecast with irrigation decisions"
        subtitle="Daily ET₀ and rain probability from Open-Meteo, blended with your current crop, soil and system."
        right={
          <View style={styles.daysPill}>
            <Text style={styles.daysPillText}>7 DAYS</Text>
          </View>
        }
      />

      {isDesktop ? (
        <View style={styles.forecastGridDesktop}>
          {report.days.map((day) => (
            <ForecastDayCard
              key={day.date}
              day={day}
              selected={day.date === selected?.date}
              onPress={() => onSelect(day.date)}
            />
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.forecastScrollMobile}
        >
          {report.days.map((day) => (
            <ForecastDayCard
              key={day.date}
              day={day}
              selected={day.date === selected?.date}
              onPress={() => onSelect(day.date)}
            />
          ))}
        </ScrollView>
      )}

      {selected ? (
        <View style={styles.prescriptionStripCard}>
          <View style={styles.prescriptionStripTop}>
            <View style={styles.prescriptionIconSquare}>
              <Feather
                name={weatherIconName(selected.icon)}
                size={24}
                color="#15803D"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.prescriptionDayTitle}>
                {selected.weekday} · {selected.condition}
              </Text>
              <Text style={styles.prescriptionDaySub}>
                {selected.maxTempC}° / {selected.minTempC}° · ET₀ {selected.et0Mm.toFixed(2)} mm · Kc{' '}
                {selected.kc.toFixed(2)}
              </Text>
            </View>
            <View
              style={[
                styles.prescriptionStatusBadge,
                {
                  backgroundColor:
                    selected.status === 'skip' ? '#F3F4F6' : '#EDF5EE',
                },
              ]}
            >
              <Text
                style={[
                  styles.prescriptionStatusText,
                  {
                    color:
                      selected.status === 'skip' ? '#374151' : '#15803D',
                  },
                ]}
              >
                {selected.statusLabel}
              </Text>
            </View>
          </View>

          <View style={styles.prescriptionPillsGrid}>
            <View style={styles.prescriptionPill}>
              <Feather
                name="cloud-rain"
                size={13}
                color="#2563EB"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.prescriptionPillText}>
                {selected.precipitationSumMm.toFixed(1)} mm rain ·{' '}
                {selected.precipitationProbabilityMaxPct}%
              </Text>
            </View>
            <View style={styles.prescriptionPill}>
              <MaterialCommunityIcons
                name="sprout-outline"
                size={14}
                color="#15803D"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.prescriptionPillText}>
                ETc {selected.etcMm.toFixed(2)} mm · effective rain{' '}
                {selected.effectiveRainMm.toFixed(2)} mm
              </Text>
            </View>
            <View style={styles.prescriptionPill}>
              <Feather
                name="droplet"
                size={13}
                color="#15803D"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.prescriptionPillText}>
                {formatNumber(selected.litersPerAcre)} L/acre projected need
              </Text>
            </View>
          </View>

          <Text style={styles.forecastAdvice}>
            {selected.rainLock
              ? 'The sentinel would hold irrigation on this day because the rain signal crosses the lock threshold.'
              : selected.status === 'irrigate'
                ? 'Run the precision pulse in the early-morning window; recheck soil moisture before the pump starts.'
                : selected.status === 'topup'
                  ? 'A light top-up is enough; avoid a full flood cycle.'
                  : 'No irrigation is projected if the live forecast holds.'}
          </Text>
        </View>
      ) : null}

      <Text style={styles.forecastNote}>
        Forecast assumes today&apos;s root-zone moisture carry-over.
        ET₀, rain probability and rain amount are live daily
        values from Open-Meteo.
      </Text>
    </View>
  );
}

function ActionsCard() {
  return (
    <View style={styles.card}>
      <SectionHeader
        eyebrow="CROSS-AGENT NEXT ACTIONS"
        title="Turn the prescription into field action"
        subtitle="The irrigation agent hands off to the Agri-Shop and government-scheme agents."
      />

      <View style={styles.actionStack}>
        <ActionButton
          label="Get Drip & Moisture Kits in Agri-Shop"
          icon="shopping-bag"
          variant="primary"
          fullWidth
          onPress={() => router.push(AGRI_SHOP_ROUTE)}
          style={styles.actionsCardButton}
        />

        <ActionButton
          label="Apply for PMKSY Per Drop More Crop (55% Drip Subsidy)"
          icon="shield"
          variant="secondary"
          fullWidth
          onPress={() => router.push(GOVT_SCHEMES_ROUTE)}
          style={styles.actionsCardButton}
        />
      </View>
    </View>
  );
}

function LoadingCard({
  cityName,
  loading,
  error,
  onRetry,
}: {
  cityName: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.loadingRow}>
        {loading ? (
          <ActivityIndicator color={PRIMARY} size="large" />
        ) : (
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EDF5EE', alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="radio" size={20} color="#15803D" />
          </View>
        )}
        <View style={styles.loadingBody}>
          <Text style={styles.loadingTitle}>
            {error
              ? 'Live telemetry unavailable'
              : `Fetching ${cityName} field telemetry…`}
          </Text>
          <Text style={styles.loadingMessage}>
            {error ??
              'Open-Meteo is returning live temperature, rain, ET₀ and root-zone soil moisture. The three agents will start their reasoning as soon as the payload lands.'}
          </Text>
        </View>
      </View>

      {error ? (
        <Pressable
          style={styles.retryButton}
          onPress={onRetry}
          accessibilityRole="button"
        >
          <Text style={styles.retryButtonText}>
            Retry live fetch
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  topBar: {
    backgroundColor: BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  backButton: {
    minWidth: 58,
    backgroundColor: '#E8F0E8',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: DARK,
  },
  topBarTitleBlock: {
    flex: 1,
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: DARK,
  },
  topBarSubtitle: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  livePillText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  pageInner: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    marginTop: 14,
    shadowColor: PRIMARY,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  reportExportCard: {
    marginTop: 14,
  },
  searchActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    gap: 8,
  },
  searchInputRow: {
    flex: 1,
    minWidth: 190,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    backgroundColor: SOFT,
    paddingHorizontal: 12,
  },
  gpsMessage: {
    marginTop: 8,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: '700',
  },
  gpsMessageSuccess: {
    color: PRIMARY,
  },
  gpsMessageFallback: {
    color: AMBER,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 12,
    lineHeight: 18,
    color: DARK,
    fontWeight: '600',
  },
  searchClear: {
    fontSize: 14,
    fontWeight: '800',
    color: MUTED,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  searchDropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    backgroundColor: CARD,
    overflow: 'hidden',
  },
  searchResult: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: SOFT,
  },
  searchResultLast: {
    borderBottomWidth: 0,
  },
  searchResultTitle: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '700',
    color: DARK,
  },
  searchMessage: {
    fontSize: 10,
    lineHeight: 15,
    color: MUTED,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchError: {
    fontSize: 10,
    lineHeight: 15,
    color: RED,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  activeLocationBlock: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: SOFT,
  },
  telemetryLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  telemetryLocation: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1B4D20',
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F6E7',
    borderWidth: 1,
    borderColor: `${PRIMARY}33`,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gpsBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: PRIMARY,
  },
  gpsCoords: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '700',
    color: MUTED,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  sectionHeaderText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: PRIMARY,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
    marginTop: 3,
  },
  cardSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: MUTED,
    marginTop: 4,
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  sourcePillText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cityPillRow: {
    gap: 8,
    paddingBottom: 2,
  },
  cityPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SOFT,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cityPillActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  cityPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#405640',
  },
  cityPillTextActive: {
    color: '#FFFFFF',
  },
  telemetryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  telemetryMetaText: {
    flex: 1,
    minWidth: 180,
  },
  telemetryFetched: {
    fontSize: 10,
    fontWeight: '700',
    color: DARK,
  },
  telemetrySub: {
    fontSize: 9,
    color: MUTED,
    marginTop: 3,
    lineHeight: 14,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PRIMARY_BG,
    borderWidth: 1,
    borderColor: `${PRIMARY}33`,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  refreshButtonDisabled: {
    opacity: 0.65,
  },
  refreshIcon: {
    fontSize: 14,
    fontWeight: '800',
    color: PRIMARY,
  },
  refreshText: {
    fontSize: 9,
    fontWeight: '800',
    color: PRIMARY,
  },
  miniStatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  miniStat: {
    flexGrow: 1,
    flexBasis: 120,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: '#EDF4EC',
    borderRadius: 12,
    padding: 10,
  },
  miniStatIcon: {
    fontSize: 14,
  },
  miniStatLabel: {
    fontSize: 8,
    letterSpacing: 0.8,
    fontWeight: '800',
    color: MUTED,
    marginTop: 4,
  },
  miniStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  miniStatSub: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
  },
  fetchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  fetchingText: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '600',
  },
  errorBanner: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  errorBannerText: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
  },
  controlLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: MUTED,
    marginTop: 14,
    marginBottom: 7,
  },
  cropChipRow: {
    gap: 8,
    paddingBottom: 2,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  acresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  acresValue: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: SOFT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 4,
  },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: PRIMARY,
    lineHeight: 21,
  },
  stepButtonDisabled: {
    color: '#B9C4B9',
  },
  stepValue: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: DARK,
    fontVariant: ['tabular-nums'],
  },
  calibrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: PRIMARY_BG,
    borderRadius: 10,
    padding: 8,
  },
  calibrationText: {
    flex: 1,
    fontSize: 9,
    color: PRIMARY,
    fontWeight: '700',
  },
  heroStatusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  heroStatusEmoji: {
    fontSize: 22,
  },
  heroStatusBody: {
    flex: 1,
  },
  heroStatusLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroStatusMessage: {
    fontSize: 10,
    lineHeight: 15,
    color: '#405640',
    marginTop: 3,
  },
  riskPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  riskPillText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroWaterLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: MUTED,
    marginTop: 4,
  },
  heroWaterValue: {
    fontSize: 40,
    fontWeight: '800',
    color: DARK,
    lineHeight: 46,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  heroWaterUnit: {
    fontSize: 20,
    color: PRIMARY,
  },
  heroWaterSub: {
    fontSize: 10,
    color: MUTED,
    marginTop: 2,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  metricTile: {
    flexGrow: 1,
    flexBasis: 150,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: '#EDF4EC',
    borderRadius: 14,
    padding: 12,
    minHeight: 88,
  },
  metricTileLabel: {
    fontSize: 8,
    letterSpacing: 0.8,
    fontWeight: '800',
    color: MUTED,
  },
  metricTileValue: {
    fontSize: 17,
    fontWeight: '800',
    color: DARK,
    marginTop: 5,
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
  },
  metricTileSub: {
    fontSize: 8,
    color: MUTED,
    marginTop: 3,
    lineHeight: 12,
  },
  pulseCard: {
    marginTop: 14,
    backgroundColor: '#F8FBF7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
  },
  pulseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pulseLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: PRIMARY,
  },
  pulseTime: {
    fontSize: 10,
    fontWeight: '800',
    color: DARK,
    fontVariant: ['tabular-nums'],
  },
  pulseTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: DARK,
    marginTop: 5,
  },
  pulseMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: MUTED,
    marginTop: 3,
  },
  pulseNote: {
    fontSize: 9,
    lineHeight: 14,
    color: MUTED,
    marginTop: 5,
  },
  overrideNote: {
    marginTop: 10,
    fontSize: 9,
    lineHeight: 14,
    color: RED,
    fontWeight: '600',
  },
  heroFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    marginTop: 14,
    paddingTop: 10,
  },
  heroFooterText: {
    flex: 1,
    fontSize: 8,
    color: MUTED,
  },
  heroFooterLink: {
    fontSize: 9,
    fontWeight: '800',
    color: PRIMARY,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderWidth: 1,
    borderRadius: 13,
    padding: 11,
    marginTop: 8,
  },
  alertIcon: {
    fontSize: 18,
  },
  alertBody: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  alertMessage: {
    fontSize: 10,
    lineHeight: 15,
    color: '#3F4F3F',
    marginTop: 3,
  },
  alertAction: {
    fontSize: 9,
    lineHeight: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  sprayCard: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  sprayHeader: {
    flexDirection: 'row',
    gap: 9,
  },
  sprayEmoji: {
    fontSize: 20,
  },
  sprayBody: {
    flex: 1,
  },
  sprayLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  sprayMessage: {
    fontSize: 10,
    lineHeight: 15,
    color: '#3F4F3F',
    marginTop: 3,
  },
  sprayWindowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    marginTop: 10,
    paddingTop: 9,
  },
  sprayWindowLabel: {
    fontSize: 9,
    color: MUTED,
    fontWeight: '700',
  },
  sprayWindowValue: {
    flex: 1,
    fontSize: 10,
    color: DARK,
    fontWeight: '800',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  reasonChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reasonChipText: {
    fontSize: 8,
    color: '#4B5F4B',
    fontWeight: '600',
  },
  toggleButton: {
    backgroundColor: PRIMARY_BG,
    borderWidth: 1,
    borderColor: `${PRIMARY}33`,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  toggleButtonText: {
    fontSize: 9,
    color: PRIMARY,
    fontWeight: '800',
  },
  workflowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  workflowStep: {
    flexGrow: 1,
    flexBasis: 220,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: '#EDF4EC',
    borderRadius: 12,
    padding: 10,
  },
  workflowNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workflowNumberText: {
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  workflowBody: {
    flex: 1,
  },
  workflowAgent: {
    fontSize: 8,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 0.5,
  },
  workflowTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: DARK,
    marginTop: 1,
  },
  workflowSummary: {
    fontSize: 9,
    lineHeight: 13,
    color: MUTED,
    marginTop: 2,
  },
  workflowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
  },
  agentLogs: {
    gap: 10,
  },
  agentBlock: {
    borderLeftWidth: 3,
    backgroundColor: SOFT,
    borderRadius: 12,
    padding: 11,
    gap: 8,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  agentIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentIconText: {
    fontSize: 15,
  },
  agentHeaderText: {
    flex: 1,
  },
  agentName: {
    fontSize: 11,
    fontWeight: '800',
  },
  agentRole: {
    fontSize: 8,
    color: MUTED,
    marginTop: 1,
  },
  agentCount: {
    fontSize: 8,
    color: MUTED,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  collapsedHint: {
    fontSize: 10,
    lineHeight: 15,
    color: MUTED,
    backgroundColor: SOFT,
    padding: 10,
    borderRadius: 10,
  },
  daysPill: {
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  daysPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: PRIMARY,
    letterSpacing: 0.6,
    fontVariant: ['tabular-nums'],
  },
  projectedBanner: {
    backgroundColor: '#F3FAF1',
    borderWidth: 1,
    borderColor: `${PRIMARY}26`,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  projectedText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    color: PRIMARY,
  },
  projectedSub: {
    fontSize: 8,
    lineHeight: 13,
    color: MUTED,
    marginTop: 4,
  },
  barBlock: {
    marginTop: 10,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: DARK,
  },
  barValue: {
    fontSize: 9,
    color: MUTED,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EDF2ED',
    overflow: 'hidden',
    marginTop: 6,
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  impactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  impactStat: {
    flexGrow: 1,
    flexBasis: 130,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: '#EDF4EC',
    borderRadius: 12,
    padding: 10,
  },
  impactLabel: {
    fontSize: 8,
    letterSpacing: 0.6,
    fontWeight: '800',
    color: MUTED,
  },
  impactValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  impactSub: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
  },
  rainSavingsNote: {
    fontSize: 9,
    lineHeight: 14,
    color: AMBER,
    fontWeight: '600',
    marginTop: 10,
  },
  assumptionText: {
    fontSize: 8,
    lineHeight: 13,
    color: MUTED,
    marginTop: 12,
  },
  forecastScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  forecastDayCard: {
    width: 110,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 10,
  },
  forecastDayCardActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  forecastWeekday: {
    fontSize: 11,
    fontWeight: '800',
    color: DARK,
  },
  forecastDate: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  forecastIcon: {
    fontSize: 22,
    marginTop: 7,
  },
  forecastTemp: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  forecastMin: {
    fontSize: 9,
    color: MUTED,
    fontVariant: ['tabular-nums'],
  },
  forecastRainRow: {
    marginTop: 5,
  },
  forecastRain: {
    fontSize: 8,
    color: BLUE,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  forecastEt0: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  forecastStatus: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginTop: 7,
    alignSelf: 'flex-start',
  },
  forecastStatusText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  forecastTextActive: {
    color: '#FFFFFF',
  },
  forecastMutedActive: {
    color: '#D8F0D8',
  },
  forecastDetail: {
    marginTop: 12,
    backgroundColor: '#F8FBF7',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 12,
  },
  forecastDetailTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  forecastDetailIcon: {
    fontSize: 24,
  },
  forecastDetailBody: {
    flex: 1,
  },
  forecastDetailTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: DARK,
  },
  forecastDetailSub: {
    fontSize: 9,
    color: MUTED,
    marginTop: 2,
  },
  forecastAdvice: {
    fontSize: 9,
    lineHeight: 14,
    color: '#4B5F4B',
    marginTop: 10,
    fontWeight: '600',
  },
  forecastNote: {
    fontSize: 8,
    lineHeight: 13,
    color: MUTED,
    marginTop: 12,
  },
  actionStack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  actionsCardButton: {
    flexGrow: 1,
    flexBasis: 220,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  loadingErrorIcon: {
    fontSize: 26,
  },
  loadingBody: {
    flex: 1,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
  },
  loadingMessage: {
    fontSize: 10,
    lineHeight: 16,
    color: MUTED,
    marginTop: 5,
  },
  retryButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: PRIMARY,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 8,
    color: MUTED,
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  footerSub: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 8,
    lineHeight: 12,
    color: '#8A978A',
    maxWidth: 640,
    alignSelf: 'center',
  },
  // Farm Context Selector Pills
  cropPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#E2E8E2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cropPillActive: {
    backgroundColor: '#0F291E',
    borderColor: '#0F291E',
  },
  cropPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  cropPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#E2E8E2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  stagePillActive: {
    backgroundColor: '#0F291E',
    borderColor: '#0F291E',
  },
  stageNumBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageNumBadgeActive: {
    backgroundColor: '#15803D',
  },
  stageNumText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
    fontVariant: ['tabular-nums'],
  },
  stageNumTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stagePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  stagePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  soilPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#E2E8E2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  soilPillActive: {
    backgroundColor: '#0F291E',
    borderColor: '#0F291E',
  },
  soilSwatch: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  soilPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  soilPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  methodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#E2E8E2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  methodPillActive: {
    backgroundColor: '#0F291E',
    borderColor: '#0F291E',
  },
  methodPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  methodPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  efficiencyBadge: {
    backgroundColor: '#EDF5EE',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  efficiencyBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  efficiencyBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  efficiencyBadgeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sprayIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EDF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 3-Stage Agentic Workflow Audit Grid
  agentAuditGrid: {
    flexDirection: 'column',
    gap: 14,
    marginTop: 14,
  },
  agentAuditGridDesktop: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'stretch',
  },
  agentAuditCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6ECE6',
    borderRadius: 20,
    padding: 20,
    flex: 1,
  },
  agentAuditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F1',
  },
  agentAuditIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EDF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentAuditTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F291E',
  },
  agentAuditRole: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  agentVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  verifiedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#15803D',
  },
  agentVerifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  agentAuditRowsContainer: {
    paddingTop: 6,
  },
  auditRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F1',
  },
  auditRowLast: {
    borderBottomWidth: 0,
  },
  auditRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  auditDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803D',
  },
  auditMetricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  auditFormulaDetail: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 18,
  },
  // 7-Day Live Forecast Grid & Strip
  forecastGridDesktop: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 12,
  },
  forecastScrollMobile: {
    gap: 10,
    paddingBottom: 4,
    marginTop: 12,
  },
  forecastDayCardInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6ECE6',
  },
  forecastDateActive: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  forecastDateInactive: {
    fontSize: 8,
    color: '#6B7280',
    marginTop: 2,
  },
  forecastIconBox: {
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forecastTempRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  forecastTempMax: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F291E',
    fontVariant: ['tabular-nums'],
  },
  forecastTempMin: {
    fontSize: 10,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  forecastMutedInactive: {
    color: '#6B7280',
  },
  forecastRainText: {
    fontSize: 10,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  forecastRainTextInactive: {
    color: '#2563EB',
  },
  forecastEt0Inactive: {
    color: '#6B7280',
  },
  forecastStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
    alignSelf: 'center',
  },
  forecastStatusPillText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  prescriptionStripCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6ECE6',
    borderRadius: 16,
    padding: 16,
  },
  prescriptionStripTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  prescriptionIconSquare: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EDF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prescriptionDayTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F291E',
  },
  prescriptionDaySub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  prescriptionStatusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  prescriptionStatusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  prescriptionPillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  prescriptionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#E2E8E2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  prescriptionPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    fontVariant: ['tabular-nums'],
  },
});
