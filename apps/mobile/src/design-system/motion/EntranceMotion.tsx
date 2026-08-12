import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

import { motion, useReducedMotion } from '../../theme';

export type EntranceMotionProps = {
  readonly children: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

/**
 * Short fade/slide entrance. Skips animation when reduce-motion is enabled.
 * Critical content must remain readable without motion.
 */
export function EntranceMotion({ children, style, testID }: EntranceMotionProps) {
  const reduceMotion = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(1));
  const [translateY] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }
    opacity.setValue(0);
    translateY.setValue(motion.distance.entrance);
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: motion.duration.standard,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: motion.duration.standard,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => {
      animation.stop();
    };
  }, [opacity, reduceMotion, translateY]);

  return (
    <Animated.View
      testID={testID}
      style={[style, { opacity, transform: [{ translateY }] }]}
    >
      {children}
    </Animated.View>
  );
}
