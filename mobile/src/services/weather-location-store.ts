import {
  DEFAULT_WEATHER_LOCATION,
  type City,
} from '@/services/weatherIrrigationAgent';

let selectedLocation: City = DEFAULT_WEATHER_LOCATION;
const listeners = new Set<() => void>();

export function getSelectedWeatherLocation(): City {
  return selectedLocation;
}

export function setSelectedWeatherLocation(
  location: City
): void {
  if (
    selectedLocation.id === location.id &&
    selectedLocation.latitude === location.latitude &&
    selectedLocation.longitude === location.longitude
  ) {
    return;
  }

  selectedLocation = location;
  listeners.forEach((listener) => listener());
}

export function subscribeToSelectedWeatherLocation(
  listener: () => void
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
