// ============================================================================
// StewardDashboardScreen - Animated steward overview with KPIs
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
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useFadeIn, useSlideUp, useStaggerItem } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { KPICard, Card, StatusChip, LoadingScreen } from '../../components';
import { api } from '../../api';
import type { StewardKPIs, GrievanceCase, TaskRecord } from '../../types';

interface Props {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

export function StewardDashboardScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const { profile, batchData } = useAuth();

  const [kpis, setKpis] = useState<StewardKPIs | null>(null);
  const [recentCases, setRecentCases] = useState<GrievanceCase[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headerAnim = useFadeIn(0, 500);
  const kpiAnim = useSlideUp(200, 40);
  const casesAnim = useSlideUp(400, 30);
  const tasksAnim = useSlideUp(550, 30);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setError(null);
    try {
      if (batchData) {
        if (batchData.kpis) setKpis(batchData.kpis);
        if (batchData.cases) setRecentCases(batchData.cases.slice(0, 5));
        if (batchData.tasks) setTasks(batchData.tasks.filter(t => t.status !== 'completed').slice(0, 5));
        setLoading(false);
        return;
      }

      const [kpiResult, casesResult, tasksResult] = await Promise.all([
        api.getStewardKPIs(),
        api.getStewardCases(),
        api.getTasks('active'),
      ]);

      if (kpiResult.success && kpiResult.data) setKpis(kpiResult.data);
      if (casesResult.success && casesResult.data) setRecentCases((casesResult.data as { cases: GrievanceCase[] }).cases?.slice(0, 5) || []);
      if (tasksResult.success && tasksResult.data) setTasks((tasksResult.data as TaskRecord[]).slice(0, 5));
    } catch {
      setError('Could not load dashboard. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  if (loading) return <LoadingScreen message="Loading dashboard..." />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Animated Welcome Header */}
      <Animated.View style={[styles.header, { backgroundColor: colors.headerGradientStart }, headerAnim]}>
        <View style={styles.headerContent}>
          <View style={[styles.greetingBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Ionicons name="shield-checkmark" size={20} color={colors.textOnPrimary} />
          </View>
          <Text style={[styles.greeting, { color: colors.textOnPrimary }]}>
            Welcome back, {profile?.firstName || 'Steward'}
          </Text>
          <Text style={[styles.role, { color: colors.textOnPrimary + 'bb' }]}>
            {profile?.unit || 'Union Steward'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={[styles.notifBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.content}>
        {/* Error Banner */}
        {error && (
          <Card>
            <Text style={[styles.emptyText, { color: colors.error }]}>{error}</Text>
          </Card>
        )}

        {/* KPI Row — staggered scale-in */}
        {kpis && (
          <Animated.View style={kpiAnim}>
            <View style={styles.kpiRow}>
              <KPICard label="Active Cases" value={kpis.activeCases} icon="briefcase" color={colors.info} delay={100} />
              <KPICard label="Overdue" value={kpis.overdue} icon="alert-circle" color={colors.error} delay={200} />
            </View>
            <View style={[styles.kpiRow, { marginTop: 12 }]}>
              <KPICard label="Due Soon" value={kpis.dueSoon} icon="time" color={colors.warning} delay={300} />
              <KPICard label="Resolved" value={kpis.resolved} icon="checkmark-circle" color={colors.success} delay={400} />
            </View>
          </Animated.View>
        )}

        {/* Recent Cases — staggered slide-up */}
        <Animated.View style={[styles.section, casesAnim]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Cases</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Cases')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentCases.length === 0 ? (
            <Card>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No active cases</Text>
            </Card>
          ) : (
            recentCases.map((c, index) => (
              <CaseItem key={c.id} caseData={c} index={index} colors={colors} onPress={() => navigation.navigate('CaseDetail', { caseId: c.id, caseData: c })} />
            ))
          )}
        </Animated.View>

        {/* Active Tasks — staggered slide-up */}
        <Animated.View style={[styles.section, tasksAnim]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tasks</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {tasks.length === 0 ? (
            <Card>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No pending tasks</Text>
            </Card>
          ) : (
            tasks.map((t, index) => (
              <TaskItem key={t.id} task={t} index={index} colors={colors} />
            ))
          )}
        </Animated.View>
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const CaseItem = React.memo(function CaseItem({ caseData: c, index, colors, onPress }: { caseData: GrievanceCase; index: number; colors: Record<string, string>; onPress: () => void }) {
  const staggerStyle = useStaggerItem(index, 60);

  return (
    <Animated.View style={staggerStyle}>
      <Card onPress={onPress} style={styles.caseCard}>
        <View style={styles.caseRow}>
          <View style={styles.caseInfo}>
            <Text style={[styles.caseId, { color: colors.textSecondary }]}>{c.id}</Text>
            <Text style={[styles.caseName, { color: colors.text }]}>
              {c.memberFirstName} {c.memberLastName}
            </Text>
            <Text style={[styles.caseCategory, { color: colors.textSecondary }]}>
              {c.issueCategory || 'General'}
            </Text>
          </View>
          <View style={styles.caseRight}>
            <StatusChip status={c.status} size="sm" />
            {c.deadline && (
              <Text style={[styles.deadline, { color: colors.textSecondary }]}>
                Due: {new Date(c.deadline).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      </Card>
    </Animated.View>
  );
});

const TaskItem = React.memo(function TaskItem({ task: t, index, colors }: { task: TaskRecord; index: number; colors: Record<string, string> }) {
  const staggerStyle = useStaggerItem(index, 60);

  return (
    <Animated.View style={staggerStyle}>
      <Card style={styles.taskCard}>
        <View style={styles.taskRow}>
          <View style={[styles.priorityDot, { backgroundColor: t.priority === 'high' ? colors.error : t.priority === 'medium' ? colors.warning : colors.textSecondary }]} />
          <View style={styles.taskInfo}>
            <Text style={[styles.taskTitle, { color: colors.text }]}>{t.title}</Text>
            {t.dueDate && (
              <Text style={[styles.taskDue, { color: colors.textSecondary }]}>
                Due: {new Date(t.dueDate).toLocaleDateString()}
              </Text>
            )}
          </View>
          <StatusChip status={t.status} size="sm" />
        </View>
      </Card>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: { flex: 1, gap: 4 },
  greetingBadge: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  greeting: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  role: { fontSize: 14, fontWeight: '500' },
  notifBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  content: { padding: 16, gap: 20 },
  kpiRow: { flexDirection: 'row', gap: 12 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  seeAll: { fontSize: 14, fontWeight: '600' },
  caseCard: { marginBottom: 2 },
  caseRow: { flexDirection: 'row', justifyContent: 'space-between' },
  caseInfo: { flex: 1, gap: 2 },
  caseId: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  caseName: { fontSize: 16, fontWeight: '600' },
  caseCategory: { fontSize: 13 },
  caseRight: { alignItems: 'flex-end', gap: 6 },
  deadline: { fontSize: 12 },
  taskCard: { marginBottom: 2 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '500' },
  taskDue: { fontSize: 12, marginTop: 2 },
  emptyText: { textAlign: 'center', fontSize: 14, paddingVertical: 8 },
});
