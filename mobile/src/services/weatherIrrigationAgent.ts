// src/services/weatherIrrigationAgent.ts
import { Platform } from 'react-native';

import {
  formatClockLabel,
  formatINR,
  formatNumber,
  formatPumpDuration,
} from '@/utils/format';

export type CityId = string;

export interface City {
  id: CityId;
  name: string;
  shortName: string;
  state: string;
  stateCode: string;
  district?: string | null;
  elevationM?: number | null;
  latitude: number;
  longitude: number;
  area?: string | null;
  displayName?: string | null;
  isGpsDetected?: boolean;
}

export interface IndianLocation {
  id: number;
  name: string;
  state: string;
  district: string | null;
  latitude: number;
  longitude: number;
  elevation: number | null;
}

export interface WeatherTelemetryLocation {
  name: string;
  state: string;
  district?: string | null;
  lat: number;
  lon: number;
  elevation?: number | null;
  id?: number | string;
  area?: string | null;
  displayName?: string | null;
  isGpsDetected?: boolean;
}

export type LocationSource = 'gps' | 'ip' | 'default';

export interface DetectedFarmLocation {
  name: string;
  area: string | null;
  city: string;
  district?: string;
  state: string;
  displayName: string;
  lat: number;
  lon: number;
  isGpsDetected: boolean;
  source: LocationSource;
}

export const CITIES: City[] = [
  {
    id: 'kolhapur',
    name: 'Kolhapur',
    shortName: 'Kolhapur',
    state: 'Maharashtra',
    stateCode: 'MH',
    latitude: 16.705,
    longitude: 74.2433,
  },
  {
    id: 'pune',
    name: 'Pune',
    shortName: 'Pune',
    state: 'Maharashtra',
    stateCode: 'MH',
    latitude: 18.5204,
    longitude: 73.8567,
  },
  {
    id: 'nashik',
    name: 'Nashik',
    shortName: 'Nashik',
    state: 'Maharashtra',
    stateCode: 'MH',
    latitude: 19.9975,
    longitude: 73.7898,
  },
  {
    id: 'nagpur',
    name: 'Nagpur',
    shortName: 'Nagpur',
    state: 'Maharashtra',
    stateCode: 'MH',
    latitude: 21.1458,
    longitude: 79.0882,
  },
  {
    id: 'sangli',
    name: 'Sangli',
    shortName: 'Sangli',
    state: 'Maharashtra',
    stateCode: 'MH',
    latitude: 16.8524,
    longitude: 74.5815,
  },
  {
    id: 'satara',
    name: 'Satara',
    shortName: 'Satara',
    state: 'Maharashtra',
    stateCode: 'MH',
    latitude: 17.6805,
    longitude: 74.0183,
  },
  {
    id: 'solapur',
    name: 'Solapur',
    shortName: 'Solapur',
    state: 'Maharashtra',
    stateCode: 'MH',
    latitude: 17.6599,
    longitude: 75.9064,
  },
];

export const INDIA_PRESETS: City[] = [
  {
    id: 'kolhapur',
    name: 'Kolhapur',
    shortName: 'Kolhapur',
    state: 'Maharashtra',
    stateCode: 'MH',
    district: 'Kolhapur',
    elevationM: 569,
    latitude: 16.705,
    longitude: 74.2433,
  },
  {
    id: 'ludhiana',
    name: 'Ludhiana',
    shortName: 'Ludhiana',
    state: 'Punjab',
    stateCode: 'PB',
    district: 'Ludhiana',
    elevationM: 247,
    latitude: 30.901,
    longitude: 75.8573,
  },
  {
    id: 'indore',
    name: 'Indore',
    shortName: 'Indore',
    state: 'Madhya Pradesh',
    stateCode: 'MP',
    district: 'Indore',
    elevationM: 553,
    latitude: 22.7196,
    longitude: 75.8577,
  },
  {
    id: 'coimbatore',
    name: 'Coimbatore',
    shortName: 'Coimbatore',
    state: 'Tamil Nadu',
    stateCode: 'TN',
    district: 'Coimbatore',
    elevationM: 411,
    latitude: 11.0168,
    longitude: 76.9558,
  },
  {
    id: 'karnal',
    name: 'Karnal',
    shortName: 'Karnal',
    state: 'Haryana',
    stateCode: 'HR',
    district: 'Karnal',
    elevationM: 243,
    latitude: 29.6857,
    longitude: 76.9905,
  },
  {
    id: 'guntur',
    name: 'Guntur',
    shortName: 'Guntur',
    state: 'Andhra Pradesh',
    stateCode: 'AP',
    district: 'Guntur',
    elevationM: 33,
    latitude: 16.3067,
    longitude: 80.4365,
  },
  {
    id: 'rajkot',
    name: 'Rajkot',
    shortName: 'Rajkot',
    state: 'Gujarat',
    stateCode: 'GJ',
    district: 'Rajkot',
    elevationM: 128,
    latitude: 22.3039,
    longitude: 70.8022,
  },
  {
    id: 'varanasi',
    name: 'Varanasi',
    shortName: 'Varanasi',
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    district: 'Varanasi',
    elevationM: 81,
    latitude: 25.3176,
    longitude: 82.9739,
  },
];

export const DEFAULT_CITY_ID: CityId = 'kolhapur';
export const DEFAULT_WEATHER_LOCATION: City = INDIA_PRESETS[0];

export function getCity(cityId: CityId): City {
  return (
    INDIA_PRESETS.find((city) => city.id === cityId) ??
    CITIES.find((city) => city.id === cityId) ??
    DEFAULT_WEATHER_LOCATION
  );
}

