import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { AssistantLanguage } from '@/constants/assistant-i18n';
import { AGRI_PRODUCTS } from '@/data/agriProducts';
import {
  DEFAULT_WEATHER_LOCATION,
  type City,
} from '@/services/weatherIrrigationAgent';
import {
  getSelectedWeatherLocation,
  setSelectedWeatherLocation,
  subscribeToSelectedWeatherLocation,
} from '@/services/weather-location-store';
import { persistentStorage } from '@/utils/persistentStorage';
import type {
  NormalizedDiagnosis,
  SeverityLevel,
} from '@/utils/recommendationEngine';

export const FARM_STORAGE_KEYS = {
  language: 'ff_language_v1',
  location: 'ff_location_v1',
  cart: 'ff_cart_v1',
  diagnosis: 'ff_diagnosis_v1',
  plots: 'ff_plots_v1',
} as const;

export type DiagnosisSource = 'crop-doctor' | 'agri-shop' | 'link';

export interface ActiveDiagnosis extends NormalizedDiagnosis {
  source: DiagnosisSource;
  scannedAt: string;
  checkedCureSteps: string[];
}

export interface CartItem {
  product: (typeof AGRI_PRODUCTS)[number];
  quantity: number;
}

export type FarmLocation = City;

export interface FarmPlot {
  id: string;
  name: string;
  crop: string;
  acres: number;
  ndvi: number;
  ndviStatus: string;
  nitrogenKg: number;
  phosphorusKg: number;
  potassiumKg: number;
  ph: number;
  moisturePct: number;
  valveOpen: boolean;
  flowLpm: number;
  daysToHarvest: number;
  projectedYieldTonnes: number;
  healthPct: number;
}

export const DEFAULT_FARM_PLOTS: FarmPlot[] = [
  {
    id: 'plot-a',
    name: 'Plot A (North Ridge)',
    crop: 'Wheat & Mustard',
    acres: 3.5,
    ndvi: 0.78,
    ndviStatus: 'Dense Green Canopy',
    nitrogenKg: 142,
    phosphorusKg: 38,
    potassiumKg: 210,
    ph: 6.8,
    moisturePct: 42,
    valveOpen: true,
    flowLpm: 32,
    daysToHarvest: 18,
    projectedYieldTonnes: 4.6,
    healthPct: 94,
  },
  {
    id: 'plot-b',
    name: 'Plot B (Greenhouse East)',
    crop: 'Organic Tomato',
    acres: 1.8,
    ndvi: 0.82,
    ndviStatus: 'Vigorous Flowering',
    nitrogenKg: 165,
    phosphorusKg: 52,
    potassiumKg: 240,
    ph: 6.5,
    moisturePct: 56,
    valveOpen: false,
    flowLpm: 0,
    daysToHarvest: 12,
    projectedYieldTonnes: 8.2,
    healthPct: 98,
  },
  {
    id: 'plot-c',
    name: 'Plot C (South Valley)',
    crop: 'Bt Cotton',
    acres: 4.2,
    ndvi: 0.69,
    ndviStatus: 'Boll Formation',
    nitrogenKg: 128,
    phosphorusKg: 31,
    potassiumKg: 195,
    ph: 7.1,
    moisturePct: 35,
    valveOpen: true,
    flowLpm: 45,
    daysToHarvest: 34,
    projectedYieldTonnes: 3.8,
    healthPct: 88,
  },
  {
    id: 'plot-d',
    name: 'Plot D (West Terrace)',
    crop: 'Nasik Red Onion',
    acres: 2.5,
    ndvi: 0.74,
    ndviStatus: 'Bulb Development',
    nitrogenKg: 135,
    phosphorusKg: 44,
    potassiumKg: 225,
    ph: 6.7,
    moisturePct: 48,
    valveOpen: false,
    flowLpm: 0,
    daysToHarvest: 22,
    projectedYieldTonnes: 6.4,
    healthPct: 92,
  },
];

interface StoredCartEntry {
  productId: string;
  quantity: number;
}

interface FarmContextValue {
  language: AssistantLanguage;
  setLanguage: (language: AssistantLanguage) => void;
  location: FarmLocation;
  setLocation: (location: FarmLocation) => void;
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  diagnosis: ActiveDiagnosis | null;
  setDiagnosis: (diagnosis: ActiveDiagnosis | null) => void;
  toggleDiagnosisCureStep: (stepKey: string) => void;
  plots: FarmPlot[];
  setPlots: React.Dispatch<React.SetStateAction<FarmPlot[]>>;
  togglePlotValve: (plotId: string) => void;
  isHydrated: boolean;
}

