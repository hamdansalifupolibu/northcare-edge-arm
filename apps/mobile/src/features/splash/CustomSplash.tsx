import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';

import { NorthCareLogo } from '../../design-system';
import { AppText } from '../../design-system/text/AppText';
import { useTranslation } from '../../i18n/LanguageProvider';
import { motion, spacing } from '../../theme';
import { StartupShell } from './StartupShell';

export type CustomSplashProps = {
  readonly onFinished: () => void;
  readonly message?: string;
  /** Returning users skip promotional pulse. */
  readonly shortened?: boolean;
  readonly testID?: string;
};

/**
 * Calm custom splash with a brief ambient pulse before the logo appears.
 */
export function CustomSplash({
  onFinished,
  message,
  shortened = false,
  testID = 'custom-splash',
}: CustomSplashProps) {
  const t = useTranslation();
  const resolvedMessage = message ?? t.splash.preparing;
  const [logoOpacity] = useState(() => new Animated.Value(0));
  const [logoScale] = useState(() => new Animated.Value(0.92));
  const [nameOpacity] = useState(() => new Animated.Value(0));
  const [nameTranslateY] = useState(() => new Animated.Value(motion.distance.entrance));
  const finishedRef = useRef(false);

  useEffect(() => {
    finishedRef.current = false;
    let cancelled = false;
    let reduceMotionTimer: ReturnType<typeof setTimeout> | undefined;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = (): void => {
      if (cancelled || finishedRef.current) {
        return;
      }
      finishedRef.current = true;
      onFinished();
    };

    fallbackTimer = setTimeout(finish, 6000);

    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) {
        return;
      }

      if (reduceMotion) {
        logoOpacity.setValue(1);
        logoScale.setValue(1);
        nameOpacity.setValue(1);
        nameTranslateY.setValue(0);
        reduceMotionTimer = setTimeout(finish, motion.duration.fast);
        return;
      }

      const logoEntrance = Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: motion.duration.standard,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: motion.duration.emphasised,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

      const copyEntrance = Animated.parallel([
        Animated.timing(nameOpacity, {
          toValue: 1,
          duration: motion.duration.standard,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(nameTranslateY, {
          toValue: 0,
          duration: motion.duration.standard,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

      const pulse = shortened
        ? Animated.delay(motion.duration.fast)
        : Animated.sequence([
            Animated.timing(logoScale, {
              toValue: 1.02,
              duration: motion.duration.standard,
              useNativeDriver: true,
            }),
            Animated.timing(logoScale, {
              toValue: 1,
              duration: motion.duration.standard,
              useNativeDriver: true,
            }),
          ]);

      Animated.sequence([
        Animated.delay(motion.duration.fast),
        logoEntrance,
        copyEntrance,
        pulse,
        Animated.delay(motion.duration.fast),
      ]).start(({ finished }) => {
        if (finished) {
          finish();
        }
      });
    });

    return () => {
      cancelled = true;
      if (reduceMotionTimer) {
        clearTimeout(reduceMotionTimer);
      }
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
    };
  }, [
    logoOpacity,
    logoScale,
    nameOpacity,
    nameTranslateY,
    onFinished,
    shortened,
  ]);

  return (
    <StartupShell testID={testID}>
      <View style={styles.stage} accessibilityRole="progressbar">
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
          <NorthCareLogo variant="symbol" size="xl" testID="splash-logo" />
        </Animated.View>
        <Animated.View
          style={[
            styles.copy,
            {
              opacity: nameOpacity,
              transform: [{ translateY: nameTranslateY }],
            },
          ]}
        >
          <AppText variant="headingLarge" color="primary" align="center">
            {t.splash.productName}
          </AppText>
          <AppText variant="body" color="secondary" align="center">
            {t.splash.tagline}
          </AppText>
          <AppText variant="caption" color="secondary" align="center" style={styles.message}>
            {resolvedMessage}
          </AppText>
        </Animated.View>
      </View>
    </StartupShell>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  copy: {
    marginTop: spacing.xl,
    gap: spacing.sm,
    alignItems: 'center',
  },
  message: {
    marginTop: spacing.md,
  },
});