function normalizedPlace(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function distinctArea(
  area: string | undefined,
  ...excluded: (string | undefined)[]
): string | undefined {
  if (!area) return undefined;

  const normalized = normalizedPlace(area);

  if (!normalized) return undefined;

  const isDuplicate = excluded.some(
    (value) => normalizedPlace(value) === normalized
  );

  return isDuplicate ? undefined : area;
}

export function getCityDisplayName(city: City): string {
  if (city.displayName) return city.displayName;

  const area = distinctArea(
    city.area ?? undefined,
    city.name,
    city.state
  );

  return area
    ? `${area}, ${city.name}, ${city.state}`
    : `${city.name}, ${city.state}`;
}

export function indianLocationToCity(
  location: IndianLocation
): City {
  return {
    id: `geo-${location.id}`,
    name: location.name,
    shortName: location.name,
    state: location.state,
    stateCode: '',
    district: location.district,
    elevationM: location.elevation,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

export function detectedFarmLocationToCity(
  location: DetectedFarmLocation
): City {
  const cityName = location.city || location.name;

  return {
    id: `gps-${location.lat.toFixed(5)}-${location.lon.toFixed(5)}`,
    name: cityName,
    shortName: cityName,
    state: location.state,
    stateCode: '',
    district: location.district ?? null,
    elevationM: null,
    latitude: location.lat,
    longitude: location.lon,
    area: location.area,
    displayName: location.displayName,
    isGpsDetected: location.isGpsDetected,
  };
}

export type CropId =
  | 'sugarcane'
  | 'paddy'
  | 'tomato'
  | 'onion'
  | 'soybean'
  | 'wheat'
  | 'cotton';

export type GrowthStageId =
  | 'initial'
  | 'vegetative'
  | 'flowering'
  | 'maturity';

export type SoilId = 'black' | 'red' | 'alluvial';

export type MethodId = 'drip' | 'sprinkler' | 'flood';

export interface CropProfile {
  id: CropId;
  name: string;
  icon: string;
  iconName?: string;
  valuePerAcre: number;
  kc: Record<GrowthStageId, number>;
}

export interface GrowthStageProfile {
  id: GrowthStageId;
  label: string;
  shortLabel: string;
  icon: string;
  stepNumber: string;
  sensitivity: number;
}

export interface SoilProfile {
  id: SoilId;
  name: string;
  shortName: string;
  icon: string;
  swatchColor: string;
  targetMoisturePct: number;
  stressSensitivity: number;
  retentionLabel: string;
}

export interface IrrigationMethod {
  id: MethodId;
  name: string;
  shortName: string;
  icon: string;
  iconName: string;
  efficiencyPct: number;
}

export const CROPS: Record<CropId, CropProfile> = {
  sugarcane: {
    id: 'sugarcane',
    name: 'Sugarcane',
    icon: 'sprout',
    iconName: 'sprout',
    valuePerAcre: 180000,
    kc: {
      initial: 0.45,
      vegetative: 0.85,
      flowering: 1.25,
      maturity: 0.75,
    },
  },
  paddy: {
    id: 'paddy',
    name: 'Paddy (Rice)',
    icon: 'sprout',
    iconName: 'sprout',
    valuePerAcre: 65000,
    kc: {
      initial: 1.05,
      vegetative: 1.1,
      flowering: 1.2,
      maturity: 0.9,
    },
  },
  tomato: {
    id: 'tomato',
    name: 'Tomato',
    icon: 'sprout',
    iconName: 'sprout',
    valuePerAcre: 220000,
    kc: {
      initial: 0.6,
      vegetative: 0.85,
      flowering: 1.15,
      maturity: 0.8,
    },
  },
  onion: {
    id: 'onion',
    name: 'Onion',
    icon: 'sprout',
    iconName: 'sprout',
    valuePerAcre: 150000,
    kc: {
      initial: 0.7,
      vegetative: 0.85,
      flowering: 1.05,
      maturity: 0.75,
    },
  },
  soybean: {
    id: 'soybean',
    name: 'Soybean',
    icon: 'sprout',
    iconName: 'sprout',
    valuePerAcre: 60000,
    kc: {
      initial: 0.4,
      vegetative: 0.75,
      flowering: 1.15,
      maturity: 0.7,
    },
  },
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    icon: 'sprout',
    iconName: 'sprout',
    valuePerAcre: 70000,
    kc: {
      initial: 0.4,
      vegetative: 0.75,
      flowering: 1.15,
      maturity: 0.4,
    },
  },
  cotton: {
    id: 'cotton',
    name: 'Cotton',
    icon: 'sprout',
    iconName: 'sprout',
    valuePerAcre: 95000,
    kc: {
      initial: 0.35,
      vegetative: 0.75,
      flowering: 1.18,
      maturity: 0.7,
    },
  },
};

export const CROP_OPTIONS: CropProfile[] = Object.values(CROPS);

export const GROWTH_STAGES: Record<
  GrowthStageId,
  GrowthStageProfile
> = {
  initial: {
    id: 'initial',
    label: 'Initial',
    shortLabel: 'Initial',
    icon: 'sprout',
    stepNumber: '01',
    sensitivity: 0.65,
  },
  vegetative: {
    id: 'vegetative',
    label: 'Vegetative',
    shortLabel: 'Vegetative',
    icon: 'layers',
    stepNumber: '02',
    sensitivity: 1,
  },
  flowering: {
    id: 'flowering',
    label: 'Flowering / Fruiting',
    shortLabel: 'Flowering',
    icon: 'sun',
    stepNumber: '03',
    sensitivity: 1.35,
  },
  maturity: {
    id: 'maturity',
    label: 'Maturity',
    shortLabel: 'Maturity',
    icon: 'check-circle',
    stepNumber: '04',
    sensitivity: 0.8,
  },
};

export const STAGE_OPTIONS: GrowthStageProfile[] =
  Object.values(GROWTH_STAGES);

export const SOILS: Record<SoilId, SoilProfile> = {
  black: {
    id: 'black',
    name: 'Black Cotton Soil',
    shortName: 'Black Cotton',
    icon: 'disc',
    swatchColor: '#27272A',
    targetMoisturePct: 30,
    stressSensitivity: 0.35,
    retentionLabel: 'High water retention',
  },
  red: {
    id: 'red',
    name: 'Red Loamy Soil',
    shortName: 'Red Loamy',
    icon: 'disc',
    swatchColor: '#9A3412',
    targetMoisturePct: 24,
    stressSensitivity: 0.45,
    retentionLabel: 'Fast-draining, low retention',
  },
  alluvial: {
    id: 'alluvial',
    name: 'Alluvial Soil',
    shortName: 'Alluvial',
    icon: 'disc',
    swatchColor: '#CA8A04',
    targetMoisturePct: 27,
    stressSensitivity: 0.4,
    retentionLabel: 'Medium water retention',
  },
};

export const SOIL_OPTIONS: SoilProfile[] = Object.values(SOILS);

export const METHODS: Record<MethodId, IrrigationMethod> = {
  drip: {
    id: 'drip',
    name: 'Drip Irrigation',
    shortName: 'Drip',
    icon: 'droplet',
    iconName: 'droplet',
    efficiencyPct: 90,
  },
  sprinkler: {
    id: 'sprinkler',
    name: 'Sprinkler Irrigation',
    shortName: 'Sprinkler',
    icon: 'wind',
    iconName: 'sprinkler-variant',
    efficiencyPct: 75,
  },
  flood: {
    id: 'flood',
    name: 'Flood Irrigation',
    shortName: 'Flood',
    icon: 'layers',
    iconName: 'layers',
    efficiencyPct: 50,
  },
};

export const METHOD_OPTIONS: IrrigationMethod[] =
  Object.values(METHODS);

export interface FarmContext {
  cropId: CropId;
  stageId: GrowthStageId;
  soilId: SoilId;
  methodId: MethodId;
  acres: number;
}

export const DEFAULT_FARM_CONTEXT: FarmContext = {
  cropId: 'sugarcane',
  stageId: 'vegetative',
  soilId: 'black',
  methodId: 'drip',
  acres: 5,
};

export interface WeatherCondition {
  label: string;
  icon: string;
}

const WEATHER_CODE_MAP: Record<number, WeatherCondition> = {
  0: { label: 'Clear sky', icon: 'sun' },
  1: { label: 'Mainly clear', icon: 'sun' },
  2: { label: 'Partly cloudy', icon: 'cloud' },
  3: { label: 'Overcast', icon: 'cloud' },
  45: { label: 'Fog', icon: 'cloud' },
  48: { label: 'Depositing rime fog', icon: 'cloud' },
  51: { label: 'Light drizzle', icon: 'cloud-drizzle' },
  53: { label: 'Drizzle', icon: 'cloud-drizzle' },
  55: { label: 'Dense drizzle', icon: 'cloud-rain' },
  56: { label: 'Freezing drizzle', icon: 'cloud-rain' },
  57: { label: 'Dense freezing drizzle', icon: 'cloud-rain' },
  61: { label: 'Light rain', icon: 'cloud-rain' },
  63: { label: 'Rain', icon: 'cloud-rain' },
  65: { label: 'Heavy rain', icon: 'cloud-rain' },
  66: { label: 'Freezing rain', icon: 'cloud-rain' },
  67: { label: 'Heavy freezing rain', icon: 'cloud-rain' },
  71: { label: 'Light snow', icon: 'cloud-snow' },
  73: { label: 'Snow', icon: 'cloud-snow' },
  75: { label: 'Heavy snow', icon: 'cloud-snow' },
  77: { label: 'Snow grains', icon: 'cloud-snow' },
  80: { label: 'Light rain showers', icon: 'cloud-rain' },
  81: { label: 'Rain showers', icon: 'cloud-rain' },
  82: { label: 'Violent rain showers', icon: 'cloud-lightning' },
  85: { label: 'Snow showers', icon: 'cloud-snow' },
  86: { label: 'Heavy snow showers', icon: 'cloud-snow' },
  95: { label: 'Thunderstorm', icon: 'cloud-lightning' },
  96: { label: 'Thunderstorm with hail', icon: 'cloud-lightning' },
  99: { label: 'Severe thunderstorm with hail', icon: 'cloud-lightning' },
};

export function getWeatherCondition(code: number): WeatherCondition {
  return (
    WEATHER_CODE_MAP[code] ?? {
      label: 'Mixed field conditions',
      icon: 'cloud',
    }
  );
}

export type TelemetrySource = 'live' | 'offline';

export interface CurrentTelemetry {
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPct: number;
  precipitationMm: number;
  rainMm: number;
  weatherCode: number;
  condition: string;
  icon: string;
  windKmph: number;
  soilMoistureSurfacePct: number;
  soilMoistureRootZonePct: number;
  et0TodayMm: number;
}

export interface HourlyTelemetry {
  time: string;
  temperatureC: number;
  precipitationProbabilityPct: number;
  et0Mm: number;
  soilMoistureRootZonePct: number;
}

export interface DailyForecast {
  date: string;
  weekday: string;
  dateLabel: string;
  weatherCode: number;
  condition: string;
  icon: string;
  maxTempC: number;
  minTempC: number;
  precipitationSumMm: number;
  precipitationProbabilityMaxPct: number;
  et0Mm: number;
}

export interface LiveWeather {
  city: City;
  latitude: number;
  longitude: number;
  elevationM: number;
  timezone: string;
  fetchedAt: string;
  observedAt: string;
  source: TelemetrySource;
  current: CurrentTelemetry;
  hourly: HourlyTelemetry[];
  daily: DailyForecast[];
  next24hRainProbabilityPct: number;
  next24hRainMm: number;
}

interface OpenMeteoCurrent {
  time?: string;
  temperature_2m?: number | null;
  relative_humidity_2m?: number | null;
  apparent_temperature?: number | null;
  precipitation?: number | null;
  rain?: number | null;
  weather_code?: number | null;
  wind_speed_10m?: number | null;
  soil_moisture_0_to_1cm?: number | null;
}

interface OpenMeteoHourly {
  time?: string[];
  temperature_2m?: (number | null)[];
  precipitation_probability?: (number | null)[];
  et0_fao_evapotranspiration?: (number | null)[];
  soil_moisture_3_to_9cm?: (number | null)[];
}

interface OpenMeteoDaily {
  time?: string[];
  weather_code?: (number | null)[];
  temperature_2m_max?: (number | null)[];
  temperature_2m_min?: (number | null)[];
  precipitation_sum?: (number | null)[];
  precipitation_probability_max?: (number | null)[];
  et0_fao_evapotranspiration?: (number | null)[];
}

interface OpenMeteoResponse {
  latitude?: number;
  longitude?: number;
  elevation?: number;
  timezone?: string;
  current?: OpenMeteoCurrent;
  hourly?: OpenMeteoHourly;
  daily?: OpenMeteoDaily;
}

export class WeatherApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'WeatherApiError';
    this.status = status;
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' ||
      error.message.toLowerCase().includes('aborted'))
  );
}

export function isNetworkWeatherError(error: unknown): boolean {
  if (isAbortError(error)) return true;
  if (error instanceof WeatherApiError) return false;

  if (error instanceof TypeError) return true;

  return (
    error instanceof Error &&
    /network|failed to fetch|fetch failed|load failed|offline/i.test(
      error.message
    )
  );
}

