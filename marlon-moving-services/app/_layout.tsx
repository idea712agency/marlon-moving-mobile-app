import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors } from '@/constants/theme';
import '@/global.css';
import '@/i18n';
import { AuthProvider } from '@/providers/auth-provider';
import { AppQueryProvider } from '@/providers/query-provider';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppQueryProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: colors.background },
              headerShadowVisible: false,
              headerBackButtonDisplayMode: 'minimal',
              headerTintColor: colors.navy,
              headerTitleStyle: { color: colors.text, fontWeight: '800' },
            }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="app/index" options={{ headerShown: false }} />
            <Stack.Screen name="app/login" options={{ headerShown: false }} />
            <Stack.Screen name="app/signup" options={{ headerShown: false }} />
            <Stack.Screen name="app/terms-of-service" options={{ headerShown: false }} />
            <Stack.Screen name="app/privacy-policy" options={{ headerShown: false }} />
            <Stack.Screen name="app/home" options={{ headerShown: false }} />
            <Stack.Screen name="app/quote" options={{ headerShown: false }} />
            <Stack.Screen name="app/quote/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="app/estimate" options={{ headerShown: false }} />
            <Stack.Screen name="app/messages" options={{ headerShown: false }} />
            <Stack.Screen name="app/documents" options={{ headerShown: false }} />
            <Stack.Screen name="app/documents/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="app/moves/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="app/account" options={{ headerShown: false }} />
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(admin)" options={{ headerShown: false }} />
            <Stack.Screen name="estimate" options={{ title: 'Free Estimate' }} />
            <Stack.Screen name="jobs/new" options={{ title: 'New Move' }} />
            <Stack.Screen name="moves/[id]" options={{ title: 'Move details', headerTitle: 'Move details' }} />
            <Stack.Screen name="customers/new" options={{ title: 'Add Customer' }} />
            <Stack.Screen name="dispatch/index" options={{ title: 'Dispatch Crew' }} />
            <Stack.Screen name="invoices/index" options={{ title: 'Invoices' }} />
            <Stack.Screen name="leads/index" options={{ headerShown: false }} />
            <Stack.Screen name="leads/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="messages/index" options={{ headerShown: false }} />
            <Stack.Screen name="messages/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="quote/new" options={{ title: 'Free Quote' }} />
            <Stack.Screen name="inventory" options={{ title: 'Inventory' }} />
            <Stack.Screen name="payment" options={{ title: 'Payment' }} />
            <Stack.Screen name="reschedule" options={{ title: 'Reschedule Move' }} />
            <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
            <Stack.Screen name="document/[id]" options={{ title: 'Document' }} />
            <Stack.Screen name="inventory/[id]" options={{ title: 'Inventory Item' }} />
          </Stack>
        </AuthProvider>
      </AppQueryProvider>
    </GestureHandlerRootView>
  );
}
