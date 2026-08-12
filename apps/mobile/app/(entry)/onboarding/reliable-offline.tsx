import { Redirect } from 'expo-router';

/** Legacy route — onboarding is now a single six-slide flow. */
export default function OnboardingReliableOffline() {
  return <Redirect href="/(entry)/onboarding" />;
}
