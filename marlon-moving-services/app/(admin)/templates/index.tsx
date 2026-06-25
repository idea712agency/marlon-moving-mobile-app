import { Link } from 'expo-router';
import { FileCode2, Plus } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, Switch, Text, View } from 'react-native';

import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { brand } from '@/constants/operator-brand';
import type { AdminDocumentTemplate } from '@/hooks/use-admin-document-templates';
import { useTemplateList, useUpsertTemplate } from '@/hooks/use-admin-document-templates';
import { errorMessage } from '@/lib/data';

export default function TemplatesScreen() {
  const templates = useTemplateList();
  const groups = useMemo(() => groupTemplates(templates.data ?? []), [templates.data]);

  return (
    <OperatorScreen refreshing={templates.isRefetching} onRefresh={() => void templates.refetch()}>
      <OperatorPageHeader title="Templates" subtitle="Manage document template HTML, metadata, and versions." />
      <Link href="/templates/new" asChild>
        <Pressable style={styles.newButton}>
          <Plus color="#FFFFFF" size={18} />
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>New template</Text>
        </Pressable>
      </Link>
      {templates.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
      {templates.error ? <OperatorCard><Text selectable style={{ color: brand.red, fontWeight: '800' }}>{errorMessage(templates.error)}</Text></OperatorCard> : null}
      {!templates.isLoading && !templates.error && !templates.data?.length ? (
        <OperatorCard>
          <FileCode2 color={brand.blue} size={30} />
          <Text selectable style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>No templates yet</Text>
          <Text selectable style={{ color: brand.muted, fontSize: 13, lineHeight: 19 }}>Create a template to generate job documents without code changes.</Text>
        </OperatorCard>
      ) : null}
      {groups.map((group) => (
        <View key={group.documentType} style={{ gap: 10 }}>
          <Text style={styles.groupTitle}>{titleCase(group.documentType)}</Text>
          {group.templates.map((template) => <TemplateRow key={template.id} template={template} />)}
        </View>
      ))}
    </OperatorScreen>
  );
}

function TemplateRow({ template }: { template: AdminDocumentTemplate }) {
  const upsert = useUpsertTemplate();
  const toggleActive = async (isActive: boolean) => {
    try {
      await upsert.mutateAsync({
        template_id: template.id,
        slug: template.slug,
        template_name: template.template_name,
        document_type: template.document_type,
        category_id: template.category_id ?? null,
        body_html: template.body_html,
        signature_required: template.signature_required,
        required_for_job: template.required_for_job,
        is_active: isActive,
        display_order: template.display_order ?? null,
      });
    } catch (error) {
      Alert.alert('Template update failed', errorMessage(error));
    }
  };

  return (
    <Link href={`/templates/${template.id}`} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={`Edit ${template.template_name}`}>
        <OperatorCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.iconWrap}><FileCode2 color={brand.blue} size={22} /></View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text selectable numberOfLines={1} style={{ color: brand.text, fontSize: 16, fontWeight: '900' }}>{template.template_name}</Text>
              <Text selectable numberOfLines={1} style={{ color: brand.muted, fontSize: 11, fontWeight: '800' }}>{template.slug} · v{template.version}{template.updated_at ? ` · ${new Date(template.updated_at).toLocaleDateString()}` : ''}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <Chip label={template.is_active ? 'Active' : 'Inactive'} color={template.is_active ? brand.green : brand.muted} bg={template.is_active ? brand.greenSoft : brand.bg} />
                {template.required_for_job ? <Chip label="Required" color={brand.blue} bg={brand.blueSoft} /> : null}
                {template.signature_required ? <Chip label="Signature" color={brand.orange} bg={brand.orangeSoft} /> : null}
              </View>
            </View>
            <Switch value={template.is_active} disabled={upsert.isPending} onValueChange={(value) => void toggleActive(value)} trackColor={{ false: brand.border, true: brand.blue }} />
          </View>
        </OperatorCard>
      </Pressable>
    </Link>
  );
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <View style={{ borderRadius: 999, backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 4 }}><Text style={{ color, fontSize: 9, fontWeight: '900' }}>{label}</Text></View>;
}

function groupTemplates(templates: AdminDocumentTemplate[]) {
  const map = new Map<string, AdminDocumentTemplate[]>();
  templates.forEach((template) => {
    const key = template.document_type || 'other';
    map.set(key, [...(map.get(key) ?? []), template]);
  });
  return Array.from(map, ([documentType, groupTemplates]) => ({
    documentType,
    templates: groupTemplates.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.template_name.localeCompare(b.template_name)),
  })).sort((a, b) => a.documentType.localeCompare(b.documentType));
}

const titleCase = (value: string) => value.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const styles = {
  newButton: { minHeight: 50, borderRadius: 14, backgroundColor: brand.blue, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8 },
  groupTitle: { color: brand.text, fontSize: 18, fontWeight: '900' as const },
  iconWrap: { width: 46, height: 46, borderRadius: 14, backgroundColor: brand.blueSoft, alignItems: 'center' as const, justifyContent: 'center' as const },
};
