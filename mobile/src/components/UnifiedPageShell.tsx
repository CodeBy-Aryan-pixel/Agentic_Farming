import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { router, usePathname, type Href } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';

import {
  HOME_ROUTE,
  DASHBOARD_ROUTE,
  CROP_DOCTOR_ROUTE,
  WEATHER_IRRIGATION_ROUTE,
  MARKET_ADVISOR_ROUTE,
  AGRI_SHOP_ROUTE,
  AI_ASSISTANT_ROUTE,
  AUTH_ROUTE,
  ADMIN_ROUTE,
  GUIDE_ROUTE,
  safeGoBack,
} from '@/utils/navigation';
import { useFarm } from '@/context/FarmContext';
import { useAuth } from '@/context/AuthContext';
import { useLiveWeather } from '@/hooks/use-live-weather';

/* ─── Unified Surface Palette (Apple Health / Homepage Clean System) ── */
export const PALETTE = {
  bgPage: '#F7F9F7',
  cardBg: '#FFFFFF',
  border: '#E6ECE6',
  brandDark: '#0F291E',
  brandEmerald: '#15803D',
  sageTint: '#EDF5EE',
  pillBg: '#F3F4F6',
  pillText: '#374151',
  textPrimary: '#111827',
  textMuted: '#6B7280',
  textSubtle: '#9CA3AF',
  amberTint: '#FEF3C7',
  amberText: '#92400E',
  redTint: '#FEE2E2',
  redText: '#991B1B',
  blueTint: '#E0F2FE',
  blueText: '#0369A1',
};

interface NavItem {
  label: string;
  href: Href;
  path: string;
  icon?: React.ComponentProps<typeof Feather>['name'];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: HOME_ROUTE, path: '/' },
  { label: 'Dashboard', href: DASHBOARD_ROUTE, path: '/dashboard' },
  { label: 'Crop Doctor', href: CROP_DOCTOR_ROUTE, path: '/crop-doctor' },
  {
    label: 'Irrigation',
    href: WEATHER_IRRIGATION_ROUTE,
    path: '/weather-irrigation',
  },
  { label: 'Markets', href: MARKET_ADVISOR_ROUTE, path: '/market-advisor' },
  { label: 'Agri-Shop', href: AGRI_SHOP_ROUTE, path: '/agri-shop' },
  { label: 'How to Use', href: GUIDE_ROUTE, path: '/guide', icon: 'book-open' },
  { label: 'Admin Monitor', href: ADMIN_ROUTE, path: '/admin' },
];

