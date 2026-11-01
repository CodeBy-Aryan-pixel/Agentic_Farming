import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';

import {
  PALETTE,
  UnifiedPageShell,
} from '@/components/UnifiedPageShell';
import { ActionButton } from '@/components/ActionButton';
import { LiveTelemetryDot } from '@/components/weather/live-telemetry-dot';
import { useLiveMarket } from '@/hooks/use-live-market';
import { useNow } from '@/hooks/use-now';
import {
  MARKET_AGENT_META,
  MARKET_CROPS,
  MARKET_MANDIS,
  runMarketAgent,
  type FraudAuditResult,
  type MandiPulseResult,
  type MarketAgentName,
  type MarketCrop,
  type MarketCropId,
  type MarketIntelligence,
  type MarketMandi,
  type MarketMandiId,
  type MarketSnapshot,
  type MarketTrace,
  type PricePoint,
} from '@/services/marketAgent';
import {
  formatFetchedAt,
  formatINR,
  formatNumber,
  formatRelativeUpdated,
} from '@/utils/format';
import {
  FPO_MARKET_ROUTE,
  GOVT_SCHEMES_ROUTE,
} from '@/utils/navigation';

const BG = '#F6F9F5';
const CARD = '#FFFFFF';
const PRIMARY = '#2D7A31';
const PRIMARY_BG = '#EAF6E9';
const DARK = '#102A13';
const MUTED = '#6B776B';
const BORDER = '#E8F0E8';
const SOFT = '#F5FAF4';
const BLUE = '#2563EB';
const AMBER = '#B7791F';
const AMBER_BG = '#FFF7E6';
const RED = '#B42318';
const MAX_WIDTH = 960;
const DEFAULT_QUANTITY = 10;
const MIN_QUANTITY = 1;
const MAX_QUANTITY = 1000;

function parseNumber(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function MarketAdvisorScreen() {
  const {
    crop,
    cropId,
    mandi,
    mandiId,
    snapshot,
    loading,
    refreshing,
    warning,
    isSimulated,
    selectCrop,
    selectMandi,
    refresh,
  } = useLiveMarket('onion', 'nashik');

  const [quantity, setQuantity] = useState(DEFAULT_QUANTITY);
  const [offeredPrice, setOfferedPrice] = useState('');
  const [dryage, setDryage] = useState('1');
  const [commission, setCommission] = useState('2.5');
  const [traceOpen, setTraceOpen] = useState(false);
  const now = useNow(30000);

  const intelligence = useMemo(() => {
    if (!snapshot) return null;

    return runMarketAgent(snapshot, quantity, {
      offeredPrice: parseNumber(
        offeredPrice,
        snapshot.modalPrice
      ),
      dryageKgPerBag: parseNumber(dryage, 0),
      commissionPercent: parseNumber(commission, 0),
      quantityQuintals: quantity,
    });
  }, [snapshot, quantity, offeredPrice, dryage, commission]);

  const updatedLabel = snapshot
    ? formatRelativeUpdated(snapshot.fetchedAt, now)
    : 'just now';

  const handleCropChange = useCallback(
    (nextCropId: MarketCropId) => {
      selectCrop(nextCropId);
      setOfferedPrice('');
    },
    [selectCrop]
  );

  const handleMandiChange = useCallback(
    (nextMandiId: MarketMandiId) => {
      selectMandi(nextMandiId);
      setOfferedPrice('');
    },
    [selectMandi]
  );

  const handleQuantityDelta = useCallback((delta: number) => {
    setQuantity((previous) =>
      Math.min(
        MAX_QUANTITY,
        Math.max(MIN_QUANTITY, previous + delta)
      )
    );
  }, []);

  const handleUseModal = useCallback(() => {
    if (!snapshot) return;
    setOfferedPrice(String(snapshot.modalPrice));
  }, [snapshot]);

  return (
    <UnifiedPageShell
      title="Market Guard"
      subtitle="APMC mandi price intelligence, 14-day trends & fair trader deduction auditor"
      statusText="Agmarknet Synced"
      backLabel="Back to Home"
      scrollable={true}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={PALETTE.brandEmerald}
          colors={[PALETTE.brandEmerald]}
        />
      }
    >
      <View style={styles.pageInner}>
            <TelemetryCard
              crop={crop}
              mandi={mandi}
              mandiId={mandiId}
              snapshot={snapshot}
              pulse={intelligence?.pulse ?? null}
              loading={loading}
              refreshing={refreshing}
              warning={warning}
              isSimulated={isSimulated}
              updatedLabel={updatedLabel}
              onSelectMandi={handleMandiChange}
              onRefresh={refresh}
            />

            {snapshot && intelligence ? (
              <>
                <CropQuantityCard
                  crop={crop}
                  cropId={cropId}
                  quantity={quantity}
                  onSelectCrop={handleCropChange}
                  onQuantityDelta={handleQuantityDelta}
                />

                <HeroCard
                  intelligence={intelligence}
                  snapshot={snapshot}
                />

                <FraudShieldCard
                  snapshot={snapshot}
                  fraud={intelligence.fraud}
                  quantity={quantity}
                  offeredPrice={offeredPrice}
                  dryage={dryage}
                  commission={commission}
                  onOfferedPriceChange={setOfferedPrice}
                  onDryageChange={setDryage}
                  onCommissionChange={setCommission}
                  onUseModal={handleUseModal}
                />

                <ReasoningCard
                  intelligence={intelligence}
                  open={traceOpen}
                  onToggle={() =>
                    setTraceOpen((previous) => !previous)
                  }
                />

                <ActionsCard />

                <Text style={styles.footer}>
                  {snapshot.source === 'live'
                    ? 'LIVE MARKET DATA © AGMARKNET / e-NAM AND OPEN-METEO'
                    : 'SIMULATED MARKET DATA © AGMARKNET / e-NAM AND OPEN-METEO'}
                </Text>
                <Text style={styles.footerSub}>
                  Prices and deductions are advisory. Verify the
                  local APMC rate, MSP procurement window and
                  legal commission before accepting a trader
                  quote.
                </Text>
              </>
            ) : (
              <LoadingCard
                crop={crop}
                mandi={mandi}
                loading={loading}
                warning={warning}
                onRetry={refresh}
              />
            )}
          </View>
    </UnifiedPageShell>
  );
}

