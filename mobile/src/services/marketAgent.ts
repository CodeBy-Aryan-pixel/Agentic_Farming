// src/services/marketAgent.ts
// Live Agmarknet + Open-Meteo market intelligence engine for the
// Kisan Market Guard & Profit Advisor.

import {
  formatINR,
  formatNumber,
} from '@/utils/format';

export type MarketCropId =
  | 'onion'
  | 'tomato'
  | 'soybean'
  | 'sugarcane'
  | 'wheat'
  | 'paddy'
  | 'cotton';

export type MarketMandiId =
  | 'kolhapur'
  | 'nashik'
  | 'pune'
  | 'sangli'
  | 'nagpur';

export type MarketSource = 'live' | 'simulated';
export type WeatherSource = 'live' | 'simulated' | 'unavailable';
export type ShockLevel = 'none' | 'watch' | 'high';
export type MarketVerdict = 'SELL_NOW' | 'HOLD' | 'STAGGER';
export type FraudRiskLevel = 'safe' | 'caution' | 'high' | 'fraud';
export type MarketAgentName =
  | 'MandiPulse'
  | 'ProfitTiming'
  | 'MiddlemanFraudShield';
export type MarketTraceStatus =
  | 'ok'
  | 'warning'
  | 'critical'
  | 'info';

export interface MarketCrop {
  id: MarketCropId;
  name: string;
  icon: string;
  agmarknetName: string;
  basePrice: number;
  baseArrivals: number;
  msp: number | null;
  mspLabel: string;
  storageLifeDays: number;
  coldStorageCostPerQuintalMonth: number;
  perishability: 'high' | 'medium' | 'low';
  peakMonths: number[];
  seasonalNote: string;
}

export interface MarketMandi {
  id: MarketMandiId;
  name: string;
  shortName: string;
  district: string;
  marketKeywords: string[];
  latitude: number;
  longitude: number;
  priceFactor: number;
  arrivalFactor: number;
}

export interface WeatherMarket {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface MarketWeatherShock {
  mandiId: string;
  name: string;
  rainNext48hMm: number;
  maxRainProbabilityPct: number;
  maxTempC: number;
  level: ShockLevel;
  reason: string;
  source: 'live' | 'simulated';
}

export interface PricePoint {
  date: string;
  label: string;
  weekday: string;
  price: number;
}

export interface LiveAgmarknetRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  arrivalDate: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
}

export type MarketLiveScope = 'mandi' | 'state' | 'national';

export interface MarketSnapshot {
  crop: MarketCrop;
  mandi: MarketMandi;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  eNamBenchmark: number;
  benchmarkMin: number;
  benchmarkMax: number;
  msp: number | null;
  mspLabel: string;
  arrivalsQuintals: number;
  arrivalsChangePct: number;
  weatherShocks: MarketWeatherShock[];
  weatherSource: WeatherSource;
  competingRainMm: number;
  supplyCrunch: boolean;
  rallyProbabilityPct: number;
  history7d: PricePoint[];
  forecast7d: PricePoint[];
  projectedPeak14dPrice: number;
  projectedPeak14dDay: number;
  projectedPeak14dDate: string;
  trendPct: number;
  source: MarketSource;
  fetchedAt: string;
  liveMarket: string | null;
  liveScope: MarketLiveScope | null;
  liveDate: string | null;
  note: string;
}

export interface MarketSnapshotResponse {
  snapshot: MarketSnapshot;
  warning: string | null;
}

export interface MarketTrace {
  id: string;
  agent: MarketAgentName;
  step: string;
  detail: string;
  status: MarketTraceStatus;
}

export interface MandiPulseResult {
  arrivalsQuintals: number;
  previousArrivalsQuintals: number;
  arrivalsChangePct: number;
  supplyCrunch: boolean;
  rallyProbabilityPct: number;
  disruptionCount: number;
  signal: 'shortage' | 'balanced' | 'glut';
  weatherShocks: MarketWeatherShock[];
  weatherSource: WeatherSource;
  reasoning: MarketTrace[];
}

export interface ProfitTimingResult {
  verdict: MarketVerdict;
  verdictLabel: string;
  verdictColor: string;
  headline: string;
  currentPrice: number;
  msp: number | null;
  mspLabel: string;
  projectedPeakPrice: number;
  projectedPeakDay: number;
  projectedPeakDateLabel: string;
  potentialGainPercent: number;
  storageCostPerQuintal: number;
  storageCostTotal: number;
  netExtraProfit: number;
  totalProjectedValue: number;
  quantityQuintals: number;
  canPhysicallyHold: boolean;
  isAboveMsp: boolean;
  reasoning: MarketTrace[];
}

export interface FraudAuditInput {
  offeredPrice: number;
  dryageKgPerBag: number;
  commissionPercent: number;
  quantityQuintals: number;
}

export interface FraudAuditResult {
  riskScore: number;
  riskLevel: FraudRiskLevel;
  verdictLabel: string;
  verdictColor: string;
  verdictBackground: string;
  isExploitation: boolean;
  warning: string;
  fairENamValue: number;
  fairPayout: number;
  traderPayout: number;
  totalFinancialLoss: number;
  fairPerQuintal: number;
  netTraderPerQuintal: number;
  offeredPrice: number;
  priceGapPerQuintal: number;
  priceGapPct: number;
  legalDryageKgPerBag: number;
  legalCommissionPct: number;
  excessDryageKgPerBag: number;
  dryageLoss: number;
  commissionLoss: number;
  mspViolation: boolean;
  fraudItems: {
    label: string;
    amount: number;
    isFraud: boolean;
  }[];
  reasoning: MarketTrace[];
}

export interface MarketWorkflowStep {
  step: number;
  agent: MarketAgentName;
  title: string;
  summary: string;
  status: MarketTraceStatus;
}

export interface MarketIntelligence {
  snapshot: MarketSnapshot;
  pulse: MandiPulseResult;
  timing: ProfitTimingResult;
  fraud: FraudAuditResult;
  workflow: MarketWorkflowStep[];
  generatedAt: string;
}

const AGMARKNET_BASE =
  'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

const AGMARKNET_API_KEY =
  '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';

const OPEN_METEO_BASE =
  'https://api.open-meteo.com/v1/forecast';

const AGMARKNET_TIMEOUT_MS = 9000;
const WEATHER_TIMEOUT_MS = 8000;
const WEATHER_CACHE_TTL_MS = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const LEGAL_DRYAGE_KG_PER_BAG = 1;
const LEGAL_COMMISSION_PCT = 2.5;

