// ============================================================================
// ErrorBoundary - Catches React render crashes
// Supports both light and dark mode via Appearance API (class components
// cannot use hooks, so we read the system color scheme directly).
// ============================================================================

import React, { Component, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Appearance, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightColors, darkColors } from '../theme/colors';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const isDark = Appearance.getColorScheme() === 'dark';
      const colors = isDark ? darkColors : lightColors;

      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Ionicons name="warning-outline" size={64} color={colors.error} />
          <Text style={[styles.title, { color: colors.text }]}>Something Went Wrong</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            The app encountered an unexpected error. Please try again.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={[styles.errorDetail, { color: colors.error, backgroundColor: isDark ? '#3c1111' : '#fce4ec' }]} numberOfLines={5}>
              {this.state.error.message}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={this.handleRetry}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '700' },
  message: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  errorDetail: { fontSize: 12, fontFamily: 'monospace', textAlign: 'center', marginTop: 8, padding: 12, borderRadius: 8, overflow: 'hidden' },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 12 },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
