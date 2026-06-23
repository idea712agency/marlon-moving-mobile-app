import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, Text, TextInput, View } from 'react-native';

import { Card, ErrorState, Icon, LoadingState, PrimaryButton } from '@/components/ui';
import { colors, layout } from '@/constants/theme';
import type { Document } from '@/lib/data';
import { errorMessage } from '@/lib/data';
import { supabase } from '@/lib/supabase';

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [signerName, setSignerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    supabase.from('documents').select('*').eq('id', id).maybeSingle().then(({ data, error: queryError }) => {
      if (queryError) setError(errorMessage(queryError));
      setDocument(data);
      setLoading(false);
    });
  }, [id]);
  const sign = async () => {
    if (!document || !signerName.trim()) return;
    setBusy(true); setError('');
    const { data, error: invokeError } = await supabase.functions.invoke('mobile-sign-document', { body: { document_id: document.id, signer_name: signerName.trim() } });
    if (invokeError) setError(errorMessage(invokeError)); else setDocument((data as { document: Document }).document);
    setBusy(false);
  };
  const open = async () => {
    if (!document) return;
    const url = document.file_path.startsWith('http') ? document.file_path : supabase.storage.from('media').getPublicUrl(document.file_path).data.publicUrl;
    await Linking.openURL(url);
  };
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: layout.screen, gap: 18, paddingBottom: 34 }}>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {document ? (
        <>
          <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
            <View style={{ width: 68, height: 68, borderRadius: 20, backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center' }}><Icon ios="doc.text.fill" android="description" size={34} /></View>
            <Text selectable style={{ color: colors.text, fontSize: 22, fontWeight: '900', textAlign: 'center' }}>{document.name}</Text>
            <Text selectable style={{ color: document.is_signed ? colors.success : colors.primary, fontWeight: '800' }}>{document.is_signed ? `Signed by ${document.signer_name ?? 'customer'}` : 'Signature required'}</Text>
          </Card>
          <PrimaryButton label="Open Document" secondary onPress={open} />
          {!document.is_signed ? <Card><Text selectable style={{ color: colors.text, fontWeight: '800' }}>Signer name</Text><TextInput value={signerName} onChangeText={setSignerName} placeholder="Your full legal name" placeholderTextColor={colors.grayIcon} style={{ height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 13, paddingHorizontal: 14, color: colors.text }} /><PrimaryButton label={busy ? 'Signing…' : 'Sign Document'} onPress={sign} /></Card> : null}
        </>
      ) : null}
    </ScrollView>
  );
}
