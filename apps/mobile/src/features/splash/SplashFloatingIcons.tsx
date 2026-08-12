import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { motion, semanticColors } from '../../theme';

type FloatingSpec = {
  readonly id: string;
  readonly top: number;
  readonly left?: number;
  readonly right?: number;
  readonly size: number;
  readonly delay: number;
  readonly kind: 'heart' | 'cross' | 'shield' | 'pulse' | 'care';
};

const FLOATING_SPECS: readonly FloatingSpec[] = [
  { id: 'heart', top: 72, left: 28, size: 34, delay: 0, kind: 'heart' },
  { id: 'cross', top: 120, right: 36, size: 30, delay: 180, kind: 'cross' },
  { id: 'shield', top: 220, left: 48, size: 28, delay: 320, kind: 'shield' },
  { id: 'pulse', top: 280, right: 52, size: 32, delay: 120, kind: 'pulse' },
  { id: 'care', top: 360, left: 24, size: 26, delay: 260, kind: 'care' },
];

function FloatingGlyph({
  kind,
  size,
}: {
  readonly kind: FloatingSpec['kind'];
  readonly size: number;
}) {
  const stroke = semanticColors.action.primary;
  const fill = semanticColors.surface.muted;

  if (kind === 'heart') {
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32" accessible={false}>
        <Path
          d="M16 27 C10 22 4 17 4 11 C4 7 7 4 11 4 C13.5 4 15.5 5.5 16 7 C16.5 5.5 18.5 4 21 4 C25 4 28 7 28 11 C28 17 22 22 16 27 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={1.5}
        />
      </Svg>
    );
  }

  if (kind === 'cross') {
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32" accessible={false}>
        <Circle cx="16" cy="16" r="14" fill={fill} stroke={stroke} strokeWidth={1.5} />
        <Path
          d="M16 9 V23 M9 16 H23"
          stroke={stroke}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  if (kind === 'shield') {
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32" accessible={false}>
        <Path
          d="M16 4 L26 8 V15 C26 22 21 26 16 28 C11 26 6 22 6 15 V8 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (kind === 'pulse') {
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32" accessible={false}>
        <Path
          d="M4 16 H9 L12 10 L16 22 L19 16 H28"
          fill="none"
          stroke={stroke}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessible={false}>
      <Circle cx="16" cy="11" r="5" fill={fill} stroke={stroke} strokeWidth={1.5} />
      <Path
        d="M8 27 C8 21 11 18 16 18 C21 18 24 21 24 27"
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function FloatingIcon({ spec }: { readonly spec: FloatingSpec }) {
  const drift = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0.22)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    let cancelled = false;

    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) {
        return;
      }

      if (reduceMotion) {
        fade.setValue(0.18);
        drift.setValue(0);
        return;
      }

      animation = Animated.loop(
        Animated.sequence([
          Animated.delay(spec.delay),
          Animated.parallel([
            Animated.timing(drift, {
              toValue: -10,
              duration: motion.duration.slow,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(fade, {
              toValue: 0.34,
              duration: motion.duration.slow,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(drift, {
              toValue: 8,
              duration: motion.duration.slow,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(fade, {
              toValue: 0.16,
              duration: motion.duration.slow,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
      animation.start();
    });

    return () => {
      cancelled = true;
      animation?.stop();
    };
  }, [drift, fade, spec.delay]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.icon,
        {
          top: spec.top,
          left: spec.left,
          right: spec.right,
          opacity: fade,
          transform: [{ translateY: drift }],
        },
      ]}
    >
      <FloatingGlyph kind={spec.kind} size={spec.size} />
    </Animated.View>
  );
}

/** Ambient health-themed glyphs that drift behind the splash mark. */
export function SplashFloatingIcons() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden>
      {FLOATING_SPECS.map((spec) => (
        <FloatingIcon key={spec.id} spec={spec} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    position: 'absolute',
  },
});
