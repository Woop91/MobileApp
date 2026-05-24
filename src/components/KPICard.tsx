// ============================================================================
// KPICard - Animated Key Performance Indicator display card
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useScaleIn } from '../theme';

interface KPICardProps {
  label: string;
  value: number | string;
  icon: string;
  color?: string;
  trend?: 'up' | 'down' | 'flat';
  subtitle?: string;
  delay?: number;
}

export function KPICard({ label, value, icon, color, trend, subtitle, delay = 0 }: KPICardProps) {
  const { theme } = useTheme();
  const scaleStyle = useScaleIn(delay);
  const iconColor = color || theme.colors.primary;

  const numericValue = typeof value === 'number' ? value : parseInt(String(value), 10);
  const isNumeric = !isNaN(numericValue);
  const displayValue = isNumeric ? String(Math.round(numericValue)) : String(value);

  return (
    <Animated.View style={[scaleStyle, styles.container]}>
      <View style={[styles.card, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border, shadowColor: iconColor }]}>
        <View style={[styles.iconWrap, { backgroundColor: iconColor + '15' }]}>
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={26} color={iconColor} />
        </View>
        <Text style={[styles.value, { color: theme.colors.text }]}>{displayValue}</Text>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
        {subtitle && (
          <View style={styles.subtitleRow}>
            {trend && (
              <Ionicons
                name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'}
                size={14}
                color={trend === 'up' ? theme.colors.success : trend === 'down' ? theme.colors.error : theme.colors.textSecondary}
              />
            )}
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 8,
    minWidth: 100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subtitle: {
    fontSize: 11,
  },
});