const API_BASE = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_API_BASE =
  'https://geocoding-api.open-meteo.com/v1/search';

interface OpenMeteoGeocodingResult {
  id?: number;
  name?: string;
  latitude?: number;
  longitude?: number;
  elevation?: number | null;
  country_code?: string;
  admin1?: string;
  admin2?: string;
}

interface OpenMeteoGeocodingResponse {
  results?: OpenMeteoGeocodingResult[];
}

export async function searchIndianLocations(
  query: string,
  signal?: AbortSignal
): Promise<IndianLocation[]> {
  const trimmed = query.trim();

  if (trimmed.length < 2) return [];

  const url = `${GEOCODING_API_BASE}?name=${encodeURIComponent(
    trimmed
  )}&count=10&language=en&format=json&countryCode=IN`;

  const response = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new WeatherApiError(
      `Location search returned HTTP ${response.status}.`,
      response.status
    );
  }

  const data =
    (await response.json()) as OpenMeteoGeocodingResponse;
  const seen = new Set<string>();

  return (data.results ?? []).flatMap((result, index) => {
    const name = result.name?.trim();
    const latitude = result.latitude;
    const longitude = result.longitude;

    if (
      !name ||
      typeof latitude !== 'number' ||
      !Number.isFinite(latitude) ||
      typeof longitude !== 'number' ||
      !Number.isFinite(longitude) ||
      (result.country_code && result.country_code !== 'IN')
    ) {
      return [];
    }

    const id =
      typeof result.id === 'number' ? result.id : index;
    const key = `${id}:${latitude}:${longitude}`;

    if (seen.has(key)) return [];
    seen.add(key);

    return [
      {
        id,
        name,
        state: result.admin1?.trim() || 'India',
        district: result.admin2?.trim() || null,
        latitude,
        longitude,
        elevation:
          typeof result.elevation === 'number' &&
          Number.isFinite(result.elevation)
            ? result.elevation
            : null,
      },
    ];
  });
}

interface DetectedCoordinates {
  latitude: number;
  longitude: number;
}

type GpsFailureReason =
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'unsupported';

interface GpsAcquisition {
  coordinates: DetectedCoordinates | null;
  reason?: GpsFailureReason;
}

interface IpGeoLocation extends DetectedCoordinates {
  city?: string;
  region?: string;
}

interface AdministrativeArea {
  name?: string;
  description?: string;
  adminLevel?: number;
}

interface ReverseGeocodeResult {
  area?: string;
  city: string;
  district?: string;
  state: string;
}

const GPS_TIMEOUT_MS = 12000;
const REVERSE_GEOCODE_TIMEOUT_MS = 8000;

const NOMINATIM_REVERSE_URL =
  'https://nominatim.openstreetmap.org/reverse';
const BIGDATACLOUD_REVERSE_URL =
  'https://api.bigdatacloud.net/data/reverse-geocode-client';

const NOMINATIM_AREA_KEYS = [
  'suburb',
  'neighbourhood',
  'residential',
  'quarter',
  'village',
  'hamlet',
  'town',
  'road',
  'county',
] as const;

const NOMINATIM_CITY_KEYS = [
  'city',
  'town',
  'municipality',
  'state_district',
  'county',
] as const;

const LOCAL_AREA_DESCRIPTION_PATTERN =
  /suburb|neighbourhood|neighborhood|residential|quarter|village|hamlet|locality|town/i;

function finiteCoordinate(value: unknown): number | null {
  const parsed =
    typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : undefined;
}

function asRecord(
  value: unknown
): Record<string, unknown> | null {
  return value &&
    typeof value === 'object' &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    const text = asString(value);
    if (text) return text;
  }

  return undefined;
}

function asAdministrativeAreas(
  value: unknown
): AdministrativeArea[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    const record = asRecord(item);

    if (!record) return [];

    return [
      {
        name: asString(record.name),
        description: firstString(
          record.description,
          record.class
        ),
        adminLevel:
          finiteCoordinate(record.adminLevel) ?? undefined,
      },
    ];
  });
}

function pickAdministrativeArea(
  areas: AdministrativeArea[],
  levels: number[],
  ...excluded: (string | undefined)[]
): string | undefined {
  for (const level of levels) {
    const match = areas.find(
      (area) =>
        area.adminLevel === level &&
        Boolean(distinctArea(area.name, ...excluded))
    );

    if (match?.name) return match.name;
  }

  return undefined;
}

async function fetchJsonWithTimeout(
  url: string,
  timeoutMs: number,
  extraHeaders?: Record<string, string>
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...extraHeaders,
      },
    });

    if (!response.ok) {
      throw new WeatherApiError(
        `Location service returned HTTP ${response.status}.`,
        response.status
      );
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function reverseGeocodeWithNominatim(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  const url = `${NOMINATIM_REVERSE_URL}?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=en`;

  try {
    const data = await fetchJsonWithTimeout(
      url,
      REVERSE_GEOCODE_TIMEOUT_MS,
      {
        'User-Agent':
          'FutureFarming/1.0 (Smart Agriculture Ecosystem)',
        'Accept-Language': 'en',
      }
    );
    const address = asRecord(asRecord(data)?.address);

    if (!address) return null;

    const area = firstString(
      ...NOMINATIM_AREA_KEYS.map((key) => address[key])
    );
    const city = firstString(
      ...NOMINATIM_CITY_KEYS.map((key) => address[key])
    );
    const state = asString(address.state);
    const district = firstString(
      address.state_district,
      address.county
    );

    if (!area && !city) return null;

    const resolvedCity =
      city ?? area ?? district ?? 'Current Location';

    return {
      area: distinctArea(area, resolvedCity, state),
      city: resolvedCity,
      district,
      state: state ?? 'India',
    };
  } catch {
    return null;
  }
}

async function reverseGeocodeWithBigDataCloud(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  const url = `${BIGDATACLOUD_REVERSE_URL}?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

  try {
    const data = await fetchJsonWithTimeout(
      url,
      REVERSE_GEOCODE_TIMEOUT_MS
    );
    const record = asRecord(data);

    if (!record) return null;

    const localityInfo = asRecord(record.localityInfo);
    const administrative = asAdministrativeAreas(
      localityInfo?.administrative
    );
    const informative = asAdministrativeAreas(
      localityInfo?.informative
    );
    const city = asString(record.city);
    const locality = asString(record.locality);
    const state =
      asString(record.principalSubdivision) ?? 'India';
    const informativeArea = informative.find(
      (area) =>
        area.name &&
        LOCAL_AREA_DESCRIPTION_PATTERN.test(
          area.description ?? ''
        ) &&
        Boolean(distinctArea(area.name, city, state))
    )?.name;
    const administrativeArea = pickAdministrativeArea(
      administrative,
      [10, 8, 6],
      city,
      locality,
      state
    );
    const area =
      distinctArea(locality, city, state) ??
      informativeArea ??
      administrativeArea;
    const resolvedCity =
      city ??
      pickAdministrativeArea(
        administrative,
        [6, 5],
        state
      ) ??
      locality ??
      area ??
      state;
    const district =
      administrative.find((item) =>
        /district/i.test(item.name ?? '')
      )?.name ??
      administrative.find((item) =>
        /taluka|tehsil/i.test(item.name ?? '')
      )?.name ??
      pickAdministrativeArea(
        administrative,
        [7, 5, 6],
        resolvedCity,
        state
      );

    if (
      !city &&
      !locality &&
      !area &&
      administrative.length === 0
    ) {
      return null;
    }

    return {
      area: distinctArea(area, resolvedCity, state),
      city: resolvedCity,
      district,
      state,
    };
  } catch {
    return null;
  }
}

async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  const [nominatim, bigDataCloud] = await Promise.all([
    reverseGeocodeWithNominatim(latitude, longitude),
    reverseGeocodeWithBigDataCloud(latitude, longitude),
  ]);

  if (!nominatim && !bigDataCloud) return null;

  const city =
    nominatim?.city ??
    bigDataCloud?.city ??
    'Current Location';
  const state =
    (nominatim?.state && nominatim.state !== 'India'
      ? nominatim.state
      : undefined) ??
    bigDataCloud?.state ??
    nominatim?.state ??
    'India';

  return {
    area:
      distinctArea(nominatim?.area, city, state) ??
      distinctArea(bigDataCloud?.area, city, state),
    city,
    district: nominatim?.district ?? bigDataCloud?.district,
    state,
  };
}

function getBrowserCoordinates(): Promise<GpsAcquisition> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.geolocation
  ) {
    return Promise.resolve({
      coordinates: null,
      reason: 'unsupported',
    });
  }

  return new Promise((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout>;

    const finish = (result: GpsAcquisition) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    timer = setTimeout(
      () =>
        finish({ coordinates: null, reason: 'timeout' }),
      GPS_TIMEOUT_MS
    );

    navigator.geolocation.getCurrentPosition(
      (position) =>
        finish({
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        }),
      (error) =>
        finish({
          coordinates: null,
          reason:
            error.code === 1
              ? 'denied'
              : error.code === 2
                ? 'unavailable'
                : 'timeout',
        }),
      {
        enableHighAccuracy: true,
        timeout: GPS_TIMEOUT_MS,
        maximumAge: 0,
      }
    );
  });
}

async function getExpoCoordinates(): Promise<GpsAcquisition> {
  try {
    const Location = await import('expo-location');
    const permission =
      await Location.requestForegroundPermissionsAsync();

    if (permission.status !== 'granted') {
      return {
        coordinates: null,
        reason: permission.canAskAgain
          ? 'unavailable'
          : 'denied',
      };
    }

    const servicesEnabled =
      await Location.hasServicesEnabledAsync();

    if (!servicesEnabled) {
      return { coordinates: null, reason: 'unavailable' };
    }

    const position = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      }),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), GPS_TIMEOUT_MS);
      }),
    ]);

    if (!position) {
      return { coordinates: null, reason: 'timeout' };
    }

    return {
      coordinates: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
    };
  } catch {
    return { coordinates: null, reason: 'unavailable' };
  }
}

async function detectDeviceCoordinates(): Promise<GpsAcquisition> {
  if (Platform.OS === 'web') {
    return getBrowserCoordinates();
  }

  return getExpoCoordinates();
}

function parseIpGeoLocation(
  value: unknown
): IpGeoLocation | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const latitude = finiteCoordinate(record.latitude);
  const longitude = finiteCoordinate(record.longitude);

  if (latitude === null || longitude === null) return null;

  return {
    latitude,
    longitude,
    city: asString(record.city),
    region: asString(record.region),
  };
}

async function getIpCoordinates(): Promise<IpGeoLocation | null> {
  const endpoints = [
    'https://ipapi.co/json/',
    'https://get.geojs.io/v1/ip/geo.json',
  ];

  const results = await Promise.allSettled(
    endpoints.map(async (url) => {
      const data = await fetchJsonWithTimeout(url, 8000);
      return parseIpGeoLocation(data);
    })
  );

  for (const result of results) {
    if (
      result.status === 'fulfilled' &&
      result.value !== null
    ) {
      return result.value;
    }
  }

  return null;
}

export async function detectCurrentFarmLocation(): Promise<DetectedFarmLocation> {
  const gps = await detectDeviceCoordinates();
  const isGpsDetected = gps.coordinates !== null;
  const ipCoordinates = isGpsDetected
    ? null
    : await getIpCoordinates();
  const latitude =
    gps.coordinates?.latitude ?? ipCoordinates?.latitude;
  const longitude =
    gps.coordinates?.longitude ?? ipCoordinates?.longitude;

  if (latitude === undefined || longitude === undefined) {
    const fallbackCity = DEFAULT_WEATHER_LOCATION.name;

    return {
      name: fallbackCity,
      area: null,
      city: fallbackCity,
      district:
        DEFAULT_WEATHER_LOCATION.district ?? undefined,
      state: DEFAULT_WEATHER_LOCATION.state,
      displayName: `${fallbackCity}, ${DEFAULT_WEATHER_LOCATION.state}`,
      lat: DEFAULT_WEATHER_LOCATION.latitude,
      lon: DEFAULT_WEATHER_LOCATION.longitude,
      isGpsDetected: false,
      source: 'default',
    };
  }

  const reverseGeocoded = await reverseGeocodeCoordinates(
    latitude,
    longitude
  );
  const city =
    reverseGeocoded?.city ??
    ipCoordinates?.city ??
    'Current Location';
  const state =
    reverseGeocoded?.state ??
    ipCoordinates?.region ??
    'India';
  const area =
    distinctArea(reverseGeocoded?.area, city, state) ??
    null;
  const displayName = area
    ? `${area}, ${city}, ${state}`
    : `${city}, ${state}`;

  return {
    name: city,
    area,
    city,
    district: reverseGeocoded?.district,
    state,
    displayName,
    lat: latitude,
    lon: longitude,
    isGpsDetected,
    source: isGpsDetected ? 'gps' : 'ip',
  };
}

function toNumber(
  value: number | null | undefined,
  fallback = 0
): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : fallback;
}

function soilPercent(value: number | null | undefined): number {
  const raw = toNumber(value, 0);
  return Math.max(0, Math.min(100, raw <= 1 ? raw * 100 : raw));
}

function round(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function dateLabels(date: string): {
  weekday: string;
  dateLabel: string;
} {
  const parsed = new Date(`${date}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return { weekday: date, dateLabel: date };
  }

  try {
    return {
      weekday: parsed.toLocaleDateString('en-IN', {
        weekday: 'short',
      }),
      dateLabel: parsed.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      }),
    };
  } catch {
    return { weekday: date, dateLabel: date };
  }
}

