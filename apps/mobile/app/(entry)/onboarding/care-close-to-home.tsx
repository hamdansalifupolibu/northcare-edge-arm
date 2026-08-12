import { Redirect } from 'expo-router';

/** Legacy route — onboarding is now a single six-slide flow. */
export default function OnboardingCareCloseToHome() {
  return <Redirect href="/(entry)/onboarding" />;
}
