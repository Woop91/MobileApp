// ============================================================================
// SetupScreen - First-time setup to configure API URL
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Button } from '../../components';
import { setApiBaseUrl } from '../../api/config';
import { saveApiUrl } from '../../auth/session';

interface SetupScreenProps {
  onComplete: () => void;
}

export function SetupScreen({ onComplete }: SetupScreenProps) {
  const { theme } = useTheme();
  const { colors } = theme;

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    const trimmed = url.trim();
    if (!trimmed.startsWith('https://script.google.com/')) {
      Alert.alert('Invalid URL', 'Please enter a valid Google Apps Script web app URL.');
      return;
    }

    setLoading(true);
    try {
      // Test the connection
      setApiBaseUrl(trimmed);
      const response = await fetch(trimmed, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping' }),
      });
      if (response.ok) {
        await saveApiUrl(trimmed);
        onComplete();
      } else {
        Alert.alert('Connection Failed', 'Could not connect to the dashboard. Check the URL and try again.');
      }
    } catch {
      Alert.alert('Connection Failed', 'Could not reach the server. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Ionicons name="link-outline" size={64} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Connect Your Dashboard</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter the web app URL provided by your dashboard administrator.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Dashboard URL</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              placeholder="https://script.google.com/macros/s/.../exec"
              placeholderTextColor={colors.textSecondary}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          <Button title="Connect" onPress={handleConnect} loading={loading} fullWidth size="lg" />

          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            Ask your chief steward or admin for the dashboard URL. It starts with https://script.google.com/
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  content: { padding: 24, alignItems: 'center', gap: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  inputGroup: { width: '100%', gap: 6 },
  label: { fontSize: 14, fontWeight: '500' },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, width: '100%' },
  helpText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
