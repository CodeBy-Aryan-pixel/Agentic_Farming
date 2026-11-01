import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { GpsLocationButton } from '@/components/weather/gps-location-button';
import { LiveTelemetryDot } from '@/components/weather/live-telemetry-dot';
import {
  useGpsLocation,
  type GpsLocationController,
} from '@/hooks/use-gps-location';
import { useLiveWeather } from '@/hooks/use-live-weather';
import { useNow } from '@/hooks/use-now';
import {
  DEFAULT_FARM_CONTEXT,
  getCityDisplayName,
  runWeatherIrrigationAgent,
} from '@/services/weatherIrrigationAgent';
import {
  formatGpsCoordinate,
  formatNumber,
  formatRelativeUpdated,
} from '@/utils/format';
import { WEATHER_IRRIGATION_ROUTE } from '@/utils/navigation';

const PRIMARY = '#2D7A31';
const DARK = '#102A13';
const MUTED = '#6B776B';
const BORDER = '#E8F0E8';
const SOFT = '#F5FAF4';
const AMBER = '#B7791F';

function weatherIconName(icon: string): keyof typeof Feather.glyphMap {
  const map: Record<string, keyof typeof Feather.glyphMap> = {
    sun: 'sun',
    cloud: 'cloud',
    'cloud-drizzle': 'cloud-drizzle',
    'cloud-rain': 'cloud-rain',
    'cloud-lightning': 'cloud-lightning',
    'cloud-snow': 'cloud-snow',
    wind: 'wind',
  };
  return map[icon] ?? 'sun';
}

