// ============================================================================
// MyGrievancesScreen - Member's own grievance cases
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Card, StatusChip, EmptyState, LoadingScreen } from '../../components';
import { api } from '../../api';
import type { GrievanceCase } from '../../types';

interface Props {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

export function MyGrievancesScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;

  const [grievances, setGrievances] = useState<GrievanceCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadGrievances(); }, []);

  async function loadGrievances() {
    setError(null);
    try {
      const result = await api.getMemberGrievances();
      if (result.success && result.data) {
        setGrievances((result.data as { grievances: GrievanceCase[] }).grievances || []);
      }
    } catch {
      setError('Could not load your cases. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGrievances();
    setRefreshing(false);
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={grievances}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={grievances.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon={error ? 'cloud-offline-outline' : 'document-text-outline'}
            title={error ? 'Load Error' : 'No Grievances'}
            message={error || "You don't have any filed grievances. Contact your steward if you need to file one."}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('GrievanceDetail', { grievance: item })}>
            <Card style={styles.caseCard}>
              <View style={styles.caseHeader}>
                <Text style={[styles.caseId, { color: colors.textSecondary }]}>{item.id}</Text>
                <StatusChip status={item.status} size="sm" />
              </View>
              <Text style={[styles.caseCategory, { color: colors.text }]}>
                {item.issueCategory || 'Grievance'}
              </Text>
              <View style={styles.caseDetails}>
                {item.step && (
                  <View style={styles.detailItem}>
                    <Ionicons name="layers-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.step}</Text>
                  </View>
                )}
                {item.filed && (
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      Filed: {new Date(item.filed).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                {item.steward && (
                  <View style={styles.detailItem}>
                    <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.steward}</Text>
                  </View>
                )}
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, gap: 10 },
  emptyContainer: { flex: 1 },
  caseCard: { gap: 8 },
  caseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  caseId: { fontSize: 12, fontWeight: '600' },
  caseCategory: { fontSize: 16, fontWeight: '600' },
  caseDetails: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13 },
});
