import React, { type ComponentRef, type Ref } from 'react';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  type TabTriggerSlotProps,
  type TabListProps,
} from 'expo-router/ui';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useAuth } from '@/context/AuthContext';
import { AUTH_ROUTE, ADMIN_ROUTE } from '@/utils/navigation';

const BRAND_DARK = '#0F291E';
const BRAND_EMERALD = '#15803D';
const BORDER = '#E6ECE6';

export default function AppTabs() {
  return (
    <Tabs style={styles.webTabsRoot}>
      <TabList asChild>
        <CommandBarHeader />
      </TabList>
      <TabSlot style={styles.webTabSlot} />
    </Tabs>
  );
}

function NavPill({
  children,
  isFocused,
  ref,
  ...props
}: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      ref={ref as Ref<ComponentRef<typeof Pressable>>}
      style={({ pressed }) => [
        styles.navPillPressable,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.navPill,
          isFocused ? styles.navPillActive : styles.navPillInactive,
        ]}
      >
        <Text
          style={[
            styles.navPillText,
            isFocused ? styles.navPillTextActive : styles.navPillTextInactive,
          ]}
        >
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

function NavActionPill({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  const pathname = usePathname();
  const isActive =
    href === '/'
      ? pathname === '/' || pathname === '' || pathname === '/(tabs)' || pathname === '/(tabs)/'
      : pathname.startsWith(href);

  return (
    <Pressable
      onPress={() => router.push(href as any)}
      style={({ pressed }) => [
        styles.navPillPressable,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Navigate to ${label}`}
    >
      <View
        style={[
          styles.navPill,
          isActive ? styles.navPillActive : styles.navPillInactive,
        ]}
      >
        <Text
          style={[
            styles.navPillText,
            isActive ? styles.navPillTextActive : styles.navPillTextInactive,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function CommandBarHeader({
  standalone = false,
  ...props
}: { standalone?: boolean } & Partial<TabListProps> = {}) {
  const { width } = useWindowDimensions();
  const isCompact = width < 960;
  const isNarrow = width < 620;
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // STRICT SAFETY: Do NOT render command bar navbar when user is logged out or on /auth
  if (!user || pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <View {...(props as any)} style={styles.commandBarContainer}>
      <View style={styles.commandBarInner}>
        {/* Left: Brand Identity */}
        <Pressable
          style={styles.brandGroup}
          onPress={() => router.push('/')}
          accessibilityRole="button"
          accessibilityLabel="Future Farming Home"
        >
          <View style={styles.brandTitleRow}>
            <Feather name="feather" size={22} color={BRAND_EMERALD} />
            <Text style={styles.brandName}>Future Farming</Text>
          </View>
        </Pressable>

        {/* Center: Clean Text Navigation Tabs */}
        {!isCompact ? (
          <View style={styles.navPillsRow}>
            {!standalone ? (
              <TabTrigger name="home" href="/" asChild>
                <NavPill>Home</NavPill>
              </TabTrigger>
            ) : (
              <NavActionPill label="Home" href="/" />
            )}

            <NavActionPill label="Dashboard" href="/dashboard" />
            <NavActionPill label="Crop Doctor" href="/crop-doctor" />
            <NavActionPill label="Irrigation" href="/weather-irrigation" />
            <NavActionPill label="Markets" href="/market-advisor" />
            <NavActionPill label="Agri-Shop" href="/agri-shop" />
            <NavActionPill label="Admin Monitor" href="/admin" />
          </View>
        ) : null}

        {/* Right: GPS Location & Clean Language Selector & Account Pill & Logout */}
        <View style={styles.rightControls}>
          <Pressable
            style={({ pressed }) => [
              styles.locationPill,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/weather-irrigation')}
            accessibilityRole="button"
            accessibilityLabel="Active Farm Location"
          >
            <Feather name="map-pin" size={13} color={BRAND_EMERALD} />
            <Text style={styles.locationPillText}>Kolhapur, MH</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.langPill,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/ai-assistant')}
            accessibilityRole="button"
            accessibilityLabel="Switch language"
          >
            <Text style={styles.langPillText}>EN | मराठी | हिं</Text>
          </Pressable>

          {/* Active User Profile Pill */}
          <Pressable
            style={({ pressed }) => [
              styles.authPill,
              styles.activeUserPill,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              router.push((user?.role === 'admin' ? '/admin' : '/auth') as any)
            }
            accessibilityRole="button"
            accessibilityLabel={user ? `Account: ${user.fullName}` : 'Sign In'}
          >
            <Feather
              name={!user ? 'log-in' : user.role === 'admin' ? 'shield' : 'user'}
              size={13}
              color={BRAND_EMERALD}
            />
            <Text style={styles.activeUserPillText} numberOfLines={1}>
              {!user
                ? isNarrow
                  ? 'Login'
                  : 'Sign In'
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
              <Feather name="activity" size={13} color={BRAND_EMERALD} />
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
      </View>

      {/* Compact Secondary Navigation Row on Mobile / Tablet Web */}
      {isCompact ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactScrollRow}
        >
          {!standalone ? (
            <TabTrigger name="home" href="/" asChild>
              <NavPill>Home</NavPill>
            </TabTrigger>
          ) : (
            <NavActionPill label="Home" href="/" />
          )}
          <NavActionPill label="Dashboard" href="/dashboard" />
          <NavActionPill label="Crop Doctor" href="/crop-doctor" />
          <NavActionPill label="Irrigation" href="/weather-irrigation" />
          <NavActionPill label="Markets" href="/market-advisor" />
          <NavActionPill label="Agri-Shop" href="/agri-shop" />
          <NavActionPill label="Admin Monitor" href="/admin" />
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  webTabsRoot: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
    backgroundColor: '#F7F9F7',
  },
  webTabSlot: {
    flex: 1,
    minHeight: '100%',
  },
  commandBarContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    position: 'sticky' as any,
    top: 0,
    zIndex: 1000,
    shadowColor: '#102A13',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  commandBarInner: {
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
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND_DARK,
    letterSpacing: -0.3,
  },
  navPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactScrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  navPillPressable: {},
  navPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  navPillActive: {
    backgroundColor: '#EDF5EE',
  },
  navPillInactive: {
    backgroundColor: 'transparent',
  },
  navPillText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  navPillTextActive: {
    color: BRAND_EMERALD,
  },
  navPillTextInactive: {
    color: '#4B5563',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
  },
  locationPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  langPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.3,
  },
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
    color: BRAND_EMERALD,
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
    backgroundColor: BRAND_DARK,
  },
  authPillFarmer: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  authPillAdmin: {
    backgroundColor: '#EDF5EE',
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
    color: BRAND_DARK,
    fontWeight: '600',
  },
  authPillTextAdmin: {
    color: BRAND_EMERALD,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
});
