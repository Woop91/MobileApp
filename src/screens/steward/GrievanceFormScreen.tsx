// ============================================================================
// GrievanceFormScreen - File a new grievance case
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors, useTheme } from '../../theme';
import { Button, Card, LoadingScreen } from '../../components';
import { AttachmentPicker } from '../../components/AttachmentPicker';
import { api } from '../../api';
import { smartSubmit } from '../../utils/offlineQueue';
import type { GrievanceFormOptions } from '../../types';
import type { PickedImage } from '../../utils/imagePicker';

interface Props {
  route?: { params?: { memberEmail?: string; memberName?: string } };
  navigation: { goBack: () => void };
}

export function GrievanceFormScreen({ route, navigation }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;

  const [options, setOptions] = useState<GrievanceFormOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [memberEmail, setMemberEmail] = useState(route?.params?.memberEmail || '');
  const [memberName, setMemberName] = useState(route?.params?.memberName || '');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [step, setStep] = useState('Step I');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<PickedImage[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  useEffect(() => { loadOptions(); }, []);

  async function loadOptions() {
    try {
      const result = await api.getGrievanceFormOptions();
      if (result.success && result.data) setOptions(result.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!memberEmail.trim()) {
      Alert.alert('Required', 'Please enter the member email.');
      return;
    }
    if (!category) {
      Alert.alert('Required', 'Please select an issue category.');
      return;
    }

    Alert.alert('File Grievance', `File a ${category} grievance for ${memberName || memberEmail}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'File',
        onPress: async () => {
          setSubmitting(true);
          try {
            const idemKey = `GR_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const attachmentData = attachments
              .filter(a => a.base64)
              .map(a => ({ fileName: a.fileName, mimeType: a.type, base64: a.base64 }));
            const result = await smartSubmit('dataInitiateGrievance', {
              data: {
                memberEmail: memberEmail.trim().toLowerCase(),
                issueCategory: category,
                priority,
                step,
                notes: notes.trim(),
                attachments: attachmentData.length > 0 ? attachmentData : undefined,
              },
              idemKey,
            });

            if (result.submitted) {
              const grievanceId = (result.data as { grievanceId?: string })?.grievanceId || '';
              Alert.alert('Grievance Filed', `Case ${grievanceId} has been created.`, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } else if (result.queued) {
              Alert.alert('Saved Offline', 'You appear to be offline. The grievance will be filed automatically when you reconnect.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } else {
              Alert.alert('Error', 'Failed to file grievance.');
            }
          } catch {
            Alert.alert('Error', 'Failed to file grievance. Please try again.');
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  }

  if (loading) return <LoadingScreen message="Loading form..." />;

  const categories = options?.categories || ['Contract Violation', 'Discipline', 'Working Conditions', 'Harassment', 'Safety', 'Other'];
  const priorities = options?.priorities || ['Low', 'Normal', 'High', 'Urgent'];
  const steps = options?.steps || ['Step I', 'Step II', 'Step III'];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>File New Grievance</Text>

        {/* Member */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Grievant</Text>
          <FormField label="Member Email" colors={colors}>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              value={memberEmail}
              onChangeText={setMemberEmail}
              placeholder="member@example.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </FormField>
          <FormField label="Member Name (optional)" colors={colors}>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              value={memberName}
              onChangeText={setMemberName}
              placeholder="First Last"
              placeholderTextColor={colors.textSecondary}
            />
          </FormField>
        </Card>

        {/* Case Details */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Case Details</Text>

          {/* Category Picker */}
          <FormField label="Issue Category" colors={colors}>
            <TouchableOpacity
              style={[styles.pickerBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={[styles.pickerText, { color: category ? colors.text : colors.textSecondary }]}>
                {category || 'Select category...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {showCategoryPicker && (
              <View style={[styles.pickerDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {categories.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.pickerOption, category === c && { backgroundColor: colors.primary + '15' }]}
                    onPress={() => { setCategory(c); setShowCategoryPicker(false); }}
                  >
                    <Text style={[styles.pickerOptionText, { color: category === c ? colors.primary : colors.text }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </FormField>

          {/* Priority */}
          <FormField label="Priority" colors={colors}>
            <View style={styles.chipRow}>
              {priorities.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, { backgroundColor: priority === p ? colors.primary : colors.inputBackground, borderColor: priority === p ? colors.primary : colors.border }]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={{ color: priority === p ? colors.textOnPrimary : colors.text, fontSize: 13, fontWeight: '500' }}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormField>

          {/* Step */}
          <FormField label="Starting Step" colors={colors}>
            <View style={styles.chipRow}>
              {steps.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, { backgroundColor: step === s ? colors.primary : colors.inputBackground, borderColor: step === s ? colors.primary : colors.border }]}
                  onPress={() => setStep(s)}
                >
                  <Text style={{ color: step === s ? colors.textOnPrimary : colors.text, fontSize: 13, fontWeight: '500' }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormField>
        </Card>

        {/* Notes */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Describe the grievance, including relevant dates, witnesses, and contract articles..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </Card>

        {/* Attachments */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Supporting Documents</Text>
          <AttachmentPicker
            attachments={attachments}
            onAdd={(img) => setAttachments(prev => [...prev, img])}
            onRemove={(idx) => setAttachments(prev => prev.filter((_, i) => i !== idx))}
          />
        </Card>

        <Button title="File Grievance" onPress={handleSubmit} loading={submitting} fullWidth size="lg" />

        <View style={{ height: 32 }} />
      </View>
    </ScrollView>
  );
}

function FormField({ label, colors, children }: { label: string; colors: ThemeColors; children: React.ReactNode }) {
  return (
    <View style={fieldStyles.container}>
      <Text style={[fieldStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  container: { gap: 6, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  textArea: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, minHeight: 120 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 10, padding: 12 },
  pickerText: { fontSize: 15 },
  pickerDropdown: { borderWidth: 1, borderRadius: 10, marginTop: 4, overflow: 'hidden' },
  pickerOption: { padding: 12 },
  pickerOptionText: { fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
});
