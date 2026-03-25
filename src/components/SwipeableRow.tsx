// ============================================================================
// SwipeableRow - Swipe-to-action for list items
// ============================================================================

import React, { type ReactNode, useRef } from 'react';
import { View, Text, StyleSheet, Animated as RNAnimated } from 'react-native';
import { Swipeable, type SwipeableProps } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { hapticMedium } from '../utils/haptics';

interface SwipeAction {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}

interface SwipeableRowProps {
  children: ReactNode;
  rightActions?: SwipeAction[];
  leftAction?: SwipeAction;
  onSwipeOpen?: () => void;
}

export function SwipeableRow({ children, rightActions = [], leftAction, onSwipeOpen }: SwipeableRowProps) {
  const { theme } = useTheme();
  const swipeRef = useRef<Swipeable>(null);

  function close() {
    swipeRef.current?.close();
  }

  function renderRightActions(progress: RNAnimated.AnimatedInterpolation<number>) {
    if (rightActions.length === 0) return null;

    return (
      <View style={styles.rightContainer}>
        {rightActions.map((action, index) => {
          const trans = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [80 * (rightActions.length - index), 0],
          });

          return (
            <RNAnimated.View
              key={action.label}
              style={[styles.actionBtn, { backgroundColor: action.color, transform: [{ translateX: trans }] }]}
            >
              <View
                style={styles.actionContent}
                onTouchEnd={() => {
                  hapticMedium();
                  action.onPress();
                  close();
                }}
              >
                <Ionicons name={action.icon as keyof typeof Ionicons.glyphMap} size={22} color="#fff" />
                <Text style={styles.actionLabel}>{action.label}</Text>
              </View>
            </RNAnimated.View>
          );
        })}
      </View>
    );
  }

  function renderLeftActions(progress: RNAnimated.AnimatedInterpolation<number>) {
    if (!leftAction) return null;

    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [-80, 0],
    });

    return (
      <RNAnimated.View style={[styles.leftAction, { backgroundColor: leftAction.color, transform: [{ translateX: trans }] }]}>
        <View
          style={styles.actionContent}
          onTouchEnd={() => {
            hapticMedium();
            leftAction.onPress();
            close();
          }}
        >
          <Ionicons name={leftAction.icon as keyof typeof Ionicons.glyphMap} size={22} color="#fff" />
          <Text style={styles.actionLabel}>{leftAction.label}</Text>
        </View>
      </RNAnimated.View>
    );
  }

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={rightActions.length > 0 ? renderRightActions : undefined}
      renderLeftActions={leftAction ? renderLeftActions : undefined}
      onSwipeableOpen={() => { hapticMedium(); onSwipeOpen?.(); }}
      friction={2}
      overshootRight={false}
      overshootLeft={false}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  rightContainer: { flexDirection: 'row' },
  actionBtn: { justifyContent: 'center', width: 80 },
  actionContent: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: 4 },
  actionLabel: { color: '#fff', fontSize: 11, fontWeight: '600' },
  leftAction: { justifyContent: 'center', width: 80, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
});
