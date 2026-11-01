import { Alert, Linking, Platform } from 'react-native';
import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from 'expo-web-browser';

export function getPortalDomain(url: string): string {
  return url
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .replace(/^www\./i, '');
}

export async function openOfficialPortal(url: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      const webWindow = globalThis as unknown as {
        open?: (
          targetUrl: string,
          target?: string,
          features?: string
        ) => unknown;
      };

      if (webWindow.open) {
        webWindow.open(url, '_blank', 'noopener,noreferrer');
        return;
      }

      await Linking.openURL(url);
      return;
    }

    await openBrowserAsync(url, {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  } catch {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'Unable to open portal',
        `Please open ${getPortalDomain(url)} manually in your browser.`
      );
    }
  }
}
