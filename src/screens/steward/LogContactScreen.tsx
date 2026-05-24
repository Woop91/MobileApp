// ============================================================================
// LogContactScreen - Log a member contact interaction
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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Button, Card } from '../../components';
import { api } from '../../api';
import { smartSubmit } from '../../utils/offlineQueue';
import type { MemberRecord } from '../../types';

const CONTACT_TYPES = ['Phone Call', 'In Person', 'Email', 'Text/Chat', 'Virtual Meeting', 'Other'];
const DURATIONS = ['< 5 min', '5-15 min', '15-30 min', '30-60 min', '> 1 hour'];

interface Props {
  route: { params: { member: MemberRecord } };
  navigation: { goBack: () => void };
}

export function LogContactScreen({ route, navigation }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;
  const { member } = route.params;

  const [type, setType] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!type) {
      Alert.alert('Required', 'Please select a contact type.');
      return;
    }
    if (!notes.trim()) {
      Alert.alert('Required', 'Please add notes about the interaction.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await smartSubmit('dataLogMemberContact', {
        memberEmail: member.email,
        type,
        notes: notes.trim(),
        duration: duration || undefined,
        memberName: `${member.firstName} ${member.lastName}`,
      });
      if (result.submitted) {
        Alert.alert('Logged', 'Contact logged successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else if (result.queued) {
        Alert.alert('Saved Offline', 'Contact log will be submitted when you reconnect.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to log contact.');
      }
    } catch {
      Alert.alert('Error', 'Failed to log contact. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {/* Member Info */}
        <Card>
          <View style={styles.memberRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {(member.firstName?.[0] || '') + (member.lastName?.[0] || '')}
              </Text>
            </View>
            <View>
              <Text style={[styles.memberName, { color: colors.text }]}>
                {member.firstName} {member.lastName}
              </Text>
              <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>{member.email}</Text>
            </View>
          </View>
        </Card>

        {/* Contact Type */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Type</Text>
          <View style={styles.chipRow}>
            {CONTACT_TYPES.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, { backgroundColor: type === t ? colors.primary : colors.inputBackground, borderColor: type === t ? colors.primary : colors.border }]}
                onPress={() => setType(t)}
              >
                <Text style={{ color: type === t ? colors.textOnPrimary : colors.text, fontSize: 13, fontWeight: '500' }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Duration */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Duration</Text>
          <View style={styles.chipRow}>
            {DURATIONS.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.chip, { backgroundColor: duration === d ? colors.primary : colors.inputBackground, borderColor: duration === d ? colors.primary : colors.border }]}
                onPress={() => setDuration(d)}
              >
                <Text style={{ color: duration === d ? colors.textOnPrimary : colors.text, fontSize: 13, fontWeight: '500' }}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Notes */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="What was discussed? Any follow-up needed?"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </Card>

        <Button title="Log Contact" onPress={handleSubmit} loading={submitting} fullWidth size="lg" />
      </View>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  memberName: { fontSize: 17, fontWeight: '600' },
  memberEmail: { fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  textArea: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, minHeight: 100 },
});
