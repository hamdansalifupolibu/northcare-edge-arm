import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { motion, semanticColors } from '../../../theme';

type DecorSpec = {
  readonly id: string;
  readonly top?: number;
  readonly bottom?: number;
  readonly left?: number;
  readonly right?: number;
  readonly size: number;
  readonly delay: number;
  readonly kind: 'leaf' | 'heart' | 'cross' | 'shield' | 'pulse';
  readonly rotation?: string;
};

const DECOR_SPECS: readonly DecorSpec[] = [
  { id: 'leaf-tr', top: 48, right: -8, size: 88, delay: 0, kind: 'leaf', rotation: '18deg' },
  { id: 'leaf-bl', bottom: 120, left: -18, size: 96, delay: 220, kind: 'leaf', rotation: '-24deg' },
  { id: 'heart', top: 180, left: 20, size: 28, delay: 80, kind: 'heart' },
  { id: 'cross', top: 260, right: 24, size: 26, delay: 160, kind: 'cross' },
  { id: 'shield', bottom: 220, right: 36, size: 30, delay: 300, kind: 'shield' },
  { id: 'pulse', top: 340, left: 36, size: 32, delay: 120, kind: 'pulse' },
];

function DecorGlyph({
  kind,
  size,
}: {
  readonly kind: DecorSpec['kind'];
  readonly size: number;
}) {
  const stroke = semanticColors.action.primary;
  const fill = semanticColors.surface.muted;

  if (kind === 'leaf') {
    return (
      <Svg width={size} height={size} viewBox="0 0 64 64" accessible={false}>
        <Path
          d="M32 6 C18 18 10 34 12 52 C24 44 40 38 52 24 C44 12 38 8 32 6 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={1.4}
          opacity={0.85}
        />
        <Path
          d="M32 6 V52"
          stroke={stroke}
          strokeWidth={1.2}
          strokeLinecap="round"
          opacity={0.55}
        />
      </Svg>
    );
  }

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
        <Path d="M16 9 V23 M9 16 H23" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
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

function AnimatedDecor({ spec }: { readonly spec: DecorSpec }) {
  const drift = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0.14)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    let cancelled = false;

    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) {
        return;
      }

      if (reduceMotion) {
        fade.setValue(0.16);
        return;
      }

      animation = Animated.loop(
        Animated.sequence([
          Animated.delay(spec.delay),
          Animated.parallel([
            Animated.timing(drift, {
              toValue: -8,
              duration: motion.duration.slow,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(fade, {
              toValue: 0.28,
              duration: motion.duration.slow,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(drift, {
              toValue: 6,
              duration: motion.duration.slow,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(fade, {
              toValue: 0.12,
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
        styles.decor,
        {
          top: spec.top,
          bottom: spec.bottom,
          left: spec.left,
          right: spec.right,
          opacity: fade,
          transform: [{ translateY: drift }, { rotate: spec.rotation ?? '0deg' }],
        },
      ]}
    >
      <DecorGlyph kind={spec.kind} size={spec.size} />
    </Animated.View>
  );
}

/** Soft leaf accents and drifting health glyphs behind workspace selection. */
export function WorkspaceAmbientDecor() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden>
      {DECOR_SPECS.map((spec) => (
        <AnimatedDecor key={spec.id} spec={spec} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  decor: {
    position: 'absolute',
  },
});