function currentHourIndex(
  times: string[],
  observedAt: string
): number {
  const observedHour = observedAt.slice(0, 13);
  const exact = times.findIndex(
    (time) => time.slice(0, 13) === observedHour
  );

  if (exact >= 0) return exact;

  let closest = 0;

  for (let index = 0; index < times.length; index += 1) {
    if (times[index] <= observedAt) closest = index;
  }

  return closest;
}

export function buildOpenMeteoUrl(city: City): string {
  const current = [
    'temperature_2m',
    'relative_humidity_2m',
    'apparent_temperature',
    'precipitation',
    'rain',
    'weather_code',
    'wind_speed_10m',
    'soil_moisture_0_to_1cm',
  ].join(',');

  const hourly = [
    'temperature_2m',
    'precipitation_probability',
    'et0_fao_evapotranspiration',
    'soil_moisture_3_to_9cm',
  ].join(',');

  const daily = [
    'weather_code',
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_sum',
    'precipitation_probability_max',
    'et0_fao_evapotranspiration',
  ].join(',');

  return `${API_BASE}?latitude=${city.latitude}&longitude=${city.longitude}&current=${current}&hourly=${hourly}&daily=${daily}&timezone=auto&forecast_days=7`;
}

export async function fetchLiveWeather(
  city: City,
  signal?: AbortSignal
): Promise<LiveWeather> {
  const response = await fetch(buildOpenMeteoUrl(city), {
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new WeatherApiError(
      `Open-Meteo returned HTTP ${response.status}.`,
      response.status
    );
  }

  const data = (await response.json()) as OpenMeteoResponse;

  if (!data.current || !data.hourly || !data.daily) {
    throw new WeatherApiError(
      'Open-Meteo returned an incomplete telemetry payload.'
    );
  }

  const times = data.hourly.time ?? [];
  const observedAt = data.current.time ?? new Date().toISOString();
  const index = currentHourIndex(times, observedAt);

  const currentCode = toNumber(data.current.weather_code, 0);
  const currentCondition = getWeatherCondition(currentCode);

  const dailyTimes = data.daily.time ?? [];
  const daily: DailyForecast[] = dailyTimes.map((date, dayIndex) => {
    const code = toNumber(
      data.daily?.weather_code?.[dayIndex],
      0
    );
    const condition = getWeatherCondition(code);
    const labels = dateLabels(date);

    return {
      date,
      weekday: labels.weekday,
      dateLabel: labels.dateLabel,
      weatherCode: code,
      condition: condition.label,
      icon: condition.icon,
      maxTempC: round(
        toNumber(data.daily?.temperature_2m_max?.[dayIndex], 0),
        1
      ),
      minTempC: round(
        toNumber(data.daily?.temperature_2m_min?.[dayIndex], 0),
        1
      ),
      precipitationSumMm: round(
        toNumber(
          data.daily?.precipitation_sum?.[dayIndex],
          0
        ),
        1
      ),
      precipitationProbabilityMaxPct: round(
        toNumber(
          data.daily?.precipitation_probability_max?.[dayIndex],
          0
        )
      ),
      et0Mm: round(
        toNumber(
          data.daily?.et0_fao_evapotranspiration?.[dayIndex],
          0
        ),
        2
      ),
    };
  });

  const hourly: HourlyTelemetry[] = times.map((time, hourIndex) => ({
    time,
    temperatureC: round(
      toNumber(data.hourly?.temperature_2m?.[hourIndex], 0),
      1
    ),
    precipitationProbabilityPct: round(
      toNumber(
        data.hourly?.precipitation_probability?.[hourIndex],
        0
      )
    ),
    et0Mm: round(
      toNumber(
        data.hourly?.et0_fao_evapotranspiration?.[hourIndex],
        0
      ),
      2
    ),
    soilMoistureRootZonePct: round(
      soilPercent(
        data.hourly?.soil_moisture_3_to_9cm?.[hourIndex]
      ),
      1
    ),
  }));

  const next24Hours = hourly.slice(index, index + 24);
  const next24hRainProbabilityPct = next24Hours.reduce(
    (max, hour) =>
      Math.max(max, hour.precipitationProbabilityPct),
    0
  );

  const surfaceSoil = soilPercent(
    data.current.soil_moisture_0_to_1cm
  );
  const rootZoneSoil =
    hourly[index]?.soilMoistureRootZonePct ?? surfaceSoil;

  return {
    city,
    latitude: toNumber(data.latitude, city.latitude),
    longitude: toNumber(data.longitude, city.longitude),
    elevationM: toNumber(data.elevation, 0),
    timezone: data.timezone ?? 'Asia/Kolkata',
    fetchedAt: new Date().toISOString(),
    observedAt,
    source: 'live',
    current: {
      temperatureC: round(
        toNumber(data.current.temperature_2m, 0),
        1
      ),
      apparentTemperatureC: round(
        toNumber(data.current.apparent_temperature, 0),
        1
      ),
      humidityPct: round(
        toNumber(data.current.relative_humidity_2m, 0)
      ),
      precipitationMm: round(
        toNumber(data.current.precipitation, 0),
        1
      ),
      rainMm: round(toNumber(data.current.rain, 0), 1),
      weatherCode: currentCode,
      condition: currentCondition.label,
      icon: currentCondition.icon,
      windKmph: round(
        toNumber(data.current.wind_speed_10m, 0),
        1
      ),
      soilMoistureSurfacePct: round(surfaceSoil, 1),
      soilMoistureRootZonePct: round(rootZoneSoil, 1),
      et0TodayMm: daily[0]?.et0Mm ?? 0,
    },
    hourly,
    daily,
    next24hRainProbabilityPct,
    next24hRainMm: daily[0]?.precipitationSumMm ?? 0,
  };
}

export async function fetchLiveWeatherTelemetry(
  location: WeatherTelemetryLocation,
  signal?: AbortSignal
): Promise<LiveWeather> {
  if (
    !Number.isFinite(location.lat) ||
    !Number.isFinite(location.lon)
  ) {
    throw new WeatherApiError(
      'A valid latitude and longitude are required.'
    );
  }

  const id =
    typeof location.id === 'number'
      ? `geo-${location.id}`
      : location.id ?? `geo-${location.lat}-${location.lon}`;

  return fetchLiveWeather(
    {
      id,
      name: location.name,
      shortName: location.name,
      state: location.state,
      stateCode: '',
      district: location.district ?? null,
      elevationM: location.elevation ?? null,
      latitude: location.lat,
      longitude: location.lon,
      area: location.area ?? null,
      displayName: location.displayName ?? null,
      isGpsDetected: location.isGpsDetected,
    },
    signal
  );
}

const OFFLINE_ET0 = [5.4, 5.7, 5.2, 5.9, 6.1, 5.5, 5.0];
const OFFLINE_RAIN_MM = [0, 0.4, 0, 0, 0, 0, 0];
const OFFLINE_RAIN_PCT = [25, 15, 55, 30, 10, 25, 15];

export function createOfflineWeather(city: City): LiveWeather {
  const now = new Date();
  const cityBias = (city.name.charCodeAt(0) % 5) - 2;
  const temperature = round(28.4 + cityBias * 0.6, 1);
  const humidity = round(63 - cityBias * 1.5);
  const rootZone = round(20.8 + cityBias * 0.2, 1);
  const condition = getWeatherCondition(2);
  const daily: DailyForecast[] = OFFLINE_ET0.map(
    (et0, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() + index);
      const iso = date.toISOString().slice(0, 10);
      const labels = dateLabels(iso);

      return {
        date: iso,
        weekday: labels.weekday,
        dateLabel: labels.dateLabel,
        weatherCode: 2,
        condition: condition.label,
        icon: condition.icon,
        maxTempC: round(31.5 + cityBias * 0.7, 1),
        minTempC: round(20.5 + cityBias * 0.4, 1),
        precipitationSumMm: OFFLINE_RAIN_MM[index],
        precipitationProbabilityMaxPct:
          OFFLINE_RAIN_PCT[index],
        et0Mm: et0,
      };
    }
  );

  const hourly: HourlyTelemetry[] = Array.from(
    { length: 48 },
    (_, index) => {
      const hour = new Date(now);
      hour.setHours(now.getHours() + index, 0, 0, 0);
      const iso = hour.toISOString().slice(0, 16);

      return {
        time: iso,
        temperatureC: round(
          temperature + Math.sin((hour.getHours() / 24) * Math.PI * 2) * 3,
          1
        ),
        precipitationProbabilityPct:
          index < 24 ? OFFLINE_RAIN_PCT[0] : OFFLINE_RAIN_PCT[1],
        et0Mm: index < 24 ? 0.22 : 0.24,
        soilMoistureRootZonePct: rootZone,
      };
    }
  );

  return {
    city,
    latitude: city.latitude,
    longitude: city.longitude,
    elevationM: city.elevationM ?? 560,
    timezone: 'Asia/Kolkata',
    fetchedAt: now.toISOString(),
    observedAt: now.toISOString(),
    source: 'offline',
    current: {
      temperatureC: temperature,
      apparentTemperatureC: round(temperature + 2.1, 1),
      humidityPct: humidity,
      precipitationMm: 0,
      rainMm: 0,
      weatherCode: 2,
      condition: condition.label,
      icon: condition.icon,
      windKmph: round(7.5 + Math.abs(cityBias) * 1.4, 1),
      soilMoistureSurfacePct: round(rootZone + 0.6, 1),
      soilMoistureRootZonePct: rootZone,
      et0TodayMm: OFFLINE_ET0[0],
    },
    hourly,
    daily,
    next24hRainProbabilityPct: OFFLINE_RAIN_PCT[0],
    next24hRainMm: OFFLINE_RAIN_MM[0],
  };
}

