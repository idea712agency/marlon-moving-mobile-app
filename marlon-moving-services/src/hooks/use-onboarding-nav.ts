import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams, usePathname, type Href } from 'expo-router';

const routes = ['/welcome', '/welcome/why-marlon', '/welcome/how-it-works', '/welcome/services', '/welcome/get-started'] as const;

async function completeOnboarding() {
  await AsyncStorage.setItem('onboarding_completed', 'true');
}

async function lightImpact() {
  if (process.env.EXPO_OS === 'ios') {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

async function mediumImpact() {
  if (process.env.EXPO_OS === 'ios') {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export function useOnboardingNav() {
  const pathname = usePathname();
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const step = Math.max(1, routes.findIndex((route) => route === pathname) + 1);
  const isPreview = preview === 'true';

  const routeFor = (route: (typeof routes)[number]): Href => (isPreview ? `${route}?preview=true` : route);

  return {
    step,
    next: async () => {
      await lightImpact();
      const nextRoute = routes[Math.min(step, routes.length - 1)];
      router.push(routeFor(nextRoute));
    },
    back: async () => {
      await lightImpact();
      const previousRoute = routes[Math.max(step - 2, 0)];
      router.push(routeFor(previousRoute));
    },
    skip: async () => {
      if (!isPreview) await completeOnboarding();
      router.replace('/app/login');
    },
    finish: async (destination: '/app/login' | '/app/signup' | '/auth/sign-in' | '/auth/sign-up' | '/quote/new') => {
      if (!isPreview) await completeOnboarding();
      await mediumImpact();
      router.replace(destination);
    },
  };
}