function WeatherMetric({
  iconComponent,
  label,
  value,
  progressPct = 50,
  progressColor = '#2D7A31',
  statusLabel,
  statusColor = '#2D7A31',
}: {
  iconComponent?: React.ReactNode;
  label: string;
  value: string;
  progressPct?: number;
  progressColor?: string;
  statusLabel?: string;
  statusColor?: string;
}) {
  const clampedProgress = Math.max(5, Math.min(100, Math.round(progressPct)));

  return (
    <View style={styles.metric}>
      <View style={styles.metricLabelRow}>
        {iconComponent}
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>

      {/* Subtle Progress Bar */}
      <View style={styles.metricProgressTrack}>
        <View
          style={[
            styles.metricProgressFill,
            {
              width: `${clampedProgress}%` as any,
              backgroundColor: progressColor,
            },
          ]}
        />
      </View>

      {/* Color-Coded Status Dot */}
      {statusLabel ? (
        <View style={styles.metricStatusRow}>
          <View
            style={[styles.metricStatusDot, { backgroundColor: statusColor }]}
          />
          <Text style={[styles.metricStatusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function HomeGpsAction({
  gps,
}: {
  gps: GpsLocationController;
}) {
  return (
    <View style={styles.gpsBlock}>
      <GpsLocationButton
        loading={gps.detecting}
        onPress={() => {
          void gps.detect();
        }}
      />
      {gps.message ? (
        <Text
          style={[
            styles.gpsMessage,
            gps.isGpsDetected
              ? styles.gpsMessageSuccess
              : styles.gpsMessageFallback,
          ]}
        >
          {gps.message}
        </Text>
      ) : null}
    </View>
  );
}

export function WeatherWidget() {
  const {
    city,
    weather,
    refreshing,
    error,
    isOffline,
    selectLocation,
  } = useLiveWeather();
  const gps = useGpsLocation(selectLocation);
  const now = useNow(30000);

  const report = useMemo(
    () =>
      weather
        ? runWeatherIrrigationAgent(
            weather,
            DEFAULT_FARM_CONTEXT
          )
        : null,
    [weather]
  );

  const accent = isOffline ? AMBER : PRIMARY;
  const updatedLabel = weather
    ? formatRelativeUpdated(weather.fetchedAt, now)
    : 'just now';

  if (!report) {
    return (
      <View style={styles.card}>
        <Pressable
          onPress={() => router.push(WEATHER_IRRIGATION_ROUTE)}
          accessibilityRole="button"
          accessibilityLabel="Open the live weather and irrigation dashboard"
        >
          <View style={styles.topRow}>
            <View style={styles.locationBlock}>
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={13} color="#15803D" style={{ marginRight: 2 }} />
                <Text style={styles.location}>
                  {getCityDisplayName(city)}
                </Text>
                {city.isGpsDetected ? (
                  <View style={styles.gpsBadge}>
                    <Feather name="navigation" size={8} color={PRIMARY} style={{ marginRight: 3 }} />
                    <Text style={styles.gpsBadgeText}>
                      LIVE GPS
                    </Text>
                  </View>
                ) : null}
              </View>
              {city.isGpsDetected ? (
                <Text style={styles.gpsCoords}>
                  {formatGpsCoordinate(
                    city.latitude,
                    city.longitude
                  )}
                </Text>
              ) : null}
              <View style={styles.syncRow}>
                <LiveTelemetryDot color={PRIMARY} size={7} />
                <Text style={styles.syncText}>
                  CONNECTING LIVE TELEMETRY
                </Text>
              </View>
            </View>

            <ActivityIndicator color={PRIMARY} />
          </View>

          <Text style={styles.loadingTitle}>
            {error
              ? 'Live weather unavailable'
              : 'Fetching Open-Meteo field telemetry…'}
          </Text>
          <Text style={styles.loadingMessage}>
            {error ??
              'Pulling live temperature, rainfall, ET₀ and root-zone soil moisture for your farm.'}
          </Text>
          <Text style={styles.loadingLink}>
            Tap to open the dashboard and retry →
          </Text>
        </Pressable>

        <HomeGpsAction gps={gps} />
      </View>
    );
  }

  const { current } = report.weather;
  const { hydro, method, sentinel } = report;
  const hasPrescription = hydro.totalLiters > 0;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => router.push(WEATHER_IRRIGATION_ROUTE)}
        accessibilityRole="button"
        accessibilityLabel="Open the live weather and AI irrigation plan"
      >
        <View style={styles.topRow}>
          <View style={styles.locationBlock}>
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={13} color="#15803D" style={{ marginRight: 2 }} />
              <Text style={styles.location}>
                {getCityDisplayName(city)}
              </Text>
              {city.isGpsDetected ? (
                <View style={styles.gpsBadge}>
                  <Feather name="navigation" size={8} color={PRIMARY} style={{ marginRight: 3 }} />
                  <Text style={styles.gpsBadgeText}>
                    LIVE GPS
                  </Text>
                </View>
              ) : null}
            </View>
            {city.isGpsDetected ? (
              <Text style={styles.gpsCoords}>
                {formatGpsCoordinate(
                  city.latitude,
                  city.longitude
                )}
              </Text>
            ) : null}
            <View style={styles.syncRow}>
              <LiveTelemetryDot color={accent} size={7} />
              <Text style={[styles.syncText, { color: accent }]}>
                {isOffline
                  ? 'OFFLINE CACHE'
                  : 'LIVE API TELEMETRY'}
              </Text>
              <Text style={styles.syncDivider}>•</Text>
              <Text style={styles.updatedText}>
                Updated {updatedLabel}
              </Text>
            </View>
          </View>

          <View style={styles.iconCircle}>
            <Feather
              name={weatherIconName(current.icon)}
              size={26}
              color="#15803D"
            />
          </View>
        </View>

        <View style={styles.mainRow}>
          <Text style={styles.temperature}>
            {current.temperatureC.toFixed(1)}
            <Text style={styles.degree}>°C</Text>
          </Text>

          <View style={styles.conditionBlock}>
            <Text style={styles.condition}>
              {current.condition}
            </Text>
            <Text style={styles.feelsLike}>
              Feels {current.apparentTemperatureC.toFixed(1)}° ·
              H {report.weather.daily[0]?.maxTempC ?? '—'}° · L{' '}
              {report.weather.daily[0]?.minTempC ?? '—'}°
            </Text>
            <View style={styles.aiTag}>
              <Text style={styles.aiTagText}>
                OPEN-METEO · {report.weather.timezone}
              </Text>
            </View>
          </View>

          {refreshing ? (
            <ActivityIndicator
              color={PRIMARY}
              style={styles.syncSpinner}
            />
          ) : null}
        </View>

        <View style={styles.metricsRow}>
          <WeatherMetric
            iconComponent={<Feather name="droplet" size={12} color="#0284C7" style={{ marginRight: 4 }} />}
            label="Humidity"
            value={`${current.humidityPct}%`}
            progressPct={current.humidityPct}
            progressColor={current.humidityPct > 70 ? '#0284C7' : current.humidityPct < 30 ? '#F59E0B' : '#10B981'}
            statusLabel={current.humidityPct > 70 ? 'High' : current.humidityPct < 30 ? 'Dry' : 'Optimal'}
            statusColor={current.humidityPct > 70 ? '#0284C7' : current.humidityPct < 30 ? '#F59E0B' : '#10B981'}
          />
          <WeatherMetric
            iconComponent={<Feather name="wind" size={12} color="#64748B" style={{ marginRight: 4 }} />}
            label="Wind"
            value={`${current.windKmph} km/h`}
            progressPct={Math.min(100, (current.windKmph / 40) * 100)}
            progressColor={current.windKmph > 25 ? '#EF4444' : current.windKmph > 15 ? '#F59E0B' : '#10B981'}
            statusLabel={current.windKmph > 25 ? 'High' : current.windKmph > 15 ? 'Breezy' : 'Calm'}
            statusColor={current.windKmph > 25 ? '#EF4444' : current.windKmph > 15 ? '#F59E0B' : '#10B981'}
          />
          <WeatherMetric
            iconComponent={<MaterialCommunityIcons name="sprout" size={13} color="#15803D" style={{ marginRight: 4 }} />}
            label="Soil"
            value={`${current.soilMoistureRootZonePct}%`}
            progressPct={current.soilMoistureRootZonePct}
            progressColor={current.soilMoistureRootZonePct < 40 ? '#EF4444' : current.soilMoistureRootZonePct < 60 ? '#F59E0B' : '#10B981'}
            statusLabel={current.soilMoistureRootZonePct < 40 ? 'Low Moisture' : current.soilMoistureRootZonePct < 60 ? 'Moderate' : 'Optimal'}
            statusColor={current.soilMoistureRootZonePct < 40 ? '#EF4444' : current.soilMoistureRootZonePct < 60 ? '#F59E0B' : '#10B981'}
          />
        </View>

        <View
          style={[
            styles.agentPill,
            {
              backgroundColor: `${hydro.statusColor}0F`,
              borderColor: `${hydro.statusColor}33`,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="droplet" size={13} color={hydro.statusColor} />
            <Text
              style={[
                styles.agentPillText,
                { color: hydro.statusColor, flex: 1 },
              ]}
            >
              {hasPrescription
                ? `AI Water Prescription: ${formatNumber(hydro.litersPerAcre)} L/Acre (${method.shortName}: ${hydro.pumpRuntimePerAcreLabel}) • Tap for full schedule →`
                : `${hydro.statusShort} • Tap for full plan →`}
            </Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.soilText}>
            ET₀ {hydro.et0Mm.toFixed(2)} mm · Rain{' '}
            {report.weather.next24hRainProbabilityPct}% next 24h
          </Text>
          <Text
            style={[
              styles.riskText,
              {
                color:
                  sentinel.riskLevel === 'low'
                    ? PRIMARY
                    : sentinel.riskLevel === 'moderate'
                      ? AMBER
                      : '#B42318',
              },
            ]}
          >
            {sentinel.riskLevel.toUpperCase()} RISK
          </Text>
        </View>

        {error ? (
          <Text style={styles.errorNote}>{error}</Text>
        ) : null}
      </Pressable>

      <HomeGpsAction gps={gps} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
    shadowColor: '#2D7A31',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  locationBlock: {
    flex: 1,
    paddingRight: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  location: {
    fontSize: 13,
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
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  gpsBadgeText: {
    fontSize: 7,
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
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  syncText: {
    fontSize: 9,
    color: PRIMARY,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginLeft: 6,
  },
  syncDivider: {
    fontSize: 10,
    color: '#A6B2A6',
    marginHorizontal: 4,
  },
  updatedText: {
    fontSize: 10,
    color: MUTED,
    fontWeight: '600',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#EAF4E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherIcon: {
    fontSize: 31,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  temperature: {
    fontSize: 50,
    lineHeight: 56,
    fontWeight: '800',
    color: DARK,
  },
  degree: {
    fontSize: 22,
    fontWeight: '700',
  },
  conditionBlock: {
    flex: 1,
    marginLeft: 14,
    paddingBottom: 5,
  },
  condition: {
    fontSize: 13,
    fontWeight: '800',
    color: DARK,
  },
  feelsLike: {
    fontSize: 10,
    color: MUTED,
    marginTop: 3,
  },
  aiTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF4E9',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 7,
  },
  aiTagText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: PRIMARY,
  },
  syncSpinner: {
    marginBottom: 8,
    marginLeft: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  metric: {
    flex: 1,
    backgroundColor: SOFT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDF4EC',
    paddingHorizontal: 9,
    paddingVertical: 9,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricIcon: {
    fontSize: 10,
  },
  metricLabel: {
    fontSize: 9,
    color: MUTED,
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 13,
    color: DARK,
    fontWeight: '800',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  metricProgressTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  metricProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  metricStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  metricStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricStatusText: {
    fontSize: 8.5,
    fontWeight: '700',
  },
  agentPill: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
  },
  agentPillText: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  soilText: {
    flex: 1,
    fontSize: 9,
    color: MUTED,
    fontWeight: '600',
  },
  riskText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  errorNote: {
    marginTop: 10,
    fontSize: 9,
    lineHeight: 14,
    color: AMBER,
    fontWeight: '600',
  },
  loadingTitle: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
  },
  loadingMessage: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 17,
    color: MUTED,
  },
  loadingLink: {
    marginTop: 12,
    fontSize: 11,
    fontWeight: '800',
    color: PRIMARY,
  },
  gpsBlock: {
    marginTop: 12,
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
});
