import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { Camera, ExternalLink, File, FileUp, ImageIcon, Trash2, X } from 'lucide-react-native';
import { createElement, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { brand } from '@/constants/operator-brand';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { Database } from '@/types/supabase';

type DocumentRow = Database['public']['Tables']['documents']['Row'] & { category_id?: string | null };
type DocumentCategory = {
  id: string;
  label: string;
  slug?: string | null;
  color?: string | null;
  bg?: string | null;
  sort_order?: number | null;
};
type Filter = 'all' | 'photos' | `category:${string}`;

export default function DocumentsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [uploadCategoryId, setUploadCategoryId] = useState<string | null>(null);
  const [jobId, setJobId] = useState('');
  const [previewDocument, setPreviewDocument] = useState<DocumentRow | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['document-categories'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('document_categories')
        .select('id, label, slug, color, bg, sort_order')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as DocumentCategory[];
    },
  });

  const query = useQuery({
    queryKey: ['admin-documents'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('documents') as any).select('*').order('created_at', { ascending: false }).limit(250);
      if (error) throw error;
      return (data ?? []) as DocumentRow[];
    },
  });
  const categories = categoriesQuery.data ?? [];
  const selectedUploadCategory = categories.find((category) => category.id === uploadCategoryId) ?? categories[0] ?? null;
  const filters = useMemo(
    () => [
      { key: 'all' as Filter, label: 'All' },
      { key: 'photos' as Filter, label: 'Photos' },
      ...categories.map((category) => ({ key: `category:${category.id}` as Filter, label: category.label })),
    ],
    [categories],
  );
  const documents = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (query.data ?? []).filter((document) => {
      const isImage = document.mime_type?.startsWith('image/') ?? false;
      const categoryId = filter.startsWith('category:') ? filter.replace('category:', '') : null;
      const filterMatches =
        filter === 'all' ||
        (filter === 'photos' && isImage) ||
        (categoryId != null && document.category_id === categoryId);
      const searchMatches = !needle || [document.name, document.notes, document.job_id].filter(Boolean).some((value) => String(value).toLowerCase().includes(needle));
      return filterMatches && searchMatches;
    });
  }, [filter, query.data, search]);

  const upload = useMutation({
    mutationFn: async ({ uri, name, mimeType, size }: { uri: string; name: string; mimeType: string; size?: number | null }) => {
      if (!user) throw new Error('Your admin session has expired.');
      const extension = name.includes('.') ? name.split('.').pop()!.toLowerCase() : extensionForMime(mimeType);
      const safeJob = jobId.trim() || 'general';
      const path = `documents/${safeJob}/${uniqueId()}.${extension}`;
      const response = await fetch(uri);
      if (!response.ok) throw new Error('The selected file could not be read.');
      const body = await response.arrayBuffer();
      const { error: storageError } = await supabase.storage.from('media').upload(path, body, { contentType: mimeType, upsert: false });
      if (storageError) throw storageError;
      const fallbackType = selectedUploadCategory?.slug || selectedUploadCategory?.label || 'document';
      const { error: rowError } = await (supabase.from('documents') as any).insert({
        name,
        file_path: path,
        file_size: size ?? body.byteLength,
        mime_type: mimeType,
        document_type: fallbackType,
        category_id: selectedUploadCategory?.id ?? null,
        job_id: jobId.trim() || null,
        user_id: user.id,
      });
      if (rowError) {
        await supabase.storage.from('media').remove([path]);
        throw rowError;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
      Alert.alert('Uploaded', 'The document is now available in the admin library.');
    },
    onError: (error) => Alert.alert('Upload failed', messageOf(error)),
  });

  const recategorize = useMutation({
    mutationFn: async ({ documentId, categoryId }: { documentId: string; categoryId: string }) => {
      const category = categories.find((item) => item.id === categoryId);
      const { error } = await (supabase.from('documents') as any)
        .update({ category_id: categoryId, document_type: category?.slug || category?.label || 'document' })
        .eq('id', documentId);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-documents'] }),
    onError: (error) => Alert.alert('Category update failed', messageOf(error)),
  });

  const remove = useMutation({
    mutationFn: async (document: DocumentRow) => {
      const { error: storageError } = await supabase.storage.from('media').remove([document.file_path]);
      if (storageError) throw storageError;
      const { error: rowError } = await supabase.from('documents').delete().eq('id', document.id);
      if (rowError) throw new Error(`File removed from storage, but the database row could not be deleted: ${rowError.message}`);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-documents'] }),
    onError: (error) => Alert.alert('Delete failed', messageOf(error)),
  });

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (result.canceled) return;
    const asset = result.assets[0];
    upload.mutate({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType || 'application/octet-stream', size: asset.size });
  };
  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission needed', 'Allow photo access to upload images.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (result.canceled) return;
    const asset = result.assets[0];
    upload.mutate({ uri: asset.uri, name: asset.fileName || `photo-${Date.now()}.jpg`, mimeType: asset.mimeType || 'image/jpeg', size: asset.fileSize });
  };

  return (
    <OperatorScreen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <OperatorPageHeader title="Documents" subtitle="Upload, preview, open, filter, and remove admin files." />
      <OperatorCard>
        <Text style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>Upload</Text>
        <TextInput value={jobId} onChangeText={setJobId} placeholder="Optional job ID" placeholderTextColor="#94A3B8" style={styles.input} />
        <Text style={styles.label}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {categoriesQuery.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
          {categories.map((category) => {
            const selected = selectedUploadCategory?.id === category.id;
            return (
              <Pressable key={category.id} onPress={() => setUploadCategoryId(category.id)} style={{ backgroundColor: selected ? category.color || brand.blue : category.bg || brand.blueSoft, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 }}>
                <Text style={{ color: selected ? '#FFFFFF' : category.color || brand.navy, fontSize: 10, fontWeight: '900' }}>{category.label}</Text>
              </Pressable>
            );
          })}
          {!categoriesQuery.isLoading && categories.length === 0 ? <Text selectable style={{ color: brand.muted, fontSize: 12 }}>No categories available.</Text> : null}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <UploadButton label="Choose file" icon={<FileUp color="#FFFFFF" size={18} />} disabled={upload.isPending} onPress={() => void pickFile()} />
          <UploadButton label="Choose photo" icon={<Camera color="#FFFFFF" size={18} />} disabled={upload.isPending} onPress={() => void pickPhoto()} />
        </View>
      </OperatorCard>

      <TextInput value={search} onChangeText={setSearch} placeholder="Search documents…" placeholderTextColor="#94A3B8" style={styles.input} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        {filters.map((item) => (
          <Pressable key={item.key} onPress={() => setFilter(item.key)} style={{ backgroundColor: filter === item.key ? brand.blue : brand.surface, borderWidth: 1, borderColor: filter === item.key ? brand.blue : brand.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ color: filter === item.key ? '#FFFFFF' : brand.text, fontSize: 11, fontWeight: '900' }}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {query.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
      {query.error ? <OperatorCard><Text selectable style={{ color: brand.red }}>{messageOf(query.error)}</Text></OperatorCard> : null}
      {!query.isLoading && !query.error && documents.length === 0 ? <OperatorCard><File color={brand.blue} size={28} /><Text style={{ color: brand.text, fontWeight: '900', fontSize: 17 }}>No documents</Text><Text style={{ color: brand.muted }}>Nothing matches this filter yet.</Text></OperatorCard> : null}
      {documents.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
          categories={categories}
          onCategoryChange={(categoryId) => recategorize.mutate({ documentId: document.id, categoryId })}
          onPreview={() => setPreviewDocument(document)}
          onDelete={() => Alert.alert('Delete document?', 'The storage object and database record will both be removed.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(document) }])}
        />
      ))}
      <DocumentPreviewModal document={previewDocument} onClose={() => setPreviewDocument(null)} />
    </OperatorScreen>
  );
}

function DocumentCard({
  document,
  categories,
  onCategoryChange,
  onPreview,
  onDelete,
}: {
  document: DocumentRow;
  categories: DocumentCategory[];
  onCategoryChange: (categoryId: string) => void;
  onPreview: () => void;
  onDelete: () => void;
}) {
  const isImage = document.mime_type?.startsWith('image/') ?? false;
  const category = categories.find((item) => item.id === document.category_id) ?? null;
  const { data } = supabase.storage.from('media').getPublicUrl(document.file_path);
  return (
    <OperatorCard>
      <Pressable accessibilityLabel={`Preview ${document.name}`} accessibilityRole="button" onPress={onPreview}>
        {isImage ? <Image source={data.publicUrl} contentFit="cover" style={{ width: '100%', height: 170, borderRadius: 13, backgroundColor: brand.blueSoft }} /> : <View style={{ height: 82, borderRadius: 13, backgroundColor: brand.blueSoft, alignItems: 'center', justifyContent: 'center' }}><File color={brand.blue} size={34} /></View>}
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {isImage ? <ImageIcon color={brand.blue} size={20} /> : <File color={brand.blue} size={20} />}
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: brand.text, fontWeight: '900' }}>{document.name}</Text>
          <Text style={{ color: brand.muted, fontSize: 11 }}>{category?.label ?? titleCase(String(document.document_type))} · {new Date(document.created_at).toLocaleDateString()}</Text>
        </View>
        <Pressable accessibilityLabel="Delete document" onPress={onDelete} style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: brand.redSoft, alignItems: 'center', justifyContent: 'center' }}><Trash2 color={brand.red} size={18} /></Pressable>
      </View>
      {categories.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {categories.map((item) => {
            const selected = item.id === document.category_id;
            return (
              <Pressable key={item.id} onPress={() => onCategoryChange(item.id)} style={{ backgroundColor: selected ? item.color || brand.blue : item.bg || brand.surface, borderWidth: 1, borderColor: selected ? item.color || brand.blue : brand.border, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 7 }}>
                <Text style={{ color: selected ? '#FFFFFF' : item.color || brand.text, fontSize: 10, fontWeight: '900' }}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <Pressable onPress={onPreview} style={{ height: 44, borderRadius: 12, borderWidth: 1, borderColor: brand.blue, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: brand.blue, fontWeight: '900' }}>Preview document</Text></Pressable>
    </OperatorCard>
  );
}

function DocumentPreviewModal({ document, onClose }: { document: DocumentRow | null; onClose: () => void }) {
  const isImage = document?.mime_type?.startsWith('image/') ?? false;
  const url = document ? supabase.storage.from('media').getPublicUrl(document.file_path).data.publicUrl : '';
  const previewable = Boolean(url) && canEmbedPreview(document?.mime_type);
  const openFullDocument = async () => {
    if (!url) return;
    await WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET });
  };

  return (
    <Modal animationType="slide" transparent visible={Boolean(document)} onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(7,21,47,0.34)' }}>
        <Pressable accessibilityLabel="Close document preview" onPress={onClose} style={{ position: 'absolute', inset: 0 }} />
        <View
          style={{
            width: '100%',
            maxWidth: 448,
            alignSelf: 'center',
            maxHeight: '82%',
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            borderCurve: 'continuous',
            backgroundColor: brand.surface,
            borderWidth: 1,
            borderColor: brand.border,
            padding: 18,
            gap: 14,
            boxShadow: '0 -18px 44px rgba(7,21,47,0.24)',
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text selectable numberOfLines={1} style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>{document?.name ?? 'Document preview'}</Text>
              <Text style={{ color: brand.muted, fontSize: 12, fontWeight: '700' }}>{document ? `${titleCase(document.document_type)} · ${document.mime_type || 'File'}` : ''}</Text>
            </View>
            <Pressable accessibilityLabel="Close preview" accessibilityRole="button" onPress={onClose} style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: brand.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
              <X color={brand.text} size={20} strokeWidth={2.5} />
            </Pressable>
          </View>

          {isImage ? (
            <Image source={url} contentFit="contain" style={{ width: '100%', height: 330, borderRadius: 18, backgroundColor: brand.bg }} />
          ) : previewable ? (
            <EmbeddedDocumentPreview url={url} />
          ) : (
            <View style={{ minHeight: 260, borderRadius: 18, backgroundColor: brand.blueSoft, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }}>
              <File color={brand.blue} size={54} strokeWidth={2.2} />
              <Text selectable style={{ color: brand.text, fontSize: 20, fontWeight: '900', textAlign: 'center' }}>{document?.name ?? 'Manual document'}</Text>
              <Text selectable style={{ color: brand.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' }}>
                This file type cannot be previewed inline yet. Use “Open full document” to view it in the in-app browser sheet.
              </Text>
            </View>
          )}

          <View style={{ borderRadius: 16, borderWidth: 1, borderColor: brand.border, padding: 12, gap: 6 }}>
            <PreviewMeta label="Storage path" value={document?.file_path ?? '—'} />
            <PreviewMeta label="Job ID" value={document?.job_id ?? 'General'} />
            <PreviewMeta label="Uploaded" value={document?.created_at ? new Date(document.created_at).toLocaleString() : '—'} />
            <PreviewMeta label="Size" value={formatFileSize(document?.file_size)} />
          </View>

          <Pressable onPress={() => void openFullDocument()} style={{ minHeight: 48, borderRadius: 14, backgroundColor: brand.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ExternalLink color="#FFFFFF" size={18} strokeWidth={2.4} />
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>Open full document</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function EmbeddedDocumentPreview({ url }: { url: string }) {
  if (Platform.OS !== 'web') {
    return (
      <View style={{ minHeight: 260, borderRadius: 18, backgroundColor: brand.blueSoft, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }}>
        <File color={brand.blue} size={54} strokeWidth={2.2} />
        <Text selectable style={{ color: brand.text, fontSize: 20, fontWeight: '900', textAlign: 'center' }}>Preview available on web</Text>
        <Text selectable style={{ color: brand.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' }}>
          Native inline PDF preview needs a WebView or PDF viewer dependency. Use “Open full document” for now.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ height: 420, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: brand.border, backgroundColor: brand.bg }}>
      {createElement('iframe', {
        src: url,
        title: 'Document preview',
        style: { width: '100%', height: '100%', border: 0, background: '#FFFFFF' },
      })}
    </View>
  );
}

function canEmbedPreview(mimeType?: string | null) {
  if (!mimeType) return false;
  return mimeType === 'application/pdf' || mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'text/html';
}

function PreviewMeta({ label, value }: { label: string; value: string }) {
  return <View style={{ flexDirection: 'row', gap: 8 }}><Text style={{ width: 92, color: brand.text, fontSize: 11, fontWeight: '900' }}>{label}</Text><Text selectable numberOfLines={2} style={{ flex: 1, color: brand.muted, fontSize: 11, lineHeight: 16 }}>{value}</Text></View>;
}

function UploadButton({ label, icon, disabled, onPress }: { label: string; icon: React.ReactNode; disabled: boolean; onPress: () => void }) {
  return <Pressable disabled={disabled} onPress={onPress} style={{ flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: brand.blue, opacity: disabled ? 0.55 : 1, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' }}>{icon}<Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>{label}</Text></Pressable>;
}
const styles = {
  input: { minHeight: 46, borderWidth: 1, borderColor: brand.border, borderRadius: 12, backgroundColor: brand.surface, paddingHorizontal: 12, color: brand.text },
  label: { color: brand.text, fontSize: 12, fontWeight: '900' as const },
};
const uniqueId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const extensionForMime = (mime: string) => mime.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
const titleCase = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const messageOf = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong.');
const formatFileSize = (size?: number | null) => {
  if (!size) return '—';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};
