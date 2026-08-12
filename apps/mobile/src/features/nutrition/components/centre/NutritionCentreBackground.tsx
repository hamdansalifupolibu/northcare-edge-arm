import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';

import { colors, useReducedMotion } from '../../../../theme';
import { useThemeMode } from '../../../../theme/ThemeModeProvider';

/**
 * Pure-RN background (no expo-linear-gradient) so older dev builds on emulator/device
 * still render without a native rebuild.
 */
export function NutritionCentreBackground() {
  const { width, height } = useWindowDimensions();
  const { isDark } = useThemeMode();
  const reduceMotion = useReducedMotion();
  const orbOpacity = useRef(new Animated.Value(0.14)).current;

  useEffect(() => {
    if (reduceMotion) {
      orbOpacity.setValue(0.16);
      return;
    }
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(orbOpacity, {
          toValue: 0.22,
          duration: 5500,
          useNativeDriver: true,
        }),
        Animated.timing(orbOpacity, {
          toValue: 0.1,
          duration: 5500,
          useNativeDriver: true,
        }),
      ]),
    );
    breathe.start();
    return () => breathe.stop();
  }, [orbOpacity, reduceMotion]);

  const baseColor = isDark ? '#0F1715' : colors.background;
  const washTop = isDark ? '#115E59' : '#E6F7F5';
  const washAccent = isDark ? '#17120A' : '#FEF3C7';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="nutrition-centre-background">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: baseColor }]} />
      <View
        style={[
          styles.wash,
          {
            backgroundColor: washAccent,
            top: 0,
            left: 0,
            width: width * 0.85,
            height: height * 0.45,
            opacity: isDark ? 0.35 : 0.55,
          },
        ]}
      />
      <View
        style={[
          styles.wash,
          {
            backgroundColor: washTop,
            bottom: 0,
            right: 0,
            width: width * 0.9,
            height: height * 0.5,
            opacity: isDark ? 0.4 : 0.65,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: width * 0.7,
            height: width * 0.7,
            top: height * 0.08,
            right: -width * 0.2,
            backgroundColor: colors.accent,
            opacity: orbOpacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: width * 0.55,
            height: width * 0.55,
            bottom: height * 0.12,
            left: -width * 0.15,
            backgroundColor: colors.primary,
            opacity: orbOpacity,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wash: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
});
