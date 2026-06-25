import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Eye, Save, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Switch, Text, TextInput, View, type NativeSyntheticEvent, type TextInputSelectionChangeEventData } from 'react-native';
import { WebView } from 'react-native-webview';

import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { brand } from '@/constants/operator-brand';
import {
  type AdminDocumentTemplate,
  type TemplatePayload,
  useDeleteTemplate,
  usePreviewTemplate,
  useTemplate,
  useTemplateList,
  useUpsertTemplate,
} from '@/hooks/use-admin-document-templates';
import { errorMessage } from '@/lib/data';
import { supabase } from '@/lib/supabase';

type DocumentCategory = {
  id: string;
  label: string;
  slug?: string | null;
  color?: string | null;
  bg?: string | null;
  sort_order?: number | null;
};

type FormState = {
  template_name: string;
  slug: string;
  document_type: string;
  category_id: string | null;
  body_html: string;
  signature_required: boolean;
  required_for_job: boolean;
  is_active: boolean;
  display_order: string;
};

const FALLBACK_DOCUMENT_TYPES = ['estimate', 'contract', 'invoice', 'receipt', 'bill_of_lading', 'checklist', 'other'];
const EMPTY_FORM: FormState = {
  template_name: '',
  slug: '',
  document_type: 'contract',
  category_id: null,
  body_html: '<h1>{{company.name}}</h1>\n<p>{{customer.name}}</p>',
  signature_required: true,
  required_for_job: false,
  is_active: true,
  display_order: '0',
};

