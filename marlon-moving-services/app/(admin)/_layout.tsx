import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { brand } from '@/constants/operator-brand';
import { useAuth } from '@/providers/auth-provider';

export default function AdminLayout() {
  const { session, isAdmin, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={brand.blue} /></View>;
  if (!session || !isAdmin) return <Redirect href="/auth" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: brand.bg } }} />;
}
