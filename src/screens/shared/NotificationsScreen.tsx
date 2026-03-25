// ============================================================================
// NotificationsScreen - In-app notifications
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { Card, EmptyState } from '../../components';
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
  const { batchData } = useAuth();

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  useEffect(() => {
    if (batchData?.notifications) {
      setNotifications(batchData.notifications.filter(n => !n.dismissed));
    }
  }, [batchData]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <EmptyState icon="notifications-off-outline" title="No Notifications" message="You're all caught up!" />
        }
        renderItem={({ item }) => {
          const iconName = ICON_MAP[item.type] || 'notifications';
          return (
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
          );
        }}
      />
    </View>
  );
}

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
