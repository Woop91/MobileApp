// ============================================================================
// TasksScreen - Animated task management with swipe-to-complete
// ============================================================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors, useTheme, useFadeIn, useSlideUp, useStaggerItem, useScaleIn } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { SearchBar, Card, StatusChip, EmptyState, SkeletonList, SwipeableRow } from '../../components';
import { api } from '../../api';
import { hapticLight, hapticSelection, hapticSuccess } from '../../utils/haptics';
import type { TaskRecord } from '../../types';

const FILTER_TABS = ['active', 'completed', 'all'] as const;

interface Props {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

export function TasksScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;
  const { batchData } = useAuth();

  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [filter, setFilter] = useState<string>('active');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headerAnim = useFadeIn(0, 300);
  const listAnim = useSlideUp(200, 20);
  const fabAnim = useScaleIn(400);

  useEffect(() => { loadTasks(); }, [filter]);

  async function loadTasks() {
    try {
      if (filter === 'active' && batchData?.tasks) {
        setTasks(batchData.tasks);
        setLoading(false);
        return;
      }
      const result = await api.getTasks(filter);
      if (result.success && result.data) setTasks(result.data as TaskRecord[]);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const result = await api.getTasks(filter);
    if (result.success && result.data) setTasks(result.data as TaskRecord[]);
    setRefreshing(false);
  }, [filter]);

  async function handleComplete(taskId: string) {
    hapticLight();
    Alert.alert('Complete Task', 'Mark this task as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          const result = await api.completeTask(taskId);
          if (result.success) {
            hapticSuccess();
            setTasks(prev => prev.filter(t => t.id !== taskId));
          }
        },
      },
    ]);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return tasks;
    const s = search.toLowerCase();
    return tasks.filter(t =>
      t.title?.toLowerCase().includes(s) ||
      t.description?.toLowerCase().includes(s) ||
      t.memberEmail?.toLowerCase().includes(s)
    );
  }, [tasks, search]);

  if (loading) return <View style={[styles.container, { backgroundColor: colors.background }]}><SkeletonList count={5} /></View>;

  const getPriorityColor = (priority?: string) => {
    if (priority === 'high') return colors.error;
    if (priority === 'medium') return colors.warning;
    return colors.textSecondary;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={headerAnim}>
        <View style={styles.searchRow}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search tasks..." />
        </View>

        {/* Filter tabs */}
        <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
          {FILTER_TABS.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => { hapticSelection(); setFilter(f); setLoading(true); }}
              style={[styles.filterTab, filter === f && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            >
              <Text style={[styles.filterText, { color: filter === f ? colors.primary : colors.textSecondary }]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {filtered.length} task{filtered.length !== 1 ? 's' : ''}
        </Text>
      </Animated.View>

      <Animated.View style={[{ flex: 1 }, listAnim]}>
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={<EmptyState icon="checkmark-done-outline" title="No Tasks" message={filter === 'active' ? 'All caught up!' : 'No tasks found.'} />}
          renderItem={({ item, index }) => (
            <TaskListItem
              task={item}
              index={index}
              colors={colors}
              getPriorityColor={getPriorityColor}
              onComplete={handleComplete}
              filter={filter}
            />
          )}
        />
      </Animated.View>

      {/* Animated FAB */}
      <Animated.View style={[styles.fabWrapper, fabAnim]}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => { hapticLight(); navigation.navigate('CreateTask', {}); }}
        >
          <Ionicons name="add" size={28} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const TaskListItem = React.memo(function TaskListItem({ task: item, index, colors, getPriorityColor, onComplete, filter }: {
  task: TaskRecord; index: number; colors: ThemeColors;
  getPriorityColor: (p?: string) => string; onComplete: (id: string) => void; filter: string;
}) {
  const staggerStyle = useStaggerItem(index, 40);
  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'completed';

  const rightActions = item.status !== 'completed' ? [
    { icon: 'checkmark-circle' as const, label: 'Done', color: colors.success, onPress: () => onComplete(item.id) },
  ] : [];

  return (
    <Animated.View style={staggerStyle}>
      <SwipeableRow rightActions={rightActions}>
        <Card style={styles.taskCard}>
          <View style={styles.taskHeader}>
            <View style={styles.taskTitleRow}>
              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
              <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
            </View>
            <StatusChip status={item.status} size="sm" />
          </View>
          {item.description ? (
            <Text style={[styles.taskDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
          ) : null}
          <View style={styles.taskMeta}>
            {item.memberEmail && (
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>{item.memberEmail}</Text>
              </View>
            )}
            {item.dueDate && (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={isOverdue ? colors.error : colors.textSecondary} />
                <Text style={[styles.metaText, { color: isOverdue ? colors.error : colors.textSecondary }]}>
                  {new Date(item.dueDate).toLocaleDateString()}
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
  filterRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, marginTop: 4 },
  filterTab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  filterText: { fontSize: 14, fontWeight: '600' },
  count: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, fontSize: 13, fontWeight: '500' },
  listContent: { padding: 16, gap: 10, paddingBottom: 80 },
  emptyContainer: { flex: 1 },
  taskCard: { gap: 8 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  taskTitle: { fontSize: 15, fontWeight: '600', flex: 1 },
  taskDesc: { fontSize: 13, lineHeight: 18 },
  taskMeta: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  metaText: { fontSize: 12 },
  fabWrapper: { position: 'absolute', bottom: 24, right: 24 },
  fab: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
});
