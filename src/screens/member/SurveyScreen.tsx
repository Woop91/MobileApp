// ============================================================================
// SurveyScreen - Member satisfaction survey
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
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
import { Button, Card, EmptyState, LoadingScreen } from '../../components';
import { api } from '../../api';

export function SurveyScreen() {
  const { theme } = useTheme();
  const { colors } = theme;

  const [status, setStatus] = useState<{ available: boolean; completed: boolean } | null>(null);
  const [questions, setQuestions] = useState<Array<Record<string, unknown>>>([]);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { loadSurvey(); }, []);

  async function loadSurvey() {
    try {
      const [statusResult, qResult] = await Promise.all([
        api.getSurveyStatus(),
        api.getSurveyQuestions(),
      ]);
      if (statusResult.success && statusResult.data) setStatus(statusResult.data);
      if (qResult.success && qResult.data) setQuestions(qResult.data as Array<Record<string, unknown>>);
    } finally {
      setLoading(false);
    }
  }

  function handleRating(questionId: string, rating: number) {
    setResponses(prev => ({ ...prev, [questionId]: rating }));
  }

  function handleText(questionId: string, text: string) {
    setResponses(prev => ({ ...prev, [questionId]: text }));
  }

  async function handleSubmit() {
    // Check all required questions answered
    const unanswered = questions.filter(q => q.required && !responses[q.id as string]);
    if (unanswered.length > 0) {
      Alert.alert('Incomplete', `Please answer all required questions. ${unanswered.length} remaining.`);
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.submitSurveyResponse(responses);
      if (result.success) {
        setSubmitted(true);
      } else {
        Alert.alert('Error', result.message || 'Failed to submit survey.');
      }
    } catch {
      Alert.alert('Error', 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingScreen message="Loading survey..." />;

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="checkmark-circle"
          title="Thank You!"
          message="Your survey response has been submitted. Your feedback helps improve our union."
        />
      </View>
    );
  }

  if (status?.completed) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="checkmark-done-circle"
          title="Already Completed"
          message="You've already submitted your response for this survey period. Thank you!"
        />
      </View>
    );
  }

  if (!status?.available || questions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="clipboard-outline"
          title="No Active Survey"
          message="There's no survey available right now. Check back later."
        />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Member Satisfaction Survey</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your responses are anonymous and help us improve.
        </Text>

        {questions.map((q, idx) => {
          const qId = (q.id || String(idx)) as string;
          const qText = q.text as string;
          const qType = (q.type || 'rating') as string;
          const required = q.required as boolean;

          return (
            <Card key={qId}>
              <Text style={[styles.questionText, { color: colors.text }]}>
                {idx + 1}. {qText} {required && <Text style={{ color: colors.error }}>*</Text>}
              </Text>

              {qType === 'rating' && (
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity key={star} onPress={() => handleRating(qId, star)} style={styles.starBtn}>
                      <Ionicons
                        name={(responses[qId] as number) >= star ? 'star' : 'star-outline'}
                        size={36}
                        color={(responses[qId] as number) >= star ? '#f9a825' : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {qType === 'text' && (
                <TextInput
                  style={[styles.textInput, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                  value={(responses[qId] as string) || ''}
                  onChangeText={text => handleText(qId, text)}
                  placeholder="Your response..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              )}

              {qType === 'yes_no' && (
                <View style={styles.yesNoRow}>
                  {['Yes', 'No'].map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.yesNoBtn, { backgroundColor: responses[qId] === opt ? colors.primary : colors.inputBackground, borderColor: responses[qId] === opt ? colors.primary : colors.border }]}
                      onPress={() => handleText(qId, opt)}
                    >
                      <Text style={{ color: responses[qId] === opt ? colors.textOnPrimary : colors.text, fontSize: 15, fontWeight: '600' }}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {qType === 'multiple_choice' && (q.options as string[] || []).map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.mcOption, { borderColor: responses[qId] === opt ? colors.primary : colors.border, backgroundColor: responses[qId] === opt ? colors.primary + '10' : 'transparent' }]}
                  onPress={() => handleText(qId, opt)}
                >
                  <Ionicons
                    name={responses[qId] === opt ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={responses[qId] === opt ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.mcText, { color: colors.text }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </Card>
          );
        })}

        <Button title="Submit Survey" onPress={handleSubmit} loading={submitting} fullWidth size="lg" />
        <View style={{ height: 32 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 14, lineHeight: 20 },
  questionText: { fontSize: 16, fontWeight: '500', lineHeight: 22, marginBottom: 12 },
  ratingRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  starBtn: { padding: 4 },
  textInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, minHeight: 70 },
  yesNoRow: { flexDirection: 'row', gap: 12 },
  yesNoBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 10, borderWidth: 1 },
  mcOption: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderRadius: 10, marginBottom: 8 },
  mcText: { fontSize: 15 },
});
