// ============================================================================
// InsightsScreen - Animated analytics with staggered sections
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useFadeIn, useSlideUp, useStaggerItem } from '../../theme';
import { Card, KPICard, SkeletonDashboard } from '../../components';
import { api } from '../../api';

export function InsightsScreen() {
  const { theme } = useTheme();
  const { colors } = theme;

  const [insights, setInsights] = useState<Record<string, unknown> | null>(null);
  const [memberStats, setMemberStats] = useState<{ total: number; byLocation: Record<string, number>; byDues: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headerAnim = useFadeIn(0, 300);
  const kpiAnim = useSlideUp(100, 30);
  const locationAnim = useSlideUp(250, 30);
  const caseAnim = useSlideUp(400, 30);

  useEffect(() => { loadInsights(); }, []);

  async function loadInsights() {
    try {
      const [insightResult, memberResult] = await Promise.all([
        api.getInsightsBatch(),
        api.getStewardMemberStats(),
      ]);
      if (insightResult.success && insightResult.data) setInsights(insightResult.data);
      if (memberResult.success && memberResult.data) setMemberStats(memberResult.data);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  }, []);

  if (loading) return <View style={[styles.container, { backgroundColor: colors.background }]}><SkeletonDashboard /></View>;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.content}>
        {/* Member Stats KPIs */}
        {memberStats && (
          <>
            <Animated.View style={headerAnim}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Membership</Text>
            </Animated.View>
            <Animated.View style={[styles.kpiRow, kpiAnim]}>
              <KPICard label="Total Members" value={memberStats.total} icon="people" color={colors.primary} delay={0} />
              <KPICard
                label="Dues Paying"
                value={memberStats.byDues?.['paying'] || memberStats.byDues?.['Yes'] || 0}
                icon="cash"
                color={colors.success}
                delay={100}
              />
            </Animated.View>

            {/* By Location */}
            {Object.keys(memberStats.byLocation || {}).length > 0 && (
              <Animated.View style={locationAnim}>
                <Card>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>By Location</Text>
                  {Object.entries(memberStats.byLocation).map(([loc, count], i) => (
                    <LocationRow key={loc} location={loc} count={count} index={i} colors={colors} />
                  ))}
                </Card>
              </Animated.View>
            )}
          </>
        )}

        {/* Case Analytics */}
        {insights && (
          <>
            <Animated.View style={caseAnim}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Case Analytics</Text>
            </Animated.View>
            <Animated.View style={caseAnim}>
              <Card>
                {Object.entries(insights).map(([key, value], i) => {
                  if (typeof value === 'object' && value !== null) return null;
                  return <InsightRow key={key} label={key} value={String(value)} index={i} colors={colors} />;
                })}
              </Card>
            </Animated.View>
          </>
        )}

        {!insights && !memberStats && (
          <Animated.View style={headerAnim}>
            <Card>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No insights data available yet. Data will populate as cases and members are added.
              </Text>
            </Card>
          </Animated.View>
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function LocationRow({ location, count, index, colors }: {
  location: string; count: number; index: number; colors: Record<string, string>;
}) {
  const staggerStyle = useStaggerItem(index, 50);
  return (
    <Animated.View style={[styles.statRow, { borderBottomColor: colors.border }, staggerStyle]}>
      <Ionicons name="business-outline" size={16} color={colors.textSecondary} />
      <Text style={[styles.statLabel, { color: colors.text }]}>{location}</Text>
      <View style={[styles.countBadge, { backgroundColor: colors.primary + '15' }]}>
        <Text style={[styles.countText, { color: colors.primary }]}>{count}</Text>
      </View>
    </Animated.View>
  );
}

function InsightRow({ label, value, index, colors }: {
  label: string; value: string; index: number; colors: Record<string, string>;
}) {
  const staggerStyle = useStaggerItem(index, 50);
  const formatted = label.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
  return (
    <Animated.View style={[styles.statRow, { borderBottomColor: colors.border }, staggerStyle]}>
      <Text style={[styles.statLabel, { color: colors.text }]}>{formatted}</Text>
      <View style={[styles.countBadge, { backgroundColor: colors.accent + '15' }]}>
        <Text style={[styles.countText, { color: colors.accent }]}>{value}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  kpiRow: { flexDirection: 'row', gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, letterSpacing: -0.3 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  statLabel: { flex: 1, fontSize: 14 },
  countBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  countText: { fontSize: 14, fontWeight: '700' },
  emptyText: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
});
