import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Card, EmptyState, ErrorState, Icon, LoadingState, PrimaryButton, SectionTitle } from '@/components/ui';
import { colors, layout } from '@/constants/theme';
import type { Invoice } from '@/lib/data';
import { errorMessage, money } from '@/lib/data';
import { supabase } from '@/lib/supabase';

export default function PaymentScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => { supabase.from('invoices').select('*').order('created_at', { ascending: false }).then(({ data, error: queryError }) => { if (queryError) setError(errorMessage(queryError)); setInvoices(data ?? []); setLoading(false); }); }, []);
  const pay = async (invoice: Invoice) => {
    setError(''); setNote('');
    const { data, error: invokeError } = await supabase.functions.invoke('mobile-create-payment-intent', { body: { job_id: invoice.job_id ?? undefined, invoice_id: invoice.id, amount: invoice.total } });
    if (invokeError) setError(errorMessage(invokeError)); else setNote((data as { note?: string }).note ?? 'Payment intent created.');
  };
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: layout.screen, gap: 18, paddingBottom: 34 }}>
      {loading ? <LoadingState /> : null}{error ? <ErrorState message={error} /> : null}
      {!loading && !error && !invoices.length ? <EmptyState title="No invoices yet" body="Invoices for your linked move will appear here." /> : null}
      {invoices.map((invoice) => <Card key={invoice.id}><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><View><Text selectable style={{ color: colors.muted, fontSize: 12, fontWeight: '800' }}>{invoice.invoice_number}</Text><Text selectable style={{ color: colors.text, fontSize: 26, fontWeight: '900' }}>{money(invoice.total)}</Text></View><Text style={{ color: invoice.status === 'paid' ? colors.success : colors.primary, fontWeight: '900' }}>{invoice.status}</Text></View><Text selectable style={{ color: colors.muted }}>Due {invoice.due_date ?? 'on receipt'}</Text>{invoice.status !== 'paid' ? <PrimaryButton label="Start Secure Payment" onPress={() => void pay(invoice)} icon={<Icon ios="lock.fill" android="lock" size={16} color={colors.white} />} /> : null}</Card>)}
      {note ? <Card><SectionTitle title="Payment status" /><Text selectable style={{ color: colors.muted, lineHeight: 21 }}>{note}</Text></Card> : null}
    </ScrollView>
  );
}
