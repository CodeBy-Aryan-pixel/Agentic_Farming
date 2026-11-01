import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { UnifiedPageShell } from '@/components/UnifiedPageShell';
import {
  CROP_OPTIONS,
  MAHARASHTRA_DISTRICTS,
  FPO_ORGANISATIONS,
  type QualityGrade,
} from '@/data/fpoMarketData';
import {
  FPO_MARKET_ROUTE,
  safeGoBack,
} from '@/utils/navigation';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const PRIMARY   = '#2D7A31';
const DARK_HDG  = '#102A13';
const BG        = '#F6F9F5';
const CARD_BDR  = '#E6ECE6';
const MUTED     = '#6B776B';

// ─── Step indicator ──────────────────────────────────────────────────────────
function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.stepRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            i === current && styles.stepDotActive,
            i < current && styles.stepDotDone,
          ]}
        >
          {i < current && <Feather name="check" size={10} color="#FFFFFF" />}
        </View>
      ))}
    </View>
  );
}

// ─── Pill selector ───────────────────────────────────────────────────────────
function PillSelector<T extends string>({
  options,
  selected,
  onSelect,
  label,
}: {
  options: T[];
  selected: T | '';
  onSelect: (v: T) => void;
  label: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
          {options.map((o) => {
            const active = selected === o;
            return (
              <TouchableOpacity
                key={o}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => onSelect(o)}
                activeOpacity={0.75}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{o}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Simulated AI match result ────────────────────────────────────────────────
function buildMatchResult(
  cropName: string,
  district: string,
  quintals: string,
  grade: QualityGrade
) {
  // Pick matching FPOs heuristically from mock data
  const shuffled = [...FPO_ORGANISATIONS].sort(() => 0.5 - Math.random()).slice(0, 3);
  return shuffled.map((fpo, i) => ({
    fpo,
    bidPerQuintal: 4800 + Math.round(Math.random() * 800) - i * 100,
    estimatedTotal: (4800 + Math.round(Math.random() * 800) - i * 100) * (parseFloat(quintals) || 10),
    responseTime: ['Immediate', '~2 hours', '~8 hours'][i],
  }));
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const GRADES: QualityGrade[] = ['A', 'B', 'C'];
const TOTAL_STEPS = 3;

export default function CreateListingScreen() {
  const [step, setStep] = useState(0);

  // Form fields
  const [selectedCropId, setSelectedCropId] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('');
  const [quintals, setQuintals] = useState('');
  const [grade, setGrade] = useState<QualityGrade | ''>('');
  const [harvestDate, setHarvestDate] = useState('');
  const [district, setDistrict] = useState('');
  const [description, setDescription] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);

  // Step 3 — match results
  const [matchResults, setMatchResults] = useState<ReturnType<typeof buildMatchResult>>([]);

  const selectedCrop = CROP_OPTIONS.find((c) => c.id === selectedCropId);

  // Validation per step
  const step0Valid = !!selectedCropId && !!selectedVariety;
  const step1Valid =
    !!quintals && parseFloat(quintals) > 0 && !!grade && !!harvestDate && !!district;

  const handleNext = () => {
    if (step === 0 && !step0Valid) {
      Alert.alert('Missing Info', 'Please select a crop and variety to continue.');
      return;
    }
    if (step === 1 && !step1Valid) {
      Alert.alert('Missing Info', 'Please fill in all required fields (quantity, grade, harvest date, district).');
      return;
    }
    if (step === 1) {
      // Submit → simulate AI matchmaking
      setTimeout(() => {
        const results = buildMatchResult(
          selectedCrop?.label ?? selectedCropId,
          district,
          quintals,
          grade as QualityGrade
        );
        setMatchResults(results);
        setStep(2);
      }, 1800);
      setStep(1.5 as any); // loading state
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step === 0) {
      safeGoBack(FPO_MARKET_ROUTE);
    } else {
      setStep((s) => (s > 2 ? 2 : s - 1));
    }
  };

  const handleAcceptBid = (bidPerQuintal: number, fpoName: string) => {
    Alert.alert(
      'Bid Accepted!',
      `Your ${selectedCrop?.label} listing has been confirmed with ${fpoName} at ₹${bidPerQuintal}/quintal. They will contact you within 24 hours to arrange pickup. DBT payment will be sent after delivery.`,
      [
        {
          text: 'Go to My Deals',
          onPress: () => {
            safeGoBack(FPO_MARKET_ROUTE);
          },
        },
      ]
    );
  };

  const isLoading = step === (1.5 as any);

  return (
    <UnifiedPageShell
      activeRoute="/fpo-market"
      title="List Produce"
      subtitle="Direct buyer matchmaker & spot pricing"
      statusPillText="NABARD Verified"
      onBack={handleBack}
      scrollable={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          {/* Step dots */}
          {!isLoading && step < 3 && (
            <StepDots total={TOTAL_STEPS} current={step > 2 ? 2 : step} />
          )}

          {/* ─── Loading State ─── */}
          {isLoading && (
            <View style={styles.loadingBox}>
              <View style={styles.loadingIconBox}>
                <MaterialCommunityIcons name="robot-outline" size={40} color="#15803D" />
              </View>
              <Text style={styles.loadingTitle}>AI Matchmaker Running…</Text>
              <Text style={styles.loadingBody}>
                Scanning 40+ verified FPOs across {district} and nearby districts for your{' '}
                {selectedCrop?.label} listing. This takes just a moment.
              </Text>
              <View style={styles.loadingDots}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={styles.loadingDot} />
                ))}
              </View>
            </View>
          )}

          {/* ─── Step 0: Crop & Variety ─── */}
          {step === 0 && (
            <View>
              <View style={styles.card}>
                <Text style={styles.stepHeading}>Step 1 of 3 — Select Your Crop</Text>
                <Text style={styles.stepSubtitle}>Choose the crop you want to sell directly to an FPO buyer</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Crop Type *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
                      {CROP_OPTIONS.map((c) => {
                        const active = selectedCropId === c.id;
                        return (
                          <TouchableOpacity
                            key={c.id}
                            style={[styles.cropPill, active && styles.cropPillActive]}
                            onPress={() => {
                              setSelectedCropId(c.id);
                              setSelectedVariety('');
                            }}
                            activeOpacity={0.75}
                          >
                            <Text style={[styles.cropPillText, active && styles.cropPillTextActive]}>
                              {c.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                {selectedCrop && (
                  <PillSelector
                    label="Variety / Grade Type *"
                    options={selectedCrop.varieties as any}
                    selected={selectedVariety}
                    onSelect={setSelectedVariety}
                  />
                )}
              </View>

              {/* Photo upload simulation */}
              <View style={styles.card}>
                <Text style={styles.fieldLabel}>Upload Crop Photo (Optional)</Text>
                <TouchableOpacity
                  style={[styles.photoUploadBox, hasPhoto && styles.photoUploadBoxDone]}
                  onPress={() => {
                    setHasPhoto(true);
                    Alert.alert('Photo Added', 'Sample crop photo attached. Real photo upload will be available in the full release.');
                  }}
                  activeOpacity={0.8}
                >
                  <Feather
                    name={hasPhoto ? 'check-circle' : 'camera'}
                    size={26}
                    color="#15803D"
                    style={{ marginBottom: 6 }}
                  />
                  <Text style={[styles.photoUploadText, hasPhoto && { color: PRIMARY }]}>
                    {hasPhoto ? 'Photo attached!' : 'Tap to add a photo of your crop'}
                  </Text>
                  <Text style={styles.photoUploadSub}>
                    {hasPhoto
                      ? 'FPOs can now see your produce quality'
                      : 'Listings with photos receive 3× more bids'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ─── Step 1: Quantity & Details ─── */}
          {step === 1 && (
            <View style={styles.card}>
              <Text style={styles.stepHeading}>Step 2 of 3 — Quantity & Details</Text>
              <Text style={styles.stepSubtitle}>
                Tell FPO buyers exactly what you have. More details = better bids.
              </Text>

              {/* Quantity */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Quantity Available (Quintals) *</Text>
                <TextInput
                  style={styles.input}
                  value={quintals}
                  onChangeText={setQuintals}
                  keyboardType="numeric"
                  placeholder="e.g. 50"
                  placeholderTextColor="#B0BDB0"
                />
              </View>

              {/* Quality grade */}
              <PillSelector
                label="Quality Grade *"
                options={GRADES}
                selected={grade}
                onSelect={setGrade}
              />
              <View style={styles.gradeHint}>
                <Text style={styles.gradeHintText}>
                  Grade A: Premium (uniform size, low moisture, export-quality) |  Grade B: Standard (minor imperfections) |  Grade C: Processing-grade
                </Text>
              </View>

              {/* Harvest date */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Expected Harvest Date * (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={harvestDate}
                  onChangeText={setHarvestDate}
                  placeholder="e.g. 2026-12-10"
                  placeholderTextColor="#B0BDB0"
                />
              </View>

              {/* District */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Your District *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
                    {MAHARASHTRA_DISTRICTS.slice(0, 18).map((d) => {
                      const active = district === d;
                      return (
                        <TouchableOpacity
                          key={d}
                          style={[styles.pill, active && styles.pillActive]}
                          onPress={() => setDistrict(d)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.pillText, active && styles.pillTextActive]}>{d}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {/* Description */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Additional Details (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="e.g. Organic, low pesticide use, well-sorted, available for immediate pickup..."
                  placeholderTextColor="#B0BDB0"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          )}

          {/* ─── Step 2: Match Results ─── */}
          {step === 2 && matchResults.length > 0 && (
            <View>
              <View style={styles.matchSuccessBanner}>
                <View style={styles.matchSuccessIconBox}>
                  <Feather name="check-circle" size={24} color="#15803D" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.matchSuccessTitle}>
                    {matchResults.length} FPO Bids Found!
                  </Text>
                  <Text style={styles.matchSuccessBody}>
                    Our AI matched your {selectedCrop?.label} ({quintals} qtl, Grade {grade}) listing with {matchResults.length} verified FPOs in and around {district}.
                  </Text>
                </View>
              </View>

              {/* Listing summary */}
              <View style={styles.card}>
                <Text style={[styles.fieldLabel, { marginBottom: 10 }]}>Your Listing Summary</Text>
                <View style={{ gap: 6 }}>
                  {[
                    ['package', 'Crop', `${selectedCrop?.label} — ${selectedVariety}`],
                    ['layers', 'Quantity', `${quintals} quintals`],
                    ['award', 'Grade', `Grade ${grade}`],
                    ['calendar', 'Harvest', harvestDate],
                    ['map-pin', 'District', district],
                  ].map(([icon, label, value]) => (
                    <View key={label} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                      <Feather name={icon as any} size={13} color="#15803D" style={{ marginTop: 2 }} />
                      <Text style={[styles.fieldLabel, { minWidth: 70, marginBottom: 0, fontWeight: '600' }]}>{label}:</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: DARK_HDG, fontWeight: '700' }}>{value}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Bids */}
              <Text style={styles.sectionTitle}>Select the Best Bid</Text>
              {matchResults.map(({ fpo, bidPerQuintal, estimatedTotal, responseTime }, i) => (
                <View key={fpo.id} style={[styles.card, i === 0 && styles.bestBidCard]}>
                  {i === 0 && (
                    <View style={styles.bestBidBadge}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Feather name="award" size={11} color="#FFFFFF" />
                        <Text style={styles.bestBidBadgeText}>Highest Bid</Text>
                      </View>
                    </View>
                  )}
                  <Text style={styles.cropVariety}>{fpo.name}</Text>
                  <Text style={styles.fpoName}>
                    {fpo.district}, {fpo.state} • Rating: {fpo.rating} / 5.0
                  </Text>

                  <View style={styles.bidPriceRow}>
                    <View>
                      <Text style={[styles.fieldLabel, { marginBottom: 2 }]}>Offered Rate</Text>
                      <Text style={styles.bidPrice}>₹{bidPerQuintal.toLocaleString('en-IN')}<Text style={styles.bidPriceUnit}>/quintal</Text></Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.fieldLabel, { marginBottom: 2 }]}>Estimated Total</Text>
                      <Text style={[styles.bidPrice, { color: PRIMARY }]}>
                        ₹{Math.round(estimatedTotal).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                    <View style={styles.bidTag}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Feather name="check" size={10} color="#15803D" />
                        <Text style={styles.bidTagText}>Zero Commission</Text>
                      </View>
                    </View>
                    <View style={styles.bidTag}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Feather name="zap" size={10} color="#15803D" />
                        <Text style={styles.bidTagText}>{responseTime} response</Text>
                      </View>
                    </View>
                    <View style={styles.bidTag}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Feather name="truck" size={10} color="#15803D" />
                        <Text style={styles.bidTagText}>Free Pickup</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.acceptBidBtn, i !== 0 && styles.acceptBidBtnSecondary]}
                    onPress={() => handleAcceptBid(bidPerQuintal, fpo.name)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.acceptBidBtnText, i !== 0 && { color: PRIMARY }]}>
                      {i === 0 ? 'Accept Best Bid' : 'Accept This Bid'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.guaranteeBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Feather name="shield" size={15} color="#15803D" />
                  <Text style={styles.guaranteeTitle}>Buyer Guarantee</Text>
                </View>
                <Text style={styles.guaranteeBody}>
                  All FPOs listed here are verified by NABARD and SFAC. Your payment is guaranteed via Direct Benefit Transfer — no commission deducted by anyone, including this platform.
                </Text>
              </View>
            </View>
          )}

          {/* Next / Submit button */}
          {!isLoading && step < 2 && (
            <TouchableOpacity
              style={[styles.nextBtn, step === 1 && { backgroundColor: DARK_HDG }]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBtnText}>
                {step === 1 ? 'Find FPO Buyers Now' : 'Next →'}
              </Text>
            </TouchableOpacity>
          )}

          {step === 2 && (
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: '#E8F0E8', marginTop: 4 }]}
              onPress={() => safeGoBack(FPO_MARKET_ROUTE)}
              activeOpacity={0.8}
            >
              <Text style={[styles.nextBtnText, { color: PRIMARY }]}>← Back to Marketplace</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.footer}>
            FUTURE FARMING • FPO DIRECT MARKET • YOUR DATA IS PRIVATE
          </Text>
        </View>
      </KeyboardAvoidingView>
    </UnifiedPageShell>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 48 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: BG,
    borderBottomWidth: 1,
    borderBottomColor: CARD_BDR,
  },
  backBtn: { padding: 8, borderRadius: 10, backgroundColor: '#E8F0E8' },
  backText: { color: PRIMARY, fontWeight: '700', fontSize: 13 },
  screenTitle: { fontSize: 17, fontWeight: '800', color: DARK_HDG },
  screenSubtitle: { fontSize: 11, color: MUTED, marginTop: 1 },

  // Step dots
  stepRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E6ECE6',
    borderWidth: 2,
    borderColor: CARD_BDR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  stepDotDone: { backgroundColor: PRIMARY + '40', borderColor: PRIMARY },
  stepDotCheckmark: { color: PRIMARY, fontWeight: '800', fontSize: 12 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: CARD_BDR,
  },
  stepHeading: { fontSize: 15, fontWeight: '800', color: DARK_HDG, marginBottom: 4 },
  stepSubtitle: { fontSize: 11, color: MUTED, lineHeight: 16, marginBottom: 16 },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: DARK_HDG, marginBottom: 8 },
  input: {
    backgroundColor: '#F4F8F4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CARD_BDR,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: DARK_HDG,
  },
  textArea: { height: 90, textAlignVertical: 'top', paddingTop: 11 },

  // Pills
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

  cropPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F0F4F0',
    borderWidth: 1,
    borderColor: CARD_BDR,
  },
  cropPillActive: { backgroundColor: PRIMARY + '15', borderColor: PRIMARY },
  cropPillText: { fontSize: 13, color: MUTED, fontWeight: '600' },
  cropPillTextActive: { color: PRIMARY, fontWeight: '800' },

  gradeHint: {
    backgroundColor: '#F4F8F4',
    borderRadius: 8,
    padding: 10,
    marginTop: -8,
    marginBottom: 16,
  },
  gradeHintText: { fontSize: 10, color: MUTED, lineHeight: 15 },

  // Photo upload
  photoUploadBox: {
    borderWidth: 2,
    borderColor: CARD_BDR,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FAFCFA',
  },
  photoUploadBoxDone: { borderColor: PRIMARY, backgroundColor: PRIMARY + '08' },
  photoUploadIcon: { fontSize: 32, marginBottom: 8 },
  photoUploadText: { fontSize: 13, fontWeight: '700', color: DARK_HDG, marginBottom: 4 },
  photoUploadSub: { fontSize: 11, color: MUTED, textAlign: 'center' },

  // Loading
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BDR,
    marginTop: 16,
  },
  loadingIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#EDF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingTitle: { fontSize: 18, fontWeight: '800', color: DARK_HDG, marginBottom: 8, textAlign: 'center' },
  loadingBody: { fontSize: 12, color: MUTED, lineHeight: 18, textAlign: 'center', marginBottom: 24 },
  loadingDots: { flexDirection: 'row', gap: 10 },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PRIMARY,
    opacity: 0.5,
  },

  // Match results
  matchSuccessBanner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#EDF5EE',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C8DEC8',
    padding: 14,
    marginTop: 16,
    marginBottom: 14,
    alignItems: 'center',
  },
  matchSuccessIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchSuccessTitle: { fontSize: 15, fontWeight: '800', color: PRIMARY, marginBottom: 4 },
  matchSuccessBody: { fontSize: 11, color: '#2A4A2A', lineHeight: 17 },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: DARK_HDG, marginBottom: 12 },
  cropVariety: { fontSize: 14, fontWeight: '800', color: DARK_HDG },
  fpoName: { fontSize: 11, color: MUTED, marginTop: 2, marginBottom: 10 },

  bestBidCard: { borderColor: PRIMARY, borderWidth: 2 },
  bestBidBadge: {
    alignSelf: 'flex-start',
    backgroundColor: PRIMARY,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  bestBidBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },

  bidPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bidPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK_HDG,
    fontVariant: ['tabular-nums'],
  },
  bidPriceUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: MUTED,
    fontVariant: ['tabular-nums'],
  },

  bidTag: {
    backgroundColor: '#F0F7F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#C8DEC8',
  },
  bidTagText: { fontSize: 10, color: PRIMARY, fontWeight: '600' },

  acceptBidBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBidBtnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: PRIMARY,
  },
  acceptBidBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

  guaranteeBox: {
    backgroundColor: '#F0F7F0',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C8DEC8',
    marginTop: 4,
    marginBottom: 14,
  },
  guaranteeTitle: { fontSize: 13, fontWeight: '800', color: PRIMARY, marginBottom: 4 },
  guaranteeBody: { fontSize: 11, color: '#2A4A2A', lineHeight: 17 },

  // Next button
  nextBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  nextBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },

  footer: {
    textAlign: 'center',
    color: '#98A398',
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 12,
  },
});
