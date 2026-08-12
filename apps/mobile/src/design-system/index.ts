/**
 * NorthCare AI design-system public surface.
 * Lives in apps/mobile for reliable Expo Metro resolution (Stage 3).
 * See docs/architecture/DESIGN_SYSTEM_LOCATION_DECISION.md.
 */

export { AppImage } from './brand/AppImage';
export { HeroImage } from './brand/HeroImage';
export { NorthCareLogo } from './brand/NorthCareLogo';
export type { NorthCareLogoProps, NorthCareLogoSize, NorthCareLogoVariant } from './brand/NorthCareLogo';

export { AppButton } from './buttons/AppButton';
export type { AppButtonProps, AppButtonSize, AppButtonVariant } from './buttons/AppButton';
export { IconButton } from './buttons/IconButton';
export type { IconButtonProps } from './buttons/IconButton';

export { AppCard } from './cards/AppCard';
export type { AppCardProps } from './cards/AppCard';
export { PressableCard } from './cards/PressableCard';
export type { PressableCardProps } from './cards/PressableCard';

export { AppTextInput } from './forms/AppTextInput';
export type { AppTextInputProps } from './forms/AppTextInput';
export { PasswordField } from './forms/PasswordField';
export type { PasswordFieldProps } from './forms/PasswordField';
export { EntranceMotion } from './motion/EntranceMotion';
export type { EntranceMotionProps } from './motion/EntranceMotion';
export { CheckboxField } from './forms/CheckboxField';
export type { CheckboxFieldProps } from './forms/CheckboxField';
export { FormErrorText } from './forms/FormErrorText';
export { FormHelperText } from './forms/FormHelperText';
export { FormLabel } from './forms/FormLabel';
export { SearchInput } from './forms/SearchInput';

export { AppHeader } from './headers/AppHeader';
export type { AppHeaderProps } from './headers/AppHeader';
export { BackButton } from './headers/BackButton';
export { ScreenTitle } from './headers/ScreenTitle';
export { SectionHeader } from './headers/SectionHeader';

export { AppScreen } from './layout/AppScreen';
export type { AppScreenProps } from './layout/AppScreen';
export { ContentStack } from './layout/ContentStack';
export { Divider } from './layout/Divider';
export { ScreenSection } from './layout/ScreenSection';
export { ScrollableAppScreen } from './layout/ScrollableAppScreen';
export { useKeyboardBottomInset } from './hooks/useKeyboardBottomInset';

export { ConnectivityBanner } from './offline/ConnectivityBanner';
export { LocalSaveConfirmation } from './offline/LocalSaveConfirmation';
export { OfflineNotice } from './offline/OfflineNotice';
export { SYNC_COPY } from './offline/syncCopy';
export type { SyncPresentationStatus } from './offline/syncCopy';
export { SyncStatusIndicator } from './offline/SyncStatusIndicator';

export { DesignSystemPreviewScreen } from './preview/DesignSystemPreviewScreen';

export { RiskBadge } from './risk/RiskBadge';
export { RiskIcon } from './risk/RiskIcon';
export { RISK_COPY } from './risk/riskLabels';
export type { RiskLevel } from './risk/riskLabels';
export { RiskSummaryCard } from './risk/RiskSummaryCard';

export { AppActivityIndicator } from './states/AppActivityIndicator';
export { AppStateView } from './states/AppStateView';
export type { AppStateVariant, AppStateViewProps } from './states/AppStateView';
export { LoadingState } from './states/LoadingState';

export { CountBadge } from './status/CountBadge';
export { StatusChip } from './status/StatusChip';
export type { StatusChipTone } from './status/StatusChip';

export { AppText } from './text/AppText';
export type { AppTextColor, AppTextProps, AppTextVariant } from './text/AppText';