export const ACRE_LITERS_PER_MM = 4046.86;
export const PUMP_LITERS_PER_HOUR = 18000;
export const PUMP_COST_PER_1000_L = 12;
export const FERTILIZER_COST_PER_ACRE_WEEK = 2200;
export const FLOOD_RUNOFF_LOSS_PCT = 0.12;
export const AI_RUNOFF_LOSS_PCT = 0.03;
export const WEEKLY_STRESS_LOSS_PCT = 0.003;
export const RAIN_LOCK_PROBABILITY_PCT = 60;
export const RAIN_LOCK_MM = 2;
export const WIND_ALERT_KMPH = 15;
export const HEAT_ALERT_C = 35;
export const EFFECTIVE_RAIN_FACTOR = 0.8;
export const MIN_IRRIGATION_MM = 0.5;

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type AlertSeverity =
  | 'critical'
  | 'warning'
  | 'info'
  | 'success';
export type AgentName =
  | 'WeatherSentinel'
  | 'HydroAgronomist'
  | 'ProfitOptimizer';
export type TraceStatus = 'ok' | 'warning' | 'critical' | 'info';

export interface AgentTrace {
  id: string;
  agent: AgentName;
  step: string;
  detail: string;
  status: TraceStatus;
}

export interface WeatherAlert {
  id: string;
  severity: AlertSeverity;
  icon: string;
  title: string;
  message: string;
  action: string;
}

export interface SpraySafety {
  status: 'safe' | 'caution' | 'unsafe';
  label: string;
  emoji: string;
  color: string;
  message: string;
  bestWindow: string;
  reasons: string[];
}

export interface WeatherSentinelResult {
  riskLevel: RiskLevel;
  alerts: WeatherAlert[];
  spraySafety: SpraySafety;
  rainLock: boolean;
  reasoning: AgentTrace[];
}

export interface HydroAgronomistResult {
  kc: number;
  et0Mm: number;
  etcMm: number;
  soilMoisturePct: number;
  targetMoisturePct: number;
  soilMoistureDeficitPct: number;
  soilAdjustmentFactor: number;
  effectiveRainMm: number;
  netMm: number;
  grossMm: number;
  efficiencyPct: number;
  litersPerAcre: number;
  calculatedLitersPerAcre: number;
  totalLiters: number;
  calculatedTotalLiters: number;
  pumpRuntimeMinutes: number;
  pumpRuntimeLabel: string;
  pumpRuntimePerAcreMinutes: number;
  pumpRuntimePerAcreLabel: string;
  bestWindowLabel: string;
  bestWindowStartLabel: string;
  bestWindowEndLabel: string;
  status: 'irrigate' | 'skip' | 'topup';
  statusLabel: string;
  statusEmoji: string;
  statusShort: string;
  statusColor: string;
  statusMessage: string;
  nextCheckLabel: string;
  schedule: {
    id: string;
    timeLabel: string;
    label: string;
    liters: number;
    minutes: number;
    note: string;
  }[];
  reasoning: AgentTrace[];
}

export interface ProfitOptimizerResult {
  aiLiters: number;
  floodLiters: number;
  waterSavedLiters: number;
  waterSavedPct: number;
  pumpCostAi: number;
  pumpCostFlood: number;
  pumpSaving: number;
  fertilizerRunoffSaved: number;
  cropValueProtected: number;
  weeklyBenefitPerAcre: number;
  weeklyBenefitTotal: number;
  projectedScoreLabel: string;
  reasoning: AgentTrace[];
}

export interface DayPlan extends DailyForecast {
  rainLock: boolean;
  kc: number;
  etcMm: number;
  effectiveRainMm: number;
  netMm: number;
  litersPerAcre: number;
  status: 'irrigate' | 'skip' | 'topup' | 'hold';
  statusLabel: string;
}

export interface WorkflowStep {
  step: number;
  agent: AgentName;
  title: string;
  summary: string;
  status: TraceStatus;
}

export interface IrrigationReport {
  weather: LiveWeather;
  farm: FarmContext;
  crop: CropProfile;
  stage: GrowthStageProfile;
  soil: SoilProfile;
  method: IrrigationMethod;
  sentinel: WeatherSentinelResult;
  hydro: HydroAgronomistResult;
  profit: ProfitOptimizerResult;
  days: DayPlan[];
  workflow: WorkflowStep[];
  confidencePct: number;
  generatedAt: string;
}

export const RISK_META: Record<
  RiskLevel,
  { label: string; color: string; background: string }
> = {
  low: {
    label: 'Low risk',
    color: '#2D7A31',
    background: '#EAF6E9',
  },
  moderate: {
    label: 'Moderate risk',
    color: '#B7791F',
    background: '#FFF7E6',
  },
  high: {
    label: 'High risk',
    color: '#B42318',
    background: '#FDECEA',
  },
  critical: {
    label: 'Critical risk',
    color: '#8E1B12',
    background: '#F9DEDC',
  },
};

export const AGENT_META: Record<
  AgentName,
  {
    label: string;
    role: string;
    color: string;
    background: string;
    icon: string;
  }
