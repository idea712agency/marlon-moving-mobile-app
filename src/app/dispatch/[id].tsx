import { useLocalSearchParams } from 'expo-router';

import { PlaceholderScreen } from '@/components/operator/app-shell';

export default function AssignCrewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <PlaceholderScreen title="Assign Crew" subtitle={`Assign a crew to move ${id ?? ''}.`} />;
}
