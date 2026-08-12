import { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';

export type AppLinearGradientPoint = {
  readonly x: number;
  readonly y: number;
};

export type AppLinearGradientProps = {
  readonly colors: readonly string[];
  readonly locations?: readonly number[];
  readonly start?: AppLinearGradientPoint;
  readonly end?: AppLinearGradientPoint;
  readonly style?: StyleProp<ViewStyle>;
  readonly pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
  readonly testID?: string;
};

type GradientStop = {
  readonly offset: string;
  readonly color: string;
  readonly opacity: number;
};

/** Exported for unit tests — keep transparent → opacity 0 behaviour. */
export function resolveStops(colors: readonly string[], locations?: readonly number[]): GradientStop[] {
  const lastIndex = Math.max(colors.length - 1, 1);
  return colors.map((color, index) => {
    const offset = `${(locations?.[index] ?? index / lastIndex) * 100}%`;
    const trimmed = color.trim();

    // SVG stopColor="transparent" with stopOpacity=1 paints as black on Android.
    // Always map the CSS keyword to a zero-opacity stop.
    if (trimmed.toLowerCase() === 'transparent') {
      return {
        offset,
        color: 'rgb(0, 0, 0)',
        opacity: 0,
      };
    }

    const rgbaMatch = /^rgba?\(([^)]+)\)$/i.exec(trimmed);
    if (rgbaMatch) {
      const parts = rgbaMatch[1].split(',').map((part) => part.trim());
      if (parts.length === 4) {
        return {
          offset,
          color: `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`,
          opacity: Number.parseFloat(parts[3]),
        };
      }
      if (parts.length === 3) {
        return {
          offset,
          color: `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`,
          opacity: 1,
        };
      }
    }

    return {
      offset,
      color: trimmed,
      opacity: 1,
    };
  });
}

/**
 * Drop-in gradient overlay that uses react-native-svg (already in the dev client)
 * instead of expo-linear-gradient (requires a native rebuild when missing).
 */
export function AppLinearGradient({
  colors,
  locations,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  style,
  pointerEvents = 'auto',
  testID,
}: AppLinearGradientProps) {
  const gradientId = useId().replace(/:/g, '');
  const stops = resolveStops(colors, locations);

  return (
    <View style={style} pointerEvents={pointerEvents} testID={testID}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <SvgLinearGradient
            id={gradientId}
            x1={`${start.x * 100}%`}
            y1={`${start.y * 100}%`}
            x2={`${end.x * 100}%`}
            y2={`${end.y * 100}%`}
          >
            {stops.map((stop, index) => (
              <Stop
                key={`${stop.offset}-${index}`}
                offset={stop.offset}
                stopColor={stop.color}
                stopOpacity={stop.opacity}
              />
            ))}
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
}
