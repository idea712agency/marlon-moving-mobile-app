import { Bell, CalendarDays, FileCode2, FileStack, LogOut, ReceiptText, Settings, Truck, UserRoundSearch, Users } from 'lucide-react-native';
import { Link, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { brand } from '@/constants/operator-brand';
import { useAuth } from '@/providers/auth-provider';

const tools: Array<{ title: string; subtitle: string; href: Href; Icon: typeof Settings }> = [
  { title: 'Schedule', subtitle: 'Calendar view for upcoming moves.', href: '/schedule', Icon: CalendarDays },
  { title: 'Dispatch', subtitle: 'Assign crews, trucks, and start times.', href: '/dispatch', Icon: Truck },
  { title: 'Crew Roster', subtitle: 'Manage active dispatch crew members.', href: '/dispatch/crew', Icon: Users },
  { title: 'Customers', subtitle: 'Profiles, move history, and contact details.', href: '/customers', Icon: Users },
  { title: 'Leads', subtitle: 'Review and book submitted estimate requests.', href: '/leads', Icon: UserRoundSearch },
  { title: 'Documents', subtitle: 'Generated packets, signatures, and uploads.', href: '/documents', Icon: FileStack },
  { title: 'Templates', subtitle: 'Edit document templates and readiness rules.', href: '/templates', Icon: FileCode2 },
  { title: 'Invoices', subtitle: 'Review balances, invoices, and payment state.', href: '/invoices', Icon: ReceiptText },
  { title: 'Notifications', subtitle: 'Recent alerts and customer activity.', href: '/notifications', Icon: Bell },
  { title: 'Account', subtitle: 'Operator account and app settings.', href: '/account', Icon: Settings },
];

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
      {tools.map(({ title, subtitle, href, Icon }) => (
        <Link key={title} href={href} asChild>
          <Pressable accessibilityLabel={title} accessibilityRole="link" style={styles.toolButton}>
            <Icon color={brand.blue} size={20} />
            <View style={{ flex: 1 }}>
              <Text style={styles.toolTitle}>{title}</Text>
              <Text style={styles.toolSubtitle}>{subtitle}</Text>
            </View>
          </Pressable>
        </Link>
      ))}
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
