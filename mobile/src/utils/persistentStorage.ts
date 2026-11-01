import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const memoryFallback: Record<string, string> = {};

function getWebStorage(): Storage | null {
  if (Platform.OS !== 'web') return null;

  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    return window.localStorage;
  } catch {
    return null;
  }
}

export const persistentStorage = {
  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const webStorage = getWebStorage();

      if (webStorage) {
        const raw = webStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : defaultValue;
      }

      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) return JSON.parse(raw) as T;
      } catch {
        // Fall through to the in-memory store.
      }

      const raw = memoryFallback[key];
      return raw ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const webStorage = getWebStorage();

      if (webStorage) {
        webStorage.setItem(key, serialized);
        return;
      }

      memoryFallback[key] = serialized;

      try {
        await AsyncStorage.setItem(key, serialized);
      } catch {
        // The memory fallback keeps the current session functional.
      }
    } catch {
      // Ignore storage quota errors
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      delete memoryFallback[key];

      const webStorage = getWebStorage();

      if (webStorage) {
        webStorage.removeItem(key);
        return;
      }

      try {
        await AsyncStorage.removeItem(key);
      } catch {
        // Ignore errors
      }
    } catch {
      // Ignore errors
    }
  },
};
