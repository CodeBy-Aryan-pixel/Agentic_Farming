import { router, type Href } from 'expo-router';

export const HOME_ROUTE = '/' as unknown as Href;
export const CROP_DOCTOR_ROUTE = '/crop-doctor' as unknown as Href;
export const AGRI_SHOP_ROUTE = '/agri-shop' as unknown as Href;
export const AGRI_SHOP_CART_ROUTE = '/agri-shop/cart' as unknown as Href;
export const GOVT_SCHEMES_ROUTE = '/govt-schemes' as unknown as Href;
export const AI_ASSISTANT_ROUTE = '/ai-assistant' as unknown as Href;
export const MARKET_ADVISOR_ROUTE = '/market-advisor' as unknown as Href;
export const FPO_MARKET_ROUTE = '/fpo-market' as unknown as Href;
export const FPO_CREATE_LISTING_ROUTE = '/fpo-market/create-listing' as unknown as Href;
export const WEATHER_IRRIGATION_ROUTE = '/weather-irrigation' as unknown as Href;
export const FIELD_MONITOR_ROUTE = '/field-monitor' as unknown as Href;
export const CROP_ADVISOR_ROUTE = '/crop-advisor' as unknown as Href;
export const DASHBOARD_ROUTE = '/dashboard' as unknown as Href;
export const AUTH_ROUTE = '/auth' as unknown as Href;
export const ADMIN_ROUTE = '/admin' as unknown as Href;
export const GUIDE_ROUTE = '/guide' as unknown as Href;

export function govtSchemeRoute(schemeId: string): Href {
  return {
    pathname: '/govt-schemes/[id]',
    params: { id: schemeId },
  } as unknown as Href;
}

export interface AgriShopRouteParams {
  disease?: string;
  crop?: string;
  severity?: string;
  confidence?: string;
  products?: string;
  quantities?: string;
  kit?: string;
}

export function agriShopRoute(
  params?: AgriShopRouteParams
): Href {
  return {
    pathname: '/agri-shop',
    params,
  } as unknown as Href;
}

export function safeGoBack(fallback: Href = HOME_ROUTE): void {
  if (router.canGoBack()) {
    try {
      router.back();
      return;
    } catch {
      router.replace(fallback);
      return;
    }
  }

  router.replace(fallback);
}
