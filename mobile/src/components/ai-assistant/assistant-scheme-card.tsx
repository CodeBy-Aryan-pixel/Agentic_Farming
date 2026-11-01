import React from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { ShopColors } from '@/constants/agri-shop-theme';
import {
  getAssistantCardCopy,
  type AssistantLanguage,
} from '@/constants/assistant-i18n';
import {
  SCHEME_CATEGORY_META,
  type GovtScheme,
} from '@/data/govtSchemes';
import { govtSchemeRoute } from '@/utils/navigation';
import { getPortalDomain } from '@/utils/official-portal';

interface AssistantSchemeCardProps {
  scheme: GovtScheme;
  language: AssistantLanguage;
}

export function AssistantSchemeCard({
  scheme,
  language,
}: AssistantSchemeCardProps) {
  const category = SCHEME_CATEGORY_META[scheme.category];
  const copy = getAssistantCardCopy(language);
  const categoryLabel = copy.schemeCategories[scheme.category];
  const isLatest =
    scheme.timeline === 'Latest Updates & New Initiatives';
  const portalDomain = getPortalDomain(scheme.officialPortalUrl);

  const openPortal = async () => {
    try {
      await Linking.openURL(scheme.officialPortalUrl);
    } catch {
      Alert.alert(
        copy.scheme.portalErrorTitle,
        copy.scheme.portalErrorBody(portalDomain)
      );
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        <View
          style={[
            styles.timelineBadge,
            isLatest
              ? styles.timelineLatest
              : styles.timelineFlagship,
          ]}
        >
          <Text
            style={[
              styles.timelineText,
              isLatest
                ? styles.timelineLatestText
                : styles.timelineFlagshipText,
            ]}
          >
            {isLatest ? copy.scheme.latest : copy.scheme.flagship}
          </Text>
        </View>

        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: category.tint },
          ]}
        >
          <Text
            style={[styles.categoryText, { color: category.text }]}
          >
            {categoryLabel}
          </Text>
        </View>
      </View>

      <View style={styles.titleRow}>
        <View style={[styles.iconTile, { backgroundColor: '#EDF5EE' }]}>
          <Feather name="shield" size={16} color="#15803D" />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>{scheme.title}</Text>
          <Text style={styles.meta}>
            {scheme.shortName} · {copy.scheme.since(scheme.launchYear)}
          </Text>
        </View>
      </View>

      <Text style={styles.summary} numberOfLines={3}>
        {scheme.summary}
      </Text>

      <View style={styles.benefitPill}>
        <Feather name="award" size={16} color="#15803D" style={{ marginRight: 6, marginTop: 2 }} />
        <View style={styles.benefitBody}>
          <Text style={styles.benefitLabel}>
            {copy.scheme.keyBenefit}
          </Text>
          <Text style={styles.benefitText}>{scheme.maxBenefit}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push(govtSchemeRoute(scheme.id))}
          style={({ pressed }) => [
            styles.detailsButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={copy.scheme.viewDetailsAccessibility(
            scheme.shortName
          )}
        >
          <Text style={styles.detailsButtonText}>
            {copy.scheme.viewDetails}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => void openPortal()}
          style={({ pressed }) => [
            styles.portalButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="link"
          accessibilityLabel={copy.scheme.officialPortalAccessibility(
            portalDomain,
            scheme.shortName
          )}
        >
          <Text style={styles.portalButtonText}>
            {copy.scheme.officialPortal}
          </Text>
          <Text style={styles.portalDomain} numberOfLines={1}>
            {portalDomain}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#F8FCF6',
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    borderRadius: 16,
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  timelineBadge: {
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timelineLatest: {
    backgroundColor: '#FFF3D6',
  },
  timelineFlagship: {
    backgroundColor: ShopColors.softGreen,
  },
  timelineText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  timelineLatestText: {
    color: '#7A5B12',
  },
  timelineFlagshipText: {
    color: ShopColors.primaryDark,
  },
  categoryBadge: {
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '800',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 12,
  },
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: ShopColors.mint,
    borderWidth: 1,
    borderColor: ShopColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 21,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: ShopColors.heading,
  },
  meta: {
    fontSize: 9,
    fontWeight: '700',
    color: ShopColors.muted,
    marginTop: 3,
  },
  summary: {
    fontSize: 11,
    lineHeight: 17,
    color: ShopColors.body,
    marginTop: 11,
  },
  benefitPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: ShopColors.softGreen,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    borderRadius: 11,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginTop: 12,
  },
  benefitIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  benefitBody: {
    flex: 1,
    minWidth: 0,
  },
  benefitLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: ShopColors.primary,
  },
  benefitText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    color: ShopColors.primaryDeep,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 13,
  },
  detailsButton: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 160,
    backgroundColor: ShopColors.primary,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: ShopColors.white,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  portalButton: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 160,
    backgroundColor: ShopColors.surface,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 8,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalButtonText: {
    color: ShopColors.primaryDark,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  portalDomain: {
    color: ShopColors.soft,
    fontSize: 8,
    marginTop: 2,
    maxWidth: '100%',
  },
  pressed: {
    opacity: 0.72,
  },
});
