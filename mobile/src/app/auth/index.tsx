import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';

import { useAuth } from '@/context/AuthContext';
import { ADMIN_ROUTE, HOME_ROUTE } from '@/utils/navigation';

/* ─── Color Palette ─────────────────────────────────────────────────── */
const BRAND_DARK = '#0F291E';
const BRAND_EMERALD = '#15803D';
const BG_PAGE = '#F7F9F7';
const CARD_BG = '#FFFFFF';
const BORDER_COLOR = '#E6ECE6';
const TEXT_PRIMARY = '#111827';
const TEXT_MUTED = '#6B7280';
const SAGE_TINT = '#EDF5EE';

type AuthViewMode = 'farmer-login' | 'farmer-register' | 'admin-login';

const DISTRICT_OPTIONS = [
  'Kolhapur, MH',
  'Pune, MH',
  'Sangli, MH',
  'Nashik, MH',
  'Satara, MH',
  'Nagpur, MH',
];

const CROP_OPTIONS = [
  'Sugarcane',
  'Tomato',
  'Onion',
  'Soybean',
  'Paddy',
  'Wheat',
  'Spinach',
];

export default function StandaloneAuthScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 640;
  const { login, register } = useAuth();

  // Screen view state
  const [authView, setAuthView] = useState<AuthViewMode>('farmer-login');

  // Farmer Login state
  const [farmerIdentifier, setFarmerIdentifier] = useState('');
  const [farmerPassword, setFarmerPassword] = useState('');
  const [showFarmerPassword, setShowFarmerPassword] = useState(false);

  // Farmer Register state
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDistrict, setRegDistrict] = useState('Kolhapur, MH');
  const [regAcres, setRegAcres] = useState('5.0');
  const [regCrop, setRegCrop] = useState('Sugarcane');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Admin Login state
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Feedback & Loading State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Switch View Mode Helper
  const switchView = (mode: AuthViewMode) => {
    setAuthView(mode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  /* ─── Handlers ─────────────────────────────────────────────────────── */
  const handleFarmerLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const idClean = farmerIdentifier.trim();
    const passClean = farmerPassword.trim();

    if (!idClean || !passClean) {
      setErrorMessage(
        'Please enter both your registered Mobile/Email and Password.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(idClean, passClean, 'farmer');
      if (!res.success) {
        setErrorMessage(
          res.error ||
            'Invalid mobile/email or password. If you are a new user, please register below.'
        );
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Credentials verified! Unlocking farm dashboard...');
      setTimeout(() => {
        router.replace(HOME_ROUTE);
      }, 350);
    } catch {
      setErrorMessage('Unexpected network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleFarmerRegister = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const nameClean = regFullName.trim();
    const phoneClean = regPhone.replace(/\D/g, '').slice(-10);
    const emailClean = regEmail.trim().toLowerCase();
    const passClean = regPassword.trim();
    const confirmClean = regConfirmPassword.trim();

    if (nameClean.length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!/^\d{10}$/.test(phoneClean)) {
      setErrorMessage(
        'Please enter a valid 10-digit Indian mobile number (e.g. 9822014481).'
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      setErrorMessage(
        'Please enter a valid email address (e.g. ramesh.patil@gmail.com).'
      );
      return;
    }

    if (passClean.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (passClean !== confirmClean) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        fullName: nameClean,
        phone: phoneClean,
        email: emailClean,
        password: passClean,
        confirmPassword: confirmClean,
        role: 'farmer',
        district: regDistrict,
        farmSizeAcres: parseFloat(regAcres) || 4.0,
        primaryCrop: regCrop,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(
        'Registration successful! Welcome SMS & Email notifications dispatched. Unlocking your farm portal...'
      );
      setTimeout(() => {
        router.replace(HOME_ROUTE);
      }, 400);
    } catch {
      setErrorMessage('Unexpected error during registration. Please retry.');
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const idClean = adminIdentifier.trim();
    const passClean = adminPassword.trim();
    const keyClean = adminKey.trim();

    if (!idClean || !passClean) {
      setErrorMessage('Please enter both Admin Official Email/ID and Password.');
      return;
    }

    if (!keyClean) {
      setErrorMessage(
        'Admin Security Key is required. Expected: FF-ADMIN-2026'
      );
      return;
    }

    if (keyClean !== 'FF-ADMIN-2026') {
      setErrorMessage(
        'Invalid Admin Security Key. Required key: FF-ADMIN-2026'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(idClean, passClean, 'admin', keyClean);
      if (!res.success) {
        setErrorMessage(
          res.error || 'Invalid administrator credentials. Access denied.'
        );
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(
        'Administrator authenticated! Launching Command Center...'
      );
      setTimeout(() => {
        router.replace(ADMIN_ROUTE);
      }, 350);
    } catch {
      setErrorMessage('Unexpected error during admin authentication.');
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isCompact && styles.scrollContentCompact,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.container,
            authView === 'farmer-register'
              ? styles.containerWide
              : styles.containerStandard,
          ]}
        >
          {/* ═══════════════════════════════════════════════════════════ */}
          {/* BRAND HEADER ABOVE CARD (No Top App Navigation Bar)         */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <View style={styles.brandHeader}>
            <View style={styles.sproutBox}>
              <Feather
                name="feather"
                size={24}
                color={BRAND_EMERALD}
              />
            </View>
            <Text style={styles.brandTitle}>Future Farming</Text>
            <Text style={styles.brandSubtitle}>
              Precision Agriculture & Farm Telemetry Portal
            </Text>
          </View>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* INLINE ERROR & SUCCESS ALERTS                               */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {errorMessage && (
            <View style={styles.errorAlert}>
              <Feather name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorAlertText}>{errorMessage}</Text>
            </View>
          )}

          {successMessage && (
            <View style={styles.successAlert}>
              <Feather name="check-circle" size={16} color="#15803D" />
              <Text style={styles.successAlertText}>{successMessage}</Text>
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* VIEW A: STANDALONE FARMER SIGN IN (DEFAULT ON LAUNCH)       */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {authView === 'farmer-login' && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.roleIconCircle}>
                  <Feather name="user" size={18} color={BRAND_EMERALD} />
                </View>
                <Text style={styles.cardTitle}>Farmer Sign In</Text>
                <Text style={styles.cardSubtitle}>
                  Enter your registered mobile number or email and password to
                  access your farm dashboard.
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>
                  Mobile Number or Email Address
                </Text>
                <View style={styles.inputBox}>
                  <Feather
                    name="phone"
                    size={16}
                    color={TEXT_MUTED}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 9876543210 or farmer@futurefarming.in"
                    placeholderTextColor="#9CA3AF"
                    value={farmerIdentifier}
                    onChangeText={setFarmerIdentifier}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputBox}>
                  <Feather
                    name="lock"
                    size={16}
                    color={TEXT_MUTED}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={farmerPassword}
                    onChangeText={setFarmerPassword}
                    secureTextEntry={!showFarmerPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    style={styles.eyeToggleBtn}
                    onPress={() => setShowFarmerPassword(!showFarmerPassword)}
                    accessibilityRole="button"
                    accessibilityLabel="Toggle password visibility"
                  >
                    <Feather
                      name={showFarmerPassword ? 'eye-off' : 'eye'}
                      size={16}
                      color={TEXT_MUTED}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Primary Action Button */}
              <TouchableOpacity
                style={[
                  styles.primaryEmeraldBtn,
                  isSubmitting && styles.btnDisabled,
                ]}
                onPress={handleFarmerLogin}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryEmeraldBtnText}>
                      Sign In to Homepage
                    </Text>
                    <Feather name="arrow-right" size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              {/* Card Footer Bottom Switchers */}
              <View style={styles.footerSection}>
                <View style={styles.hairlineDivider} />

                {/* Primary Registration Prompt */}
                <View style={styles.footerRow}>
                  <Text style={styles.footerPromptText}>
                    New to Future Farming?
                  </Text>
                  <TouchableOpacity
                    onPress={() => switchView('farmer-register')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.footerActionEmeraldText}>
                      Create a Farmer Account (Register)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Secondary Admin Portal Link */}
                <View style={styles.footerRowSecondary}>
                  <Text style={styles.footerPromptSubtleText}>
                    Administrator Access?
                  </Text>
                  <TouchableOpacity
                    onPress={() => switchView('admin-login')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.footerActionAdminText}>
                      Switch to Admin Login →
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* VIEW B: STANDALONE NEW FARMER REGISTRATION PAGE              */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {authView === 'farmer-register' && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.roleIconCircle}>
                  <Feather name="user-plus" size={18} color={BRAND_EMERALD} />
                </View>
                <Text style={styles.cardTitle}>Register New Farmer Account</Text>
                <Text style={styles.cardSubtitle}>
                  Create your farm profile to unlock Crop Doctor, Irrigation
                  Schedules, Agri-Shop, and Govt. Subsidies.
                </Text>
              </View>

              {/* Full Name */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <View style={styles.inputBox}>
                  <Feather
                    name="user"
                    size={16}
                    color={TEXT_MUTED}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Ramesh Patil"
                    placeholderTextColor="#9CA3AF"
                    value={regFullName}
                    onChangeText={setRegFullName}
                  />
                </View>
              </View>

              {/* 10-Digit Mobile Number */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>
                  10-Digit Mobile Number (+91)
                </Text>
                <View style={styles.inputBox}>
                  <Feather
                    name="phone"
                    size={16}
                    color={TEXT_MUTED}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    style={[styles.textInput, styles.tabularNums]}
                    placeholder="e.g. 9822014481"
                    placeholderTextColor="#9CA3AF"
                    value={regPhone}
                    onChangeText={setRegPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>
                  Email Address
                </Text>
                <View style={styles.inputBox}>
                  <Feather
                    name="mail"
                    size={16}
                    color={TEXT_MUTED}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. ramesh.patil@gmail.com"
                    placeholderTextColor="#9CA3AF"
                    value={regEmail}
                    onChangeText={setRegEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Select District Pills */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Select District</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pillScrollRow}
                >
                  {DISTRICT_OPTIONS.map((district) => {
                    const isSelected = regDistrict === district;
                    return (
                      <Pressable
                        key={district}
                        style={[
                          styles.selectorPill,
                          isSelected && styles.selectorPillActive,
                        ]}
                        onPress={() => setRegDistrict(district)}
                      >
                        <Text
                          style={[
                            styles.selectorPillText,
                            isSelected && styles.selectorPillTextActive,
                          ]}
                        >
                          {district}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Farm Size & Primary Crop */}
              <View style={styles.twoColumnRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Farm Size (Acres)</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={[styles.textInput, styles.tabularNums]}
                      placeholder="5.0"
                      placeholderTextColor="#9CA3AF"
                      value={regAcres}
                      onChangeText={setRegAcres}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={[styles.formGroup, { flex: 1.5 }]}>
                  <Text style={styles.fieldLabel}>Primary Crop</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.pillScrollRow}
                  >
                    {CROP_OPTIONS.slice(0, 4).map((crop) => {
                      const isSelected = regCrop === crop;
                      return (
                        <Pressable
                          key={crop}
                          style={[
                            styles.selectorPill,
                            isSelected && styles.selectorPillActive,
                          ]}
                          onPress={() => setRegCrop(crop)}
                        >
                          <Text
                            style={[
                              styles.selectorPillText,
                              isSelected && styles.selectorPillTextActive,
                            ]}
                          >
                            {crop}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              {/* Password & Confirm Password */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>
                  Create Password (minimum 6 characters)
                </Text>
                <View style={styles.inputBox}>
                  <Feather
                    name="lock"
                    size={16}
                    color={TEXT_MUTED}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter password"
                    placeholderTextColor="#9CA3AF"
                    value={regPassword}
                    onChangeText={setRegPassword}
                    secureTextEntry={!showRegPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    style={styles.eyeToggleBtn}
                    onPress={() => setShowRegPassword(!showRegPassword)}
                  >
                    <Feather
                      name={showRegPassword ? 'eye-off' : 'eye'}
                      size={16}
                      color={TEXT_MUTED}
                    />
                  </Pressable>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View style={styles.inputBox}>
                  <Feather
                    name="lock"
                    size={16}
                    color={TEXT_MUTED}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Re-enter password"
                    placeholderTextColor="#9CA3AF"
                    value={regConfirmPassword}
                    onChangeText={setRegConfirmPassword}
                    secureTextEntry={!showRegConfirmPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    style={styles.eyeToggleBtn}
                    onPress={() =>
                      setShowRegConfirmPassword(!showRegConfirmPassword)
                    }
                  >
                    <Feather
                      name={showRegConfirmPassword ? 'eye-off' : 'eye'}
                      size={16}
                      color={TEXT_MUTED}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Primary Action Button */}
              <TouchableOpacity
                style={[
                  styles.primaryEmeraldBtn,
                  isSubmitting && styles.btnDisabled,
                ]}
                onPress={handleFarmerRegister}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryEmeraldBtnText}>
                      Complete Registration & Enter App
                    </Text>
                    <Feather name="arrow-right" size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              {/* Footer Switcher */}
              <View style={styles.footerSection}>
                <View style={styles.hairlineDivider} />
                <View style={styles.footerRow}>
                  <Text style={styles.footerPromptText}>
                    Already have a registered account?
                  </Text>
                  <TouchableOpacity
                    onPress={() => switchView('farmer-login')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.footerActionEmeraldText}>
                      ← Back to Farmer Sign In
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* VIEW C: SEPARATE STANDALONE ADMIN PORTAL LOGIN              */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {authView === 'admin-login' && (
            <View style={styles.adminCard}>
              {/* Deep Forest Header Band */}
              <View style={styles.adminHeaderBand}>
                <View style={styles.adminBadgeRow}>
                  <View style={styles.adminPulseDot} />
                  <Text style={styles.adminBadgeText}>
                    RESTRICTED ACCESS • OFFICIAL SURVEILLANCE PORTAL
                  </Text>
                </View>
                <Text style={styles.adminTitle}>
                  Administrator Command Login
                </Text>
                <Text style={styles.adminSubtitle}>
                  Authorized personnel only. Sign in to monitor live farmer
                  activities, disease outbreaks, and Agri-Shop orders.
                </Text>
              </View>

              {/* White Form Body */}
              <View style={styles.adminFormBody}>
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>
                    Admin Official Email or ID
                  </Text>
                  <View style={styles.inputBox}>
                    <Feather
                      name="shield"
                      size={16}
                      color={TEXT_MUTED}
                      style={styles.fieldIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. admin@futurefarming.in"
                      placeholderTextColor="#9CA3AF"
                      value={adminIdentifier}
                      onChangeText={setAdminIdentifier}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Admin Password</Text>
                  <View style={styles.inputBox}>
                    <Feather
                      name="lock"
                      size={16}
                      color={TEXT_MUTED}
                      style={styles.fieldIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter Admin password"
                      placeholderTextColor="#9CA3AF"
                      value={adminPassword}
                      onChangeText={setAdminPassword}
                      secureTextEntry={!showAdminPassword}
                      autoCapitalize="none"
                    />
                    <Pressable
                      style={styles.eyeToggleBtn}
                      onPress={() => setShowAdminPassword(!showAdminPassword)}
                    >
                      <Feather
                        name={showAdminPassword ? 'eye-off' : 'eye'}
                        size={16}
                        color={TEXT_MUTED}
                      />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.labelWithHintRow}>
                    <Text style={styles.fieldLabel}>Admin Security Key</Text>
                    <Text style={styles.requiredKeyHint}>
                      Required: FF-ADMIN-2026
                    </Text>
                  </View>
                  <View style={styles.inputBox}>
                    <Feather
                      name="key"
                      size={16}
                      color={TEXT_MUTED}
                      style={styles.fieldIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="FF-ADMIN-2026"
                      placeholderTextColor="#9CA3AF"
                      value={adminKey}
                      onChangeText={setAdminKey}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                {/* Primary Action Button */}
                <TouchableOpacity
                  style={[
                    styles.primaryDarkBtn,
                    isSubmitting && styles.btnDisabled,
                  ]}
                  onPress={handleAdminLogin}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="shield" size={16} color="#FFFFFF" />
                      <Text style={styles.primaryDarkBtnText}>
                        Verify & Launch Admin Monitor
                      </Text>
                      <Feather name="arrow-right" size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Return to Farmer Login Footer */}
                <View style={styles.footerSection}>
                  <View style={styles.hairlineDivider} />
                  <View style={styles.footerRow}>
                    <TouchableOpacity
                      onPress={() => switchView('farmer-login')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.footerActionEmeraldText}>
                        ← Return to Farmer Login
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Evaluator Reference Subtle Note (Non-interactive hint) */}
          <View style={styles.evaluatorNoteCard}>
            <Feather name="info" size={13} color="#6B7280" />
            <Text style={styles.evaluatorNoteText}>
              Evaluator Credentials Reference — Farmer:{' '}
              <Text style={styles.evaluatorNoteBold}>
                farmer@futurefarming.in
              </Text>{' '}
              / <Text style={styles.evaluatorNoteBold}>Farmer@123</Text> • Admin:{' '}
              <Text style={styles.evaluatorNoteBold}>
                admin@futurefarming.in
              </Text>{' '}
              / <Text style={styles.evaluatorNoteBold}>Admin@123</Text> (Key:{' '}
              <Text style={styles.evaluatorNoteBold}>FF-ADMIN-2026</Text>)
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_PAGE,
    minHeight: '100%',
  },
  scroll: {
    flex: 1,
    backgroundColor: BG_PAGE,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  scrollContentCompact: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  container: {
    width: '100%',
    alignItems: 'center',
  },
  containerStandard: {
    maxWidth: 520,
  },
  containerWide: {
    maxWidth: 620,
  },

  /* Brand Header Above Card */
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sproutBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: SAGE_TINT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C6E2CD',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: BRAND_DARK,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 13.5,
    color: TEXT_MUTED,
    fontWeight: '500',
    textAlign: 'center',
  },

  /* Inline Feedback Alerts */
  errorAlert: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorAlertText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
    lineHeight: 18,
  },
  successAlert: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EDF5EE',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successAlertText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#15803D',
    lineHeight: 18,
  },

  /* Standard White Auth Card */
  card: {
    width: '100%',
    backgroundColor: CARD_BG,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 32,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  roleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SAGE_TINT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 420,
  },

  /* Form Fields */
  formGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  labelWithHintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  requiredKeyHint: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND_EMERALD,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  fieldIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 13.5,
    color: TEXT_PRIMARY,
  },
  eyeToggleBtn: {
    padding: 6,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pillScrollRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  selectorPill: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  selectorPillActive: {
    backgroundColor: SAGE_TINT,
    borderColor: '#A7F3D0',
  },
  selectorPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  selectorPillTextActive: {
    color: BRAND_EMERALD,
    fontWeight: '700',
  },

  /* Action Buttons */
  primaryEmeraldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND_EMERALD,
    borderRadius: 12,
    height: 48,
    marginTop: 8,
  },
  primaryEmeraldBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  primaryDarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND_DARK,
    borderRadius: 12,
    height: 48,
    marginTop: 8,
  },
  primaryDarkBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.65,
  },

  /* Card Footer Section & Switchers */
  footerSection: {
    marginTop: 24,
  },
  hairlineDivider: {
    height: 1,
    backgroundColor: BORDER_COLOR,
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  footerRowSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  footerPromptText: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  footerPromptSubtleText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  footerActionEmeraldText: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_EMERALD,
  },
  footerActionAdminText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND_DARK,
  },

  /* Admin Dedicated Card Styles */
  adminCard: {
    width: '100%',
    backgroundColor: CARD_BG,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1F3D30',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 4,
  },
  adminHeaderBand: {
    backgroundColor: BRAND_DARK,
    padding: 28,
  },
  adminBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  adminPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  adminBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.6,
  },
  adminTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  adminSubtitle: {
    fontSize: 12.5,
    color: '#D1D5DB',
    lineHeight: 18,
  },
  adminFormBody: {
    padding: 28,
  },

  /* Evaluator Reference Note Card */
  evaluatorNoteCard: {
    marginTop: 20,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 620,
    width: '100%',
  },
  evaluatorNoteText: {
    flex: 1,
    fontSize: 11.5,
    color: '#6B7280',
    lineHeight: 16,
  },
  evaluatorNoteBold: {
    fontWeight: '700',
    color: '#111827',
  },
  tabularNums: {
    fontVariant: ['tabular-nums'],
  },
});
