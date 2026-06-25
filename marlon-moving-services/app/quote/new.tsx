import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LegacyQuoteNewRoute() {
  const { request } = useLocalSearchParams<{ request?: string }>();
  const href = request ? `/app/estimate?request=${encodeURIComponent(request)}` : '/app/estimate';
  return <Redirect href={href} />;
}
