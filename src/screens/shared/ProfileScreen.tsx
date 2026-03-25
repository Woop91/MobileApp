// ============================================================================
// ProfileScreen - Animated profile with vibrant theme picker
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, themePresets, useFadeIn, useSlideUp, useScaleIn } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { Card, Button, LoadingScreen } from '../../components';
import { api } from '../../api';
import type { UserProfile } from '../../types';

// Preview colors for theme swatches
const THEME_SWATCHES: Record<string, { bg: string; accent: string; label: string }> = {
  navy:   { bg: '#1e3a8a', accent: '#f97316', label: 'Navy' },
  slate:  { bg: '#334155', accent: '#f97316', label: 'Slate' },
  ocean:  { bg: '#0284c7', accent: '#14b8a6', label: 'Ocean' },
  forest: { bg: '#15803d', accent: '#ea580c', label: 'Forest' },
  sunset: { bg: '#dc2626', accent: '#f59e0b', label: 'Sunset' },
  warm:   { bg: '#92400e', accent: '#dc2626', label: 'Warm' },
  cool:   { bg: '#7c3aed', accent: '#06b6d4', label: 'Cool' },
};

export function ProfileScreen() {
  const { theme, isDark, toggleDarkMode, setThemePreset, themeKey } = useTheme();
  const { colors } = theme;
  const { profile, email, role, logout, refreshData, biometricCapability, biometricEnabled, enableBiometrics, disableBiometrics } = useAuth();

  const [fullProfile, setFullProfile] = useState<UserProfile | null>(profile);
  const [loading, setLoading] = useState(!profile);

  // Entrance animations
  const headerAnim = useFadeIn(0, 500);
  const avatarAnim = useScaleIn(100);
  const infoAnim = useSlideUp(250, 30);
  const appearanceAnim = useSlideUp(400, 30);
  const securityAnim = useSlideUp(500, 30);
  const actionsAnim = useSlideUp(600, 30);

  useEffect(() => {
    if (!profile) {
      api.getFullProfile().then(r => {
        if (r.success && r.data) setFullProfile(r.data);
      }).catch(() => {
        // Profile fetch failed — show what we have from cached data
      }).finally(() => {
        setLoading(false);
      });
    }
  }, []);

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  }

  if (loading) return <LoadingScreen />;

  const p = fullProfile || profile;
  const getInitials = () => {
    if (!p) return '?';
    return ((p.firstName?.[0] || '') + (p.lastName?.[0] || '')).toUpperCase() || '?';
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Profile Header */}
      <Animated.View style={[styles.header, { backgroundColor: colors.headerGradientStart }, headerAnim]}>
        <Animated.View style={avatarAnim}>
          <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={[styles.avatarText, { color: colors.textOnPrimary }]}>{getInitials()}</Text>
          </View>
        </Animated.View>
        <Text style={[styles.name, { color: colors.textOnPrimary }]}>
          {p?.firstName} {p?.lastName}
        </Text>
        <Text style={[styles.email, { color: colors.textOnPrimary + 'bb' }]}>{email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <Ionicons
            name={role === 'steward' || role === 'both' ? 'shield' : 'person'}
            size={14}
            color={colors.textOnPrimary}
          />
          <Text style={[styles.roleText, { color: colors.textOnPrimary }]}>
            {role === 'steward' || role === 'both' ? 'Steward' : 'Member'}
          </Text>
        </View>
      </Animated.View>

      <View style={styles.content}>
        {/* Personal Info */}
        <Animated.View style={infoAnim}>
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
            <InfoItem icon="mail-outline" label="Email" value={email || ''} colors={colors} />
            <InfoItem icon="call-outline" label="Phone" value={p?.phone || 'Not set'} colors={colors} />
            <InfoItem icon="business-outline" label="Unit" value={p?.unit || 'N/A'} colors={colors} />
            <InfoItem icon="location-outline" label="Location" value={p?.workLocation || 'N/A'} colors={colors} />
            <InfoItem icon="briefcase-outline" label="Title" value={p?.jobTitle || 'N/A'} colors={colors} />
            <InfoItem icon="id-card-outline" label="Member ID" value={p?.memberId || 'N/A'} colors={colors} />
            <InfoItem icon="cash-outline" label="Dues Status" value={p?.duesStatus || 'Unknown'} colors={colors} />
          </Card>
        </Animated.View>

        {/* Appearance — Vibrant Theme Picker */}
        <Animated.View style={appearanceAnim}>
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>

            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? colors.primary + '15' : colors.accent + '15' }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={isDark ? colors.primary : colors.accent} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
              <Switch
                value={isDark}
                onValueChange={toggleDarkMode}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={isDark ? colors.primary : '#f4f4f4'}
              />
            </View>

            <Text style={[styles.themeLabel, { color: colors.textSecondary }]}>Color Theme</Text>
            <View style={styles.themeGrid}>
              {Object.entries(THEME_SWATCHES).map(([key, swatch]) => {
                const isActive = themeKey === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setThemePreset(key)}
                    style={[
                      styles.themeSwatch,
                      isActive && styles.themeSwatchActive,
                      isActive && { borderColor: colors.primary },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.swatchColors}>
                      <View style={[styles.swatchLeft, { backgroundColor: swatch.bg }]} />
                      <View style={[styles.swatchRight, { backgroundColor: swatch.accent }]} />
                    </View>
                    <Text style={[
                      styles.swatchLabel,
                      { color: isActive ? colors.primary : colors.textSecondary },
                      isActive && { fontWeight: '700' },
                    ]}>
                      {swatch.label}
                    </Text>
                    {isActive && (
                      <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]}>
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </Animated.View>

        {/* Security */}
        {biometricCapability?.available && biometricCapability.enrolled && (
          <Animated.View style={securityAnim}>
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>
              <View style={styles.settingRow}>
                <View style={[styles.settingIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons
                    name={biometricCapability.type === 'face_id' ? 'scan-outline' : 'finger-print-outline'}
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {biometricCapability.label}
                </Text>
                <Switch
                  value={biometricEnabled}
                  onValueChange={async (enabled) => {
                    if (enabled) {
                      const ok = await enableBiometrics();
                      if (ok) {
                        Alert.alert(
                          `${biometricCapability.label} Enabled`,
                          `You can now sign in with ${biometricCapability.label} for quick access.`
                        );
                      } else {
                        Alert.alert('Error', `Could not enable ${biometricCapability.label}. Please try again.`);
                      }
                    } else {
                      await disableBiometrics();
                    }
                  }}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={biometricEnabled ? colors.primary : '#f4f4f4'}
                />
              </View>
              <Text style={[styles.biometricHelp, { color: colors.textSecondary }]}>
                {biometricEnabled
                  ? `${biometricCapability.label} is enabled. You can sign in quickly on the lock screen.`
                  : `Enable ${biometricCapability.label} for instant sign-in without entering credentials.`}
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Actions */}
        <Animated.View style={actionsAnim}>
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => refreshData()}>
              <View style={[styles.settingIcon, { backgroundColor: colors.info + '15' }]}>
                <Ionicons name="refresh-outline" size={18} color={colors.info} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>Refresh Data</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </Card>

          <View style={{ height: 8 }} />

          <Button
            title="Sign Out"
            variant="danger"
            onPress={handleLogout}
            fullWidth
            icon={<Ionicons name="log-out-outline" size={20} color={colors.textOnPrimary} />}
          />

          <Text style={[styles.version, { color: colors.textSecondary }]}>
            GroupUp Mobile v1.0.0
          </Text>
        </Animated.View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function InfoItem({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: Record<string, string> }) {
  return (
    <View style={itemStyles.row}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.textSecondary} />
      <Text style={[itemStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[itemStyles.value, { color: colors.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const itemStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  label: { fontSize: 13, width: 80 },
  value: { fontSize: 14, fontWeight: '500', flex: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60, paddingBottom: 28, alignItems: 'center', gap: 6,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  avatar: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { fontSize: 34, fontWeight: '800' },
  name: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  email: { fontSize: 14 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12, marginTop: 6 },
  roleText: { fontSize: 13, fontWeight: '600' },
  content: { padding: 16, gap: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8, letterSpacing: -0.3 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  settingIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  themeLabel: { fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  themeSwatch: {
    width: '30%' as unknown as number,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeSwatchActive: {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  swatchColors: {
    width: 48, height: 48, borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  swatchLeft: { flex: 2 },
  swatchRight: { flex: 1 },
  swatchLabel: { fontSize: 11, fontWeight: '500' },
  activeIndicator: {
    position: 'absolute', top: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  biometricHelp: { fontSize: 13, lineHeight: 18, marginTop: 4, marginLeft: 44 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  version: { textAlign: 'center', fontSize: 12, marginTop: 8 },
});
