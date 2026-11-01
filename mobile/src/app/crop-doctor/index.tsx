import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import {
  PALETTE,
  UnifiedPageShell,
} from '@/components/UnifiedPageShell';
import { ActionButton } from '@/components/ActionButton';
import { ExportReportButton } from '@/components/ExportReportButton';
import { ProductPhoto } from '@/components/ProductPhoto';
import {
  createDiagnosis,
  useCart,
} from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { GpsLocationButton } from '@/components/weather/gps-location-button';
import { LiveTelemetryDot } from '@/components/weather/live-telemetry-dot';
import { useGpsLocation } from '@/hooks/use-gps-location';
import { useLiveWeather } from '@/hooks/use-live-weather';
import {
  AUTO_CROP_SELECTION,
  CROP_DOCTOR_SAMPLES,
  CROP_SELECTOR_OPTIONS,
  FARM_ACRES_MAX,
  FARM_ACRES_MIN,
  analyzeCropImage,
  configureVisionApiKeys,
  ensureBase64,
  getSeverityProgressPct,
  reanalyzeCropSelection,
  runCropDoctorWorkflow,
  runSprayWeatherSentinel,
  type AgriShopRxItem,
  type CropDoctorAgentName,
  type CropDoctorSample,
  type CropSelection,
  type CureStep,
  type DiseaseSeverity,
  type LeafBiomarkerBreakdown,
  type LeafScanInput,
  type SprayWeatherSentinelResult,
  type VisionPathologyResult,
} from '@/services/cropDoctorAgent';
import {
  createOfflineWeather,
  getCityDisplayName,
} from '@/services/weatherIrrigationAgent';
import { buildCropDoctorAgronomistReport } from '@/utils/agronomistReport';
import {
  formatFetchedAt,
  formatINR,
  formatNumber,
} from '@/utils/format';
import { agriShopRoute } from '@/utils/navigation';
import { persistentStorage } from '@/utils/persistentStorage';

const VISION_SETTINGS_KEY = 'cropDoctor.visionApiSettings.v1';
const OTHER_CROP_SELECTION = 'Other Crop' as CropSelection;

type VisionApiSettings = {
  geminiKey: string;
  openaiKey: string;
  geminiModel: string;
  openaiModel: string;
};

const EMPTY_VISION_SETTINGS: VisionApiSettings = {
  geminiKey: '',
  openaiKey: '',
  geminiModel: '',
  openaiModel: '',
};

function cropSelectorLabel(
  option: CropSelection,
  detectedCrop?: string | null,
  isQuickLock = false
): string {
  if (option === AUTO_CROP_SELECTION || option === 'Auto-Detect Any Crop') {
    if (isQuickLock) {
      return 'Auto';
    }
    return detectedCrop
      ? `Auto (${detectedCrop})`
      : 'Auto-Detect Any Crop';
  }
  if (option === 'Paddy (Rice)') return isQuickLock ? 'Paddy' : 'Paddy (Rice)';
  if (option === OTHER_CROP_SELECTION) return isQuickLock ? 'Other' : 'Other Crop...';
  return option;
}

const SCAN_STAGES = [
  'VisionOracleAgent · segmenting leaf pixels & fusing live vision',
  'MorphologySpatialAgent · mapping 8×8 lesion scores, morphology & transitions',
  'EnsembleClassifierAgent · applying crop hard-mask & calibrated soft vote',
  'PathologyCriticAgent · auditing morphology, biomarkers & cross-crop rules',
  'AgriShopCureAgent · scheduling weather-safe cure steps & scaling inputs',
];

const SEVERITY_META: Record<
  DiseaseSeverity,
  { label: string; color: string; background: string }
> = {
  Healthy: {
    label: 'Healthy',
    color: PALETTE.brandEmerald,
    background: PALETTE.sageTint,
  },
  Mild: {
    label: 'Mild',
    color: PALETTE.brandEmerald,
    background: PALETTE.sageTint,
  },
  Moderate: {
    label: 'Moderate',
    color: '#B45309',
    background: PALETTE.amberTint,
  },
  Critical: {
    label: 'Critical',
    color: '#DC2626',
    background: PALETTE.redTint,
  },
};

const AGENT_ICONS: Record<CropDoctorAgentName, { icon: keyof typeof Feather.glyphMap; name: string }> = {
  VisionOracleAgent: { icon: 'eye', name: 'Vision Oracle' },
  MorphologySpatialAgent: { icon: 'grid', name: 'Morphology Spatial' },
  EnsembleClassifierAgent: { icon: 'cpu', name: 'Ensemble Classifier' },
  PathologyCriticAgent: { icon: 'shield', name: 'Pathology Critic' },
  AgriShopCureAgent: { icon: 'shopping-bag', name: 'Agri-Shop Cure' },
};

const BIOMARKER_SEGMENTS: {
  key: keyof LeafBiomarkerBreakdown;
  label: string;
  color: string;
}[] = [
  { key: 'greenChlorophyllPct', label: 'Healthy Tissue', color: '#15803D' },
  { key: 'yellowChlorosisPct', label: 'Chlorosis / Yellowing', color: '#EAB308' },
  { key: 'brownNecrosisPct', label: 'Necrotic Spots', color: '#B45309' },
  { key: 'whiteMildewPct', label: 'Mildew / Mold Pustules', color: '#6366F1' },
  { key: 'nonPlantPct', label: 'Background', color: '#9CA3AF' },
];

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionHeadingText}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