> = {
  WeatherSentinel: {
    label: 'Weather Sentinel',
    role: 'Meteorological & risk sentinel',
    color: '#15803D',
    background: '#EDF5EE',
    icon: 'shield',
  },
  HydroAgronomist: {
    label: 'Hydro-Agronomist',
    role: 'Precision water balance',
    color: '#15803D',
    background: '#EDF5EE',
    icon: 'droplet',
  },
  ProfitOptimizer: {
    label: 'Profit Optimizer',
    role: 'Resource & profit impact',
    color: '#15803D',
    background: '#EDF5EE',
    icon: 'trending-up',
  },
};

export function runWeatherSentinel(
  weather: LiveWeather
): WeatherSentinelResult {
  const current = weather.current;
  const today = weather.daily[0];
  const maxTempC = today?.maxTempC ?? current.temperatureC;
  const rainProbabilityPct =
    weather.next24hRainProbabilityPct;
  const rainMm = weather.next24hRainMm;

  const rainLock =
    rainProbabilityPct >= RAIN_LOCK_PROBABILITY_PCT ||
    current.precipitationMm >= RAIN_LOCK_MM;
  const windAlert = current.windKmph > WIND_ALERT_KMPH;
  const heatAlert = maxTempC > HEAT_ALERT_C;

  const alerts: WeatherAlert[] = [];

  if (rainLock) {
    alerts.push({
      id: 'rain-lock',
      severity: 'critical',
      icon: 'alert-octagon',
      title: 'Rain Lock',
      message:
        'HALT IRRIGATION & SPRAYING: Incoming rainfall detected. Prevent nutrient leaching and waterlogging.',
      action:
        'Keep the pump off, close field drains only if erosion risk is high, and recheck after the rain band passes.',
    });
  }

  if (windAlert) {
    alerts.push({
      id: 'wind-drift',
      severity: 'warning',
      icon: 'wind',
      title: 'Wind Drift Warning',
      message:
        'HIGH WIND ALERT: Do not spray pesticides right now; 30%+ chemical drift loss expected.',
      action:
        'Delay foliar sprays until wind drops below 15 km/h, preferably in the early morning window.',
    });
  }

  if (heatAlert) {
    alerts.push({
      id: 'heat-stress',
      severity: 'warning',
      icon: 'sun',
      title: 'Heat Stress Warning',
      message:
        'THERMAL STRESS: Shift irrigation to early morning (5:30 AM - 7:00 AM) to minimize evaporation loss.',
      action:
        'Apply mulch, irrigate pre-dawn and avoid mid-day fertiliser or pesticide applications.',
    });
  }

  if (!rainLock && rainProbabilityPct >= 40) {
    alerts.push({
      id: 'rain-watch',
      severity: 'info',
      icon: 'cloud-rain',
      title: 'Rain Watch',
      message: `A ${rainProbabilityPct}% rain probability is building in the next 24 hours. The sentinel is holding a conservative water balance.`,
      action:
        'Continue the precision pulse only if the field shows visible moisture stress.',
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 'clear-window',
      severity: 'success',
      icon: 'check-circle',
      title: 'Clear Field Window',
      message:
        'Rain, wind and heat are inside safe operating thresholds for the next 24 hours.',
      action:
        'Proceed with the precision schedule and keep the spray window buffer.',
    });
  }

  let riskLevel: RiskLevel = 'low';

  if (rainProbabilityPct >= 40) riskLevel = 'moderate';
  if (rainLock || windAlert || heatAlert) riskLevel = 'high';
  if (
    current.precipitationMm > 8 ||
    current.windKmph > 25 ||
    maxTempC > 40
  ) {
    riskLevel = 'critical';
  }

  const sprayUnsafe = rainLock || windAlert;
  const sprayCaution =
    !sprayUnsafe &&
    (heatAlert ||
      current.humidityPct > 80 ||
      current.temperatureC > 34);

  const spraySafety: SpraySafety = sprayUnsafe
    ? {
        status: 'unsafe',
        label: 'Do not spray',
        emoji: '',
        color: '#B42318',
        message:
          'Spraying is locked because rain or high wind would wash or drift the chemical away.',
        bestWindow: 'Wait for the rain/wind window to pass',
        reasons: [
          `Rain ${rainProbabilityPct}% next 24h`,
          `Wind ${current.windKmph} km/h`,
          `Live rain ${current.precipitationMm} mm`,
        ],
      }
    : sprayCaution
      ? {
          status: 'caution',
          label: 'Spray with caution',
          emoji: '',
          color: '#B7791F',
          message:
            'Heat or humidity will shorten the safe spray window. Use an early-morning application and a sticker adjuvant.',
          bestWindow: 'Tomorrow 5:30 AM – 7:30 AM',
          reasons: [
            `Max ${maxTempC}°C`,
            `Humidity ${current.humidityPct}%`,
            `Wind ${current.windKmph} km/h`,
          ],
        }
      : {
          status: 'safe',
          label: 'Safe to spray',
          emoji: '',
          color: '#2D7A31',
          message:
            'Wind, rain and heat are within the safe spray envelope for the next few hours.',
          bestWindow: 'Today 5:30 AM – 8:00 AM',
          reasons: [
            `Rain ${rainProbabilityPct}% next 24h`,
            `Wind ${current.windKmph} km/h`,
            `Max ${maxTempC}°C`,
          ],
        };

  const reasoning: AgentTrace[] = [
    {
      id: 'sentinel-live',
      agent: 'WeatherSentinel',
      step: 'Live telemetry ingested',
      detail: `${weather.source === 'live' ? 'Open-Meteo live observation' : 'Offline snapshot'} at ${current.temperatureC}°C, ${current.humidityPct}% RH, ${current.windKmph} km/h wind, ${current.precipitationMm} mm live rain and ${current.soilMoistureRootZonePct}% root-zone moisture.`,
      status: 'info',
    },
    {
      id: 'sentinel-rain',
      agent: 'WeatherSentinel',
      step: '24-hour rain scan',
      detail: `Peak rain probability ${rainProbabilityPct}% with ${rainMm} mm forecast. ${rainLock ? 'Rain-lock threshold breached (≥60% probability or ≥2 mm live rain).' : 'No rain-lock threshold breached.'}`,
      status: rainLock ? 'critical' : 'ok',
    },
    {
      id: 'sentinel-wind',
      agent: 'WeatherSentinel',
      step: 'Wind drift check',
      detail: `${current.windKmph} km/h measured. ${windAlert ? 'Above the 15 km/h spray-drift ceiling.' : 'Below the 15 km/h spray-drift ceiling.'}`,
      status: windAlert ? 'warning' : 'ok',
    },
    {
      id: 'sentinel-heat',
      agent: 'WeatherSentinel',
      step: 'Thermal stress check',
      detail: `Today's maximum is ${maxTempC}°C. ${heatAlert ? 'Above the 35°C heat-stress trigger; irrigation is shifted to the pre-dawn window.' : 'Inside the 35°C heat-stress threshold.'}`,
      status: heatAlert ? 'warning' : 'ok',
    },
    {
      id: 'sentinel-spray',
      agent: 'WeatherSentinel',
      step: 'Spray safety decision',
      detail: `${spraySafety.label}. ${spraySafety.message}`,
      status: sprayUnsafe
        ? 'critical'
        : sprayCaution
          ? 'warning'
          : 'ok',
    },
  ];

  return {
    riskLevel,
    alerts,
    spraySafety,
    rainLock,
    reasoning,
  };
}

