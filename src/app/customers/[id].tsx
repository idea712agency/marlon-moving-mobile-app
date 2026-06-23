import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Mail, Phone, Plus, ReceiptText, Truck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTopBar } from '@/components/operator/app-shell';
import { StatusPill } from '@/components/operator/StatusPill';
import { brand } from '@/constants/operator-brand';
import { useCustomerDetail } from '@/hooks/use-customer-detail';

const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const customerQuery = useCustomerDetail(id);
  const locale = i18n.language.startsWith('es') ? 'es-US' : 'en-US';
  const data = customerQuery.data;

  const statusLabel = (status: string) => {
    const translated = t(`customers.status.${status}`, { defaultValue: '' });
    return translated || status.replace(/_/g, ' ');
  };

  return (
    <View style={{ flex: 1, backgroundColor: brand.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppTopBar />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 34, gap: 18 }}>
        {customerQuery.isLoading ? (
          <View style={{ minHeight: 420, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={brand.blue} size="large" />
          </View>
        ) : !data?.contact ? (
          <View style={{ minHeight: 360, alignItems: 'center', justifyContent: 'center' }}>
            <Text selectable style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>{t('customers.notFound')}</Text>
          </View>
        ) : (
          <>
            <View
              style={{
                borderRadius: 20,
                borderCurve: 'continuous',
                borderWidth: 1,
                borderColor: brand.border,
                padding: 17,
                gap: 14,
                backgroundColor: brand.surface,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.blueSoft }}>
                  <Text style={{ color: brand.blue, fontSize: 20, fontWeight: '900' }}>{data.contact.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text selectable style={{ flex: 1, color: brand.text, fontSize: 22, lineHeight: 27, fontWeight: '900' }}>{data.contact.name}</Text>
              </View>

              <ContactLink
                Icon={Phone}
                label={data.contact.phone ?? t('customers.profile.phoneUnavailable')}
                disabled={!data.contact.phone}
                onPress={() => data.contact?.phone && Linking.openURL(`tel:${data.contact.phone}`)}
              />
              <ContactLink
                Icon={Mail}
                label={data.contact.email ?? t('customers.profile.emailUnavailable')}
                disabled={!data.contact.email}
                onPress={() => data.contact?.email && Linking.openURL(`mailto:${data.contact.email}`)}
              />

              {data.contact.notes ? (
                <View style={{ borderTopWidth: 1, borderTopColor: brand.border, paddingTop: 13, gap: 5 }}>
                  <Text style={{ color: brand.text, fontSize: 11, fontWeight: '900' }}>{t('customers.profile.notes')}</Text>
                  <Text selectable style={{ color: brand.muted, fontSize: 13, lineHeight: 19 }}>{data.contact.notes}</Text>
                </View>
              ) : null}
            </View>

            <Pressable
              accessibilityLabel={t('customers.newMove')}
              accessibilityRole="button"
              onPress={() => router.push(`/jobs/new?contact=${id}`)}
              style={{ height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, backgroundColor: brand.blue }}>
              <Plus color="#FFFFFF" size={17} strokeWidth={2.7} />
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>{t('customers.newMove')}</Text>
            </Pressable>

            <View style={{ gap: 10 }}>
              <SectionTitle Icon={Truck} label={`${t('customers.moves')} (${data.jobs.length})`} />
              {data.jobs.length ? data.jobs.map((job) => (
                <Pressable
                  key={job.id}
                  accessibilityLabel={job.job_number}
                  accessibilityRole="button"
                  onPress={() => router.push(`/moves/${job.id}`)}
                  style={rowStyle}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text selectable style={{ color: brand.text, fontSize: 13, fontWeight: '800' }}>{job.job_number}</Text>
                    <Text selectable style={{ color: brand.muted, fontSize: 11 }}>
                      {new Date(`${job.scheduled_date}T12:00:00`).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <StatusPill status={job.status} label={statusLabel(job.status)} />
                </Pressable>
              )) : <EmptyRow label={t('customers.noMoves')} />}
            </View>

            <View style={{ gap: 10 }}>
              <SectionTitle Icon={ReceiptText} label={`${t('customers.invoices')} (${data.invoices.length})`} />
              {data.invoices.length ? data.invoices.map((invoice) => (
                <Pressable
                  key={invoice.id}
                  accessibilityLabel={invoice.invoice_number}
                  accessibilityRole="button"
                  onPress={() => router.push(`/invoices/${invoice.id}`)}
                  style={rowStyle}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text selectable style={{ color: brand.text, fontSize: 13, fontWeight: '800' }}>{invoice.invoice_number}</Text>
                    <Text selectable style={{ color: brand.muted, fontSize: 11 }}>
                      {t('customers.due', { date: invoice.due_date ?? '—' })}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 5 }}>
                    <Text selectable style={{ color: brand.text, fontSize: 13, fontWeight: '900' }}>{money(invoice.total)}</Text>
                    <StatusPill status={invoice.status} label={statusLabel(invoice.status)} />
                  </View>
                </Pressable>
              )) : <EmptyRow label={t('customers.noInvoices')} />}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const rowStyle = {
  minHeight: 66,
  borderRadius: 15,
  borderCurve: 'continuous' as const,
  borderWidth: 1,
  borderColor: brand.border,
  paddingHorizontal: 13,
  paddingVertical: 11,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 10,
  backgroundColor: brand.surface,
};

function ContactLink({
  Icon,
  label,
  disabled,
  onPress,
}: {
  Icon: typeof Phone;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole={disabled ? 'text' : 'link'}
      disabled={disabled}
      onPress={onPress}
      style={{ minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.blueSoft }}>
        <Icon color={brand.blue} size={16} strokeWidth={2.3} />
      </View>
      <Text selectable style={{ flex: 1, color: disabled ? brand.muted : brand.blue, fontSize: 13, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

function SectionTitle({ Icon, label }: { Icon: typeof Truck; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Icon color={brand.blue} size={18} strokeWidth={2.4} />
      <Text selectable style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>{label}</Text>
    </View>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <View style={{ minHeight: 70, borderRadius: 15, borderWidth: 1, borderColor: brand.border, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.surface }}>
      <Text selectable style={{ color: brand.muted, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}
