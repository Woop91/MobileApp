// ============================================================================
// GrievanceDetailScreen - Member view of a single grievance case
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { Card } from '../../components';
import type { GrievanceCase } from '../../types';

interface Props {
  route: { params?: { grievance?: GrievanceCase } };
}

export function GrievanceDetailScreen({ route }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;
  const g = route?.params?.grievance;

  if (!g) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40 }}>Case not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.id, { color: colors.textSecondary }]}>{g.id}</Text>
        <Text style={[styles.category, { color: colors.text }]}>{g.issueCategory || 'Grievance'}</Text>

        <Card>
          <DetailItem label="Status" value={g.status || 'N/A'} colors={colors} />
          <DetailItem label="Step" value={g.step || 'N/A'} colors={colors} />
          <DetailItem label="Filed" value={g.filed ? new Date(g.filed).toLocaleDateString() : 'N/A'} colors={colors} />
          <DetailItem label="Deadline" value={g.deadline ? new Date(g.deadline).toLocaleDateString() : 'N/A'} colors={colors} />
          <DetailItem label="Steward" value={g.steward || 'N/A'} colors={colors} />
        </Card>

        {g.notes && (
          <Card>
            <Text style={[styles.notesLabel, { color: colors.text }]}>Notes</Text>
            <Text style={[styles.notes, { color: colors.textSecondary }]}>{g.notes}</Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

function DetailItem({ label, value, colors }: { label: string; value: string; colors: Record<string, string> }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  id: { fontSize: 14, fontWeight: '600' },
  category: { fontSize: 22, fontWeight: '700' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '500' },
  notesLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  notes: { fontSize: 14, lineHeight: 20 },
});