export function runHydroAgronomist(
  weather: LiveWeather,
  farm: FarmContext,
  sentinel: WeatherSentinelResult
): HydroAgronomistResult {
  const crop = CROPS[farm.cropId] ?? CROPS.sugarcane;
  const stage =
    GROWTH_STAGES[farm.stageId] ?? GROWTH_STAGES.vegetative;
  const soil = SOILS[farm.soilId] ?? SOILS.black;
  const method = METHODS[farm.methodId] ?? METHODS.drip;
  const acres = clamp(Math.round(farm.acres), 1, 50);

  const et0Mm =
    weather.current.et0TodayMm > 0
      ? weather.current.et0TodayMm
      : (weather.daily[0]?.et0Mm ?? 0);
  const kc = crop.kc[stage.id];
  const etcMm = et0Mm * kc;

  const soilMoisturePct =
    weather.current.soilMoistureRootZonePct;
  const targetMoisturePct = soil.targetMoisturePct;
  const deficitRatio = clamp(
    (targetMoisturePct - soilMoisturePct) /
      Math.max(targetMoisturePct, 1),
    0,
    1
  );
  const soilAdjustmentFactor =
    1 + deficitRatio * soil.stressSensitivity;
  const demandMm = etcMm * soilAdjustmentFactor;

  const rainMm = Math.max(
    weather.next24hRainMm,
    weather.current.precipitationMm
  );
  const rawEffectiveRain =
    rainMm >= 2.5 ? rainMm * EFFECTIVE_RAIN_FACTOR : 0;
  const effectiveRainMm = Math.min(
    rawEffectiveRain,
    demandMm
  );
  const netMm = Math.max(0, demandMm - effectiveRainMm);
  const efficiency = method.efficiencyPct / 100;
  const grossMm = netMm / Math.max(efficiency, 0.01);

  const calculatedLitersPerAcre = Math.round(
    grossMm * ACRE_LITERS_PER_MM
  );
  const litersPerAcre = sentinel.rainLock
    ? 0
    : calculatedLitersPerAcre;
  const totalLiters = Math.round(litersPerAcre * acres);
  const calculatedTotalLiters = Math.round(
    calculatedLitersPerAcre * acres
  );

  const pumpRuntimeMinutes = Math.round(
    (totalLiters / PUMP_LITERS_PER_HOUR) * 60
  );
  const pumpRuntimePerAcreMinutes = Math.round(
    (litersPerAcre / PUMP_LITERS_PER_HOUR) * 60
  );

  const startMinutes = 5 * 60 + 30;
  const endMinutes = Math.max(
    startMinutes + Math.max(30, pumpRuntimeMinutes),
    7 * 60
  );
  const bestWindowStartLabel = formatClockLabel(startMinutes);
  const bestWindowEndLabel = formatClockLabel(endMinutes);
  const bestWindowLabel =
    totalLiters > 0
      ? `${bestWindowStartLabel} – ${bestWindowEndLabel}`
      : 'No pump run today';

  let status: HydroAgronomistResult['status'];
  let statusLabel: string;
  let statusEmoji: string;
  let statusShort: string;
  let statusColor: string;
  let statusMessage: string;

  if (sentinel.rainLock) {
    status = 'skip';
    statusEmoji = '';
    statusLabel = 'SKIP — RAIN EXPECTED';
    statusShort = 'Rain lock — skip irrigation today';
    statusColor = '#2563EB';
    statusMessage = `The sentinel has zeroed the pump prescription because Open-Meteo shows ${weather.next24hRainProbabilityPct}% rain probability and ${rainMm.toFixed(1)} mm in the next 24 hours.`;
  } else if (netMm < MIN_IRRIGATION_MM) {
    status = 'skip';
    statusEmoji = '';
    statusLabel = 'SKIP — SOIL MOISTURE ADEQUATE';
    statusShort =
      'Soil moisture adequate — skip irrigation';
    statusColor = '#2563EB';
    statusMessage = `Root-zone moisture is ${soilMoisturePct.toFixed(1)}% against a ${targetMoisturePct}% target. No pump run is required today.`;
  } else if (litersPerAcre < 5000) {
    status = 'topup';
    statusEmoji = '';
    statusLabel = 'LIGHT MOISTURE TOP-UP';
    statusShort = 'Light moisture top-up';
    statusColor = '#B7791F';
    statusMessage = `A small ${formatNumber(litersPerAcre)} L/acre pulse will refill the root zone without pushing water below the active roots.`;
  } else {
    status = 'irrigate';
    statusEmoji = '';
    statusLabel = 'IRRIGATE TODAY';
    statusShort = 'Irrigate today';
    statusColor = '#2D7A31';
    statusMessage =
      'The sentinel found no rain lock. Run the pump in the coolest window and stop if surface runoff appears.';
  }

  const nextCheckLabel = sentinel.rainLock
    ? 'After the rain band passes'
    : `Tomorrow at ${bestWindowStartLabel}`;

  const schedule: HydroAgronomistResult['schedule'] =
    totalLiters > 0
      ? [
          {
            id: 'dawn-pulse',
            timeLabel: bestWindowStartLabel,
            label: 'Dawn precision pulse',
            liters: totalLiters,
            minutes: pumpRuntimeMinutes,
            note: `${method.name} at ${method.efficiencyPct}% efficiency. Stop if runoff appears; split the pulse if infiltration is slow.`,
          },
        ]
      : [
          {
            id: 'rain-hold',
            timeLabel: '—',
            label: 'No pump run',
            liters: 0,
            minutes: 0,
            note: statusMessage,
          },
        ];

  const reasoning: AgentTrace[] = [
    {
      id: 'hydro-et0',
      agent: 'HydroAgronomist',
      step: 'Reference evapotranspiration',
      detail: `${weather.source === 'live' ? 'Open-Meteo daily FAO ET₀' : 'Offline fallback ET₀'} for ${weather.city.name}: ${et0Mm.toFixed(2)} mm/day.`,
      status: 'info',
    },
    {
      id: 'hydro-kc',
      agent: 'HydroAgronomist',
      step: 'Crop coefficient applied',
      detail: `${crop.name} at ${stage.label} stage uses Kc ${kc.toFixed(2)}.`,
      status: 'info',
    },
    {
      id: 'hydro-etc',
      agent: 'HydroAgronomist',
      step: 'Crop water requirement',
      detail: `ETc = ET₀ × Kc = ${et0Mm.toFixed(2)} × ${kc.toFixed(2)} = ${etcMm.toFixed(2)} mm/day.`,
      status: 'ok',
    },
    {
      id: 'hydro-soil',
      agent: 'HydroAgronomist',
      step: 'Soil moisture adjustment',
      detail: `${soil.name}: root-zone ${soilMoisturePct.toFixed(1)}% vs ${targetMoisturePct}% target. Deficit ${(deficitRatio * 100).toFixed(1)}% × ${soil.retentionLabel.toLowerCase()} sensitivity → ×${soilAdjustmentFactor.toFixed(2)}.`,
      status: deficitRatio > 0.2 ? 'warning' : 'ok',
    },
    {
      id: 'hydro-rain',
      agent: 'HydroAgronomist',
      step: 'Effective rainfall credit',
      detail: `${rainMm.toFixed(1)} mm rain forecast; ${effectiveRainMm.toFixed(2)} mm credited as effective rainfall.`,
      status: sentinel.rainLock ? 'critical' : 'info',
    },
    {
      id: 'hydro-net',
      agent: 'HydroAgronomist',
      step: 'Net irrigation need',
      detail: `(${etcMm.toFixed(2)} × ${soilAdjustmentFactor.toFixed(2)}) − ${effectiveRainMm.toFixed(2)} = ${netMm.toFixed(2)} mm net.`,
      status: netMm > 0 ? 'ok' : 'info',
    },
    {
      id: 'hydro-efficiency',
      agent: 'HydroAgronomist',
      step: 'System efficiency',
      detail: `${method.name} is ${method.efficiencyPct}% efficient, so ${netMm.toFixed(2)} mm net becomes ${grossMm.toFixed(2)} mm gross applied depth.`,
      status: 'info',
    },
    {
      id: 'hydro-volume',
      agent: 'HydroAgronomist',
      step: 'Volume conversion',
      detail: `${grossMm.toFixed(2)} mm × ${formatNumber(ACRE_LITERS_PER_MM, 2)} L/mm/acre = ${formatNumber(calculatedLitersPerAcre)} L/acre; ${formatNumber(calculatedTotalLiters)} L for ${acres} acres before the sentinel override.`,
      status: 'ok',
    },
    {
      id: 'hydro-pump',
      agent: 'HydroAgronomist',
      step: 'Pump runtime',
      detail: `${formatNumber(totalLiters)} L ÷ ${formatNumber(PUMP_LITERS_PER_HOUR)} L/h = ${formatPumpDuration(pumpRuntimeMinutes)} total, or ${formatPumpDuration(pumpRuntimePerAcreMinutes)} per acre.`,
      status: 'ok',
    },
  ];

  if (sentinel.rainLock) {
    reasoning.push({
      id: 'hydro-override',
      agent: 'HydroAgronomist',
      step: 'Sentinel override',
      detail: `Rain lock overrides the calculated ${formatNumber(calculatedLitersPerAcre)} L/acre. Prescribed volume is 0 L until the rain band clears.`,
      status: 'critical',
    });
  }

  return {
    kc: round(kc, 2),
    et0Mm: round(et0Mm, 2),
    etcMm: round(etcMm, 2),
    soilMoisturePct: round(soilMoisturePct, 1),
    targetMoisturePct,
    soilMoistureDeficitPct: round(deficitRatio * 100, 1),
    soilAdjustmentFactor: round(soilAdjustmentFactor, 2),
    effectiveRainMm: round(effectiveRainMm, 2),
    netMm: round(netMm, 2),
    grossMm: round(grossMm, 2),
    efficiencyPct: method.efficiencyPct,
    litersPerAcre,
    calculatedLitersPerAcre,
    totalLiters,
    calculatedTotalLiters,
    pumpRuntimeMinutes,
    pumpRuntimeLabel: formatPumpDuration(
      pumpRuntimeMinutes
    ),
    pumpRuntimePerAcreMinutes,
    pumpRuntimePerAcreLabel: formatPumpDuration(
      pumpRuntimePerAcreMinutes
    ),
    bestWindowLabel,
    bestWindowStartLabel,
    bestWindowEndLabel,
    status,
    statusLabel,
    statusEmoji,
    statusShort,
    statusColor,
    statusMessage,
    nextCheckLabel,
    schedule,
    reasoning,
  };
}

