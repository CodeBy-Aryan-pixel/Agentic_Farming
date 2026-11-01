import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';

import { ActionButton } from '@/components/ActionButton';
import { UnifiedPageShell } from '@/components/UnifiedPageShell';
import {
  useAuth,
  type ActivityLogItem,
  type ActivityType,
} from '@/context/AuthContext';
import { AUTH_ROUTE, HOME_ROUTE, safeGoBack } from '@/utils/navigation';

/* ─── Design Tokens ─────────────────────────────────────────────────── */
const BRAND_DARK = '#0F291E';
const BRAND_EMERALD = '#15803D';
const BG_PAGE = '#F7F9F7';
const CARD_BG = '#FFFFFF';
const BORDER_SUBTLE = '#E6ECE6';
const TEXT_PRIMARY = '#111827';
const TEXT_MUTED = '#6B7280';
const SAGE_TINT = '#EDF5EE';
const PILL_BG = '#F3F4F6';

type FilterCategory = 'ALL' | 'CROP_SCAN' | 'AGRI_ORDER' | 'AUTH' | 'IRRIGATION';

const FILTER_TABS: { id: FilterCategory; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'ALL', label: 'All Activities', icon: 'list' },
  { id: 'CROP_SCAN', label: 'Crop Doctor Scans', icon: 'camera' },
  { id: 'AGRI_ORDER', label: 'Agri-Shop Orders', icon: 'shopping-bag' },
  { id: 'AUTH', label: 'Farmer Logins & Auth', icon: 'users' },
  { id: 'IRRIGATION', label: 'Irrigation & Valves', icon: 'droplet' },
];

const REGIONAL_DISEASES = [
  {
    name: 'Sugarcane Rust Disease',
    scientific: 'Puccinia melanocephala',
    cases: 38,
    pct: 42,
    districts: 'Kolhapur, Sangli',
    severity: 'Critical',
  },
  {
    name: 'Tomato Early Blight',
    scientific: 'Alternaria solani',
    cases: 26,
    pct: 29,
    districts: 'Pune, Nashik',
    severity: 'High',
  },
  {
    name: 'Soybean Septoria Brown Spot',
    scientific: 'Septoria glycines',
    cases: 17,
    pct: 19,
    districts: 'Sangli, Satara',
    severity: 'Moderate',
  },
  {
    name: 'Spinach Cercospora Leaf Spot',
    scientific: 'Cercospora beticola',
    cases: 8,
    pct: 10,
    districts: 'Pune, Kolhapur',
    severity: 'Low',
  },
];

