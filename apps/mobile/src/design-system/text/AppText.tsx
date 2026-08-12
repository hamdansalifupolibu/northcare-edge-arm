import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { typography } from '../../theme';
import { useThemeMode } from '../../theme/ThemeModeProvider';
import { getAppTextColor, type AppTextColor } from './appTextColors';

export type AppTextVariant = keyof typeof typography.styles;
export type { AppTextColor };

export type AppTextProps = Omit<TextProps, 'style'> & {
  readonly variant?: AppTextVariant;
  readonly color?: AppTextColor;
  readonly align?: TextStyle['textAlign'];
  readonly style?: StyleProp<TextStyle>;
  readonly testID?: string;
};

/**
 * Semantic text primitive. Font scaling remains enabled.
 */
export function AppText({
  variant = 'body',
  color = 'primary',
  align,
  style,
  children,
  allowFontScaling = true,
  testID,
  ...rest
}: AppTextProps) {
  const { semantic } = useThemeMode();
  const token = typography.styles[variant];

  return (
    <Text
      {...rest}
      testID={testID}
      allowFontScaling={allowFontScaling}
      style={[
        {
          fontFamily: token.fontFamily,
          fontSize: token.fontSize,
          lineHeight: token.lineHeight,
          fontWeight: token.fontWeight,
          letterSpacing: token.letterSpacing,
          color: getAppTextColor(color, semantic),
          textAlign: align,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
