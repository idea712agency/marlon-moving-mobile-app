import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>
        Page Not Found
      </Text>
      <Link href="/">
        <Text style={{ color: '#007AFF', fontSize: 16 }}>Go Home</Text>
      </Link>
    </View>
  );
}
