// ============================================================================
// MemberDetailScreen - Animated profile with gradient header
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useFadeIn, useSlideUp, useScaleIn, useStaggerItem } from '../../theme';
import { Card, Button, GradientHeader } from '../../components';
import { api } from '../../api';
import { hapticLight, hapticMedium } from '../../utils/haptics';
import type { MemberRecord, ContactLogEntry } from '../../types';

interface Props {
  route: { params: { member: MemberRecord } };
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

export function MemberDetailScreen({ route, navigation }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;
  const { member } = route.params;
  const [contactLog, setContactLog] = useState<ContactLogEntry[]>([]);

  const headerAnim = useFadeIn(0, 400);
  const avatarAnim = useScaleIn(100);
  const actionsAnim = useSlideUp(200, 30);
  const detailsAnim = useSlideUp(300, 30);
  const logAnim = useSlideUp(400, 30);

  useEffect(() => {
    if (member.email) {
      api.getMemberContactHistory(member.email).then(r => {
        if (r.success && r.data) setContactLog(r.data as ContactLogEntry[]);
      }).catch(() => {
        // Contact log is non-critical; silently degrade
      });
    }
  }, [member.email]);

  const getInitials = () => {
    const f = (member.firstName || member.name || '?')[0];
    const l = (member.lastName || '')[0] || '';
    return (f + l).toUpperCase();
  };

  function handleCall() {
    hapticMedium();
    if (member.phone) {
      Linking.openURL(`tel:${member.phone}`).catch(() => {
        Alert.alert('Error', 'Could not open the phone dialer.');
      });
    } else {
      Alert.alert('No Phone', 'No phone number on file for this member.');
    }
  }

  function handleEmail() {
    hapticMedium();
    if (member.email) {
      Linking.openURL(`mailto:${member.email}`).catch(() => {
        Alert.alert('Error', 'Could not open the email client.');
      });
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Gradient Header */}
      <Animated.View style={headerAnim}>
        <GradientHeader style={styles.header}>
          <Animated.View style={avatarAnim}>
            <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={[styles.avatarText, { color: colors.textOnPrimary }]}>{getInitials()}</Text>
            </View>
          </Animated.View>
          <Text style={[styles.name, { color: colors.textOnPrimary }]}>
            {member.firstName} {member.lastName}
          </Text>
          {member.jobTitle && (
            <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.8)' }]}>{member.jobTitle}</Text>
          )}
          <Text style={[styles.memberId, { color: 'rgba(255,255,255,0.6)' }]}>
            {member.memberId || 'No ID'}
          </Text>
        </GradientHeader>
      </Animated.View>

      <View style={styles.content}>
        {/* Quick Actions */}
        <Animated.View style={[styles.actionRow, actionsAnim]}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleCall}>
            <Ionicons name="call" size={22} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.primary }]}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleEmail}>
            <Ionicons name="mail" size={22} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.primary }]}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => { hapticLight(); navigation.navigate('LogContact', { member }); }}
          >
            <Ionicons name="create" size={22} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.primary }]}>Log</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Details */}
        <Animated.View style={detailsAnim}>
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
            <InfoRow icon="mail-outline" label="Email" value={member.email} colors={colors} />
            <InfoRow icon="call-outline" label="Phone" value={member.phone || 'Not shared'} colors={colors} />
            <InfoRow icon="business-outline" label="Unit" value={member.unit || 'N/A'} colors={colors} />
            <InfoRow icon="location-outline" label="Location" value={member.workLocation || 'N/A'} colors={colors} />
            <InfoRow icon="calendar-outline" label="Hire Date" value={member.hireDate || 'N/A'} colors={colors} />
            <InfoRow icon="cash-outline" label="Dues Status" value={member.duesStatus || 'Unknown'} colors={colors} />
            <InfoRow icon="alert-circle-outline" label="Open Grievance" value={member.hasOpenGrievance ? 'Yes' : 'No'} colors={colors} highlight={member.hasOpenGrievance ? colors.warning : undefined} />
          </Card>
        </Animated.View>

        {/* Contact Log */}
        <Animated.View style={logAnim}>
          <Card>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Log</Text>
              <Text style={[styles.logCount, { color: colors.textSecondary }]}>{contactLog.length} entries</Text>
            </View>
            {contactLog.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No contact history</Text>
            ) : (
              contactLog.slice(0, 5).map((entry, i) => (
                <LogEntry key={i} entry={entry} index={i} colors={colors} showBorder={i > 0} />
              ))
            )}
          </Card>
        </Animated.View>

        <Button
          title="Create Task for Member"
          variant="outline"
          icon={<Ionicons name="add-circle-outline" size={20} color={colors.primary} />}
          onPress={() => { hapticLight(); navigation.navigate('CreateTask', { memberEmail: member.email, memberName: `${member.firstName} ${member.lastName}` }); }}
          fullWidth
        />
      </View>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function LogEntry({ entry, index, colors, showBorder }: { entry: ContactLogEntry; index: number; colors: Record<string, string>; showBorder: boolean }) {
  const staggerStyle = useStaggerItem(index, 50);
  return (
    <Animated.View style={[styles.logEntry, showBorder && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }, staggerStyle]}>
      <View style={styles.logHeader}>
        <Text style={[styles.logType, { color: colors.primary }]}>{entry.type}</Text>
        <Text style={[styles.logDate, { color: colors.textSecondary }]}>{entry.date}</Text>
      </View>
      <Text style={[styles.logNotes, { color: colors.text }]}>{entry.notes}</Text>
    </Animated.View>
  );
}

function InfoRow({ icon, label, value, colors, highlight }: {
  icon: string; label: string; value: string; colors: Record<string, string>; highlight?: string;
}) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={highlight || colors.textSecondary} />
      <Text style={[infoStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: highlight || colors.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  label: { fontSize: 13, width: 95 },
  value: { fontSize: 14, fontWeight: '500', flex: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 24, alignItems: 'center', gap: 6 },
  avatar: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { fontSize: 30, fontWeight: '800' },
  name: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 15 },
  memberId: { fontSize: 12, marginTop: 4 },
  content: { padding: 16, gap: 16 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 16, borderRadius: 14, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  actionLabel: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, letterSpacing: -0.3 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logCount: { fontSize: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  logEntry: { paddingVertical: 10 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  logType: { fontSize: 13, fontWeight: '600' },
  logDate: { fontSize: 12 },
  logNotes: { fontSize: 14, lineHeight: 20 },
});
