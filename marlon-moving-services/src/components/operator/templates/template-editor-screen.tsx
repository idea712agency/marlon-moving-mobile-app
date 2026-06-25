import { useQuery } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { AlertTriangle, Eye, FileUp, History, Save, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Switch, Text, TextInput, useWindowDimensions, View, type NativeSyntheticEvent, type TextInputSelectionChangeEventData } from 'react-native';

import { HtmlViewer } from '@/components/documents/html-viewer';
import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { brand } from '@/constants/operator-brand';
import {
  type AdminDocumentTemplate,
  type TemplatePayload,
  type TemplateResolvedToken,
  type TemplateTokenCatalogItem,
  type TemplateVersionUsageSummary,
  useDeleteTemplate,
  usePreviewTemplate,
  useTemplate,
  useTemplateList,
  useTemplateVersionUsage,
  useUploadTemplateSource,
  useUpsertTemplate,
} from '@/hooks/use-admin-document-templates';
import { useMoves } from '@/hooks/use-moves';
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
  docx_template_path: string | null;
  signature_required: boolean;
  required_for_job: boolean;
  is_active: boolean;
  display_order: string;
  requires: string[];
};

type PreviewMode = 'preview' | 'tokens';

const FALLBACK_DOCUMENT_TYPES = ['estimate', 'contract', 'invoice', 'receipt', 'bill_of_lading', 'checklist', 'other'];
const EMPTY_FORM: FormState = {
  template_name: '',
  slug: '',
  document_type: 'contract',
  category_id: null,
  body_html: '<h1>{{company.name}}</h1>\n<p>{{customer.name}}</p>',
  docx_template_path: null,
  signature_required: true,
  required_for_job: false,
  is_active: true,
  display_order: '0',
  requires: [],
};

