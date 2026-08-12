import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  View,
  useWindowDimensions,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { getAppConfig } from '../../../config/appConfig';
import { useTranslation } from '../../../i18n/LanguageProvider';
import type { AppStrings } from '../../../i18n/en';
import { useLaunch } from '../../../launch/LaunchProvider';
import { createLogger } from '../../../logging/logger';
import { isDevAlwaysShowOnboardingEnabled } from '../development/devAlwaysShowOnboarding';
import {
  ONBOARDING_SLIDE_COUNT,
  onboardingSlides,
  type OnboardingSlideDefinition,
  type OnboardingSlideId,
} from '../content/onboardingSlides';
import { preloadOnboardingAheadOf } from '../content/onboardingImagePreload';
import {
  ImmersiveOnboardingSlide,
  type ImmersiveOnboardingSlideCopy,
} from './ImmersiveOnboardingSlide';

const logger = createLogger({ environment: getAppConfig().appEnv });

function resolveSlideCopy(t: AppStrings, id: OnboardingSlideId): ImmersiveOnboardingSlideCopy {
  switch (id) {
    case 'care':
      return {
        eyebrow: t.onboarding.slide1.eyebrow,
        title: t.onboarding.slide1.title,
        body: t.onboarding.slide1.body,
        imageLabel: t.onboarding.slide1.imageLabel,
        contextLabel: t.onboarding.slide1.contextLabel,
      };
    case 'reach':
      return {
        eyebrow: t.onboarding.slide2.eyebrow,
        title: t.onboarding.slide2.title,
        body: t.onboarding.slide2.body,
        imageLabel: t.onboarding.slide2.imageLabel,
        contextLabel: t.onboarding.slide2.contextLabel,
        footnote: t.onboarding.slide2.footnote,
      };
    case 'intelligence':
      return {
        eyebrow: t.onboarding.slide3.eyebrow,
        title: t.onboarding.slide3.title,
        body: t.onboarding.slide3.body,
        imageLabel: t.onboarding.slide3.imageLabel,
        featureChips: [t.onboarding.slide3.chipVoice, t.onboarding.slide3.chipAsk],
      };
    case 'trust':
      return {
        eyebrow: t.onboarding.slide4.eyebrow,
        title: t.onboarding.slide4.title,
        body: t.onboarding.slide4.body,
        imageLabel: t.onboarding.slide4.imageLabel,
        contextLabel: t.onboarding.slide4.contextLabel,
      };
    case 'inclusion':
      return {
        eyebrow: t.onboarding.slide5.eyebrow,
        title: t.onboarding.slide5.title,
        body: t.onboarding.slide5.body,
        imageLabel: t.onboarding.slide5.imageLabel,
        contextLabel: t.onboarding.slide5.reachLabel,
        contextSecondary: t.onboarding.slide5.sandboxLabel,
      };
    case 'impact':
      return {
        eyebrow: t.onboarding.slide6.eyebrow,
        title: t.onboarding.slide6.title,
        body: t.onboarding.slide6.body,
        imageLabel: t.onboarding.slide6.imageLabel,
        sdgPrimary: [
          { number: '2', label: t.onboarding.slide6.sdg2Label },
          { number: '3', label: t.onboarding.slide6.sdg3Label },
          { number: '10', label: t.onboarding.slide6.sdg10Label },
        ],
        sdgSecondary: {
          number: '5',
          label: t.onboarding.slide6.sdg5Label,
        },
      };
    default: {
      const exhaustive: never = id;
      return exhaustive;
    }
  }
}

export function ImmersiveOnboardingFlow() {
  const t = useTranslation();
  const router = useRouter();
  const { completeOnboarding } = useLaunch();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<OnboardingSlideDefinition>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const slideCopies = useMemo(
    () => onboardingSlides.map((slide) => resolveSlideCopy(t, slide.id)),
    [t],
  );

  useEffect(() => {
    preloadOnboardingAheadOf(currentIndex);
  }, [currentIndex]);

  const finishOnboarding = useCallback(async (): Promise<void> => {
    setSaving(true);
    setErrorMessage(null);
    try {
      if (!isDevAlwaysShowOnboardingEnabled()) {
        await completeOnboarding();
      }
      router.replace('/(entry)/workspace-selection');
    } catch (error) {
      logger.error('Onboarding completion save failed', {
        message: error instanceof Error ? error.message.slice(0, 200) : 'unknown',
      });
      setErrorMessage(t.preferenceError.body);
      setSaving(false);
    }
  }, [completeOnboarding, router, t.preferenceError.body]);


  const handleScrollToIndexFailed = useCallback(
    (info: { index: number }) => {
      listRef.current?.scrollToOffset({
        offset: info.index * width,
        animated: false,
      });
      setCurrentIndex(info.index);
    },
    [width],
  );

  const handleNext = useCallback(() => {
    if (currentIndex >= ONBOARDING_SLIDE_COUNT - 1) {
      void finishOnboarding();
      return;
    }
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    listRef.current?.scrollToIndex({ index: nextIndex, animated: false });
  }, [currentIndex, finishOnboarding]);

  const handleBack = useCallback(() => {
    if (currentIndex <= 0) {
      return;
    }
    const previousIndex = currentIndex - 1;
    setCurrentIndex(previousIndex);
    listRef.current?.scrollToIndex({ index: previousIndex, animated: false });
  }, [currentIndex]);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
      if (nextIndex !== currentIndex) {
        setCurrentIndex(nextIndex);
      }
    },
    [currentIndex, width],
  );

  const renderSlide = useCallback(
    ({ item, index }: ListRenderItemInfo<OnboardingSlideDefinition>) => {
      const step = index + 1;
      const isLast = index === ONBOARDING_SLIDE_COUNT - 1;

      return (
        <ImmersiveOnboardingSlide
          slide={item}
          step={step}
          copy={slideCopies[index]!}
          showSkip={!isLast}
          showBack={index > 0}
          isLast={isLast}
          saving={saving}
          errorMessage={errorMessage}
          onSkip={() => void finishOnboarding()}
          onBack={handleBack}
          onNext={handleNext}
          onRetrySave={() => void finishOnboarding()}
        />
      );
    },
    [errorMessage, finishOnboarding, handleBack, handleNext, saving, slideCopies],
  );

  return (
    <View style={{ flex: 1 }} testID="onboarding-flow">
      <FlatList
        ref={listRef}
        data={onboardingSlides}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!saving}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        initialNumToRender={1}
        windowSize={3}
        maxToRenderPerBatch={2}
        removeClippedSubviews
      />
    </View>
  );
}
