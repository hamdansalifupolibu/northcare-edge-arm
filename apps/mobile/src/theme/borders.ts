import { StyleSheet } from 'react-native';

import type { BorderTokens } from './theme.types';

export const borders = {
  widthHairline: StyleSheet.hairlineWidth,
  widthThin: 1,
  widthMedium: 2,
  widthThick: 3,
} as const satisfies BorderTokens;
