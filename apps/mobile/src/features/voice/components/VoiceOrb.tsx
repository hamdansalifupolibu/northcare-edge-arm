import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system';
import { colors, motion, radii, semanticColors } from '../../../theme';
import { useReducedMotion } from '../../../theme/useReducedMotion';

export type VoiceOrbMode =
  | 'idle'
  | 'listening'
  | 'paused'
  | 'processing'
  | 'saved';

/** Visual + motion profile while processing — speech model vs NorthCare AI analysis. */
export type VoiceOrbProcessingVariant = 'speech' | 'analysis' | 'save';

type VoiceOrbProps = {
  readonly mode: VoiceOrbMode;
  /** Normalised microphone level 0..1 */
  readonly level?: number;
  /** 0–100 shown in the orb centre while processing */
  readonly progressPercent?: number;
  readonly processingVariant?: VoiceOrbProcessingVariant;
  readonly size?: number;
  readonly testID?: string;
};

const SPEECH_LAYERS = [
  colors.primary,
  colors.primaryDark,
  semanticColors.status.info,
  colors.primary,
] as const;

const ANALYSIS_LAYERS = [
  colors.primaryDarker,
  colors.accent,
  colors.primaryDark,
  semanticColors.status.info,
] as const;

/**
 * NorthCare Voice Orb — organic animated circle reacting to local mic amplitude.
 */
export function VoiceOrb({
  mode,
  level = 0.12,
  progressPercent,
  processingVariant = 'speech',
  size = 200,
  testID = 'voice-orb',
}: VoiceOrbProps) {
  const reducedMotion = useReducedMotion();
  const breathe = useRef(new Animated.Value(0)).current;
  const amplitude = useRef(new Animated.Value(0.12)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;

  const isAnalysisProcessing = mode === 'processing' && processingVariant === 'analysis';
  const layerColors = isAnalysisProcessing ? ANALYSIS_LAYERS : SPEECH_LAYERS;
  const glowColor = isAnalysisProcessing ? colors.accent : colors.primary;

  useEffect(() => {
    if (reducedMotion) {
      breathe.setValue(0.5);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: (isAnalysisProcessing ? motion.duration.slow * 2.2 : motion.duration.slow * 3),
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: (isAnalysisProcessing ? motion.duration.slow * 2.2 : motion.duration.slow * 3),
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe, reducedMotion, isAnalysisProcessing]);

  useEffect(() => {
    const target =
      mode === 'listening'
        ? Math.max(0.08, Math.min(1, level))
        : mode === 'paused'
          ? 0.06
          : mode === 'processing'
            ? isAnalysisProcessing
              ? 0.14
              : 0.18
            : mode === 'saved'
              ? 0.1
              : 0.12;
    Animated.timing(amplitude, {
      toValue: target,
      duration: reducedMotion ? 0 : motion.duration.standard,
      useNativeDriver: true,
    }).start();
  }, [amplitude, isAnalysisProcessing, level, mode, reducedMotion]);

  useEffect(() => {
    if (mode !== 'processing' || reducedMotion) {
      spin.setValue(0);
      orbit.setValue(0);
      return undefined;
    }
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: isAnalysisProcessing ? 6000 : 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spinLoop.start();

    let orbitLoop: Animated.CompositeAnimation | undefined;
    if (isAnalysisProcessing) {
      orbitLoop = Animated.loop(
        Animated.timing(orbit, {
          toValue: 1,
          duration: 3200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      orbitLoop.start();
    }

    return () => {
      spinLoop.stop();
      orbitLoop?.stop();
    };
  }, [isAnalysisProcessing, mode, orbit, reducedMotion, spin]);

  const outerScale = Animated.add(
    1,
    Animated.multiply(
      amplitude,
      mode === 'listening' ? 0.22 : mode === 'idle' ? 0.06 : 0.04,
    ),
  );
  const glowOpacity = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: isAnalysisProcessing ? [0.45, 0.85] : [0.35, 0.7],
  });
  const innerPulse = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: isAnalysisProcessing ? [0.94, 1.06] : [0.92, 1.04],
  });
  const spinDeg = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const orbitDeg = orbit.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const displayProgress =
    mode === 'processing' && progressPercent != null
      ? Math.max(0, Math.min(100, Math.round(progressPercent)))
      : null;

  return (
    <View
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel={
        mode === 'listening'
          ? 'Voice orb listening'
          : mode === 'paused'
            ? 'Voice orb paused'
            : mode === 'processing'
              ? isAnalysisProcessing
                ? 'NorthCare AI analysis in progress'
                : 'Speech transcription in progress'
              : mode === 'saved'
                ? 'Recording saved'
                : 'Voice orb ready'
      }
      style={[styles.container, { width: size, height: size }]}
    >
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.15,
            height: size * 1.15,
            borderRadius: size,
            opacity: glowOpacity,
            backgroundColor: glowColor,
            transform: [{ scale: outerScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.core,
          {
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: size,
            transform: [{ scale: innerPulse }],
            backgroundColor: isAnalysisProcessing ? colors.primaryDarker : colors.primaryDark,
          },
        ]}
      >
        {layerColors.map((layerColor, index) => (
          <View
            key={`${layerColor}-${index}`}
            style={[
              styles.layer,
              {
                backgroundColor: layerColor,
                opacity: 0.16 + index * 0.1,
                transform: [{ scale: 1 - index * 0.12 }],
              },
            ]}
          />
        ))}
      </Animated.View>

      {mode === 'processing' && isAnalysisProcessing ? (
        <>
          <Animated.View
            style={[
              styles.analysisRingOuter,
              {
                width: size * 0.9,
                height: size * 0.9,
                borderRadius: size,
                transform: [{ rotate: spinDeg }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.analysisOrbit,
              {
                width: size * 0.96,
                height: size * 0.96,
                transform: [{ rotate: orbitDeg }],
              },
            ]}
          >
            {[0, 90, 180, 270].map((angle) => (
              <View
                key={angle}
                style={[
                  styles.analysisNode,
                  {
                    transform: [
                      { rotate: `${angle}deg` },
                      { translateY: -(size * 0.46) },
                    ],
                  },
                ]}
              />
            ))}
          </Animated.View>
        </>
      ) : null}

      {mode === 'processing' && !isAnalysisProcessing ? (
        <Animated.View
          style={[
            styles.speechRing,
            {
              width: size * 0.88,
              height: size * 0.88,
              borderRadius: size,
              transform: [{ rotate: spinDeg }],
            },
          ]}
        />
      ) : null}

      {displayProgress != null ? (
        <View style={styles.progressCenter} pointerEvents="none">
          <AppText variant="title" color="inverse" style={styles.progressText}>
            {displayProgress}%
          </AppText>
        </View>
      ) : null}

      {mode === 'saved' ? (
        <View style={styles.savedBadge}>
          <AppText variant="title" color="stable" style={styles.savedGlyph}>
            ✓
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  core: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.pill,
  },
  speechRing: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: semanticColors.text.inverse,
    opacity: 0.55,
  },
  analysisRingOuter: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: colors.accent,
    opacity: 0.85,
  },
  analysisOrbit: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisNode: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentLight,
  },
  progressCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  savedBadge: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: semanticColors.status.stableBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedGlyph: {
    fontSize: 28,
    lineHeight: 32,
  },
});
