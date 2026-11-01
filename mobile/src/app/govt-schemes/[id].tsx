import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { ActionButton } from '@/components/ActionButton';
import { UnifiedPageShell } from '@/components/UnifiedPageShell';
import { ShopColors } from '@/constants/agri-shop-theme';
import {
  GOVT_SCHEMES,
  SCHEME_CATEGORY_META,
  getGovtSchemeById,
  type GovtScheme,
} from '@/data/govtSchemes';
import {
  AGRI_SHOP_ROUTE,
  GOVT_SCHEMES_ROUTE,
  safeGoBack,
} from '@/utils/navigation';
import {
  getPortalDomain,
  openOfficialPortal,
} from '@/utils/official-portal';

export async function generateStaticParams(): Promise<
  Record<string, string>[]
> {
  return GOVT_SCHEMES.map((scheme) => ({ id: scheme.id }));
}

interface SectionCardProps {
  iconName: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function SectionCard({
  iconName,
  title,
  subtitle,
  children,
}: SectionCardProps) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconTile}>
          <Feather name={iconName} size={18} color="#15803D" />
        </View>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? (
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {children}
    </View>
  );
}

export default function GovtSchemeDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const scheme = getGovtSchemeById(params.id);

  if (!scheme) {
    return (
      <UnifiedPageShell
        activeRoute="/govt-schemes"
        title="Scheme Details"
        subtitle="Subsidies & Direct Benefits"
        statusPillText="Verified Portals"
        onBack={() => safeGoBack(GOVT_SCHEMES_ROUTE)}
      >
        <View style={styles.notFoundCard}>
          <View style={styles.notFoundIconBox}>
            <Feather name="alert-circle" size={32} color="#15803D" />
          </View>
          <Text style={styles.notFoundTitle}>Scheme not found</Text>
          <Text style={styles.notFoundText}>
            This scheme may have been renamed or removed from the
            directory.
          </Text>
          <Pressable
            onPress={() => router.replace(GOVT_SCHEMES_ROUTE)}
            style={({ pressed }) => [
              styles.notFoundButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.notFoundButtonText}>
              Back to Govt. Schemes
            </Text>
          </Pressable>
        </View>
      </UnifiedPageShell>
    );
  }

  return <GovtSchemeDetailContent key={scheme.id} scheme={scheme} />;
}

