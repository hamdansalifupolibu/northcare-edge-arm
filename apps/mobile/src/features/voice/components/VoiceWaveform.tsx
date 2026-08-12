import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';

import { colors, semanticColors, spacing } from '../../../theme';
import { useVoiceStrings } from '../hooks/useVoiceStrings';

type VoiceWaveformProps = {
  readonly active: boolean;
  readonly level?: number;
  readonly immersive?: boolean;
  readonly testID?: string;
};

/**
 * Audio waveform driven by local microphone metering — no fake transcription.
 */
export function VoiceWaveform({
  active,
  level = 0.15,
  immersive = false,
  testID = 'voice-waveform',
}: VoiceWaveformProps) {
  const voiceStrings = useVoiceStrings();
  const anims = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;

  const barColors = immersive
    ? [
        semanticColors.text.inverse,
        colors.primary,
        semanticColors.status.info,
        colors.accent,
        semanticColors.text.inverse,
        colors.primaryDark,
        semanticColors.status.info,
      ]
    : [
        colors.primary,
        colors.primaryDark,
        semanticColors.status.info,
        colors.accent,
        colors.primary,
        colors.primaryDark,
        semanticColors.status.info,
      ];

  useEffect(() => {
    if (!active) {
      const animations = anims.map((anim) =>
        Animated.timing(anim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      );
      Animated.parallel(animations).start();
      return undefined;
    }

    const listeners = anims.map((anim, index) => {
      let isCancelled = false;

      const runAnim = () => {
        if (isCancelled || !active) {
          return;
        }

        const base = level < 0.05 ? 0.02 : Math.max(0.02, Math.min(1.0, level));
        const waveFactors = [0.9, 1.4, 1.8, 1.5, 1.2, 0.9, 0.6];
        const multiplier = waveFactors[index % waveFactors.length]!;
        const variance = 0.7 + Math.random() * 0.5;
        const targetValue = Math.min(1.0, base * multiplier * variance);

        Animated.timing(anim, {
          toValue: targetValue,
          duration: 80 + Math.random() * 80,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          if (!isCancelled && active) {
            runAnim();
          }
        });
      };

      runAnim();

      return () => {
        isCancelled = true;
      };
    });

    return () => {
      for (const cancel of listeners) {
        cancel();
      }
    };
  }, [active, level, anims]);

  return (
    <View
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={voiceStrings.accessibilityWaveform}
      style={[
        styles.container,
        immersive ? styles.containerImmersive : null,
      ]}
    >
      {anims.map((anim, index) => {
        const color = barColors[index % barColors.length]!;
        return (
          <Animated.View
            key={`bar-${index}`}
            style={[
              styles.bar,
              {
                backgroundColor: color,
                opacity: active ? 0.95 : 0.4,
                transform: [
                  {
                    scaleY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.15, 1.8],
                    }),
                  },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs * 1.5,
    height: 120,
    backgroundColor: semanticColors.surface.muted,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
  },
  containerImmersive: {
    backgroundColor: colors.primaryDark,
  },
  bar: {
    width: 8,
    height: 48,
    borderRadius: 4,
  },
});
