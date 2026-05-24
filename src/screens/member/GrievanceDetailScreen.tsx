// ============================================================================
// GrievanceDetailScreen - Member view of a grievance with animated header
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors, useTheme, useFadeIn, useSlideUp } from '../../theme';
import { Card, StatusChip, GradientHeader } from '../../components';
import type { GrievanceCase } from '../../types';

interface Props {
  route: { params?: { grievance?: GrievanceCase } };
}

export function GrievanceDetailScreen({ route }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;
  const g = route?.params?.grievance;

  const headerAnim = useFadeIn(0, 400);
  const detailsAnim = useSlideUp(200, 30);
  const notesAnim = useSlideUp(350, 30);

  if (!g) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Case not found</Text>
      </View>
    );
  }

  const isOverdue = g.deadline && new Date(g.deadline) < new Date();
  const isClosed = ['resolved', 'closed', 'won', 'denied', 'settled', 'withdrawn'].includes(g.status?.toLowerCase() || '');

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Gradient Header */}
      <Animated.View style={headerAnim}>
        <GradientHeader style={styles.header}>
          <Text style={[styles.caseId, { color: 'rgba(255,255,255,0.7)' }]}>{g.id}</Text>
          <Text style={[styles.category, { color: colors.textOnPrimary }]}>
            {g.issueCategory || 'Grievance'}
          </Text>
          <View style={styles.headerChips}>
            <StatusChip status={g.status} />
            {g.step && <StatusChip status={g.step} />}
          </View>
        </GradientHeader>
      </Animated.View>

      <View style={styles.content}>
        {/* Key Details */}
        <Animated.View style={detailsAnim}>
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Case Details</Text>
            <DetailRow icon="calendar" label="Filed" value={g.filed ? new Date(g.filed).toLocaleDateString() : 'N/A'} colors={colors} />
            <DetailRow
              icon="alarm"
              label="Deadline"
              value={g.deadline ? new Date(g.deadline).toLocaleDateString() : 'N/A'}
              colors={colors}
              highlight={isOverdue ? colors.error : undefined}
            />
            <DetailRow icon="layers" label="Step" value={g.step || 'N/A'} colors={colors} />
            <DetailRow icon="person" label="Steward" value={g.steward || 'N/A'} colors={colors} />
            {g.unit && <DetailRow icon="business" label="Unit" value={g.unit} colors={colors} />}
            {g.priority && <DetailRow icon="flag" label="Priority" value={g.priority} colors={colors} />}
          </Card>
        </Animated.View>

        {/* Status Banner */}
        {isClosed && (
          <Animated.View style={notesAnim}>
            <View style={[styles.statusBanner, { backgroundColor: colors.success + '12', borderColor: colors.success + '30' }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[styles.statusBannerText, { color: colors.success }]}>
                This case has been {g.status?.toLowerCase() || 'resolved'}
                {g.dateClosed ? ` on ${new Date(g.dateClosed).toLocaleDateString()}` : ''}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Overdue Banner */}
        {isOverdue && !isClosed && (
          <Animated.View style={notesAnim}>
            <View style={[styles.statusBanner, { backgroundColor: colors.error + '12', borderColor: colors.error + '30' }]}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={[styles.statusBannerText, { color: colors.error }]}>
                Deadline has passed — contact your steward for an update
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Notes */}
        {g.notes && (
          <Animated.View style={notesAnim}>
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
              <Text style={[styles.notes, { color: colors.textSecondary }]}>{g.notes}</Text>
            </Card>
          </Animated.View>
        )}

        {/* Resolution */}
        {g.resolution && (
          <Animated.View style={notesAnim}>
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Resolution</Text>
              <Text style={[styles.notes, { color: colors.textSecondary }]}>{g.resolution}</Text>
            </Card>
          </Animated.View>
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function DetailRow({ icon, label, value, colors, highlight }: {
  icon: string; label: string; value: string; colors: ThemeColors; highlight?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={highlight || colors.textSecondary} />
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: highlight || colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, gap: 6 },
  caseId: { fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  category: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  headerChips: { flexDirection: 'row', gap: 8, marginTop: 8 },
  content: { padding: 16, gap: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, letterSpacing: -0.3 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  detailLabel: { fontSize: 13, width: 80 },
  detailValue: { fontSize: 14, fontWeight: '500', flex: 1 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  statusBannerText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },
  notes: { fontSize: 14, lineHeight: 21 },
  emptyText: { fontSize: 16, marginTop: 12 },
});
