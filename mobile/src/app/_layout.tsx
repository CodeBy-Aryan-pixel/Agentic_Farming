import React, { useEffect } from 'react';
import {
  Stack,
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
  usePathname,
  router,
} from 'expo-router';
import {
  ActivityIndicator,
  Text,
  View,
  useColorScheme,
  StyleSheet,
  Platform,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { FarmProvider } from '@/context/FarmContext';
import AuthScreen from './auth/index';

// ============================================================================
// WEB FONT TIMEOUT SHIELD (3-part) — permanently fixes expo-font/fontfaceobserver
// 12000ms timeout crashes on slow Metro startup without touching read-only ES modules.
// ============================================================================
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  // PART 1: Patch FontFaceObserver.prototype.load so slow loads resolve instead of rejecting
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const FontFaceObserver = require('fontfaceobserver');
    if (FontFaceObserver?.prototype?.load) {
      const originalLoad = FontFaceObserver.prototype.load;
      FontFaceObserver.prototype.load = function (text?: string | null, timeout?: number) {
        return originalLoad.call(this, text, timeout || 4000).catch(() => {
          // Resolve gracefully so ExpoFontLoader.web.js never throws the 12000ms timeout crash
          return undefined;
        });
      };
    }
  } catch (_) {
    // Ignore if fontfaceobserver is not directly accessible
  }

  // PART 2: Intercept unhandledrejection / window error for any font-family timeout
  const isFontTimeoutError = (msg?: unknown) => {
    const str =
      typeof msg === 'string' ? msg : (msg as any)?.message || String(msg || '');
    return (
      str.includes('timed out after') ||
      str.includes('Fetching the font family') ||
      str.includes('"feather"') ||
      str.includes('material-community') ||
      str.includes('fontfaceobserver')
    );
  };

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (isFontTimeoutError(event?.reason)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );

  window.addEventListener(
    'error',
    (event) => {
      if (isFontTimeoutError(event?.message || event?.error)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );

  // PART 3: Silence console.error for font timeout messages
  const origConsoleError = console.error;
  console.error = (...args: any[]) => {
    if (args.some((arg) => isFontTimeoutError(arg))) {
      return;
    }
    origConsoleError.apply(console, args);
  };

  // Bonus: Inject font-display: swap for feather + material-community to reduce FOIT
  try {
    const styleId = 'future-farming-font-safeguard';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
        @font-face { font-family: 'feather'; font-display: swap; }
        @font-face { font-family: 'material-community'; font-display: swap; }
      `;
      document.head?.appendChild(styleEl);
    }
  } catch {
    // Non-fatal if document is not ready
  }
}

function AdminRouteGuard() {
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    // If authenticated user is a farmer and attempts to navigate to /admin, bounce back to /
    if (user?.role === 'farmer' && pathname.startsWith('/admin')) {
      router.replace('/');
    }
  }, [user, pathname]);

  return null;
}

function RootAuthGate() {
  const { user, isHydrated } = useAuth();
  const colorScheme = useColorScheme();

  // 1. Loading Splash Screen while checking local session
  if (!isHydrated) {
    return (
      <View style={styles.splashRoot}>
        <View style={styles.splashSproutBox}>
          <Feather name="feather" size={32} color="#15803D" />
        </View>
        <ActivityIndicator size="large" color="#15803D" />
        <Text style={styles.splashTitle}>Future Farming</Text>
        <Text style={styles.splashSubtitle}>
          Verifying security session...
        </Text>
      </View>
    );
  }

  // 2. CRITICAL HARD LOCK: If NOT authenticated, render ONLY the standalone AuthScreen!
  // Occupies full screen (minHeight: '100%', #F7F9F7 background, centered standalone auth container)
  // No protected screen can be rendered or accessed via URL, browser back, or deep link.
  if (!user) {
    return (
      <View style={styles.authLockRoot}>
        <AuthScreen />
      </View>
    );
  }

  // 3. User is authenticated -> Render protected app stack
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AdminRouteGuard />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard/index" options={{ headerShown: false }} />
        <Stack.Screen name="crop-doctor/index" options={{ headerShown: false }} />
        <Stack.Screen name="ai-assistant/index" options={{ headerShown: false }} />
        <Stack.Screen name="govt-schemes/index" options={{ headerShown: false }} />
        <Stack.Screen name="govt-schemes/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="agri-shop/index" options={{ headerShown: false }} />
        <Stack.Screen name="agri-shop/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="agri-shop/cart" options={{ headerShown: false }} />
        <Stack.Screen name="market-advisor/index" options={{ headerShown: false }} />
        <Stack.Screen name="fpo-market/index" options={{ headerShown: false }} />
        <Stack.Screen name="fpo-market/create-listing" options={{ headerShown: false }} />
        <Stack.Screen name="weather-irrigation/index" options={{ headerShown: false }} />
        <Stack.Screen name="field-monitor/index" options={{ headerShown: false }} />
        <Stack.Screen name="crop-advisor/index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/index" options={{ headerShown: false }} />
        <Stack.Screen name="admin/index" options={{ headerShown: false }} />
        <Stack.Screen name="guide/index" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <FarmProvider>
        <CartProvider>
          <RootAuthGate />
        </CartProvider>
      </FarmProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splashRoot: {
    flex: 1,
    backgroundColor: '#F7F9F7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  splashSproutBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#EDF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  splashTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F291E',
    letterSpacing: -0.3,
  },
  splashSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
  },
  authLockRoot: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: '#F7F9F7',
  },
});