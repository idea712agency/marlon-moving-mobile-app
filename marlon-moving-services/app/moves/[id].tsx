import { useLocalSearchParams } from 'expo-router';

import { PlaceholderScreen } from '@/components/operator/app-shell';

export default function MoveDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <PlaceholderScreen title="Move Details" subtitle={`Move ${id ?? ''} details will be built next.`} />;
}
