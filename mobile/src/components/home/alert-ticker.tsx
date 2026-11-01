import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { Feather } from '@expo/vector-icons';

import { useCart } from '@/context/CartContext';
import { agriShopRoute, govtSchemeRoute } from '@/utils/navigation';

const ACCENT = '#15803D';
const MINT = '#FFFFFF';
const HEADING = '#0F291E';
const BODY = '#4B5563';
const MUTED = '#6B7280';
const BORDER = '#E6ECE6';

interface HomeAlert {
  id: string;
  eyebrow: string;
  iconName: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  route: Href;
}

export function AlertTicker() {
  const { diagnosis } = useCart();
  const [activeIndex, setActiveIndex] = useState(0);

  const alerts = useMemo<HomeAlert[]>(() => {
    const cropAlert: HomeAlert = diagnosis
      ? {
          id: 'crop-scan',
          eyebrow: 'CROP HEALTH',
          iconName: 'activity',
          title: `Recent scan: ${diagnosis.disease}`,
          description: `${diagnosis.severity} severity detected on ${diagnosis.crop}. Review the treatment plan and recommended inputs.`,
          route: agriShopRoute({
            disease: diagnosis.disease,
            crop: diagnosis.crop,
          }),
        }
      : {
          id: 'crop-scan',
          eyebrow: 'CROP HEALTH',
          iconName: 'activity',
          title: 'Catch crop problems early',
          description:
            'No recent crop scan. Use Crop Doctor to check symptoms before they spread.',
          route: '/crop-doctor' as Href,
        };

    return [
      {
        id: 'pm-kisan-deadline',
        eyebrow: 'SCHEME DEADLINE',
        iconName: 'credit-card',
        title: 'PM-KISAN e-KYC deadline approaching',
        description:
          'Complete e-KYC to keep your ₹6,000 yearly benefit on track.',
        route: govtSchemeRoute('pm-kisan'),
      },
      {
        id: 'weather-advisory',
        eyebrow: 'WEATHER ADVISORY',
        iconName: 'cloud-rain',
        title: 'Rain expected in your area',
        description:
          'Avoid spraying today and protect harvested crops from unexpected showers.',
        route: agriShopRoute(),
      },
      cropAlert,
    ];
  }, [diagnosis]);

  useEffect(() => {
    if (alerts.length < 2) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % alerts.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [alerts.length]);

  const alert = alerts[activeIndex % alerts.length] ?? alerts[0];

  if (!alert) return null;

  return (
    <View
      style={styles.card}
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${alert.eyebrow}. ${alert.title}. ${alert.description}`}
    >
      <View style={styles.mainRow}>
        <View style={styles.iconTile}>
          <Feather name={alert.iconName} size={18} color={ACCENT} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{alert.eyebrow}</Text>
          <Text style={styles.title}>{alert.title}</Text>
          <Text style={styles.description}>{alert.description}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {alerts.map((item, index) => (
            <Pressable
              key={item.id}
              onPress={() => setActiveIndex(index)}
              hitSlop={8}
              style={styles.dotButton}
              accessibilityRole="button"
              accessibilityLabel={`Show alert ${index + 1} of ${alerts.length}`}
              accessibilityState={{ selected: index === activeIndex }}
            >
              <View
                style={[
                  styles.dot,
                  index === activeIndex && styles.dotActive,
                ]}
              />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => router.push(alert.route)}
          style={({ pressed }) => [
            styles.action,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`View details: ${alert.title}`}
        >
          <Text style={styles.actionText}>View Details →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: MINT,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 4,
    borderLeftColor: ACCENT,
    borderRadius: 18,
    padding: 16,
    marginTop: 24,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#EDF5EE',
    borderWidth: 1,
    borderColor: '#E6ECE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 19,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    color: ACCENT,
  },
  title: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
    color: HEADING,
  },
  description: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: BODY,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -5,
  },
  dotButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MUTED,
    opacity: 0.35,
  },
  dotActive: {
    width: 17,
    backgroundColor: ACCENT,
    opacity: 1,
  },
  action: {
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '800',
    color: ACCENT,
  },
  pressed: {
    opacity: 0.72,
  },
});
