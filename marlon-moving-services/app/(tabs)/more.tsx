import { FileStack, FileText, LogOut, Settings } from 'lucide-react-native';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { brand } from '@/constants/operator-brand';
import { useAuth } from '@/providers/auth-provider';

export default function MoreScreen() {
  const { user, signOut } = useAuth();

  return (
    <OperatorScreen>
      <OperatorPageHeader title="More" subtitle="Settings, account, and operator tools." />
      <OperatorCard>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: brand.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Settings color={brand.blue} size={22} strokeWidth={2.4} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text selectable style={{ color: brand.text, fontSize: 16, fontWeight: '900' }}>
              Operator account
            </Text>
            <Text selectable style={{ color: brand.muted, fontSize: 13 }}>
              {user?.email ?? 'Signed in admin'}
            </Text>
          </View>
        </View>
      </OperatorCard>
      <Link href="/quotes" asChild>
        <Pressable style={styles.toolButton}>
          <FileText color={brand.blue} size={20} />
          <View style={{ flex: 1 }}>
            <Text style={styles.toolTitle}>Quotes & estimates</Text>
            <Text style={styles.toolSubtitle}>Build, print, send, and convert estimates.</Text>
          </View>
        </Pressable>
      </Link>
      <Link href="/documents" asChild>
        <Pressable style={styles.toolButton}>
          <FileStack color={brand.blue} size={20} />
          <View style={{ flex: 1 }}>
            <Text style={styles.toolTitle}>Documents</Text>
            <Text style={styles.toolSubtitle}>Upload and manage admin files.</Text>
          </View>
        </Pressable>
      </Link>
      <Pressable
        accessibilityLabel="Sign out"
        accessibilityRole="button"
        onPress={() => {
          void signOut();
        }}
        style={{
          height: 52,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: brand.border,
          backgroundColor: brand.surface,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 9,
        }}>
        <LogOut color={brand.red} size={19} strokeWidth={2.4} />
        <Text style={{ color: brand.red, fontSize: 15, fontWeight: '900' }}>Sign out</Text>
      </Pressable>
    </OperatorScreen>
  );
}

const styles = {
  toolButton: {
    minHeight: 66,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.surface,
    paddingHorizontal: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  toolTitle: { color: brand.text, fontSize: 15, fontWeight: '900' as const },
  toolSubtitle: { color: brand.muted, fontSize: 12, marginTop: 2 },
};
