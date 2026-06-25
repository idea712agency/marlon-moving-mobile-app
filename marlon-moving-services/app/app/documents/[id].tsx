import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Check, Download, FileText, Info, LockKeyhole, PenLine } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';

import { CustomerCard, CustomerEmpty, CustomerShell } from '@/components/customer/customer-shell';
import { DocumentViewer, HtmlSnapshotModal } from '@/components/documents/document-viewer';
import { brand } from '@/constants/operator-brand';
import {
  customerDocumentDetailKey,
  customerDocumentHelp,
  customerDocumentListKey,
  customerDocumentTitle,
  customerDocumentVersion,
  getCustomerDocumentDetail,
  isCustomerDocumentSigned,
  signCustomerDocument,
} from '@/lib/customer-documents';
import { errorMessage } from '@/lib/data';

export default function CustomerDocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const documentId = Array.isArray(id) ? id[0] : id;
  const queryClient = useQueryClient();
  const [typedName, setTypedName] = useState('');
  const [localError, setLocalError] = useState('');
  const [htmlPreviewOpen, setHtmlPreviewOpen] = useState(false);

  const detail = useQuery({
    queryKey: customerDocumentDetailKey(documentId),
    enabled: Boolean(documentId),
    queryFn: () => {
      if (!documentId) throw new Error('Missing document id.');
      return getCustomerDocumentDetail(documentId);
    },
  });
  const refetchDetail = detail.refetch;

  useFocusEffect(
    useCallback(() => {
      if (documentId) void refetchDetail();
    }, [documentId, refetchDetail]),
  );

  const document = detail.data?.document ?? null;
  const signed = document ? isCustomerDocumentSigned(document, detail.data?.signed) : false;
  const signatureRequired = Boolean(document?.signature_required);
  const signedAt = detail.data?.signed_at ?? document?.signed_at ?? null;
  const signerName = detail.data?.signer_name ?? document?.signer_name ?? null;
  const version = document ? customerDocumentVersion(document) : null;

  const sign = useMutation({
    mutationFn: async () => {
      if (!documentId) throw new Error('Missing document id.');
      const trimmed = typedName.trim();
      if (trimmed.length < 2 || trimmed.length > 100) throw new Error('Enter your full legal name, 2-100 characters.');
      return signCustomerDocument(documentId, trimmed);
    },
    onSuccess: async (response) => {
      setTypedName('');
      setLocalError('');
      await queryClient.invalidateQueries({ queryKey: customerDocumentDetailKey(documentId) });
      await queryClient.invalidateQueries({ queryKey: customerDocumentListKey(document?.job_id) });
      await queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
      Alert.alert(response.status === 'already_signed' ? 'Document was already signed' : 'Document signed');
    },
    onError: (error) => setLocalError(errorMessage(error)),
  });

  const openDocument = async () => {
    if (!detail.data?.signed_url) return;
    await WebBrowser.openBrowserAsync(detail.data.signed_url);
  };

  return (
    <CustomerShell
      title="Document"
      subtitle={document ? customerDocumentTitle(document) : 'Review and sign documents sent by our team.'}
      refreshing={detail.isRefetching}
      onRefresh={() => void detail.refetch()}>
      {detail.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
      {detail.error ? <CustomerEmpty title="Document unavailable" body={errorMessage(detail.error)} /> : null}
      {!detail.isLoading && !detail.error && !document ? <CustomerEmpty title="Document not found" body="This document is not available." /> : null}

      {document ? (
        <>
          <CustomerCard>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={styles.iconBubble}><FileText color={brand.blue} size={26} /></View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text selectable style={styles.title}>{customerDocumentTitle(document)}</Text>
                <Text selectable style={{ color: signed ? brand.green : signatureRequired ? brand.orange : brand.blue, fontSize: 12, fontWeight: '900' }}>
                  {signed ? `Signed${version ? ` v${version}` : ''}` : signatureRequired ? 'Signature required' : 'Ready to view'}
                </Text>
              </View>
            </View>
            <View style={styles.helperBox}>
              <Info color={brand.blue} size={17} />
              <Text selectable style={styles.body}>{customerDocumentHelp(document)}</Text>
            </View>
          </CustomerCard>

          <DocumentPreview
            url={detail.data?.signed_url ?? null}
            htmlPreviewUrl={detail.data?.html_preview_url ?? document.html_preview_url ?? null}
            isPdf={Boolean(detail.data?.is_pdf ?? document.is_pdf)}
            isHtmlSnapshot={Boolean(detail.data?.is_html_snapshot ?? document.is_html_snapshot)}
            mimeType={document.mime_type}
            onOpen={openDocument}
            onOpenHtml={() => setHtmlPreviewOpen(true)}
          />

          {signed ? (
            <CustomerCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Check color={brand.green} size={20} />
                <Text selectable style={{ color: brand.green, fontSize: 17, fontWeight: '900' }}>Signature complete</Text>
              </View>
              <Text selectable style={styles.body}>
                Signed by {signerName || 'customer'}{signedAt ? ` on ${new Date(signedAt).toLocaleString()}` : ''}{version ? ` · v${version}` : ''}
              </Text>
              <Text selectable style={styles.body}>This document is locked because it has already been signed.</Text>
            </CustomerCard>
          ) : signatureRequired ? (
            <CustomerCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <LockKeyhole color={brand.blue} size={19} />
                <Text style={styles.sectionTitle}>Sign document</Text>
              </View>
              <Text selectable style={styles.body}>Type your full legal name to sign this document.</Text>
              <View style={styles.pendingBox}>
                <PenLine color={brand.orange} size={17} />
                <Text selectable style={{ color: brand.text, fontSize: 12, lineHeight: 17, flex: 1 }}>Your typed name is recorded as your signature and locks this document.</Text>
              </View>
              {localError ? <Text selectable style={{ color: brand.red, fontSize: 12, lineHeight: 17, fontWeight: '800' }}>{localError}</Text> : null}
              <TextInput
                value={typedName}
                onChangeText={(value) => {
                  setTypedName(value);
                  setLocalError('');
                }}
                editable={!sign.isPending}
                placeholder="Your full legal name"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
              <Pressable
                disabled={sign.isPending || typedName.trim().length < 2 || typedName.trim().length > 100}
                onPress={() => sign.mutate()}
                style={[styles.primaryButton, { opacity: sign.isPending || typedName.trim().length < 2 || typedName.trim().length > 100 ? 0.55 : 1 }]}>
                <Text style={styles.primaryText}>{sign.isPending ? 'Signing...' : 'Sign document'}</Text>
              </Pressable>
            </CustomerCard>
          ) : null}
        </>
      ) : null}
      <HtmlSnapshotModal
        title="HTML snapshot"
        url={detail.data?.html_preview_url ?? document?.html_preview_url ?? null}
        visible={htmlPreviewOpen}
        onClose={() => setHtmlPreviewOpen(false)}
      />
    </CustomerShell>
  );
}

