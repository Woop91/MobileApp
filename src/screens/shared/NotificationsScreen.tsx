// ============================================================================
// NotificationsScreen - In-app notifications with pull-to-refresh
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors, useTheme, useStaggerItem } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { Card, EmptyState, SwipeableRow } from '../../components';
import type { NotificationRecord } from '../../types';

const ICON_MAP: Record<string, string> = {
  steward_message: 'chatbubble',
  announcement: 'megaphone',
  deadline: 'alarm',
  system: 'settings',
};

export function NotificationsScreen() {
  const { theme } = useTheme();
  const { colors } = theme;
  const { batchData, refreshData } = useAuth();

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (batchData?.notifications) {
      setNotifications(batchData.notifications.filter(n => !n.dismissed));
    }
  }, [batchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const handleDismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <EmptyState icon="notifications-off-outline" title="No Notifications" message="You're all caught up!" />
        }
        renderItem={({ item, index }) => (
          <NotificationItem item={item} index={index} colors={colors} onDismiss={handleDismiss} />
        )}
      />
    </View>
  );
}

const NotificationItem = React.memo(function NotificationItem({ item, index, colors, onDismiss }: {
  item: NotificationRecord; index: number; colors: ThemeColors; onDismiss: (id: string) => void;
}) {
  const staggerStyle = useStaggerItem(index, 40);
  const iconName = ICON_MAP[item.type] || 'notifications';

  const rightActions = [
    { icon: 'close-circle' as const, label: 'Dismiss', color: colors.textSecondary, onPress: () => onDismiss(item.id) },
  ];

  return (
    <Animated.View style={staggerStyle}>
      <SwipeableRow rightActions={rightActions}>
        <Card style={styles.notifCard}>
          <View style={styles.notifRow}>
            <View style={[styles.notifIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={20} color={colors.primary} />
            </View>
            <View style={styles.notifContent}>
              <Text style={[styles.notifTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.notifBody, { color: colors.textSecondary }]} numberOfLines={3}>
                {item.body}
              </Text>
              <Text style={[styles.notifDate, { color: colors.textSecondary }]}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </Card>
      </SwipeableRow>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, gap: 10 },
  emptyContainer: { flex: 1 },
  notifCard: { padding: 12 },
  notifRow: { flexDirection: 'row', gap: 12 },
  notifIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  notifContent: { flex: 1, gap: 4 },
  notifTitle: { fontSize: 15, fontWeight: '600' },
  notifBody: { fontSize: 14, lineHeight: 20 },
  notifDate: { fontSize: 12, marginTop: 2 },
});