function SectionHeader({
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
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderText}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

function Chip({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {icon ? <Text style={styles.chipIcon}>{icon}</Text> : null}
      <Text
        style={[
          styles.chipText,
          selected && styles.chipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function MiniStat({
  iconName,
  label,
  value,
  sub,
  accent = DARK,
}: {
  iconName: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <View style={styles.miniStat}>
      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#EDF5EE', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
        <Feather name={iconName} size={15} color="#15803D" />
      </View>
      <Text style={styles.miniStatLabel}>{label}</Text>
      <Text style={[styles.miniStatValue, { color: accent }]}>
        {value}
      </Text>
      <Text style={styles.miniStatSub} numberOfLines={1}>
        {sub}
      </Text>
    </View>
  );
}

function MetricTile({
  label,
  value,
  sub,
  accent = DARK,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricTileLabel}>{label}</Text>
      <Text style={[styles.metricTileValue, { color: accent }]}>
        {value}
      </Text>
      <Text style={styles.metricTileSub}>{sub}</Text>
    </View>
  );
}

function TelemetryCard({
  crop,
  mandi,
  mandiId,
  snapshot,
  pulse,
  loading,
  refreshing,
  warning,
  isSimulated,
  updatedLabel,
  onSelectMandi,
  onRefresh,
}: {
  crop: MarketCrop;
  mandi: MarketMandi;
  mandiId: MarketMandiId;
  snapshot: MarketSnapshot | null;
  pulse: MandiPulseResult | null;
  loading: boolean;
  refreshing: boolean;
  warning: string | null;
  isSimulated: boolean;
  updatedLabel: string;
  onSelectMandi: (mandiId: MarketMandiId) => void;
  onRefresh: () => void;
}) {
  const busy = loading || refreshing;
  const accent = isSimulated ? AMBER : PRIMARY;
  const sourceLabel = !snapshot
    ? 'SYNCING AGMARKNET'
    : isSimulated
      ? 'SIMULATED MANDI MODEL'
      : 'LIVE e-NAM / AGMARKNET TELEMETRY';
  const flaggedShocks =
    snapshot?.weatherShocks.filter(
      (shock) => shock.level !== 'none'
    ) ?? [];

  return (
    <View style={styles.card}>
      <SectionHeader
        eyebrow="LIVE MANDI TELEMETRY"
        title="e-NAM / Agmarknet price feed"
        subtitle="Pick the mandi, sync live rates and inspect the supply and weather signals behind the recommendation."
        right={
          <View
            style={[
              styles.sourcePill,
              {
                backgroundColor: isSimulated
                  ? AMBER_BG
                  : PRIMARY_BG,
                borderColor: `${accent}33`,
              },
            ]}
          >
            <LiveTelemetryDot color={accent} size={6} />
            <Text
              style={[
                styles.sourcePillText,
                { color: accent },
              ]}
            >
              {sourceLabel}
            </Text>
          </View>
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mandiPillRow}
      >
        {MARKET_MANDIS.map((option) => {
          const selected = option.id === mandiId;

          return (
            <Pressable
              key={option.id}
              style={[
                styles.mandiPill,
                selected && styles.mandiPillActive,
              ]}
              onPress={() => onSelectMandi(option.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                style={[
                  styles.mandiPillText,
                  selected && styles.mandiPillTextActive,
                ]}
              >
                {option.shortName}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {snapshot ? (
        <>
          <View style={styles.telemetryMetaRow}>
            <View style={styles.telemetryMetaText}>
              <Text style={styles.telemetryFetched}>
                Fetched {formatFetchedAt(snapshot.fetchedAt)}
              </Text>
              <Text style={styles.telemetrySub}>
                Updated {updatedLabel} · {crop.name} ·{' '}
                {mandi.name} · weather {snapshot.weatherSource}
              </Text>
            </View>

            <Pressable
              style={[
                styles.refreshButton,
                busy && styles.refreshButtonDisabled,
              ]}
              onPress={onRefresh}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Sync live mandi rates"
            >
              {busy ? (
                <ActivityIndicator
                  size="small"
                  color={PRIMARY}
                />
              ) : (
                <Text style={styles.refreshIcon}>↻</Text>
              )}
              <Text style={styles.refreshText}>
                {busy ? 'Syncing…' : 'Sync Live Rates'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.miniStatGrid}>
            <MiniStat
              iconName="package"
              label="ARRIVALS · MODEL"
              value={`${formatNumber(
                pulse?.arrivalsQuintals ??
                  snapshot.arrivalsQuintals
              )} qt`}
              sub={`${
                (pulse?.arrivalsChangePct ??
                  snapshot.arrivalsChangePct) > 0
                  ? '+'
                  : ''
              }${
                pulse?.arrivalsChangePct ??
                snapshot.arrivalsChangePct
              }% vs prior session`}
            />
            <MiniStat
              iconName="trending-up"
              label="RALLY ODDS"
              value={`${
                pulse?.rallyProbabilityPct ??
                snapshot.rallyProbabilityPct
              }%`}
              sub={
                pulse?.signal === 'shortage'
                  ? 'Supply crunch signal'
                  : pulse?.signal === 'glut'
                    ? 'Heavy arrivals signal'
                    : 'Balanced supply signal'
              }
              accent={
                (pulse?.rallyProbabilityPct ??
                  snapshot.rallyProbabilityPct) >= 65
                  ? PRIMARY
                  : DARK
              }
            />
            <MiniStat
              iconName="cloud-rain"
              label="COMPETING RAIN"
              value={`${snapshot.competingRainMm.toFixed(1)} mm`}
              sub={`${flaggedShocks.length} mandis flagged in 48h`}
              accent={flaggedShocks.length > 0 ? AMBER : DARK}
            />
            <MiniStat
              iconName="tag"
              label={
                snapshot.source === 'live'
                  ? 'e-NAM BENCHMARK'
                  : 'MODELED BENCHMARK'
              }
              value={formatINR(snapshot.eNamBenchmark)}
              sub={`${formatINR(
                snapshot.benchmarkMin
              )}–${formatINR(snapshot.benchmarkMax)} range`}
            />
          </View>

          <View style={styles.shockBlock}>
            <View style={styles.shockHeader}>
              <Text style={styles.shockTitle}>
                MANDI PULSE · WEATHER SHOCKS
              </Text>
              <Text style={styles.shockSource}>
                {snapshot.weatherSource.toUpperCase()}
              </Text>
            </View>

            {flaggedShocks.length > 0 ? (
              flaggedShocks.slice(0, 3).map((shock) => (
                <View
                  key={shock.mandiId}
                  style={styles.shockRow}
                >
                  <View
                    style={[
                      styles.shockDot,
                      {
                        backgroundColor:
                          shock.level === 'high'
                            ? RED
                            : AMBER,
                      },
                    ]}
                  />
                  <Text style={styles.shockName}>
                    {shock.name}
                  </Text>
                  <Text style={styles.shockMeta}>
                    {shock.rainNext48hMm} mm ·{' '}
                    {shock.maxRainProbabilityPct}%
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.shockEmpty}>
                No disruptive rain signal across the competing
                mandis. Arrivals remain the primary price
                driver.
              </Text>
            )}
          </View>

          <Text style={styles.sourceNote}>{snapshot.note}</Text>
        </>
      ) : loading ? (
        <View style={styles.fetchingRow}>
          <ActivityIndicator color={PRIMARY} />
          <Text style={styles.fetchingText}>
            Fetching live {crop.name} rates for{' '}
            {mandi.shortName}…
          </Text>
        </View>
      ) : null}

      {warning ? (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>{warning}</Text>
        </View>
      ) : null}
    </View>
  );
}

function CropQuantityCard({
  crop,
  cropId,
  quantity,
  onSelectCrop,
  onQuantityDelta,
}: {
  crop: MarketCrop;
  cropId: MarketCropId;
  quantity: number;
  onSelectCrop: (cropId: MarketCropId) => void;
  onQuantityDelta: (delta: number) => void;
}) {
  return (
    <View style={styles.card}>
      <SectionHeader
        eyebrow="CROP & HARVEST SIZE"
        title="Tune the market agents"
        subtitle="Every crop, mandi and quantity change recalculates the price verdict, storage math and fraud audit."
      />

      <Text style={styles.controlLabel}>CROP</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cropChipRow}
      >
        {MARKET_CROPS.map((option) => (
          <Chip
            key={option.id}
            label={option.name}
            icon={option.icon}
            selected={option.id === cropId}
            onPress={() => onSelectCrop(option.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.quantityRow}>
        <View style={styles.quantityTextBlock}>
          <Text style={styles.controlLabel}>HARVEST QUANTITY</Text>
          <Text style={styles.quantityValue}>
            {formatNumber(quantity)} qt
          </Text>
          <Text style={styles.quantityHint}>
            {crop.name} · shelf life {crop.storageLifeDays}{' '}
            days · {crop.perishability} perishability
          </Text>
        </View>

        <View style={styles.stepper}>
          <Pressable
            style={styles.stepButton}
            onPress={() => onQuantityDelta(-1)}
            disabled={quantity <= MIN_QUANTITY}
            accessibilityRole="button"
            accessibilityLabel="Decrease harvest quantity"
          >
            <Text
              style={[
                styles.stepButtonText,
                quantity <= MIN_QUANTITY &&
                  styles.stepButtonDisabled,
              ]}
            >
              −
            </Text>
          </Pressable>

          <Text style={styles.stepValue}>
            {formatNumber(quantity)}
          </Text>

          <Pressable
            style={styles.stepButton}
            onPress={() => onQuantityDelta(1)}
            disabled={quantity >= MAX_QUANTITY}
            accessibilityRole="button"
            accessibilityLabel="Increase harvest quantity"
          >
            <Text
              style={[
                styles.stepButtonText,
                quantity >= MAX_QUANTITY &&
                  styles.stepButtonDisabled,
              ]}
            >
              +
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.cropMetaRow}>
        <View style={styles.cropMetaPill}>
          <Text style={styles.cropMetaLabel}>MSP / FRP</Text>
          <Text style={styles.cropMetaValue}>
            {crop.msp ? formatINR(crop.msp) : 'Not notified'}
          </Text>
        </View>
        <View style={styles.cropMetaPill}>
          <Text style={styles.cropMetaLabel}>STORAGE</Text>
          <Text style={styles.cropMetaValue}>
            {crop.storageLifeDays} days
          </Text>
        </View>
        <View style={styles.cropMetaPill}>
          <Text style={styles.cropMetaLabel}>COLD STORE</Text>
          <Text style={styles.cropMetaValue}>
            {formatINR(crop.coldStorageCostPerQuintalMonth)}
            /qt/mo
          </Text>
        </View>
      </View>

      <View style={styles.calibrationRow}>
        <LiveTelemetryDot color={PRIMARY} size={6} />
        <Text style={styles.calibrationText}>
          Live recalibration · {crop.name} · {quantity} qt ·{' '}
          {crop.seasonalNote}
        </Text>
      </View>
    </View>
  );
}

function PriceSparkline({
  history,
  forecast,
  trendPct,
}: {
  history: PricePoint[];
  forecast: PricePoint[];
  trendPct: number;
}) {
  const points = [...history, ...forecast];

  if (points.length === 0) return null;

  const prices = points.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const maxBarHeight = 58;

  return (
    <View style={styles.sparkBlock}>
      <View style={styles.sparkHeader}>
        <Text style={styles.sparkTitle}>14-DAY PRICE PATH</Text>
        <Text
          style={[
            styles.sparkTrend,
            { color: trendPct >= 0 ? PRIMARY : RED },
          ]}
        >
          {trendPct >= 0 ? '+' : ''}
          {trendPct}% 7d
        </Text>
      </View>

      <View style={styles.sparkRow}>
        {points.map((point, index) => {
          const isForecast = index >= history.length;
          const height =
            6 +
            ((point.price - min) / range) * maxBarHeight;

          return (
            <View
              key={`${point.date}-${index}`}
              style={styles.sparkColumn}
            >
              <View
                style={[
                  styles.sparkBar,
                  {
                    height,
                    backgroundColor: isForecast
                      ? BLUE
                      : PRIMARY,
                    opacity: isForecast ? 0.55 : 1,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.sparkLabels}>
        <Text style={styles.sparkLabel}>7d ago</Text>
        <Text style={styles.sparkLabel}>Today</Text>
        <Text style={styles.sparkLabel}>+7d</Text>
      </View>

      <View style={styles.sparkLegend}>
        <View style={styles.sparkLegendItem}>
          <View
            style={[
              styles.sparkLegendDot,
              { backgroundColor: PRIMARY },
            ]}
          />
          <Text style={styles.sparkLegendText}>History</Text>
        </View>
        <View style={styles.sparkLegendItem}>
          <View
            style={[
              styles.sparkLegendDot,
              { backgroundColor: BLUE, opacity: 0.55 },
            ]}
          />
          <Text style={styles.sparkLegendText}>Forecast</Text>
        </View>
      </View>
    </View>
  );
}

function HeroCard({
  intelligence,
  snapshot,
}: {
  intelligence: MarketIntelligence;
  snapshot: MarketSnapshot;
}) {
  const { timing } = intelligence;
  const gainColor =
    timing.netExtraProfit > 0 ? PRIMARY : MUTED;
  const heroLabel =
    snapshot.liveScope === 'mandi'
      ? 'LIVE MODAL PRICE'
      : snapshot.source === 'simulated'
        ? 'SIMULATED MODAL PRICE'
        : 'MODELED MODAL PRICE';
  const heroSub =
    snapshot.liveScope === 'mandi'
      ? `Live Agmarknet record · ${snapshot.crop.name} · ${snapshot.liveMarket ?? snapshot.mandi.shortName}${snapshot.liveDate ? ` (${snapshot.liveDate})` : ''}`
      : snapshot.liveScope === 'state'
        ? `Modeled from Maharashtra median benchmark · ${snapshot.crop.name} · ${snapshot.mandi.shortName}`
        : snapshot.liveScope === 'national'
          ? `Modeled from national median benchmark · ${snapshot.crop.name} · ${snapshot.mandi.shortName}`
          : snapshot.source === 'live'
            ? `Modeled from the live e-NAM benchmark · ${snapshot.crop.name} · ${snapshot.mandi.shortName}`
            : `Simulated mandi model · ${snapshot.crop.name} · ${snapshot.mandi.shortName}`;

  return (
    <View
      style={[
        styles.card,
        styles.heroCard,
        { borderTopColor: timing.verdictColor },
      ]}
    >
      <View
        style={[
          styles.verdictBanner,
          {
            backgroundColor: `${timing.verdictColor}10`,
            borderColor: `${timing.verdictColor}40`,
          },
        ]}
      >
        <Text
          style={[
            styles.verdictLabel,
            { color: timing.verdictColor },
          ]}
        >
          {timing.verdictLabel}
        </Text>
        <Text style={styles.verdictHeadline}>
          {timing.headline}
        </Text>
      </View>

      <Text style={styles.heroLabel}>{heroLabel}</Text>
      <Text style={styles.heroPrice}>
        {formatINR(timing.currentPrice)}
        <Text style={styles.heroPriceUnit}> /qt</Text>
      </Text>
      <Text style={styles.heroSub}>{heroSub}</Text>

      <View style={styles.metricGrid}>
        <MetricTile
          label="MSP / FRP"
          value={
            timing.msp
              ? formatINR(timing.msp)
              : 'Not notified'
          }
          sub={timing.mspLabel}
        />
        <MetricTile
          label="14-DAY PEAK"
          value={formatINR(timing.projectedPeakPrice)}
          sub={`${timing.projectedPeakDateLabel} · +${timing.potentialGainPercent}%`}
          accent={timing.verdictColor}
        />
        <MetricTile
          label="NET EXTRA PROFIT"
          value={formatINR(timing.netExtraProfit)}
          sub={
            timing.verdict === 'SELL_NOW'
              ? 'Sell today avoids storage'
              : `After ${formatINR(
                  timing.storageCostTotal
                )} storage cost`
          }
          accent={gainColor}
        />
        <MetricTile
          label="PROJECTED VALUE"
          value={formatINR(timing.totalProjectedValue)}
          sub={`${formatNumber(
            timing.quantityQuintals
          )} qt at the recommended path`}
        />
      </View>

      <View style={styles.heroFactRow}>
        <View style={styles.heroFact}>
          <Text style={styles.heroFactLabel}>MSP CHECK</Text>
          <Text
            style={[
              styles.heroFactValue,
              {
                color:
                  timing.msp === null
                    ? MUTED
                    : timing.isAboveMsp
                      ? PRIMARY
                      : AMBER,
              },
            ]}
          >
            {timing.msp === null
              ? 'No MSP notified'
              : timing.isAboveMsp
                ? 'Above benchmark'
                : 'Below benchmark'}
          </Text>
        </View>
        <View style={styles.heroFact}>
          <Text style={styles.heroFactLabel}>STORAGE FEASIBLE</Text>
          <Text
            style={[
              styles.heroFactValue,
              {
                color: timing.canPhysicallyHold
                  ? PRIMARY
                  : RED,
              },
            ]}
          >
            {timing.canPhysicallyHold ? 'Yes' : 'No'}
          </Text>
        </View>
        <View style={styles.heroFact}>
          <Text style={styles.heroFactLabel}>SHELF LIFE</Text>
          <Text style={styles.heroFactValue}>
            {snapshot.crop.storageLifeDays} days
          </Text>
        </View>
      </View>

      <PriceSparkline
        history={snapshot.history7d}
        forecast={snapshot.forecast7d}
        trendPct={snapshot.trendPct}
      />

      <View style={styles.heroFooter}>
        <Text style={styles.heroFooterText}>
          {snapshot.source === 'live'
            ? 'Agmarknet-anchored model'
            : 'Dynamic simulation'}{' '}
          · {formatFetchedAt(snapshot.fetchedAt)}
        </Text>
        <Text style={styles.heroFooterLink}>
          Agent reasoning below ↓
        </Text>
      </View>
    </View>
  );
}

function FraudShieldCard({
  snapshot,
  fraud,
  quantity,
  offeredPrice,
  dryage,
  commission,
  onOfferedPriceChange,
  onDryageChange,
  onCommissionChange,
  onUseModal,
}: {
  snapshot: MarketSnapshot;
  fraud: FraudAuditResult;
  quantity: number;
  offeredPrice: string;
  dryage: string;
  commission: string;
  onOfferedPriceChange: (value: string) => void;
  onDryageChange: (value: string) => void;
  onCommissionChange: (value: string) => void;
  onUseModal: () => void;
}) {
  const lossColor =
    fraud.totalFinancialLoss > 0
      ? RED
      : fraud.isExploitation
        ? AMBER
        : PRIMARY;

  return (
    <View style={styles.card}>
      <SectionHeader
        eyebrow="MIDDLEMAN FRAUD SHIELD"
        title="Audit the trader quote"
        subtitle="The third agent checks the offered price, weight cut and arhatiya commission against the e-NAM benchmark and legal caps."
        right={
          <View
            style={[
              styles.riskPill,
              {
                backgroundColor: fraud.verdictBackground,
                borderColor: `${fraud.verdictColor}33`,
              },
            ]}
          >
            <Text
              style={[
                styles.riskPillText,
                { color: fraud.verdictColor },
              ]}
            >
              RISK {fraud.riskScore}%
            </Text>
          </View>
        }
      />

      <View
        style={[
          styles.fraudBanner,
          {
            backgroundColor: fraud.verdictBackground,
            borderColor: `${fraud.verdictColor}40`,
          },
        ]}
      >
        <Text
          style={[
            styles.fraudBannerLabel,
            { color: fraud.verdictColor },
          ]}
        >
          {fraud.verdictLabel}
        </Text>
        <Text style={styles.fraudBannerBody}>
          {fraud.warning}
        </Text>
      </View>

      <Text style={styles.inputLabel}>
        TRADER OFFER · ₹ PER QUINTAL
      </Text>
      <View style={styles.inputWithButton}>
        <TextInput
          style={styles.input}
          value={offeredPrice}
          onChangeText={onOfferedPriceChange}
          keyboardType="numeric"
          placeholder={String(snapshot.modalPrice)}
          placeholderTextColor="#A8B5A8"
          selectionColor={PRIMARY}
        />
        <Pressable
          style={styles.useModalButton}
          onPress={onUseModal}
          accessibilityRole="button"
        >
          <Text style={styles.useModalText}>Use modal</Text>
        </Pressable>
      </View>
      {offeredPrice.trim() === '' ? (
        <Text style={styles.inputHint}>
          Auditing at the current modal price until you enter
          a trader quote.
        </Text>
      ) : null}

      <View style={styles.inputGrid}>
        <View style={styles.inputHalf}>
          <Text style={styles.inputLabel}>
            WEIGHT CUT · KG / 50 KG BAG
          </Text>
          <TextInput
            style={styles.input}
            value={dryage}
            onChangeText={onDryageChange}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#A8B5A8"
            selectionColor={PRIMARY}
          />
        </View>
        <View style={styles.inputHalf}>
          <Text style={styles.inputLabel}>
            COMMISSION · PERCENT
          </Text>
          <TextInput
            style={styles.input}
            value={commission}
            onChangeText={onCommissionChange}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#A8B5A8"
            selectionColor={PRIMARY}
          />
        </View>
      </View>

      <View style={styles.fraudStatGrid}>
        <MetricTile
          label="FAIR e-NAM VALUE"
          value={formatINR(fraud.fairENamValue)}
          sub={`${formatINR(
            fraud.fairPerQuintal
          )}/qt gross · ${formatINR(
            fraud.fairPayout
          )} after legal caps`}
        />
        <MetricTile
          label="TRADER PAYOUT"
          value={formatINR(fraud.traderPayout)}
          sub={`${formatINR(
            fraud.netTraderPerQuintal
          )}/qt net to farmer`}
          accent={fraud.isExploitation ? RED : DARK}
        />
        <MetricTile
          label="MONEY LOST"
          value={formatINR(fraud.totalFinancialLoss)}
          sub={
            fraud.totalFinancialLoss > 0
              ? `unfair loss on ${formatNumber(
                  quantity
                )} qt`
              : fraud.isExploitation
                ? 'Illegal terms flagged; no cash loss'
                : 'No unfair loss detected'
          }
          accent={lossColor}
        />
      </View>

      <View style={styles.auditList}>
        <Text style={styles.auditTitle}>
          QUOTE & DEDUCTION AUDIT
        </Text>
        {fraud.fraudItems.length > 0 ? (
          fraud.fraudItems.map((item, index) => (
            <View
              key={`${item.label}-${index}`}
              style={styles.auditRow}
            >
              <View style={styles.auditLabelBlock}>
                <Text
                  style={[
                    styles.auditFlag,
                    {
                      color: item.isFraud ? RED : PRIMARY,
                    },
                  ]}
                >
                  {item.isFraud ? 'FLAG' : 'OK'}
                </Text>
                <Text style={styles.auditLabel}>
                  {item.label}
                </Text>
              </View>
              <Text
                style={[
                  styles.auditAmount,
                  {
                    color:
                      item.amount >= 0 ? PRIMARY : RED,
                  },
                ]}
              >
                {item.amount >= 0 ? '+' : '−'}
                {formatINR(Math.abs(item.amount))}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.auditEmpty}>
            No price gap or unlawful deduction detected.
          </Text>
        )}
      </View>

      <View style={styles.legalNote}>
        <Text style={styles.legalNoteText}>
          Legal caps: dryage maximum 1 kg per 50 kg bag ·
          arhatiya commission maximum 2.5% · MSP applies only
          to notified crops. Ask for a weighing slip and
          itemised commission receipt.
        </Text>
      </View>
    </View>
  );
}

function traceStatusColor(
  status: MarketTrace['status']
): string {
  if (status === 'critical') return RED;
  if (status === 'warning') return AMBER;
  if (status === 'ok') return PRIMARY;
  return BLUE;
}

function TraceRow({ trace }: { trace: MarketTrace }) {
  return (
    <View style={styles.traceRow}>
      <View
        style={[
          styles.traceDot,
          {
            backgroundColor: traceStatusColor(trace.status),
          },
        ]}
      />
      <View style={styles.traceBody}>
        <Text style={styles.traceStep}>{trace.step}</Text>
        <Text style={styles.traceDetail}>{trace.detail}</Text>
      </View>
    </View>
  );
}

function AgentBlock({
  agent,
  traces,
}: {
  agent: MarketAgentName;
  traces: MarketTrace[];
}) {
  const meta = MARKET_AGENT_META[agent];

  return (
    <View
      style={[
        styles.agentBlock,
        { borderLeftColor: meta.color },
      ]}
    >
      <View style={styles.agentHeader}>
        <View
          style={[
            styles.agentIcon,
            { backgroundColor: meta.background },
          ]}
        >
          <Text style={styles.agentIconText}>{meta.icon}</Text>
        </View>
        <View style={styles.agentHeaderText}>
          <Text
            style={[styles.agentName, { color: meta.color }]}
          >
            {meta.label}
          </Text>
          <Text style={styles.agentRole}>
            {traces.length} live reasoning steps
          </Text>
        </View>
      </View>

      {traces.map((trace) => (
        <TraceRow key={trace.id} trace={trace} />
      ))}
    </View>
  );
}

function ReasoningCard({
  intelligence,
  open,
  onToggle,
}: {
  intelligence: MarketIntelligence;
  open: boolean;
  onToggle: () => void;
}) {
  const agents: MarketAgentName[] = [
    'MandiPulse',
    'ProfitTiming',
    'MiddlemanFraudShield',
  ];

  const tracesFor = (agent: MarketAgentName) => {
    if (agent === 'MandiPulse') {
      return intelligence.pulse.reasoning;
    }

    if (agent === 'ProfitTiming') {
      return intelligence.timing.reasoning;
    }

    return intelligence.fraud.reasoning;
  };

  return (
    <View style={styles.card}>
      <SectionHeader
        eyebrow="LIVE MULTI-AGENT REASONING"
        title="3-stage market workflow"
        subtitle="Inspect the supply scan, sell-versus-hold forecast and middleman audit behind the verdict."
        right={
          <Pressable
            style={styles.toggleButton}
            onPress={onToggle}
            accessibilityRole="button"
          >
            <Text style={styles.toggleButtonText}>
              {open ? 'Hide trace' : 'Show trace'}
            </Text>
          </Pressable>
        }
      />

      <View style={styles.workflowGrid}>
        {intelligence.workflow.map((step) => {
          const meta = MARKET_AGENT_META[step.agent];

          return (
            <View key={step.step} style={styles.workflowStep}>
              <View
                style={[
                  styles.workflowNumber,
                  { backgroundColor: meta.background },
                ]}
              >
                <Text
                  style={[
                    styles.workflowNumberText,
                    { color: meta.color },
                  ]}
                >
                  {step.step}
                </Text>
              </View>
              <View style={styles.workflowBody}>
                <Text style={styles.workflowAgent}>
                  {meta.label}
                </Text>
                <Text style={styles.workflowTitle}>
                  {step.title}
                </Text>
                <Text style={styles.workflowSummary}>
                  {step.summary}
                </Text>
              </View>
              <View
                style={[
                  styles.workflowDot,
                  {
                    backgroundColor: traceStatusColor(
                      step.status
                    ),
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      {open ? (
        <View style={styles.agentLogs}>
          {agents.map((agent) => (
            <AgentBlock
              key={agent}
              agent={agent}
              traces={tracesFor(agent)}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.collapsedHint}>
          Reasoning hidden. Tap “Show trace” to inspect the
          arrival math, weather shock, storage cost and fraud
          deduction logic.
        </Text>
      )}
    </View>
  );
}

function ActionsCard() {
  return (
    <View style={styles.card}>
      <SectionHeader
        eyebrow="CROSS-AGENT NEXT ACTIONS"
        title="Turn the verdict into a better sale"
        subtitle="The market agent hands off to the FPO direct-market and government-scheme agents."
      />

      <View style={styles.actionStack}>
        <ActionButton
          label="Sell directly through the FPO Market"
          icon="users"
          variant="primary"
          fullWidth
          onPress={() => router.push(FPO_MARKET_ROUTE)}
        />

        <ActionButton
          label="Check MSP procurement and PM-KISAN schemes"
          icon="shield"
          variant="secondary"
          fullWidth
          onPress={() => router.push(GOVT_SCHEMES_ROUTE)}
        />
      </View>
    </View>
  );
}

function LoadingCard({
  crop,
  mandi,
  loading,
  warning,
  onRetry,
}: {
  crop: MarketCrop;
  mandi: MarketMandi;
  loading: boolean;
  warning: string | null;
  onRetry: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.loadingRow}>
        {loading ? (
          <ActivityIndicator color={PRIMARY} size="large" />
        ) : (
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EDF5EE', alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="radio" size={20} color="#15803D" />
          </View>
        )}
        <View style={styles.loadingBody}>
          <Text style={styles.loadingTitle}>
            {loading
              ? `Fetching ${crop.name} rates for ${mandi.shortName}…`
              : 'Market snapshot unavailable'}
          </Text>
          <Text style={styles.loadingMessage}>
            {warning ??
              'Agmarknet and Open-Meteo are returning live mandi prices, arrivals and competing-market weather. The three agents will start their reasoning as soon as the payload lands.'}
          </Text>
        </View>
      </View>

      {!loading ? (
        <Pressable
          style={styles.retryButton}
          onPress={onRetry}
          accessibilityRole="button"
        >
          <Text style={styles.retryButtonText}>
            Retry live fetch
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    backgroundColor: BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  backButton: {
    minWidth: 58,
    backgroundColor: '#E8F0E8',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: DARK,
  },
  topBarTitleBlock: {
    flex: 1,
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: DARK,
  },
  topBarSubtitle: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  livePillText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  pageInner: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    marginTop: 14,
    shadowColor: PRIMARY,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  sectionHeaderText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: PRIMARY,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
    marginTop: 3,
  },
  cardSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: MUTED,
    marginTop: 4,
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: 180,
  },
  sourcePillText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  mandiPillRow: {
    gap: 8,
    paddingBottom: 2,
  },
  mandiPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SOFT,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mandiPillActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  mandiPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#405640',
  },
  mandiPillTextActive: {
    color: '#FFFFFF',
  },
  telemetryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  telemetryMetaText: {
    flex: 1,
    minWidth: 180,
  },
  telemetryFetched: {
    fontSize: 10,
    fontWeight: '700',
    color: DARK,
  },
  telemetrySub: {
    fontSize: 9,
    color: MUTED,
    marginTop: 3,
    lineHeight: 14,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PRIMARY_BG,
    borderWidth: 1,
    borderColor: `${PRIMARY}33`,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  refreshButtonDisabled: {
    opacity: 0.65,
  },
  refreshIcon: {
    fontSize: 14,
    fontWeight: '800',
    color: PRIMARY,
  },
  refreshText: {
    fontSize: 9,
    fontWeight: '800',
    color: PRIMARY,
  },
  miniStatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  miniStat: {
    flexGrow: 1,
    flexBasis: 120,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: '#EDF4EC',
    borderRadius: 12,
    padding: 10,
  },
  miniStatIcon: {
    fontSize: 14,
  },
  miniStatLabel: {
    fontSize: 8,
    letterSpacing: 0.8,
    fontWeight: '800',
    color: MUTED,
    marginTop: 4,
  },
  miniStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  miniStatSub: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
  },
  shockBlock: {
    marginTop: 14,
    backgroundColor: SOFT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDF4EC',
    padding: 10,
  },
  shockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  shockTitle: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: MUTED,
  },
  shockSource: {
    fontSize: 8,
    fontWeight: '800',
    color: PRIMARY,
  },
  shockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 3,
  },
  shockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  shockName: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: DARK,
  },
  shockMeta: {
    fontSize: 9,
    color: MUTED,
  },
  shockEmpty: {
    fontSize: 10,
    lineHeight: 15,
    color: MUTED,
  },
  sourceNote: {
    marginTop: 10,
    fontSize: 9,
    lineHeight: 14,
    color: MUTED,
  },
  fetchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  fetchingText: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '600',
  },
  warningBanner: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    backgroundColor: AMBER_BG,
    borderColor: `${AMBER}33`,
  },
  warningText: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
    color: AMBER,
  },
  controlLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: MUTED,
    marginTop: 14,
    marginBottom: 7,
  },
  cropChipRow: {
    gap: 8,
    paddingBottom: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SOFT,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  chipIcon: {
    fontSize: 12,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#405640',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  quantityTextBlock: {
    flex: 1,
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  quantityHint: {
    fontSize: 9,
    color: MUTED,
    marginTop: 3,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: SOFT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 4,
  },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: PRIMARY,
    lineHeight: 21,
  },
  stepButtonDisabled: {
    color: '#B9C4B9',
  },
  stepValue: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: DARK,
    fontVariant: ['tabular-nums'],
  },
  cropMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  cropMetaPill: {
    flexGrow: 1,
    flexBasis: 100,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: '#EDF4EC',
    borderRadius: 10,
    padding: 8,
  },
  cropMetaLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: MUTED,
  },
  cropMetaValue: {
    fontSize: 11,
    fontWeight: '800',
    color: DARK,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  calibrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: PRIMARY_BG,
    borderRadius: 10,
    padding: 8,
  },
  calibrationText: {
    flex: 1,
    fontSize: 9,
    color: PRIMARY,
    lineHeight: 14,
  },
  heroCard: {
    borderTopWidth: 4,
    paddingTop: 16,
  },
  verdictBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  verdictLabel: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  verdictHeadline: {
    fontSize: 11,
    lineHeight: 16,
    color: '#3A4A3A',
    marginTop: 4,
  },
  heroLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: MUTED,
    marginTop: 16,
  },
  heroPrice: {
    fontSize: 38,
    fontWeight: '800',
    color: DARK,
    marginTop: 2,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  heroPriceUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  heroSub: {
    fontSize: 10,
    lineHeight: 15,
    color: MUTED,
    marginTop: 4,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  metricTile: {
    flexGrow: 1,
    flexBasis: 130,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: '#EDF4EC',
    borderRadius: 12,
    padding: 10,
  },
  metricTileLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: MUTED,
  },
  metricTileValue: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  metricTileSub: {
    fontSize: 8,
    lineHeight: 12,
    color: MUTED,
    marginTop: 2,
  },
  heroFactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  heroFact: {
    flexGrow: 1,
    flexBasis: 100,
    borderLeftWidth: 2,
    borderLeftColor: BORDER,
    paddingLeft: 8,
  },
  heroFactLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: MUTED,
  },
  heroFactValue: {
    fontSize: 10,
    fontWeight: '800',
    color: DARK,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  sparkBlock: {
    marginTop: 14,
    backgroundColor: SOFT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDF4EC',
    padding: 10,
  },
  sparkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  sparkTitle: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: MUTED,
  },
  sparkTrend: {
    fontSize: 9,
    fontWeight: '800',
  },
  sparkRow: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  sparkColumn: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sparkBar: {
    width: '100%',
    borderRadius: 3,
  },
  sparkLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sparkLabel: {
    fontSize: 8,
    color: MUTED,
  },
  sparkLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  sparkLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sparkLegendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sparkLegendText: {
    fontSize: 8,
    color: MUTED,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  heroFooterText: {
    fontSize: 9,
    color: MUTED,
  },
  heroFooterLink: {
    fontSize: 9,
    fontWeight: '800',
    color: PRIMARY,
  },
  riskPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  riskPillText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  fraudBanner: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 4,
  },
  fraudBannerLabel: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  fraudBannerBody: {
    fontSize: 10,
    lineHeight: 15,
    color: '#3A4A3A',
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: MUTED,
    marginTop: 12,
    marginBottom: 5,
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    minWidth: 0,
    backgroundColor: SOFT,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: DARK,
  },
  useModalButton: {
    backgroundColor: PRIMARY_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${PRIMARY}33`,
    minHeight: 48,
    paddingHorizontal: 9,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useModalText: {
    fontSize: 9,
    fontWeight: '800',
    color: PRIMARY,
  },
  inputHint: {
    fontSize: 9,
    color: MUTED,
    marginTop: 4,
  },
  inputGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  inputHalf: {
    flex: 1,
  },
  fraudStatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  auditList: {
    marginTop: 14,
    backgroundColor: SOFT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDF4EC',
    padding: 10,
  },
  auditTitle: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: MUTED,
    marginBottom: 6,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#EAF1E9',
  },
  auditLabelBlock: {
    flex: 1,
  },
  auditFlag: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  auditLabel: {
    fontSize: 10,
    lineHeight: 15,
    color: '#405640',
    marginTop: 1,
  },
  auditAmount: {
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  auditEmpty: {
    fontSize: 10,
    color: MUTED,
  },
  legalNote: {
    marginTop: 12,
    backgroundColor: '#EFF6F0',
    borderRadius: 10,
    padding: 10,
  },
  legalNoteText: {
    fontSize: 9,
    lineHeight: 14,
    color: '#4A6A4A',
  },
  toggleButton: {
    backgroundColor: PRIMARY_BG,
    borderWidth: 1,
    borderColor: `${PRIMARY}33`,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  toggleButtonText: {
    fontSize: 9,
    fontWeight: '800',
    color: PRIMARY,
  },
  workflowGrid: {
    gap: 8,
  },
  workflowStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: '#EDF4EC',
    borderRadius: 12,
    padding: 10,
  },
  workflowNumber: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workflowNumberText: {
    fontSize: 10,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  workflowBody: {
    flex: 1,
  },
  workflowAgent: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: MUTED,
  },
  workflowTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: DARK,
    marginTop: 1,
  },
  workflowSummary: {
    fontSize: 9,
    lineHeight: 14,
    color: MUTED,
    marginTop: 2,
  },
  workflowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  agentLogs: {
    gap: 8,
    marginTop: 12,
  },
  agentBlock: {
    backgroundColor: SOFT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDF4EC',
    borderLeftWidth: 3,
    padding: 10,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  agentIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentIconText: {
    fontSize: 13,
  },
  agentHeaderText: {
    flex: 1,
  },
  agentName: {
    fontSize: 11,
    fontWeight: '800',
  },
  agentRole: {
    fontSize: 8,
    color: MUTED,
    marginTop: 1,
  },
  traceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#EAF1E9',
  },
  traceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
  },
  traceBody: {
    flex: 1,
  },
  traceStep: {
    fontSize: 9,
    fontWeight: '800',
    color: DARK,
  },
  traceDetail: {
    fontSize: 9,
    lineHeight: 14,
    color: MUTED,
    marginTop: 1,
  },
  collapsedHint: {
    fontSize: 9,
    lineHeight: 14,
    color: MUTED,
    marginTop: 10,
  },
  actionStack: {
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
  },
  actionPrimary: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  actionSecondary: {
    backgroundColor: PRIMARY_BG,
    borderColor: `${PRIMARY}33`,
  },
  actionPrimaryText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 16,
  },
  actionPrimaryArrow: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionSecondaryText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: PRIMARY,
    lineHeight: 16,
  },
  actionSecondaryArrow: {
    fontSize: 16,
    fontWeight: '800',
    color: PRIMARY,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  loadingErrorIcon: {
    fontSize: 26,
  },
  loadingBody: {
    flex: 1,
  },
  loadingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: DARK,
  },
  loadingMessage: {
    fontSize: 10,
    lineHeight: 15,
    color: MUTED,
    marginTop: 4,
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  footer: {
    textAlign: 'center',
    color: '#98A398',
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 18,
  },
  footerSub: {
    textAlign: 'center',
    color: '#98A398',
    fontSize: 8,
    lineHeight: 12,
    marginTop: 4,
    paddingHorizontal: 8,
  },
});