const FarmContext = createContext<FarmContextValue | null>(null);

function normalizeLanguage(value: unknown): AssistantLanguage {
  return value === 'hi' || value === 'mr' || value === 'en' ? value : 'en';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeLocation(value: unknown): FarmLocation {
  if (!isRecord(value)) return DEFAULT_WEATHER_LOCATION;

  const latitude = Number(value.latitude);
  const longitude = Number(value.longitude);
  const name = typeof value.name === 'string' ? value.name : '';

  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return DEFAULT_WEATHER_LOCATION;
  }

  return {
    ...DEFAULT_WEATHER_LOCATION,
    ...(value as Partial<FarmLocation>),
    id:
      typeof value.id === 'string' && value.id
        ? value.id
        : `${latitude},${longitude}`,
    name,
    shortName:
      typeof value.shortName === 'string' && value.shortName
        ? value.shortName
        : name,
    state:
      typeof value.state === 'string' && value.state
        ? value.state
        : DEFAULT_WEATHER_LOCATION.state,
    stateCode:
      typeof value.stateCode === 'string' && value.stateCode
        ? value.stateCode
        : DEFAULT_WEATHER_LOCATION.stateCode,
    latitude,
    longitude,
  };
}

function clampQuantity(quantity: unknown): number {
  const parsed = Math.floor(Number(quantity));
  return Number.isFinite(parsed) ? Math.max(1, Math.min(99, parsed)) : 1;
}

function hydrateCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];

  const items = new Map<string, CartItem>();

  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.productId !== 'string') continue;

    const product = AGRI_PRODUCTS.find(
      (candidate) => candidate.id === entry.productId
    );

    if (!product) continue;

    const existing = items.get(product.id);

    items.set(product.id, {
      product,
      quantity: clampQuantity(
        (existing?.quantity ?? 0) + clampQuantity(entry.quantity)
      ),
    });
  }

  return Array.from(items.values());
}

function normalizeDiagnosis(value: unknown): ActiveDiagnosis | null {
  if (!isRecord(value)) return null;

  if (
    typeof value.disease !== 'string' ||
    typeof value.crop !== 'string' ||
    (value.source !== 'crop-doctor' &&
      value.source !== 'agri-shop' &&
      value.source !== 'link')
  ) {
    return null;
  }

  const severity: SeverityLevel =
    value.severity === 'Low' ||
    value.severity === 'Moderate' ||
    value.severity === 'High'
      ? value.severity
      : 'Moderate';

  const checkedCureSteps = Array.isArray(value.checkedCureSteps)
    ? Array.from(
        new Set(
          value.checkedCureSteps.filter(
            (step): step is string => typeof step === 'string'
          )
        )
      )
    : [];

  return {
    disease: value.disease,
    crop: value.crop,
    severity,
    confidence:
      typeof value.confidence === 'number' ? value.confidence : undefined,
    rawLabel:
      typeof value.rawLabel === 'string' ? value.rawLabel : undefined,
    source: value.source,
    scannedAt:
      typeof value.scannedAt === 'string'
        ? value.scannedAt
        : new Date().toISOString(),
    checkedCureSteps,
  };
}

