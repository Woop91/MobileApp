// ============================================================================
// LoginScreen - Animated auth with Google, PIN, Magic Link, Biometrics
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Animated from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors, useTheme, useFadeIn, useSlideUp, useScaleIn, usePulse } from '../../theme';
import { Button } from '../../components';
import { useAuth } from '../../auth/AuthContext';
import { buildGoogleAuthUrl, getEmailFromGoogleToken, isGoogleAuthConfigured } from '../../auth/googleAuth';

type AuthTab = 'google' | 'biometric' | 'pin' | 'email';

export function LoginScreen() {
  const { theme } = useTheme();
  const { requestMagicLink, loginWithGoogle, loginWithPin, loginWithBiometrics, biometricCapability, biometricEnabled } = useAuth();
  const { colors } = theme;

  const showBiometricTab = biometricCapability?.available && biometricCapability.enrolled && biometricEnabled;
  const [activeTab, setActiveTab] = useState<AuthTab>(showBiometricTab ? 'biometric' : 'google');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Entrance animations
  const logoAnim = useScaleIn(0);
  const titleAnim = useFadeIn(200, 500);
  const formAnim = useSlideUp(400, 40);

  // Auto-trigger biometric prompt on mount if enrolled
  useEffect(() => {
    if (showBiometricTab) {
      handleBiometricLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs once on mount
  }, [showBiometricTab]);

  // ── Biometric Login ───────────────────────────────────────────────────────
  async function handleBiometricLogin() {
    setLoading(true);
    try {
      const result = await loginWithBiometrics();
      if (!result.success && result.error && result.error !== 'Cancelled') {
        Alert.alert('Biometric Login Failed', result.error);
      }
    } catch {
      Alert.alert('Error', 'Biometric login failed. Please try another method.');
    } finally {
      setLoading(false);
    }
  }

  // ── Google Sign-In ──────────────────────────────────────────────────────
  async function handleGoogleSignIn() {
    if (!isGoogleAuthConfigured()) {
      Alert.alert('Not Configured', 'Google Sign-In has not been configured yet. Please use PIN or Email login.');
      return;
    }
    setLoading(true);
    try {
      const { url } = buildGoogleAuthUrl();
      const result = await WebBrowser.openAuthSessionAsync(url, 'groupup://auth/callback');

      if (result.type === 'success' && result.url) {
        const fragment = result.url.split('#')[1] || '';
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');

        if (accessToken) {
          const userInfo = await getEmailFromGoogleToken(accessToken);
          if (userInfo?.email) {
            const success = await loginWithGoogle(userInfo.email, userInfo.name);
            if (!success) {
              Alert.alert('Access Denied', 'Your email is not in the Member Directory. Contact your steward for access.');
            }
            return;
          }
        }
        Alert.alert('Sign-In Failed', 'Could not retrieve your account information. Please try again.');
      }
    } catch (err) {
      Alert.alert('Sign-In Error', 'Google Sign-In failed. Please try another method.');
    } finally {
      setLoading(false);
    }
  }

  // ── PIN Login ───────────────────────────────────────────────────────────
  async function handlePinLogin() {
    if (pin.length < 4) {
      Alert.alert('Invalid PIN', 'Please enter your 4-6 digit PIN.');
      return;
    }
    setLoading(true);
    try {
      const success = await loginWithPin(pin);
      if (!success) {
        Alert.alert('Invalid PIN', 'The PIN you entered is not valid. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'PIN login failed. Please try another method.');
    } finally {
      setLoading(false);
    }
  }

  // ── Magic Link ──────────────────────────────────────────────────────────
  async function handleSendLink() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const result = await requestMagicLink(trimmed, true);
      setEmailSent(true);
      Alert.alert('Check Your Email', result.message);
    } catch {
      Alert.alert('Error', 'Failed to send sign-in link. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Animated Logo / Branding */}
        <Animated.View style={[styles.logoContainer, { backgroundColor: colors.headerGradientStart }, logoAnim]}>
          <View style={styles.logoCircle}>
            <Ionicons name="shield-checkmark" size={56} color={colors.textOnPrimary} />
          </View>
          <Animated.View style={titleAnim}>
            <Text style={[styles.appTitle, { color: colors.textOnPrimary }]}>GroupUp!</Text>
            <Text style={[styles.appSubtitle, { color: colors.textOnPrimary + 'bb' }]}>
              Your Union Dashboard
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Animated Login Form */}
        <Animated.View style={[styles.formContainer, formAnim]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Sign In</Text>

          {/* Auth Method Tabs */}
          <View style={[styles.tabRow, { backgroundColor: colors.inputBackground, borderRadius: 14 }]}>
            {[
              ...(showBiometricTab ? [{
                key: 'biometric' as AuthTab,
                icon: biometricCapability?.type === 'face_id' ? 'scan' : 'finger-print',
                label: biometricCapability?.label || 'Bio',
              }] : []),
              { key: 'google' as AuthTab, icon: 'logo-google', label: 'Google' },
              { key: 'pin' as AuthTab, icon: 'keypad', label: 'PIN' },
              { key: 'email' as AuthTab, icon: 'mail', label: 'Email' },
            ].map(tab => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => { setActiveTab(tab.key); setEmailSent(false); }}
                style={[
                  styles.tab,
                  activeTab === tab.key && [styles.activeTab, { backgroundColor: colors.surface, shadowColor: colors.primary }],
                ]}
              >
                <Ionicons
                  name={tab.icon as keyof typeof Ionicons.glyphMap}
                  size={17}
                  color={activeTab === tab.key ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.tabText, { color: activeTab === tab.key ? colors.primary : colors.textSecondary }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Biometric Tab ── */}
          {activeTab === 'biometric' && (
            <View style={styles.authSection}>
              <BiometricPrompt
                type={biometricCapability?.type}
                label={biometricCapability?.label}
                onPress={handleBiometricLogin}
                loading={loading}
                colors={colors}
              />
            </View>
          )}

          {/* ── Google Sign-In Tab ── */}
          {activeTab === 'google' && (
            <View style={styles.authSection}>
              <Text style={[styles.authDesc, { color: colors.textSecondary }]}>
                Sign in with your Google account for full access to all dashboard features.
              </Text>
              <Button
                title="Sign in with Google"
                onPress={handleGoogleSignIn}
                loading={loading}
                fullWidth
                size="lg"
                icon={<Ionicons name="logo-google" size={20} color={colors.textOnPrimary} />}
              />
              <View style={styles.featureList}>
                <FeatureItem icon="checkmark-circle" text="Full steward & member access" colors={colors} />
                <FeatureItem icon="checkmark-circle" text="Messages and notifications" colors={colors} />
                <FeatureItem icon="checkmark-circle" text="Grievance details and documents" colors={colors} />
                <FeatureItem icon="checkmark-circle" text="Contact information" colors={colors} />
              </View>
            </View>
          )}

          {/* ── PIN Login Tab ── */}
          {activeTab === 'pin' && (
            <View style={styles.authSection}>
              <Text style={[styles.authDesc, { color: colors.textSecondary }]}>
                Quick access with your member PIN. Limited view — no messages, contact info, or case details.
              </Text>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Your PIN</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <Ionicons name="keypad-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text, letterSpacing: 8, textAlign: 'center' }]}
                    placeholder="----"
                    placeholderTextColor={colors.textSecondary}
                    value={pin}
                    onChangeText={setPin}
                    keyboardType="number-pad"
                    maxLength={6}
                    secureTextEntry
                    returnKeyType="go"
                    onSubmitEditing={handlePinLogin}
                  />
                </View>
              </View>
              <Button title="Sign In with PIN" onPress={handlePinLogin} loading={loading} fullWidth size="lg" variant="secondary" />
              <View style={[styles.limitedBanner, { backgroundColor: colors.warning + '12', borderColor: colors.warning + '25' }]}>
                <Ionicons name="information-circle" size={18} color={colors.warning} />
                <Text style={[styles.limitedText, { color: colors.warning }]}>
                  PIN access is limited — no messages, contact info, or grievance details visible
                </Text>
              </View>
            </View>
          )}

          {/* ── Email Magic Link Tab ── */}
          {activeTab === 'email' && (
            <View style={styles.authSection}>
              {emailSent ? (
                <EmailSentView email={email} colors={colors} onResend={() => setEmailSent(false)} />
              ) : (
                <>
                  <Text style={[styles.authDesc, { color: colors.textSecondary }]}>
                    Enter your work email to receive a sign-in link. Full access to all features.
                  </Text>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
                    <View style={[styles.inputWrap, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                      <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="you@example.com"
                        placeholderTextColor={colors.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        returnKeyType="go"
                        onSubmitEditing={handleSendLink}
                      />
                    </View>
                  </View>
                  <Button title="Send Sign-In Link" onPress={handleSendLink} loading={loading} fullWidth size="lg" />
                </>
              )}
            </View>
          )}

          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            You must be in the Member Directory to sign in.{'\n'}
            Contact your steward if you need access.
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function BiometricPrompt({ type, label, onPress, loading, colors }: {
  type?: string; label?: string; onPress: () => void; loading: boolean; colors: ThemeColors;
}) {
  const pulseStyle = usePulse(!loading, 0.97, 1.03);

  return (
    <View style={styles.biometricContainer}>
      <Animated.View style={pulseStyle}>
        <TouchableOpacity
          onPress={onPress}
          disabled={loading}
          style={[styles.biometricButton, { borderColor: colors.primary + '30', backgroundColor: colors.primary + '08' }]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={(type === 'face_id' ? 'scan-outline' : 'finger-print-outline') as keyof typeof Ionicons.glyphMap}
            size={72}
            color={colors.primary}
          />
        </TouchableOpacity>
      </Animated.View>
      <Text style={[styles.biometricTitle, { color: colors.text }]}>
        {label || 'Biometric Login'}
      </Text>
      <Text style={[styles.biometricDesc, { color: colors.textSecondary }]}>
        Tap the icon or use {label || 'biometrics'} to sign in instantly
      </Text>
      <Button
        title={`Sign in with ${label || 'Biometrics'}`}
        onPress={onPress}
        loading={loading}
        fullWidth
        size="lg"
        icon={<Ionicons
          name={(type === 'face_id' ? 'scan' : 'finger-print') as keyof typeof Ionicons.glyphMap}
          size={20}
          color={colors.textOnPrimary}
        />}
      />
    </View>
  );
}

function EmailSentView({ email, colors, onResend }: { email: string; colors: ThemeColors; onResend: () => void }) {
  const scaleAnim = useScaleIn(0);

  return (
    <Animated.View style={[styles.sentContainer, scaleAnim]}>
      <View style={[styles.sentIconCircle, { backgroundColor: colors.success + '15' }]}>
        <Ionicons name="mail-open-outline" size={48} color={colors.success} />
      </View>
      <Text style={[styles.sentTitle, { color: colors.text }]}>Check Your Email</Text>
      <Text style={[styles.sentMessage, { color: colors.textSecondary }]}>
        We sent a sign-in link to {email}. Tap the link to log in.
      </Text>
      <Button title="Send Another Link" onPress={onResend} variant="outline" />
    </Animated.View>
  );
}

function FeatureItem({ icon, text, colors }: { icon: string; text: string; colors: ThemeColors }) {
  return (
    <View style={featureStyles.row}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={16} color={colors.success} />
      <Text style={[featureStyles.text, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

const featureStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontSize: 14 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1 },
  logoContainer: {
    paddingTop: 70, paddingBottom: 36, alignItems: 'center', gap: 12,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  logoCircle: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  appTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  appSubtitle: { fontSize: 15, fontWeight: '500', textAlign: 'center' },
  formContainer: { flex: 1, padding: 24, gap: 18 },
  formTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  tabRow: { flexDirection: 'row', padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 10 },
  activeTab: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600' },
  authSection: { gap: 16, paddingTop: 8 },
  authDesc: { fontSize: 14, lineHeight: 21 },
  featureList: { gap: 8, marginTop: 4 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  input: { flex: 1, fontSize: 16, padding: 0 },
  limitedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  limitedText: { flex: 1, fontSize: 13, lineHeight: 18 },
  helpText: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  biometricContainer: { alignItems: 'center', gap: 20, paddingTop: 20 },
  biometricButton: { width: 130, height: 130, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  biometricTitle: { fontSize: 20, fontWeight: '700' },
  biometricDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  sentContainer: { alignItems: 'center', gap: 16, paddingTop: 16 },
  sentIconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  sentTitle: { fontSize: 22, fontWeight: '700' },
  sentMessage: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
