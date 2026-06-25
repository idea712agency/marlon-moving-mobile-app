import { useQuery } from '@tanstack/react-query';
import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, ChevronRight, FileText, PenLine } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { CustomerCard, CustomerEmpty, CustomerShell } from '@/components/customer/customer-shell';
import { CustomerConversationThread } from '@/components/messaging/conversation-thread';
import { brand } from '@/constants/operator-brand';
import {
  customerDocumentChip,
  customerDocumentHelp,
  customerDocumentListKey,
  customerDocumentProgress,
  customerDocumentTitle,
  groupCustomerDocuments,
  listCustomerJobDocuments,
  type CustomerDocument,
} from '@/lib/customer-documents';
import { errorMessage } from '@/lib/data';

export default function CustomerMoveDocumentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobId = Array.isArray(id) ? id[0] : id;
  const query = useQuery({
    queryKey: customerDocumentListKey(jobId),
    enabled: Boolean(jobId),
    queryFn: () => listCustomerJobDocuments(jobId),
  });
  const documents = (query.data?.documents ?? []).filter((document) => document.status !== 'draft');
  const groups = useMemo(() => groupCustomerDocuments(documents), [documents]);
  const progress = useMemo(() => customerDocumentProgress(documents), [documents]);
  const refetchDocuments = query.refetch;

  useFocusEffect(
    useCallback(() => {
      if (jobId) void refetchDocuments();
    }, [jobId, refetchDocuments]),
  );

  return (
    <CustomerShell
      title="Move documents"
      subtitle="Review documents our team has sent for this move."
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}>
      {query.isLoading ? <LoadingDocuments /> : null}
      {query.error ? <CustomerEmpty title="Documents unavailable" body={errorMessage(query.error)} /> : null}
      {!query.isLoading && !query.error && !documents.length ? (
        <CustomerEmpty title="No documents sent yet" body="When our team sends forms, estimates, or move paperwork, they will appear here." />
      ) : null}
      {documents.length ? <PacketProgressCard progress={progress} /> : null}
      {jobId ? <CustomerConversationThread title="Messages for this move" jobId={jobId} /> : null}

      {groups.map((group) => (
        <View key={group.label} style={{ gap: 10 }}>
          <View style={[styles.categoryChip, { backgroundColor: group.bg || brand.blueSoft }]}>
            <Text style={{ color: group.color || brand.blue, fontSize: 12, fontWeight: '900' }}>{group.label}</Text>
          </View>
          {group.documents.map((document) => <DocumentRow key={document.id} document={document} />)}
        </View>
      ))}
    </CustomerShell>
  );
}

function LoadingDocuments() {
  return (
    <>
      <ActivityIndicator color={brand.blue} />
      {[0, 1].map((item) => (
        <CustomerCard key={item}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={[styles.iconBubble, { backgroundColor: brand.bg }]} />
            <View style={{ flex: 1, gap: 8 }}>
              <View style={styles.skeletonLineWide} />
              <View style={styles.skeletonLine} />
            </View>
          </View>
        </CustomerCard>
      ))}
    </>
  );
}

function PacketProgressCard({ progress }: { progress: ReturnType<typeof customerDocumentProgress> }) {
  const status = progress.signable
    ? progress.complete
      ? 'All signature documents are complete.'
      : `${progress.remaining} document${progress.remaining === 1 ? '' : 's'} still need ${progress.remaining === 1 ? 'a signature' : 'signatures'}.`
    : 'No signatures are needed right now.';
  return (
    <CustomerCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={[styles.iconBubble, { backgroundColor: progress.complete ? brand.greenSoft : brand.orangeSoft }]}>
          {progress.complete ? <CheckCircle2 color={brand.green} size={23} /> : <PenLine color={progress.signable ? brand.orange : brand.blue} size={23} />}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text selectable style={styles.packetTitle}>
            {progress.signable ? `${progress.signed} of ${progress.signable} signed` : `${progress.total} document${progress.total === 1 ? '' : 's'} sent`}
          </Text>
          <Text selectable style={styles.packetBody}>{status}</Text>
        </View>
      </View>
    </CustomerCard>
  );
}

function DocumentRow({ document }: { document: CustomerDocument }) {
  const chip = customerDocumentChip(document);
  return (
    <Link href={`/app/documents/${document.id}`} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={`Open ${customerDocumentTitle(document)}`}>
        <CustomerCard>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={styles.iconBubble}><FileText color={brand.blue} size={23} /></View>
            <View style={{ flex: 1, gap: 5 }}>
              <Text selectable numberOfLines={1} style={styles.documentTitle}>{customerDocumentTitle(document)}</Text>
              <Text selectable numberOfLines={2} style={styles.helpText}>{customerDocumentHelp(document)}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 }}>
                <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
                  <Text style={{ color: chip.color, fontSize: 10, fontWeight: '900' }}>{chip.label}</Text>
                </View>
                {document.signature_required ? <Text style={styles.metaText}>Signature required</Text> : null}
              </View>
            </View>
            <ChevronRight color={brand.muted} size={18} />
          </View>
        </CustomerCard>
      </Pressable>
    </Link>
  );
}

const styles = {
  categoryChip: { alignSelf: 'flex-start' as const, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  iconBubble: { width: 48, height: 48, borderRadius: 15, backgroundColor: brand.blueSoft, alignItems: 'center' as const, justifyContent: 'center' as const },
  documentTitle: { color: brand.text, fontSize: 16, fontWeight: '900' as const },
  packetTitle: { color: brand.text, fontSize: 17, fontWeight: '900' as const },
  packetBody: { color: brand.muted, fontSize: 13, lineHeight: 18 },
  helpText: { color: brand.muted, fontSize: 12, lineHeight: 17 },
  statusChip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  metaText: { color: brand.muted, fontSize: 11, fontWeight: '800' as const },
  skeletonLineWide: { width: '80%' as const, height: 14, borderRadius: 999, backgroundColor: brand.bg },
  skeletonLine: { width: '52%' as const, height: 12, borderRadius: 999, backgroundColor: brand.bg },
};
