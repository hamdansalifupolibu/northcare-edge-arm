import type { SemanticColors } from '../../theme/theme.types';

export type AppTextColor =
  | 'primary'
  | 'secondary'
  | 'inverse'
  | 'disabled'
  | 'urgent'
  | 'warning'
  | 'stable'
  | 'info'
  | 'action';

export function getAppTextColor(color: AppTextColor, semantic: SemanticColors): string {
  switch (color) {
    case 'primary':
      return semantic.text.primary;
    case 'secondary':
      return semantic.text.secondary;
    case 'inverse':
      return semantic.text.inverse;
    case 'disabled':
      return semantic.text.disabled;
    case 'urgent':
      return semantic.status.urgent;
    case 'warning':
      return semantic.status.warning;
    case 'stable':
      return semantic.status.stable;
    case 'info':
      return semantic.status.info;
    case 'action':
      return semantic.action.primary;
    default:
      return semantic.text.primary;
  }
}
