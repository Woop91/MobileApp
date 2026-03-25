// ============================================================================
// CaseDetailScreen - Animated case view with gradient header and PDF export
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useFadeIn, useSlideUp, useStaggerItem } from '../../theme';
import { Card, StatusChip, Button, GradientHeader } from '../../components';
import { api } from '../../api';
import { hapticLight, hapticSuccess } from '../../utils/haptics';
import { exportCasePDF } from '../../utils/pdfExport';
import { addDeadlineEvent } from '../../utils/calendar';
import type { GrievanceCase } from '../../types';

interface Props {
  route: { params: { caseId: string; caseData?: GrievanceCase } };
}

export function CaseDetailScreen({ route }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;
  const { caseId, caseData } = route?.params ?? {} as Props['route']['params'];

  const [caseInfo] = useState<GrievanceCase | null>(caseData || null);
  const [activityLog, setActivityLog] = useState<Array<Record<string, unknown>>>([]);
  const [checklist, setChecklist] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState<string | null>(null);

  const headerAnim = useFadeIn(0, 400);
  const detailsAnim = useSlideUp(200, 30);
  const notesAnim = useSlideUp(350, 30);
  const activityAnim = useSlideUp(500, 30);

  useEffect(() => { if (caseId) loadDetails(); }, [caseId]);

  async function loadDetails() {
    setError(null);
    try {
      const [actResult, checkResult] = await Promise.all([
        api.getCaseActivityLog(caseId),
        api.getCaseChecklist(caseId),
      ]);
      if (actResult.success && actResult.data) setActivityLog(actResult.data as Array<Record<string, unknown>>);
      if (checkResult.success && checkResult.data) setChecklist(checkResult.data as Array<Record<string, unknown>>);
    } catch {
      setError('Failed to load case details.');
    }
  }

  if (!caseInfo) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40 }}>
          {error || 'Case not found'}
        </Text>
        {error && (
          <TouchableOpacity onPress={loadDetails} style={{ marginTop: 16, padding: 12 }} accessibilityRole="button" accessibilityLabel="Retry loading case">
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Tap to retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const isOverdue = caseInfo.deadline && new Date(caseInfo.deadline) < new Date();

  async function handleAddToCalendar() {
    if (!caseInfo?.deadline) return;
    const eventId = await addDeadlineEvent({
      caseId: caseInfo.id,
      title: `${caseInfo.issueCategory || 'Grievance'} - ${caseInfo.memberFirstName} ${caseInfo.memberLastName}`,
      deadline: new Date(caseInfo.deadline),
      notes: caseInfo.notes,
    });
    if (eventId) {
      hapticSuccess();
      Alert.alert('Added', 'Deadline added to your calendar with reminders.');
    }
  }

  async function handleExportPDF() {
    hapticLight();
    const ok = await exportCasePDF(caseInfo!);
    if (ok) hapticSuccess();
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Gradient Header */}
      <Animated.View style={headerAnim}>
        <GradientHeader style={styles.header}>
          <Text style={[styles.caseId, { color: 'rgba(255,255,255,0.7)' }]}>{caseInfo.id}</Text>
          <Text style={[styles.memberName, { color: colors.textOnPrimary }]}>
            {caseInfo.memberFirstName} {caseInfo.memberLastName}
          </Text>
          <View style={styles.headerChips}>
            <StatusChip status={caseInfo.status} />
            {caseInfo.step && <StatusChip status={caseInfo.step} />}
          </View>
        </GradientHeader>
      </Animated.View>

      <View style={styles.content}>
        {/* Action buttons */}
        <Animated.View style={[styles.actionRow, detailsAnim]}>
          {caseInfo.deadline && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleAddToCalendar}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.primary }]}>Calendar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleExportPDF}>
            <Ionicons name="document-text" size={20} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.primary }]}>Export PDF</Text>
          </TouchableOpacity>
          {caseInfo.driveFolderUrl && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => Linking.openURL(caseInfo.driveFolderUrl!)}>
              <Ionicons name="folder-open" size={20} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.primary }]}>Folder</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Key Info */}
        <Animated.View style={detailsAnim}>
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Case Details</Text>
            <View style={styles.detailGrid}>
              <DetailRow icon="folder" label="Category" value={caseInfo.issueCategory || 'N/A'} colors={colors} />
              <DetailRow icon="flag" label="Priority" value={caseInfo.priority || 'Normal'} colors={colors} />
              <DetailRow icon="calendar" label="Filed" value={caseInfo.filed ? new Date(caseInfo.filed).toLocaleDateString() : 'N/A'} colors={colors} />
              <DetailRow icon="alarm" label="Deadline" value={caseInfo.deadline ? new Date(caseInfo.deadline).toLocaleDateString() : 'N/A'} colors={colors} highlight={isOverdue ? colors.error : undefined} />
              <DetailRow icon="person" label="Steward" value={caseInfo.steward || 'Unassigned'} colors={colors} />
              <DetailRow icon="business" label="Unit" value={caseInfo.unit || 'N/A'} colors={colors} />
            </View>
          </Card>
        </Animated.View>

        {/* Notes */}
        {caseInfo.notes && (
          <Animated.View style={notesAnim}>
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
              <Text style={[styles.notes, { color: colors.textSecondary }]}>{caseInfo.notes}</Text>
            </Card>
          </Animated.View>
        )}

        {/* Resolution */}
        {caseInfo.resolution && (
          <Animated.View style={notesAnim}>
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Resolution</Text>
              <Text style={[styles.notes, { color: colors.textSecondary }]}>{caseInfo.resolution}</Text>
              {caseInfo.dateClosed && (
                <Text style={[styles.closedDate, { color: colors.textSecondary }]}>
                  Closed: {new Date(caseInfo.dateClosed).toLocaleDateString()}
                </Text>
              )}
            </Card>
          </Animated.View>
        )}

        {/* Checklist */}
        {checklist.length > 0 && (
          <Animated.View style={activityAnim}>
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Checklist</Text>
              {checklist.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.checkItem}
                  onPress={async () => {
                    hapticLight();
                    const id = item.id as string;
                    const completed = !(item.completed as boolean);
                    // Optimistic update
                    setChecklist(prev => prev.map((c, j) => j === i ? { ...c, completed } : c));
                    try {
                      const result = await api.toggleChecklistItem(id, completed);
                      if (!result.success) {
                        // Rollback on failure
                        setChecklist(prev => prev.map((c, j) => j === i ? { ...c, completed: !completed } : c));
                        Alert.alert('Error', 'Could not update checklist item.');
                      }
                    } catch {
                      setChecklist(prev => prev.map((c, j) => j === i ? { ...c, completed: !completed } : c));
                    }
                  }}
                >
                  <Ionicons name={item.completed ? 'checkbox' : 'square-outline'} size={22} color={item.completed ? colors.success : colors.textSecondary} />
                  <Text style={[styles.checkText, { color: colors.text }, item.completed && styles.checkTextDone]}>{item.text as string}</Text>
                </TouchableOpacity>
              ))}
            </Card>
          </Animated.View>
        )}

        {/* Activity Log */}
        {activityLog.length > 0 && (
          <Animated.View style={activityAnim}>
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Activity</Text>
              {activityLog.map((entry, i) => (
                <ActivityItem key={i} entry={entry} index={i} colors={colors} isLast={i === activityLog.length - 1} />
              ))}
            </Card>
          </Animated.View>
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function ActivityItem({ entry, index, colors, isLast }: { entry: Record<string, unknown>; index: number; colors: Record<string, string>; isLast: boolean }) {
  const staggerStyle = useStaggerItem(index, 50);

  return (
    <Animated.View style={[styles.activityItem, staggerStyle]}>
      <View style={styles.activityTimeline}>
        <View style={[styles.activityDot, { backgroundColor: colors.primary }]} />
        {!isLast && <View style={[styles.activityLine, { backgroundColor: colors.border }]} />}
      </View>
      <View style={styles.activityContent}>
        <Text style={[styles.activityText, { color: colors.text }]}>{entry.description as string}</Text>
        <Text style={[styles.activityDate, { color: colors.textSecondary }]}>{entry.date as string}</Text>
      </View>
    </Animated.View>
  );
}

function DetailRow({ icon, label, value, colors, highlight }: {
  icon: string; label: string; value: string; colors: Record<string, string>; highlight?: string;
}) {
  return (
    <View style={detailStyles.row}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={highlight || colors.textSecondary} />
      <Text style={[detailStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[detailStyles.value, { color: highlight || colors.text }]}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  label: { fontSize: 13, width: 80 },
  value: { fontSize: 14, fontWeight: '500', flex: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, gap: 6 },
  caseId: { fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  memberName: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  headerChips: { flexDirection: 'row', gap: 8, marginTop: 8 },
  content: { padding: 16, gap: 16 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  actionLabel: { fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, letterSpacing: -0.3 },
  detailGrid: { gap: 2 },
  notes: { fontSize: 14, lineHeight: 21 },
  closedDate: { fontSize: 12, marginTop: 8 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  checkText: { fontSize: 14, flex: 1 },
  checkTextDone: { textDecorationLine: 'line-through', opacity: 0.6 },
  activityItem: { flexDirection: 'row', gap: 12, minHeight: 48 },
  activityTimeline: { alignItems: 'center', width: 20 },
  activityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  activityLine: { width: 2, flex: 1, marginTop: 4 },
  activityContent: { flex: 1, gap: 2, paddingBottom: 12 },
  activityText: { fontSize: 14 },
  activityDate: { fontSize: 12 },
});