function DocumentPreview({
  url,
  htmlPreviewUrl,
  isPdf,
  isHtmlSnapshot,
  mimeType,
  onOpen,
  onOpenHtml,
}: {
  url: string | null;
  htmlPreviewUrl: string | null;
  isPdf: boolean;
  isHtmlSnapshot: boolean;
  mimeType?: string | null;
  onOpen: () => void;
  onOpenHtml: () => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <DocumentViewer url={url} isPdf={isPdf} isHtmlSnapshot={isHtmlSnapshot} mimeType={mimeType} onOpen={onOpen} />
      <Pressable disabled={!url} onPress={onOpen} style={[styles.secondaryButton, { opacity: url ? 1 : 0.55 }]}>
        <Download color={brand.blue} size={17} />
        <Text style={styles.secondaryText}>Open or download PDF</Text>
      </Pressable>
      {htmlPreviewUrl ? (
        <Pressable onPress={onOpenHtml} style={styles.secondaryButton}>
          <FileText color={brand.blue} size={17} />
          <Text style={styles.secondaryText}>View HTML snapshot</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = {
  iconBubble: { width: 54, height: 54, borderRadius: 16, backgroundColor: brand.blueSoft, alignItems: 'center' as const, justifyContent: 'center' as const },
  title: { color: brand.text, fontSize: 19, lineHeight: 24, fontWeight: '900' as const },
  sectionTitle: { color: brand.text, fontSize: 18, fontWeight: '900' as const },
  body: { color: brand.muted, fontSize: 13, lineHeight: 19 },
  helperBox: { borderRadius: 13, borderWidth: 1, borderColor: brand.blue, backgroundColor: brand.blueSoft, padding: 11, flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 8 },
  pendingBox: { borderRadius: 13, borderWidth: 1, borderColor: brand.orange, backgroundColor: brand.orangeSoft, padding: 11, flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 8 },
  input: { minHeight: 52, borderRadius: 13, borderWidth: 1, borderColor: brand.border, backgroundColor: '#FFFFFF', paddingHorizontal: 13, color: brand.text, fontSize: 14 },
  primaryButton: { minHeight: 52, borderRadius: 14, backgroundColor: brand.blue, alignItems: 'center' as const, justifyContent: 'center' as const },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' as const },
  secondaryButton: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: brand.blue, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, backgroundColor: '#FFFFFF' },
  secondaryText: { color: brand.blue, fontSize: 13, fontWeight: '900' as const },
};