function GovtSchemeDetailContent({ scheme }: { scheme: GovtScheme }) {
  const [readyDocuments, setReadyDocuments] = useState<string[]>([]);

  const category = SCHEME_CATEGORY_META[scheme.category];
  const isLatest =
    scheme.timeline === 'Latest Updates & New Initiatives';
  const portalDomain = getPortalDomain(scheme.officialPortalUrl);

  const readyCount = scheme.requiredDocuments.filter((document) =>
    readyDocuments.includes(document)
  ).length;
  const totalDocuments = scheme.requiredDocuments.length;
  const progressPercent =
    totalDocuments > 0
      ? Math.round((readyCount / totalDocuments) * 100)
      : 0;
  const progressWidth = `${progressPercent}%` as `${number}%`;
  const allDocumentsReady =
    totalDocuments > 0 && readyCount === totalDocuments;

  const toggleDocument = (document: string) => {
    setReadyDocuments((current) =>
      current.includes(document)
        ? current.filter((item) => item !== document)
        : [...current, document]
    );
  };

  const goBack = () => {
    safeGoBack(GOVT_SCHEMES_ROUTE);
  };

  return (
    <UnifiedPageShell
      activeRoute="/govt-schemes"
      title="Scheme Details"
      subtitle={scheme.shortName}
      statusPillText="Verified Portals"
      onBack={goBack}
      scrollable={true}
    >
      <View style={styles.contentInner}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadges}>
              <View
                style={[
                  styles.timelineBadge,
                  isLatest
                    ? styles.timelineLatest
                    : styles.timelineFlagship,
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Feather
                    name={isLatest ? 'zap' : 'award'}
                    size={11}
                    color={isLatest ? '#7A5B12' : '#15803D'}
                  />
                  <Text
                    style={[
                      styles.timelineText,
                      isLatest
                        ? styles.timelineLatestText
                        : styles.timelineFlagshipText,
                    ]}
                  >
                    {isLatest ? 'Latest' : 'Flagship'}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: category.tint },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: category.text },
                  ]}
                >
                  {scheme.category}
                </Text>
              </View>
            </View>

            <View style={styles.heroEmojiTile}>
              <Feather name="award" size={20} color="#15803D" />
            </View>
          </View>

          <Text style={styles.heroTitle}>{scheme.title}</Text>

          <Text style={styles.heroMinistry}>{scheme.ministry}</Text>

          <View style={styles.heroMetaRow}>
            <Text style={styles.heroMeta}>
              Launched {scheme.launchYear}
            </Text>
            <View style={styles.heroMetaDot} />
            <Text style={styles.heroMeta}>{scheme.shortName}</Text>
          </View>

          <View style={styles.benefitCallout}>
            <View style={styles.benefitCalloutTop}>
              <Text style={styles.benefitCalloutLabel}>
                MAXIMUM BENEFIT
              </Text>
              <Feather name="check-circle" size={16} color="#BFE3BD" />
            </View>
            <Text style={styles.benefitCalloutText}>
              {scheme.maxBenefit}
            </Text>
          </View>
        </View>

        <SectionCard
          iconName="clipboard"
          title="Overview & Objective"
          subtitle="What this scheme does for your farm"
        >
          <Text style={styles.overviewSummary}>{scheme.summary}</Text>
          <Text style={styles.overviewDescription}>
            {scheme.detailedDescription}
          </Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>LAUNCH YEAR</Text>
              <Text style={styles.metaValue}>{scheme.launchYear}</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>MINISTRY / DEPARTMENT</Text>
              <Text style={styles.metaValue}>{scheme.ministry}</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>OFFICIAL HELPLINE</Text>
              <Text style={styles.metaValue}>
                {scheme.helplineNumber}
              </Text>
            </View>
          </View>
        </SectionCard>

        <SectionCard
          iconName="dollar-sign"
          title="Key Financial Benefits"
          subtitle="What you can receive under the scheme"
        >
          <View style={styles.list}>
            {scheme.benefits.map((benefit) => (
              <View key={benefit} style={styles.listRow}>
                <View style={styles.checkCircle}>
                  <Feather name="check" size={10} color="#15803D" />
                </View>
                <Text style={styles.listText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard
          iconName="users"
          title="Who Can Apply"
          subtitle="Eligibility criteria and exclusions"
        >
          <View style={styles.list}>
            {scheme.eligibility.map((criterion) => (
              <View key={criterion} style={styles.listRow}>
                <View style={styles.eligibilityDot} />
                <Text style={styles.listText}>{criterion}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard
          iconName="file-text"
          title="Document Readiness Checklist"
          subtitle="Tap each document once you have it ready"
        >
          <View style={styles.progressHeader}>
            <Text style={styles.progressCount}>
              {readyCount} of {totalDocuments} documents ready
            </Text>
            <Text
              style={[
                styles.progressPercent,
                allDocumentsReady && styles.progressPercentComplete,
              ]}
            >
              {progressPercent}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                allDocumentsReady && styles.progressFillComplete,
                { width: progressWidth },
              ]}
            />
          </View>

          <Text
            style={[
              styles.progressMessage,
              allDocumentsReady && styles.progressMessageComplete,
            ]}
          >
            {allDocumentsReady
              ? 'You have all the listed documents. Review them once more on the official portal before submitting.'
              : 'Tick off the documents you already have. Missing documents can usually be obtained from your tehsil, bank or CSC.'}
          </Text>

          <View style={styles.documentList}>
            {scheme.requiredDocuments.map((document) => {
              const checked = readyDocuments.includes(document);

              return (
                <Pressable
                  key={document}
                  onPress={() => toggleDocument(document)}
                  style={({ pressed }) => [
                    styles.documentRow,
                    checked && styles.documentRowChecked,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                >
                  <View
                    style={[
                      styles.checkbox,
                      checked && styles.checkboxChecked,
                    ]}
                  >
                    {checked ? (
                      <Feather name="check" size={12} color="#FFFFFF" />
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.documentText,
                      checked && styles.documentTextChecked,
                    ]}
                  >
                    {document}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard
          iconName="list"
          title="Step-by-Step Application Guide"
          subtitle="How to apply online or through a CSC"
        >
          <View style={styles.steps}>
            {scheme.applicationSteps.map((step, index) => (
              <View key={step} style={styles.stepRow}>
                <View style={styles.stepRail}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>
                      {index + 1}
                    </Text>
                  </View>
                  {index < scheme.applicationSteps.length - 1 ? (
                    <View style={styles.stepLine} />
                  ) : null}
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        {scheme.relatedToAgriShop ? (
          <Pressable
            onPress={() => router.push(AGRI_SHOP_ROUTE)}
            style={({ pressed }) => [
              styles.agriShopCard,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Explore AI-prescribed farming products in Agri-Shop"
          >
            <View style={styles.agriShopIconTile}>
              <Feather name="shopping-bag" size={20} color="#15803D" />
            </View>

            <View style={styles.agriShopBody}>
              <Text style={styles.agriShopEyebrow}>AGRI-SHOP</Text>
              <Text style={styles.agriShopTitle}>
                Need agricultural inputs for your farm?
              </Text>
              <Text style={styles.agriShopText}>
                Explore AI-prescribed products in Agri-Shop →
              </Text>
            </View>

            <Text style={styles.agriShopArrow}>›</Text>
          </Pressable>
        ) : null}

        <View style={styles.safetyCard}>
          <View style={styles.safetyIconTile}>
            <Feather name="shield" size={16} color="#D97706" />
          </View>
          <View style={styles.safetyBody}>
            <Text style={styles.safetyTitle}>
              Apply only on the official website
            </Text>
            <Text style={styles.safetyText}>
              The authentic portal for this scheme is{' '}
              <Text style={styles.safetyDomain}>{portalDomain}</Text>.
              Never share an OTP or pay through unofficial UPI links or
              agents.
            </Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          Scheme information is indicative and may be updated by the
          implementing department. Verify the latest guidelines,
          eligibility and deadlines on the official portal before
          applying.
        </Text>

        <View style={styles.stickyBar}>
          <View style={styles.stickyInner}>
            <View style={styles.stickyPortalInfo}>
              <Text style={styles.stickyLabel}>OFFICIAL GOVT PORTAL</Text>
              <Text style={styles.stickyDomain} numberOfLines={1}>
                {portalDomain}
              </Text>
            </View>

            <ActionButton
              label="Apply on Official Govt Portal"
              icon="external-link"
              variant="primary"
              onPress={() => openOfficialPortal(scheme.officialPortalUrl)}
              accessibilityLabel={`Apply on the official government portal ${portalDomain}`}
              style={styles.stickyAction}
            />
          </View>
        </View>
      </View>
    </UnifiedPageShell>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ShopColors.background,
  },
  screen: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  contentInner: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
  },
  heroCard: {
    backgroundColor: ShopColors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ShopColors.border,
    padding: 24,
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    flex: 1,
    minWidth: 0,
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
  heroEmojiTile: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: ShopColors.mint,
    borderWidth: 1,
    borderColor: ShopColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 23,
  },
  heroTitle: {
    color: ShopColors.heading,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 15,
    maxWidth: 760,
  },
  heroMinistry: {
    color: ShopColors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
    maxWidth: 720,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 9,
  },
  heroMeta: {
    color: ShopColors.soft,
    fontSize: 9,
    fontWeight: '700',
  },
  heroMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: ShopColors.soft,
  },
  benefitCallout: {
    backgroundColor: ShopColors.primaryDark,
    borderRadius: 14,
    padding: 14,
    marginTop: 17,
  },
  benefitCalloutTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  benefitCalloutLabel: {
    color: '#BFE3BD',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  benefitCalloutIcon: {
    fontSize: 15,
  },
  benefitCalloutText: {
    color: ShopColors.white,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: ShopColors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ShopColors.border,
    padding: 24,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 15,
  },
  sectionIconTile: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: ShopColors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIcon: {
    fontSize: 17,
  },
  sectionHeading: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    color: ShopColors.heading,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    color: ShopColors.soft,
    fontSize: 9,
    marginTop: 2,
  },
  overviewSummary: {
    color: ShopColors.heading,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  overviewDescription: {
    color: ShopColors.body,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 16,
  },
  metaItem: {
    flexGrow: 1,
    flexBasis: 210,
    minWidth: 170,
    backgroundColor: '#F8FBF6',
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 10,
    padding: 11,
  },
  metaLabel: {
    color: ShopColors.soft,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  metaValue: {
    color: ShopColors.heading,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '700',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  list: {
    gap: 10,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  checkCircle: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: ShopColors.softGreen,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkText: {
    color: ShopColors.primaryDark,
    fontSize: 9,
    fontWeight: '800',
  },
  eligibilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ShopColors.primary,
    marginTop: 7,
    marginLeft: 6,
    marginRight: 1,
  },
  listText: {
    flex: 1,
    color: ShopColors.body,
    fontSize: 11,
    lineHeight: 18,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  progressCount: {
    color: ShopColors.heading,
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  progressPercent: {
    color: ShopColors.primary,
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  progressPercentComplete: {
    color: ShopColors.success,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8EFE5',
    overflow: 'hidden',
    marginTop: 9,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: ShopColors.primary,
  },
  progressFillComplete: {
    backgroundColor: ShopColors.success,
  },
  progressMessage: {
    color: ShopColors.soft,
    fontSize: 9,
    lineHeight: 15,
    marginTop: 8,
  },
  progressMessageComplete: {
    color: ShopColors.success,
    fontWeight: '600',
  },
  documentList: {
    gap: 7,
    marginTop: 14,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FAFCF8',
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 10,
    padding: 11,
  },
  documentRowChecked: {
    backgroundColor: '#F4FAF1',
    borderColor: ShopColors.chipBorder,
  },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: ShopColors.soft,
    backgroundColor: ShopColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: ShopColors.primary,
    borderColor: ShopColors.primary,
  },
  checkboxTick: {
    color: ShopColors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  documentText: {
    flex: 1,
    color: ShopColors.body,
    fontSize: 11,
    lineHeight: 17,
  },
  documentTextChecked: {
    color: ShopColors.primaryDeep,
    textDecorationLine: 'line-through',
  },
  steps: {
    marginTop: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 11,
  },
  stepRail: {
    width: 24,
    alignItems: 'center',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ShopColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: ShopColors.white,
    fontSize: 10,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: ShopColors.chipBorder,
    marginVertical: 4,
  },
  stepText: {
    flex: 1,
    color: ShopColors.body,
    fontSize: 11,
    lineHeight: 18,
    paddingBottom: 14,
    paddingTop: 3,
  },
  agriShopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: ShopColors.softGreen,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ShopColors.chipBorder,
    padding: 16,
    marginBottom: 14,
  },
  agriShopIconTile: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: ShopColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agriShopIcon: {
    fontSize: 20,
  },
  agriShopBody: {
    flex: 1,
    minWidth: 0,
  },
  agriShopEyebrow: {
    color: ShopColors.primary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  agriShopTitle: {
    color: ShopColors.heading,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    marginTop: 3,
  },
  agriShopText: {
    color: ShopColors.primaryDark,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  agriShopArrow: {
    color: ShopColors.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    backgroundColor: '#FFF9EC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8D9A8',
    padding: 14,
    marginBottom: 14,
  },
  safetyIconTile: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#FFF3D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyIcon: {
    fontSize: 14,
  },
  safetyBody: {
    flex: 1,
    minWidth: 0,
  },
  safetyTitle: {
    color: ShopColors.amberText,
    fontSize: 11,
    fontWeight: '800',
  },
  safetyText: {
    color: '#7D642E',
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
  },
  safetyDomain: {
    fontWeight: '800',
    color: ShopColors.amberText,
  },
  disclaimer: {
    color: ShopColors.soft,
    fontSize: 9,
    lineHeight: 15,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  stickyBar: {
    backgroundColor: ShopColors.white,
    borderTopWidth: 1,
    borderTopColor: ShopColors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  stickyInner: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stickyPortalInfo: {
    flex: 1,
    minWidth: 0,
  },
  stickyLabel: {
    color: ShopColors.soft,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  stickyDomain: {
    color: ShopColors.heading,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },
  stickyAction: {
    maxWidth: '68%',
  },
  notFoundScreen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  notFoundCard: {
    backgroundColor: ShopColors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ShopColors.border,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  notFoundIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#EDF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  notFoundTitle: {
    color: ShopColors.heading,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
  },
  notFoundText: {
    color: ShopColors.muted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 380,
    marginTop: 7,
  },
  notFoundButton: {
    backgroundColor: ShopColors.primary,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundButtonText: {
    color: ShopColors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
});
