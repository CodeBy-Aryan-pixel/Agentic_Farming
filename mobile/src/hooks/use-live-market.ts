import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  createSimulatedMarketSnapshot,
  fetchMarketSnapshot,
  getMarketCrop,
  getMarketMandi,
  type MarketCrop,
  type MarketCropId,
  type MarketMandi,
  type MarketMandiId,
  type MarketSnapshot,
} from '@/services/marketAgent';

type LoadMode = 'initial' | 'refresh';

export interface LiveMarketController {
  crop: MarketCrop;
  cropId: MarketCropId;
  mandi: MarketMandi;
  mandiId: MarketMandiId;
  snapshot: MarketSnapshot | null;
  loading: boolean;
  refreshing: boolean;
  warning: string | null;
  isSimulated: boolean;
  selectCrop: (cropId: MarketCropId) => void;
  selectMandi: (mandiId: MarketMandiId) => void;
  refresh: () => void;
}

export function useLiveMarket(
  initialCropId: MarketCropId = 'onion',
  initialMandiId: MarketMandiId = 'nashik'
): LiveMarketController {
  const [cropId, setCropId] =
    useState<MarketCropId>(initialCropId);
  const [mandiId, setMandiId] =
    useState<MarketMandiId>(initialMandiId);
  const [snapshot, setSnapshot] =
    useState<MarketSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (
      targetCropId: MarketCropId,
      targetMandiId: MarketMandiId,
      mode: LoadMode
    ) => {
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;

      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      if (mode === 'initial') {
        setSnapshot(null);
        setLoading(true);
        setRefreshing(false);
      } else {
        setRefreshing(true);
      }

      setWarning(null);

      try {
        const response = await fetchMarketSnapshot(
          targetCropId,
          targetMandiId,
          {
            forceWeather: mode === 'refresh',
            signal: controller.signal,
          }
        );

        if (requestId !== requestRef.current) return;

        setSnapshot(response.snapshot);
        setWarning(response.warning);
      } catch (caught) {
        if (requestId !== requestRef.current) return;

        setSnapshot(
          createSimulatedMarketSnapshot(
            targetCropId,
            targetMandiId
          )
        );
        setWarning(
          caught instanceof Error
            ? caught.message
            : 'Live mandi telemetry is unavailable. Showing a dynamic simulation.'
        );
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void load(cropId, mandiId, 'initial');
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [cropId, mandiId, load]);

  useEffect(() => {
    return () => {
      requestRef.current += 1;
      abortRef.current?.abort();
    };
  }, []);

  const selectCrop = useCallback(
    (nextCropId: MarketCropId) => {
      if (nextCropId === cropId) return;

      setSnapshot(null);
      setLoading(true);
      setWarning(null);
      setCropId(nextCropId);
    },
    [cropId]
  );

  const selectMandi = useCallback(
    (nextMandiId: MarketMandiId) => {
      if (nextMandiId === mandiId) return;

      setSnapshot(null);
      setLoading(true);
      setWarning(null);
      setMandiId(nextMandiId);
    },
    [mandiId]
  );

  const refresh = useCallback(() => {
    void load(cropId, mandiId, 'refresh');
  }, [cropId, load, mandiId]);

  return {
    crop: getMarketCrop(cropId),
    cropId,
    mandi: getMarketMandi(mandiId),
    mandiId,
    snapshot,
    loading,
    refreshing,
    warning,
    isSimulated: snapshot?.source === 'simulated',
    selectCrop,
    selectMandi,
    refresh,
  };
}
