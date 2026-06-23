import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

export default function Index() {
  const { session, isAdmin, loading } = useAuth();

  if (loading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  }

  if (!session) return <Redirect href="/auth" />;
  return <Redirect href={isAdmin ? '/home' : '/app/home'} />;
}