export default function AdminCommandCenter() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 720;

  const {
    user,
    registeredFarmers,
    activityLogs,
    activeBroadcast,
    publishBroadcast,
    clearBroadcast,
    simulateLiveActivity,
    updateFarmerOrderStatus,
    logout,
  } = useAuth();

  // Search & Filter State
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Broadcast Advisory State
  const [broadcastTitle, setBroadcastTitle] = useState(
    'Foliar Fungicide Advisory: Sugarcane Rust Spores'
  );
  const [broadcastMessage, setBroadcastMessage] = useState(
    'High spore concentration detected in southern Maharashtra. Apply Indofil M-45 (2.5 g/L) or Tilt 250 EC within 48h.'
  );
  const [broadcastSeverity, setBroadcastSeverity] = useState<
    'info' | 'warning' | 'critical'
  >('warning');
  const [broadcastDistrict, setBroadcastDistrict] = useState(
    'Kolhapur & Sangli Districts'
  );
  const [isPublishingBroadcast, setIsPublishingBroadcast] = useState(false);
  const [broadcastSuccessNotice, setBroadcastSuccessNotice] = useState<
    string | null
  >(null);

  // Filtered Activity Logs
  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      const matchesCategory =
        selectedFilter === 'ALL'
          ? true
          : selectedFilter === 'IRRIGATION'
          ? log.type === 'IRRIGATION'
          : selectedFilter === 'AUTH'
          ? log.type === 'AUTH' || log.type === 'LOGIN' || log.type === 'LOGOUT' || log.type === 'REGISTER' || log.type === 'NOTIFICATION_DISPATCH'
          : log.type === selectedFilter;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        log.title.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.district.toLowerCase().includes(q)
      );
    });
  }, [activityLogs, selectedFilter, searchQuery]);

  // Executive KPI Computations
  const totalFarmers = 136 + registeredFarmers.length;
  const totalMonitoredAcres = (
    614.5 +
    registeredFarmers.reduce((sum, f) => sum + (f.farmSizeAcres || 4.0), 0)
  ).toFixed(1);

  const totalScans =
    89 + activityLogs.filter((l) => l.type === 'CROP_SCAN').length;
  const criticalScansCount =
    14 +
    activityLogs.filter(
      (l) => l.type === 'CROP_SCAN' && l.status === 'Action Required'
    ).length;

  const totalOrders =
    38 + activityLogs.filter((l) => l.type === 'AGRI_ORDER').length;
  const totalGMV = (46850 + totalOrders * 680).toLocaleString('en-IN');

  const waterSavedLiters = '4,82,400';

  // Handle Publish Advisory
  const handlePublishBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setIsPublishingBroadcast(true);
    await publishBroadcast(
      broadcastTitle,
      broadcastMessage,
      broadcastSeverity,
      broadcastDistrict
    );
    setIsPublishingBroadcast(false);
    setBroadcastSuccessNotice('Advisory published to all farmer homepages!');
    setTimeout(() => setBroadcastSuccessNotice(null), 3000);
  };

  const handleExportAudit = () => {
    Alert.alert(
      'Platform Audit Log Export',
      `Ready to compile ${activityLogs.length} verified events into official Maharashtra Agriculture Department LaTeX / PDF report.`
    );
  };

  // Helper for Log Type Vector Icon
  const renderLogIcon = (type: ActivityType) => {
    switch (type) {
      case 'CROP_SCAN':
        return <Feather name="camera" size={16} color="#DC2626" />;
      case 'AGRI_ORDER':
        return <Feather name="shopping-bag" size={16} color="#15803D" />;
      case 'IRRIGATION':
        return <Feather name="droplet" size={16} color="#0284C7" />;
      case 'AUTH':
      case 'LOGIN':
        return <Feather name="user-check" size={16} color="#4F46E5" />;
      case 'REGISTER':
        return <Feather name="user-plus" size={16} color="#059669" />;
      case 'LOGOUT':
        return <Feather name="log-out" size={16} color="#DC2626" />;
      case 'SCHEME_CHECK':
        return <Feather name="check-circle" size={16} color="#059669" />;
      case 'NOTIFICATION_DISPATCH':
        return <Feather name="send" size={16} color="#15803D" />;
      case 'ADMIN_ALERT':
        return <Feather name="radio" size={16} color="#D97706" />;
      default:
        return <Feather name="activity" size={16} color={BRAND_EMERALD} />;
    }
  };

  return (
    <UnifiedPageShell
      activeRoute="/admin"
      title="Admin Command Center"
      subtitle="District Agricultural Surveillance & Real-Time Monitoring"
      statusPillText="Admin Online"
      onBack={() => safeGoBack(HOME_ROUTE)}
      scrollable={true}
    >
      <View style={styles.container}>
        {/* ═════════════════════════════════════════════════════════════ */}
        {/* 1. Deep Forest Green Admin Hero Banner (#0F291E)             */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <View style={styles.heroBanner}>
          <View style={styles.heroInner}>
            <View style={styles.heroLeftCol}>
              <View style={styles.eyebrowRow}>
                <View style={styles.livePulseDot} />
                <Text style={styles.heroEyebrow}>
                  ADMINISTRATION & REGIONAL SURVEILLANCE • LIVE TELEMETRY
                </Text>
              </View>

              <Text style={styles.heroTitle}>
                Platform Activity & Crop Health Command Center
              </Text>

              <Text style={styles.heroSubtitle}>
                Officer:{' '}
                <Text style={styles.heroHighlight}>
                  {user?.fullName || 'Dr. Sunita Deshmukh'}
                </Text>{' '}
                • {user?.department || 'District Agriculture & Pathology Command'}{' '}
                • <Text style={styles.heroOnlineBadge}>All 5 AI Agents Active</Text>
              </Text>
            </View>

            {/* Hero Quick Action Buttons */}
            <View style={styles.heroActionsRow}>
              <TouchableOpacity
                style={styles.simulateBtn}
                onPress={simulateLiveActivity}
                activeOpacity={0.8}
              >
                <Feather name="zap" size={15} color="#FFFFFF" />
                <Text style={styles.simulateBtnText}>Simulate Live Event</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportBtn}
                onPress={handleExportAudit}
                activeOpacity={0.8}
              >
                <Feather name="download" size={15} color="#FFFFFF" />
                <Text style={styles.exportBtnText}>Export Audit Log</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminLogoutBtn}
                onPress={async () => {
                  await logout();
                  router.replace(AUTH_ROUTE);
                }}
                activeOpacity={0.8}
              >
                <Feather name="log-out" size={15} color="#FCA5A5" />
                <Text style={styles.adminLogoutBtnText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* 2. 4-Column Executive KPI Metric Cards                        */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <View style={[styles.kpiGrid, isTablet && styles.kpiGridTablet]}>
          {/* Card 1: Farmers & Acreage */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.kpiEyebrow}>REGISTERED FARMERS</Text>
              <View style={styles.kpiIconBox}>
                <Feather name="users" size={16} color={BRAND_EMERALD} />
              </View>
            </View>
            <Text style={[styles.kpiValue, styles.tabularNums]}>
              {totalFarmers}
            </Text>
            <View style={styles.kpiFooterRow}>
              <Feather name="check" size={12} color="#15803D" />
              <Text style={[styles.kpiSubtext, styles.tabularNums]}>
                {totalMonitoredAcres} Total Monitored Acres
              </Text>
            </View>
          </View>

          {/* Card 2: Crop Doctor Scans */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.kpiEyebrow}>CROP DOCTOR SCANS</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: '#FEE2E2' }]}>
                <Feather name="camera" size={16} color="#DC2626" />
              </View>
            </View>
            <Text style={[styles.kpiValue, styles.tabularNums]}>
              {totalScans}
            </Text>
            <View style={styles.kpiFooterRow}>
              <Feather name="alert-triangle" size={12} color="#DC2626" />
              <Text style={[styles.kpiSubtext, styles.tabularNums]}>
                {criticalScansCount} Critical Disease Alerts
              </Text>
            </View>
          </View>

          {/* Card 3: Agri-Shop Orders */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.kpiEyebrow}>AGRI-SHOP ORDERS</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Feather name="shopping-bag" size={16} color="#D97706" />
              </View>
            </View>
            <Text style={[styles.kpiValue, styles.tabularNums]}>
              {totalOrders}
            </Text>
            <View style={styles.kpiFooterRow}>
              <Text style={[styles.kpiSubtext, styles.tabularNums]}>
                ₹{totalGMV} Total Input GMV
              </Text>
            </View>
          </View>

          {/* Card 4: Water Saved */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.kpiEyebrow}>FAO-56 WATER SAVED</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: '#E0F2FE' }]}>
                <Feather name="droplet" size={16} color="#0284C7" />
              </View>
            </View>
            <Text style={[styles.kpiValue, styles.tabularNums]}>
              {waterSavedLiters} L
            </Text>
            <View style={styles.kpiFooterRow}>
              <Feather name="trending-up" size={12} color="#0284C7" />
              <Text style={[styles.kpiSubtext, styles.tabularNums]}>
                Across 24 Smart Drip Plots
              </Text>
            </View>
          </View>
        </View>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* 3. Filter Tabs & Search Bar                                   */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <View style={styles.controlsCard}>
          <View style={styles.filterScrollWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterPillsRow}
            >
              {FILTER_TABS.map((tab) => {
                const isSelected = selectedFilter === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    style={[
                      styles.filterPill,
                      isSelected && styles.filterPillSelected,
                    ]}
                    onPress={() => setSelectedFilter(tab.id)}
                  >
                    <Feather
                      name={tab.icon}
                      size={13}
                      color={isSelected ? BRAND_EMERALD : TEXT_MUTED}
                    />
                    <Text
                      style={[
                        styles.filterPillText,
                        isSelected && styles.filterPillTextSelected,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Search Bar */}
          <View style={styles.searchWrapper}>
            <Feather
              name="search"
              size={15}
              color={TEXT_MUTED}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by farmer name, crop, disease, product, or district..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <Pressable
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchBtn}
              >
                <Feather name="x" size={14} color={TEXT_MUTED} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* 4. 2-Column Admin Monitoring Workspace                       */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <View
          style={[styles.workspaceGrid, isDesktop && styles.workspaceGridDesktop]}
        >
          {/* ─────────────────────────────────────────────────────────── */}
          {/* LEFT COLUMN: Real-Time Platform Event Feed                  */}
          {/* ─────────────────────────────────────────────────────────── */}
          <View style={styles.mainFeedCol}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>
                  Live Platform Activity Stream
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Displaying {filteredLogs.length} real-time farm and market events
                </Text>
              </View>

              <TouchableOpacity
                style={styles.simulateSmallBtn}
                onPress={simulateLiveActivity}
                activeOpacity={0.8}
              >
                <Feather name="zap" size={13} color={BRAND_EMERALD} />
                <Text style={styles.simulateSmallBtnText}>
                  + Simulate Incoming Event
                </Text>
              </TouchableOpacity>
            </View>

            {filteredLogs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Feather name="inbox" size={32} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No matching activities</Text>
                <Text style={styles.emptyDesc}>
                  Try clearing your search query or selecting a different activity filter.
                </Text>
              </View>
            ) : (
              <View style={styles.feedCardList}>
                {filteredLogs.map((item) => {
                  const dateObj = new Date(item.timestamp);
                  const timeFormatted = dateObj.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <View key={item.id} style={styles.feedCard}>
                      <View style={styles.feedCardHeader}>
                        <View style={styles.feedIconAndTitle}>
                          <View style={styles.logIconBox}>
                            {renderLogIcon(item.type)}
                          </View>
                          <View style={styles.logTitleCol}>
                            <Text style={styles.logTitle}>{item.title}</Text>
                            <View style={styles.logMetaRow}>
                              <Text style={styles.logUser}>
                                {item.userName}
                              </Text>
                              <Text style={styles.metaDivider}>•</Text>
                              <View style={styles.districtBadge}>
                                <Feather
                                  name="map-pin"
                                  size={10}
                                  color="#047857"
                                />
                                <Text style={styles.districtBadgeText}>
                                  {item.district}
                                </Text>
                              </View>
                              <Text style={styles.metaDivider}>•</Text>
                              <Text
                                style={[
                                  styles.logTimestamp,
                                  styles.tabularNums,
                                ]}
                              >
                                {timeFormatted}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Status Badge */}
                        <View
                          style={[
                            styles.statusPill,
                            item.status === 'Action Required' &&
                              styles.statusPillAction,
                            item.status === 'Dispatched' &&
                              styles.statusPillDispatched,
                            item.status === 'Verified' &&
                              styles.statusPillVerified,
                            item.status === 'Completed' &&
                              styles.statusPillCompleted,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              item.status === 'Action Required' &&
                                styles.statusPillTextAction,
                              item.status === 'Dispatched' &&
                                styles.statusPillTextDispatched,
                              item.status === 'Verified' &&
                                styles.statusPillTextVerified,
                              item.status === 'Completed' &&
                                styles.statusPillTextCompleted,
                            ]}
                          >
                            {item.status}
                          </Text>
                        </View>
                      </View>

                      {/* Details row */}
                      <Text style={styles.logDetails}>{item.details}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* RIGHT COLUMN: Regional Pathology & Broadcast & Directory    */}
          {/* ─────────────────────────────────────────────────────────── */}
          <View style={styles.sideCol}>
            {/* 1. Regional Pathology Distribution Card */}
            <View style={styles.sideCard}>
              <View style={styles.sideCardHeader}>
                <View style={styles.sideCardTitleRow}>
                  <Feather name="shield" size={16} color="#DC2626" />
                  <Text style={styles.sideCardTitle}>
                    Regional Pathology Watch
                  </Text>
                </View>
                <Text style={styles.sideCardBadge}>Kolhapur & Pune Hubs</Text>
              </View>

              <Text style={styles.sideCardDesc}>
                Real-time active spore prevalence across Maharashtra monitored districts:
              </Text>

              <View style={styles.diseaseList}>
                {REGIONAL_DISEASES.map((dis) => (
                  <View key={dis.name} style={styles.diseaseRow}>
                    <View style={styles.diseaseTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.diseaseName}>{dis.name}</Text>
                        <Text style={styles.diseaseSub}>
                          {dis.districts} • {dis.scientific}
                        </Text>
                      </View>
                      <View style={styles.caseBadge}>
                        <Text
                          style={[styles.caseBadgeText, styles.tabularNums]}
                        >
                          {dis.cases} Scans
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${dis.pct}%`,
                            backgroundColor:
                              dis.severity === 'Critical'
                                ? '#DC2626'
                                : dis.severity === 'High'
                                ? '#EA580C'
                                : '#15803D',
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* 2. Broadcast Regional Farmer Advisory Card */}
            <View style={styles.sideCard}>
              <View style={styles.sideCardHeader}>
                <View style={styles.sideCardTitleRow}>
                  <Feather name="radio" size={16} color={BRAND_EMERALD} />
                  <Text style={styles.sideCardTitle}>
                    Broadcast Regional Advisory
                  </Text>
                </View>
              </View>

              <Text style={styles.sideCardDesc}>
                Post an official advisory banner displayed directly on farmer dashboards:
              </Text>

              {activeBroadcast && (
                <View style={styles.currentBroadcastBox}>
                  <View style={styles.currentBroadcastHeader}>
                    <Feather name="alert-triangle" size={14} color="#D97706" />
                    <Text style={styles.currentBroadcastTitle}>
                      ACTIVE ADVISORY: {activeBroadcast.title}
                    </Text>
                  </View>
                  <Text style={styles.currentBroadcastMsg}>
                    {activeBroadcast.message}
                  </Text>
                  <View style={styles.currentBroadcastFooter}>
                    <Text style={styles.currentBroadcastDist}>
                      Target: {activeBroadcast.district}
                    </Text>
                    <Pressable
                      style={styles.dismissBroadcastBtn}
                      onPress={clearBroadcast}
                    >
                      <Feather name="x" size={12} color="#DC2626" />
                      <Text style={styles.dismissBroadcastText}>
                        Withdraw Alert
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {broadcastSuccessNotice && (
                <View style={styles.noticeBox}>
                  <Feather name="check-circle" size={14} color="#15803D" />
                  <Text style={styles.noticeText}>{broadcastSuccessNotice}</Text>
                </View>
              )}

              {/* Form inputs */}
              <View style={styles.broadcastFormCol}>
                <View style={styles.miniInputGroup}>
                  <Text style={styles.miniInputLabel}>Advisory Headline</Text>
                  <TextInput
                    style={styles.miniTextInput}
                    value={broadcastTitle}
                    onChangeText={setBroadcastTitle}
                    placeholder="e.g. High Humidity Alert"
                  />
                </View>

                <View style={styles.miniInputGroup}>
                  <Text style={styles.miniInputLabel}>Advisory Message</Text>
                  <TextInput
                    style={[styles.miniTextInput, styles.multilineInput]}
                    value={broadcastMessage}
                    onChangeText={setBroadcastMessage}
                    placeholder="Provide recommendations for fungicides or irrigation..."
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Severity Pills */}
                <View style={styles.miniInputGroup}>
                  <Text style={styles.miniInputLabel}>Severity Level</Text>
                  <View style={styles.severityRow}>
                    {(['info', 'warning', 'critical'] as const).map((sev) => {
                      const isSelected = broadcastSeverity === sev;
                      return (
                        <Pressable
                          key={sev}
                          style={[
                            styles.severityPill,
                            isSelected && styles.severityPillSelected,
                            isSelected &&
                              sev === 'critical' &&
                              styles.severityPillCritical,
                          ]}
                          onPress={() => setBroadcastSeverity(sev)}
                        >
                          <Text
                            style={[
                              styles.severityPillText,
                              isSelected && styles.severityPillTextSelected,
                            ]}
                          >
                            {sev.toUpperCase()}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.publishBtn}
                  onPress={handlePublishBroadcast}
                  disabled={isPublishingBroadcast}
                  activeOpacity={0.8}
                >
                  <Feather name="send" size={14} color="#FFFFFF" />
                  <Text style={styles.publishBtnText}>
                    {isPublishingBroadcast
                      ? 'Publishing...'
                      : 'Publish Alert to All Farmers'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. Registered Farmers Directory & Order Tracker */}
            <View style={styles.sideCard}>
              <View style={styles.sideCardHeader}>
                <View style={styles.sideCardTitleRow}>
                  <Feather name="users" size={16} color={BRAND_EMERALD} />
                  <Text style={styles.sideCardTitle}>
                    Registered Farmers ({registeredFarmers.length})
                  </Text>
                </View>
              </View>

              <Text style={styles.sideCardDesc}>
                Farmer profile registry and Agri-Shop dispatch tracker:
              </Text>

              <View style={styles.farmersList}>
                {registeredFarmers.map((f) => (
                  <View key={f.id} style={styles.farmerCard}>
                    <View style={styles.farmerCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.farmerName}>{f.fullName}</Text>
                        <Text style={styles.farmerSub}>
                          {f.kisanId || 'Verified Kisan'} • {f.district} •{' '}
                          {f.farmSizeAcres ?? 4.0} Acres ({f.primaryCrop || 'Sugarcane'})
                        </Text>
                      </View>
                    </View>

                    {/* Order Status Control */}
                    <View style={styles.orderStatusRow}>
                      <Text style={styles.orderStatusLabel}>Agri-Shop Order:</Text>
                      <View style={styles.orderStatusPillsGroup}>
                        {(['Processing', 'Dispatched', 'Delivered'] as const).map(
                          (status) => {
                            const isCurrent = f.latestOrderStatus === status;
                            return (
                              <Pressable
                                key={status}
                                style={[
                                  styles.orderStatusPill,
                                  isCurrent && styles.orderStatusPillActive,
                                ]}
                                onPress={() =>
                                  updateFarmerOrderStatus(f.id, status)
                                }
                              >
                                <Text
                                  style={[
                                    styles.orderStatusPillText,
                                    isCurrent &&
                                      styles.orderStatusPillTextActive,
                                  ]}
                                >
                                  {status}
                                </Text>
                              </Pressable>
                            );
                          }
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>
    </UnifiedPageShell>
  );
}

/* ─── Styles ────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
  },

  /* Hero Banner */
  heroBanner: {
    backgroundColor: BRAND_DARK,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1F3D30',
    marginBottom: 20,
  },
  heroInner: {
    flexDirection: 'column',
    gap: 16,
  },
  heroLeftCol: {
    flex: 1,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  heroHighlight: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroOnlineBadge: {
    color: '#34D399',
    fontWeight: '700',
  },
  heroActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND_EMERALD,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  simulateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  adminLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  adminLogoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FCA5A5',
  },

  /* KPI Grid */
  kpiGrid: {
    flexDirection: 'column',
    gap: 14,
    marginBottom: 20,
  },
  kpiGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    padding: 18,
    justifyContent: 'space-between',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MUTED,
    letterSpacing: 0.5,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: SAGE_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: 6,
  },
  kpiFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kpiSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  tabularNums: {
    fontVariant: ['tabular-nums'],
  },

  /* Filter & Search Bar */
  controlsCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  filterScrollWrapper: {
    flexDirection: 'row',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: PILL_BG,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillSelected: {
    backgroundColor: SAGE_TINT,
    borderColor: BRAND_EMERALD,
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  filterPillTextSelected: {
    color: BRAND_EMERALD,
    fontWeight: '700',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: TEXT_PRIMARY,
  },
  clearSearchBtn: {
    padding: 4,
  },

  /* Workspace Grid */
  workspaceGrid: {
    flexDirection: 'column',
    gap: 20,
  },
  workspaceGridDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  /* Main Feed Column */
  mainFeedCol: {
    flex: 1.4,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  simulateSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: SAGE_TINT,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  simulateSmallBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: BRAND_EMERALD,
  },

  feedCardList: {
    gap: 10,
  },
  feedCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    padding: 16,
    gap: 8,
  },
  feedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  feedIconAndTitle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  logIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  logTitleCol: {
    flex: 1,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  logMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  logUser: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  metaDivider: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  districtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EDF5EE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  districtBadgeText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '600',
  },
  logTimestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  logDetails: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 18,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 8,
  },

  /* Status Pills */
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  statusPillAction: {
    backgroundColor: '#FEE2E2',
  },
  statusPillDispatched: {
    backgroundColor: '#FEF3C7',
  },
  statusPillVerified: {
    backgroundColor: '#E0F2FE',
  },
  statusPillCompleted: {
    backgroundColor: '#EDF5EE',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  statusPillTextAction: {
    color: '#991B1B',
  },
  statusPillTextDispatched: {
    color: '#92400E',
  },
  statusPillTextVerified: {
    color: '#0369A1',
  },
  statusPillTextCompleted: {
    color: '#15803D',
  },

  emptyCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  emptyDesc: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    maxWidth: 320,
  },

  /* Side Column */
  sideCol: {
    flex: 1,
    gap: 18,
  },
  sideCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    padding: 18,
    gap: 12,
  },
  sideCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sideCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sideCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  sideCardBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sideCardDesc: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    lineHeight: 18,
  },

  /* Disease list */
  diseaseList: {
    gap: 12,
  },
  diseaseRow: {
    gap: 6,
  },
  diseaseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diseaseName: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  diseaseSub: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 1,
  },
  caseBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  caseBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#374151',
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  /* Broadcast Advisory */
  currentBroadcastBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  currentBroadcastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentBroadcastTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#92400E',
  },
  currentBroadcastMsg: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 16,
  },
  currentBroadcastFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  currentBroadcastDist: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  dismissBroadcastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 2,
  },
  dismissBroadcastText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: SAGE_TINT,
    padding: 8,
    borderRadius: 8,
  },
  noticeText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
  },
  broadcastFormCol: {
    gap: 10,
  },
  miniInputGroup: {
    gap: 4,
  },
  miniInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  miniTextInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: TEXT_PRIMARY,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  severityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  severityPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  severityPillSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  severityPillCritical: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  severityPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  severityPillTextSelected: {
    color: '#92400E',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND_EMERALD,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 4,
  },
  publishBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Farmers Registry list */
  farmersList: {
    gap: 10,
  },
  farmerCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    gap: 8,
  },
  farmerCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  farmerName: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  farmerSub: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  orderStatusRow: {
    flexDirection: 'column',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  orderStatusLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  orderStatusPillsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  orderStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  orderStatusPillActive: {
    backgroundColor: '#EDF5EE',
    borderColor: '#15803D',
  },
  orderStatusPillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  orderStatusPillTextActive: {
    color: '#15803D',
    fontWeight: '700',
  },
});
