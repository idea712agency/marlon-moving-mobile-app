import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

export default function Index() {
  const { session, isAdmin, loading } = useAuth();

  if (loading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  }

  // If no session, send to welcome onboarding so new users see the intro flow first.
  // Returning users with a session skip straight to their portal.
  if (!session) return <Redirect href="/welcome" />;
  return <Redirect href={isAdmin ? '/home' : '/app/home'} />;
}
