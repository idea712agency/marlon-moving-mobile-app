import { Redirect } from 'expo-router';

export default function NewJobScreen() {
  return <Redirect href="/estimate/new?manual=true" />;
}