export const MARKET_CROPS: MarketCrop[] = [
  {
    id: 'onion',
    name: 'Onion',
    icon: '',
    agmarknetName: 'Onion',
    basePrice: 2400,
    baseArrivals: 12000,
    msp: null,
    mspLabel: 'No MSP (market-linked)',
    storageLifeDays: 90,
    coldStorageCostPerQuintalMonth: 90,
    perishability: 'medium',
    peakMonths: [11, 5],
    seasonalNote: 'December export window and June scarcity lift prices.',
  },
  {
    id: 'tomato',
    name: 'Tomato',
    icon: '',
    agmarknetName: 'Tomato',
    basePrice: 1800,
    baseArrivals: 4500,
    msp: null,
    mspLabel: 'No MSP (market-linked)',
    storageLifeDays: 14,
    coldStorageCostPerQuintalMonth: 120,
    perishability: 'high',
    peakMonths: [10, 4],
    seasonalNote: 'Short shelf life makes timing and staggered sales critical.',
  },
  {
    id: 'soybean',
    name: 'Soybean',
    icon: '',
    agmarknetName: 'Soyabean',
    basePrice: 4700,
    baseArrivals: 3500,
    msp: 5328,
    mspLabel: 'MSP 2026-27',
    storageLifeDays: 180,
    coldStorageCostPerQuintalMonth: 55,
    perishability: 'medium',
    peakMonths: [1, 2],
    seasonalNote: 'Crushing demand peaks after the kharif arrivals settle.',
  },
  {
    id: 'sugarcane',
    name: 'Sugarcane',
    icon: '',
    agmarknetName: 'Sugarcane',
    basePrice: 355,
    baseArrivals: 15000,
    msp: 355,
    mspLabel: 'FRP 2026-27',
    storageLifeDays: 7,
    coldStorageCostPerQuintalMonth: 40,
    perishability: 'high',
    peakMonths: [11, 12],
    seasonalNote: 'Mill crushing schedules and FRP dominate the price.',
  },
  {
    id: 'wheat',
    name: 'Wheat',
    icon: '',
    agmarknetName: 'Wheat',
    basePrice: 2600,
    baseArrivals: 3000,
    msp: 2585,
    mspLabel: 'MSP 2026-27',
    storageLifeDays: 365,
    coldStorageCostPerQuintalMonth: 40,
    perishability: 'low',
    peakMonths: [9, 10],
    seasonalNote: 'Flour mill demand rises before the new rabi crop.',
  },
  {
    id: 'paddy',
    name: 'Paddy',
    icon: '',
    agmarknetName: 'Paddy',
    basePrice: 2400,
    baseArrivals: 5500,
    msp: 2369,
    mspLabel: 'MSP 2026-27',
    storageLifeDays: 365,
    coldStorageCostPerQuintalMonth: 45,
    perishability: 'low',
    peakMonths: [6, 7],
    seasonalNote: 'Procurement windows and mill demand drive the market.',
  },
  {
    id: 'cotton',
    name: 'Cotton',
    icon: '',
    agmarknetName: 'Cotton',
    basePrice: 7200,
    baseArrivals: 2500,
    msp: 7710,
    mspLabel: 'MSP 2026-27',
    storageLifeDays: 240,
    coldStorageCostPerQuintalMonth: 60,
    perishability: 'medium',
    peakMonths: [11, 12],
    seasonalNote: 'Textile mill procurement and export demand peak in winter.',
  },
];

export const MARKET_MANDIS: MarketMandi[] = [
  {
    id: 'kolhapur',
    name: 'Kolhapur APMC',
    shortName: 'Kolhapur',
    district: 'Kolhapur',
    marketKeywords: ['kolhapur'],
    latitude: 16.705,
    longitude: 74.2433,
    priceFactor: 1.02,
    arrivalFactor: 1,
  },
  {
    id: 'nashik',
    name: 'Nashik (Lasalgaon)',
    shortName: 'Lasalgaon',
    district: 'Nashik',
    marketKeywords: ['lasalgaon', 'nashik'],
    latitude: 20.148,
    longitude: 74.228,
    priceFactor: 1.08,
    arrivalFactor: 1.3,
  },
  {
    id: 'pune',
    name: 'Pune Market',
    shortName: 'Pune',
    district: 'Pune',
    marketKeywords: ['pune', 'moshi'],
    latitude: 18.5204,
    longitude: 73.8567,
    priceFactor: 1.05,
    arrivalFactor: 1.1,
  },
  {
    id: 'sangli',
    name: 'Sangli APMC',
    shortName: 'Sangli',
    district: 'Sangli',
    marketKeywords: ['sangli'],
    latitude: 16.8524,
    longitude: 74.5815,
    priceFactor: 0.98,
    arrivalFactor: 0.8,
  },
  {
    id: 'nagpur',
    name: 'Nagpur APMC',
    shortName: 'Nagpur',
    district: 'Nagpur',
    marketKeywords: ['nagpur'],
    latitude: 21.1458,
    longitude: 79.0882,
    priceFactor: 1,
    arrivalFactor: 0.9,
  },
];

export const WEATHER_MARKETS: WeatherMarket[] = [
  ...MARKET_MANDIS.map((mandi) => ({
    id: mandi.id,
    name: mandi.shortName,
    latitude: mandi.latitude,
    longitude: mandi.longitude,
  })),
  {
    id: 'solapur',
    name: 'Solapur',
    latitude: 17.6599,
    longitude: 75.9064,
  },
];

export const MARKET_CROP_OPTIONS = MARKET_CROPS;
export const MARKET_MANDI_OPTIONS = MARKET_MANDIS;

export const MARKET_AGENT_META: Record<
  MarketAgentName,
  { label: string; icon: string; color: string; background: string }
> = {
  MandiPulse: {
    label: 'MandiPulse',
    icon: 'radio',
    color: '#2563EB',
    background: '#EAF1FE',
  },
  ProfitTiming: {
    label: 'ProfitTiming',
    icon: 'trending-up',
    color: '#2D7A31',
    background: '#EAF6E9',
  },
  MiddlemanFraudShield: {
    label: 'MiddlemanFraudShield',
    icon: 'shield',
    color: '#B42318',
    background: '#FDECEA',
  },
};

export function getMarketCrop(cropId: MarketCropId): MarketCrop {
  return (
    MARKET_CROPS.find((crop) => crop.id === cropId) ??
    MARKET_CROPS[0]
  );
}

