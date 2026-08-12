import React, { useEffect, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system';
import { radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';

export function ChatTypingIndicator() {
  const { colors } = useThemeMode();
  const dots = useMemo(
    () => [new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)] as const,
    [],
  );

  const [dot0, dot1, dot2] = dots;

  useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 150),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [dots]);

  const dotStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
    ],
  });

  return (
    <View
      style={styles.row}
      accessibilityRole="text"
      accessibilityLabel="NorthCare AI is generating a response"
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <AppText variant="caption" color="inverse" style={styles.avatarText}>
          NC
        </AppText>
      </View>
      <View style={[styles.bubble, { backgroundColor: colors.mutedSurface }]}>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { backgroundColor: colors.primary }, dotStyle(dot0)]} />
          <Animated.View style={[styles.dot, { backgroundColor: colors.primary }, dotStyle(dot1)]} />
          <Animated.View style={[styles.dot, { backgroundColor: colors.primary }, dotStyle(dot2)]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginTop: spacing.xs,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bubble: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radii.lg,
    borderBottomLeftRadius: radii.none,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
