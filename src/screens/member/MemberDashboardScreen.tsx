// ============================================================================
// MemberDashboardScreen - Main member overview
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { Card, StatusChip, LoadingScreen, Button } from '../../components';
import { api } from '../../api';
import { a11yButton } from '../../utils/accessibility';
import type { GrievanceCase, StewardInfo, MeetingRecord } from '../../types';

interface Props {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

export function MemberDashboardScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;
  const { profile, batchData } = useAuth();

  const [grievances, setGrievances] = useState<GrievanceCase[]>([]);
  const [steward, setSteward] = useState<StewardInfo | null>(null);
  const [events, setEvents] = useState<MeetingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      if (batchData) {
        if (batchData.grievances) setGrievances(batchData.grievances);
        if (batchData.assignedSteward) setSteward(batchData.assignedSteward);
        setLoading(false);
        return;
      }

      const [grResult, stResult, evResult] = await Promise.all([
        api.getMemberGrievances(),
        api.getAssignedSteward(),
        api.getUpcomingEvents(3),
      ]);

      if (grResult.success && grResult.data) setGrievances((grResult.data as { grievances: GrievanceCase[] }).grievances || []);
      if (stResult.success && stResult.data) setSteward(stResult.data as StewardInfo);
      if (evResult.success && evResult.data) setEvents(evResult.data as MeetingRecord[]);
    } catch {
      setError('Could not load dashboard. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, [batchData]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  if (loading) return <LoadingScreen message="Loading your dashboard..." />;

  const activeGrievances = grievances.filter(g => !['resolved', 'closed', 'won', 'denied', 'settled', 'withdrawn'].includes(g.status.toLowerCase()));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Welcome */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={[styles.greeting, { color: colors.textOnPrimary }]}>
          Hello, {profile?.firstName || 'Member'}
        </Text>
        <Text style={[styles.headerSub, { color: colors.textOnPrimary + 'cc' }]}>
          {profile?.unit || 'Welcome to your union portal'}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Error Banner */}
        {error && (
          <Card>
            <View style={styles.emptyCase}>
              <Ionicons name="cloud-offline-outline" size={24} color={colors.error} />
              <Text style={[styles.emptyCaseText, { color: colors.error }]}>{error}</Text>
            </View>
          </Card>
        )}

        {/* Your Steward */}
        {steward && (
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Steward</Text>
            <View style={styles.stewardRow}>
              <View style={[styles.stewardAvatar, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="person" size={24} color={colors.primary} />
              </View>
              <View style={styles.stewardInfo}>
                <Text style={[styles.stewardName, { color: colors.text }]}>{steward.name}</Text>
                {steward.phone && <Text style={[styles.stewardDetail, { color: colors.textSecondary }]}>{steward.phone}</Text>}
                <Text style={[styles.stewardDetail, { color: colors.textSecondary }]}>{steward.email}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Active Grievances */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Cases</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyGrievances')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {activeGrievances.length === 0 ? (
            <Card>
              <View style={styles.emptyCase}>
                <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                <Text style={[styles.emptyCaseText, { color: colors.textSecondary }]}>
                  No active cases
                </Text>
              </View>
            </Card>
          ) : (
            activeGrievances.slice(0, 3).map(g => (
              <TouchableOpacity key={g.id} onPress={() => navigation.navigate('GrievanceDetail', { grievance: g })}>
                <Card style={styles.grievanceCard}>
                  <View style={styles.grievanceHeader}>
                    <Text style={[styles.grievanceId, { color: colors.textSecondary }]}>{g.id}</Text>
                    <StatusChip status={g.status} size="sm" />
                  </View>
                  <Text style={[styles.grievanceCategory, { color: colors.text }]}>
                    {g.issueCategory || 'Grievance'}
                  </Text>
                  {g.deadline && (
                    <View style={styles.deadlineRow}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                      <Text style={[styles.deadlineText, { color: colors.textSecondary }]}>
                        Next deadline: {new Date(g.deadline).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Upcoming Events */}
        {events.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Events</Text>
            {events.map((ev, i) => (
              <Card key={i}>
                <View style={styles.eventRow}>
                  <View style={[styles.eventDateBox, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="calendar" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={[styles.eventTitle, { color: colors.text }]}>{ev.title}</Text>
                    <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
                      {new Date(ev.date).toLocaleDateString()} {ev.location ? `- ${ev.location}` : ''}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Survey')}
              {...a11yButton('Take Survey')}
            >
              <Ionicons name="chatbox-ellipses-outline" size={24} color={colors.primary} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>Take Survey</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Resources')}
              {...a11yButton('Resources')}
            >
              <Ionicons name="library-outline" size={24} color={colors.primary} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>Resources</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Profile')}
              {...a11yButton('My Profile')}
            >
              <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>My Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  greeting: { fontSize: 24, fontWeight: '700' },
  headerSub: { fontSize: 14, marginTop: 4 },
  content: { padding: 16, gap: 16 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  seeAll: { fontSize: 14, fontWeight: '500' },
  stewardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  stewardAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  stewardInfo: { flex: 1, gap: 2 },
  stewardName: { fontSize: 16, fontWeight: '600' },
  stewardDetail: { fontSize: 13 },
  emptyCase: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  emptyCaseText: { fontSize: 14 },
  grievanceCard: { gap: 6 },
  grievanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grievanceId: { fontSize: 12, fontWeight: '600' },
  grievanceCategory: { fontSize: 16, fontWeight: '500' },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deadlineText: { fontSize: 13 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eventDateBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  eventInfo: { flex: 1, gap: 2 },
  eventTitle: { fontSize: 15, fontWeight: '500' },
  eventDate: { fontSize: 13 },
  quickActions: { flexDirection: 'row', gap: 12 },
  quickAction: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 20, borderRadius: 12, borderWidth: 1 },
  quickActionText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
});