/* ─── Top Universal Sticky Navbar ────────────────────────────────────── */
export function UnifiedTopNavbar({
  cityOverride,
}: {
  cityOverride?: string;
}) {
  const { width } = useWindowDimensions();
  const isCompact = width < 960;
  const isNarrow = width < 620;
  const pathname = usePathname();
  const { city } = useLiveWeather();
  const { language, isHydrated } = useFarm();
  const { user, logout } = useAuth();
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const displayLocation =
    cityOverride || (city?.shortName ? `${city.shortName}, MH` : 'Kolhapur, MH');
  const languageOptions = [
    { id: 'en' as const, label: 'EN' },
    { id: 'mr' as const, label: 'मराठी' },
    { id: 'hi' as const, label: 'हिं' },
  ];

  // STRICT SAFETY: Do NOT render navbar when user is logged out or on /auth
  if (!user || pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <View style={styles.navbarRoot}>
      <View style={styles.navbarInner}>
        {/* Left: Brand Sprout Vector + Future Farming */}
        <Pressable
          style={styles.brandGroup}
          onPress={() => router.push(HOME_ROUTE)}
          accessibilityRole="button"
          accessibilityLabel="Future Farming Home"
        >
          <View style={styles.brandRow}>
            <View style={styles.sproutBox}>
              <Feather
                name="feather"
                size={20}
                color={PALETTE.brandEmerald}
              />
            </View>
            <Text style={styles.brandName}>Future Farming</Text>
          </View>
        </Pressable>

        {/* Center: Clean Text Navigation Tabs (Desktop Viewports) */}
        {!isCompact && (
          <View style={styles.centerTabsRow}>
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.path === '/'
                  ? pathname === '/' ||
                    pathname === '' ||
                    pathname === '/(tabs)' ||
                    pathname === '/(tabs)/'
                  : pathname.startsWith(item.path);

              return (
                <Pressable
                  key={item.path}
                  onPress={() => router.push(item.href)}
                  style={({ pressed }) => [
                    styles.tabPressable,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Navigate to ${item.label}`}
                >
                  <View
                    style={[
                      styles.tabPill,
                      isActive ? styles.tabPillActive : styles.tabPillInactive,
                      item.icon ? { flexDirection: 'row', alignItems: 'center', gap: 6 } : null,
                    ]}
                  >
                    {item.icon ? (
                      <Feather
                        name={item.icon}
                        size={13}
                        color={isActive ? '#FFFFFF' : PALETTE.brandEmerald}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.tabText,
                        isActive ? styles.tabTextActive : styles.tabTextInactive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Right: Local Cache + Synced Location + Language Pill + User Account Pill */}
        <View style={styles.rightControls}>
          <View
            style={styles.cachePill}
            accessibilityLabel={
              isHydrated
                ? 'Saved to local cache'
                : 'Restoring local cache'
            }
          >
            {isHydrated ? (
              <Feather
                name="check-circle"
                size={12}
                color={PALETTE.brandEmerald}
              />
            ) : (
              <ActivityIndicator
                size="small"
                color={PALETTE.brandEmerald}
              />
            )}
            {!isNarrow ? (
              <Text style={styles.cachePillText}>
                {isHydrated ? 'Saved to local cache' : 'Restoring cache'}
              </Text>
            ) : null}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.locationPill,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push(WEATHER_IRRIGATION_ROUTE)}
            accessibilityRole="button"
            accessibilityLabel={`Location: ${displayLocation}`}
          >
            <Feather name="map-pin" size={13} color={PALETTE.brandEmerald} />
            <Text style={styles.locationPillText} numberOfLines={1}>
              {displayLocation}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.langPill,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push(AI_ASSISTANT_ROUTE)}
            accessibilityRole="button"
            accessibilityLabel="Language options"
          >
            {languageOptions.map((option, index) => (
              <React.Fragment key={option.id}>
                {index > 0 ? (
                  <Text style={styles.langDivider}>|</Text>
                ) : null}
                <Text
                  style={[
                    styles.langPillText,
                    language === option.id && styles.langPillTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </React.Fragment>
            ))}
          </Pressable>

          {/* Active User Profile Pill */}
          <Pressable
            style={({ pressed }) => [
              styles.authPill,
              styles.activeUserPill,
              pressed && styles.pressed,
            ]}
            onPress={() => {
              if (!user) {
                router.push(AUTH_ROUTE);
              } else {
                setAccountModalOpen(true);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={user ? `Account: ${user.fullName}` : 'Sign In / Register'}
          >
            <Feather
              name={!user ? 'log-in' : user.role === 'admin' ? 'shield' : 'user'}
              size={13}
              color={PALETTE.brandEmerald}
            />
            <Text style={styles.activeUserPillText} numberOfLines={1}>
              {!user
                ? isNarrow
                  ? 'Login'
                  : 'Sign In / Register'
                : `${isNarrow ? user.fullName.split(' ')[0] : user.fullName} • ${user.role.toUpperCase()}`}
            </Text>
          </Pressable>

          {/* Quick Admin Portal Jump Button (if Admin and not already on /admin) */}
          {user?.role === 'admin' && !pathname.startsWith('/admin') ? (
            <Pressable
              style={({ pressed }) => [
                styles.adminPortalQuickBtn,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push(ADMIN_ROUTE)}
              accessibilityRole="button"
              accessibilityLabel="Admin Portal"
            >
              <Feather name="activity" size={13} color={PALETTE.brandEmerald} />
              {!isNarrow ? (
                <Text style={styles.adminPortalQuickText}>Admin Portal</Text>
              ) : null}
            </Pressable>
          ) : null}

          {/* Dedicated High-Contrast Working Logout Button */}
          {user ? (
            <Pressable
              style={({ pressed }) => [
                styles.logoutHeaderBtn,
                pressed && styles.pressed,
              ]}
              onPress={async () => {
                await logout();
                router.replace(AUTH_ROUTE);
              }}
              accessibilityRole="button"
              accessibilityLabel="Log Out"
            >
              <Feather name="log-out" size={13} color="#B91C1C" />
              {!isNarrow ? (
                <Text style={styles.logoutHeaderBtnText}>Logout</Text>
              ) : null}
            </Pressable>
          ) : null}
        </View>

        {/* User Account Interactive Dropdown Modal */}
        <Modal
          visible={accountModalOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setAccountModalOpen(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setAccountModalOpen(false)}
          >
            <Pressable
              style={styles.accountModalCard}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalUserIconBox}>
                  <Feather
                    name={user?.role === 'admin' ? 'shield' : 'user'}
                    size={18}
                    color={PALETTE.brandEmerald}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalUserName}>{user?.fullName}</Text>
                  <Text style={styles.modalUserRole}>
                    {user?.role === 'admin'
                      ? 'Agricultural Admin Officer'
                      : 'Verified Farmer'}
                  </Text>
                </View>
                <Pressable
                  style={styles.modalCloseBtn}
                  onPress={() => setAccountModalOpen(false)}
                >
                  <Feather name="x" size={16} color={PALETTE.textMuted} />
                </Pressable>
              </View>

              <View style={styles.modalDetailsBox}>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Contact:</Text>
                  <Text style={styles.modalDetailVal}>{user?.phoneOrEmail}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>District:</Text>
                  <Text style={styles.modalDetailVal}>{user?.district}</Text>
                </View>
                {user?.role === 'farmer' ? (
                  <>
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Kisan ID:</Text>
                      <Text style={[styles.modalDetailVal, styles.tabularNums]}>
                        {user?.kisanId || 'MH-KOL-2026-8841'}
                      </Text>
                    </View>
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Acreage & Crop:</Text>
                      <Text style={styles.modalDetailVal}>
                        {user?.farmSizeAcres ?? 5.0} Acres • {user?.primaryCrop || 'Sugarcane'}
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Department:</Text>
                    <Text style={styles.modalDetailVal}>
                      {user?.department || 'District Pathology Command'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.modalActionsCol}>
                {user?.role === 'farmer' ? (
                  <TouchableOpacity
                    style={styles.modalSwitchRoleBtn}
                    onPress={() => {
                      setAccountModalOpen(false);
                      router.push(ADMIN_ROUTE);
                    }}
                  >
                    <Feather name="shield" size={14} color="#15803D" />
                    <Text style={styles.modalSwitchRoleText}>
                      Open Admin Command Center
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.modalSwitchRoleBtn}
                    onPress={() => {
                      setAccountModalOpen(false);
                      router.push(HOME_ROUTE);
                    }}
                  >
                    <Feather name="home" size={14} color="#15803D" />
                    <Text style={styles.modalSwitchRoleText}>
                      Switch to Farmer Dashboard
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.modalManageBtn}
                  onPress={() => {
                    setAccountModalOpen(false);
                    router.push(AUTH_ROUTE);
                  }}
                >
                  <Feather name="refresh-cw" size={14} color={PALETTE.textPrimary} />
                  <Text style={styles.modalManageText}>
                    Switch / Register Another Account
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalLogoutBtn}
                  onPress={async () => {
                    setAccountModalOpen(false);
                    await logout();
                    router.replace(AUTH_ROUTE);
                  }}
                >
                  <Feather name="log-out" size={14} color="#DC2626" />
                  <Text style={styles.modalLogoutText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>

      {/* Mobile / Tablet Compact Secondary Scrollable Navigation Row */}
      {isCompact && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactScrollRow}
        >
          {NAV_ITEMS.map((item) => {
              const isActive =
                item.path === '/'
                  ? pathname === '/' ||
                    pathname === '' ||
                    pathname === '/(tabs)' ||
                    pathname === '/(tabs)/'
                  : pathname.startsWith(item.path);

              return (
                <Pressable
                  key={`compact-${item.path}`}
                  onPress={() => router.push(item.href)}
                style={({ pressed }) => [
                  styles.tabPressable,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Navigate to ${item.label}`}
              >
                <View
                  style={[
                    styles.tabPill,
                    isActive ? styles.tabPillActive : styles.tabPillInactive,
                    item.icon ? { flexDirection: 'row', alignItems: 'center', gap: 6 } : null,
                  ]}
                >
                  {item.icon ? (
                    <Feather
                      name={item.icon}
                      size={13}
                      color={isActive ? '#FFFFFF' : PALETTE.brandEmerald}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.tabText,
                      isActive ? styles.tabTextActive : styles.tabTextInactive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

/* ─── Sub-Page Header Strip (for Feature Pages) ──────────────────────── */
export function SubPageHeaderStrip({
  title,
  subtitle,
  statusText,
  statusPill,
  backLabel = 'Back to Home',
  onBack,
  rightAction,
}: {
  title: string;
  subtitle?: string;
  statusText?: string;
  statusPill?: React.ReactNode;
  backLabel?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      safeGoBack(HOME_ROUTE);
    }
  };

  // STRICT SAFETY: Do NOT render subheader when user is logged out or on /auth
  if (!user || pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <View style={styles.subHeaderRoot}>
      <View style={styles.subHeaderInner}>
        <View style={styles.subHeaderLeft}>
          <TouchableOpacity
            style={styles.backLink}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
          >
            <Feather name="arrow-left" size={14} color={PALETTE.pillText} />
            <Text style={styles.backLinkText}>{backLabel}</Text>
          </TouchableOpacity>

          <Text style={styles.subHeaderTitle}>{title}</Text>
          {subtitle ? (
            <Text style={styles.subHeaderSubtitle}>{subtitle}</Text>
          ) : null}
        </View>

        <View style={styles.subHeaderRight}>
          {rightAction}
          {statusPill ? (
            statusPill
          ) : statusText ? (
            <View style={styles.statusPill}>
              <View style={styles.statusPillDot} />
              <Text style={styles.statusPillText}>{statusText}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/* ─── Unified Page Shell Component ───────────────────────────────────── */
export interface UnifiedPageShellProps {
  children: React.ReactNode;
  activeRoute?: string;
  title?: string;
  subtitle?: string;
  statusText?: string;
  statusPillText?: string;
  statusPill?: React.ReactNode;
  backLabel?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showSubHeader?: boolean;
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement;
  cityOverride?: string;
}

export default function UnifiedPageShell({
  children,
  activeRoute,
  title,
  subtitle,
  statusText,
  statusPillText,
  statusPill,
  backLabel,
  onBack,
  rightAction,
  showSubHeader = true,
  scrollable = true,
  contentContainerStyle,
  style,
  refreshControl,
  cityOverride,
}: UnifiedPageShellProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const effectiveStatusText = statusText ?? statusPillText;
  const hasSubHeader = showSubHeader && Boolean(title) && Boolean(user) && !pathname.startsWith('/auth');

  return (
    <SafeAreaView style={[styles.shellRoot, style]}>
      <StatusBar barStyle="dark-content" />

      {/* Sticky Universal Top Navbar */}
      <UnifiedTopNavbar cityOverride={cityOverride} />

      {/* Optional Sub-Page Header Strip */}
      {hasSubHeader && title ? (
        <SubPageHeaderStrip
          title={title}
          subtitle={subtitle}
          statusText={effectiveStatusText}
          statusPill={statusPill}
          backLabel={backLabel}
          onBack={onBack}
          rightAction={rightAction}
        />
      ) : null}

      {/* Page Content Body */}
      {scrollable ? (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fillArea, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export { UnifiedPageShell };

const styles = StyleSheet.create({
  shellRoot: {
    flex: 1,
    backgroundColor: PALETTE.bgPage,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  fillArea: {
    flex: 1,
  },

  /* Navbar Styles */
  navbarRoot: {
    width: '100%',
    backgroundColor: PALETTE.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
    zIndex: 1000,
    elevation: 2,
    shadowColor: '#102A13',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  navbarInner: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sproutBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: PALETTE.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.brandDark,
    letterSpacing: -0.3,
  },
  centerTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabPressable: {},
  tabPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  tabPillActive: {
    backgroundColor: PALETTE.sageTint,
  },
  tabPillInactive: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  tabTextActive: {
    color: PALETTE.brandDark,
    fontWeight: '700',
  },
  tabTextInactive: {
    color: '#4B5563',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  cachePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: PALETTE.sageTint,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cachePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.brandEmerald,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PALETTE.pillBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  locationPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.pillText,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PALETTE.pillBg,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.pillText,
    letterSpacing: 0.3,
  },
  langPillTextActive: {
    color: PALETTE.brandEmerald,
    fontWeight: '800',
  },
  langDivider: {
    fontSize: 11,
    color: PALETTE.textSubtle,
  },
  compactScrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  pressed: {
    opacity: 0.75,
  },

  /* Sub-Page Header Strip */
  subHeaderRoot: {
    width: '100%',
    backgroundColor: PALETTE.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  subHeaderInner: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 16,
    flexWrap: 'wrap',
  },
  subHeaderLeft: {
    flex: 1,
    minWidth: 240,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  backLinkText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.pillText,
  },
  subHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: PALETTE.brandDark,
    letterSpacing: -0.4,
  },
  subHeaderSubtitle: {
    fontSize: 13.5,
    color: PALETTE.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  subHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PALETTE.pillBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PALETTE.brandEmerald,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.pillText,
    letterSpacing: 0.2,
  },

  /* Auth User Pill */
  authPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeUserPill: {
    backgroundColor: '#EDF5EE',
    borderWidth: 1,
    borderColor: '#C6E2CD',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeUserPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F291E',
  },
  adminPortalQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDF5EE',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  adminPortalQuickText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.brandEmerald,
  },
  logoutHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  authPillLoggedOut: {
    backgroundColor: PALETTE.brandDark,
  },
  authPillFarmer: {
    backgroundColor: PALETTE.pillBg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  authPillAdmin: {
    backgroundColor: PALETTE.sageTint,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  authPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  authPillTextLoggedOut: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  authPillTextFarmer: {
    color: PALETTE.brandDark,
    fontWeight: '600',
  },
  authPillTextAdmin: {
    color: PALETTE.brandEmerald,
    fontWeight: '700',
  },

  /* Account Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accountModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 24,
    gap: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalUserIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textPrimary,
  },
  modalUserRole: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.brandEmerald,
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalDetailsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    gap: 8,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalDetailLabel: {
    fontSize: 12,
    color: PALETTE.textMuted,
    fontWeight: '600',
  },
  modalDetailVal: {
    fontSize: 12.5,
    color: PALETTE.textPrimary,
    fontWeight: '700',
  },
  modalActionsCol: {
    gap: 10,
    marginTop: 4,
  },
  modalSwitchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PALETTE.sageTint,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalSwitchRoleText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.brandEmerald,
  },
  modalManageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PALETTE.pillBg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalManageText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textPrimary,
  },
  modalLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalLogoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  tabularNums: {
    fontVariant: ['tabular-nums'],
  },
});