export function getMarketMandi(
  mandiId: MarketMandiId
): MarketMandi {
  return (
    MARKET_MANDIS.find((mandi) => mandi.id === mandiId) ??
    MARKET_MANDIS[0]
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }

  return Math.round(sorted[middle]);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRng(seed: string): () => number {
  let state = hashString(seed);

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

let simulationTick = 0;

function nextSeed(
  cropId: MarketCropId,
  mandiId: MarketMandiId
): string {
  simulationTick += 1;
  return `${cropId}|${mandiId}|${Date.now()}|${simulationTick}`;
}

function formatDateLabel(date: Date): string {
  try {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function formatWeekday(date: Date): string {
  try {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
    });
  } catch {
    return 'Day';
  }
}

function buildPricePoint(
  date: Date,
  price: number
): PricePoint {
  return {
    date: date.toISOString(),
    label: formatDateLabel(date),
    weekday: formatWeekday(date),
    price: Math.max(1, Math.round(price)),
  };
}

class MarketDataError extends Error {
  constructor(
    message: string,
    readonly code: 'network' | 'http' | 'rate-limit' | 'parse'
  ) {
    super(message);
    this.name = 'MarketDataError';
  }
}

async function fetchJsonWithTimeout<T>(
  url: string,
  timeoutMs: number,
  externalSignal?: AbortSignal
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const onAbort = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onAbort, {
        once: true,
      });
    }
  }

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    const text = await response.text();

    if (!response.ok) {
      if (
        response.status === 429 ||
        /rate limit/i.test(text)
      ) {
        throw new MarketDataError(
          'Agmarknet is rate-limiting requests right now.',
          'rate-limit'
        );
      }

      throw new MarketDataError(
        `Data API returned HTTP ${response.status}.`,
        'http'
      );
    }

    let payload: unknown;

    try {
      payload = JSON.parse(text);
    } catch {
      throw new MarketDataError(
        'The market API returned an invalid payload.',
        'parse'
      );
    }

    if (
      payload &&
      typeof payload === 'object' &&
      'error' in payload
    ) {
      const errorMessage = String(
        (payload as { error?: unknown }).error ?? ''
      );

      if (/rate limit/i.test(errorMessage)) {
        throw new MarketDataError(
          'Agmarknet is rate-limiting requests right now.',
          'rate-limit'
        );
      }

      throw new MarketDataError(
        errorMessage || 'The market API returned an error.',
        'http'
      );
    }

    return payload as T;
  } catch (caught) {
    if (caught instanceof MarketDataError) {
      throw caught;
    }

    if (caught instanceof Error && caught.name === 'AbortError') {
      throw new MarketDataError(
        'The market API request timed out.',
        'network'
      );
    }

    throw new MarketDataError(
      'The market API could not be reached.',
      'network'
    );
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', onAbort);
  }
}

interface AgmarknetPayload {
  records?: {
    state?: string;
    district?: string;
    market?: string;
    commodity?: string;
    variety?: string;
    grade?: string;
    arrival_date?: string;
    min_price?: number | string;
    max_price?: number | string;
    modal_price?: number | string;
  }[];
}