export function runProfitOptimizer(
  weather: LiveWeather,
  farm: FarmContext,
  hydro: HydroAgronomistResult
): ProfitOptimizerResult {
  const crop = CROPS[farm.cropId] ?? CROPS.sugarcane;
  const stage =
    GROWTH_STAGES[farm.stageId] ?? GROWTH_STAGES.vegetative;
  const acres = clamp(Math.round(farm.acres), 1, 50);

  const demandMm = hydro.etcMm * hydro.soilAdjustmentFactor;
  const floodGrossMm = demandMm / 0.5;
  const floodLiters = Math.round(
    floodGrossMm * ACRE_LITERS_PER_MM * acres
  );
  const aiLiters = hydro.totalLiters;
  const waterSavedLiters = Math.max(
    0,
    floodLiters - aiLiters
  );
  const waterSavedPct =
    floodLiters > 0
      ? round((waterSavedLiters / floodLiters) * 100)
      : 0;

  const pumpCostAi =
    (aiLiters / 1000) * PUMP_COST_PER_1000_L;
  const pumpCostFlood =
    (floodLiters / 1000) * PUMP_COST_PER_1000_L;
  const pumpSaving = Math.max(
    0,
    pumpCostFlood - pumpCostAi
  );

  const fertilizerRunoffSaved =
    ((FLOOD_RUNOFF_LOSS_PCT - AI_RUNOFF_LOSS_PCT) *
      FERTILIZER_COST_PER_ACRE_WEEK *
      acres) /
    7;

  const weeklyFertilizerPerAcre =
    (FLOOD_RUNOFF_LOSS_PCT - AI_RUNOFF_LOSS_PCT) *
    FERTILIZER_COST_PER_ACRE_WEEK;
  const weeklyCropProtectionPerAcre =
    crop.valuePerAcre *
    WEEKLY_STRESS_LOSS_PCT *
    stage.sensitivity;
  const cropValueProtected =
    weeklyCropProtectionPerAcre * acres;
  const weeklyPumpSavingPerAcre =
    (pumpSaving / acres) * 5;
  const weeklyBenefitPerAcre =
    weeklyPumpSavingPerAcre +
    weeklyFertilizerPerAcre +
    weeklyCropProtectionPerAcre;
  const weeklyBenefitTotal =
    weeklyBenefitPerAcre * acres;

  const reasoning: AgentTrace[] = [
    {
      id: 'profit-flood',
      agent: 'ProfitOptimizer',
      step: 'Traditional flood baseline',
      detail: `Blind flood at 50% efficiency would apply ${floodGrossMm.toFixed(2)} mm gross, or ${formatNumber(floodLiters)} L for ${acres} acres.`,
      status: 'info',
    },
    {
      id: 'profit-ai',
      agent: 'ProfitOptimizer',
      step: 'AI precision schedule',
      detail: `${formatNumber(aiLiters)} L prescribed at ${hydro.efficiencyPct}% system efficiency.`,
      status: 'ok',
    },
    {
      id: 'profit-water',
      agent: 'ProfitOptimizer',
      step: 'Water saved today',
      detail: `${formatNumber(waterSavedLiters)} L saved (${waterSavedPct}% less water than the flood baseline).`,
      status: waterSavedLiters > 0 ? 'ok' : 'info',
    },
    {
      id: 'profit-power',
      agent: 'ProfitOptimizer',
      step: 'Pump energy saved',
      detail: `${formatNumber(waterSavedLiters)} L × ₹${PUMP_COST_PER_1000_L}/1,000 L = ${formatINR(pumpSaving)} saved today in pumping energy and upkeep.`,
      status: pumpSaving > 0 ? 'ok' : 'info',
    },
    {
      id: 'profit-fertilizer',
      agent: 'ProfitOptimizer',
      step: 'Fertilizer runoff avoided',
      detail: `${formatINR(fertilizerRunoffSaved)} saved today by cutting flood runoff from ${Math.round(FLOOD_RUNOFF_LOSS_PCT * 100)}% to ${Math.round(AI_RUNOFF_LOSS_PCT * 100)}% nutrient loss.`,
      status: 'ok',
    },
    {
      id: 'profit-yield',
      agent: 'ProfitOptimizer',
      step: 'Yield & root-rot protection',
      detail: `${formatINR(cropValueProtected)} of ${crop.name} value protected this week at ${stage.label.toLowerCase()} sensitivity.`,
      status: 'ok',
    },
    {
      id: 'profit-score',
      agent: 'ProfitOptimizer',
      step: 'Projected weekly score',
      detail: `${formatINR(weeklyBenefitPerAcre)}/acre/week × ${acres} acres = ${formatINR(weeklyBenefitTotal)} projected resource and profit protection.`,
      status: 'ok',
    },
  ];

  return {
    aiLiters,
    floodLiters,
    waterSavedLiters,
    waterSavedPct,
    pumpCostAi,
    pumpCostFlood,
    pumpSaving,
    fertilizerRunoffSaved,
    cropValueProtected,
    weeklyBenefitPerAcre,
    weeklyBenefitTotal,
    projectedScoreLabel: `+${formatINR(weeklyBenefitPerAcre)}/Acre saved this week in power & prevented root-rot loss`,
    reasoning,
  };
}

function buildDayPlans(
  weather: LiveWeather,
  farm: FarmContext
): DayPlan[] {
  const crop = CROPS[farm.cropId] ?? CROPS.sugarcane;
  const stage =
    GROWTH_STAGES[farm.stageId] ?? GROWTH_STAGES.vegetative;
  const soil = SOILS[farm.soilId] ?? SOILS.black;
  const method = METHODS[farm.methodId] ?? METHODS.drip;
  const kc = crop.kc[stage.id];
  const deficitRatio = clamp(
    (soil.targetMoisturePct -
      weather.current.soilMoistureRootZonePct) /
      Math.max(soil.targetMoisturePct, 1),
    0,
    1
  );
  const soilAdjustment =
    1 + deficitRatio * soil.stressSensitivity;
  const efficiency = method.efficiencyPct / 100;

  return weather.daily.map((day) => {
    const etcMm = day.et0Mm * kc;
    const rainLock =
      day.precipitationProbabilityMaxPct >=
        RAIN_LOCK_PROBABILITY_PCT ||
      day.precipitationSumMm >= RAIN_LOCK_MM;
    const rawEffectiveRain =
      day.precipitationSumMm >= 2.5
        ? day.precipitationSumMm * EFFECTIVE_RAIN_FACTOR
        : 0;
    const effectiveRainMm = Math.min(
      rawEffectiveRain,
      etcMm * soilAdjustment
    );
    const netMm = Math.max(
      0,
      etcMm * soilAdjustment - effectiveRainMm
    );
    const litersPerAcre = Math.round(
      (netMm / Math.max(efficiency, 0.01)) *
        ACRE_LITERS_PER_MM
    );

    let status: DayPlan['status'] = 'hold';
    let statusLabel = 'HOLD';

    if (rainLock) {
      status = 'skip';
      statusLabel = 'RAIN LOCK';
    } else if (netMm >= MIN_IRRIGATION_MM) {
      if (litersPerAcre < 5000) {
        status = 'topup';
        statusLabel = 'TOP-UP';
      } else {
        status = 'irrigate';
        statusLabel = 'IRRIGATE';
      }
    }

    return {
      ...day,
      rainLock,
      kc: round(kc, 2),
      etcMm: round(etcMm, 2),
      effectiveRainMm: round(effectiveRainMm, 2),
      netMm: round(netMm, 2),
      litersPerAcre,
      status,
      statusLabel,
    };
  });
}

export function runWeatherIrrigationAgent(
  weather: LiveWeather,
  farm: FarmContext = DEFAULT_FARM_CONTEXT
): IrrigationReport {
  const normalizedFarm: FarmContext = {
    ...farm,
    acres: clamp(Math.round(farm.acres), 1, 50),
  };
  const crop =
    CROPS[normalizedFarm.cropId] ?? CROPS.sugarcane;
  const stage =
    GROWTH_STAGES[normalizedFarm.stageId] ??
    GROWTH_STAGES.vegetative;
  const soil =
    SOILS[normalizedFarm.soilId] ?? SOILS.black;
  const method =
    METHODS[normalizedFarm.methodId] ?? METHODS.drip;

  const sentinel = runWeatherSentinel(weather);
  const hydro = runHydroAgronomist(
    weather,
    normalizedFarm,
    sentinel
  );
  const profit = runProfitOptimizer(
    weather,
    normalizedFarm,
    hydro
  );
  const days = buildDayPlans(weather, normalizedFarm);

  const workflow: WorkflowStep[] = [
    {
      step: 1,
      agent: 'WeatherSentinel',
      title: 'Meteorological risk scan',
      summary: `${sentinel.alerts.length} field alert${sentinel.alerts.length === 1 ? '' : 's'} · ${RISK_META[sentinel.riskLevel].label}${sentinel.rainLock ? ' · rain lock active' : ''}`,
      status:
        sentinel.rainLock ||
        sentinel.riskLevel === 'critical'
          ? 'critical'
          : sentinel.riskLevel === 'high'
            ? 'warning'
            : 'ok',
    },
    {
      step: 2,
      agent: 'HydroAgronomist',
      title: 'Precision water balance',
      summary: `ET₀ ${hydro.et0Mm.toFixed(2)} × Kc ${hydro.kc.toFixed(2)} → ${formatNumber(hydro.litersPerAcre)} L/acre · ${hydro.pumpRuntimeLabel}`,
      status:
        hydro.status === 'irrigate'
          ? 'ok'
          : hydro.status === 'topup'
            ? 'warning'
            : 'info',
    },
    {
      step: 3,
      agent: 'ProfitOptimizer',
      title: 'Resource & profit protection',
      summary: `${formatNumber(profit.waterSavedLiters)} L saved · ${formatINR(profit.weeklyBenefitPerAcre)}/acre weekly benefit`,
      status: 'ok',
    },
  ];

  const confidencePct =
    weather.source === 'live'
      ? weather.daily.length >= 7
        ? 97
        : 90
      : 72;

  return {
    weather,
    farm: normalizedFarm,
    crop,
    stage,
    soil,
    method,
    sentinel,
    hydro,
    profit,
    days,
    workflow,
    confidencePct,
    generatedAt: new Date().toISOString(),
  };
}
