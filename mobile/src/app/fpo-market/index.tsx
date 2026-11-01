import React, { useState, useMemo } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { router } from 'expo-router';

import {
  BUYER_DEMAND_LISTINGS,
  FPO_ORGANISATIONS,
  MY_DIRECT_DEALS,
  MY_HARVEST_LISTINGS,
  type BuyerDemandListing,
  type DirectDeal,
  type HarvestListing,
} from '@/data/fpoMarketData';
import Feather from '@expo/vector-icons/Feather';
import { UnifiedPageShell } from '@/components/UnifiedPageShell';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const PRIMARY   = '#2D7A31';
const DARK_HDG  = '#102A13';
const BG        = '#F6F9F5';
const CARD_BDR  = '#E6ECE6';
const MUTED     = '#6B776B';
const AMBER     = '#B7791F';
const RED       = '#C62828';
const TEAL      = '#00796B';
const BLUE      = '#1565C0';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtINR(n: number) {
  return n.toLocaleString('en-IN');
}

function daysTill(isoDate: string): number {
  const diff = new Date(isoDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function urgencyColor(tag?: string): string {
  if (tag === 'Urgent') return RED;
  if (tag === 'Filling Fast') return AMBER;
  if (tag === 'High Demand') return TEAL;
  return PRIMARY;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProtectionBanner() {
  return (
    <View style={styles.protectionBanner}>
      <View style={styles.protectionIconBox}>
        <Feather name="shield" size={18} color={PRIMARY} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.protectionTitle}>Zero Middleman Fee Guarantee</Text>
        <Text style={styles.protectionBody}>
          100% of the buyer&apos;s payment goes directly to your Aadhaar-linked bank account via Direct Benefit Transfer (DBT) — no arhatiya, no commission cuts.
        </Text>
      </View>
    </View>
  );
}

function TabBar({
  tabs,
  active,
  onPress,
}: {
  tabs: string[];
  active: number;
  onPress: (i: number) => void;
}) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab, i) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tabItem, active === i && styles.tabItemActive]}
          onPress={() => onPress(i)}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabText, active === i && styles.tabTextActive]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function TrustBadges({ tags }: { tags: string[] }) {
  return (
    <View style={styles.badgeRow}>
      {tags.map((t, i) => (
        <View key={i} style={styles.trustBadge}>
          <Text style={styles.trustBadgeText}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

function BuyerCard({ listing }: { listing: BuyerDemandListing }) {
  const fpo = FPO_ORGANISATIONS.find((f) => f.id === listing.fpoId)!;
  const pctFilled = Math.round(
    ((listing.requiredQuantityQuintals - listing.availableQuantityQuintals) /
      listing.requiredQuantityQuintals) *
      100
  );
  const daysLeft = daysTill(listing.lastDateToApply);

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Namaste, I saw your listing on FPO Direct Market (Future Farming app) for ${listing.cropVariety}. I am interested in selling. Please guide me through the process.`
    );
    Linking.openURL(`https://wa.me/${fpo.whatsappNumber}?text=${msg}`).catch(() =>
      Alert.alert('WhatsApp not available', `Please call: ${fpo.contactPhone}`)
    );
  };

  const handleCall = () => {
    Linking.openURL(`tel:${fpo.contactPhone}`);
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.cropRow}>
            <View style={styles.cropIconBox}>
              <Feather name="shopping-bag" size={20} color="#15803D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cropVariety}>{listing.cropVariety}</Text>
              <Text style={styles.fpoName}>{fpo.name}</Text>
            </View>
          </View>
        </View>
        {listing.urgencyTag && (
          <View style={[styles.urgencyPill, { backgroundColor: urgencyColor(listing.urgencyTag) + '18', borderColor: urgencyColor(listing.urgencyTag) + '40' }]}>
            <Text style={[styles.urgencyText, { color: urgencyColor(listing.urgencyTag) }]}>
              {listing.urgencyTag}
            </Text>
          </View>
        )}
      </View>

      {/* Trust badges */}
      <TrustBadges tags={fpo.tags} />

      {/* Price comparison */}
      <View style={styles.priceBox}>
        <View style={styles.priceCol}>
          <Text style={styles.priceLabel}>FPO Offered Price</Text>
          <Text style={styles.priceValue}>₹{fmtINR(listing.offeredPricePerQuintal)}</Text>
          <Text style={styles.priceUnit}>/quintal</Text>
        </View>
        <View style={styles.priceDivider} />
        <View style={styles.priceCol}>
          <Text style={styles.priceLabel}>Local Mandi</Text>
          <Text style={[styles.priceValue, { color: MUTED, fontSize: 18 }]}>
            ₹{fmtINR(listing.localMandiPrice)}
          </Text>
          <Text style={styles.priceUnit}>/quintal</Text>
        </View>
        <View style={styles.priceDivider} />
        <View style={styles.priceCol}>
          <Text style={styles.priceLabel}>Your Extra Profit</Text>
          <Text style={[styles.priceValue, { color: PRIMARY, fontSize: 18 }]}>
            +{listing.profitMarginPercent.toFixed(1)}%
          </Text>
          <Text style={styles.priceUnit}>vs mandi</Text>
        </View>
      </View>

      {/* Quantity progress */}
      <View style={{ marginBottom: 12 }}>
        <View style={styles.quantityRow}>
          <Text style={styles.detailLabel}>
            {listing.availableQuantityQuintals} qtl still open
          </Text>
          <Text style={styles.detailLabel}>
            {pctFilled}% filled
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pctFilled}%` as any }]} />
        </View>
      </View>

      {/* Details grid */}
      <View style={styles.detailGrid}>
        <View style={styles.detailItem}>
          <Feather name="package" size={13} color="#15803D" style={{ marginRight: 6 }} />
          <Text style={styles.detailText}>
            {fmtINR(listing.requiredQuantityQuintals)} qtl needed
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Feather name="map-pin" size={13} color="#15803D" style={{ marginRight: 6 }} />
          <Text style={styles.detailText}>{listing.pickupLocation}</Text>
        </View>
        <View style={styles.detailItem}>
          <Feather name="calendar" size={13} color="#15803D" style={{ marginRight: 6 }} />
          <Text style={[styles.detailText, daysLeft <= 5 ? { color: RED, fontWeight: '700' } : {}]}>
            Apply by {listing.lastDateToApply} ({daysLeft}d left)
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Feather name="credit-card" size={13} color="#15803D" style={{ marginRight: 6 }} />
          <Text style={styles.detailText}>{listing.paymentTerms}</Text>
        </View>
        {listing.endBuyerName && (
          <View style={styles.detailItem}>
            <Feather name="briefcase" size={13} color="#15803D" style={{ marginRight: 6 }} />
            <Text style={styles.detailText}>End buyer: {listing.endBuyerName}</Text>
          </View>
        )}
        {listing.notes && (
          <View style={styles.detailItem}>
            <Feather name="file-text" size={13} color="#15803D" style={{ marginRight: 6 }} />
            <Text style={styles.detailText}>{listing.notes}</Text>
          </View>
        )}
      </View>

      {/* Pickup districts */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 2 }}>
            <Feather name="truck" size={13} color="#15803D" />
            <Text style={[styles.detailLabel, { lineHeight: 24 }]}>Free pickup:</Text>
          </View>
          {listing.pickupDistricts.map((d) => (
            <View key={d} style={styles.districtPill}>
              <Text style={styles.districtPillText}>{d}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.whatsappBtn}
          onPress={handleWhatsApp}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="message-circle" size={14} color="#FFFFFF" />
            <Text style={styles.whatsappBtnText}>WhatsApp FPO Secretary</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={handleCall}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="phone" size={14} color="#0F291E" />
            <Text style={styles.callBtnText}>Call</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Harvest Listing Card ─────────────────────────────────────────────────────

function HarvestCard({ listing }: { listing: HarvestListing }) {
  const matchedFPO = listing.matchedFPOId
    ? FPO_ORGANISATIONS.find((f) => f.id === listing.matchedFPOId)
    : null;

  const statusColor =
    listing.status === 'matched' ? PRIMARY :
    listing.status === 'sold' ? BLUE :
    AMBER;

  const statusLabel =
    listing.status === 'matched' ? 'Bid Received' :
    listing.status === 'sold' ? 'Sold' :
    'Awaiting Bids';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cropVariety}>{listing.cropName} — {listing.cropVariety}</Text>
          <Text style={styles.fpoName}>{listing.district} district • Grade {listing.qualityGrade}</Text>
        </View>
        <View style={[styles.urgencyPill, { backgroundColor: statusColor + '18', borderColor: statusColor + '40' }]}>
          <Text style={[styles.urgencyText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.detailGrid}>
        <View style={styles.detailItem}>
          <Feather name="package" size={13} color="#15803D" style={{ marginRight: 6 }} />
          <Text style={styles.detailText}>{listing.quantityQuintals} quintals</Text>
        </View>
        <View style={styles.detailItem}>
          <Feather name="calendar" size={13} color="#15803D" style={{ marginRight: 6 }} />
          <Text style={styles.detailText}>Harvest: {listing.expectedHarvestDate}</Text>
        </View>
        <View style={styles.detailItem}>
          <Feather name="clock" size={13} color="#15803D" style={{ marginRight: 6 }} />
          <Text style={styles.detailText}>Listed: {new Date(listing.postedAt).toLocaleDateString('en-IN')}</Text>
        </View>
      </View>

      {listing.status === 'matched' && listing.bidReceivedPerQuintal && matchedFPO && (
        <View style={styles.bidReceivedBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Feather name="check-circle" size={16} color="#15803D" />
            <Text style={styles.bidReceivedTitle}>Direct Bid Received!</Text>
          </View>
          <Text style={styles.bidReceivedFrom}>{matchedFPO.name}</Text>
          <Text style={styles.bidReceivedPrice}>
            ₹{fmtINR(listing.bidReceivedPerQuintal)}/quintal
          </Text>
          <Text style={styles.bidReceivedTotal}>
            Total: ₹{fmtINR(listing.bidReceivedPerQuintal * listing.quantityQuintals)}
          </Text>
          <TouchableOpacity
            style={styles.acceptBidBtn}
            onPress={() => Alert.alert('Bid Accepted', `Your soybean deal with ${matchedFPO.name} has been confirmed. DBT payment will be processed within 5 working days after delivery.`)}
            activeOpacity={0.8}
          >
            <Text style={styles.acceptBidBtnText}>Accept This Bid & Confirm Deal</Text>
          </TouchableOpacity>
        </View>
      )}

      {listing.status === 'active' && (
        <View style={styles.awaitingBox}>
          <Text style={styles.awaitingText}>
            Our AI matchmaker is scanning 40+ regional FPOs for your {listing.cropName}. You&apos;ll receive a direct bid within 24 hours.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Deal Card ────────────────────────────────────────────────────────────────

function DealCard({ deal }: { deal: DirectDeal }) {
  const fpo = FPO_ORGANISATIONS.find((f) => f.id === deal.fpoId)!;

  const payStatusColor =
    deal.paymentStatus === 'paid' ? PRIMARY :
    deal.paymentStatus === 'processing' ? AMBER :
    deal.paymentStatus === 'failed' ? RED :
    MUTED;

  const payStatusLabel =
    deal.paymentStatus === 'paid' ? 'Payment Received (DBT)' :
    deal.paymentStatus === 'processing' ? 'DBT Processing' :
    deal.paymentStatus === 'failed' ? 'Payment Failed' :
    'Pending';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cropVariety}>{deal.cropName} — {deal.cropVariety}</Text>
          <Text style={styles.fpoName}>{fpo.name}</Text>
        </View>
        <View style={[styles.urgencyPill, { backgroundColor: payStatusColor + '15', borderColor: payStatusColor + '30' }]}>
          <Text style={[styles.urgencyText, { color: payStatusColor, fontSize: 10 }]}>{payStatusLabel}</Text>
        </View>
      </View>

      <View style={styles.priceBox}>
        <View style={styles.priceCol}>
          <Text style={styles.priceLabel}>Agreed Rate</Text>
          <Text style={styles.priceValue}>₹{fmtINR(deal.agreedPricePerQuintal)}</Text>
          <Text style={styles.priceUnit}>/quintal</Text>
        </View>
        <View style={styles.priceDivider} />
        <View style={styles.priceCol}>
          <Text style={styles.priceLabel}>Quantity</Text>
          <Text style={[styles.priceValue, { fontSize: 18 }]}>{deal.quantityQuintals}</Text>
          <Text style={styles.priceUnit}>quintals</Text>
        </View>
        <View style={styles.priceDivider} />
        <View style={styles.priceCol}>
          <Text style={styles.priceLabel}>Total DBT</Text>
          <Text style={[styles.priceValue, { color: PRIMARY, fontSize: 16 }]}>
            ₹{fmtINR(deal.totalValue)}
          </Text>
          <Text style={styles.priceUnit}>to your a/c</Text>
        </View>
      </View>

      <View style={styles.detailGrid}>
        <View style={styles.detailItem}>
          <Feather name="calendar" size={13} color="#15803D" style={{ marginRight: 6 }} />
          <Text style={styles.detailText}>Contract: {deal.contractDate}</Text>
        </View>
        {deal.deliveryDate && (
          <View style={styles.detailItem}>
            <Feather name="truck" size={13} color="#15803D" style={{ marginRight: 6 }} />
            <Text style={styles.detailText}>Delivery: {deal.deliveryDate}</Text>
          </View>
        )}
        {deal.utrNumber && (
          <View style={styles.detailItem}>
            <Feather name="credit-card" size={13} color="#15803D" style={{ marginRight: 6 }} />
            <Text style={styles.detailText}>UTR: {deal.utrNumber}</Text>
          </View>
        )}
        {deal.notes && (
          <View style={styles.detailItem}>
            <Feather name="file-text" size={13} color="#15803D" style={{ marginRight: 6 }} />
            <Text style={styles.detailText}>{deal.notes}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Tab: Buyer Board ─────────────────────────────────────────────────────────

const CROP_FILTERS = ['All', 'Wheat', 'Tomato', 'Onion', 'Soybean', 'Cotton', 'Grapes'];

function BuyerBoardTab() {
  const [activeCrop, setActiveCrop] = useState('All');

  const filtered = useMemo(
    () =>
      activeCrop === 'All'
        ? BUYER_DEMAND_LISTINGS
        : BUYER_DEMAND_LISTINGS.filter((l) => l.cropName === activeCrop),
    [activeCrop]
  );

  return (
    <>
      <ProtectionBanner />

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{BUYER_DEMAND_LISTINGS.length}</Text>
          <Text style={styles.statLbl}>Active Listings</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>5</Text>
          <Text style={styles.statLbl}>Verified FPOs</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: PRIMARY }]}>₹0</Text>
          <Text style={styles.statLbl}>Commission</Text>
        </View>
      </View>

      {/* Crop filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
          {CROP_FILTERS.map((c) => {
            const active = c === activeCrop;
            return (
              <TouchableOpacity
                key={c}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setActiveCrop(c)}
                activeOpacity={0.75}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {filtered.map((l) => (
        <BuyerCard key={l.id} listing={l} />
      ))}

      {filtered.length === 0 && (
        <View style={styles.emptyBox}>
          <Feather name="search" size={24} color="#6B7280" />
          <Text style={styles.emptyTitle}>No listings found</Text>
          <Text style={styles.emptyBody}>No active buyer requests for this crop right now. Check back tomorrow or list your harvest to receive bids.</Text>
        </View>
      )}
    </>
  );
}

// ─── Tab: List Harvest ────────────────────────────────────────────────────────

function ListHarvestTab() {
  return (
    <>
      <ProtectionBanner />

      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <View style={styles.protectionIconBox}>
            <Feather name="file-text" size={20} color={PRIMARY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Post Your Harvest Listing</Text>
            <Text style={styles.cardSubtitle}>Our AI matchmaker will find the best FPO buyer for your crop</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => router.push('/fpo-market/create-listing' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaBtnText}>+ Create New Harvest Listing</Text>
        </TouchableOpacity>

        <View style={styles.howItWorksBox}>
          <Text style={styles.howItWorksTitle}>How it works</Text>
          {[
            'Post your crop details — type, quantity, quality grade & location',
            'Our AI matchmaker scans 40+ regional FPOs within 24 hours',
            'Receive direct bids from verified FPOs — no brokers involved',
            'Accept the best bid & receive full payment via DBT to your account',
          ].map((text, i) => (
            <View key={i} style={styles.howStep}>
              <View style={styles.howStepNumBox}>
                <Text style={styles.howStepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.howStepText}>{text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* My listings */}
      <Text style={styles.sectionTitle}>My Harvest Listings</Text>
      {MY_HARVEST_LISTINGS.map((l) => (
        <HarvestCard key={l.id} listing={l} />
      ))}
    </>
  );
}

// ─── Tab: My Deals ────────────────────────────────────────────────────────────

function MyDealsTab() {
  return (
    <>
      <ProtectionBanner />

      {MY_DIRECT_DEALS.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EDF5EE', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Feather name="users" size={20} color="#15803D" />
          </View>
          <Text style={styles.emptyTitle}>No Active Deals</Text>
          <Text style={styles.emptyBody}>
            Once you accept a bid or connect with an FPO buyer, your contracts and payment status will appear here.
          </Text>
        </View>
      ) : (
        MY_DIRECT_DEALS.map((d) => <DealCard key={d.id} deal={d} />)
      )}

      {/* DBT guarantee notice */}
      <View style={styles.dbtBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Feather name="credit-card" size={16} color="#15803D" />
          <Text style={styles.dbtTitle}>How Direct Benefit Transfer Works</Text>
        </View>
        <Text style={styles.dbtBody}>
          All FPO payments on this platform are routed through the NABARD-linked Digital Kisan Credit system. Your Aadhaar-linked bank account receives funds directly. No commissions are deducted by any intermediary. Each payment comes with a UTR number for verification.
        </Text>
      </View>
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const TABS = ['FPO Buyers', 'List Harvest', 'My Deals'];

export default function FPOMarketScreen() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <UnifiedPageShell
      title="FPO Direct Market"
      subtitle="Connect directly with verified FPO buyers • Zero commission guaranteed"
      statusText="Zero Commission"
      backLabel="Back to Home"
      scrollable={true}
    >
      <View style={styles.mainContainer}>
        {/* Hero banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroEyebrow}>DIRECT FARMER-TO-BUYER MARKETPLACE</Text>
          <Text style={styles.heroTitle}>{'Sell at full\nmarket value.'}</Text>
          <Text style={styles.heroBody}>
            Connect directly with Govt-verified FPOs, cooperatives &amp; bulk buyers. No arhatiya. No commission. Your price, your profit.
          </Text>
        </View>

        {/* Tab bar */}
        <TabBar tabs={TABS} active={activeTab} onPress={setActiveTab} />

        {/* Content */}
        <View style={styles.tabContent}>
          {activeTab === 0 && <BuyerBoardTab />}
          {activeTab === 1 && <ListHarvestTab />}
          {activeTab === 2 && <MyDealsTab />}
        </View>

        <Text style={styles.footer}>
          FUTURE FARMING • FPO DIRECT MARKET • ZERO COMMISSION GUARANTEED
        </Text>
      </View>
    </UnifiedPageShell>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  mainContainer: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 16,
  },
  tabContent: {
    marginTop: 14,
  },
  safe: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 48 },

  heroBanner: {
    backgroundColor: '#0F291E',
    borderRadius: 16,
    padding: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  heroEyebrow: {
    color: '#86EFAC',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 8,
  },
  heroBody: { color: '#CBD5E1', fontSize: 12.5, lineHeight: 18 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: CARD_BDR,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: PRIMARY },
  tabText: { fontSize: 12, fontWeight: '600', color: MUTED },
  tabTextActive: { color: PRIMARY, fontWeight: '800' },

  // Protection banner
  protectionBanner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: PRIMARY + '12',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PRIMARY + '30',
    padding: 14,
    marginTop: 16,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  protectionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EDF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  protectionIcon: { fontSize: 24 },
  protectionTitle: { fontSize: 13, fontWeight: '800', color: PRIMARY, marginBottom: 4 },
  protectionBody: { fontSize: 11, color: '#2A4A2A', lineHeight: 17 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CARD_BDR,
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK_HDG,
    fontVariant: ['tabular-nums'],
  },
  statLbl: { fontSize: 10, color: MUTED, marginTop: 2, textAlign: 'center' },

  // Filter pills
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F0F4F0',
    borderWidth: 1,
    borderColor: CARD_BDR,
  },
  pillActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  pillText: { fontSize: 12, color: MUTED, fontWeight: '600' },
  pillTextActive: { color: '#FFFFFF' },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: CARD_BDR,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: DARK_HDG },
  cardSubtitle: { fontSize: 11, color: MUTED, marginTop: 3, lineHeight: 16 },

  // Crop info
  cropRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cropIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EDF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropVariety: { fontSize: 14, fontWeight: '800', color: DARK_HDG, lineHeight: 20 },
  fpoName: { fontSize: 11, color: MUTED, marginTop: 2 },

  urgencyPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  urgencyText: { fontSize: 11, fontWeight: '700' },

  // Trust badges
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  trustBadge: {
    backgroundColor: '#F0F7F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#D0E8D0',
  },
  trustBadgeText: { fontSize: 10, color: PRIMARY, fontWeight: '600' },

  // Price box
  priceBox: {
    flexDirection: 'row',
    backgroundColor: DARK_HDG,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  priceCol: { flex: 1, alignItems: 'center' },
  priceDivider: { width: 1, backgroundColor: '#FFFFFF20', marginHorizontal: 4 },
  priceLabel: { fontSize: 9, color: '#8FA88F', marginBottom: 4 },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  priceUnit: {
    fontSize: 9,
    color: '#8FA88F',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },

  // Quantity progress
  quantityRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressTrack: {
    height: 6,
    backgroundColor: '#E6ECE6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: PRIMARY,
    borderRadius: 3,
  },

  // Detail grid
  detailGrid: { gap: 6, marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  detailIcon: { fontSize: 13, lineHeight: 18 },
  detailLabel: { fontSize: 11, color: MUTED },
  detailText: { flex: 1, fontSize: 11, color: '#3A4A3A', lineHeight: 17 },

  // District pills
  districtPill: {
    backgroundColor: '#EBF5EC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#C8DEC8',
  },
  districtPillText: { fontSize: 10, color: PRIMARY, fontWeight: '600' },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 10 },
  whatsappBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  callBtn: {
    backgroundColor: '#E8F0E8',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CARD_BDR,
  },
  callBtnText: { color: PRIMARY, fontWeight: '700', fontSize: 12 },

  // Section title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK_HDG,
    marginBottom: 12,
    marginTop: 4,
  },

  // Bid received box
  bidReceivedBox: {
    backgroundColor: PRIMARY + '10',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: PRIMARY + '30',
    marginTop: 4,
  },
  bidReceivedTitle: { fontSize: 13, fontWeight: '800', color: PRIMARY, marginBottom: 6 },
  bidReceivedFrom: { fontSize: 11, color: MUTED, marginBottom: 4 },
  bidReceivedPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK_HDG,
    marginBottom: 2,
    fontVariant: ['tabular-nums'],
  },
  bidReceivedTotal: {
    fontSize: 13,
    color: '#2A4A2A',
    fontWeight: '700',
    marginBottom: 12,
    fontVariant: ['tabular-nums'],
  },
  acceptBidBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBidBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

  // Awaiting box
  awaitingBox: {
    backgroundColor: AMBER + '10',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: AMBER + '30',
    marginTop: 4,
  },
  awaitingText: { fontSize: 11, color: '#5C4A1A', lineHeight: 17 },

  // CTA button
  ctaBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ctaBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },

  // How it works
  howItWorksBox: {
    backgroundColor: '#F4F8F4',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: CARD_BDR,
  },
  howItWorksTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: DARK_HDG,
    marginBottom: 10,
  },
  howStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  howStepNumBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EDF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  howStepNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: PRIMARY,
    fontVariant: ['tabular-nums'],
  },
  howStepIcon: { fontSize: 16, lineHeight: 20 },
  howStepText: { flex: 1, fontSize: 12, color: '#3A4A3A', lineHeight: 18 },

  // DBT box
  dbtBox: {
    backgroundColor: BLUE + '10',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: BLUE + '25',
    marginTop: 6,
    marginBottom: 8,
  },
  dbtTitle: { fontSize: 13, fontWeight: '800', color: BLUE, marginBottom: 6 },
  dbtBody: { fontSize: 11, color: '#1A2A3A', lineHeight: 17 },

  // Empty state
  emptyBox: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BDR,
    marginTop: 8,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: DARK_HDG, marginBottom: 6 },
  emptyBody: { fontSize: 12, color: MUTED, textAlign: 'center', lineHeight: 18 },

  // Footer
  footer: {
    textAlign: 'center',
    color: '#98A398',
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 12,
  },
});
