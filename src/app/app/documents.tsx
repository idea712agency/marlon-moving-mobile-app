import { Link } from 'expo-router';
import { ClipboardList, FileText } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { CustomerCard, CustomerEmpty, CustomerShell } from '@/components/customer/customer-shell';
import { brand } from '@/constants/operator-brand';
import { useCustomerDashboard } from '@/hooks/use-customer-dashboard';
import { listCustomerQuoteRequests } from '@/lib/customer-quote-requests';
import { shortDate } from '@/lib/data';

export default function CustomerDocumentsScreen() {
  const dashboard = useCustomerDashboard();
  const requests = useQuery({
    queryKey: ['customer-quote-requests'],
    queryFn: listCustomerQuoteRequests,
  });
  const documents = dashboard.data?.documents ?? [];
  const isLoading = dashboard.isLoading || requests.isLoading;
  const error = dashboard.error || requests.error;
  const totalItems = documents.length + (requests.data?.length ?? 0);

  return (
    <CustomerShell
      title="Documents"
      subtitle="Review submitted estimate requests, contracts, receipts, and signed paperwork."
      unread={dashboard.data?.unread_notifications ?? 0}
      refreshing={dashboard.isRefetching || requests.isRefetching}
      onRefresh={() => {
        void dashboard.refetch();
        void requests.refetch();
      }}>
      {isLoading ? <ActivityIndicator color={brand.blue} /> : null}
      {error ? <CustomerEmpty title="Documents unavailable" body={error instanceof Error ? error.message : 'Unable to load documents.'} /> : null}
      {!isLoading && !error && totalItems === 0 ? <CustomerEmpty title="No documents yet" body="Submitted estimates and move documents will appear here." /> : null}

      {requests.data?.length ? <Text selectable style={styles.sectionTitle}>Estimate requests</Text> : null}
      {requests.data?.map((request) => (
        <Link key={`estimate-${request.id}`} href={`/app/quote/${request.id}`} asChild>
          <Pressable accessibilityLabel={`Open estimate request ${request.id.slice(0, 8)}`} accessibilityRole="link">
            <CustomerCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: brand.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <ClipboardList color={brand.green} size={24} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text selectable numberOfLines={1} style={{ color: brand.text, fontSize: 16, fontWeight: '900' }}>
                    Estimate Request {request.id.slice(0, 8).toUpperCase()}
                  </Text>
                  <Text selectable style={{ color: brand.muted, fontSize: 12 }}>
                    Submitted {shortDate(request.created_at.slice(0, 10))} · {titleCase(request.status || 'new')}
                  </Text>
                  {request.revision_of ? <Text style={{ color: brand.blue, fontSize: 10, fontWeight: '900' }}>Revised submission</Text> : null}
                </View>
              </View>
            </CustomerCard>
          </Pressable>
        </Link>
      ))}

      {documents.length ? <Text selectable style={styles.sectionTitle}>Move documents</Text> : null}
      {documents.map((document) => (
        <Link key={document.id} href={`/document/${document.id}`} asChild>
          <Pressable accessibilityLabel={`Open ${document.name}`} accessibilityRole="link">
            <CustomerCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: brand.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <FileText color={brand.blue} size={24} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text selectable numberOfLines={1} style={{ color: brand.text, fontSize: 16, fontWeight: '900' }}>{document.name}</Text>
                  <Text style={{ color: brand.muted, fontSize: 12 }}>{titleCase(document.document_type)} · {document.is_signed ? 'Signed' : 'Not signed'}</Text>
                </View>
              </View>
            </CustomerCard>
          </Pressable>
        </Link>
      ))}
    </CustomerShell>
  );
}

const titleCase = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const styles = {
  sectionTitle: { color: brand.text, fontSize: 19, fontWeight: '900' as const },
};