function BiomarkerBar({
  biomarkers,
}: {
  biomarkers: LeafBiomarkerBreakdown;
}) {
  const plantCoverage = Math.max(0, 100 - biomarkers.nonPlantPct);
  const displayValue = (key: keyof LeafBiomarkerBreakdown) =>
    key === 'nonPlantPct'
      ? Math.max(0, biomarkers.nonPlantPct)
      : (Math.max(0, (biomarkers[key] ?? 0) as number) * plantCoverage) / 100;
  const total =
    BIOMARKER_SEGMENTS.reduce(
      (sum, segment) => sum + displayValue(segment.key),
      0
    ) || 1;

  return (
    <View style={styles.biomarkerBlock}>
      <View style={styles.biomarkerTrack}>
        {BIOMARKER_SEGMENTS.map((segment) => {
          const value = displayValue(segment.key);
          const width = `${(value / total) * 100}%` as `${number}%`;

          return (
            <View
              key={segment.key}
              style={{
                width,
                height: '100%',
                backgroundColor: segment.color,
              }}
            />
          );
        })}
      </View>

      <View style={styles.biomarkerLegend}>
        {BIOMARKER_SEGMENTS.map((segment) => (
          <View key={segment.key} style={styles.biomarkerLegendItem}>
            <View
              style={[
                styles.biomarkerDot,
                { backgroundColor: segment.color },
              ]}
            />
            <Text style={styles.biomarkerLegendLabel}>
              {segment.label}
            </Text>
            <Text style={styles.biomarkerLegendValue}>
              {formatNumber(displayValue(segment.key), 1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function CureStepCard({
  step,
  isLast,
  checked,
  onToggle,
}: {
  step: CureStep;
  isLast: boolean;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.cureStepRow}>
      <View style={styles.cureStepRail}>
        <Pressable
          onPress={onToggle}
          hitSlop={10}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel={`Mark ${step.title} as completed`}
          style={[
            styles.cureStepBadge,
            checked && styles.cureStepBadgeChecked,
          ]}
        >
          {checked ? (
            <Feather name="check" size={12} color="#FFFFFF" />
          ) : (
            <Text style={styles.cureStepBadgeText}>{step.step}</Text>
          )}
        </Pressable>
        {!isLast ? <View style={styles.cureStepLine} /> : null}
      </View>

      <View style={styles.cureStepBody}>
        <View style={styles.cureStepTopRow}>
          <Text style={styles.cureStepTitle}>{step.title}</Text>
          <View style={styles.timingPill}>
            <Feather name="clock" size={11} color={PALETTE.textMuted} />
            <Text style={styles.timingPillText}>{step.timing}</Text>
          </View>
        </View>
        <Text style={styles.cureStepDetail}>{step.detail}</Text>

        {step.productName ? (
          <View style={styles.cureProductRow}>
            <View style={styles.cureProductIconBox}>
              <Feather name="package" size={13} color={PALETTE.brandEmerald} />
            </View>
            <Text style={styles.cureProductName} numberOfLines={1}>
              {step.productName}
            </Text>
            {step.doseLabel ? (
              <Text style={styles.cureProductDose}>
                {step.doseLabel}
              </Text>
            ) : null}
          </View>
        ) : null}

        {step.safetyNote ? (
          <View style={styles.safetyBox}>
            <Feather name="info" size={13} color="#B45309" />
            <Text style={styles.cureSafety}>{step.safetyNote}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function RxCard({
  item,
  onBuy,
}: {
  item: AgriShopRxItem;
  onBuy: () => void;
}) {
  return (
    <View style={styles.rxCard}>
      <View style={styles.rxTopRow}>
        <View style={styles.rxRoleTag}>
          <Text style={styles.rxRoleText}>{item.role}</Text>
        </View>
        <View style={styles.rxPriceBlock}>
          <Text style={styles.rxPrice}>{formatINR(item.totalPrice)}</Text>
          <Text style={styles.rxMrp}>MRP {formatINR(item.totalMrp)}</Text>
        </View>
      </View>

      <View style={styles.rxMainRow}>
        <View style={styles.rxThumb}>
          <ProductPhoto
            product={item.product}
            height={110}
            compact
            showBadges={false}
          />
        </View>

        <View style={styles.rxDetails}>
          <Text style={styles.rxName} numberOfLines={2}>
            {item.product.name}
          </Text>
          <Text style={styles.rxBrand} numberOfLines={1}>
            {item.product.brand} ·{' '}
            {item.quantityLabel ||
              `${item.quantity} × ${item.product.unit}`}
          </Text>
          <View style={styles.rxDoseRow}>
            <Feather name="droplet" size={11} color={PALETTE.brandEmerald} />
            <Text style={styles.rxDosage} numberOfLines={2}>
              {item.doseLabel || item.product.dosagePerAcre}
            </Text>
          </View>
          <View style={styles.rxMetaRow}>
            <Feather name="star" size={10} color="#D97706" />
            <Text style={styles.rxRating}>
              {item.product.rating.toFixed(1)}
            </Text>
            <Text style={styles.rxCoverage} numberOfLines={1}>
              {item.coverageLabel}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={onBuy}
        style={({ pressed }) => [
          styles.rxBuyButton,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Buy ${item.product.name} in Agri-Shop`}
      >
        <Feather name="shopping-bag" size={14} color="#FFFFFF" />
        <Text style={styles.rxBuyButtonText}>Order in Agri-Shop</Text>
      </Pressable>
    </View>
  );
}

function SampleCard({
  sample,
  active,
  disabled,
  onPress,
}: {
  sample: CropDoctorSample;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const healthy = sample.expectedStatus === 'Healthy';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.sampleCard,
        active && styles.sampleCardActive,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Scan demo sample ${sample.label}`}
    >
      <View style={styles.sampleTopRow}>
        <View style={styles.sampleIconBox}>
          <MaterialCommunityIcons
            name="leaf"
            size={16}
            color={healthy ? PALETTE.brandEmerald : '#B45309'}
          />
        </View>
        <View
          style={[
            styles.sampleStatusTag,
            { backgroundColor: healthy ? PALETTE.sageTint : PALETTE.redTint },
          ]}
        >
          <Text
            style={[
              styles.sampleStatusText,
              { color: healthy ? PALETTE.brandEmerald : '#DC2626' },
            ]}
          >
            {healthy ? 'HEALTHY' : 'DISEASED'}
          </Text>
        </View>
      </View>
      <Text style={styles.sampleLabel} numberOfLines={2}>
        {sample.label}
      </Text>
      <Text style={styles.sampleSubtitle} numberOfLines={2}>
        {sample.subtitle}
      </Text>
      <View style={styles.sampleTryDemoRow}>
        <Text style={styles.sampleTryDemoText}>Try Demo →</Text>
      </View>
    </Pressable>
  );
}

function InvalidLeafCard({
  vision,
  onRetry,
  onDemo,
}: {
  vision: VisionPathologyResult;
  onRetry: () => void;
  onDemo: () => void;
}) {
  const chlorRatio = vision.botanicalGreenYellowRatio ?? 0;
  const artRatio = vision.nonPlantArtificialRatio ?? 0;
  const reason =
    vision.rejectionReason ||
    'Non-plant object / indoor item detected (<15% botanical chlorophyll). Please upload or take a photo of a real crop leaf.';
  const detected = vision.detectedObject || 'Non-plant object';

  return (
    <View style={styles.card}>
      <View style={styles.invalidHeaderRow}>
        <View style={styles.invalidIconWrap}>
          <Feather name="alert-triangle" size={22} color="#DC2626" />
        </View>
        <View style={styles.invalidTitleBlock}>
          <Text style={styles.invalidEyebrow}>
            PLANT GATEKEEPER AGENT · AUDIT FAILED
          </Text>
          <Text style={styles.invalidTitle}>
            Invalid Image — No Crop Leaf Detected
          </Text>
          <Text style={styles.invalidSubtitle}>
            Detected item:{' '}
            <Text style={styles.invalidHighlight}>{detected}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.invalidReasonBox}>
        <Text style={styles.invalidReasonText}>{reason}</Text>
      </View>

      <View style={styles.gatekeeperStatsRow}>
        <View style={styles.gatekeeperStatCell}>
          <Text style={styles.gatekeeperStatLabel}>
            BOTANICAL CHLOROPHYLL
          </Text>
          <Text
            style={[
              styles.gatekeeperStatValue,
              { color: chlorRatio >= 15 ? PALETTE.brandEmerald : '#DC2626' },
            ]}
          >
            {chlorRatio.toFixed(1)}%
          </Text>
          <Text style={styles.gatekeeperStatTarget}>Min threshold: 15%</Text>
        </View>

        <View style={styles.gatekeeperStatCell}>
          <Text style={styles.gatekeeperStatLabel}>
            ARTIFICIAL / NON-PLANT
          </Text>
          <Text
            style={[
              styles.gatekeeperStatValue,
              { color: artRatio > 28 ? '#DC2626' : PALETTE.brandEmerald },
            ]}
          >
            {artRatio.toFixed(1)}%
          </Text>
          <Text style={styles.gatekeeperStatTarget}>Max allowed: 28%</Text>
        </View>

        <View style={styles.gatekeeperStatCell}>
          <Text style={styles.gatekeeperStatLabel}>LEAF STATUS</Text>
          <Text style={[styles.gatekeeperStatValue, { color: '#DC2626' }]}>
            REJECTED
          </Text>
          <Text style={styles.gatekeeperStatTarget}>No disease assigned</Text>
        </View>
      </View>

      <View style={styles.invalidGuidelinesBlock}>
        <Text style={styles.invalidGuidelinesTitle}>
          Image Guidelines for Accurate Diagnosis:
        </Text>
        <Text style={styles.invalidGuidelineItem}>
          • Position camera 10–20 cm above a real crop leaf
        </Text>
        <Text style={styles.invalidGuidelineItem}>
          • Ensure natural daylight; avoid indoor flash reflections
        </Text>
        <Text style={styles.invalidGuidelineItem}>
          • Keep artificial backgrounds (monitors, clothes) out of frame
        </Text>
      </View>

      <View style={styles.invalidActionsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.invalidActionButton,
            styles.invalidActionPrimary,
            pressed && styles.pressed,
          ]}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry photo capture"
        >
          <Feather name="camera" size={14} color="#FFFFFF" />
          <Text style={styles.invalidActionTextPrimary}>Take Another Photo</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.invalidActionButton,
            styles.invalidActionSecondary,
            pressed && styles.pressed,
          ]}
          onPress={onDemo}
          accessibilityRole="button"
          accessibilityLabel="Try demo leaf sample"
        >
          <Feather name="play" size={14} color={PALETTE.brandEmerald} />
          <Text style={styles.invalidActionTextSecondary}>Try Demo Leaf</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AwaitingLaboratoryCard({
  spray,
  liveLabel,
  liveColor,
}: {
  spray: SprayWeatherSentinelResult;
  liveLabel: string;
  liveColor: string;
}) {
  return (
    <View style={styles.card}>
      <SectionHeading
        eyebrow="DIAGNOSTIC LABORATORY"
        title="Awaiting Crop Leaf Sample"
        subtitle="5 AI pathology agents are online. Upload, drag-and-drop, or pick a sample on the left to begin diagnosis."
        right={
          <View style={styles.enginePill}>
            <View style={styles.enginePillDot} />
            <Text style={styles.enginePillText}>READY TO SCAN</Text>
          </View>
        }
      />

      {/* Clean White/Sage Awaiting Banner */}
      <View style={styles.awaitingBanner}>
        <View style={styles.awaitingIconBox}>
          <MaterialCommunityIcons
            name="microscope"
            size={22}
            color={PALETTE.brandEmerald}
          />
        </View>
        <View style={styles.awaitingBannerBody}>
          <Text style={styles.awaitingBannerTitle}>
            Ready for Cross-Platform Pathology Scan
          </Text>
          <Text style={styles.awaitingBannerText}>
            Dual-engine pixel decoding (HTML5 Canvas + Pure-TS) and Tri-Model Ensemble (Gemini Vision + MobileNetV2 + ResNet50) stand ready.
          </Text>
        </View>
      </View>

      {/* Field Spray Sentinel Status Mini Card */}
      <View style={styles.sprayStatusCard}>
        <View style={styles.weatherHeaderRow}>
          <View style={styles.weatherTitleBlock}>
            <Text style={styles.eyebrow}>FIELD SPRAY SENTINEL STATUS</Text>
            <Text style={[styles.sprayBanner, { color: spray.color }]}>
              {spray.banner}
            </Text>
            <Text style={styles.sprayHeadline}>{spray.headline}</Text>
          </View>
          <View style={styles.openMeteoPill}>
            <LiveTelemetryDot color={liveColor} size={6} />
            <Text style={styles.openMeteoText}>OPEN-METEO {liveLabel}</Text>
          </View>
        </View>
        <Text style={styles.sprayWindow}>Best window: {spray.bestSprayTime}</Text>
      </View>

      {/* 3 Clean Mini Cards */}
      <View style={styles.awaitingCapabilitiesGrid}>
        <View style={styles.capabilityCell}>
          <View style={styles.capabilityIconBox}>
            <Feather name="shield" size={18} color={PALETTE.brandEmerald} />
          </View>
          <Text style={styles.capabilityTitle}>Gatekeeper Shield</Text>
          <Text style={styles.capabilityDesc}>
            Non-leaf objects automatically rejected
          </Text>
        </View>

        <View style={styles.capabilityCell}>
          <View style={styles.capabilityIconBox}>
            <Feather name="activity" size={18} color={PALETTE.brandEmerald} />
          </View>
          <Text style={styles.capabilityTitle}>Chlorophyll Spectrum</Text>
          <Text style={styles.capabilityDesc}>
            Real botanical green-yellow ratio vs artificial spectrum
          </Text>
        </View>

        <View style={styles.capabilityCell}>
          <View style={styles.capabilityIconBox}>
            <Feather name="package" size={18} color={PALETTE.brandEmerald} />
          </View>
          <Text style={styles.capabilityTitle}>Agri-Shop Rx Kit</Text>
          <Text style={styles.capabilityDesc}>
            Acreage-scaled retail pack calculation
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function CropDoctorScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const {
    city,
    weather,
    loading: weatherLoading,
    refreshing,
    error: weatherError,
    selectLocation,
    refresh,
  } = useLiveWeather();
  const detectedGps = useGpsLocation(selectLocation);
  const { diagnosis, setDiagnosis, toggleDiagnosisCureStep } = useCart();
  const { logAppActivity } = useAuth();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [inputSource, setInputSource] = useState<'camera' | 'gallery'>('gallery');
  const [demoCaseId, setDemoCaseId] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] =
    useState<CropSelection>(AUTO_CROP_SELECTION);
  const [customCropName, setCustomCropName] = useState('');
  const [vision, setVision] = useState<VisionPathologyResult | null>(null);
  const [acres, setAcres] = useState(2);
  const [scanning, setScanning] = useState(false);
  const [scanStage, setScanStage] = useState(0);
  const [tracesOpen, setTracesOpen] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [visionSettings, setVisionSettings] =
    useState<VisionApiSettings>(EMPTY_VISION_SETTINGS);
  const [settingsDraft, setSettingsDraft] =
    useState<VisionApiSettings>(EMPTY_VISION_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const webFileInputRef = useRef<HTMLInputElement | null>(null);
  const fileNameRef = useRef<string | null>(null);
  const runIdRef = useRef(0);
  const stageTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearStageTimers = useCallback(() => {
    stageTimers.current.forEach((timer) => clearTimeout(timer));
    stageTimers.current = [];
  }, []);

  const diagnosisCardRef = useRef<any>(null);

  const handleReset = useCallback(() => {
    clearStageTimers();
    setImageUri(null);
    setImageBase64(null);
    setFileName(null);
    fileNameRef.current = null;
    setVision(null);
    setDemoCaseId(null);
    setSelectedCrop(AUTO_CROP_SELECTION);
    setCustomCropName('');
    setScanning(false);
    setScanStage(0);
    if (webFileInputRef.current) {
      webFileInputRef.current.value = '';
    }
  }, [clearStageTimers]);

  useEffect(() => {
    if (vision) {
      const timer = setTimeout(() => {
        if (Platform.OS === 'web' && diagnosisCardRef.current) {
          // @ts-ignore
          diagnosisCardRef.current?.scrollIntoView?.({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [vision]);

  useEffect(() => {
    return () => clearStageTimers();
  }, [clearStageTimers]);

  useEffect(() => {
    let active = true;

    void persistentStorage
      .getItem<VisionApiSettings>(
        VISION_SETTINGS_KEY,
        EMPTY_VISION_SETTINGS
      )
      .then((stored) => {
        if (!active) return;
        setVisionSettings(stored);
        setSettingsDraft(stored);
        configureVisionApiKeys({
          gemini: stored.geminiKey,
          openai: stored.openaiKey,
          geminiModel: stored.geminiModel,
          openaiModel: stored.openaiModel,
        });
      });

    return () => {
      active = false;
    };
  }, []);

  const offlineWeather = useMemo(() => createOfflineWeather(city), [city]);
  const activeWeather = weather ?? offlineWeather;
  const activeCity = weather?.city ?? city;

  const report = useMemo(
    () =>
      vision && vision.isPlantLeaf !== false
        ? runCropDoctorWorkflow({
            vision,
            weather: activeWeather,
            acres,
          })
        : null,
    [vision, activeWeather, acres]
  );

  const spray = useMemo(
    () => report?.spray ?? runSprayWeatherSentinel(activeWeather),
    [report, activeWeather]
  );

  const currentEt0Mm = activeWeather.current.et0TodayMm;
  const next24hRainMm = activeWeather.next24hRainMm;

  const agronomistReport = useMemo(
    () =>
      report && vision
        ? buildCropDoctorAgronomistReport(report, activeCity, {
            et0Mm: currentEt0Mm,
            rainNext24hMm: next24hRainMm,
          })
        : null,
    [activeCity, currentEt0Mm, next24hRainMm, report, vision]
  );

  const savedDiagnosisKey = useRef<string | null>(null);

  useEffect(() => {
    if (
      !report ||
      !vision ||
      vision.isPlantLeaf === false ||
      vision.isHealthy
    ) {
      return;
    }

    const diagnosisKey = `${report.id}:${vision.severity}:${acres}`;

    if (savedDiagnosisKey.current === diagnosisKey) return;

    savedDiagnosisKey.current = diagnosisKey;
    setDiagnosis(
      createDiagnosis(
        {
          disease: vision.diseaseName,
          crop: vision.cropDetected,
          severity:
            vision.severity === 'Critical'
              ? 'High'
              : vision.severity === 'Moderate'
                ? 'Moderate'
                : 'Low',
          confidence: vision.confidencePct,
        },
        'crop-doctor'
      )
    );
  }, [acres, report, setDiagnosis, vision]);

  const activeSample = demoCaseId
    ? CROP_DOCTOR_SAMPLES.find((sample) => sample.id === demoCaseId)
    : null;
  const hasInput = Boolean(imageUri || demoCaseId);
  const isOffline =
    weatherLoading || weather?.source === 'offline' || !weather;
  const liveLabel = weatherLoading
    ? 'SYNCING'
    : isOffline
      ? 'OFFLINE'
      : 'LIVE';
  const liveColor = weatherLoading || isOffline ? '#B45309' : PALETTE.brandEmerald;
  const severityMeta = vision ? SEVERITY_META[vision.severity] : null;
  const severityProgress = vision
    ? getSeverityProgressPct(vision.severity)
    : 0;
  const severityWidth = `${severityProgress}%` as `${number}%`;

  const handleAcresChange = (next: number) => {
    setAcres(
      Math.max(
        FARM_ACRES_MIN,
        Math.min(FARM_ACRES_MAX, Math.round(next))
      )
    );
  };

  const startScan = useCallback(
    async (input: LeafScanInput) => {
      const runId = runIdRef.current + 1;
      runIdRef.current = runId;
      clearStageTimers();
      setScanning(true);
      setScanStage(1);
      setTracesOpen(false);

      stageTimers.current = [330, 660, 990, 1320, 1600].map(
        (delay, index) =>
          setTimeout(() => {
            if (runIdRef.current === runId) {
              setScanStage(index + 2);
            }
          }, delay)
      );

      try {
        const result = await analyzeCropImage(input);
        if (runIdRef.current !== runId) return;

        setVision(result);
        clearStageTimers();
        setScanning(false);
        setScanStage(0);

        if (result.isPlantLeaf) {
          logAppActivity(
            'CROP_SCAN',
            `Leaf Disease Scan: ${result.diseaseName}`,
            `${result.confidencePct.toFixed(1)}% match • ${result.severity} severity • ${result.crop} leaf`,
            result.severity === 'Critical' ? 'Action Required' : 'Completed'
          );
        }
      } catch (err) {
        if (runIdRef.current !== runId) return;
        clearStageTimers();
        setScanning(false);
        setScanStage(0);
        console.error('Crop Doctor scan error:', err);
        Alert.alert(
          'Diagnostic Scan Notice',
          'Could not complete multi-agent analysis. Please try again with a clear photo.'
        );
      }
    },
    [clearStageTimers]
  );

  const handleWebFile = async (file: File) => {
    if (scanning) return;
    try {
      const extractedFileName = file.name;
      fileNameRef.current = extractedFileName;
      setFileName(extractedFileName);
      setVision(null);
      setDemoCaseId(null);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        setImageUri(dataUrl);
        setImageBase64(b64);
        setInputSource('gallery');
        setDemoCaseId(null);
        setVision(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Web file read error:', err);
    }
  };

  const pickImage = async () => {
    if (scanning) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        let b64 = asset.base64 ?? null;
        if (!b64 && asset.uri) {
          b64 = await ensureBase64(asset.uri);
        }
        let resolvedFileName = asset.fileName || null;
        if (!resolvedFileName && asset.uri) {
          const rawName = asset.uri.split('/').pop()?.split('?')[0];
          if (rawName && rawName.includes('.')) {
            try {
              resolvedFileName = decodeURIComponent(rawName);
            } catch {
              resolvedFileName = rawName;
            }
          }
        }
        const extractedFileName =
          resolvedFileName || `gallery_leaf_${Date.now()}.jpg`;
        fileNameRef.current = extractedFileName;
        setVision(null);
        setDemoCaseId(null);
        setImageUri(asset.uri);
        setImageBase64(b64);
        setFileName(extractedFileName);
        setInputSource('gallery');
      }
    } catch (caught) {
      console.error('Pick image error:', caught);
      Alert.alert(
        'Upload Failed',
        'Could not load the image from your photo library.'
      );
    }
  };

  const takePhoto = async () => {
    if (scanning) return;
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access to photograph the affected leaf.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.65,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        let b64 = asset.base64 ?? null;
        if (!b64 && asset.uri) {
          b64 = await ensureBase64(asset.uri);
        }
        const extractedFileName =
          asset.fileName || `field_leaf_${Date.now()}.jpg`;
        fileNameRef.current = extractedFileName;
        setVision(null);
        setDemoCaseId(null);
        setImageUri(asset.uri);
        setImageBase64(b64);
        setFileName(extractedFileName);
        setInputSource('camera');
      }
    } catch (caught) {
      console.error('Crop camera error:', caught);
      Alert.alert(
        'Camera Unavailable',
        'Could not open the camera. Please try again.'
      );
    }
  };

  const customCropHint =
    selectedCrop === OTHER_CROP_SELECTION
      ? customCropName.trim()
      : '';

  const handleAnalyze = () => {
    if (scanning) return;

    if (
      selectedCrop === OTHER_CROP_SELECTION &&
      customCropHint.length < 2
    ) {
      Alert.alert(
        'Name the Crop',
        'Type the crop name, such as Papaya, Ginger, Watermelon or Rose, so the dosage and disease profile can be tailored.'
      );
      return;
    }

    if (demoCaseId) {
      void startScan({
        source: 'demo',
        demoCaseId,
        cropSelection: selectedCrop,
        customCropName: customCropHint || undefined,
      });
      return;
    }

    if (!imageUri) {
      Alert.alert(
        'Add a Leaf Photo',
        'Upload a crop image or take a photo first. You can also tap a demo sample below.'
      );
      return;
    }

    void startScan({
      source: inputSource,
      imageUri,
      imageBase64,
      fileName: fileNameRef.current || fileName || undefined,
      cropSelection: selectedCrop,
      customCropName: customCropHint || undefined,
    });
  };

  const handleSamplePress = (sample: CropDoctorSample) => {
    if (scanning) return;

    fileNameRef.current = null;
    setDemoCaseId(sample.id);
    setImageUri(null);
    setImageBase64(null);
    setFileName(null);
    setSelectedCrop(AUTO_CROP_SELECTION);
    setCustomCropName('');
    setVision(null);
    void startScan({
      source: 'demo',
      demoCaseId: sample.id,
      cropSelection: AUTO_CROP_SELECTION,
    });
  };

  const handleCropChange = (
    selection: CropSelection,
    rescan = false,
    quick = false
  ) => {
    setSelectedCrop(selection);

    if (selection !== OTHER_CROP_SELECTION) {
      setCustomCropName('');
    }

    if (
      !rescan ||
      scanning ||
      demoCaseId ||
      selection === OTHER_CROP_SELECTION
    ) {
      return;
    }

    if (quick) {
      const quickResult = reanalyzeCropSelection(selection);
      if (quickResult) {
        setVision(quickResult);
        return;
      }
    }

    if (!imageUri) return;

    void startScan({
      source: inputSource,
      imageUri,
      imageBase64,
      fileName: fileNameRef.current || fileName || undefined,
      cropSelection: selection,
    });
  };

  const applyCustomCrop = () => {
    const name = customCropName.trim();

    if (name.length < 2) {
      Alert.alert(
        'Name the Crop',
        'Type at least two characters, such as Papaya, Ginger or Rose.'
      );
      return;
    }

    setSelectedCrop(OTHER_CROP_SELECTION);

    if (scanning || demoCaseId) return;

    const quickResult = reanalyzeCropSelection(
      OTHER_CROP_SELECTION,
      name
    );

    if (quickResult) {
      setVision(quickResult);
      return;
    }

    if (!imageUri) return;

    void startScan({
      source: inputSource,
      imageUri,
      imageBase64,
      fileName: fileNameRef.current || fileName || undefined,
      cropSelection: OTHER_CROP_SELECTION,
      customCropName: name,
    });
  };

  const openVisionSettings = () => {
    setSettingsDraft(visionSettings);
    setSettingsOpen(true);
  };

  const saveVisionSettings = () => {
    const next: VisionApiSettings = {
      geminiKey: settingsDraft.geminiKey.trim(),
      openaiKey: settingsDraft.openaiKey.trim(),
      geminiModel: settingsDraft.geminiModel.trim(),
      openaiModel: settingsDraft.openaiModel.trim(),
    };

    setVisionSettings(next);
    configureVisionApiKeys({
      gemini: next.geminiKey,
      openai: next.openaiKey,
      geminiModel: next.geminiModel,
      openaiModel: next.openaiModel,
    });
    setSettingsOpen(false);
    void persistentStorage.setItem(VISION_SETTINGS_KEY, next);
  };

  const clearVisionSettings = () => {
    setSettingsDraft(EMPTY_VISION_SETTINGS);
    setVisionSettings(EMPTY_VISION_SETTINGS);
    configureVisionApiKeys({ gemini: '', openai: '' });
    void persistentStorage.removeItem(VISION_SETTINGS_KEY);
    setSettingsOpen(false);
  };

  const openAgriShop = (productId?: string) => {
    if (!vision) {
      router.push(agriShopRoute());
      return;
    }

    const params: Parameters<typeof agriShopRoute>[0] = {
      disease: vision.diseaseName,
      crop: vision.cropDetected,
      severity: vision.severity,
      confidence: vision.confidencePct.toFixed(1),
    };

    if (productId) {
      params.products = productId;
    } else if (report && report.rx && report.rx.items && report.rx.items.length > 0) {
      params.products = report.rx.items.map((i) => i.product.id).join(',');
      params.quantities = report.rx.items.map((i) => i.quantity).join(',');
      params.kit = `${vision.diseaseName} Cure Bundle`;
    }

    router.push(agriShopRoute(params));
  };

  /* ─── Sub-Card Renderers ─────────────────────────────────────────── */

  const renderLocationCard = () => (
    <View style={styles.card}>
      <View style={styles.locationHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>SYNCED FIELD LOCATION</Text>
          <Text style={styles.locationCityName}>
            {getCityDisplayName(activeCity)}
          </Text>
          <View style={styles.locationMetaRow}>
            {activeCity.isGpsDetected ? (
              <View style={styles.gpsBadge}>
                <Feather name="navigation" size={11} color={PALETTE.brandEmerald} />
                <Text style={styles.gpsBadgeText}>LIVE GPS</Text>
              </View>
            ) : null}
            <View style={styles.livePill}>
              <LiveTelemetryDot color={liveColor} size={6} />
              <Text style={[styles.livePillText, { color: liveColor }]}>
                {liveLabel}
              </Text>
            </View>
          </View>
          <Text style={styles.locationMeta}>
            {activeWeather.current.temperatureC.toFixed(1)}°C ·{' '}
            {activeWeather.current.windKmph.toFixed(1)} km/h wind ·{' '}
            {activeWeather.next24hRainProbabilityPct}% rain
          </Text>
          {weather ? (
            <Text style={styles.locationSync}>
              Synced {formatFetchedAt(weather.fetchedAt)}
            </Text>
          ) : null}
        </View>

        <GpsLocationButton
          compact
          loading={detectedGps.detecting}
          onPress={() => {
            void detectedGps.detect();
          }}
        />
      </View>

      {detectedGps.message ? (
        <Text style={styles.gpsMessage}>{detectedGps.message}</Text>
      ) : null}
      {weatherError ? (
        <Text style={styles.weatherError}>{weatherError}</Text>
      ) : null}
    </View>
  );

  const renderLeafVisionInputCard = () => (
    <View style={styles.card}>
      <SectionHeading
        eyebrow="LEAF VISION INPUT"
        title="Scan or upload a crop leaf"
        subtitle="Pixel-level lesion segmentation works on any crop. Pick a crop to lock the classifier, or leave it on auto-detect."
        right={
          <View style={styles.headerToolsRow}>
            <View style={styles.enginePill}>
              <View style={styles.enginePillDot} />
              <Text style={styles.enginePillText}>AI LEAF SCANNER</Text>
            </View>
            <Pressable
              onPress={openVisionSettings}
              style={({ pressed }) => [
                styles.engineSettingsButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open vision API settings"
            >
              <Feather name="settings" size={15} color={PALETTE.brandEmerald} />
            </Pressable>
          </View>
        }
      />

      {Platform.OS === 'web' ? (
        <input
          ref={webFileInputRef as any}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e: any) => {
            const file = e.target.files?.[0];
            if (file) void handleWebFile(file);
            e.target.value = '';
          }}
        />
      ) : null}

      <View style={styles.selectorHeaderRow}>
        <Text style={styles.selectorLabel}>CROP SELECTOR</Text>
        <Text style={styles.selectorHint}>
          {selectedCrop === AUTO_CROP_SELECTION
            ? 'Auto · morphology + syndrome'
            : 'Locked · overrides vision crop'}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.selectorRow}
      >
        {CROP_SELECTOR_OPTIONS.map((option) => {
          const active = selectedCrop === option;

          return (
            <Pressable
              key={option}
              onPress={() => handleCropChange(option, vision !== null, true)}
              style={({ pressed }) => [
                styles.selectorChip,
                active && styles.selectorChipActive,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[
                  styles.selectorChipText,
                  active && styles.selectorChipTextActive,
                ]}
              >
                {cropSelectorLabel(option, vision?.cropDetected, false)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {selectedCrop === AUTO_CROP_SELECTION && vision ? (
        <View style={styles.autoDetectedPill}>
          <View style={styles.autoDetectedDot} />
          <Text style={styles.autoDetectedText}>
            Auto (Detected: {vision.cropDetected})
          </Text>
          {vision.leafSyndrome ? (
            <Text style={styles.autoDetectedSyndrome}>
              {vision.leafSyndrome.label}
            </Text>
          ) : null}
        </View>
      ) : null}

      {renderCustomCropInput()}

      {/* Clean Drag & Drop / Upload Zone with 48x48 icon */}
      <View
        style={[
          styles.desktopDropZone,
          isDragActive && styles.desktopDropZoneActive,
        ]}
        {...(Platform.OS === 'web'
          ? {
              onDragOver: (e: any) => {
                e.preventDefault();
                setIsDragActive(true);
              },
              onDragLeave: (e: any) => {
                e.preventDefault();
                setIsDragActive(false);
              },
              onDrop: (e: any) => {
                e.preventDefault();
                setIsDragActive(false);
                const file = e.dataTransfer?.files?.[0];
                if (file) void handleWebFile(file);
              },
            }
          : {})}
      >
        <Pressable
          style={styles.dropZonePressable}
          onPress={() => {
            if (Platform.OS === 'web' && webFileInputRef.current) {
              webFileInputRef.current.click();
            } else {
              void pickImage();
            }
          }}
          disabled={scanning}
          accessibilityRole="button"
          accessibilityLabel="Click to upload crop image or drag and drop"
        >
          <View style={styles.uploadIconBox}>
            <Feather name="upload-cloud" size={24} color={PALETTE.brandEmerald} />
          </View>
          <Text style={styles.dropZoneTitle}>
            {isDragActive
              ? 'Drop Leaf Photo Here'
              : 'Upload Crop Image (Drag & Drop or Browse)'}
          </Text>
          <Text style={styles.dropZoneSubtitle}>
            JPG or PNG leaf macro · 128×128 pixel scan + vision AI
          </Text>
        </Pressable>

        <View style={styles.desktopCameraRow}>
          <Pressable
            style={({ pressed }) => [
              styles.desktopCameraButton,
              pressed && styles.pressed,
              scanning && styles.disabled,
            ]}
            onPress={takePhoto}
            disabled={scanning}
            accessibilityRole="button"
            accessibilityLabel="Take a photo with camera"
          >
            <Feather name="camera" size={15} color={PALETTE.brandEmerald} />
            <Text style={styles.desktopCameraText}>Take Photo with Camera</Text>
          </Pressable>
        </View>
      </View>

      {/* Image Preview Box if image present */}
      <View style={styles.previewCard}>
        <View style={styles.previewMedia}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          ) : (
            <MaterialCommunityIcons
              name="leaf"
              size={28}
              color={PALETTE.brandEmerald}
            />
          )}
        </View>
        <View style={styles.previewBody}>
          <Text style={styles.previewEyebrow}>
            {scanning
              ? 'MULTI-AGENT SCAN IN PROGRESS'
              : vision
                ? 'LEAF SAMPLE ANALYSED'
                : hasInput
                  ? 'READY FOR ANALYSIS'
                  : 'AWAITING LEAF SAMPLE'}
          </Text>
          <Text style={styles.previewTitle}>
            {activeSample
              ? activeSample.label
              : fileName || (imageUri ? 'Field leaf photo' : 'Upload or capture a leaf')}
          </Text>
          {vision ? (
            <View
              style={[
                styles.leftVerdictBadge,
                {
                  backgroundColor: vision.isHealthy ? '#EDF5EE' : '#FEF2F2',
                  borderColor: vision.isHealthy ? '#BFE3BD' : '#FECACA',
                },
              ]}
            >
              <Feather
                name={vision.isHealthy ? 'check-circle' : 'alert-circle'}
                size={14}
                color={vision.isHealthy ? '#15803D' : '#B91C1C'}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.leftVerdictBadgeTitle,
                    { color: vision.isHealthy ? '#15803D' : '#B91C1C' },
                  ]}
                  numberOfLines={1}
                >
                  {vision.isHealthy ? 'Healthy Leaf — No Disease' : vision.diseaseName}
                </Text>
                <Text
                  style={[
                    styles.leftVerdictBadgeSub,
                    { color: vision.isHealthy ? '#166534' : '#991B1B' },
                  ]}
                  numberOfLines={1}
                >
                  {vision.cropDetected} • {vision.confidencePct.toFixed(1)}% match • {formatNumber(vision.infectedAreaPercent, 1)}% lesion
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.previewText}>
              {scanning
                ? SCAN_STAGES[Math.min(scanStage, SCAN_STAGES.length) - 1]
                : hasInput
                  ? `${fileName ? `${fileName} staged · ` : ''}Ready for analysis. Click "Analyze Crop" below to run diagnostic scan.`
                  : 'Use a clear, well-lit photo of a single affected leaf. A plain background improves pixel segmentation.'}
            </Text>
          )}

          {scanning ? (
            <View style={styles.scanProgressRow}>
              <ActivityIndicator size="small" color={PALETTE.brandEmerald} />
              <Text style={styles.scanProgressText}>Agents working…</Text>
            </View>
          ) : null}

          {(hasInput || vision) && !scanning ? (
            <Pressable
              onPress={handleReset}
              style={({ pressed }) => [
                styles.resetLeafBtn,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Upload Different Leaf / Reset"
            >
              <Feather name="refresh-cw" size={13} color="#475569" />
              <Text style={styles.resetLeafBtnText}>Upload Different Leaf / Reset</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Solid Primary Action Button */}
      <ActionButton
        label={scanning ? 'Analyzing Leaf Sample…' : 'Analyze Crop'}
        icon="search"
        variant="primary"
        loading={scanning}
        fullWidth
        onPress={handleAnalyze}
        accessibilityLabel="Analyze crop leaf"
      />
    </View>
  );

  const renderDemoSamplesCard = () => {
    // 2. Completely Hide the Demo Samples Section Once a Leaf is Uploaded or Analyzed
    if (Boolean(imageUri || vision || demoCaseId)) {
      return null;
    }

    return (
      <View style={styles.demoSamplesCard}>
        <View style={styles.demoCardHeader}>
          <View style={styles.demoEyebrowBadge}>
            <Text style={styles.demoEyebrowBadgeText}>DEMO SAMPLES • FOR TESTING ONLY</Text>
          </View>
          <Text style={styles.demoCardTitle}>
            {"Don't have a leaf photo right now? Try a sample below"}
          </Text>
          <Text style={styles.demoCardSubtitle}>
            Click any sample preset below to test how Crop Doctor diagnoses diseases offline.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.demoRow}
        >
          {CROP_DOCTOR_SAMPLES.map((sample) => (
            <SampleCard
              key={sample.id}
              sample={sample}
              active={demoCaseId === sample.id}
              disabled={scanning}
              onPress={() => handleSamplePress(sample)}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderDiagnosisCard = () => {
    if (!vision) return null;
    const isDiseased = !vision.isHealthy;

    return (
      <View ref={diagnosisCardRef} style={styles.card}>
        <SectionHeading
          eyebrow="DIAGNOSIS RESULT"
          title="Universal vision verdict"
          subtitle="Healthy-vs-diseased classification from real pixel segmentation and the tri-model ensemble."
          right={
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceBadgeText}>
                {vision.confidencePct.toFixed(1)}% MATCH
              </Text>
            </View>
          }
        />

        {/* 1. Top Hero Diagnosis Verdict Banner (#1 Element Inside DIAGNOSIS RESULT Card) */}
        <View
          style={[
            styles.heroVerdictCard,
            {
              backgroundColor: isDiseased ? '#FEF2F2' : '#ECFDF5',
              borderColor: isDiseased ? '#DC2626' : '#15803D',
            },
          ]}
        >
          {/* Status Header Bar */}
          <View
            style={[
              styles.heroStatusHeader,
              { backgroundColor: isDiseased ? '#DC2626' : '#15803D' },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather
                name={isDiseased ? 'alert-triangle' : 'check-circle'}
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.heroStatusHeaderText}>
                {isDiseased
                  ? 'PATHOGEN DETECTED • URGENT ATTENTION'
                  : 'HEALTHY CROP LEAF • NO DISEASE DETECTED'}
              </Text>
            </View>
            <Text
              style={[
                styles.heroStatusHeaderRight,
                { color: isDiseased ? '#FEE2E2' : '#D1FAE5' },
              ]}
            >
              AI Pathology Lab
            </Text>
          </View>

          {/* Hero Content Body */}
          <View style={styles.heroVerdictBody}>
            <Text
              style={[
                styles.heroDiseaseName,
                { color: isDiseased ? '#7F1D1D' : '#0F291E' },
              ]}
            >
              {isDiseased
                ? vision.diseaseName
                : `Healthy ${vision.cropDetected} Foliage`}
            </Text>

            <Text
              style={[
                styles.heroScientificName,
                { color: isDiseased ? '#991B1B' : '#047857' },
              ]}
            >
              {isDiseased
                ? `${vision.scientificName} • ${vision.pathogenType} Pathogen`
                : 'Clean Foliage • Optimal Cellular Chlorophyll & Leaf Vigour'}
            </Text>

            {/* 3 Highlight Pills in a Row */}
            <View style={styles.heroPillsRow}>
              <View style={styles.heroCropPill}>
                <Text style={styles.heroCropPillText}>
                  Detected Crop: {vision.cropDetected}
                </Text>
              </View>

              <View
                style={[
                  styles.heroSeverityPill,
                  {
                    backgroundColor: isDiseased
                      ? severityMeta?.color ?? '#DC2626'
                      : '#15803D',
                  },
                ]}
              >
                <Text style={styles.heroSeverityPillText}>
                  Severity: {isDiseased ? vision.severity : 'Healthy'}
                </Text>
              </View>

              <View
                style={[
                  styles.heroMetricsPill,
                  { borderColor: isDiseased ? '#FECACA' : '#A7F3D0' },
                ]}
              >
                <Text
                  style={[
                    styles.heroMetricsPillText,
                    { color: isDiseased ? '#7F1D1D' : '#065F46' },
                  ]}
                >
                  [{vision.confidencePct.toFixed(1)}%] Ensemble Match • [{formatNumber(vision.infectedAreaPercent, 1)}%] Lesion Area
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2. Disease Severity Progress Bar */}
        <View style={styles.severityBlockHero}>
          <View style={styles.severityLabelRow}>
            <Text style={styles.severityLabel}>DISEASE SEVERITY LEVEL</Text>
            <View
              style={[
                styles.severityPill,
                { backgroundColor: severityMeta?.background },
              ]}
            >
              <Text
                style={[
                  styles.severityPillText,
                  { color: severityMeta?.color },
                ]}
              >
                {severityMeta?.label}
              </Text>
            </View>
          </View>

          <View style={styles.severityTrack}>
            <View
              style={[
                styles.severityFill,
                {
                  width: severityWidth,
                  backgroundColor: severityMeta?.color,
                },
              ]}
            />
          </View>
        </View>

        {/* 3. Pixel-Level Lesion Segmentation & Biomarkers Bar */}
        <View style={styles.biomarkerSection}>
          <Text style={styles.biomarkerHeading}>
            PIXEL-LEVEL LESION SEGMENTATION & BIOMARKERS
          </Text>
          <BiomarkerBar biomarkers={vision.biomarkers} />
        </View>

        {/* 4. Consensus Badge */}
        <View style={styles.consensusRow}>
          <Feather name="check-circle" size={13} color={PALETTE.brandEmerald} />
          <Text style={styles.consensusText}>
            5-agent consensus ·{' '}
            {vision.critic.verdict === 'vetoed'
              ? 'critic veto applied'
              : vision.critic.verdict === 'flagged'
                ? 'critic flagged for review'
                : 'all audits passed'}{' '}
            · {vision.ensemble.candidateClassCount} crop-locked classes
          </Text>
        </View>

        {/* 5. QUICK CROP LOCK & CUSTOM CROP (Clean secondary section below main verdict) */}
        {vision.source !== 'demo' ? (
          <View style={styles.reclassifySection}>
            <View style={styles.reclassifyHeaderRow}>
              <Feather name="refresh-cw" size={13} color={PALETTE.brandEmerald} />
              <Text style={styles.reclassifyHeading}>
                Wrong crop auto-detected? Re-lock crop species below
              </Text>
            </View>
            <Text style={styles.reclassifySub}>
              Currently locked to:{' '}
              <Text style={{ fontWeight: '700', color: '#0F291E' }}>
                {vision.cropDetected}
              </Text>
              . Tap any crop pill below to instantly re-run tri-model ensemble classification:
            </Text>

            <View style={styles.selectorWrapContainer}>
              {/* Dynamic Highlighted Pill for Detected Plant Species */}
              {vision?.cropDetected ? (
                <Pressable
                  key="quick-detected-crop-pill"
                  onPress={() => handleCropChange(AUTO_CROP_SELECTION, true, true)}
                  disabled={scanning}
                  style={({ pressed }) => [
                    styles.selectorChip,
                    styles.detectedCropChip,
                    selectedCrop === AUTO_CROP_SELECTION && styles.detectedCropChipActive,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Detected crop ${vision.cropDetected}`}
                  accessibilityState={{ selected: selectedCrop === AUTO_CROP_SELECTION }}
                >
                  <View
                    style={[
                      styles.detectedDot,
                      selectedCrop === AUTO_CROP_SELECTION && styles.detectedDotActive,
                    ]}
                  />
                  <Text
                    style={[
                      styles.selectorChipText,
                      styles.detectedCropChipText,
                      selectedCrop === AUTO_CROP_SELECTION && styles.detectedCropChipTextActive,
                    ]}
                  >
                    Detected: {vision.cropDetected}
                  </Text>
                </Pressable>
              ) : null}

              {CROP_SELECTOR_OPTIONS.map((option) => {
                const active = selectedCrop === option;

                return (
                  <Pressable
                    key={`quick-${option}`}
                    onPress={() => handleCropChange(option, true, true)}
                    disabled={scanning}
                    style={({ pressed }) => [
                      styles.selectorChip,
                      active && styles.selectorChipActive,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Quick lock crop ${option}`}
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[
                        styles.selectorChipText,
                        active && styles.selectorChipTextActive,
                      ]}
                    >
                      {cropSelectorLabel(option, vision?.cropDetected, true)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {renderCustomCropInput()}
          </View>
        ) : null}

        {selectedCrop === AUTO_CROP_SELECTION &&
        !vision.isHealthy &&
        vision.autoDetection ? (
          <View style={styles.autoDetectionPanel}>
            <View style={styles.autoDetectionHeader}>
              <Feather
                name="layers"
                size={13}
                color={PALETTE.brandEmerald}
              />
              <Text style={styles.autoDetectionTitle}>
                AUTO-DETECTION EVIDENCE
              </Text>
              <Text style={styles.autoDetectionRule}>
                {vision.autoDetection.rule.replace(/-/g, ' ').toUpperCase()}
              </Text>
            </View>

            <Text style={styles.autoDetectionNote}>
              {vision.autoDetection.note}
            </Text>

            {vision.autoDetection.alternatives.length > 0 ? (
              <View style={styles.autoMatchRow}>
                {vision.autoDetection.alternatives.map((match, index) => (
                  <View
                    key={`${match.crop}-${index}`}
                    style={styles.autoMatchCard}
                  >
                    <View style={styles.autoMatchTopRow}>
                      <Text style={styles.autoMatchRank}>
                        ALT {index + 1}
                      </Text>
                      <Text style={styles.autoMatchScore}>
                        {formatNumber(match.confidencePct, 1)}%
                      </Text>
                    </View>
                    <Text style={styles.autoMatchCrop}>{match.crop}</Text>
                    <Text
                      style={styles.autoMatchDisease}
                      numberOfLines={2}
                    >
                      {match.diseaseName}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  };

  const renderCureCard = () => {
    if (!report || !vision || vision.isHealthy) return null;

    const checkedCureSteps = new Set(diagnosis?.checkedCureSteps ?? []);

    return (
      <View style={styles.card}>
        <SectionHeading
          eyebrow="4-STEP CURE PROTOCOL"
          title="Pathologist-verified action plan"
          subtitle="Specific dosages, application windows, and Agri-Shop products matched to this disease."
        />

        <View style={styles.cureStepsList}>
          {report.cure.steps.map((step, index) => (
            <CureStepCard
              key={step.step}
              step={step}
              isLast={index === report.cure.steps.length - 1}
              checked={checkedCureSteps.has(step.key)}
              onToggle={() => toggleDiagnosisCureStep(step.key)}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderSprayCard = () => (
    <View style={styles.card}>
      <SectionHeading
        eyebrow="FIELD SPRAY SENTINEL"
        title="Real-time spray window safety"
        subtitle="Wind drift, leaf evaporation, rain wash-off risk computed from live Open-Meteo telemetry."
        right={
          <View style={styles.openMeteoPill}>
            <LiveTelemetryDot color={liveColor} size={6} />
            <Text style={styles.openMeteoText}>OPEN-METEO {liveLabel}</Text>
          </View>
        }
      />

      <View
        style={[
          styles.sprayStatusCard,
          { borderColor: `${spray.color}33`, marginTop: 6 },
        ]}
      >
        <Text style={[styles.sprayBanner, { color: spray.color }]}>
          {spray.banner}
        </Text>
        <Text style={styles.sprayHeadline}>{spray.headline}</Text>
        <Text style={styles.sprayWindow}>Best window: {spray.bestSprayTime}</Text>
      </View>

      <View style={styles.weatherMetricsGrid}>
        <View style={styles.weatherMetricCell}>
          <Text style={styles.weatherMetricLabel}>TEMP</Text>
          <Text style={styles.weatherMetricValue}>
            {spray.metrics.temperatureC.toFixed(1)}°C
          </Text>
        </View>
        <View style={styles.weatherMetricCell}>
          <Text style={styles.weatherMetricLabel}>HUMIDITY</Text>
          <Text style={styles.weatherMetricValue}>
            {spray.metrics.humidityPct}%
          </Text>
        </View>
        <View style={styles.weatherMetricCell}>
          <Text style={styles.weatherMetricLabel}>WIND</Text>
          <Text style={styles.weatherMetricValue}>
            {spray.metrics.windKmph.toFixed(1)} km/h
          </Text>
        </View>
        <View style={styles.weatherMetricCell}>
          <Text style={styles.weatherMetricLabel}>RAIN 24H</Text>
          <Text style={styles.weatherMetricValue}>
            {spray.metrics.todayRainProb}%
          </Text>
        </View>
      </View>
    </View>
  );

  const renderRxCard = () => {
    if (!report || !report.rx || !report.rx.items || report.rx.items.length === 0) return null;
    return (
      <View style={styles.card}>
        <SectionHeading
          eyebrow="RECOMMENDED FROM AGRI-SHOP"
          title="Acreage-scaled treatment kit"
          subtitle="Direct verified inputs prescribed for this disease diagnosis."
          right={
            <View style={styles.acreageControl}>
              <Pressable
                onPress={() => handleAcresChange(acres - 1)}
                style={styles.acreageButton}
                disabled={acres <= FARM_ACRES_MIN}
              >
                <Text style={styles.acreageButtonText}>−</Text>
              </Pressable>
              <Text style={styles.acreageDisplay}>{acres} ac</Text>
              <Pressable
                onPress={() => handleAcresChange(acres + 1)}
                style={styles.acreageButton}
                disabled={acres >= FARM_ACRES_MAX}
              >
                <Text style={styles.acreageButtonText}>+</Text>
              </Pressable>
            </View>
          }
        />

        <View style={styles.rxGrid}>
          {report.rx.items.map((item) => (
            <RxCard
              key={item.product.id}
              item={item}
              onBuy={() => openAgriShop(item.product.id)}
            />
          ))}
        </View>

        <ActionButton
          label="Order Full Treatment Kit in Agri-Shop"
          icon="shopping-bag"
          variant="primary"
          fullWidth
          onPress={() => openAgriShop()}
          accessibilityLabel="Order complete cure kit in Agri-Shop"
        />
      </View>
    );
  };

  const renderTracesCard = () => {
    if (!report) return null;
    return (
      <View style={styles.card}>
        <Pressable
          style={styles.traceToggleRow}
          onPress={() => setTracesOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityLabel="Toggle audit traces"
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>CONSENSUS AUDIT TRAIL</Text>
            <Text style={styles.sectionTitle}>5 AI Pathology Trace Logs</Text>
          </View>
          <Feather
            name={tracesOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={PALETTE.textMuted}
          />
        </Pressable>

        {tracesOpen && (
          <View style={styles.traceList}>
            {report.traces.map((trace, idx) => (
              <View key={`${trace.agent}-${idx}`} style={styles.traceItem}>
                <View style={styles.traceHeaderRow}>
                  <Text style={styles.traceAgentName}>{trace.agent}</Text>
                  <View style={styles.traceStatusBadge}>
                    <Text style={styles.traceStatusText}>{trace.status}</Text>
                  </View>
                </View>
                <Text style={styles.traceStepText}>{trace.step}</Text>
                <Text style={styles.traceDetailText}>{trace.detail}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderHowItWorksCard = () => (
    <View style={styles.card}>
      <SectionHeading
        eyebrow="HOW IT WORKS"
        title="5 agents, one leaf scan"
        subtitle="Vision, spatial morphology, calibrated ensemble, pathology critic and cure logistics verify every diagnosis."
      />

      <View style={styles.agentIntroList}>
        {(Object.keys(AGENT_ICONS) as CropDoctorAgentName[]).map((agent) => {
          const meta = AGENT_ICONS[agent];
          const copy: Record<CropDoctorAgentName, string> = {
            VisionOracleAgent:
              'Segments leaf pixels, fuses Gemini/backend/offline vision and locks the crop from explicit selection or evidence.',
            MorphologySpatialAgent:
              'Builds an 8×8 spatial grid and measures mildew, blight halo, rust, viral mosaic, aspect ratio and morphology.',
            EnsembleClassifierAgent:
              'Applies a hard crop mask, temperature-calibrated MobileNetV2/ResNet50 soft-voting and ranks crop-compatible diseases.',
            PathologyCriticAgent:
              'Audits cross-crop contradictions, dominant biomarkers, lesion burden and pathogen consistency.',
            AgriShopCureAgent:
              'Schedules a weather-safe 4-step cure, scales product packs to acreage and pins the kit in Agri-Shop.',
          };

          return (
            <View key={agent} style={styles.agentIntroRow}>
              <View style={styles.agentIconBox}>
                <Feather name={meta.icon} size={16} color={PALETTE.brandEmerald} />
              </View>
              <View style={styles.agentIntroText}>
                <Text style={styles.agentIntroName}>{meta.name}</Text>
                <Text style={styles.agentIntroCopy}>{copy[agent]}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderCustomCropInput = () => {
    return (
      <View style={styles.customCropCard}>
        <View style={styles.customCropHeadingRow}>
          <Feather
            name="edit-3"
            size={13}
            color={PALETTE.brandEmerald}
          />
          <Text style={styles.customCropTitle}>
            {selectedCrop === OTHER_CROP_SELECTION
              ? 'LOCKED CUSTOM CROP'
              : 'OR SPECIFY ANY CUSTOM CROP'}
          </Text>
          {selectedCrop === OTHER_CROP_SELECTION && customCropName ? (
            <View style={styles.customCropBadge}>
              <Text style={styles.customCropBadgeText}>Locked: {customCropName}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.customCropInputRow}>
          <TextInput
            value={customCropName}
            onChangeText={(text) => {
              setCustomCropName(text);
              if (text.length > 0 && selectedCrop !== OTHER_CROP_SELECTION) {
                setSelectedCrop(OTHER_CROP_SELECTION);
              }
            }}
            onSubmitEditing={applyCustomCrop}
            placeholder="Other Crop (Type name... e.g. Papaya, Watermelon, Ginger, Rose)"
            placeholderTextColor="#8A9A8F"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            style={styles.customCropInput}
            accessibilityLabel="Custom crop name"
          />
          <Pressable
            onPress={applyCustomCrop}
            disabled={scanning || customCropName.trim().length < 2}
            style={({ pressed }) => [
              styles.customCropApply,
              (scanning || customCropName.trim().length < 2) &&
                styles.disabled,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Apply custom crop and rescan"
          >
            <Feather
              name="arrow-right"
              size={15}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
        <Text style={styles.customCropHint}>
          Type any custom plant name to tailor the pathology diagnosis, pathogen identification, and agrochemical dosages.
        </Text>
      </View>
    );
  };

  const renderVisionSettingsModal = () => {
    const geminiActive = Boolean(
      visionSettings.geminiKey ||
        process.env.EXPO_PUBLIC_GEMINI_API_KEY
    );
    const openAiActive = Boolean(
      visionSettings.openaiKey ||
        process.env.EXPO_PUBLIC_OPENAI_API_KEY
    );

    return (
      <Modal
        visible={settingsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsOpen(false)}
      >
        <View style={styles.settingsOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSettingsOpen(false)}
            accessibilityLabel="Close vision API settings"
          />
          <View style={styles.settingsCard}>
            <View style={styles.settingsHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingsEyebrow}>
                  VISION ENGINE CONFIGURATION
                </Text>
                <Text style={styles.settingsTitle}>
                  Bring your own API key
                </Text>
              </View>
              <Pressable
                onPress={() => setSettingsOpen(false)}
                style={styles.settingsClose}
                accessibilityRole="button"
                accessibilityLabel="Close settings"
              >
                <Feather name="x" size={18} color="#405248" />
              </Pressable>
            </View>

            <Text style={styles.settingsCopy}>
              Optional. Keys stay on this device and are sent only to the
              selected provider. Without a key, the offline pixel engine and
              Pollinations fallback remain active.
            </Text>

            <View style={styles.settingsProviderRow}>
              <View
                style={[
                  styles.settingsStatusPill,
                  geminiActive && styles.settingsStatusPillActive,
                ]}
              >
                <View
                  style={[
                    styles.settingsStatusDot,
                    geminiActive && styles.settingsStatusDotActive,
                  ]}
                />
                <Text style={styles.settingsStatusText}>
                  Gemini {geminiActive ? 'ready' : 'not set'}
                </Text>
              </View>
              <View
                style={[
                  styles.settingsStatusPill,
                  openAiActive && styles.settingsStatusPillActive,
                ]}
              >
                <View
                  style={[
                    styles.settingsStatusDot,
                    openAiActive && styles.settingsStatusDotActive,
                  ]}
                />
                <Text style={styles.settingsStatusText}>
                  OpenAI {openAiActive ? 'ready' : 'not set'}
                </Text>
              </View>
            </View>

            <Text style={styles.settingsFieldLabel}>GEMINI API KEY</Text>
            <TextInput
              value={settingsDraft.geminiKey}
              onChangeText={(value) =>
                setSettingsDraft((current) => ({
                  ...current,
                  geminiKey: value,
                }))
              }
              placeholder="AIza..."
              placeholderTextColor="#8A9A8F"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              style={styles.settingsInput}
            />

            <Text style={styles.settingsFieldLabel}>GEMINI MODEL</Text>
            <TextInput
              value={settingsDraft.geminiModel}
              onChangeText={(value) =>
                setSettingsDraft((current) => ({
                  ...current,
                  geminiModel: value,
                }))
              }
              placeholder="gemini-2.5-flash"
              placeholderTextColor="#8A9A8F"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.settingsInput}
            />

            <Text style={styles.settingsFieldLabel}>OPENAI API KEY</Text>
            <TextInput
              value={settingsDraft.openaiKey}
              onChangeText={(value) =>
                setSettingsDraft((current) => ({
                  ...current,
                  openaiKey: value,
                }))
              }
              placeholder="sk-..."
              placeholderTextColor="#8A9A8F"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              style={styles.settingsInput}
            />

            <Text style={styles.settingsFieldLabel}>OPENAI VISION MODEL</Text>
            <TextInput
              value={settingsDraft.openaiModel}
              onChangeText={(value) =>
                setSettingsDraft((current) => ({
                  ...current,
                  openaiModel: value,
                }))
              }
              placeholder="gpt-4o-mini"
              placeholderTextColor="#8A9A8F"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.settingsInput}
            />

            <View style={styles.settingsActions}>
              <Pressable
                onPress={clearVisionSettings}
                style={({ pressed }) => [
                  styles.settingsSecondaryButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.settingsSecondaryText}>Clear keys</Text>
              </Pressable>
              <Pressable
                onPress={saveVisionSettings}
                style={({ pressed }) => [
                  styles.settingsPrimaryButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Feather
                  name="check"
                  size={15}
                  color="#FFFFFF"
                />
                <Text style={styles.settingsPrimaryText}>
                  Save & activate
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <UnifiedPageShell
      title="Crop Doctor"
      subtitle="Universal leaf pathology scanner & real-time cure protocol"
      statusText="Universal ML Active"
      backLabel="Back to Home"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={PALETTE.brandEmerald}
          colors={[PALETTE.brandEmerald]}
        />
      }
    >
      <View style={styles.mainContainer}>
        {isDesktop ? (
          <View style={styles.desktopSplitLayout}>
            {/* Left Column: Location, Leaf Vision Input, Demo Samples & How it works */}
            <View style={styles.desktopLeftCol}>
              {renderLocationCard()}
              {renderLeafVisionInputCard()}
              {renderDemoSamplesCard()}
              {renderHowItWorksCard()}
            </View>

            {/* Right Column: Lab Results or Awaiting Scanner */}
            <View style={styles.desktopRightCol}>
              {vision && vision.isPlantLeaf === false ? (
                <InvalidLeafCard
                  vision={vision}
                  onRetry={() => {
                    setImageUri(null);
                    setImageBase64(null);
                    setFileName(null);
                    setVision(null);
                    setDemoCaseId(null);
                  }}
                  onDemo={() => handleSamplePress(CROP_DOCTOR_SAMPLES[0])}
                />
              ) : vision && report ? (
                <>
                  {renderDiagnosisCard()}
                  {agronomistReport ? (
                    <ExportReportButton report={agronomistReport} />
                  ) : null}
                  {renderCureCard()}
                  {renderSprayCard()}
                  {renderRxCard()}
                  {renderTracesCard()}
                </>
              ) : (
                <AwaitingLaboratoryCard
                  spray={spray}
                  liveLabel={liveLabel}
                  liveColor={liveColor}
                />
              )}
            </View>
          </View>
        ) : (
          <View style={styles.mobileLayout}>
            {renderLocationCard()}
            {renderLeafVisionInputCard()}
            {renderDemoSamplesCard()}

            {vision && vision.isPlantLeaf === false ? (
              <InvalidLeafCard
                vision={vision}
                onRetry={() => {
                  setImageUri(null);
                  setImageBase64(null);
                  setFileName(null);
                  setVision(null);
                  setDemoCaseId(null);
                }}
                onDemo={() => handleSamplePress(CROP_DOCTOR_SAMPLES[0])}
              />
            ) : vision && report ? (
              <>
                {renderDiagnosisCard()}
                {agronomistReport ? (
                  <ExportReportButton report={agronomistReport} />
                ) : null}
                {renderCureCard()}
                {renderSprayCard()}
                {renderRxCard()}
                {renderTracesCard()}
              </>
            ) : (
              <>
                <AwaitingLaboratoryCard
                  spray={spray}
                  liveLabel={liveLabel}
                  liveColor={liveColor}
                />
                {renderHowItWorksCard()}
              </>
            )}
          </View>
        )}
      </View>
      {renderVisionSettingsModal()}
    </UnifiedPageShell>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  desktopSplitLayout: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  desktopLeftCol: {
    flex: 1,
    gap: 20,
    minWidth: 360,
  },
  desktopRightCol: {
    flex: 1.25,
    gap: 20,
    minWidth: 420,
  },
  mobileLayout: {
    gap: 20,
  },

  /* Standard Clean Card Style (Homepage Style) */
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 24,
    shadowColor: '#102A13',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  sectionHeadingText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: PALETTE.brandEmerald,
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.brandDark,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: PALETTE.textMuted,
    marginTop: 3,
    lineHeight: 18,
  },

  enginePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PALETTE.pillBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  enginePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PALETTE.brandEmerald,
  },
  enginePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.pillText,
    letterSpacing: 0.5,
  },

  /* Location Card */
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  locationCityName: {
    fontSize: 19,
    fontWeight: '700',
    color: PALETTE.brandDark,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  locationMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PALETTE.sageTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gpsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.brandEmerald,
    letterSpacing: 0.4,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: PALETTE.pillBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  livePillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  locationMeta: {
    fontSize: 13,
    color: PALETTE.textMuted,
    marginTop: 8,
  },
  locationSync: {
    fontSize: 11.5,
    color: PALETTE.textSubtle,
    marginTop: 3,
  },
  gpsMessage: {
    fontSize: 12,
    color: PALETTE.brandEmerald,
    marginTop: 8,
  },
  weatherError: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 8,
  },

  /* Crop Selector */
  selectorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: PALETTE.brandEmerald,
    letterSpacing: 1,
  },
  selectorHint: {
    fontSize: 11,
    color: PALETTE.textMuted,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  selectorChip: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 8,
    backgroundColor: PALETTE.pillBg,
  },
  selectorChipActive: {
    backgroundColor: PALETTE.brandDark,
  },
  selectorChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.pillText,
  },
  selectorChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  detectedCropChip: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detectedCropChipActive: {
    backgroundColor: PALETTE.brandDark,
    borderColor: PALETTE.brandDark,
  },
  detectedCropChipText: {
    fontSize: 12.5,
    color: PALETTE.brandEmerald,
    fontWeight: '700',
  },
  detectedCropChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  detectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PALETTE.brandEmerald,
  },
  detectedDotActive: {
    backgroundColor: '#34D399',
  },

  /* Upload & Drop Zone */
  desktopDropZone: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 14,
    backgroundColor: '#FAFCFA',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  desktopDropZoneActive: {
    borderColor: PALETTE.brandEmerald,
    backgroundColor: PALETTE.sageTint,
  },
  dropZonePressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: PALETTE.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dropZoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.brandDark,
    textAlign: 'center',
  },
  dropZoneSubtitle: {
    fontSize: 12,
    color: PALETTE.textMuted,
    marginTop: 3,
    textAlign: 'center',
  },
  desktopCameraRow: {
    marginTop: 14,
    flexDirection: 'row',
  },
  desktopCameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  desktopCameraText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.brandDark,
  },

  /* Preview Card */
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: PALETTE.pillBg,
    marginTop: 14,
  },
  previewMedia: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: PALETTE.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewBody: {
    flex: 1,
  },
  previewEyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    color: PALETTE.brandEmerald,
    letterSpacing: 0.8,
  },
  previewTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.brandDark,
    marginTop: 2,
  },
  previewText: {
    fontSize: 12,
    color: PALETTE.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  scanProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  scanProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.brandEmerald,
    fontVariant: ['tabular-nums'],
  },

  /* Analyze Button */
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PALETTE.brandEmerald,
    minHeight: 48,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 14,
  },
  analyzeButtonIdle: {
    opacity: 0.9,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Demo Samples */
  demoSamplesCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAF8',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  demoCardHeader: {
    gap: 4,
  },
  demoEyebrowBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  demoEyebrowBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#4B5563',
    letterSpacing: 0.6,
  },
  demoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F291E',
    lineHeight: 20,
    marginTop: 4,
  },
  demoCardSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
  },
  demoHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  demoHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: PALETTE.brandEmerald,
    letterSpacing: 1,
  },
  demoHint: {
    fontSize: 11,
    color: PALETTE.textMuted,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 4,
  },
  sampleCard: {
    width: 148,
    padding: 12,
    borderRadius: 12,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  sampleCardActive: {
    borderColor: PALETTE.brandEmerald,
    backgroundColor: PALETTE.sageTint,
  },
  sampleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sampleIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: PALETTE.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleStatusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sampleStatusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  sampleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.brandDark,
  },
  sampleSubtitle: {
    fontSize: 10.5,
    color: PALETTE.textMuted,
    marginTop: 2,
  },
  sampleTryDemoRow: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sampleTryDemoText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.brandEmerald,
  },
  sampleConfidence: {
    fontSize: 10,
    color: PALETTE.textSubtle,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  leftVerdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    marginTop: 6,
    marginBottom: 4,
  },
  leftVerdictBadgeTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  leftVerdictBadgeSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  resetLeafBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  resetLeafBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },

  /* Awaiting Laboratory Card */
  awaitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 12,
    backgroundColor: PALETTE.sageTint,
    borderWidth: 1,
    borderColor: '#D4E7D6',
  },
  awaitingIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  awaitingBannerBody: {
    flex: 1,
  },
  awaitingBannerTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.brandDark,
  },
  awaitingBannerText: {
    fontSize: 12,
    color: PALETTE.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  sprayStatusCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#FAFCFA',
    marginTop: 14,
  },
  weatherHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  weatherTitleBlock: {
    flex: 1,
  },
  sprayBanner: {
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 2,
  },
  sprayHeadline: {
    fontSize: 12,
    color: PALETTE.textMuted,
    marginTop: 2,
  },
  sprayWindow: {
    fontSize: 11.5,
    color: PALETTE.brandEmerald,
    fontWeight: '600',
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  openMeteoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: PALETTE.pillBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  openMeteoText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.pillText,
  },
  awaitingCapabilitiesGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  capabilityCell: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.cardBg,
  },
  capabilityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: PALETTE.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  capabilityTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.brandDark,
  },
  capabilityDesc: {
    fontSize: 11,
    color: PALETTE.textMuted,
    marginTop: 2,
    lineHeight: 14,
  },

  /* Diagnosis Result Card */
  confidenceBadge: {
    backgroundColor: PALETTE.sageTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confidenceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.brandEmerald,
    fontVariant: ['tabular-nums'],
  },
  heroVerdictCard: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroStatusHeader: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroStatusHeaderText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11.5,
    letterSpacing: 0.8,
  },
  heroStatusHeaderRight: {
    fontSize: 11,
    fontWeight: '600',
  },
  heroVerdictBody: {
    padding: 16,
    gap: 8,
  },
  heroDiseaseName: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  heroScientificName: {
    fontSize: 13.5,
    fontStyle: 'italic',
    fontWeight: '600',
    lineHeight: 18,
  },
  heroPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  heroCropPill: {
    backgroundColor: '#0F291E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  heroCropPillText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  heroSeverityPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  heroSeverityPillText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  heroMetricsPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  heroMetricsPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  severityBlockHero: {
    backgroundColor: PALETTE.pillBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  reclassifySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    gap: 8,
  },
  reclassifyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reclassifyHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    color: PALETTE.brandEmerald,
    letterSpacing: 0.5,
  },
  reclassifySub: {
    fontSize: 12,
    color: PALETTE.textMuted,
    lineHeight: 16,
  },
  selectorWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  detectedCropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cropIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: PALETTE.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectedCropLabel: {
    fontSize: 13,
    color: PALETTE.textMuted,
  },
  quickCropSection: {
    marginBottom: 12,
  },
  quickCropLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: PALETTE.brandEmerald,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  autoDetectionPanel: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    backgroundColor: PALETTE.cardBg,
    padding: 12,
    marginBottom: 12,
    gap: 9,
  },
  autoDetectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  autoDetectionTitle: {
    flex: 1,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: PALETTE.brandEmerald,
  },
  autoDetectionRule: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: PALETTE.textMuted,
    fontVariant: ['tabular-nums'],
  },
  autoDetectionNote: {
    fontSize: 12,
    lineHeight: 17,
    color: PALETTE.textPrimary,
  },
  autoMatchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  autoMatchCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 10,
    backgroundColor: PALETTE.sageTint,
    padding: 10,
    gap: 2,
  },
  autoMatchTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  autoMatchRank: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
    color: PALETTE.brandEmerald,
  },
  autoMatchScore: {
    fontSize: 10,
    fontWeight: '800',
    color: PALETTE.brandDark,
    fontVariant: ['tabular-nums'],
  },
  autoMatchCrop: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.brandDark,
    marginTop: 2,
  },
  autoMatchDisease: {
    fontSize: 10.5,
    lineHeight: 14,
    color: PALETTE.textMuted,
  },
  consensusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  consensusText: {
    fontSize: 11.5,
    color: PALETTE.textMuted,
  },
  resultBanner: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  resultBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  resultBannerSub: {
    fontSize: 12,
    color: PALETTE.textMuted,
    marginTop: 3,
  },
  pathogenCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: PALETTE.pillBg,
    marginBottom: 14,
  },
  pathogenTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pathogenIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathogenTextBlock: {
    flex: 1,
  },
  pathogenScientific: {
    fontSize: 11.5,
    fontStyle: 'italic',
    color: PALETTE.textMuted,
  },
  pathogenCommon: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.brandDark,
    marginTop: 1,
  },
  pathogenMeta: {
    fontSize: 12,
    color: PALETTE.textMuted,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  ensembleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: PALETTE.cardBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  ensembleTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.brandDark,
  },
  severityBlock: {
    marginTop: 12,
  },
  severityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  severityLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: PALETTE.textMuted,
    letterSpacing: 0.8,
  },
  severityPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  severityTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  severityFill: {
    height: '100%',
    borderRadius: 3,
  },

  /* Biomarkers */
  biomarkerSection: {
    marginTop: 6,
  },
  biomarkerHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: PALETTE.brandEmerald,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  biomarkerBlock: {
    gap: 8,
  },
  biomarkerTrack: {
    flexDirection: 'row',
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  biomarkerLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  biomarkerLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  biomarkerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  biomarkerLegendLabel: {
    fontSize: 11,
    color: PALETTE.textMuted,
  },
  biomarkerLegendValue: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.brandDark,
    fontVariant: ['tabular-nums'],
  },

  /* Cure Steps */
  cureStepsList: {
    gap: 14,
  },
  cureStepRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cureStepRail: {
    alignItems: 'center',
    width: 24,
  },
  cureStepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PALETTE.brandDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cureStepBadgeChecked: {
    backgroundColor: PALETTE.brandEmerald,
  },
  cureStepBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cureStepLine: {
    flex: 1,
    width: 2,
    backgroundColor: PALETTE.border,
    marginTop: 4,
  },
  cureStepBody: {
    flex: 1,
    paddingBottom: 8,
  },
  cureStepTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cureStepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.brandDark,
  },
  timingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PALETTE.pillBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timingPillText: {
    fontSize: 10.5,
    color: PALETTE.textMuted,
  },
  cureStepDetail: {
    fontSize: 12.5,
    color: PALETTE.textMuted,
    marginTop: 4,
    lineHeight: 17,
  },
  cureProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    backgroundColor: PALETTE.sageTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  cureProductIconBox: {},
  cureProductName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.brandDark,
  },
  cureProductDose: {
    fontSize: 11,
    color: PALETTE.brandEmerald,
    fontWeight: '600',
  },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  cureSafety: {
    fontSize: 11.5,
    color: '#B45309',
  },

  /* Weather Metrics */
  weatherMetricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  weatherMetricCell: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: PALETTE.pillBg,
    alignItems: 'center',
  },
  weatherMetricLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: PALETTE.textMuted,
    letterSpacing: 0.6,
  },
  weatherMetricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.brandDark,
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },

  /* Rx Cards */
  acreageControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PALETTE.pillBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  acreageButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acreageButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.brandDark,
  },
  acreageDisplay: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.brandDark,
    fontVariant: ['tabular-nums'],
  },
  rxGrid: {
    gap: 12,
    marginTop: 6,
  },
  rxCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#FAFCFA',
  },
  rxTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  rxMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rxThumb: {
    width: 104,
    height: 110,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  rxDetails: {
    flex: 1,
    minWidth: 0,
  },
  rxDoseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 6,
  },
  rxMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 7,
  },
  rxRating: {
    fontSize: 10.5,
    fontWeight: '800',
    color: PALETTE.brandDark,
    fontVariant: ['tabular-nums'],
  },
  rxCoverage: {
    flexShrink: 1,
    fontSize: 9.5,
    color: PALETTE.textMuted,
    marginLeft: 2,
  },
  rxRoleTag: {
    backgroundColor: PALETTE.sageTint,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 1,
  },
  rxRoleText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.brandEmerald,
  },
  rxPriceBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  rxPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.brandDark,
    fontVariant: ['tabular-nums'],
  },
  rxMrp: {
    fontSize: 11,
    color: PALETTE.textSubtle,
    textDecorationLine: 'line-through',
    fontVariant: ['tabular-nums'],
  },
  rxName: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: PALETTE.brandDark,
  },
  rxBrand: {
    fontSize: 11,
    color: PALETTE.textMuted,
    marginTop: 2,
  },
  rxDosage: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 14,
    color: PALETTE.brandEmerald,
    fontWeight: '600',
  },
  rxBuyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: PALETTE.brandEmerald,
    minHeight: 48,
    paddingVertical: 9,
    borderRadius: 12,
    marginTop: 10,
  },
  rxBuyButtonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  buyAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PALETTE.brandDark,
    minHeight: 48,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 14,
  },
  buyAllButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* Audit Traces */
  traceToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  traceList: {
    gap: 10,
    marginTop: 14,
  },
  traceItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: PALETTE.pillBg,
  },
  traceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  traceAgentName: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.brandDark,
  },
  traceStatusBadge: {
    backgroundColor: PALETTE.sageTint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  traceStatusText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: PALETTE.brandEmerald,
  },
  traceStepText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.textMuted,
    marginTop: 4,
  },
  traceDetailText: {
    fontSize: 11,
    color: PALETTE.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },

  /* 5 AI Agents List */
  agentIntroList: {
    gap: 12,
  },
  agentIntroRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  agentIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: PALETTE.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentIntroText: {
    flex: 1,
  },
  agentIntroName: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.brandDark,
  },
  agentIntroCopy: {
    fontSize: 11.5,
    color: PALETTE.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },

  /* Invalid Leaf Card */
  invalidHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  invalidIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: PALETTE.redTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invalidTitleBlock: {
    flex: 1,
  },
  invalidEyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.8,
  },
  invalidTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.brandDark,
    marginTop: 1,
  },
  invalidSubtitle: {
    fontSize: 12,
    color: PALETTE.textMuted,
    marginTop: 2,
  },
  invalidHighlight: {
    fontWeight: '700',
    color: '#DC2626',
  },
  invalidReasonBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: PALETTE.redTint,
    marginTop: 12,
  },
  invalidReasonText: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 16,
  },
  gatekeeperStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  gatekeeperStatCell: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: PALETTE.pillBg,
    alignItems: 'center',
  },
  gatekeeperStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: PALETTE.textMuted,
    letterSpacing: 0.6,
  },
  gatekeeperStatValue: {
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  gatekeeperStatTarget: {
    fontSize: 10,
    color: PALETTE.textSubtle,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  invalidGuidelinesBlock: {
    marginTop: 14,
    padding: 12,
    borderRadius: 8,
    backgroundColor: PALETTE.pillBg,
    gap: 4,
  },
  invalidGuidelinesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.brandDark,
    marginBottom: 2,
  },
  invalidGuidelineItem: {
    fontSize: 11.5,
    color: PALETTE.textMuted,
  },
  invalidActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  invalidActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
    paddingVertical: 11,
    borderRadius: 12,
  },
  invalidActionPrimary: {
    backgroundColor: PALETTE.brandDark,
  },
  invalidActionSecondary: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  invalidActionTextPrimary: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  invalidActionTextSecondary: {
    color: PALETTE.brandEmerald,
    fontSize: 12.5,
    fontWeight: '700',
  },

  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 41, 30, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  settingsCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6ECE6',
    padding: 20,
    shadowColor: '#0F291E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  settingsEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.8,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F291E',
    marginTop: 2,
  },
  settingsClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F9F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsCopy: {
    fontSize: 12,
    color: '#526E60',
    lineHeight: 17,
    marginBottom: 14,
  },
  settingsProviderRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  settingsStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F7F9F7',
    borderWidth: 1,
    borderColor: '#E6ECE6',
  },
  settingsStatusPillActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  settingsStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9E9E9E',
  },
  settingsStatusDotActive: {
    backgroundColor: '#15803D',
  },
  settingsStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F291E',
  },
  settingsFieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F291E',
    letterSpacing: 0.8,
    marginBottom: 4,
    marginTop: 10,
  },
  settingsInput: {
    backgroundColor: '#F7F9F7',
    borderWidth: 1,
    borderColor: '#E6ECE6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F291E',
  },
  settingsActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  settingsSecondaryButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6ECE6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsSecondaryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#526E60',
  },
  settingsPrimaryButton: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#15803D',
  },
  settingsPrimaryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  customCropBadge: {
    marginLeft: 8,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  customCropBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },

  headerToolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  engineSettingsButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },

  autoDetectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  autoDetectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803D',
  },
  autoDetectedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F291E',
  },
  autoDetectedSyndrome: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
    marginLeft: 4,
  },

  customCropCard: {
    backgroundColor: '#F7F9F7',
    borderWidth: 1,
    borderColor: '#E6ECE6',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    marginBottom: 6,
  },
  customCropHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  customCropTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.8,
  },
  customCropInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customCropInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6ECE6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F291E',
  },
  customCropApply: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCropHint: {
    fontSize: 11,
    color: '#526E60',
    marginTop: 6,
    lineHeight: 15,
  },

  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.6,
  },
});
