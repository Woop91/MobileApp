// ============================================================================
// Skeleton - Shimmer loading placeholders
// ============================================================================

import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme, useShimmer } from '../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const { theme } = useTheme();
  const shimmerStyle = useShimmer();

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: theme.colors.skeleton,
        },
        shimmerStyle,
        style,
      ]}
    />
  );
}

/** Card-shaped skeleton placeholder */
export function SkeletonCard() {
  const { theme } = useTheme();

  return (
    <View style={[skStyles.card, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
      <View style={skStyles.row}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={skStyles.textGroup}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      <Skeleton width="100%" height={12} />
      <Skeleton width="75%" height={12} />
    </View>
  );
}

/** KPI card skeleton */
export function SkeletonKPI() {
  const { theme } = useTheme();

  return (
    <View style={[skStyles.kpi, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
      <Skeleton width={48} height={48} borderRadius={14} />
      <Skeleton width={60} height={28} borderRadius={6} />
      <Skeleton width={80} height={12} />
    </View>
  );
}

/** List of skeleton cards */
export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={skStyles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

/** Dashboard skeleton layout */
export function SkeletonDashboard() {
  return (
    <View style={skStyles.dashboard}>
      <View style={skStyles.kpiRow}>
        <SkeletonKPI />
        <SkeletonKPI />
      </View>
      <View style={skStyles.kpiRow}>
        <SkeletonKPI />
        <SkeletonKPI />
      </View>
      <Skeleton width="30%" height={18} style={{ marginTop: 8 }} />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

const skStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  textGroup: { flex: 1, gap: 6 },
  kpi: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  kpiRow: { flexDirection: 'row', gap: 12 },
  list: { gap: 10 },
  dashboard: { padding: 16, gap: 12 },
});
