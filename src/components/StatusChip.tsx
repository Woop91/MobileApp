// ============================================================================
// StatusChip - Animated grievance/task status indicator
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme, useFadeIn } from '../theme';

interface StatusChipProps {
  status: string;
  size?: 'sm' | 'md';
}

const STATUS_MAP: Record<string, { colorKey: string; label?: string }> = {
  open: { colorKey: 'statusActive' },
  active: { colorKey: 'statusActive' },
  'in progress': { colorKey: 'statusActive' },
  'step i': { colorKey: 'statusActive' },
  'step ii': { colorKey: 'statusDueSoon' },
  'step iii': { colorKey: 'statusDueSoon' },
  arbitration: { colorKey: 'statusOverdue' },
  overdue: { colorKey: 'statusOverdue' },
  closed: { colorKey: 'statusResolved' },
  resolved: { colorKey: 'statusResolved' },
  won: { colorKey: 'success' },
  denied: { colorKey: 'error' },
  settled: { colorKey: 'statusResolved' },
  withdrawn: { colorKey: 'textSecondary' },
  pending: { colorKey: 'warning' },
  completed: { colorKey: 'statusResolved' },
};

export function StatusChip({ status, size = 'md' }: StatusChipProps) {
  const { theme } = useTheme();
  const fadeStyle = useFadeIn(0, 250);
  const key = status.toLowerCase().trim();
  const mapped = STATUS_MAP[key] || { colorKey: 'textSecondary' };
  const color = (theme.colors as Record<string, string>)[mapped.colorKey] || theme.colors.textSecondary;

  const paddingV = size === 'sm' ? 3 : 6;
  const paddingH = size === 'sm' ? 10 : 14;
  const fontSize = size === 'sm' ? 11 : 13;

  return (
    <Animated.View style={fadeStyle}>
      <View style={[styles.chip, { backgroundColor: color + '18', paddingVertical: paddingV, paddingHorizontal: paddingH }]}>
        <View style={[styles.dot, { backgroundColor: color, shadowColor: color }]} />
        <Text style={[styles.label, { color, fontSize }]}>
          {mapped.label || status}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 100,
    gap: 6,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
