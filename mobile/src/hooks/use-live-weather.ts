import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import {
  createOfflineWeather,
  fetchLiveWeatherTelemetry,
  getCity,
  isAbortError,
  isNetworkWeatherError,
  type City,
  type CityId,
  type LiveWeather,
} from '@/services/weatherIrrigationAgent';
import {
  getSelectedWeatherLocation,
  setSelectedWeatherLocation,
  subscribeToSelectedWeatherLocation,
} from '@/services/weather-location-store';

type LoadMode = 'initial' | 'switch' | 'refresh';

export interface LiveWeatherController {
  city: City;
  location: City;
  cityId: CityId;
  weather: LiveWeather | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  isOffline: boolean;
  selectLocation: (location: City) => void;
  selectCity: (cityId: CityId) => void;
  refresh: () => void;
}

export function useLiveWeather(): LiveWeatherController {
  const city = useSyncExternalStore(
    subscribeToSelectedWeatherLocation,
    getSelectedWeatherLocation,
    getSelectedWeatherLocation
  );
  const [weather, setWeather] = useState<LiveWeather | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const hasLoadedRef = useRef(false);

  const load = useCallback(
    async (targetCity: City, mode: LoadMode) => {
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;

      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      if (mode === 'switch') {
        setWeather(null);
        setLoading(true);
        setRefreshing(false);
      } else if (mode === 'refresh') {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, 15000);

      try {
        const liveWeather = await fetchLiveWeatherTelemetry(
          {
            id: targetCity.id,
            name: targetCity.name,
            state: targetCity.state,
            district: targetCity.district,
            lat: targetCity.latitude,
            lon: targetCity.longitude,
            elevation: targetCity.elevationM,
            area: targetCity.area,
            displayName: targetCity.displayName,
            isGpsDetected: targetCity.isGpsDetected,
          },
          controller.signal
        );

        if (requestId !== requestRef.current) return;

        setWeather(liveWeather);
        setError(null);
      } catch (caught) {
        if (requestId !== requestRef.current) return;

        if (isAbortError(caught) && !timedOut) {
          return;
        }

        const networkFailure =
          timedOut || isNetworkWeatherError(caught);

        if (networkFailure && mode !== 'refresh') {
          setWeather(createOfflineWeather(targetCity));
          setError(
            'No internet connection. Showing an offline demo snapshot. Reconnect and refresh for live telemetry.'
          );
        } else if (networkFailure) {
          setError(
            'Live refresh failed. Showing the last telemetry snapshot.'
          );
        } else {
          setError(
            caught instanceof Error
              ? caught.message
              : 'Live telemetry could not be loaded.'
          );
        }
      } finally {
        clearTimeout(timeoutId);

        if (requestId === requestRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const mode: LoadMode = hasLoadedRef.current
      ? 'switch'
      : 'initial';
    hasLoadedRef.current = true;
    void load(city, mode);
  }, [city, load]);

  useEffect(() => {
    return () => {
      requestRef.current += 1;
      abortRef.current?.abort();
    };
  }, []);

  const selectLocation = useCallback(
    (nextLocation: City) => {
      const current = getSelectedWeatherLocation();

      if (
        current.id === nextLocation.id &&
        current.latitude === nextLocation.latitude &&
        current.longitude === nextLocation.longitude
      ) {
        void load(nextLocation, 'refresh');
        return;
      }

      setSelectedWeatherLocation(nextLocation);
    },
    [load]
  );

  const selectCity = useCallback(
    (nextCityId: CityId) => {
      selectLocation(getCity(nextCityId));
    },
    [selectLocation]
  );

  const refresh = useCallback(() => {
    void load(city, 'refresh');
  }, [city, load]);

  return {
    city,
    location: city,
    cityId: city.id,
    weather,
    loading,
    refreshing,
    error,
    isOffline: weather?.source === 'offline',
    selectLocation,
    selectCity,
    refresh,
  };
}
