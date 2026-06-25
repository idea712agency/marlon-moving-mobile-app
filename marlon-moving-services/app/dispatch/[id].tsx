import { Redirect, useLocalSearchParams } from 'expo-router';

export default function AssignCrewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobId = Array.isArray(id) ? id[0] : id;
  return <Redirect href={jobId ? `/moves/${jobId}` : '/moves'} />;
}