function toNumber(value: number | string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseAgmarknetRecords(
  payload: AgmarknetPayload
): LiveAgmarknetRecord[] {
  return (payload.records ?? [])
    .map((record) => ({
      state: record.state ?? '',
      district: record.district ?? '',
      market: record.market ?? '',
      commodity: record.commodity ?? '',
      variety: record.variety ?? '',
      grade: record.grade ?? '',
      arrivalDate: record.arrival_date ?? '',
      minPrice: toNumber(record.min_price),
      maxPrice: toNumber(record.max_price),
      modalPrice: toNumber(record.modal_price),
    }))
    .filter((record) => record.modalPrice > 0);
}

function buildAgmarknetUrl(
  crop: MarketCrop,
  stateOnly: boolean
): string {
  const stateFilter = stateOnly
    ? '&filters%5Bstate%5D=Maharashtra'
    : '';

  return `${AGMARKNET_BASE}?api-key=${AGMARKNET_API_KEY}&format=json&limit=50${stateFilter}&filters%5Bcommodity%5D=${encodeURIComponent(crop.agmarknetName)}`;
}

async function fetchAgmarknetRecords(
  crop: MarketCrop,
  signal?: AbortSignal
): Promise<LiveAgmarknetRecord[]> {
  const statePayload =
    await fetchJsonWithTimeout<AgmarknetPayload>(
      buildAgmarknetUrl(crop, true),
      AGMARKNET_TIMEOUT_MS,
      signal
    );

  const stateRecords = parseAgmarknetRecords(statePayload);

  if (stateRecords.length > 0) {
    return stateRecords;
  }

  const nationalPayload =
    await fetchJsonWithTimeout<AgmarknetPayload>(
      buildAgmarknetUrl(crop, false),
      AGMARKNET_TIMEOUT_MS,
      signal
    );

  return parseAgmarknetRecords(nationalPayload);
}

function findLiveRecord(
  records: LiveAgmarknetRecord[],
  mandi: MarketMandi
): LiveAgmarknetRecord | null {
  const district = normalize(mandi.district);

  const directDistrict = records.find(
    (record) => normalize(record.district) === district
  );

  if (directDistrict) return directDistrict;

  return (
    records.find((record) =>
      mandi.marketKeywords.some((keyword) =>
        normalize(record.market).includes(normalize(keyword))
      )
    ) ?? null
  );
}

interface WeatherPayload {
  daily?: {
    precipitation_sum?: number[];
    precipitation_probability_max?: number[];
    temperature_2m_max?: number[];
  };
}

interface WeatherCache {
  at: number;
  shocks: MarketWeatherShock[];
  source: WeatherSource;
  warning: string | null;
}

let weatherCache: WeatherCache | null = null;

function simulateWeatherShocks(): MarketWeatherShock[] {
  const seed = nextSeed('onion', 'kolhapur');
  const rng = createRng(`weather|${seed}`);

  return WEATHER_MARKETS.map((market) => {
    const rainNext48hMm = round(rng() * 32, 1);
    const maxRainProbabilityPct = Math.round(
      20 + rng() * 75
    );
    const maxTempC = round(26 + rng() * 12, 1);
    const level: ShockLevel =
      rainNext48hMm >= 20 || maxRainProbabilityPct >= 80
        ? 'high'
        : rainNext48hMm >= 8 ||
            maxRainProbabilityPct >= 60
          ? 'watch'
          : 'none';

    return {
      mandiId: market.id,
      name: market.name,
      rainNext48hMm,
      maxRainProbabilityPct,
      maxTempC,
      level,
      source: 'simulated',
      reason:
        level === 'none'
          ? `Modeled weather is stable around ${market.name}.`
          : `Modeled ${rainNext48hMm} mm rain / ${maxRainProbabilityPct}% probability around ${market.name}.`,
    };
  });
}

async function fetchWeatherShock(
  market: WeatherMarket,
  signal?: AbortSignal
): Promise<MarketWeatherShock> {
  const url = `${OPEN_METEO_BASE}?latitude=${market.latitude}&longitude=${market.longitude}&daily=precipitation_sum,precipitation_probability_max,temperature_2m_max&forecast_days=3&timezone=auto`;

  const payload = await fetchJsonWithTimeout<WeatherPayload>(
    url,
    WEATHER_TIMEOUT_MS,
    signal
  );

  const rainValues =
    payload.daily?.precipitation_sum?.slice(0, 2) ?? [];
  const probabilityValues =
    payload.daily?.precipitation_probability_max?.slice(
      0,
      2
    ) ?? [];
  const tempValues =
    payload.daily?.temperature_2m_max ?? [];

  const rainNext48hMm = round(
    rainValues.reduce((sum, value) => sum + value, 0),
    1
  );
  const maxRainProbabilityPct = Math.round(
    probabilityValues.length > 0
      ? Math.max(...probabilityValues)
      : 0
  );
  const maxTempC = round(
    tempValues.length > 0 ? Math.max(...tempValues) : 30,
    1
  );

  const level: ShockLevel =
    rainNext48hMm >= 20 || maxRainProbabilityPct >= 80
      ? 'high'
      : rainNext48hMm >= 8 || maxRainProbabilityPct >= 60
        ? 'watch'
        : 'none';

  return {
    mandiId: market.id,
    name: market.name,
    rainNext48hMm,
    maxRainProbabilityPct,
    maxTempC,
    level,
    source: 'live',
    reason:
      level === 'none'
        ? `No disruptive rain signal around ${market.name}.`
        : `${rainNext48hMm} mm rain / ${maxRainProbabilityPct}% probability around ${market.name} could disrupt arrivals.`,
  };
}

async function loadWeatherShocks(
  force: boolean,
  signal?: AbortSignal
): Promise<{
  shocks: MarketWeatherShock[];
  source: WeatherSource;
  warning: string | null;
}> {
  if (
    !force &&
    weatherCache &&
    Date.now() - weatherCache.at < WEATHER_CACHE_TTL_MS
  ) {
    return weatherCache;
  }

  const results = await Promise.allSettled(
    WEATHER_MARKETS.map((market) =>
      fetchWeatherShock(market, signal)
    )
  );

  const shocks = results
    .filter(
      (
        result
      ): result is PromiseFulfilledResult<MarketWeatherShock> =>
        result.status === 'fulfilled'
    )
    .map((result) => result.value);

  if (shocks.length === 0) {
    const simulated = simulateWeatherShocks();
    const fallback: WeatherCache = {
      at: Date.now(),
      shocks: simulated,
      source: 'simulated',
      warning:
        'Open-Meteo weather signals are unavailable; using modeled supply shocks.',
    };
    weatherCache = fallback;
    return fallback;
  }

  const failedCount = results.length - shocks.length;
  const cache: WeatherCache = {
    at: Date.now(),
    shocks,
    source: 'live',
    warning:
      failedCount > 0
        ? `${failedCount} competing mandi weather feeds were unavailable.`
        : null,
  };

  weatherCache = cache;
  return cache;
}

function weatherPremium(
  shocks: MarketWeatherShock[]
): number {
  const highCount = shocks.filter(
    (shock) => shock.level === 'high'
  ).length;
  const watchCount = shocks.filter(
    (shock) => shock.level === 'watch'
  ).length;

  return highCount * 0.035 + watchCount * 0.012;
}

function seasonalPremium(
  crop: MarketCrop,
  now = new Date()
): number {
  const month = now.getMonth() + 1;

  if (!crop.peakMonths.includes(month)) return 0;

  return 0.035;
}

function buildSnapshot(
  crop: MarketCrop,
  mandi: MarketMandi,
  options: {
    liveRecord: LiveAgmarknetRecord | null;
    liveBenchmark: number | null;
    benchmarkMin: number | null;
    benchmarkMax: number | null;
    liveScope: MarketLiveScope | null;
    liveDate: string | null;
    source: MarketSource;
    note: string;
    weatherShocks: MarketWeatherShock[];
    weatherSource: WeatherSource;
    seed: string;
  }
): MarketSnapshot {
  const rng = createRng(options.seed);
  const liveAnchor =
    options.liveRecord?.modalPrice ??
    options.liveBenchmark ??
    null;
  const basePrice = liveAnchor ?? crop.basePrice;
  const premium =
    weatherPremium(options.weatherShocks) +
    seasonalPremium(crop);
  const jitter = (rng() - 0.5) * 0.06;
  const modalPrice = options.liveRecord
    ? options.liveRecord.modalPrice
    : Math.max(
        1,
        Math.round(
          basePrice * mandi.priceFactor * (1 + premium + jitter)
        )
      );

  const minPrice = options.liveRecord
    ? Math.min(
        options.liveRecord.minPrice || modalPrice,
        modalPrice
      )
    : Math.round(modalPrice * 0.88);
  const maxPrice = options.liveRecord
    ? Math.max(
        options.liveRecord.maxPrice || modalPrice,
        modalPrice
      )
    : Math.round(modalPrice * 1.12);

  const highShocks = options.weatherShocks.filter(
    (shock) => shock.level === 'high'
  ).length;
  const watchShocks = options.weatherShocks.filter(
    (shock) => shock.level === 'watch'
  ).length;

  let arrivalsChangePct = (rng() - 0.5) * 10;

  if (highShocks > 0) {
    arrivalsChangePct -= 12 + rng() * 10;
  } else if (watchShocks > 0) {
    arrivalsChangePct -= 4 + rng() * 8;
  }

  if (options.source === 'simulated') {
    arrivalsChangePct += (rng() - 0.5) * 5;
  }

  arrivalsChangePct = clamp(
    round(arrivalsChangePct, 1),
    -35,
    15
  );

  const arrivalsQuintals = Math.max(
    50,
    Math.round(
      crop.baseArrivals *
        mandi.arrivalFactor *
        (1 + arrivalsChangePct / 100)
    )
  );

  const supplyCrunch =
    arrivalsChangePct <= -15 || highShocks > 0;

  const rallyProbabilityPct = Math.round(
    clamp(
      28 +
        highShocks * 18 +
        watchShocks * 7 +
        (arrivalsChangePct <= -15 ? 20 : 0) +
        rng() * 10,
      8,
      96
    )
  );

  const dailyTrend = supplyCrunch
    ? 0.008 + (rallyProbabilityPct / 100) * 0.007
    : 0.0015 + (rallyProbabilityPct / 100) * 0.003;
  const seasonal = seasonalPremium(crop);
  const now = new Date();

  const history7d = Array.from({ length: 7 }, (_, index) => {
    const daysAgo = 6 - index;
    const date = new Date(now.getTime() - daysAgo * DAY_MS);
    const trendOffset = -dailyTrend * daysAgo;
    const noise = (rng() - 0.5) * 0.018;

    return buildPricePoint(
      date,
      modalPrice * (1 + trendOffset + noise)
    );
  });

  const forecast7d = Array.from({ length: 7 }, (_, index) => {
    const day = index + 1;
    const date = new Date(now.getTime() + day * DAY_MS);
    const trendOffset = dailyTrend * day;
    const noise = (rng() - 0.5) * 0.016;

    return buildPricePoint(
      date,
      modalPrice * (1 + trendOffset + seasonal + noise)
    );
  });

  const peakGain = clamp(
    0.04 +
      (rallyProbabilityPct / 100) * 0.13 +
      (supplyCrunch ? 0.04 : 0) +
      seasonal,
    0.03,
    0.3
  );
  const projectedPeak14dDay = 10 + Math.floor(rng() * 5);
  const projectedPeak14dPrice = Math.round(
    modalPrice * (1 + peakGain)
  );
  const projectedPeak14dDate = new Date(
    now.getTime() + projectedPeak14dDay * DAY_MS
  ).toISOString();

  const competingRainMm = round(
    options.weatherShocks.reduce(
      (sum, shock) => sum + shock.rainNext48hMm,
      0
    ),
    1
  );

  return {
    crop,
    mandi,
    modalPrice,
    minPrice,
    maxPrice,
    eNamBenchmark:
      options.liveBenchmark ??
      options.liveRecord?.modalPrice ??
      modalPrice,
    benchmarkMin: options.benchmarkMin ?? minPrice,
    benchmarkMax: options.benchmarkMax ?? maxPrice,
    msp: crop.msp,
    mspLabel: crop.mspLabel,
    arrivalsQuintals,
    arrivalsChangePct,
    weatherShocks: options.weatherShocks,
    weatherSource: options.weatherSource,
    competingRainMm,
    supplyCrunch,
    rallyProbabilityPct,
    history7d,
    forecast7d,
    projectedPeak14dPrice,
    projectedPeak14dDay,
    projectedPeak14dDate,
    trendPct: round(
      ((forecast7d[forecast7d.length - 1].price - modalPrice) /
        modalPrice) *
        100,
      1
    ),
    source: options.source,
    fetchedAt: now.toISOString(),
    liveMarket: options.liveRecord?.market ?? null,
    liveScope: options.liveScope,
    liveDate: options.liveDate,
    note: options.note,
  };
}

export async function fetchMarketSnapshot(
  cropId: MarketCropId,
  mandiId: MarketMandiId,
  options: {
    forceWeather?: boolean;
    signal?: AbortSignal;
  } = {}
): Promise<MarketSnapshotResponse> {
  const crop = getMarketCrop(cropId);
  const mandi = getMarketMandi(mandiId);

  const weatherPromise = loadWeatherShocks(
    options.forceWeather ?? false,
    options.signal
  );
  const agmarknetPromise = fetchAgmarknetRecords(
    crop,
    options.signal
  )
    .then((records) => ({
      records,
      error: null as Error | null,
    }))
    .catch((caught: unknown) => ({
      records: [] as LiveAgmarknetRecord[],
      error:
        caught instanceof Error
          ? caught
          : new Error('The live Agmarknet feed is unavailable.'),
    }));

  const [weather, agmarknet] = await Promise.all([
    weatherPromise,
    agmarknetPromise,
  ]);

  let liveRecord: LiveAgmarknetRecord | null = null;
  let liveBenchmark: number | null = null;
  let benchmarkMin: number | null = null;
  let benchmarkMax: number | null = null;
  let liveScope: MarketLiveScope | null = null;
  let liveDate: string | null = null;
  let source: MarketSource = 'simulated';
  let note =
    'Dynamic time-seeded simulation active while the live Agmarknet feed is unavailable.';
  let warning = weather.warning;

  if (agmarknet.error) {
    warning = [warning, agmarknet.error.message]
      .filter(Boolean)
      .join(' ');
  } else if (agmarknet.records.length > 0) {
    const stateRecords = agmarknet.records.filter(
      (record) => normalize(record.state) === 'maharashtra'
    );
    const benchmarkPool =
      stateRecords.length > 0 ? stateRecords : agmarknet.records;
    const benchmarkPrices = benchmarkPool.map(
      (record) => record.modalPrice
    );

    liveBenchmark = median(benchmarkPrices);
    benchmarkMin = Math.min(...benchmarkPrices);
    benchmarkMax = Math.max(...benchmarkPrices);
    liveRecord = findLiveRecord(agmarknet.records, mandi);
    source = 'live';

    if (liveRecord) {
      liveScope = 'mandi';
      liveDate = liveRecord.arrivalDate;
      note = `Live Agmarknet record from ${liveRecord.market} (${liveRecord.arrivalDate}); arrivals are modeled from the weather and supply signal.`;
    } else if (stateRecords.length > 0) {
      liveScope = 'state';
      note = `Live Maharashtra Agmarknet benchmark; ${mandi.name} modal and arrivals are modeled from the state median and weather signal.`;
    } else {
      liveScope = 'national';
      note = `Live national Agmarknet benchmark; ${mandi.name} modal and arrivals are modeled from the national median and weather signal.`;
    }
  }

  const snapshot = buildSnapshot(crop, mandi, {
    liveRecord,
    liveBenchmark,
    benchmarkMin,
    benchmarkMax,
    liveScope,
    liveDate,
    source,
    note,
    weatherShocks: weather.shocks,
    weatherSource: weather.source,
    seed: nextSeed(cropId, mandiId),
  });

  return {
    snapshot,
    warning: warning || null,
  };
}

export function createSimulatedMarketSnapshot(
  cropId: MarketCropId,
  mandiId: MarketMandiId
): MarketSnapshot {
  const crop = getMarketCrop(cropId);
  const mandi = getMarketMandi(mandiId);
  const shocks = simulateWeatherShocks();

  return buildSnapshot(crop, mandi, {
    liveRecord: null,
    liveBenchmark: null,
    benchmarkMin: null,
    benchmarkMax: null,
    liveScope: null,
    liveDate: null,
    source: 'simulated',
    note:
      'Dynamic time-seeded simulation. Agmarknet and weather feeds were unavailable.',
    weatherShocks: shocks,
    weatherSource: 'simulated',
    seed: nextSeed(cropId, mandiId),
  });
}

export function runMandiPulse(
  snapshot: MarketSnapshot
): MandiPulseResult {
  const previousArrivalsQuintals = Math.max(
    1,
    Math.round(
      snapshot.arrivalsQuintals /
        (1 + snapshot.arrivalsChangePct / 100)
    )
  );

  const disruptions = snapshot.weatherShocks.filter(
    (shock) => shock.level !== 'none'
  );
  const highDisruptions = disruptions.filter(
    (shock) => shock.level === 'high'
  );

  const signal: MandiPulseResult['signal'] =
    snapshot.supplyCrunch
      ? 'shortage'
      : snapshot.arrivalsChangePct > 8
        ? 'glut'
        : 'balanced';
  const arrivalDropTriggered =
    snapshot.arrivalsChangePct <= -15;
  const highRainTriggered = highDisruptions.length > 0;
  const crunchReason =
    arrivalDropTriggered && highRainTriggered
      ? 'The arrival drop and a high rain shock in a competing mandi are both active.'
      : arrivalDropTriggered
        ? 'The arrival drop triggered it.'
        : highRainTriggered
          ? 'A high rain shock in a competing mandi triggered it even though the arrival drop is below 15%.'
          : 'Neither the 15% arrival drop nor a high rain shock is active.';

  const reasoning: MarketTrace[] = [
    {
      id: 'pulse-arrivals',
      agent: 'MandiPulse',
      step: 'Daily arrival pulse',
      detail: `${formatNumber(snapshot.arrivalsQuintals)} qt modeled arrivals today vs ${formatNumber(previousArrivalsQuintals)} qt in the previous session (${snapshot.arrivalsChangePct > 0 ? '+' : ''}${snapshot.arrivalsChangePct}%).`,
      status:
        snapshot.arrivalsChangePct <= -15
          ? 'critical'
          : snapshot.arrivalsChangePct < 0
            ? 'warning'
            : 'ok',
    },
    {
      id: 'pulse-weather',
      agent: 'MandiPulse',
      step: 'Competing-mandi weather shock',
      detail:
        disruptions.length === 0
          ? 'No heavy-rain disruption signals across Nashik, Pune, Kolhapur, Sangli, Solapur or Nagpur.'
          : disruptions
              .slice(0, 4)
              .map(
                (shock) =>
                  `${shock.name}: ${shock.rainNext48hMm} mm rain / ${shock.maxRainProbabilityPct}% (${shock.level})`
              )
              .join(' · '),
      status:
        highDisruptions.length > 0
          ? 'critical'
          : disruptions.length > 0
            ? 'warning'
            : 'ok',
    },
    {
      id: 'pulse-crunch',
      agent: 'MandiPulse',
      step: 'Supply crunch threshold',
      detail: `Arrivals are ${snapshot.arrivalsChangePct}% vs the prior session. The rally trigger is a drop of 15% or more or a high rain shock in a competing mandi. ${crunchReason}`,
      status: snapshot.supplyCrunch ? 'warning' : 'ok',
    },
    {
      id: 'pulse-rally',
      agent: 'MandiPulse',
      step: 'Price rally probability',
      detail: `${snapshot.rallyProbabilityPct}% probability of a near-term price rally from weather and arrival pressure. ${snapshot.supplyCrunch ? 'Supply shortage conditions favor sellers.' : 'Supply is relatively balanced.'}`,
      status:
        snapshot.rallyProbabilityPct >= 65
          ? 'warning'
          : 'info',
    },
  ];

  return {
    arrivalsQuintals: snapshot.arrivalsQuintals,
    previousArrivalsQuintals,
    arrivalsChangePct: snapshot.arrivalsChangePct,
    supplyCrunch: snapshot.supplyCrunch,
    rallyProbabilityPct: snapshot.rallyProbabilityPct,
    disruptionCount: disruptions.length,
    signal,
    weatherShocks: snapshot.weatherShocks,
    weatherSource: snapshot.weatherSource,
    reasoning,
  };
}

export function runProfitTimingAgent(
  snapshot: MarketSnapshot,
  quantityQuintals: number
): ProfitTimingResult {
  const quantity = clamp(
    Math.round(quantityQuintals),
    1,
    100000
  );
  const currentPrice = snapshot.modalPrice;
  const projectedPeakPrice = snapshot.projectedPeak14dPrice;
  const projectedPeakDay = snapshot.projectedPeak14dDay;
  const storageMonths = projectedPeakDay / 30;
  const storageCostPerQuintal = Math.round(
    snapshot.crop.coldStorageCostPerQuintalMonth *
      storageMonths
  );
  const grossGainPerQuintal = Math.max(
    0,
    projectedPeakPrice - currentPrice
  );
  const netPerQuintal =
    grossGainPerQuintal - storageCostPerQuintal;
  const potentialGainPercent = round(
    ((projectedPeakPrice - currentPrice) / currentPrice) *
      100,
    1
  );
  const canPhysicallyHold =
    snapshot.crop.storageLifeDays >= projectedPeakDay;
  const isAboveMsp =
    snapshot.msp !== null
      ? currentPrice >= snapshot.msp
      : true;

  const sellNow =
    !canPhysicallyHold ||
    netPerQuintal <= 0 ||
    potentialGainPercent < 5;

  const hold =
    !sellNow &&
    snapshot.crop.perishability !== 'high' &&
    potentialGainPercent >= 10 &&
    projectedPeakDay >= 10 &&
    projectedPeakDay <= 14;

  const stagger = !sellNow && !hold;

  let verdict: MarketVerdict = 'SELL_NOW';
  let verdictLabel = 'SELL NOW — PEAK DEMAND';
  let verdictColor = '#1B7A1F';
  let headline =
    'Current price is at or near its 14-day peak. Lock in the harvest value now.';

  if (hold) {
    verdict = 'HOLD';
    verdictLabel = `HOLD FOR ${projectedPeakDay} DAYS (+${potentialGainPercent}% SURGE EXPECTED)`;
    verdictColor = '#B7791F';
    headline = `${snapshot.crop.name} can be stored safely for ${projectedPeakDay} days. The 14-day peak is projected at ${formatINR(projectedPeakPrice)}/qt.`;
  } else if (stagger) {
    verdict = 'STAGGER';
    verdictLabel =
      'STAGGER SALES (SELL 50% NOW, STORE 50%)';
    verdictColor = '#2563EB';
    headline =
      'Split the harvest to capture upside while protecting against a weather-driven price reversal.';
  }

  const storageCostTotal = Math.round(
    storageCostPerQuintal *
      quantity *
      (verdict === 'STAGGER' ? 0.5 : 1)
  );
  const netExtraProfit =
    verdict === 'SELL_NOW'
      ? 0
      : Math.round(
          netPerQuintal *
            quantity *
            (verdict === 'STAGGER' ? 0.5 : 1)
        );
  const totalProjectedValue =
    currentPrice * quantity + netExtraProfit;
  const projectedPeakDateLabel = formatDateLabel(
    new Date(snapshot.projectedPeak14dDate)
  );

  const reasoning: MarketTrace[] = [
    {
      id: 'timing-current',
      agent: 'ProfitTiming',
      step: 'Modal price check',
      detail: snapshot.msp
        ? `${formatINR(currentPrice)}/qt today vs ${snapshot.mspLabel} ${formatINR(snapshot.msp)}. Current price is ${isAboveMsp ? 'above' : 'below'} the benchmark.`
        : `${formatINR(currentPrice)}/qt today. No MSP or FRP is notified for ${snapshot.crop.name}; price discovery is market-linked.`,
      status: snapshot.msp
        ? isAboveMsp
          ? 'ok'
          : 'warning'
        : 'info',
    },
    {
      id: 'timing-peak',
      agent: 'ProfitTiming',
      step: '14-day projected peak',
      detail: `${formatINR(projectedPeakPrice)}/qt projected on ${projectedPeakDateLabel} (${potentialGainPercent > 0 ? '+' : ''}${potentialGainPercent}%).`,
      status:
        potentialGainPercent >= 10
          ? 'ok'
          : potentialGainPercent < 5
            ? 'warning'
            : 'info',
    },
    {
      id: 'timing-storage',
      agent: 'ProfitTiming',
      step: 'Storage and shelf life',
      detail: `${snapshot.crop.name} shelf life is ${snapshot.crop.storageLifeDays} days. Cold storage costs ${formatINR(storageCostPerQuintal)}/qt for ${projectedPeakDay} days. Net gain is ${formatINR(netPerQuintal)}/qt.`,
      status: canPhysicallyHold ? 'ok' : 'critical',
    },
    {
      id: 'timing-net',
      agent: 'ProfitTiming',
      step: 'Net extra profit',
      detail: `${verdict === 'SELL_NOW' ? 'Selling today avoids storage exposure.' : `Following the ${verdict === 'STAGGER' ? 'staggered' : 'hold'} strategy adds ${formatINR(netExtraProfit)} for ${formatNumber(quantity)} qt after storage costs.`}`,
      status: netExtraProfit > 0 ? 'ok' : 'info',
    },
  ];

  return {
    verdict,
    verdictLabel,
    verdictColor,
    headline,
    currentPrice,
    msp: snapshot.msp,
    mspLabel: snapshot.mspLabel,
    projectedPeakPrice,
    projectedPeakDay,
    projectedPeakDateLabel,
    potentialGainPercent,
    storageCostPerQuintal,
    storageCostTotal,
    netExtraProfit,
    totalProjectedValue,
    quantityQuintals: quantity,
    canPhysicallyHold,
    isAboveMsp,
    reasoning,
  };
}

export function runMiddlemanFraudShield(
  snapshot: MarketSnapshot,
  input: FraudAuditInput
): FraudAuditResult {
  const quantity = clamp(
    Math.round(input.quantityQuintals),
    1,
    100000
  );
  const offeredPrice = Math.max(1, Math.round(input.offeredPrice));
  const dryageKgPerBag = clamp(
    input.dryageKgPerBag,
    0,
    10
  );
  const commissionPercent = clamp(
    input.commissionPercent,
    0,
    100
  );
  const referencePrice =
    snapshot.liveScope === 'mandi'
      ? snapshot.modalPrice
      : snapshot.eNamBenchmark;
  const fairPerQuintal = Math.max(
    referencePrice,
    snapshot.msp ?? 0
  );
  const priceGapPerQuintal = offeredPrice - fairPerQuintal;
  const priceGapPct = round(
    (priceGapPerQuintal / fairPerQuintal) * 100,
    1
  );
  const excessDryageKgPerBag = Math.max(
    0,
    dryageKgPerBag - LEGAL_DRYAGE_KG_PER_BAG
  );
  const weightFactor = clamp(
    1 - dryageKgPerBag / 50,
    0.7,
    1
  );
  const grossTraderValue =
    offeredPrice * quantity * weightFactor;
  const commissionLoss = Math.round(
    grossTraderValue * (commissionPercent / 100)
  );
  const traderPayout = Math.round(
    grossTraderValue - commissionLoss
  );
  const fairENamValue = Math.round(
    fairPerQuintal * quantity
  );
  const legalWeightFactor =
    1 -
    Math.min(
      dryageKgPerBag,
      LEGAL_DRYAGE_KG_PER_BAG
    ) /
      50;
  const legalCommissionPct = Math.min(
    commissionPercent,
    LEGAL_COMMISSION_PCT
  );
  const fairGrossValue =
    fairPerQuintal * quantity * legalWeightFactor;
  const fairCommissionLoss = Math.round(
    fairGrossValue * (legalCommissionPct / 100)
  );
  const fairPayout = Math.round(
    fairGrossValue - fairCommissionLoss
  );
  const totalFinancialLoss = Math.max(
    0,
    fairPayout - traderPayout
  );
  const netTraderPerQuintal = Math.round(
    traderPayout / quantity
  );
  const dryageLoss = Math.round(
    offeredPrice * quantity * (dryageKgPerBag / 50)
  );
  const illegalDryage =
    dryageKgPerBag > LEGAL_DRYAGE_KG_PER_BAG;
  const illegalCommission =
    commissionPercent > LEGAL_COMMISSION_PCT;
  const mspViolation =
    snapshot.msp !== null && offeredPrice < snapshot.msp;

  let riskScore = 0;

  if (priceGapPct < 0) {
    riskScore += Math.min(35, Math.abs(priceGapPct) * 3);
  }

  if (illegalDryage) {
    riskScore += Math.min(
      30,
      20 + excessDryageKgPerBag * 10
    );
  }

  if (illegalCommission) {
    riskScore += Math.min(
      30,
      20 + (commissionPercent - LEGAL_COMMISSION_PCT) * 8
    );
  }

  if (mspViolation) riskScore += 20;

  if (
    totalFinancialLoss > 0 &&
    traderPayout < fairENamValue * 0.8
  ) {
    riskScore += 5;
  }

  riskScore = Math.round(clamp(riskScore, 0, 100));

  const fraudReasons: string[] = [];

  if (priceGapPct < -5) {
    fraudReasons.push('below the e-NAM benchmark');
  }

  if (mspViolation) {
    fraudReasons.push('below the notified MSP');
  }

  if (illegalDryage) {
    fraudReasons.push('above the legal dryage cap');
  }

  if (illegalCommission) {
    fraudReasons.push('above the legal commission cap');
  }

  const reasonSuffix =
    fraudReasons.length > 0
      ? ` (${fraudReasons.join(', ')})`
      : '';
  const nonPriceReasons = fraudReasons.filter(
    (reason) => reason !== 'below the e-NAM benchmark'
  );
  const nonPriceText =
    nonPriceReasons.length > 0
      ? `The quote is ${nonPriceReasons.join(' and ')}, even though the payout is not below fair value. Get the terms corrected before accepting.`
      : 'The quote needs verification before accepting.';

  let riskLevel: FraudRiskLevel = 'safe';
  let verdictLabel =
    'FAIR DEAL — DEDUCTIONS WITHIN LIMITS';
  let verdictColor = '#2D7A31';
  let verdictBackground = '#EAF6E9';
  let warning =
    'No unfair deduction or price gap detected against the e-NAM benchmark.';

  if (riskScore >= 70) {
    riskLevel = 'fraud';
    verdictLabel = `FRAUD RISK ${riskScore}% — REJECT THIS DEAL`;
    verdictColor = '#B42318';
    verdictBackground = '#FDECEA';
    warning =
      totalFinancialLoss > 0
        ? `Reject this quote. The trader payout is ${formatINR(totalFinancialLoss)} below the fair payout after legal caps${reasonSuffix}.`
        : `Reject this quote. ${nonPriceText}`;
  } else if (riskScore >= 45) {
    riskLevel = 'high';
    verdictLabel = `HIGH RISK ${riskScore}% — NEGOTIATE OR WALK AWAY`;
    verdictColor = '#B42318';
    verdictBackground = '#FDECEA';
    warning =
      totalFinancialLoss > 0
        ? `This quote is ${formatINR(totalFinancialLoss)} below the fair payout after legal caps${reasonSuffix}. Negotiate or walk away.`
        : nonPriceText;
  } else if (riskScore >= 20) {
    riskLevel = 'caution';
    verdictLabel = `CAUTION ${riskScore}% — VERIFY DEDUCTIONS`;
    verdictColor = '#B7791F';
    verdictBackground = '#FFF7E6';
    warning =
      totalFinancialLoss > 0
        ? `The quote is ${formatINR(totalFinancialLoss)} below the fair payout after legal caps${reasonSuffix}. Negotiate before accepting.`
        : nonPriceText;
  }

  const isExploitation =
    riskScore >= 45 ||
    illegalDryage ||
    illegalCommission ||
    mspViolation;

  const fraudItems: FraudAuditResult['fraudItems'] = [
    {
      label: `Offered price vs e-NAM (${formatINR(fairPerQuintal)}/qt)`,
      amount: Math.round(priceGapPerQuintal * quantity),
      isFraud: priceGapPct < -5,
    },
    {
      label: `Weight deduction (${dryageKgPerBag} kg/bag; legal max ${LEGAL_DRYAGE_KG_PER_BAG} kg)`,
      amount: -dryageLoss,
      isFraud: illegalDryage,
    },
    {
      label: `Arhatiya commission (${commissionPercent}%; legal max ${LEGAL_COMMISSION_PCT}%)`,
      amount: -commissionLoss,
      isFraud: illegalCommission,
    },
    {
      label: snapshot.msp
        ? `MSP check (${formatINR(snapshot.msp)}/qt)`
        : 'MSP check (not notified for this crop)',
      amount: mspViolation
        ? Math.round((offeredPrice - snapshot.msp!) * quantity)
        : 0,
      isFraud: mspViolation,
    },
  ].filter((item) => item.amount !== 0 || item.isFraud);

  const reasoning: MarketTrace[] = [
    {
      id: 'fraud-price',
      agent: 'MiddlemanFraudShield',
      step: 'Price quote audit',
      detail: `Trader offered ${formatINR(offeredPrice)}/qt vs the e-NAM benchmark of ${formatINR(fairPerQuintal)}/qt (${priceGapPct > 0 ? '+' : ''}${priceGapPct}%).`,
      status: priceGapPct < -5 ? 'critical' : 'ok',
    },
    {
      id: 'fraud-dryage',
      agent: 'MiddlemanFraudShield',
      step: 'Weight deduction audit',
      detail: `${dryageKgPerBag} kg deducted per 50 kg bag. Legal maximum is ${LEGAL_DRYAGE_KG_PER_BAG} kg; excess is ${excessDryageKgPerBag} kg/bag.`,
      status: illegalDryage ? 'critical' : 'ok',
    },
    {
      id: 'fraud-commission',
      agent: 'MiddlemanFraudShield',
      step: 'Arhatiya commission audit',
      detail: `${commissionPercent}% commission claimed. Legal maximum is ${LEGAL_COMMISSION_PCT}%. ${illegalCommission ? 'Excess commission is unlawful.' : 'Commission is within the legal cap.'}`,
      status: illegalCommission ? 'critical' : 'ok',
    },
    {
      id: 'fraud-msp',
      agent: 'MiddlemanFraudShield',
      step: 'MSP compliance audit',
      detail:
        snapshot.msp === null
          ? 'No MSP is notified for this crop; the e-NAM benchmark is the reference price.'
          : mspViolation
            ? `Offered ${formatINR(offeredPrice)}/qt is below the notified MSP of ${formatINR(snapshot.msp)}/qt.`
            : `Offered ${formatINR(offeredPrice)}/qt is at or above the notified MSP of ${formatINR(snapshot.msp)}/qt.`,
      status: mspViolation ? 'critical' : 'ok',
    },
    {
      id: 'fraud-loss',
      agent: 'MiddlemanFraudShield',
      step: 'Net payout and loss',
      detail: `Fair e-NAM value ${formatINR(fairENamValue)} (${formatINR(fairPayout)} after legal caps) vs trader payout ${formatINR(traderPayout)}. Estimated loss ${formatINR(totalFinancialLoss)} on ${formatNumber(quantity)} qt.`,
      status: totalFinancialLoss > 0 ? 'warning' : 'ok',
    },
  ];

  return {
    riskScore,
    riskLevel,
    verdictLabel,
    verdictColor,
    verdictBackground,
    isExploitation,
    warning,
    fairENamValue,
    fairPayout,
    traderPayout,
    totalFinancialLoss,
    fairPerQuintal,
    netTraderPerQuintal,
    offeredPrice,
    priceGapPerQuintal,
    priceGapPct,
    legalDryageKgPerBag: LEGAL_DRYAGE_KG_PER_BAG,
    legalCommissionPct: LEGAL_COMMISSION_PCT,
    excessDryageKgPerBag,
    dryageLoss,
    commissionLoss,
    mspViolation,
    fraudItems,
    reasoning,
  };
}

export function runMarketAgent(
  snapshot: MarketSnapshot,
  quantityQuintals: number,
  fraudInput: FraudAuditInput
): MarketIntelligence {
  const pulse = runMandiPulse(snapshot);
  const timing = runProfitTimingAgent(
    snapshot,
    quantityQuintals
  );
  const fraud = runMiddlemanFraudShield(
    snapshot,
    fraudInput
  );

  const workflow: MarketWorkflowStep[] = [
    {
      step: 1,
      agent: 'MandiPulse',
      title: 'Supply & weather scan',
      summary: `${formatNumber(pulse.arrivalsQuintals)} qt arrivals (${pulse.arrivalsChangePct > 0 ? '+' : ''}${pulse.arrivalsChangePct}%) · ${pulse.rallyProbabilityPct}% rally probability`,
      status: pulse.supplyCrunch ? 'warning' : 'ok',
    },
    {
      step: 2,
      agent: 'ProfitTiming',
      title: 'Sell vs hold forecast',
      summary: `${timing.verdictLabel} · ${formatINR(timing.netExtraProfit)} net extra profit`,
      status:
        timing.verdict === 'HOLD'
          ? 'warning'
          : timing.verdict === 'STAGGER'
            ? 'info'
            : 'ok',
    },
    {
      step: 3,
      agent: 'MiddlemanFraudShield',
      title: 'Deal audit & exploitation guard',
      summary:
        fraud.totalFinancialLoss > 0
          ? `${fraud.riskScore}% fraud risk · ${formatINR(fraud.totalFinancialLoss)} at risk`
          : fraud.isExploitation
            ? `${fraud.riskScore}% fraud risk · illegal terms flagged`
            : `${fraud.riskScore}% fraud risk · no exploitation flag`,
      status:
        fraud.riskScore >= 70
          ? 'critical'
          : fraud.isExploitation ||
              fraud.riskScore >= 45 ||
              fraud.totalFinancialLoss > 0
            ? 'warning'
            : fraud.riskScore >= 20
              ? 'info'
              : 'ok',
    },
  ];

  return {
    snapshot,
    pulse,
    timing,
    fraud,
    workflow,
    generatedAt: new Date().toISOString(),
  };
}
