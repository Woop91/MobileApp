// ============================================================================
// CasesScreen - Animated case list with search, filters, and swipe actions
// ============================================================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors, useTheme, useFadeIn, useSlideUp, useStaggerItem } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { SearchBar, StatusChip, Card, EmptyState, SkeletonList, SwipeableRow } from '../../components';
import { api } from '../../api';
import { hapticLight, hapticSelection } from '../../utils/haptics';
import { exportCasePDF } from '../../utils/pdfExport';
import { a11yButton } from '../../utils/accessibility';
import type { GrievanceCase } from '../../types';

const FILTER_OPTIONS = ['All', 'Active', 'Overdue', 'Step I', 'Step II', 'Step III', 'Arbitration', 'Resolved'];

interface Props {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

export function CasesScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;
  const { batchData } = useAuth();

  const [cases, setCases] = useState<GrievanceCase[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headerAnim = useFadeIn(0, 300);
  const listAnim = useSlideUp(200, 20);

  const loadCases = useCallback(async () => {
    setError(null);
    try {
      if (batchData?.cases) {
        setCases(batchData.cases);
        setLoading(false);
        return;
      }
      const result = await api.getStewardCases();
      if (result.success && result.data) {
        setCases((result.data as { cases: GrievanceCase[] }).cases || []);
      }
    } catch {
      setError('Could not load cases. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, [batchData]);

  useEffect(() => { loadCases(); }, [loadCases]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const result = await api.getStewardCases();
    if (result.success && result.data) {
      setCases((result.data as { cases: GrievanceCase[] }).cases || []);
    }
    setRefreshing(false);
  }, []);

  const filtered = useMemo(() => {
    let items = cases;
    if (filter !== 'All') {
      const f = filter.toLowerCase();
      items = items.filter(c => {
        if (f === 'active') return !['resolved', 'closed', 'won', 'denied', 'settled', 'withdrawn'].includes(c.status.toLowerCase());
        if (f === 'overdue') return c.deadline && new Date(c.deadline) < new Date() && !['resolved', 'closed'].includes(c.status.toLowerCase());
        return c.status.toLowerCase() === f || (c.step && c.step.toLowerCase() === f);
      });
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      items = items.filter(c =>
        c.id.toLowerCase().includes(s) ||
        c.memberFirstName.toLowerCase().includes(s) ||
        c.memberLastName.toLowerCase().includes(s) ||
        (c.issueCategory && c.issueCategory.toLowerCase().includes(s))
      );
    }
    return items;
  }, [cases, filter, search]);

  if (loading) return <View style={[styles.container, { backgroundColor: colors.background }]}><SkeletonList count={5} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={headerAnim}>
        <View style={styles.searchRow}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search cases..." />
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_OPTIONS}
          style={styles.filterList}
          contentContainerStyle={styles.filterContent}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => { hapticSelection(); setFilter(item); }}
              style={[styles.filterChip, {
                backgroundColor: filter === item ? colors.primary : colors.surface,
                borderColor: filter === item ? colors.primary : colors.border,
              }]}
              {...a11yButton(`Filter by ${item}`)}
            >
              <Text style={{ color: filter === item ? colors.textOnPrimary : colors.text, fontSize: 13, fontWeight: '600' }}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </Animated.View>

      <Animated.View style={[{ flex: 1 }, listAnim]}>
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={<EmptyState icon="briefcase-outline" title={error ? 'Load Error' : 'No Cases Found'} message={error || 'No cases match your current filters.'} />}
          renderItem={({ item, index }) => (
            <CaseListItem caseData={item} index={index} colors={colors} navigation={navigation} />
          )}
        />
      </Animated.View>
    </View>
  );
}

const CaseListItem = React.memo(function CaseListItem({ caseData: item, index, colors, navigation }: {
  caseData: GrievanceCase; index: number; colors: ThemeColors;
  navigation: { navigate: (s: string, p?: Record<string, unknown>) => void };
}) {
  const staggerStyle = useStaggerItem(index, 40);
  const isOverdue = item.deadline && new Date(item.deadline) < new Date();

  return (
    <Animated.View style={staggerStyle}>
      <SwipeableRow
        rightActions={[
          { icon: 'document-text', label: 'PDF', color: colors.info, onPress: () => exportCasePDF(item) },
        ]}
      >
        <Card onPress={() => { hapticLight(); navigation.navigate('CaseDetail', { caseId: item.id, caseData: item }); }} style={styles.caseCard}>
          <View style={styles.caseHeader}>
            <Text style={[styles.caseId, { color: colors.textSecondary }]}>{item.id}</Text>
            <StatusChip status={item.status} size="sm" />
          </View>
          <Text style={[styles.caseName, { color: colors.text }]}>
            {item.memberFirstName} {item.memberLastName}
          </Text>
          <View style={styles.caseDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="folder-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.issueCategory || 'General'}</Text>
            </View>
            {item.step && (
              <View style={styles.detailItem}>
                <Ionicons name="layers-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.step}</Text>
              </View>
            )}
            {item.deadline && (
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={14} color={isOverdue ? colors.error : colors.textSecondary} />
                <Text style={[styles.detailText, { color: isOverdue ? colors.error : colors.textSecondary }]}>
                  {new Date(item.deadline).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </Card>
      </SwipeableRow>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: { paddingHorizontal: 16, paddingTop: 12 },
  filterList: { maxHeight: 48, marginTop: 8 },
  filterContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  listContent: { padding: 16, gap: 10 },
  emptyContainer: { flex: 1 },
  caseCard: { gap: 8 },
  caseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  caseId: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  caseName: { fontSize: 17, fontWeight: '600' },
  caseDetails: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13 },
});
