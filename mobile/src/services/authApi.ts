import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface RegisterPayload {
  fullName: string;
  phone: string;
  email: string;
  identifier?: string;
  password: string;
  confirmPassword?: string;
  role: 'farmer' | 'admin';
  district?: string;
  farmSizeAcres?: number;
  primaryCrop?: string;
  department?: string;
  adminCode?: string;
}

export interface LoginPayload {
  identifier: string; // can be 10-digit phone or email
  password: string;
  role: 'farmer' | 'admin';
  adminCode?: string;
}

export interface NotificationReceipt {
  smsSent: boolean;
  emailSent: boolean;
  phone: string;
  email: string;
  emailPreviewUrl?: string;
}

export interface AuthBackendUser {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  identifier: string;
  role: 'farmer' | 'admin';
  district: string;
  farmSizeAcres?: number;
  primaryCrop?: string;
  kisanId?: string;
  department?: string;
  createdAt?: string;
}

export interface AuthApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  token?: string;
  user?: AuthBackendUser;
  notifications?: NotificationReceipt;
  isNetworkError?: boolean;
}

/**
 * Resolves the backend base URL dynamically across Expo Web, Expo Go LAN,
 * Android Emulator, and iOS Simulator.
 */
export function resolveBackendBaseUrl(): string {
  // 1. Explicit environment variable if configured
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  // 2. Web browser: Connect to same host on port 5000
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.location.hostname
  ) {
    return `http://${window.location.hostname}:5000`;
  }

  // 3. Expo Go on physical device or LAN
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  if (host && host !== 'localhost') {
    return `http://${host}:5000`;
  }

  // 4. Android emulator loopback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  // 5. Default local fallback
  return 'http://localhost:5000';
}

/**
 * Registers a new user into the MongoDB Atlas database (aggentic_future_farming.users)
 */
export async function registerUser(payload: RegisterPayload): Promise<AuthApiResponse> {
  const baseUrl = resolveBackendBaseUrl();
  const url = `${baseUrl}/api/auth/register`;

  console.log(
    `[Auth API] Dispatching registration to MongoDB Atlas at: ${url} (User: "${payload.fullName}", ID: "${payload.identifier}", Role: ${payload.role})`
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      console.log(
        `[Auth API] Registration confirmed in MongoDB Atlas for: "${payload.fullName}" (Mongo ID: ${data.user?.id})`
      );
      return {
        success: true,
        message: data.message,
        token: data.token,
        user: data.user,
        notifications: data.notifications,
      };
    }

    const errorMessage =
      data?.message ||
      data?.error ||
      `Registration rejected by server (Status: ${response.status})`;

    console.warn(
      `[Auth API] Server rejected registration (HTTP ${response.status}): ${errorMessage}`
    );

    return {
      success: false,
      error: errorMessage,
      isNetworkError: false,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    const isAbort = error.name === 'AbortError';
    const errorMsg = isAbort
      ? 'Connection timed out while contacting authentication server.'
      : error.message || 'Unable to connect to authentication server.';

    console.warn(`[Auth API Warning] Network error contacting ${url}:`, errorMsg);

    return {
      success: false,
      error: errorMsg,
      isNetworkError: true,
    };
  }
}

/**
 * Authenticates user credentials against MongoDB Atlas
 */
export async function loginUser(payload: LoginPayload): Promise<AuthApiResponse> {
  const baseUrl = resolveBackendBaseUrl();
  const url = `${baseUrl}/api/auth/login`;

  console.log(
    `[Auth API] Dispatching login request to MongoDB Atlas at: ${url} (ID: "${payload.identifier}", Role: ${payload.role})`
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      console.log(
        `[Auth API] Login succeeded for: "${data.user?.fullName}" (${data.user?.identifier})`
      );
      return {
        success: true,
        message: data.message,
        token: data.token,
        user: data.user,
      };
    }

    const errorMessage =
      data?.message ||
      data?.error ||
      `Authentication failed (HTTP ${response.status})`;

    console.warn(
      `[Auth API] Server rejected login (HTTP ${response.status}): ${errorMessage}`
    );

    return {
      success: false,
      error: errorMessage,
      isNetworkError: false,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    const isAbort = error.name === 'AbortError';
    const errorMsg = isAbort
      ? 'Connection timed out while contacting authentication server.'
      : error.message || 'Unable to connect to authentication server.';

    console.warn(`[Auth API Warning] Network error contacting ${url}:`, errorMsg);

    return {
      success: false,
      error: errorMsg,
      isNetworkError: true,
    };
  }
}

/**
 * Checks if the backend database subsystem is healthy and connected to MongoDB Atlas
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  database: string;
}> {
  try {
    const baseUrl = resolveBackendBaseUrl();
    const response = await fetch(`${baseUrl}/api/auth/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (response.ok) {
      const data = await response.json();
      return {
        healthy: data.status === 'healthy',
        database: data.database || 'unknown',
      };
    }
  } catch {
    // Backend unreachable
  }
  return { healthy: false, database: 'disconnected' };
}
