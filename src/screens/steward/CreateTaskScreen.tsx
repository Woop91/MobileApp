// ============================================================================
// CreateTaskScreen - Create a new steward task
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme';
import { Button, Card } from '../../components';
import { api } from '../../api';

const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];

interface Props {
  route?: { params?: { memberEmail?: string; memberName?: string } };
  navigation: { goBack: () => void };
}

export function CreateTaskScreen({ route, navigation }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [memberEmail, setMemberEmail] = useState(route?.params?.memberEmail || '');
  const [priority, setPriority] = useState('Normal');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a task title.');
      return;
    }

    setSubmitting(true);
    try {
      const idemKey = `TASK_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const result = await api.createTask(
        title.trim(),
        description.trim(),
        memberEmail.trim(),
        priority.toLowerCase(),
        dueDate.trim(),
        undefined,
        idemKey,
      );
      if (result.success) {
        Alert.alert('Task Created', 'Your task has been created.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', result.message || 'Failed to create task.');
      }
    } catch {
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Task Details</Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Title</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              value={title}
              onChangeText={setTitle}
              placeholder="What needs to be done?"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Description (optional)</Text>
            <TextInput
              style={[styles.textArea, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Additional details..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Related Member Email (optional)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              value={memberEmail}
              onChangeText={setMemberEmail}
              placeholder="member@example.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Due Date (optional, YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="2026-04-15"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Priority</Text>
            <View style={styles.chipRow}>
              {PRIORITIES.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, { backgroundColor: priority === p ? colors.primary : colors.inputBackground, borderColor: priority === p ? colors.primary : colors.border }]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={{ color: priority === p ? colors.textOnPrimary : colors.text, fontSize: 13, fontWeight: '500' }}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        <Button title="Create Task" onPress={handleSubmit} loading={submitting} fullWidth size="lg" />
      </View>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  field: { gap: 6, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '500' },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  textArea: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, minHeight: 80 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
});
