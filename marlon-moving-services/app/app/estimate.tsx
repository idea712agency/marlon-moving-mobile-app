import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { brand } from '@/constants/operator-brand';
import { CustomerEstimateScreen } from '@/components/customer/customer-estimate-screen';
import { useAuth } from '@/providers/auth-provider';

export default function CustomerEstimateRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.bg }}><ActivityIndicator color={brand.blue} /></View>;
  }

  if (!session) return <Redirect href="/app/login" />;
  return <CustomerEstimateScreen />;
}
