import { useLocalSearchParams } from 'expo-router';

import { PlaceholderScreen } from '@/components/operator/app-shell';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PlaceholderScreen
      title="Move Detail"
      subtitle={`Move ${id ?? ''} will show job details, activity, and status transitions in the Moves PR.`}
    />
  );
}