function normalizePlots(value: unknown): FarmPlot[] {
  if (!Array.isArray(value)) return DEFAULT_FARM_PLOTS;

  const plots = value.filter(
    (plot): plot is FarmPlot =>
      isRecord(plot) &&
      typeof plot.id === 'string' &&
      typeof plot.name === 'string' &&
      typeof plot.crop === 'string' &&
      typeof plot.moisturePct === 'number' &&
      typeof plot.valveOpen === 'boolean'
  );

  return plots.length > 0 ? plots : DEFAULT_FARM_PLOTS;
}

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AssistantLanguage>('en');
  const [location, setLocationState] = useState<FarmLocation>(
    getSelectedWeatherLocation()
  );
  const [cartItems, setCartItemsState] = useState<CartItem[]>([]);
  const [diagnosis, setDiagnosisState] = useState<ActiveDiagnosis | null>(null);
  const [plots, setPlotsState] = useState<FarmPlot[]>(DEFAULT_FARM_PLOTS);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let alive = true;

    void Promise.all([
      persistentStorage.getItem(FARM_STORAGE_KEYS.language, 'en'),
      persistentStorage.getItem<unknown>(
        FARM_STORAGE_KEYS.location,
        DEFAULT_WEATHER_LOCATION
      ),
      persistentStorage.getItem<unknown>(FARM_STORAGE_KEYS.cart, []),
      persistentStorage.getItem<unknown>(FARM_STORAGE_KEYS.diagnosis, null),
      persistentStorage.getItem<unknown>(
        FARM_STORAGE_KEYS.plots,
        DEFAULT_FARM_PLOTS
      ),
    ]).then(([storedLanguage, storedLocation, storedCart, storedDiagnosis, storedPlots]) => {
      if (!alive) return;

      const nextLocation = normalizeLocation(storedLocation);

      setLanguageState(normalizeLanguage(storedLanguage));
      setLocationState(nextLocation);
      setSelectedWeatherLocation(nextLocation);
      setCartItemsState(hydrateCart(storedCart));
      setDiagnosisState(normalizeDiagnosis(storedDiagnosis));
      setPlotsState(normalizePlots(storedPlots));
      setIsHydrated(true);
    });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const syncLocation = () => {
      const nextLocation = getSelectedWeatherLocation();
      setLocationState((current) => {
        if (
          current.id === nextLocation.id &&
          current.latitude === nextLocation.latitude &&
          current.longitude === nextLocation.longitude
        ) {
          return current;
        }

        return nextLocation;
      });
    };

    syncLocation();
    return subscribeToSelectedWeatherLocation(syncLocation);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    void persistentStorage.setItem(FARM_STORAGE_KEYS.language, language);
  }, [isHydrated, language]);

  useEffect(() => {
    if (!isHydrated) return;
    void persistentStorage.setItem(FARM_STORAGE_KEYS.location, location);
  }, [isHydrated, location]);

  useEffect(() => {
    if (!isHydrated) return;

    const entries: StoredCartEntry[] = cartItems.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    void persistentStorage.setItem(FARM_STORAGE_KEYS.cart, entries);
  }, [cartItems, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    void persistentStorage.setItem(FARM_STORAGE_KEYS.diagnosis, diagnosis);
  }, [diagnosis, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    void persistentStorage.setItem(FARM_STORAGE_KEYS.plots, plots);
  }, [isHydrated, plots]);

  const setLanguage = useCallback((nextLanguage: AssistantLanguage) => {
    setLanguageState(normalizeLanguage(nextLanguage));
  }, []);

  const setLocation = useCallback((nextLocation: FarmLocation) => {
    const normalized = normalizeLocation(nextLocation);
    setSelectedWeatherLocation(normalized);
    setLocationState(normalized);
  }, []);

  const setCartItems = useCallback(
    (nextItems: React.SetStateAction<CartItem[]>) => {
      setCartItemsState(nextItems);
    },
    []
  );

  const setDiagnosis = useCallback((nextDiagnosis: ActiveDiagnosis | null) => {
    setDiagnosisState(nextDiagnosis);
  }, []);

  const toggleDiagnosisCureStep = useCallback((stepKey: string) => {
    setDiagnosisState((current) => {
      if (!current) return current;

      const checkedCureSteps = current.checkedCureSteps.includes(stepKey)
        ? current.checkedCureSteps.filter((key) => key !== stepKey)
        : [...current.checkedCureSteps, stepKey];

      return { ...current, checkedCureSteps };
    });
  }, []);

  const setPlots = useCallback((nextPlots: React.SetStateAction<FarmPlot[]>) => {
    setPlotsState(nextPlots);
  }, []);

  const togglePlotValve = useCallback((plotId: string) => {
    setPlotsState((current) =>
      current.map((plot) => {
        if (plot.id !== plotId) return plot;

        const valveOpen = !plot.valveOpen;

        return {
          ...plot,
          valveOpen,
          flowLpm: valveOpen ? Math.max(plot.flowLpm, 35) : 0,
        };
      })
    );
  }, []);

  const value = useMemo<FarmContextValue>(
    () => ({
      language,
      setLanguage,
      location,
      setLocation,
      cartItems,
      setCartItems,
      diagnosis,
      setDiagnosis,
      toggleDiagnosisCureStep,
      plots,
      setPlots,
      togglePlotValve,
      isHydrated,
    }),
    [
      language,
      setLanguage,
      location,
      setLocation,
      cartItems,
      setCartItems,
      diagnosis,
      setDiagnosis,
      toggleDiagnosisCureStep,
      plots,
      setPlots,
      togglePlotValve,
      isHydrated,
    ]
  );

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
}

export function useFarm(): FarmContextValue {
  const context = useContext(FarmContext);

  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider.');
  }

  return context;
}
