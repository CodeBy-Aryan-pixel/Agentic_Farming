import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { ShopColors } from '@/constants/agri-shop-theme';
import {
  SCHEME_CATEGORY_META,
  type GovtScheme,
} from '@/data/govtSchemes';
import { govtSchemeRoute } from '@/utils/navigation';
import {
  getPortalDomain,
  openOfficialPortal,
} from '@/utils/official-portal';

interface SchemeCardProps {
  scheme: GovtScheme;
  eligible?: boolean;
}

const DOCUMENT_LABELS: [RegExp, string][] = [
  [/aadhaar/i, 'Aadhaar'],
  [/7\/12|land ownership|khatauni|tenancy/i, 'Land record'],
  [/bank passbook/i, 'Bank passbook'],
  [/photograph|photo/i, 'Photograph'],
  [/resolution|authoris|authoriz/i, 'SHG resolution'],
  [/shg|clf|self help/i, 'SHG proof'],
  [/quotation|invoice/i, 'Quotation'],
  [/caste|income certificate/i, 'Category proof'],
  [/sowing|crop plan|crop-loss/i, 'Crop proof'],
  [/electricity|water source/i, 'Water/electricity'],
  [/mobile number/i, 'Mobile number'],
];

function documentTag(document: string): string {
  const match = DOCUMENT_LABELS.find(([pattern]) =>
    pattern.test(document)
  );

  if (match) return match[1];

  const compact = document.split(/[/(]/)[0].trim();
  return compact.length > 22 ? `${compact.slice(0, 21)}…` : compact;
}

export function SchemeCard({
  scheme,
  eligible = false,
}: SchemeCardProps) {
  const category = SCHEME_CATEGORY_META[scheme.category];
  const isLatest =
    scheme.timeline === 'Latest Updates & New Initiatives';
  const portalDomain = getPortalDomain(scheme.officialPortalUrl);
  const previewDocuments = scheme.requiredDocuments.slice(0, 3);
  const remainingDocuments =
    scheme.requiredDocuments.length - previewDocuments.length;

  return (
    <View style={[styles.card, eligible && styles.cardEligible]}>
      <View style={styles.badgeRow}>
        <View
          style={[
            styles.timelineBadge,
            isLatest ? styles.timelineLatest : styles.timelineFlagship,
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
            {isLatest ? 'Latest Update' : 'Flagship Scheme'}
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
            {category.shortLabel}
          </Text>
        </View>
      </View>

      {eligible ? (
        <View style={styles.matchBadge}>
          <Text style={styles.matchText}>Eligible Match</Text>
        </View>
      ) : null}

      <Text style={styles.title}>{scheme.title}</Text>

      <Text style={styles.ministry} numberOfLines={2}>
        {scheme.ministry}
      </Text>

      <Text style={styles.launchYear}>
        Since {scheme.launchYear} · {scheme.shortName}
      </Text>

      <View style={styles.benefitBox}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDF5EE', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
          <Feather name="award" size={18} color="#15803D" />
        </View>
        <View style={styles.benefitBody}>
          <Text style={styles.benefitLabel}>KEY BENEFIT</Text>
          <Text style={styles.benefitText}>{scheme.maxBenefit}</Text>
        </View>
      </View>

      <View style={styles.documentsBlock}>
        <Text style={styles.documentsLabel}>
          DOCUMENTS YOU WILL NEED
        </Text>

        <View style={styles.documentTags}>
          {previewDocuments.map((document) => (
            <View key={document} style={styles.documentTag}>
              <Text style={styles.documentTagText}>
                {documentTag(document)}
              </Text>
            </View>
          ))}

          {remainingDocuments > 0 ? (
            <View style={styles.moreTag}>
              <Text style={styles.moreTagText}>
                +{remainingDocuments} more
              </Text>
            </View>
          ) : null}
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
          accessibilityLabel={`View full details for ${scheme.shortName}`}
        >
          <Text style={styles.detailsButtonText}>
            View Full Details →
          </Text>
        </Pressable>

        <Pressable
          onPress={() => void openOfficialPortal(scheme.officialPortalUrl)}
          style={({ pressed }) => [
            styles.portalButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Open official portal ${portalDomain} for ${scheme.shortName}`}
        >
          <Text style={styles.portalButtonText}>
            Official Portal ↗
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
    backgroundColor: ShopColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ShopColors.border,
    padding: 20,
  },
  cardEligible: {
    borderColor: ShopColors.primary,
    borderWidth: 1.5,
    backgroundColor: '#F8FCF6',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },
  timelineBadge: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
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
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '800',
  },
  matchBadge: {
    alignSelf: 'flex-start',
    backgroundColor: ShopColors.primary,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 11,
  },
  matchText: {
    color: ShopColors.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: ShopColors.heading,
    letterSpacing: -0.2,
    marginTop: 13,
  },
  ministry: {
    fontSize: 10,
    lineHeight: 15,
    color: ShopColors.muted,
    marginTop: 6,
  },
  launchYear: {
    fontSize: 9,
    fontWeight: '700',
    color: ShopColors.soft,
    marginTop: 5,
  },
  benefitBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: ShopColors.softGreen,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    borderRadius: 12,
    padding: 11,
    marginTop: 14,
  },
  benefitIcon: {
    fontSize: 15,
    marginTop: 1,
  },
  benefitBody: {
    flex: 1,
    minWidth: 0,
  },
  benefitLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: ShopColors.primary,
  },
  benefitText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    color: ShopColors.primaryDeep,
    marginTop: 3,
  },
  documentsBlock: {
    marginTop: 14,
  },
  documentsLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: ShopColors.soft,
  },
  documentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 7,
  },
  documentTag: {
    backgroundColor: '#F7FAF6',
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  documentTagText: {
    fontSize: 9,
    fontWeight: '600',
    color: ShopColors.body,
  },
  moreTag: {
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: ShopColors.mint,
  },
  moreTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: ShopColors.primary,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: ShopColors.border,
  },
  detailsButton: {
    flexGrow: 1,
    flexBasis: 145,
    backgroundColor: ShopColors.primary,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: ShopColors.white,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  portalButton: {
    flexGrow: 1,
    flexBasis: 135,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ShopColors.surface,
  },
  portalButtonText: {
    color: ShopColors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
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
