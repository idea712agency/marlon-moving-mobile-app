import { Stack } from 'expo-router';

import { OnboardingChrome } from '@/components/onboarding/chrome';

export default function OnboardingLayout() {
  return (
    <OnboardingChrome>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </OnboardingChrome>
  );
}
