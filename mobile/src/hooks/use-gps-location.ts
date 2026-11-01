import { useCallback, useEffect, useState } from 'react';

import {
  detectCurrentFarmLocation,
  detectedFarmLocationToCity,
  type City,
} from '@/services/weatherIrrigationAgent';

export interface GpsLocationController {
  detecting: boolean;
  message: string | null;
  isGpsDetected: boolean | null;
  detect: () => Promise<void>;
}

export function useGpsLocation(
  onDetected: (location: City) => void
): GpsLocationController {
  const [detecting, setDetecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isGpsDetected, setIsGpsDetected] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => setMessage(null), 8000);

    return () => clearTimeout(timer);
  }, [message]);

  const detect = useCallback(async () => {
    if (detecting) return;

    setDetecting(true);
    setMessage(null);

    try {
      const detected = await detectCurrentFarmLocation();
      const areaCityLabel = detected.area
        ? `${detected.area}, ${detected.city}`
        : detected.city;

      onDetected(detectedFarmLocationToCity(detected));
      setIsGpsDetected(detected.isGpsDetected);
      setMessage(
        detected.isGpsDetected
          ? `GPS locked: ${areaCityLabel} (${detected.lat.toFixed(4)}°N, ${detected.lon.toFixed(4)}°E) • Field telemetry updated.`
          : detected.source === 'ip'
            ? `GPS unavailable. Using approximate IP location: ${areaCityLabel}.`
            : 'GPS unavailable. Using the default farm location.'
      );
    } catch (caught) {
      setIsGpsDetected(false);
      setMessage(
        caught instanceof Error
          ? caught.message
          : 'Location detection failed. Please try again.'
      );
    } finally {
      setDetecting(false);
    }
  }, [detecting, onDetected]);

  return {
    detecting,
    message,
    isGpsDetected,
    detect,
  };
}
