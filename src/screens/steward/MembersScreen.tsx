// ============================================================================
// MembersScreen - Animated member directory with staggered list
// ============================================================================

import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import { SearchBar, Card, EmptyState, SkeletonList } from '../../components';
import { api } from '../../api';
import { hapticLight } from '../../utils/haptics';
import type { MemberRecord } from '../../types';

interface Props {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

export function MembersScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;
  const { batchData } = useAuth();

  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headerAnim = useFadeIn(0, 300);

  useEffect(() => { loadMembers(); }, []);

  async function loadMembers() {
    setError(null);
    try {
      if (batchData?.members) { setMembers(batchData.members); setLoading(false); return; }
      const result = await api.getAllMembers();
      if (result.success && result.data) setMembers((result.data as { members: MemberRecord[] }).members || []);
    } catch {
      setError('Could not load members. Pull down to retry.');
    } finally { setLoading(false); }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const result = await api.getAllMembers();
    if (result.success && result.data) setMembers((result.data as { members: MemberRecord[] }).members || []);
    setRefreshing(false);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const s = search.toLowerCase();
    return members.filter(m =>
      m.name?.toLowerCase().includes(s) || m.firstName?.toLowerCase().includes(s) ||
      m.lastName?.toLowerCase().includes(s) || m.email?.toLowerCase().includes(s) ||
      m.unit?.toLowerCase().includes(s) || m.memberId?.toLowerCase().includes(s)
    );
  }, [members, search]);

  if (loading) return <View style={[styles.container, { backgroundColor: colors.background }]}><SkeletonList count={6} /></View>;

  const getInitials = (m: MemberRecord) => {
    const f = (m.firstName || m.name || '?')[0];
    const l = (m.lastName || '')[0] || '';
    return (f + l).toUpperCase();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={headerAnim}>
        <View style={styles.searchRow}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search members..." />
        </View>
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {filtered.length} member{filtered.length !== 1 ? 's' : ''}
        </Text>
      </Animated.View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.email || item.memberId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={<EmptyState icon="people-outline" title={error ? 'Load Error' : 'No Members Found'} message={error || undefined} />}
        renderItem={({ item, index }) => (
          <MemberListItem member={item} index={index} colors={colors} initials={getInitials(item)} navigation={navigation} />
        )}
      />
    </View>
  );
}

const MemberListItem = React.memo(function MemberListItem({ member: item, index, colors, initials, navigation }: {
  member: MemberRecord; index: number; colors: ThemeColors; initials: string;
  navigation: { navigate: (s: string, p?: Record<string, unknown>) => void };
}) {
  const staggerStyle = useStaggerItem(index, 35);

  return (
    <Animated.View style={staggerStyle}>
      <Card onPress={() => { hapticLight(); navigation.navigate('MemberDetail', { member: item }); }} style={styles.memberCard}>
        <View style={styles.memberRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={[styles.memberName, { color: colors.text }]}>{item.firstName} {item.lastName}</Text>
            <Text style={[styles.memberDetail, { color: colors.textSecondary }]}>{item.unit || item.workLocation || 'No unit'}</Text>
            {item.jobTitle && <Text style={[styles.memberDetail, { color: colors.textSecondary }]}>{item.jobTitle}</Text>}
          </View>
          <View style={styles.memberRight}>
            {item.isDuesPaying && (
              <View style={[styles.duesBadge, { backgroundColor: colors.success + '15' }]}>
                <Text style={[styles.duesText, { color: colors.success }]}>Dues</Text>
              </View>
            )}
            {item.hasOpenGrievance && <Ionicons name="alert-circle" size={18} color={colors.warning} />}
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </View>
      </Card>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: { paddingHorizontal: 16, paddingTop: 12 },
  count: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, fontSize: 13, fontWeight: '500' },
  listContent: { padding: 16, gap: 8 },
  emptyContainer: { flex: 1 },
  memberCard: { padding: 12 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' },
  memberInfo: { flex: 1, gap: 2 },
  memberName: { fontSize: 16, fontWeight: '600' },
  memberDetail: { fontSize: 13 },
  memberRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  duesBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  duesText: { fontSize: 11, fontWeight: '600' },
});
