import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Check, FileText, LockKeyhole } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { DocumentViewer, HtmlSnapshotModal } from '@/components/documents/document-viewer';
import { brand } from '@/constants/operator-brand';
import type { Document, DocumentDetail } from '@/lib/data';
import { errorMessage } from '@/lib/data';
import { invokeSupabaseFunction } from '@/lib/supabase-functions';

type SignResponse = {
  document?: Document;
  signed?: boolean;
  signer_name?: string | null;
  signed_at?: string | null;
};

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const documentId = Array.isArray(id) ? id[0] : id;
  const queryClient = useQueryClient();
  const [signerName, setSignerName] = useState('');
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');
  const [htmlPreviewOpen, setHtmlPreviewOpen] = useState(false);

  const detail = useQuery({
    queryKey: ['document', documentId],
    enabled: Boolean(documentId),
    queryFn: async () => {
      if (!documentId) throw new Error('Missing document id.');
      return invokeSupabaseFunction<DocumentDetail>('mobile-get-document-detail', { body: { document_id: documentId } });
    },
  });

  const document = detail.data?.document ?? null;
  const signed = Boolean(detail.data?.signed || document?.is_signed);

  const sign = useMutation({
    mutationFn: async () => {
      if (!document) throw new Error('Document is not available.');
      const trimmed = signerName.trim();
      if (trimmed.length < 2) throw new Error('Enter your full legal name.');
      return invokeSupabaseFunction<SignResponse>('mobile-sign-document', { body: { document_id: document.id, signer_name: trimmed } });
    },
    onSuccess: async () => {
      setSuccess('Document signed.');
      setSignerName('');
      await queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      await queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
    },
    onError: async (error) => {
      const message = errorMessage(error);
      if (message.includes('409') || message.toLowerCase().includes('already signed')) {
        setSuccess('This document is already signed.');
        await queryClient.invalidateQueries({ queryKey: ['document', documentId] });
        await queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
        return;
      }
      setLocalError(message);
    },
  });

  const open = async () => {
    if (!detail.data?.signed_url) return;
    await WebBrowser.openBrowserAsync(detail.data.signed_url);
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 18, gap: 14, paddingBottom: 34, backgroundColor: brand.bg }}>
      {detail.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
      {detail.error ? <StateCard title="Document unavailable" body={detail.error instanceof Error ? detail.error.message : 'Unable to load this document.'} danger /> : null}
      {localError ? <StateCard title="Signature needed" body={localError} danger /> : null}
      {success ? <StateCard title="Signed" body={success} /> : null}
      {!detail.isLoading && !detail.error && !document ? <StateCard title="Document not found" body="This document is not available." /> : null}

      {document ? (
        <>
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 26 }]}>
            <View style={styles.iconWrap}><FileText color={brand.blue} size={32} /></View>
            <Text selectable style={styles.title}>{document.name}</Text>
            <Text selectable style={{ color: signed ? brand.green : brand.blue, fontSize: 14, fontWeight: '900' }}>
              {signed ? `Signed by ${detail.data?.signer_name ?? document.signer_name ?? 'customer'}` : 'Signature required'}
            </Text>
            {signed && (detail.data?.signed_at || document.signed_at) ? (
              <Text style={styles.body}>Signed {new Date(detail.data?.signed_at ?? document.signed_at ?? '').toLocaleString()}</Text>
            ) : null}
          </View>

          <DocumentViewer
            url={detail.data?.signed_url ?? null}
            isPdf={detail.data?.is_pdf}
            isHtmlSnapshot={detail.data?.is_html_snapshot}
            mimeType={document.mime_type}
            onOpen={open}
          />
          {detail.data?.html_preview_url ? (
            <Pressable onPress={() => setHtmlPreviewOpen(true)} style={styles.secondaryButton}>
              <FileText color={brand.blue} size={17} />
              <Text style={styles.secondaryText}>View HTML snapshot</Text>
            </Pressable>
          ) : null}

          {signed ? (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Check color={brand.green} size={20} />
                <Text selectable style={{ color: brand.green, fontSize: 16, fontWeight: '900' }}>Signature complete</Text>
              </View>
              <Text selectable style={styles.body}>This document is locked because it has already been signed.</Text>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <LockKeyhole color={brand.blue} size={19} />
                <Text style={styles.sectionTitle}>Sign document</Text>
              </View>
              <Text selectable style={styles.body}>Type your full legal name to sign this document.</Text>
              <TextInput
                value={signerName}
                onChangeText={(value) => {
                  setSignerName(value);
                  setLocalError('');
                  setSuccess('');
                }}
                editable={!sign.isPending}
                placeholder="Your full legal name"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
              <Pressable
                disabled={sign.isPending || signerName.trim().length < 2}
                onPress={() => { setLocalError(''); sign.mutate(); }}
                style={[styles.primaryButton, { opacity: sign.isPending || signerName.trim().length < 2 ? 0.55 : 1 }]}>
                <Text style={styles.primaryText}>{sign.isPending ? 'Signing...' : 'Sign document'}</Text>
              </Pressable>
            </View>
          )}
        </>
      ) : null}
      <HtmlSnapshotModal title="HTML snapshot" url={detail.data?.html_preview_url} visible={htmlPreviewOpen} onClose={() => setHtmlPreviewOpen(false)} />
    </ScrollView>
  );
}

function StateCard({ title, body, danger }: { title: string; body: string; danger?: boolean }) {
  return <View style={[styles.card, danger ? { borderColor: brand.red, backgroundColor: brand.redSoft } : null]}><Text selectable style={{ color: danger ? brand.red : brand.text, fontSize: 17, fontWeight: '900' }}>{title}</Text><Text selectable style={styles.body}>{body}</Text></View>;
}

const styles = {
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, borderCurve: 'continuous' as const, borderWidth: 1, borderColor: brand.border, padding: 16, gap: 12, boxShadow: '0 2px 8px rgba(15,23,42,0.05)' },
  iconWrap: { width: 68, height: 68, borderRadius: 20, backgroundColor: brand.blueSoft, alignItems: 'center' as const, justifyContent: 'center' as const },
  title: { color: brand.text, fontSize: 22, lineHeight: 28, fontWeight: '900' as const, textAlign: 'center' as const },
  sectionTitle: { color: brand.text, fontSize: 18, fontWeight: '900' as const },
  body: { color: brand.muted, fontSize: 13, lineHeight: 19 },
  input: { minHeight: 52, borderRadius: 13, borderWidth: 1, borderColor: brand.border, backgroundColor: '#FFFFFF', paddingHorizontal: 13, color: brand.text, fontSize: 14 },
  primaryButton: { minHeight: 52, borderRadius: 14, backgroundColor: brand.blue, alignItems: 'center' as const, justifyContent: 'center' as const },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' as const },
  secondaryButton: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: brand.blue, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, paddingHorizontal: 12, backgroundColor: '#FFFFFF' },
  secondaryText: { color: brand.blue, fontSize: 13, fontWeight: '900' as const },
};