export function TemplateEditorScreen({ templateId }: { templateId?: string }) {
  const isNew = !templateId;
  const { width } = useWindowDimensions();
  const template = useTemplate(templateId);
  const templateList = useTemplateList();
  const moves = useMoves('all');
  const categories = useDocumentCategories();
  const upsert = useUpsertTemplate();
  const uploadSource = useUploadTemplateSource();
  const remove = useDeleteTemplate();
  const preview = usePreviewTemplate();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [savedForm, setSavedForm] = useState<FormState>(EMPTY_FORM);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [previewHtml, setPreviewHtml] = useState('');
  const [missingTokens, setMissingTokens] = useState<string[]>([]);
  const [resolvedTokens, setResolvedTokens] = useState<TemplateResolvedToken[]>([]);
  const [previewSource, setPreviewSource] = useState<'docx' | 'body_html' | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('preview');
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [uploadVersionMessage, setUploadVersionMessage] = useState('');
  const [localError, setLocalError] = useState('');
  const [previewJobId, setPreviewJobId] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<TemplateVersionUsageSummary | null>(null);

  useEffect(() => {
    if (!template.data?.template) return;
    const next = formFromTemplate(template.data.template);
    setForm(next);
    setSavedForm(next);
  }, [template.data?.template]);

  const previewJobs = useMemo(() => {
    const items = moves.data ?? [];
    const seeds = items.filter((item) => String(item.job_number ?? '').startsWith('MMS-SEED'));
    const recent = items.filter((item) => !String(item.job_number ?? '').startsWith('MMS-SEED')).slice(0, 8);
    return [...seeds, ...recent];
  }, [moves.data]);

  useEffect(() => {
    if (previewJobId || !previewJobs.length) return;
    setPreviewJobId(previewJobs[0]?.id ?? '');
  }, [previewJobId, previewJobs]);

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

  const tokenCatalog = template.data?.token_catalog ?? template.data?.tokenCatalog ?? [];
  const detailTemplate = template.data?.template;
  const mergeTokens = tokenCatalog.length ? tokenCatalog.map((item) => item.token) : template.data?.merge_tokens ?? defaultMergeTokens();
  const versionUsage = detailTemplate?.version_usage ?? template.data?.version_usage ?? [];
  const usageCount = detailTemplate?.usage_count ?? template.data?.usage_count ?? 0;
  const loading = template.isLoading || categories.isLoading || (!isNew && templateList.isLoading);
  const dirty = isNew || formFingerprint(form) !== formFingerprint(savedForm);
  const saveDisabled = upsert.isPending || !dirty || !form.template_name.trim() || !form.slug.trim() || !form.document_type.trim() || !form.body_html.trim();
  const wideLayout = width >= 980;

  useEffect(() => {
    if (!previewJobId.trim() || !form.body_html.trim()) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void preview.mutateAsync({
        template_id: templateId,
        body_html: form.body_html,
        job_id: previewJobId.trim(),
      }).then((result) => {
        if (cancelled) return;
        setLocalError('');
        setMissingTokens(result.missing_tokens ?? []);
        setResolvedTokens(result.resolved_tokens ?? []);
        setPreviewSource(result.html_source ?? null);
        setPreviewHtml(result.html);
      }).catch((error) => {
        if (!cancelled) setLocalError(errorMessage(error));
      });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.body_html, previewJobId, templateId]);

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
      docx_template_path: next.docx_template_path || null,
      source_file_path: next.docx_template_path || null,
      signature_required: next.signature_required,
      required_for_job: next.required_for_job,
      is_active: next.is_active,
      display_order: parseIntegerOrNull(next.display_order),
      requires: next.requires,
    };
  };

  const save = async (override?: Partial<FormState>) => {
    try {
      const result = await upsert.mutateAsync(buildPayload(override));
      Alert.alert(`Saved v${result.new_version ?? result.template.version}`);
      const next = formFromTemplate(result.template);
      setForm(next);
      setSavedForm(next);
      if (isNew) router.replace(`/templates/${result.template.id}`);
    } catch (error) {
      setLocalError(errorMessage(error));
    }
  };

  const runPreview = async () => {
    try {
      if (!previewJobId.trim()) {
        setLocalError('Enter a job ID to preview this template with real move data.');
        return;
      }
      const result = await preview.mutateAsync({
        template_id: templateId,
        body_html: form.body_html,
        job_id: previewJobId.trim(),
      });
      setMissingTokens(result.missing_tokens ?? []);
      setResolvedTokens(result.resolved_tokens ?? []);
      setPreviewSource(result.html_source ?? null);
      setPreviewHtml(result.html);
      setLocalError('');
    } catch (error) {
      setLocalError(errorMessage(error));
    }
  };

  const uploadDocxSource = async () => {
    try {
      setLocalError('');
      setUploadWarnings([]);
      const slug = form.slug.trim();
      if (!slug) {
        setLocalError('Add a slug before uploading a DOCX source.');
        return;
      }
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: [
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
        ],
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.name.toLowerCase().endsWith('.docx')) {
        setLocalError('Choose a .docx Word document.');
        return;
      }
      if ((asset.size ?? 0) > 2 * 1024 * 1024) {
        setLocalError('Choose a DOCX file that is 2 MB or smaller.');
        return;
      }
      const response = await uploadSource.mutateAsync({
        templateId,
        slug,
        file: { uri: asset.uri, name: asset.name, mimeType: asset.mimeType, file: asset.file },
      });
      setForm({ ...formFromTemplate(response.template), body_html: response.template.body_html || response.body_html_preview || '' });
      setUploadWarnings(response.warnings ?? []);
      const versionMessage = response.prev_version != null ? `Version ${response.prev_version} → ${response.new_version ?? response.template.version}` : `Version ${response.new_version ?? response.template.version}`;
      setUploadVersionMessage(versionMessage);
      Alert.alert('DOCX source uploaded', versionMessage);
      if (isNew) router.replace(`/templates/${response.template.id}`);
      if (templateId) void template.refetch();
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

      <View style={{ flexDirection: wideLayout ? 'row' : 'column', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: wideLayout ? 1 : undefined, width: wideLayout ? undefined : '100%', gap: 12 }}>
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
            <Text style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>Source DOCX</Text>
            <Text style={{ color: brand.muted, fontSize: 12, lineHeight: 17 }}>
              DOCX is the source of truth for exact PDF generation. HTML fallback is used only when no DOCX source is uploaded.
            </Text>
            <SourceMetadata template={detailTemplate} fallbackPath={form.docx_template_path} />
            {uploadVersionMessage ? <InfoBanner tone="success" title="DOCX uploaded" body={uploadVersionMessage} /> : null}
            {uploadWarnings.length ? <WarningList title="DOCX conversion warnings" items={uploadWarnings} /> : null}
            <ActionButton
              label={uploadSource.isPending ? 'Uploading...' : 'Replace DOCX'}
              icon={<FileUp color={brand.blue} size={17} />}
              secondary
              disabled={uploadSource.isPending || !form.slug.trim()}
              onPress={() => void uploadDocxSource()}
            />
            {!templateId ? <Text style={{ color: brand.muted, fontSize: 11, fontWeight: '800' }}>Enter a canonical slug to upload and auto-create the template source.</Text> : null}
          </OperatorCard>

          <OperatorCard>
            <Text style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>HTML fallback</Text>
            <Text style={{ color: brand.muted, fontSize: 12, lineHeight: 17 }}>Used only if no DOCX source is uploaded.</Text>
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
            <TokenGroups tokens={mergeTokens} onInsert={insertToken} />
          </OperatorCard>

          <OperatorCard>
            <Text style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>Required tokens</Text>
            <Text style={{ color: brand.muted, fontSize: 12, lineHeight: 17 }}>
              Selected tokens block or warn in packet readiness before generation.
            </Text>
            <RequiresEditor
              catalog={tokenCatalog}
              selected={form.requires}
              onChange={(requires) => update('requires', requires)}
            />
          </OperatorCard>
        </View>

        <View style={{ flex: wideLayout ? 1 : undefined, width: wideLayout ? undefined : '100%', gap: 12 }}>
          <OperatorCard>
            <Text style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>Live preview</Text>
            <PreviewJobSelector
              jobs={previewJobs}
              loading={moves.isLoading}
              value={previewJobId}
              onChange={setPreviewJobId}
            />
            <SegmentedControl<PreviewMode>
              value={previewMode}
              options={[
                { value: 'preview', label: 'Preview HTML' },
                { value: 'tokens', label: 'Token Inspector' },
              ]}
              onChange={setPreviewMode}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <RenderSourceChip source={previewSource} />
              {detailTemplate ? <ChipText label={`Template v${detailTemplate.version}`} color={brand.purple} bg={brand.purpleSoft} /> : null}
              {preview.isPending ? <ChipText label="Rendering..." color={brand.muted} bg={brand.bg} /> : null}
            </View>
            {previewMode === 'preview' ? (
              <View style={styles.previewFrame}>
                {previewHtml ? <HtmlViewer html={previewHtml} /> : <EmptyPreview />}
              </View>
            ) : (
              <TokenInspector missingTokens={missingTokens} resolvedTokens={resolvedTokens} />
            )}
          </OperatorCard>

          <VersionUsagePanel
            currentVersion={detailTemplate?.version ?? null}
            usageCount={usageCount}
            versionUsage={versionUsage}
            onSelectVersion={setSelectedVersion}
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ActionButton label="Preview now" icon={<Eye color={brand.blue} size={17} />} secondary disabled={preview.isPending} onPress={() => void runPreview()} />
            <ActionButton label={upsert.isPending ? 'Saving...' : 'Save'} icon={<Save color="#FFFFFF" size={17} />} disabled={saveDisabled} onPress={() => void save()} />
          </View>
          {!isNew ? <ActionButton label="Delete template" icon={<Trash2 color="#FFFFFF" size={17} />} danger disabled={remove.isPending} onPress={deleteTemplate} /> : null}
        </View>
      </View>

      <VersionUsageSheet
        templateId={templateId}
        summary={selectedVersion}
        onClose={() => setSelectedVersion(null)}
      />
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

function SourceMetadata({ template, fallbackPath }: { template?: AdminDocumentTemplate; fallbackPath?: string | null }) {
  const sourcePath = template?.source_file_path ?? template?.docx_template_path ?? fallbackPath;
  const filename = sourcePath ? sourcePath.split('/').pop() : null;
  return (
    <View style={{ borderRadius: 12, borderWidth: 1, borderColor: brand.border, backgroundColor: '#FBFCFE', padding: 12, gap: 8 }}>
      <MetaLine label="File" value={filename ?? 'No DOCX source uploaded'} />
      <MetaLine label="Path" value={sourcePath ?? '—'} />
      <MetaLine label="Uploaded" value={template?.source_uploaded_at ? formatDateTime(template.source_uploaded_at) : '—'} />
      <MetaLine label="Uploader" value={template?.source_uploaded_by ?? '—'} />
      <MetaLine label="MIME" value={template?.source_mime_type ?? '—'} />
      <MetaLine label="Version" value={`v${template?.version ?? '—'}`} />
    </View>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={styles.label}>{label}</Text>
      <Text selectable style={{ color: value === '—' ? brand.muted : brand.text, fontSize: 12, lineHeight: 17, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}

function WarningList({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.warningBox}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <AlertTriangle color={brand.orange} size={17} />
        <Text style={{ color: brand.orange, fontSize: 13, fontWeight: '900' }}>{title}</Text>
      </View>
      {items.map((item) => <Text key={item} selectable style={{ color: brand.text, fontSize: 12, lineHeight: 17 }}>• {item}</Text>)}
    </View>
  );
}

function InfoBanner({ title, body, tone }: { title: string; body: string; tone: 'success' | 'info' }) {
  const color = tone === 'success' ? brand.green : brand.blue;
  const bg = tone === 'success' ? brand.greenSoft : brand.blueSoft;
  return (
    <View style={[styles.infoBox, { borderColor: color, backgroundColor: bg }]}>
      <Text selectable style={{ color, fontSize: 13, fontWeight: '900' }}>{title}</Text>
      <Text selectable style={{ color: brand.text, fontSize: 12, lineHeight: 17 }}>{body}</Text>
    </View>
  );
}

function ChipText({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <View style={{ alignSelf: 'flex-start', borderRadius: 999, backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 6 }}><Text style={{ color, fontSize: 10, fontWeight: '900' }}>{label}</Text></View>;
}

function TokenGroups({ tokens, onInsert }: { tokens: string[]; onInsert: (token: string) => void }) {
  const groups = groupTokens(tokens);
  return (
    <View style={{ gap: 12 }}>
      {groups.map((group) => (
        <View key={group.label} style={{ gap: 7 }}>
          <Text style={styles.label}>{group.label}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {group.tokens.map((token) => (
              <Pressable key={`${group.label}-${token}`} onPress={() => onInsert(tokenMarkup(token))} style={styles.tokenChip}>
                <Text style={{ color: brand.blue, fontSize: 10, fontWeight: '900' }}>{token}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function RequiresEditor({ catalog, selected, onChange }: {
  catalog: TemplateTokenCatalogItem[];
  selected: string[];
  onChange: (tokens: string[]) => void;
}) {
  const groups = groupTokenCatalog(catalog);
  if (!groups.length) {
    return <Text selectable style={{ color: brand.muted, fontSize: 12, lineHeight: 17 }}>Token catalog is not available yet.</Text>;
  }
  const selectedSet = new Set(selected);
  const toggle = (token: string) => {
    const next = selectedSet.has(token)
      ? selected.filter((item) => item !== token)
      : [...selected, token].sort();
    onChange(next);
  };
  return (
    <View style={{ gap: 12 }}>
      {groups.map((group) => (
        <View key={group.severity} style={{ gap: 7 }}>
          <Text style={styles.label}>{severityLabel(group.severity)}</Text>
          {group.items.map((item) => {
            const checked = selectedSet.has(item.token);
            const tone = severityTone(item.severity);
            return (
              <Pressable key={item.token} onPress={() => toggle(item.token)} style={styles.requirementRow}>
                <View style={[styles.checkbox, { backgroundColor: checked ? brand.blue : brand.surface }]}>
                  <Text style={{ color: checked ? '#FFFFFF' : brand.muted, fontSize: 12, fontWeight: '900' }}>{checked ? '✓' : ''}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text selectable style={{ color: brand.text, fontSize: 13, fontWeight: '900' }}>{item.label}</Text>
                  <Text selectable style={{ color: brand.muted, fontSize: 11, lineHeight: 15 }}>{item.token}</Text>
                </View>
                <ChipText label={severityLabel(item.severity)} color={tone.color} bg={tone.bg} />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function PreviewJobSelector({
  jobs,
  loading,
  value,
  onChange,
}: {
  jobs: Array<{ id: string; job_number?: string | null; scheduled_date?: string | null; contacts?: { name?: string | null } | null }>;
  loading: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>Preview job</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        {jobs.map((job) => (
          <Pill
            key={job.id}
            label={job.job_number || job.contacts?.name || 'Job'}
            selected={value === job.id}
            color={String(job.job_number ?? '').startsWith('MMS-SEED') ? brand.purple : undefined}
            bg={String(job.job_number ?? '').startsWith('MMS-SEED') ? brand.purpleSoft : undefined}
            onPress={() => onChange(job.id)}
          />
        ))}
      </View>
      {!jobs.length ? <Text selectable style={{ color: brand.muted, fontSize: 12 }}>{loading ? 'Loading preview jobs...' : 'No recent jobs found. Paste a job ID below.'}</Text> : null}
      <Field
        label="Job ID"
        value={value}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={(next) => onChange(next.trim())}
      />
    </View>
  );
}

function SegmentedControl<T extends string>({ value, options, onChange }: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.segment, { backgroundColor: selected ? brand.blue : 'transparent' }]}>
            <Text style={{ color: selected ? '#FFFFFF' : brand.blue, fontSize: 12, fontWeight: '900' }}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function EmptyPreview() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Text selectable style={{ color: brand.muted, fontSize: 13, lineHeight: 18, textAlign: 'center' }}>Choose a preview job to render this template.</Text>
    </View>
  );
}

function TokenInspector({ missingTokens, resolvedTokens }: { missingTokens: string[]; resolvedTokens: TemplateResolvedToken[] }) {
  return (
    <ScrollView style={styles.inspectorFrame} contentContainerStyle={{ gap: 8 }}>
      {missingTokens.length ? <WarningList title="Missing tokens" items={missingTokens} /> : null}
      {!missingTokens.length && !resolvedTokens.length ? (
        <Text selectable style={{ color: brand.muted, fontSize: 12, lineHeight: 17 }}>Render a preview to inspect resolved tokens.</Text>
      ) : null}
      {resolvedTokens.map((token) => {
        const empty = token.value == null || token.value === '';
        const tone = tokenSourceTone(token.source, empty);
        return (
          <View key={`${token.token}-${token.source}`} style={styles.tokenInspectorRow}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text selectable style={{ color: brand.text, fontSize: 13, fontWeight: '900' }}>{token.token}</Text>
              <Text selectable numberOfLines={2} style={{ color: empty ? brand.orange : brand.muted, fontSize: 12, lineHeight: 17 }}>
                {empty ? 'No value resolved' : token.value}
              </Text>
            </View>
            <ChipText label={token.source} color={tone.color} bg={tone.bg} />
          </View>
        );
      })}
    </ScrollView>
  );
}

function VersionUsagePanel({ currentVersion, usageCount, versionUsage, onSelectVersion }: {
  currentVersion: number | null;
  usageCount: number;
  versionUsage: TemplateVersionUsageSummary[];
  onSelectVersion: (version: TemplateVersionUsageSummary) => void;
}) {
  const olderSigned = versionUsage.reduce((total, item) => item.version < (currentVersion ?? item.version) ? total + (item.signed ?? item.signed_count ?? 0) : total, 0);
  return (
    <OperatorCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <History color={brand.blue} size={18} />
        <Text style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>Version usage</Text>
      </View>
      <Text selectable style={{ color: brand.muted, fontSize: 12, lineHeight: 17 }}>
        {usageCount} generated document{usageCount === 1 ? '' : 's'} pinned by template version.
      </Text>
      {olderSigned && currentVersion ? (
        <InfoBanner tone="info" title="Pinned signed documents" body={`${olderSigned} signed document${olderSigned === 1 ? ' is' : 's are'} pinned to an older version. New generations use v${currentVersion}.`} />
      ) : null}
      {!versionUsage.length ? <Text selectable style={{ color: brand.muted, fontSize: 12 }}>No generated documents are pinned to this template yet.</Text> : null}
      {versionUsage.map((item) => (
        <Pressable key={item.version} onPress={() => onSelectVersion(item)} style={styles.versionRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text selectable style={{ color: brand.text, fontSize: 13, fontWeight: '900' }}>Version {item.version}{item.version === currentVersion ? ' · current' : ''}</Text>
            <Text selectable style={{ color: brand.muted, fontSize: 11, lineHeight: 15 }}>
              Last generated {item.latest_generated_at ? formatDateTime(item.latest_generated_at) : '—'}
            </Text>
          </View>
          <ChipText label={`${item.total ?? item.document_count ?? 0} docs`} color={brand.blue} bg={brand.blueSoft} />
          <ChipText label={`${item.signed ?? item.signed_count ?? 0} signed`} color={brand.green} bg={brand.greenSoft} />
        </Pressable>
      ))}
    </OperatorCard>
  );
}

function VersionUsageSheet({ templateId, summary, onClose }: { templateId?: string; summary: TemplateVersionUsageSummary | null; onClose: () => void }) {
  const version = summary?.version ?? null;
  const usage = useTemplateVersionUsage(templateId, version);
  return (
    <Modal animationType="slide" transparent visible={version != null} onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(7,21,47,0.34)' }}>
        <Pressable accessibilityLabel="Close version usage" onPress={onClose} style={{ position: 'absolute', inset: 0 }} />
        <View style={styles.previewSheet}>
          <Text selectable style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>Version {version} usage</Text>
          {usage.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
          {usage.error ? <WarningList title="Version usage unavailable" items={[errorMessage(usage.error)]} /> : null}
          {usage.data ? (
            <VersionUsageSheetContent usage={usage.data} summary={summary} />
          ) : summary && !usage.isLoading ? (
            <VersionUsageSheetSummaryOnly summary={summary} />
          ) : null}
          <ActionButton label="Close" icon={<Eye color={brand.blue} size={17} />} secondary onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function VersionUsageSheetContent({ usage, summary }: { usage: NonNullable<ReturnType<typeof useTemplateVersionUsage>['data']>; summary: TemplateVersionUsageSummary | null }) {
  const detail = usage.data ?? usage;
  const sampleDocuments = detail.sample_documents ?? detail.sample_jobs ?? [];
  const total = detail.total ?? summary?.total ?? summary?.document_count ?? 0;
  const signed = detail.signed ?? summary?.signed ?? summary?.signed_count ?? 0;
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <ChipText label={`${total} documents`} color={brand.blue} bg={brand.blueSoft} />
        <ChipText label={`${signed} signed`} color={brand.green} bg={brand.greenSoft} />
      </View>
      <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ gap: 8 }}>
        {sampleDocuments.map((document) => (
          <Pressable
            key={document.document_id}
            onPress={() => {
              if (document.job_id) router.push(`/moves/${document.job_id}`);
            }}
            style={styles.versionRow}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text selectable style={{ color: brand.text, fontSize: 13, fontWeight: '900' }}>{document.job_code || document.document_id}</Text>
                <Text selectable style={{ color: brand.muted, fontSize: 11, lineHeight: 15 }}>
                  Generated {document.generated_at ? formatDateTime(document.generated_at) : '—'}
                </Text>
              </View>
            </View>
            <ChipText label={document.is_signed ? 'Signed' : 'Draft'} color={document.is_signed ? brand.green : brand.orange} bg={document.is_signed ? brand.greenSoft : brand.orangeSoft} />
          </Pressable>
        ))}
        {!sampleDocuments.length ? <Text selectable style={{ color: brand.muted, fontSize: 12 }}>No sample documents returned.</Text> : null}
      </ScrollView>
    </View>
  );
}

function VersionUsageSheetSummaryOnly({ summary }: { summary: TemplateVersionUsageSummary }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <ChipText label={`${summary.total ?? summary.document_count ?? 0} documents`} color={brand.blue} bg={brand.blueSoft} />
        <ChipText label={`${summary.signed ?? summary.signed_count ?? 0} signed`} color={brand.green} bg={brand.greenSoft} />
      </View>
      <Text selectable style={{ color: brand.muted, fontSize: 12, lineHeight: 17 }}>No sample documents returned.</Text>
    </View>
  );
}

function RenderSourceChip({ source }: { source?: 'docx' | 'body_html' | null }) {
  if (!source) return null;
  const docx = source === 'docx';
  return (
    <View style={{ alignSelf: 'flex-start', borderRadius: 999, backgroundColor: docx ? brand.greenSoft : brand.blueSoft, paddingHorizontal: 10, paddingVertical: 6 }}>
      <Text style={{ color: docx ? brand.green : brand.blue, fontSize: 10, fontWeight: '900' }}>
        {docx ? 'Rendered from DOCX' : 'Rendered from HTML fallback'}
      </Text>
    </View>
  );
}

const formFromTemplate = (template: AdminDocumentTemplate): FormState => ({
  template_name: template.template_name ?? '',
  slug: template.slug ?? '',
  document_type: template.document_type ?? 'contract',
  category_id: template.category_id ?? null,
  body_html: template.body_html ?? '',
  docx_template_path: template.docx_template_path ?? template.source_file_path ?? null,
  signature_required: Boolean(template.signature_required),
  required_for_job: Boolean(template.required_for_job),
  is_active: template.is_active !== false,
  display_order: String(template.display_order ?? 0),
  requires: Array.isArray(template.requires) ? template.requires : [],
});

const formFingerprint = (form: FormState) =>
  JSON.stringify({
    ...form,
    template_name: form.template_name.trim(),
    slug: form.slug.trim(),
    document_type: form.document_type.trim(),
    docx_template_path: form.docx_template_path || null,
    display_order: String(parseIntegerOrNull(form.display_order) ?? ''),
    requires: [...form.requires].sort(),
  });

const parseIntegerOrNull = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractDocCount = (message: string) => {
  const match = message.match(/"doc_count"\s*:\s*(\d+)/) ?? message.match(/doc_count[^\d]+(\d+)/);
  return match ? Number(match[1]) : null;
};

const tokenMarkup = (token: string) => token.startsWith('{{') ? token : `{{${token}}}`;
const normalizeToken = (token: string) => token.replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, '');
const canonicalTokens = () => [
  'customer.name',
  'customer.email',
  'customer.phone',
  'customer.declared_items_block',
  'job.job_number',
  'job.bill_of_lading_number',
  'job.origin_address',
  'job.destination_address',
  'job.arrival_window',
  'job.scheduled_date',
  'job.scheduled_date_long',
  'job.crew_size',
  'job.truck_size',
  'job.hourly_rate',
  'job.truck_fee',
  'job.line_items_table',
  'job.photo_room_rows',
  'job.delivery_checklist',
  'estimate.hours_grid',
  'estimate.subtotal',
  'estimate.total',
  'estimate.total_range_including_packing',
  'estimate.deposit_paid',
  'estimate.deposit_amount',
  'estimate.balance',
  'estimate.packing_fee',
  'estimate.packing_kit_price',
  'estimate.minimum_hours',
  'document.issued_date',
  'document.updated_date',
  'invoice.total',
  'invoice.balance',
  'invoice.amount',
  'company.name',
  'company.address',
  'company.phone',
  'company.website',
  'date.today',
  'signature.block',
];

const groupTokens = (tokens: string[]) => {
  const unique = Array.from(new Set([...tokens, ...canonicalTokens()].map(normalizeToken).filter(Boolean)));
  const groupFor = (label: string, predicate: (token: string) => boolean) => ({
    label,
    tokens: unique.filter(predicate).sort(),
  });
  return [
    groupFor('customer.*', (token) => token.startsWith('customer.') && !isStructuralToken(token)),
    groupFor('job.*', (token) => token.startsWith('job.') && !isStructuralToken(token)),
    groupFor('estimate.*', (token) => token.startsWith('estimate.') && !isStructuralToken(token)),
    groupFor('document.*', (token) => token.startsWith('document.')),
    groupFor('company / invoice / date', (token) => /^(company|invoice|date)\./.test(token)),
    groupFor('structural blocks', isStructuralToken),
  ].filter((group) => group.tokens.length);
};

const isStructuralToken = (token: string) => [
  'job.line_items_table',
  'job.photo_room_rows',
  'job.delivery_checklist',
  'customer.declared_items_block',
  'estimate.hours_grid',
  'signature.block',
].includes(token);

const groupTokenCatalog = (catalog: TemplateTokenCatalogItem[]) => {
  const order: TemplateTokenCatalogItem['severity'][] = ['blocker', 'warning', 'info'];
  return order
    .map((severity) => ({
      severity,
      items: catalog.filter((item) => item.severity === severity).sort((a, b) => a.token.localeCompare(b.token)),
    }))
    .filter((group) => group.items.length);
};

const severityLabel = (severity: TemplateTokenCatalogItem['severity']) => ({
  blocker: 'Blocker',
  warning: 'Warning',
  info: 'Info',
}[severity]);

const severityTone = (severity: TemplateTokenCatalogItem['severity']) => {
  if (severity === 'blocker') return { color: brand.red, bg: brand.redSoft };
  if (severity === 'warning') return { color: brand.orange, bg: brand.orangeSoft };
  return { color: brand.muted, bg: brand.bg };
};

const tokenSourceTone = (source: TemplateResolvedToken['source'], empty: boolean) => {
  if (empty) return { color: brand.orange, bg: brand.orangeSoft };
  if (source === 'job') return { color: brand.blue, bg: brand.blueSoft };
  if (source === 'customer') return { color: brand.green, bg: brand.greenSoft };
  if (source === 'company') return { color: brand.purple, bg: brand.purpleSoft };
  return { color: brand.muted, bg: brand.bg };
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
const titleCase = (value: string) => value.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const defaultMergeTokens = canonicalTokens;

const styles = {
  label: { color: brand.text, fontSize: 11, fontWeight: '900' as const, textTransform: 'uppercase' as const },
  input: { minHeight: 46, borderWidth: 1, borderColor: brand.border, borderRadius: 12, backgroundColor: brand.surface, paddingHorizontal: 12, color: brand.text, fontSize: 13 },
  htmlInput: { minHeight: 280, borderWidth: 1, borderColor: brand.border, borderRadius: 12, backgroundColor: '#FBFCFE', padding: 12, color: brand.text, fontSize: 12, lineHeight: 18, fontFamily: 'Courier', textAlignVertical: 'top' as const },
  tokenChip: { borderRadius: 999, borderWidth: 1, borderColor: brand.blue, backgroundColor: brand.blueSoft, paddingHorizontal: 9, paddingVertical: 7 },
  warningBox: { borderRadius: 13, borderWidth: 1, borderColor: brand.orange, backgroundColor: brand.orangeSoft, padding: 12, gap: 7 },
  infoBox: { borderRadius: 13, borderWidth: 1, padding: 12, gap: 6 },
  requirementRow: { minHeight: 58, borderRadius: 13, borderWidth: 1, borderColor: brand.border, backgroundColor: '#FBFCFE', padding: 10, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1, borderColor: brand.blue, alignItems: 'center' as const, justifyContent: 'center' as const },
  segmented: { minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: brand.blue, backgroundColor: brand.blueSoft, flexDirection: 'row' as const, padding: 3, gap: 3 },
  segment: { flex: 1, borderRadius: 9, alignItems: 'center' as const, justifyContent: 'center' as const, paddingHorizontal: 8 },
  inspectorFrame: { height: 520, minHeight: 320, borderRadius: 16, borderWidth: 1, borderColor: brand.border, backgroundColor: '#FFFFFF', padding: 10 },
  tokenInspectorRow: { minHeight: 58, borderRadius: 12, borderWidth: 1, borderColor: brand.border, backgroundColor: '#FBFCFE', padding: 10, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
  versionRow: { minHeight: 58, borderRadius: 13, borderWidth: 1, borderColor: brand.border, backgroundColor: '#FBFCFE', padding: 10, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  previewSheet: { width: '100%' as const, maxWidth: 720, maxHeight: '88%' as const, alignSelf: 'center' as const, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: brand.border, backgroundColor: brand.surface, padding: 14, gap: 10 },
  previewFrame: { height: 520, minHeight: 320, borderRadius: 16, borderWidth: 1, borderColor: brand.border, overflow: 'hidden' as const, backgroundColor: '#FFFFFF' },
  missingChip: { borderRadius: 999, backgroundColor: brand.redSoft, paddingHorizontal: 9, paddingVertical: 5 },
};