export function TemplateEditorScreen({ templateId }: { templateId?: string }) {
  const isNew = !templateId;
  const template = useTemplate(templateId);
  const templateList = useTemplateList();
  const categories = useDocumentCategories();
  const upsert = useUpsertTemplate();
  const remove = useDeleteTemplate();
  const preview = usePreviewTemplate();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [previewHtml, setPreviewHtml] = useState('');
  const [missingTokens, setMissingTokens] = useState<string[]>([]);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!template.data?.template) return;
    setForm(formFromTemplate(template.data.template));
  }, [template.data?.template]);

  const documentTypes = useMemo(() => {
    const values = new Set<string>(FALLBACK_DOCUMENT_TYPES);
    categories.data?.forEach((category) => {
      if (category.slug) values.add(category.slug);
    });
    templateList.data?.forEach((item) => {
      if (item.document_type) values.add(item.document_type);
    });
    return Array.from(values);
  }, [categories.data, templateList.data]);

  const mergeTokens = template.data?.merge_tokens ?? defaultMergeTokens();
  const loading = template.isLoading || categories.isLoading || (!isNew && templateList.isLoading);
  const saveDisabled = upsert.isPending || !form.template_name.trim() || !form.slug.trim() || !form.document_type.trim() || !form.body_html.trim();

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setLocalError('');
    setForm((current) => ({ ...current, [key]: value }));
  };

  const insertToken = (token: string) => {
    const value = form.body_html;
    const before = value.slice(0, selection.start);
    const after = value.slice(selection.end);
    const next = `${before}${token}${after}`;
    const cursor = before.length + token.length;
    setForm((current) => ({ ...current, body_html: next }));
    setSelection({ start: cursor, end: cursor });
  };

  const buildPayload = (override?: Partial<FormState>): TemplatePayload => {
    const next = { ...form, ...override };
    return {
      template_id: templateId,
      slug: next.slug.trim(),
      template_name: next.template_name.trim(),
      document_type: next.document_type.trim(),
      category_id: next.category_id || null,
      body_html: next.body_html,
      signature_required: next.signature_required,
      required_for_job: next.required_for_job,
      is_active: next.is_active,
      display_order: parseIntegerOrNull(next.display_order),
    };
  };

  const save = async (override?: Partial<FormState>) => {
    try {
      const result = await upsert.mutateAsync(buildPayload(override));
      Alert.alert(result.version_bumped ? `Saved as v${result.template.version}` : 'Template saved');
      if (isNew) router.replace(`/templates/${result.template.id}`);
    } catch (error) {
      setLocalError(errorMessage(error));
    }
  };

  const runPreview = async () => {
    try {
      const result = await preview.mutateAsync({
        template_id: isNew ? undefined : templateId,
        body_html: form.body_html,
      });
      setMissingTokens(result.missing_tokens ?? []);
      setPreviewHtml(result.html);
    } catch (error) {
      setLocalError(errorMessage(error));
    }
  };

  const deleteTemplate = () => {
    if (!templateId) return;
    Alert.alert('Delete template?', 'This soft-deletes the template by deactivating it unless generated documents block deletion.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove.mutateAsync(templateId);
            Alert.alert('Template deleted');
            router.replace('/templates');
          } catch (error) {
            const message = errorMessage(error);
            const docCount = extractDocCount(message);
            if (message.includes('409') || docCount != null) {
              Alert.alert(
                'Template in use',
                `${docCount ?? 'Some'} generated documents reference this template — deactivate instead?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Deactivate', onPress: () => void save({ is_active: false }) },
                ],
              );
              return;
            }
            setLocalError(message);
          }
        },
      },
    ]);
  };

  return (
    <OperatorScreen refreshing={template.isRefetching || categories.isRefetching} onRefresh={() => {
      if (templateId) void template.refetch();
      void categories.refetch();
    }}>
      <OperatorPageHeader title={isNew ? 'New template' : 'Edit template'} subtitle="Manage template metadata and raw HTML." />
      {loading ? <ActivityIndicator color={brand.blue} /> : null}
      {template.error ? <ErrorBanner message={errorMessage(template.error)} /> : null}
      {categories.error ? <ErrorBanner message={errorMessage(categories.error)} /> : null}
      {localError ? <ErrorBanner message={localError} /> : null}

      <OperatorCard>
        <Field label="Name" value={form.template_name} onChangeText={(value) => update('template_name', value)} />
        <Field label="Slug" value={form.slug} editable={isNew} autoCapitalize="none" autoCorrect={false} onChangeText={(value) => update('slug', slugify(value))} />
        <Text style={styles.label}>Document type</Text>
        <Pills values={documentTypes} selected={form.document_type} onSelect={(value) => update('document_type', value)} />
        <Text style={styles.label}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          <Pill label="None" selected={!form.category_id} onPress={() => update('category_id', null)} />
          {categories.data?.map((category) => (
            <Pill
              key={category.id}
              label={category.label}
              selected={form.category_id === category.id}
              color={category.color}
              bg={category.bg}
              onPress={() => update('category_id', category.id)}
            />
          ))}
        </View>
        <Field label="Display order" value={form.display_order} keyboardType="number-pad" onChangeText={(value) => update('display_order', value.replace(/[^0-9-]/g, ''))} />
        <ToggleRow label="Required for job" value={form.required_for_job} onValueChange={(value) => update('required_for_job', value)} />
        <ToggleRow label="Signature required" value={form.signature_required} onValueChange={(value) => update('signature_required', value)} />
        <ToggleRow label="Active" value={form.is_active} onValueChange={(value) => update('is_active', value)} />
      </OperatorCard>

      <OperatorCard>
        <Text style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>Body HTML</Text>
        <TextInput
          value={form.body_html}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          onChangeText={(value) => update('body_html', value)}
          onSelectionChange={(event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => setSelection(event.nativeEvent.selection)}
          placeholder="<h1>{{customer.name}}</h1>"
          placeholderTextColor="#94A3B8"
          style={styles.htmlInput}
        />
      </OperatorCard>

      <OperatorCard>
        <Text style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>Merge tokens</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {mergeTokens.map((token) => (
            <Pressable key={token} onPress={() => insertToken(token)} style={styles.tokenChip}>
              <Text style={{ color: brand.blue, fontSize: 10, fontWeight: '900' }}>{token}</Text>
            </Pressable>
          ))}
        </View>
      </OperatorCard>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <ActionButton label="Preview" icon={<Eye color={brand.blue} size={17} />} secondary disabled={preview.isPending} onPress={() => void runPreview()} />
        <ActionButton label={upsert.isPending ? 'Saving...' : 'Save'} icon={<Save color="#FFFFFF" size={17} />} disabled={saveDisabled} onPress={() => void save()} />
      </View>
      {!isNew ? <ActionButton label="Delete template" icon={<Trash2 color="#FFFFFF" size={17} />} danger disabled={remove.isPending} onPress={deleteTemplate} /> : null}

      <PreviewModal html={previewHtml} missingTokens={missingTokens} onClose={() => setPreviewHtml('')} />
    </OperatorScreen>
  );
}

function useDocumentCategories() {
  return useQuery({
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
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, style, ...inputProps } = props;
  return <View style={{ gap: 6 }}><Text style={styles.label}>{label}</Text><TextInput {...inputProps} placeholderTextColor="#94A3B8" style={[styles.input, style]} /></View>;
}

function ToggleRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><Text style={{ color: brand.text, fontWeight: '900' }}>{label}</Text><Switch value={value} onValueChange={onValueChange} trackColor={{ false: brand.border, true: brand.blue }} /></View>;
}

function Pills({ values, selected, onSelect }: { values: string[]; selected: string; onSelect: (value: string) => void }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{values.map((value) => <Pill key={value} label={titleCase(value)} selected={selected === value} onPress={() => onSelect(value)} />)}</View>;
}

function Pill({ label, selected, color, bg, onPress }: { label: string; selected: boolean; color?: string | null; bg?: string | null; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: selected ? color || brand.blue : bg || brand.blueSoft }}><Text style={{ color: selected ? '#FFFFFF' : color || brand.navy, fontSize: 10, fontWeight: '900' }}>{label}</Text></Pressable>;
}

function ActionButton({ label, icon, secondary, danger, disabled, onPress }: { label: string; icon: React.ReactNode; secondary?: boolean; danger?: boolean; disabled?: boolean; onPress: () => void }) {
  const backgroundColor = danger ? brand.red : secondary ? brand.surface : brand.blue;
  return <Pressable disabled={disabled} onPress={onPress} style={{ flex: 1, minHeight: 50, borderRadius: 13, borderWidth: secondary ? 1 : 0, borderColor: brand.blue, backgroundColor, opacity: disabled ? 0.55 : 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{icon}<Text style={{ color: secondary ? brand.blue : '#FFFFFF', fontSize: 13, fontWeight: '900' }}>{label}</Text></Pressable>;
}

function ErrorBanner({ message }: { message: string }) {
  return <OperatorCard><Text selectable style={{ color: brand.red, fontSize: 13, lineHeight: 18, fontWeight: '800' }}>{message}</Text></OperatorCard>;
}

function PreviewModal({ html, missingTokens, onClose }: { html: string; missingTokens: string[]; onClose: () => void }) {
  return (
    <Modal animationType="slide" transparent visible={Boolean(html)} onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(7,21,47,0.34)' }}>
        <Pressable accessibilityLabel="Close preview" onPress={onClose} style={{ position: 'absolute', inset: 0 }} />
        <View style={styles.previewSheet}>
          <Text selectable style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>Template preview</Text>
          {missingTokens.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {missingTokens.map((token) => <View key={token} style={styles.missingChip}><Text style={{ color: brand.red, fontSize: 10, fontWeight: '900' }}>{token}</Text></View>)}
            </View>
          ) : null}
          <View style={styles.previewFrame}>
            <WebView source={{ html }} javaScriptEnabled={false} originWhitelist={['*']} style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
          </View>
          <ActionButton label="Close preview" icon={<Eye color={brand.blue} size={17} />} secondary onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const formFromTemplate = (template: AdminDocumentTemplate): FormState => ({
  template_name: template.template_name ?? '',
  slug: template.slug ?? '',
  document_type: template.document_type ?? 'contract',
  category_id: template.category_id ?? null,
  body_html: template.body_html ?? '',
  signature_required: Boolean(template.signature_required),
  required_for_job: Boolean(template.required_for_job),
  is_active: template.is_active !== false,
  display_order: String(template.display_order ?? 0),
});

const parseIntegerOrNull = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractDocCount = (message: string) => {
  const match = message.match(/"doc_count"\s*:\s*(\d+)/) ?? message.match(/doc_count[^\d]+(\d+)/);
  return match ? Number(match[1]) : null;
};

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
const titleCase = (value: string) => value.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const defaultMergeTokens = () => ['{{customer.name}}', '{{job.job_number}}', '{{job.origin_address}}', '{{job.destination_address}}', '{{date.today}}', '{{signature.block}}'];

const styles = {
  label: { color: brand.text, fontSize: 11, fontWeight: '900' as const, textTransform: 'uppercase' as const },
  input: { minHeight: 46, borderWidth: 1, borderColor: brand.border, borderRadius: 12, backgroundColor: brand.surface, paddingHorizontal: 12, color: brand.text, fontSize: 13 },
  htmlInput: { minHeight: 280, borderWidth: 1, borderColor: brand.border, borderRadius: 12, backgroundColor: '#FBFCFE', padding: 12, color: brand.text, fontSize: 12, lineHeight: 18, fontFamily: 'Courier', textAlignVertical: 'top' as const },
  tokenChip: { borderRadius: 999, borderWidth: 1, borderColor: brand.blue, backgroundColor: brand.blueSoft, paddingHorizontal: 9, paddingVertical: 7 },
  previewSheet: { width: '100%' as const, maxWidth: 720, maxHeight: '88%' as const, alignSelf: 'center' as const, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: brand.border, backgroundColor: brand.surface, padding: 14, gap: 10 },
  previewFrame: { height: 520, minHeight: 320, borderRadius: 16, borderWidth: 1, borderColor: brand.border, overflow: 'hidden' as const, backgroundColor: '#FFFFFF' },
  missingChip: { borderRadius: 999, backgroundColor: brand.redSoft, paddingHorizontal: 9, paddingVertical: 5 },
};
