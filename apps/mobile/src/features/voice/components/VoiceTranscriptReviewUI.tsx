import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppText, StatusChip } from '../../../design-system';
import { colors, radii, spacing, typography } from '../../../theme';
import type { SemanticColors } from '../../../theme/theme.types';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useVoiceStrings } from '../hooks/useVoiceStrings';

export const TRANSCRIPT_MAX_CHARS = 2000;

const HOW_IT_WORKS_DISMISS_KEY = '@northcare/voice-transcript-how-it-works-dismissed';

export function clientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

export function formatAudioTimestamp(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

type VoiceTranscriptClientCardProps = {
  readonly clientName: string;
  readonly categoryLabel: string;
  readonly onChange?: () => void;
  readonly testID?: string;
};

export function VoiceTranscriptClientCard({
  clientName,
  categoryLabel,
  onChange,
  testID = 'voice-transcript-client',
}: VoiceTranscriptClientCardProps) {
  const voiceStrings = useVoiceStrings();
  const styles = useVoiceTranscriptReviewStyles();
  const initials = clientInitials(clientName);

  return (
    <View testID={testID} style={styles.clientCard}>
      <View style={styles.clientAvatar}>
        <AppText variant="label" color="inverse" style={styles.clientAvatarText}>
          {initials}
        </AppText>
      </View>
      <View style={styles.clientTextBlock}>
        <AppText variant="label">{clientName}</AppText>
        <AppText variant="caption" color="secondary">
          {categoryLabel}
        </AppText>
      </View>
      {onChange ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={voiceStrings.changeClient}
          onPress={onChange}
          testID={`${testID}-change`}
          style={({ pressed }) => [styles.clientChange, pressed ? styles.pressed : null]}
        >
          <AppText variant="caption" color="action" style={styles.clientChangeIcon}>
            ✎
          </AppText>
          <AppText variant="label" color="action">
            {voiceStrings.changeClient}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function VoiceTranscriptSectionHeader() {
  const voiceStrings = useVoiceStrings();
  const styles = useVoiceTranscriptReviewStyles();

  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconWrap}>
        <View style={styles.sectionBubble}>
          <View style={styles.sectionBubbleTail} />
        </View>
      </View>
      <View style={styles.sectionTextBlock}>
        <AppText variant="title">{voiceStrings.transcriptTitle}</AppText>
        <AppText variant="body" color="secondary">
          {voiceStrings.transcriptReviewSubtitle}
        </AppText>
      </View>
    </View>
  );
}

type VoiceTranscriptAudioBarProps = {
  readonly isPlaying: boolean;
  readonly durationMs: number;
  readonly onTogglePlayback: () => void;
  readonly testID?: string;
};

function StaticPlaybackWaveform() {
  const styles = useVoiceTranscriptReviewStyles();
  const heights = [10, 16, 22, 14, 26, 18, 24, 12, 20];
  return (
    <View style={styles.playbackWaveform}>
      {heights.map((height, index) => (
        <View
          key={index}
          style={[
            styles.playbackWaveBar,
            {
              height,
              opacity: 0.45 + (index % 3) * 0.15,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function VoiceTranscriptAudioBar({
  isPlaying,
  durationMs,
  onTogglePlayback,
  testID = 'voice-transcript-audio',
}: VoiceTranscriptAudioBarProps) {
  const voiceStrings = useVoiceStrings();
  const styles = useVoiceTranscriptReviewStyles();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={
        isPlaying ? voiceStrings.pauseRecordingAudio : voiceStrings.playRecordingAudio
      }
      onPress={onTogglePlayback}
      style={({ pressed }) => [styles.audioBar, pressed ? styles.pressed : null]}
    >
      <View style={styles.audioPlayCircle}>
        <AppText variant="label" color="inverse" style={styles.audioPlayGlyph}>
          {isPlaying ? '❚❚' : '▶'}
        </AppText>
      </View>
      <AppText variant="label" color="primary" style={styles.audioLabel} numberOfLines={1}>
        {isPlaying ? voiceStrings.pauseRecordingAudio : voiceStrings.playRecordingAudio}
      </AppText>
      <StaticPlaybackWaveform />
      <AppText variant="label" color="primary" style={styles.audioDuration}>
        {formatAudioTimestamp(durationMs)}
      </AppText>
    </Pressable>
  );
}

export function VoiceTranscriptHowItWorks() {
  const voiceStrings = useVoiceStrings();
  const styles = useVoiceTranscriptReviewStyles();
  const [visible, setVisible] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const dismissed = await AsyncStorage.getItem(HOW_IT_WORKS_DISMISS_KEY);
        if (dismissed === '1') {
          setVisible(false);
        }
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const dismiss = useCallback(async () => {
    setVisible(false);
    try {
      await AsyncStorage.setItem(HOW_IT_WORKS_DISMISS_KEY, '1');
    } catch {
      // Non-fatal — callout stays dismissed for this session.
    }
  }, []);

  if (!loaded || !visible) {
    return null;
  }

  return (
    <View style={styles.howItWorks} testID="voice-transcript-how-it-works">
      <View style={styles.howItWorksIconWrap}>
        <AppText variant="label" style={styles.howItWorksIcon}>
          ✨
        </AppText>
      </View>
      <View style={styles.howItWorksBody}>
        <AppText variant="label" color="primary">
          {voiceStrings.howItWorksTitle}
        </AppText>
        <AppText variant="caption" color="secondary" style={styles.howItWorksText}>
          {voiceStrings.howItWorksBody}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        onPress={() => void dismiss()}
        hitSlop={8}
        style={({ pressed }) => [styles.howItWorksDismiss, pressed ? styles.pressed : null]}
      >
        <AppText variant="caption" color="secondary">
          ✕
        </AppText>
      </Pressable>
    </View>
  );
}

type VoiceTranscriptEditorProps = {
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly onClear: () => void;
  readonly maxChars?: number;
  readonly testID?: string;
};

export function VoiceTranscriptEditor({
  value,
  onChangeText,
  onClear,
  maxChars = TRANSCRIPT_MAX_CHARS,
  testID = 'voice-transcript-editor',
}: VoiceTranscriptEditorProps) {
  const voiceStrings = useVoiceStrings();
  const { semantic } = useThemeMode();
  const styles = useVoiceTranscriptReviewStyles();
  const charCount = value.length;
  const atLimit = charCount >= maxChars;

  return (
    <View style={styles.editorBlock} testID={testID}>
      <View style={styles.editorHeader}>
        <View style={styles.editorTitles}>
          <AppText variant="label">{voiceStrings.transcriptEdit}</AppText>
          <AppText variant="caption" color="secondary">
            {voiceStrings.transcriptEditHint}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={voiceStrings.clearTranscript}
          onPress={onClear}
          disabled={charCount === 0}
          style={({ pressed }) => [
            styles.clearButton,
            charCount === 0 ? styles.clearButtonDisabled : null,
            pressed && charCount > 0 ? styles.pressed : null,
          ]}
        >
          <AppText variant="caption" color="urgent" style={styles.clearIcon}>
            🗑
          </AppText>
          <AppText variant="caption" color="urgent">
            {voiceStrings.clearTranscript}
          </AppText>
        </Pressable>
      </View>

      <View style={styles.editorFieldWrap}>
        <TextInput
          testID={`${testID}-input`}
          accessibilityLabel={voiceStrings.transcriptEdit}
          multiline
          textAlignVertical="top"
          value={value}
          onChangeText={(text) => onChangeText(text.slice(0, maxChars))}
          placeholder={voiceStrings.transcriptManualPlaceholder}
          placeholderTextColor={semantic.text.disabled}
          style={styles.editorInput}
        />
        <AppText
          variant="caption"
          color={atLimit ? 'urgent' : 'secondary'}
          style={styles.charCounter}
        >
          {charCount} / {maxChars}
        </AppText>
      </View>
    </View>
  );
}

export function VoiceTranscriptPrivacyRow() {
  const voiceStrings = useVoiceStrings();
  const styles = useVoiceTranscriptReviewStyles();

  const badges = [
    {
      icon: '🔒',
      title: voiceStrings.privacyPrivateTitle,
      body: voiceStrings.privacyPrivateBody,
    },
    {
      icon: '📶',
      title: voiceStrings.privacyOfflineTitle,
      body: voiceStrings.privacyOfflineBody,
    },
    {
      icon: '🛡',
      title: voiceStrings.privacyDataTitle,
      body: voiceStrings.privacyDataBody,
    },
  ] as const;

  return (
    <View style={styles.privacyRow} testID="voice-transcript-privacy">
      {badges.map((badge) => (
        <View key={badge.title} style={styles.privacyBadge}>
          <View style={styles.privacyIconWrap}>
            <AppText variant="caption">{badge.icon}</AppText>
          </View>
          <AppText variant="caption" color="secondary" style={styles.privacyCombined}>
            <AppText variant="caption" color="primary" style={styles.privacyTitle}>
              {badge.title}
            </AppText>
            {`. ${badge.body}`}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/** Header trailing control — On-device chip only (right-aligned). */
export function VoiceTranscriptHeaderActions() {
  const voiceStrings = useVoiceStrings();
  const styles = useVoiceTranscriptReviewStyles();

  return (
    <View style={styles.headerActions}>
      <StatusChip
        label={voiceStrings.onDeviceChip}
        tone="success"
        testID="voice-transcript-on-device"
      />
    </View>
  );
}

export function voiceTranscriptReviewGapStyle(): StyleProp<ViewStyle> {
  return { gap: spacing.lg };
}

function createVoiceTranscriptReviewStyles(semantic: SemanticColors) {
  return StyleSheet.create({
  reviewStack: {
    gap: spacing.lg,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: semantic.border.default,
    backgroundColor: semantic.surface.primary,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  clientTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  clientChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    minHeight: 44,
  },
  clientChangeIcon: {
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  sectionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: semantic.surface.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBubble: {
    width: 20,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: semantic.surface.primary,
    position: 'relative',
  },
  sectionBubbleTail: {
    position: 'absolute',
    bottom: -3,
    left: 3,
    width: 7,
    height: 7,
    backgroundColor: semantic.surface.primary,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.primary,
    transform: [{ rotate: '-45deg' }],
  },
  sectionTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  audioBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 16,
    backgroundColor: semantic.surface.muted,
    minHeight: 64,
  },
  audioPlayCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  audioPlayGlyph: {
    fontSize: 14,
    lineHeight: 16,
    marginLeft: 2,
  },
  audioLabel: {
    flexShrink: 1,
    maxWidth: '34%',
  },
  playbackWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minWidth: 56,
    maxWidth: 96,
  },
  playbackWaveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.disabled,
  },
  audioDuration: {
    minWidth: 40,
    textAlign: 'right',
  },
  howItWorks: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.card,
    backgroundColor: semantic.status.infoBackground,
    alignItems: 'flex-start',
  },
  howItWorksIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: semantic.surface.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howItWorksIcon: {
    fontSize: 16,
  },
  howItWorksBody: {
    flex: 1,
    gap: spacing.xxs,
  },
  howItWorksText: {
    lineHeight: 18,
  },
  howItWorksDismiss: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorBlock: {
    gap: spacing.sm,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  editorTitles: {
    flex: 1,
    gap: spacing.xxs,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: semantic.status.urgent,
    backgroundColor: semantic.surface.primary,
    minHeight: 36,
  },
  clearButtonDisabled: {
    opacity: 0.45,
    borderColor: semantic.border.default,
  },
  clearIcon: {
    fontSize: 12,
  },
  editorFieldWrap: {
    borderWidth: 1,
    borderColor: semantic.border.default,
    borderRadius: radii.card,
    backgroundColor: semantic.surface.primary,
    padding: spacing.md,
    minHeight: 160,
  },
  editorInput: {
    minHeight: 120,
    padding: 0,
    color: semantic.text.primary,
    fontFamily: typography.styles.bodyLarge.fontFamily,
    fontSize: typography.styles.bodyLarge.fontSize,
    lineHeight: typography.styles.bodyLarge.lineHeight,
  },
  charCounter: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },
  privacyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  privacyBadge: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
  },
  privacyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: semantic.surface.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyTitle: {
    fontWeight: '700',
  },
  privacyCombined: {
    textAlign: 'center',
    lineHeight: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
  },
  pressed: {
    opacity: 0.75,
  },
  });
}

function useVoiceTranscriptReviewStyles() {
  const { semantic } = useThemeMode();
  return useMemo(() => createVoiceTranscriptReviewStyles(semantic), [semantic]);
}
