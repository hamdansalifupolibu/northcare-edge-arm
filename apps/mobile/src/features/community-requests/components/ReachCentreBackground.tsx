import { AppLinearGradient } from '../../../design-system/layout/AppLinearGradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, motion, useReducedMotion } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';

type Props = {
  readonly focusPulseKey?: number;
};

export function ReachCentreBackground({ focusPulseKey = 0 }: Props) {
  const { width, height } = useWindowDimensions();
  const { isDark } = useThemeMode();
  const reduceMotion = useReducedMotion();
  const orbOpacity = useRef(new Animated.Value(0.16)).current;
  const rippleScale = useRef(new Animated.Value(0.6)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const [showRipple, setShowRipple] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      orbOpacity.setValue(0.18);
      return;
    }
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(orbOpacity, {
          toValue: 0.24,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(orbOpacity, {
          toValue: 0.12,
          duration: 5000,
          useNativeDriver: true,
        }),
      ]),
    );
    breathe.start();
    return () => breathe.stop();
  }, [orbOpacity, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || focusPulseKey === 0) {
      return;
    }
    setShowRipple(true);
    rippleScale.setValue(0.6);
    rippleOpacity.setValue(0.35);
    const animation = Animated.parallel([
      Animated.timing(rippleScale, {
        toValue: 1.4,
        duration: motion.duration.slow,
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: motion.duration.slow,
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished) {
        setShowRipple(false);
      }
    });
    return () => animation.stop();
  }, [focusPulseKey, reduceMotion, rippleOpacity, rippleScale]);

  const gradientColors = isDark
    ? (['#0F1715', '#115E59', '#0F1715'] as const)
    : (['#E6F7F5', colors.background, colors.background] as const);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="reach-centre-background">
      <AppLinearGradient
        colors={[...gradientColors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.orbPrimary, { opacity: orbOpacity }]}>
        <Svg width={width * 0.9} height={width * 0.9} viewBox="0 0 200 200">
          <Circle cx={100} cy={100} r={90} fill={colors.primary} fillOpacity={0.22} />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.orbAccent, { opacity: orbOpacity }]}>
        <Svg width={width * 0.55} height={width * 0.55} viewBox="0 0 200 200">
          <Circle cx={100} cy={100} r={90} fill={colors.accent} fillOpacity={0.12} />
        </Svg>
      </Animated.View>
      {showRipple ? (
        <Animated.View
          style={[
            styles.ripple,
            {
              top: height * 0.12,
              left: width * 0.5 - 80,
              opacity: rippleOpacity,
              transform: [{ scale: rippleScale }],
            },
          ]}
        >
          <Svg width={160} height={160} viewBox="0 0 160 160">
            <Circle
              cx={80}
              cy={80}
              r={70}
              fill="none"
              stroke={colors.primary}
              strokeWidth={1.5}
              strokeOpacity={0.45}
            />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  orbPrimary: {
    position: 'absolute',
    top: -40,
    right: -60,
  },
  orbAccent: {
    position: 'absolute',
    bottom: 120,
    left: -40,
  },
  ripple: {
    position: 'absolute',
    width: 160,
    height: 160,
  },
});
