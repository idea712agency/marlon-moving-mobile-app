import { Stack, useLocalSearchParams } from 'expo-router';

import { PlaceholderScreen } from '@/components/operator/app-shell';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PlaceholderScreen title="Invoice Details" subtitle={`Invoice ${id ?? ''} details will be built in the invoices feature.`} />
    </>
  );
}
