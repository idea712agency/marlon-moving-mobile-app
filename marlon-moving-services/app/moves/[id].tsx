import { Image } from 'expo-image';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueries, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  AlertTriangle,
  CalendarDays,
  Check,
  Circle,
  CreditCard,
  FileText,
  MapPin,
  MessageCircle,
  Package,
  RefreshCw,
  Truck,
  UserRound,
  Users,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';

import { DocumentViewer } from '@/components/documents/document-viewer';
import { HtmlViewer } from '@/components/documents/html-viewer';
import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { StatusPill } from '@/components/operator/StatusPill';
import { brand } from '@/constants/operator-brand';
import {
  type OperatorChecklistItem,
  type OperatorDocument,
  type OperatorInventoryItem,
  type OperatorJob,
  type OperatorJobDetail,
  type OperatorMessage,
  useOperatorJob,
  useOperatorJobActions,
} from '@/hooks/use-operator-job';
import {
  type DocumentTokenCatalogItem,
  type JobDocumentTemplate,
  type PreviewResponse,
  useJobDocumentTemplateActions,
  useJobDocumentTemplates,
} from '@/hooks/use-job-document-templates';
import type { DocumentDetail, ManualPaymentSubmission } from '@/lib/data';
import { errorMessage, money, shortDate, shortTime } from '@/lib/data';
import { estimateFromUnknown, priceRange } from '@/lib/adminEstimate';
import { invokeSupabaseFunction } from '@/lib/supabase-functions';
import { supabase } from '@/lib/supabase';
import type { Json } from '@/types/supabase';

const JOB_STATUSES = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const;
const INVOICE_STATUSES = ['draft', 'sent', 'partial', 'paid', 'void'] as const;

export default function MoveDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobId = Array.isArray(id) ? id[0] : id;
  const query = useOperatorJob(jobId);
  const actions = useOperatorJobActions(jobId);

  if (query.isLoading) {
    return <OperatorScreen><View style={{ minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 12 }}><ActivityIndicator color={brand.blue} size="large" /><Text style={{ color: brand.muted, fontWeight: '800' }}>Loading move…</Text></View></OperatorScreen>;
  }

  if (!query.data || query.error) {
    return (
      <OperatorScreen>
        <OperatorCard>
          <Text selectable style={{ color: brand.red, fontSize: 14, lineHeight: 20, fontWeight: '800' }}>{query.error instanceof Error ? query.error.message : 'Move not found.'}</Text>
          <PrimaryAction label="Try again" onPress={() => void query.refetch()} />
        </OperatorCard>
      </OperatorScreen>
    );
  }

  const data = query.data;
  const job = data.job;
  const total = job.actual_total ?? data.invoice?.total ?? job.estimated_total;

  return (
    <OperatorScreen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <IconButton label="Back" icon={<ArrowLeft color={brand.navy} size={19} />} onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <OperatorPageHeader title={job.job_number} subtitle={`${data.contact?.name ?? 'Move'} · ${shortDate(job.scheduled_date)} · ${shortTime(job.scheduled_start_time)}`} />
        </View>
        <IconButton label="Refresh" icon={<RefreshCw color={brand.blue} size={18} />} onPress={() => void query.refetch()} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Link href={`/messages?job_id=${job.id}`} asChild><Pressable style={styles.headerAction}><MessageCircle color={brand.blue} size={16} /><Text style={styles.headerActionText}>Messages</Text></Pressable></Link>
        <View style={styles.headerAction}><CreditCard color={brand.blue} size={16} /><Text style={styles.headerActionText}>{data.invoice?.status ? titleCase(data.invoice.status) : 'No invoice'}</Text></View>
        <View style={styles.headerAction}><FileText color={brand.blue} size={16} /><Text style={styles.headerActionText}>{(data.manual_payments ?? []).length} payments</Text></View>
      </View>

      <OperatorCard>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text selectable style={{ color: brand.text, fontSize: 22, lineHeight: 27, fontWeight: '900' }}>{data.contact?.name ?? 'Customer pending'}</Text>
            <Text selectable style={{ color: brand.muted, fontSize: 13, lineHeight: 18 }}>{job.origin_address} → {job.destination_address}</Text>
          </View>
          <StatusPill status={job.status} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Metric label="Move date" value={shortDate(job.scheduled_date)} />
          <Metric label="Arrival" value={shortTime(job.scheduled_start_time)} />
          <Metric label="Total" value={total != null ? money(total) : 'Pending'} />
        </View>
      </OperatorCard>

      <CustomerCard data={data} />
      <AddressCard job={job} />
      <OperationsCard data={data} actions={actions} />
      <CrewCard data={data} actions={actions} />
      <ChecklistCard checklist={data.checklist} actions={actions} />
      <InventoryCard inventory={data.inventory} />
      <DocumentsCard data={data} />
      <InvoiceCard data={data} actions={actions} />
      <ManualPaymentsCard payments={data.manual_payments ?? []} actions={actions} />
      <MessagesCard jobId={job.id} messages={data.messages} />
      <TimelineCard activities={data.activities} actions={actions} />
    </OperatorScreen>
  );
}

function CustomerCard({ data }: { data: OperatorJobDetail }) {
  const contact = data.contact;
  return (
    <OperatorCard>
      <SectionTitle icon={<UserRound color={brand.blue} size={20} />} title="Customer" />
      <Detail label="Name" value={contact?.name ?? 'Not linked'} />
      <Detail label="Phone" value={contact?.phone ?? 'Not provided'} />
      <Detail label="Email" value={contact?.email ?? 'Not provided'} />
      {contact?.notes ? <Detail label="Notes" value={contact.notes} /> : null}
      {contact?.id ? (
        <Link href={`/customers/${contact.id}`} asChild>
          <Pressable style={styles.secondaryButton}><Text style={styles.secondaryText}>Open customer profile</Text></Pressable>
        </Link>
      ) : null}
    </OperatorCard>
  );
}

function AddressCard({ job }: { job: OperatorJob }) {
  return (
    <OperatorCard>
      <SectionTitle icon={<MapPin color={brand.blue} size={20} />} title="Addresses & move details" />
      <Detail label="Origin" value={job.origin_address} />
      <Detail label="Destination" value={job.destination_address} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Metric label="Home size" value={job.home_size || 'Pending'} />
        <Metric label="Job type" value={titleCase(job.job_type)} />
        <Metric label="Service" value={job.service_category || 'Moving'} />
      </View>
      {job.special_instructions ? <Detail label="Special instructions" value={job.special_instructions} /> : null}
      {job.customer_notes ? <Detail label="Customer notes" value={job.customer_notes} /> : null}
    </OperatorCard>
  );
}

function OperationsCard({ data, actions }: { data: OperatorJobDetail; actions: ReturnType<typeof useOperatorJobActions> }) {
  const job = data.job;
  const [date, setDate] = useState(job.scheduled_date ?? '');
  const [time, setTime] = useState(job.scheduled_start_time ?? '');
  const [crewSize, setCrewSize] = useState(String(job.crew_size ?? ''));
  const [truckSize, setTruckSize] = useState(job.truck_size ?? '');
  const [actualTotal, setActualTotal] = useState(job.actual_total != null ? String(job.actual_total) : '');
  const [notes, setNotes] = useState(job.internal_notes ?? '');

  useEffect(() => {
    setDate(job.scheduled_date ?? '');
    setTime(job.scheduled_start_time ?? '');
    setCrewSize(String(job.crew_size ?? ''));
    setTruckSize(job.truck_size ?? '');
    setActualTotal(job.actual_total != null ? String(job.actual_total) : '');
    setNotes(job.internal_notes ?? '');
  }, [job.id, job.scheduled_date, job.scheduled_start_time, job.crew_size, job.truck_size, job.actual_total, job.internal_notes]);

  const saveSchedule = () => runAction('Move updated', () => actions.updateJob.mutateAsync({
    scheduled_date: date.trim(),
    scheduled_start_time: time.trim() || null,
    crew_size: numberOrNull(crewSize),
    truck_size: truckSize.trim() || null,
    actual_total: numberOrNull(actualTotal),
  }));
  const saveNotes = () => runAction('Internal notes saved', () => actions.updateJob.mutateAsync({ internal_notes: notes.trim() || null }));

  return (
    <OperatorCard>
      <SectionTitle icon={<Truck color={brand.blue} size={20} />} title="Operations" />
      <Text style={styles.label}>Status</Text>
      <Segmented values={JOB_STATUSES} selected={job.status} pending={actions.updateJob.isPending} onSelect={(status) => runAction('Status updated', () => actions.updateJob.mutateAsync({ status }))} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Field label="Move date" value={date} onChangeText={setDate} />
        <Field label="Start time" value={time} onChangeText={setTime} />
        <Field label="Crew size" value={crewSize} keyboardType="number-pad" onChangeText={setCrewSize} />
        <Field label="Truck size" value={truckSize} onChangeText={setTruckSize} />
        <Field label="Actual total" value={actualTotal} keyboardType="decimal-pad" onChangeText={setActualTotal} />
      </View>
      <PrimaryAction label={actions.updateJob.isPending ? 'Saving…' : 'Save operations'} disabled={actions.updateJob.isPending} onPress={saveSchedule} />
      <Field label="Internal notes" value={notes} multiline onChangeText={setNotes} />
      <PrimaryAction label="Save notes" disabled={actions.updateJob.isPending} onPress={saveNotes} />
    </OperatorCard>
  );
}

function CrewCard({ data, actions }: { data: OperatorJobDetail; actions: ReturnType<typeof useOperatorJobActions> }) {
  const job = data.job;
  const initialCrewText = crewNames(job.crew_members).join('\n');
  const [crewText, setCrewText] = useState(initialCrewText);
  const [crewSize, setCrewSize] = useState(String(job.crew_size ?? ''));
  const [truckSize, setTruckSize] = useState(job.truck_size ?? '');

  useEffect(() => {
    setCrewText(crewNames(job.crew_members).join('\n'));
    setCrewSize(String(job.crew_size ?? ''));
    setTruckSize(job.truck_size ?? '');
  }, [job.id, job.crew_members, job.crew_size, job.truck_size]);

  const members = crewFromText(crewText);
  const eta = data.crew_location?.eta_window || (data.crew_location?.eta_minutes ? `${data.crew_location.eta_minutes} min` : 'No ETA yet');
  const save = () => runAction('Crew assigned', () => actions.assignCrew.mutateAsync({
    crew_members: members,
    crew_size: numberOrNull(crewSize) ?? (members.length || null),
    truck_size: truckSize.trim() || null,
  }));

  return (
    <OperatorCard>
      <SectionTitle icon={<Users color={brand.blue} size={20} />} title="Crew" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        {members.length ? members.map((member) => <Chip key={String(member)} label={String(member)} />) : <Text style={styles.emptyText}>No crew assigned.</Text>}
      </View>
      <Metric label="Crew ETA" value={eta} />
      <Field label="Crew members" value={crewText} multiline onChangeText={setCrewText} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Field label="Crew size" value={crewSize} keyboardType="number-pad" onChangeText={setCrewSize} />
        <Field label="Truck" value={truckSize} onChangeText={setTruckSize} />
      </View>
      <PrimaryAction label={actions.assignCrew.isPending ? 'Saving…' : 'Assign crew'} disabled={actions.assignCrew.isPending} onPress={save} />
    </OperatorCard>
  );
}

function ChecklistCard({ checklist, actions }: { checklist: OperatorChecklistItem[]; actions: ReturnType<typeof useOperatorJobActions> }) {
  const sorted = [...checklist].sort((a, b) => a.sort_order - b.sort_order);
  return (
    <OperatorCard>
      <SectionTitle icon={<Check color={brand.blue} size={20} />} title={`Checklist (${sorted.filter((item) => item.status === 'completed').length}/${sorted.length})`} />
      {!sorted.length ? <Text style={styles.emptyText}>No checklist items yet.</Text> : null}
      {sorted.map((item) => {
        const done = item.status === 'completed';
        return (
          <Pressable
            key={item.id}
            disabled={actions.updateChecklistItem.isPending}
            onPress={() => runAction(done ? 'Checklist reopened' : 'Checklist completed', () => actions.updateChecklistItem.mutateAsync({ itemId: item.id, completed: !done }))}
            style={styles.checkRow}>
            {done ? <View style={styles.checkDone}><Check color="#FFFFFF" size={13} strokeWidth={3} /></View> : <Circle color={brand.muted} size={20} />}
            <Text selectable style={{ flex: 1, color: brand.text, fontSize: 13, lineHeight: 18, fontWeight: done ? '800' : '700' }}>{item.label}</Text>
            <Text style={{ color: done ? brand.green : brand.muted, fontSize: 10, fontWeight: '900' }}>{done ? 'Done' : 'Open'}</Text>
          </Pressable>
        );
      })}
    </OperatorCard>
  );
}

function InventoryCard({ inventory }: { inventory: OperatorInventoryItem[] }) {
  const groups = useMemo(() => groupInventory(inventory), [inventory]);
  const fragileCount = inventory.filter((item) => item.fragile).length;
  return (
    <OperatorCard>
      <SectionTitle icon={<Package color={brand.blue} size={20} />} title={`Inventory (${inventory.length})`} />
      <Metric label="Fragile items" value={String(fragileCount)} />
      {!inventory.length ? <EmptyPanel title="Inventory pending" body="Customer inventory and admin-added items will appear here once attached to this move." /> : null}
      {groups.map((group) => (
        <View key={group.category} style={{ gap: 7 }}>
          <Text style={styles.label}>{group.category}</Text>
          {group.items.map((item) => (
            <View key={item.id} style={styles.listRow}>
              {item.photo_url ? <Image source={item.photo_url} style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: brand.blueSoft }} /> : <View style={styles.rowIcon}><Package color={brand.blue} size={18} /></View>}
              <View style={{ flex: 1 }}>
                <Text selectable style={{ color: brand.text, fontWeight: '900' }}>{item.quantity} × {item.item_name}</Text>
                <Text selectable style={{ color: brand.muted, fontSize: 11 }}>{[item.condition, item.fragile ? 'Fragile' : '', item.notes].filter(Boolean).join(' · ') || 'No details'}</Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </OperatorCard>
  );
}

function DocumentsCard({ data }: { data: OperatorJobDetail }) {
  const job = data.job;
  const documents = data.documents;
  const jobId = job.id;
  const linkedCustomer = Boolean((job as OperatorJob & { customer_user_id?: string | null }).customer_user_id);
  const queryClient = useQueryClient();
  const templates = useJobDocumentTemplates(jobId);
  const actions = useJobDocumentTemplateActions(jobId);
  const [preview, setPreview] = useState<{ title: string; version?: number | null; html: string; htmlSource?: 'docx' | 'body_html'; missingTokens?: string[] } | null>(null);
  const [viewer, setViewer] = useState<{ title: string; url: string; htmlPreviewUrl?: string | null; isPdf?: boolean | null; isHtmlSnapshot?: boolean | null; mimeType?: string | null } | null>(null);
  const [adminHtmlPreviewOpen, setAdminHtmlPreviewOpen] = useState(false);
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [viewingDocumentId, setViewingDocumentId] = useState('');
  const [sendingDocumentId, setSendingDocumentId] = useState('');
  const templateRows = useMemo(
    () => mergeTemplateDocumentState(templates.data?.templates ?? [], documents),
    [templates.data?.templates, documents],
  );
  const tokenCatalog = templates.data?.tokenCatalog ?? [];
  const packageTemplates = useMemo(() => templateRows.filter((template) => template.required_in_package !== false), [templateRows]);
  const preflightQueries = useQueries({
    queries: packageTemplates.map((template) => ({
      queryKey: ['job-document-template-preview', jobId, template.id, template.version],
      enabled: Boolean(jobId && template.id),
      queryFn: async () =>
        invokeSupabaseFunction<PreviewResponse>('admin-preview-document-template', {
          body: { template_id: template.id, job_id: jobId },
        }),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const preflightByTemplateId = useMemo(() => {
    const map = new Map<string, PreviewResponse | undefined>();
    packageTemplates.forEach((template, index) => map.set(template.id, preflightQueries[index]?.data));
    return map;
  }, [packageTemplates, preflightQueries]);
  const preflightPending = preflightQueries.some((query) => query.isLoading || query.isFetching);
  const readiness = useMemo(
    () => buildDocumentReadiness(data, templateRows, tokenCatalog, preflightByTemplateId),
    [data, templateRows, tokenCatalog, preflightByTemplateId],
  );
  const grouped = useMemo(() => groupTemplates(templateRows), [templateRows]);
  const sendDocument = useMutation({
    mutationFn: async (documentId: string) =>
      invokeSupabaseFunction<{ status: 'sent'; document: OperatorDocument }>('admin-send-document-to-customer', { body: { document_id: documentId } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['operator-job', jobId] });
      await queryClient.invalidateQueries({ queryKey: ['job-document-templates', jobId] });
      await queryClient.invalidateQueries({ queryKey: ['operator-moves'] });
      await queryClient.invalidateQueries({ queryKey: ['operator-schedule'] });
    },
  });

  const previewTemplate = async (template: JobDocumentTemplate) => {
    try {
      const result = await actions.previewTemplate.mutateAsync(template.id);
      setPreview({
        title: templateTitle(template),
        version: result.version ?? template.version,
        html: result.html,
        htmlSource: result.html_source,
        missingTokens: result.missing_tokens ?? [],
      });
    } catch (error) {
      Alert.alert('Preview unavailable', errorMessage(error));
    }
  };

  const generateTemplate = async (template: JobDocumentTemplate) => {
    if (template.status === 'signed' || template.locked_at) {
      Alert.alert('Document locked', 'This document is signed and locked. Generate a new draft? The signed copy stays in the record.');
      return;
    }
    const state = readiness.templateStates.get(template.id);
    if (state?.blockers.length) {
      setReadinessOpen(true);
      Alert.alert('Missing required fields', `${templateTitle(template)} needs ${state.blockers.length} required field${state.blockers.length === 1 ? '' : 's'} before generation.`);
      return;
    }
    try {
      await actions.generateDocument.mutateAsync({ templateId: template.id, replace: true });
      Alert.alert(template.status === 'draft' ? 'Document regenerated' : 'Document generated');
    } catch (error) {
      if (isLockedDocumentError(error)) {
        Alert.alert('Document locked', 'This document is signed and locked. Generate a new draft? The signed copy stays in the record.');
        return;
      }
      Alert.alert('Generation failed', errorMessage(error));
    }
  };

  const generatePackage = async () => {
    if (readiness.blockers.length) {
      setReadinessOpen(true);
      Alert.alert('Packet needs attention', 'Complete the blocker fields before generating the full document package.');
      return;
    }
    try {
      const result = await actions.generatePackage.mutateAsync();
      Alert.alert('Document package complete', `Generated ${result.generated.length} · Skipped ${result.skipped_locked.length} locked`);
    } catch (error) {
      Alert.alert('Package failed', errorMessage(error));
    }
  };

  const viewGeneratedDocument = async (documentId: string | null | undefined, title: string) => {
    if (!documentId) return;
    setViewingDocumentId(documentId);
    try {
      const detail = await invokeSupabaseFunction<DocumentDetail>('admin-get-document-detail', { body: { document_id: documentId } });
      if (!detail.document) throw new Error('Document is not available.');
      const path = detail.document.file_path;
      const url = detail.signed_url ?? await signedMediaUrl(path);
      setViewer({
        title,
        url,
        htmlPreviewUrl: detail.html_preview_url ?? (detail.document as OperatorDocument & { html_preview_url?: string | null }).html_preview_url,
        isPdf: detail.is_pdf ?? detail.document.mime_type === 'application/pdf',
        isHtmlSnapshot: detail.is_html_snapshot,
        mimeType: detail.document.mime_type,
      });
    } catch (error) {
      Alert.alert('Document unavailable', errorMessage(error));
    } finally {
      setViewingDocumentId('');
    }
  };

  const sendGeneratedDocument = async (document: OperatorDocument) => {
    const locked = isAdminDocumentLocked(document);
    if (locked) return;
    setSendingDocumentId(document.id);
    try {
      await sendDocument.mutateAsync(document.id);
      Alert.alert('Document sent');
    } catch (error) {
      const message = errorMessage(error);
      Alert.alert(
        'Send failed',
        message.toLowerCase().includes('no linked customer account')
          ? 'This job has no linked customer account — link a customer profile first'
          : message,
      );
    } finally {
      setSendingDocumentId('');
    }
  };

  const busy = actions.generateDocument.isPending || actions.generatePackage.isPending;
  return (
    <OperatorCard>
      <SectionTitle icon={<FileText color={brand.blue} size={20} />} title={`Documents (${documents.length})`} />
      <DocumentReadinessCard
        readiness={readiness}
        checking={preflightPending}
        onReview={() => setReadinessOpen(true)}
        onRefresh={() => void refreshReadinessPreflight(queryClient, jobId, packageTemplates)}
      />
      <PrimaryAction
        label={actions.generatePackage.isPending ? 'Generating package...' : readiness.blockers.length ? 'Review missing fields' : documents.length ? 'Regenerate document package' : 'Generate document package'}
        disabled={actions.generatePackage.isPending || preflightPending}
        icon={<FileText color="#FFFFFF" size={16} />}
        onPress={() => readiness.blockers.length ? setReadinessOpen(true) : void generatePackage()}
      />
      {templates.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
      {templates.error ? <EmptyPanel title="Templates unavailable" body={errorMessage(templates.error)} /> : null}
      {!templates.isLoading && !templates.error && !templateRows.length ? (
        <EmptyPanel title="No templates available" body="Document templates will appear here once they are active." />
      ) : null}
      {grouped.map((group) => (
        <View key={group.label} style={styles.templateGroup}>
          <View style={[styles.templateGroupHeader, { backgroundColor: group.bg || brand.blueSoft }]}>
            <Text selectable style={{ color: group.color || brand.blue, fontSize: 12, fontWeight: '900' }}>{group.label}</Text>
          </View>
          {group.templates.map((template) => (
            <TemplateRow
              key={template.id}
              template={template}
              readiness={readiness.templateStates.get(template.id)}
              busy={busy || viewingDocumentId === template.document_id}
              onPreview={() => void previewTemplate(template)}
              onGenerate={() => void generateTemplate(template)}
              onView={() => void viewGeneratedDocument(template.document_id, templateTitle(template))}
            />
          ))}
        </View>
      ))}
      {documents.length ? <Text style={styles.label}>Generated documents</Text> : null}
      {!documents.length ? <EmptyPanel title="No job documents" body="Generated drafts, signed forms, and uploaded paperwork will appear here." /> : null}
      {documents.slice(0, 8).map((document) => {
        const isImage = document.mime_type?.startsWith('image/');
        const locked = isAdminDocumentLocked(document);
        const sentAt = adminDocumentSentAt(document);
        const sent = Boolean(sentAt);
        const sendDisabled = sendDocument.isPending || sendingDocumentId === document.id || !linkedCustomer || sent || locked;
        return (
          <View key={document.id} style={styles.listRow}>
            {isImage ? <Image source={publicMediaUrl(document.file_path)} style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: brand.blueSoft }} /> : <View style={styles.rowIcon}><FileText color={brand.blue} size={18} /></View>}
            <View style={{ flex: 1 }}>
              <Text selectable numberOfLines={1} style={{ color: brand.text, fontWeight: '900' }}>{document.name}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: brand.muted, fontSize: 11 }}>{documentStatus(document)}</Text>
                {sentAt ? <SmallStatusChip label={`Sent ${relativeTime(sentAt)}`} color={brand.blue} bg={brand.blueSoft} /> : null}
                {locked ? <SmallStatusChip label={signedDocumentLabel(document)} color={brand.green} bg={brand.greenSoft} /> : null}
              </View>
            </View>
            <View style={{ gap: 7, minWidth: 76 }}>
              <Pressable disabled={viewingDocumentId === document.id} onPress={() => void viewGeneratedDocument(document.id, document.name)} style={styles.documentMiniButton}>
                <Text style={styles.documentMiniText}>View</Text>
              </Pressable>
              {!locked ? (
                <Pressable
                  disabled={sendDisabled}
                  onPress={() => void sendGeneratedDocument(document)}
                  style={[styles.documentMiniButton, { borderColor: sent ? brand.blue : brand.green, backgroundColor: sent ? brand.blueSoft : brand.greenSoft, opacity: sendDisabled ? 0.55 : 1 }]}>
                  <Text style={[styles.documentMiniText, { color: sent ? brand.blue : brand.green }]}>{sent ? 'Sent' : 'Send'}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}
      <Link href="/documents" asChild><Pressable style={styles.secondaryButton}><Text style={styles.secondaryText}>Open documents library</Text></Pressable></Link>
      <HtmlPreviewSheet
        title={preview?.title ?? ''}
        subtitle={preview?.version ? `Template v${preview.version}` : 'Template preview'}
        html={preview?.html ?? ''}
        htmlSource={preview?.htmlSource}
        missingTokens={preview?.missingTokens ?? []}
        banner="Preview only - not saved"
        visible={Boolean(preview)}
        footer={null}
        onClose={() => setPreview(null)}
      />
      <HtmlPreviewSheet
        title={viewer?.title ?? ''}
        subtitle="Generated document"
        uri={viewer?.url}
        htmlPreviewUrl={viewer?.htmlPreviewUrl}
        isPdf={viewer?.isPdf}
        isHtmlSnapshot={viewer?.isHtmlSnapshot}
        mimeType={viewer?.mimeType}
        visible={Boolean(viewer)}
        banner={null}
        footer={null}
        onOpenHtml={() => setAdminHtmlPreviewOpen(true)}
        onClose={() => setViewer(null)}
      />
      <HtmlPreviewSheet
        title="HTML snapshot"
        subtitle={viewer?.title ?? 'Generated document'}
        uri={viewer?.htmlPreviewUrl ?? undefined}
        isHtmlSnapshot
        mimeType="text/html"
        visible={adminHtmlPreviewOpen}
        banner={null}
        footer={null}
        onClose={() => setAdminHtmlPreviewOpen(false)}
      />
      <MissingFieldsSheet
        visible={readinessOpen}
        readiness={readiness}
        data={data}
        onClose={() => setReadinessOpen(false)}
      />
    </OperatorCard>
  );
}

function TemplateRow({
  template,
  readiness,
  busy,
  onPreview,
  onGenerate,
  onView,
}: {
  template: JobDocumentTemplate;
  readiness?: TemplateReadinessState;
  busy: boolean;
  onPreview: () => void;
  onGenerate: () => void;
  onView: () => void;
}) {
  const signed = template.status === 'signed' || Boolean(template.locked_at);
  const draft = template.status === 'draft';
  const hasDocument = Boolean(template.document_id);
  const readinessLabel = readinessChipLabel(readiness);
  const blocked = Boolean(readiness?.blockers.length);
  const rowIssues = [...(readiness?.blockers ?? []), ...(readiness?.warnings ?? [])];
  const generateLabel = signed ? 'Signed' : blocked ? 'Missing fields' : draft ? 'Regenerate' : 'Generate';
  return (
    <View style={styles.templateRow}>
      <View style={{ flex: 1, gap: 5 }}>
        <Text selectable style={{ color: brand.text, fontSize: 14, fontWeight: '900' }}>{templateTitle(template)}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <StatusChip label={templateStatusLabel(template)} status={template.status} />
          {readinessLabel ? <ReadinessStatusChip label={readinessLabel.label} tone={readinessLabel.tone} /> : null}
          {template.signature_required ? <Chip label="Signature required" /> : null}
        </View>
        {rowIssues.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
            {rowIssues.slice(0, 5).map((issue) => (
              <RequirementChip key={issue.token} label={issue.label} severity={issue.severity} />
            ))}
            {rowIssues.length > 5 ? <RequirementChip label={`+${rowIssues.length - 5} more`} severity="warning" /> : null}
          </View>
        ) : null}
      </View>
      <View style={{ width: '100%', flexDirection: 'row', gap: 8 }}>
        <Pressable disabled={busy} onPress={onPreview} style={styles.templateSecondaryButton}>
          <Text style={styles.templateSecondaryText}>Preview</Text>
        </Pressable>
        {hasDocument ? (
          <Pressable disabled={busy} onPress={onView} style={styles.templateSecondaryButton}>
            <Text style={styles.templateSecondaryText}>View</Text>
          </Pressable>
        ) : null}
        <Pressable disabled={busy || signed || blocked} onPress={onGenerate} style={[styles.templatePrimaryButton, { opacity: busy || signed || blocked ? 0.55 : 1 }]}>
          <Text style={styles.templatePrimaryText}>{generateLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StatusChip({ label, status }: { label: string; status: JobDocumentTemplate['status'] }) {
  const color = status === 'signed' ? brand.green : status === 'draft' ? brand.orange : brand.muted;
  const backgroundColor = status === 'signed' ? brand.greenSoft : status === 'draft' ? brand.orangeSoft : brand.bg;
  return <View style={{ borderRadius: 999, backgroundColor, paddingHorizontal: 9, paddingVertical: 5 }}><Text style={{ color, fontSize: 10, fontWeight: '900' }}>{label}</Text></View>;
}

function ReadinessStatusChip({ label, tone }: { label: string; tone: ReadinessTone }) {
  const color = tone === 'ready' ? brand.green : tone === 'warning' ? brand.orange : brand.red;
  const backgroundColor = tone === 'ready' ? brand.greenSoft : tone === 'warning' ? brand.orangeSoft : '#FEE2E2';
  return <View style={{ borderRadius: 999, backgroundColor, paddingHorizontal: 9, paddingVertical: 5 }}><Text style={{ color, fontSize: 10, fontWeight: '900' }}>{label}</Text></View>;
}

function RequirementChip({ label, severity }: { label: string; severity: ReadinessIssue['severity'] }) {
  const blocker = severity === 'blocker';
  return (
    <View style={{ borderRadius: 999, backgroundColor: blocker ? '#FEE2E2' : brand.orangeSoft, paddingHorizontal: 8, paddingVertical: 4 }}>
      <Text selectable numberOfLines={1} style={{ color: blocker ? brand.red : brand.orange, fontSize: 9, fontWeight: '900' }}>{label}</Text>
    </View>
  );
}

function DocumentReadinessCard({
  readiness,
  checking,
  onReview,
  onRefresh,
}: {
  readiness: DocumentReadinessSummary;
  checking: boolean;
  onReview: () => void;
  onRefresh: () => void;
}) {
  const tone: ReadinessTone = readiness.blockers.length ? 'blocker' : readiness.warnings.length ? 'warning' : 'ready';
  const title = !readiness.templateCount ? 'Incomplete' : readiness.blockers.length ? 'Needs attention' : readiness.warnings.length ? 'Ready with optional items' : 'Ready to generate';
  const body = readiness.blockers.length
    ? `${readiness.blockers.length} blocker${readiness.blockers.length === 1 ? '' : 's'} must be fixed before generating the full packet.`
    : readiness.warnings.length
      ? `${readiness.warnings.length} optional item${readiness.warnings.length === 1 ? '' : 's'} found. You can still generate.`
      : 'Required document data is present for the package.';
  return (
    <View style={[styles.readinessCard, { borderColor: tone === 'ready' ? brand.green : tone === 'warning' ? brand.orange : brand.red }]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View style={[styles.readinessIcon, { backgroundColor: tone === 'ready' ? brand.greenSoft : tone === 'warning' ? brand.orangeSoft : '#FEE2E2' }]}>
          {tone === 'ready' ? <Check color={brand.green} size={17} strokeWidth={3} /> : <AlertTriangle color={tone === 'warning' ? brand.orange : brand.red} size={18} />}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text selectable style={{ color: brand.text, fontSize: 15, fontWeight: '900' }}>{checking ? 'Checking readiness…' : title}</Text>
          <Text selectable style={{ color: brand.muted, fontSize: 12, lineHeight: 17 }}>{body}</Text>
          <Text style={{ color: brand.muted, fontSize: 11, fontWeight: '800' }}>
            {readiness.readyCount} ready · {readiness.blockers.length} missing · {readiness.warnings.length} optional
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={onReview} style={[styles.templateSecondaryButton, { flex: 1 }]}>
          <Text style={styles.templateSecondaryText}>Review missing fields</Text>
        </Pressable>
        <Pressable onPress={onRefresh} disabled={checking} style={[styles.templateSecondaryButton, { flex: 1, opacity: checking ? 0.55 : 1 }]}>
          <Text style={styles.templateSecondaryText}>{checking ? 'Checking…' : 'Check readiness'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MissingFieldsSheet({ visible, readiness, data, onClose }: {
  visible: boolean;
  readiness: DocumentReadinessSummary;
  data: OperatorJobDetail;
  onClose: () => void;
}) {
  const groupedIssues = groupReadinessIssues([...readiness.blockers, ...readiness.warnings]);
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(7,21,47,0.34)' }}>
        <Pressable accessibilityLabel="Close missing fields" onPress={onClose} style={{ position: 'absolute', inset: 0 }} />
        <View style={styles.previewSheet}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>Document readiness</Text>
              <Text selectable style={{ color: brand.muted, fontSize: 12, fontWeight: '800' }}>Fix blockers before generating the full package.</Text>
            </View>
            <IconButton label="Close" icon={<Circle color={brand.text} size={18} />} onPress={onClose} />
          </View>
          {!groupedIssues.length ? <EmptyPanel title="No missing fields" body="This job has the required data for the document packet." /> : null}
          {groupedIssues.map((group) => (
            <View key={group.section} style={styles.missingGroup}>
              <Text style={styles.label}>{sectionLabel(group.section)}</Text>
              {group.items.map((issue) => (
                <View key={`${issue.token}-${issue.templateIds.join('-')}`} style={styles.missingRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text selectable style={{ color: brand.text, fontSize: 13, fontWeight: '900' }}>{issue.label}</Text>
                    <Text selectable style={{ color: brand.muted, fontSize: 11, lineHeight: 16 }}>{issue.templateNames.join(', ')}</Text>
                  </View>
                  <ReadinessStatusChip label={issue.severity === 'blocker' ? 'Blocker' : 'Warning'} tone={issue.severity === 'blocker' ? 'blocker' : 'warning'} />
                </View>
              ))}
              <SectionDestinationAction section={group.section} data={data} onClose={onClose} />
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

function SectionDestinationAction({ section, data, onClose }: {
  section: DocumentTokenCatalogItem['section'];
  data: OperatorJobDetail;
  onClose: () => void;
}) {
  const action = destinationForSection(section, data);
  if (!action) return null;
  return (
    <Pressable
      onPress={() => {
        onClose();
        action.onPress();
      }}
      style={[styles.templateSecondaryButton, { alignSelf: 'stretch' }]}>
      <Text style={styles.templateSecondaryText}>{action.label}</Text>
    </Pressable>
  );
}

function SmallStatusChip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <View style={{ borderRadius: 999, backgroundColor: bg, paddingHorizontal: 7, paddingVertical: 3 }}><Text style={{ color, fontSize: 9, fontWeight: '900' }}>{label}</Text></View>;
}

function RenderSourceChip({ source }: { source: 'docx' | 'body_html' }) {
  const docx = source === 'docx';
  return (
    <View style={{ alignSelf: 'flex-start', borderRadius: 999, backgroundColor: docx ? brand.greenSoft : brand.blueSoft, paddingHorizontal: 10, paddingVertical: 6 }}>
      <Text style={{ color: docx ? brand.green : brand.blue, fontSize: 10, fontWeight: '900' }}>
        {docx ? 'Rendered from DOCX' : 'Rendered from HTML fallback'}
      </Text>
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

function HtmlPreviewSheet({
  title,
  subtitle,
  html,
  htmlSource,
  missingTokens = [],
  uri,
  htmlPreviewUrl,
  isPdf,
  isHtmlSnapshot,
  mimeType,
  banner,
  footer,
  visible,
  onOpenHtml,
  onClose,
}: {
  title: string;
  subtitle: string;
  html?: string;
  htmlSource?: 'docx' | 'body_html';
  missingTokens?: string[];
  uri?: string;
  htmlPreviewUrl?: string | null;
  isPdf?: boolean | null;
  isHtmlSnapshot?: boolean | null;
  mimeType?: string | null;
  banner: string | null;
  footer: string | null;
  visible: boolean;
  onOpenHtml?: () => void;
  onClose: () => void;
}) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(7,21,47,0.34)' }}>
        <Pressable accessibilityLabel="Close preview" onPress={onClose} style={{ position: 'absolute', inset: 0 }} />
        <View style={styles.previewSheet}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text selectable numberOfLines={1} style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>{title}</Text>
              <Text selectable style={{ color: brand.muted, fontSize: 12, fontWeight: '800' }}>{subtitle}</Text>
            </View>
            <IconButton label="Close" icon={<Circle color={brand.text} size={18} />} onPress={onClose} />
          </View>
          {htmlSource ? <RenderSourceChip source={htmlSource} /> : null}
          {missingTokens.length ? <WarningList title="Missing tokens" items={missingTokens} /> : null}
          {banner ? <View style={styles.previewBanner}><Text style={{ color: brand.blue, fontSize: 12, fontWeight: '900' }}>{banner}</Text></View> : null}
          {html ? (
            <View style={styles.webViewFrame}>
              <HtmlViewer html={html} />
            </View>
          ) : (
            <DocumentViewer url={uri ?? null} isPdf={isPdf} isHtmlSnapshot={isHtmlSnapshot} mimeType={mimeType} />
          )}
          {htmlPreviewUrl && onOpenHtml ? (
            <Pressable onPress={onOpenHtml} style={styles.templateSecondaryButton}>
              <Text style={styles.templateSecondaryText}>View HTML snapshot</Text>
            </Pressable>
          ) : null}
          {footer ? <Text selectable style={{ color: brand.muted, fontSize: 12, textAlign: 'center', fontWeight: '800' }}>{footer}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

function InvoiceCard({ data, actions }: { data: OperatorJobDetail; actions: ReturnType<typeof useOperatorJobActions> }) {
  const invoice = data.invoice;
  const [dueDate, setDueDate] = useState(invoice?.due_date ?? '');
  const [notes, setNotes] = useState(invoice?.notes ?? '');

  useEffect(() => {
    setDueDate(invoice?.due_date ?? '');
    setNotes(invoice?.notes ?? '');
  }, [invoice?.id, invoice?.due_date, invoice?.notes]);

  if (!invoice) {
    return <OperatorCard><SectionTitle icon={<CreditCard color={brand.blue} size={20} />} title="Invoice" /><Text style={styles.emptyText}>No invoice is linked to this job yet.</Text></OperatorCard>;
  }

  const update = (patch: Record<string, unknown>, success = 'Invoice updated') =>
    runAction(success, () => actions.updateInvoice.mutateAsync({ invoiceId: invoice.id, patch }));

  return (
    <OperatorCard>
      <SectionTitle icon={<CreditCard color={brand.blue} size={20} />} title="Invoice" />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text selectable style={{ color: brand.muted, fontSize: 11, fontWeight: '900' }}>{invoice.invoice_number}</Text>
          <Text selectable style={{ color: brand.text, fontSize: 24, fontWeight: '900' }}>{money(invoice.total)}</Text>
        </View>
        <StatusPill status={invoice.status} />
      </View>
      <Text style={styles.label}>Status</Text>
      <Segmented values={INVOICE_STATUSES} selected={invoice.status} pending={actions.updateInvoice.isPending} onSelect={(status) => update({ status }, status === 'paid' ? 'Invoice marked paid' : 'Invoice status updated')} />
      <Field label="Due date" value={dueDate} onChangeText={setDueDate} />
      <Field label="Invoice notes" value={notes} multiline onChangeText={setNotes} />
      <PrimaryAction label="Save invoice" disabled={actions.updateInvoice.isPending} onPress={() => update({ due_date: dueDate.trim() || null, notes: notes.trim() || null })} />
    </OperatorCard>
  );
}

function ManualPaymentsCard({ payments, actions }: {
  payments: ManualPaymentSubmission[];
  actions: ReturnType<typeof useOperatorJobActions>;
}) {
  const [rejectionReason, setRejectionReason] = useState('');
  const sorted = [...payments].sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
  return (
    <OperatorCard>
      <SectionTitle icon={<CreditCard color={brand.blue} size={20} />} title={`Payment submissions (${sorted.length})`} />
      {!sorted.length ? <EmptyPanel title="No submissions" body="Customer-submitted Zelle, bank transfer, check, and cash payment details will appear here for review." /> : null}
      {sorted.map((payment) => {
        const open = payment.status === 'submitted' || payment.status === 'reviewed';
        return (
          <View key={payment.id} style={styles.paymentReviewRow}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text selectable style={{ color: brand.text, fontSize: 14, fontWeight: '900' }}>
                {money(payment.amount)} · {titleCase(payment.method)}
              </Text>
              <Text selectable style={{ color: brand.muted, fontSize: 11 }}>
                {shortDate(payment.payment_date)}{payment.reference_number ? ` · Ref ${payment.reference_number}` : ''}{payment.proof_file_path ? ' · Proof attached' : ''}
              </Text>
              {payment.notes ? <Text selectable style={{ color: brand.muted, fontSize: 12, lineHeight: 17 }}>{payment.notes}</Text> : null}
              {payment.rejection_reason ? <Text selectable style={{ color: brand.red, fontSize: 12, lineHeight: 17 }}>{payment.rejection_reason}</Text> : null}
            </View>
            <StatusPill status={payment.status} />
            {open ? (
              <View style={{ width: '100%', gap: 8 }}>
                <Field label="Rejection reason" value={rejectionReason} onChangeText={setRejectionReason} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    disabled={actions.reviewManualPayment.isPending}
                    onPress={() => runAction('Payment approved', () => actions.reviewManualPayment.mutateAsync({ submissionId: payment.id, action: 'approve' }))}
                    style={[styles.reviewButton, { backgroundColor: brand.green }]}>
                    <Text style={styles.primaryText}>Approve</Text>
                  </Pressable>
                  <Pressable
                    disabled={actions.reviewManualPayment.isPending || !rejectionReason.trim()}
                    onPress={() => runAction('Payment rejected', async () => {
                      await actions.reviewManualPayment.mutateAsync({ submissionId: payment.id, action: 'reject', rejectionReason });
                      setRejectionReason('');
                    })}
                    style={[styles.reviewButton, { backgroundColor: brand.red, opacity: actions.reviewManualPayment.isPending || !rejectionReason.trim() ? 0.55 : 1 }]}>
                    <Text style={styles.primaryText}>Reject</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
    </OperatorCard>
  );
}

function MessagesCard({ jobId, messages }: { jobId: string; messages: OperatorMessage[] }) {
  const recent = [...messages].sort((a, b) => String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''))).slice(-5);
  return (
    <OperatorCard>
      <SectionTitle icon={<MessageCircle color={brand.blue} size={20} />} title="Messages" />
      {!recent.length ? <EmptyPanel title="No messages yet" body="Customer and admin messages linked to this move will appear here." /> : null}
      {recent.map((message) => <MessageBubble key={message.id} message={message} />)}
      <Link href={`/messages?job_id=${jobId}`} asChild>
        <Pressable style={styles.secondaryButton}><Text style={styles.secondaryText}>Open messages</Text></Pressable>
      </Link>
    </OperatorCard>
  );
}

function TimelineCard({ activities, actions }: { activities: OperatorJobDetail['activities']; actions: ReturnType<typeof useOperatorJobActions> }) {
  const [note, setNote] = useState('');
  const sorted = [...activities].sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
  const log = () => {
    const description = note.trim();
    if (!description) return;
    runAction('Activity added', async () => {
      await actions.logActivity.mutateAsync({ description, activity_type: 'manual_note' });
      setNote('');
    });
  };
  return (
    <OperatorCard>
      <SectionTitle icon={<CalendarDays color={brand.blue} size={20} />} title="Timeline" />
      <Field label="Manual activity note" value={note} multiline onChangeText={setNote} />
      <PrimaryAction label="Add note" disabled={actions.logActivity.isPending || !note.trim()} onPress={log} />
      {!sorted.length ? <EmptyPanel title="No activity yet" body="Booking, payment, invoice, crew, and manual notes will build the move history here." /> : null}
      {sorted.slice(0, 12).map((activity) => (
        <View key={activity.id} style={styles.timelineRow}>
          <View style={styles.timelineDot} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text selectable style={{ color: brand.text, fontSize: 13, lineHeight: 18, fontWeight: '900' }}>{activity.description}</Text>
            <Text style={{ color: brand.muted, fontSize: 10, fontWeight: '800' }}>{activity.created_at ? new Date(activity.created_at).toLocaleString() : titleCase(activity.activity_type)}</Text>
          </View>
        </View>
      ))}
    </OperatorCard>
  );
}

function MessageBubble({ message }: { message: OperatorMessage }) {
  const admin = message.role === 'admin' || message.role === 'operator';
  return (
    <View style={{ alignSelf: admin ? 'flex-end' : 'flex-start', maxWidth: '88%', borderRadius: 15, padding: 11, backgroundColor: admin ? brand.blue : brand.blueSoft }}>
      <Text selectable style={{ color: admin ? '#FFFFFF' : brand.text, fontSize: 13, lineHeight: 18 }}>{message.content}</Text>
      <Text style={{ color: admin ? 'rgba(255,255,255,0.72)' : brand.muted, fontSize: 9, marginTop: 4 }}>{message.created_at ? new Date(message.created_at).toLocaleString() : titleCase(message.role)}</Text>
    </View>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{icon}<Text selectable style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>{title}</Text></View>;
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.emptyPanel}>
      <Text selectable style={{ color: brand.text, fontSize: 14, fontWeight: '900' }}>{title}</Text>
      <Text selectable style={{ color: brand.muted, fontSize: 12, lineHeight: 18 }}>{body}</Text>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={{ gap: 3 }}><Text style={styles.label}>{label}</Text><Text selectable style={{ color: brand.text, fontSize: 14, lineHeight: 20 }}>{value}</Text></View>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={{ minWidth: '30%', flex: 1, borderRadius: 13, backgroundColor: brand.blueSoft, padding: 10, gap: 3 }}><Text style={{ color: brand.muted, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>{label}</Text><Text selectable numberOfLines={2} style={{ color: brand.text, fontSize: 13, fontWeight: '900' }}>{value}</Text></View>;
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, multiline, style, ...inputProps } = props;
  return <View style={{ minWidth: '45%', flex: 1, gap: 6 }}><Text style={styles.label}>{label}</Text><TextInput {...inputProps} multiline={multiline} placeholderTextColor="#94A3B8" style={[styles.input, multiline ? { minHeight: 86, paddingTop: 11, textAlignVertical: 'top' } : null, style]} /></View>;
}

function Segmented<T extends string>({ values, selected, pending, onSelect }: { values: readonly T[]; selected: string; pending?: boolean; onSelect: (value: T) => void }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{values.map((value) => <Pressable key={value} disabled={pending || selected === value} onPress={() => onSelect(value)} style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: selected === value ? brand.blue : brand.blueSoft, opacity: pending ? 0.6 : 1 }}><Text style={{ color: selected === value ? '#FFFFFF' : brand.navy, fontSize: 10, fontWeight: '900' }}>{titleCase(value)}</Text></Pressable>)}</View>;
}

function PrimaryAction({ label, icon, disabled, onPress }: { label: string; icon?: React.ReactNode; disabled?: boolean; onPress: () => void }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.primaryButton, { opacity: disabled ? 0.55 : 1 }]}>{icon}<Text style={styles.primaryText}>{label}</Text></Pressable>;
}

function IconButton({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) {
  return <Pressable accessibilityLabel={label} onPress={onPress} style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: brand.blueSoft, alignItems: 'center', justifyContent: 'center' }}>{icon}</Pressable>;
}

function Chip({ label }: { label: string }) {
  return <View style={{ borderRadius: 999, backgroundColor: brand.blueSoft, paddingHorizontal: 10, paddingVertical: 7 }}><Text style={{ color: brand.navy, fontSize: 11, fontWeight: '900' }}>{label}</Text></View>;
}

async function runAction(success: string, action: () => Promise<unknown>) {
  try {
    await action();
    Alert.alert(success);
  } catch (error) {
    Alert.alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
  }
}

const crewNames = (value: Json | null): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((member) => {
      if (typeof member === 'string') return member.trim();
      if (member && typeof member === 'object' && !Array.isArray(member)) {
        const record = member as Record<string, Json | undefined>;
        return typeof record.name === 'string' ? record.name.trim() : '';
      }
      return '';
    })
    .filter(Boolean);
};

const crewFromText = (value: string): Json[] =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const groupInventory = (items: OperatorInventoryItem[]) => {
  const map = new Map<string, OperatorInventoryItem[]>();
  items.forEach((item) => {
    const category = item.category || 'General';
    map.set(category, [...(map.get(category) ?? []), item]);
  });
  return Array.from(map, ([category, groupItems]) => ({ category, items: groupItems }));
};

const mergeTemplateDocumentState = (templates: JobDocumentTemplate[], documents: OperatorDocument[]) => {
  const documentsByTemplate = new Map<string, OperatorDocument>();
  documents.forEach((document) => {
    const templateId = (document as OperatorDocument & { template_id?: string | null }).template_id;
    if (!templateId) return;
    const current = documentsByTemplate.get(templateId);
    const currentTime = current?.updated_at ? new Date(current.updated_at).getTime() : 0;
    const nextTime = document.updated_at ? new Date(document.updated_at).getTime() : 0;
    if (!current || nextTime >= currentTime) documentsByTemplate.set(templateId, document);
  });

  return templates.map((template) => {
    if (template.document_id || template.status === 'draft' || template.status === 'signed') return template;
    const document = documentsByTemplate.get(template.id) ?? documents.find((candidate) => documentNameMatchesTemplate(candidate, template));
    if (!document) return template;

    const record = document as OperatorDocument & {
      generated_from_version?: number | null;
      locked_at?: string | null;
      is_signed?: boolean | null;
    };
    const signed = Boolean(record.locked_at || record.is_signed);
    return {
      ...template,
      document_id: document.id,
      generated_from_version: record.generated_from_version ?? template.generated_from_version ?? null,
      locked_at: record.locked_at ?? template.locked_at ?? null,
      status: signed ? 'signed' : 'draft',
      state: {
        ...(template.state ?? {}),
        template_version: record.generated_from_version ?? template.state?.template_version ?? null,
      },
    } satisfies JobDocumentTemplate;
  });
};

const documentNameMatchesTemplate = (document: OperatorDocument, template: JobDocumentTemplate) => {
  const documentName = normalizeDocumentName(document.name);
  const templateName = normalizeDocumentName(templateTitle(template));
  const slugName = normalizeDocumentName(template.slug);
  if (!documentName) return false;
  if (templateName && documentName.includes(templateName)) return true;
  if (slugName && documentName.includes(slugName)) return true;

  const requiredWords = (template.slug || templateTitle(template))
    .split(/[-_\s/]+/)
    .map((word) => word.toLowerCase().trim())
    .filter((word) => word.length > 2 && !['and', 'the', 'form'].includes(word));
  return requiredWords.length > 0 && requiredWords.every((word) => documentName.includes(word));
};

const normalizeDocumentName = (value: string | null | undefined) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const numberOrNull = (value: string) => {
  const parsed = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && value.trim() ? parsed : null;
};

type ReadinessTone = 'ready' | 'warning' | 'blocker';

type ReadinessIssue = {
  token: string;
  label: string;
  severity: 'blocker' | 'warning';
  section: DocumentTokenCatalogItem['section'];
  templateIds: string[];
  templateNames: string[];
};

type TemplateReadinessState = {
  templateId: string;
  blockers: ReadinessIssue[];
  warnings: ReadinessIssue[];
  ready: boolean;
};

type DocumentReadinessSummary = {
  blockers: ReadinessIssue[];
  warnings: ReadinessIssue[];
  readyCount: number;
  templateCount: number;
  templateStates: Map<string, TemplateReadinessState>;
};

const refreshReadinessPreflight = async (queryClient: QueryClient, jobId: string, templates: JobDocumentTemplate[]) => {
  await Promise.all(templates.map((template) =>
    queryClient.invalidateQueries({ queryKey: ['job-document-template-preview', jobId, template.id, template.version] }),
  ));
};

const buildDocumentReadiness = (
  data: OperatorJobDetail,
  templates: JobDocumentTemplate[],
  tokenCatalog: DocumentTokenCatalogItem[],
  preflightByTemplateId: Map<string, PreviewResponse | undefined>,
): DocumentReadinessSummary => {
  const catalog = new Map(tokenCatalog.map((item) => [item.token, item]));
  const allBlockers = new Map<string, ReadinessIssue>();
  const allWarnings = new Map<string, ReadinessIssue>();
  const templateStates = new Map<string, TemplateReadinessState>();
  let readyCount = 0;

  templates.forEach((template) => {
    const issues = new Map<string, ReadinessIssue>();
    const requiredTokens = Array.isArray(template.requires) ? template.requires.filter(Boolean) : [];
    requiredTokens.forEach((token) => {
      if (!hasRequirementData(token, data)) {
        addIssue(issues, token, template, catalog, 'requirement');
      }
    });

    const missingTokens = preflightByTemplateId.get(template.id)?.missing_tokens ?? [];
    missingTokens.forEach((token) => addIssue(issues, token, template, catalog, 'preview'));

    const issueList = Array.from(issues.values());
    const blockers = issueList.filter((issue) => issue.severity === 'blocker');
    const warnings = issueList.filter((issue) => issue.severity === 'warning');
    if (!blockers.length && !warnings.length) readyCount += 1;
    templateStates.set(template.id, { templateId: template.id, blockers, warnings, ready: !blockers.length && !warnings.length });

    blockers.forEach((issue) => mergeIssue(allBlockers, issue));
    warnings.forEach((issue) => mergeIssue(allWarnings, issue));
  });

  return {
    blockers: Array.from(allBlockers.values()),
    warnings: Array.from(allWarnings.values()),
    readyCount,
    templateCount: templates.length,
    templateStates,
  };
};

const addIssue = (
  issues: Map<string, ReadinessIssue>,
  token: string,
  template: JobDocumentTemplate,
  catalog: Map<string, DocumentTokenCatalogItem>,
  source: 'requirement' | 'preview',
) => {
  const item = catalog.get(token);
  if (item?.severity === 'optional') return;
  const severity = item?.severity ?? (source === 'requirement' ? 'blocker' : 'warning');
  const issue: ReadinessIssue = {
    token,
    label: item?.label || token,
    severity: severity === 'blocker' ? 'blocker' : 'warning',
    section: item?.section ?? sectionFromToken(token),
    templateIds: [template.id],
    templateNames: [templateTitle(template)],
  };
  mergeIssue(issues, issue);
};

const mergeIssue = (map: Map<string, ReadinessIssue>, issue: ReadinessIssue) => {
  const current = map.get(issue.token);
  if (!current) {
    map.set(issue.token, { ...issue });
    return;
  }
  map.set(issue.token, {
    ...current,
    severity: current.severity === 'blocker' || issue.severity === 'blocker' ? 'blocker' : 'warning',
    templateIds: Array.from(new Set([...current.templateIds, ...issue.templateIds])),
    templateNames: Array.from(new Set([...current.templateNames, ...issue.templateNames])),
  });
};

const hasRequirementData = (token: string, data: OperatorJobDetail) => {
  const estimate = extractEstimate(data.quote_request?.conversation_data);
  const invoice = data.invoice as (OperatorJobDetail['invoice'] & { balance?: number | null }) | null;
  const normalized = token.replace(/_address$/, '').replace(/^customer\./, 'contact.');
  switch (normalized) {
    case 'contact.name':
      return hasText(data.contact?.name);
    case 'contact.email':
      return hasText(data.contact?.email);
    case 'contact.phone':
      return hasText(data.contact?.phone);
    case 'job.origin':
      return hasText(data.job.origin_address);
    case 'job.destination':
      return hasText(data.job.destination_address);
    case 'job.scheduled_date':
      return hasText(data.job.scheduled_date);
    case 'job.arrival_window':
    case 'job.scheduled_start_time':
      return hasText(data.job.scheduled_start_time);
    case 'job.job_number':
      return hasText(data.job.job_number);
    case 'job.crew_size':
      return hasPositiveNumber(data.job.crew_size ?? estimate?.crew.size);
    case 'job.truck_size':
      return hasText(data.job.truck_size ?? estimate?.crew.truckSize);
    case 'estimate.total':
      return hasPositiveNumber(data.job.estimated_total) || Boolean(estimate && priceRange(estimate).max > 0);
    case 'estimate.deposit':
    case 'estimate.deposit_amount':
      return hasPositiveNumber(estimate?.deposit.requiredAmount);
    case 'estimate.hours_grid':
      return Boolean(estimate?.hours.length);
    case 'invoice.total':
      return hasPositiveNumber(invoice?.total);
    case 'invoice.balance':
      return hasPositiveNumber(invoice?.balance ?? invoice?.total);
    case 'inventory.items':
      return data.inventory.length > 0;
    case 'checklist.items':
      return data.checklist.length > 0;
    default:
      return true;
  }
};

const extractEstimate = (conversationData: Json | null | undefined) => {
  if (!conversationData || typeof conversationData !== 'object' || Array.isArray(conversationData)) return null;
  const record = conversationData as Record<string, unknown>;
  if (!record.estimate) return null;
  return estimateFromUnknown(record.estimate);
};

const hasText = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
const hasPositiveNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value > 0;

const sectionFromToken = (token: string): DocumentTokenCatalogItem['section'] => {
  const namespace = token.split('.')[0];
  if (namespace === 'customer' || namespace === 'contact') return 'customer';
  if (namespace === 'invoice') return 'invoice';
  if (namespace === 'inventory' || namespace === 'move') return 'inventory';
  if (namespace === 'checklist') return 'checklist';
  if (namespace === 'estimate') return 'estimate';
  if (namespace === 'signature' || namespace === 'signed') return 'signature';
  if (namespace === 'company') return 'company';
  return 'move';
};

const sectionLabel = (section: DocumentTokenCatalogItem['section']) => ({
  customer: 'Customer',
  move: 'Move details',
  estimate: 'Estimate',
  invoice: 'Invoice',
  inventory: 'Inventory',
  checklist: 'Checklist',
  signature: 'Signature',
  company: 'Company',
}[section]);

const groupReadinessIssues = (issues: ReadinessIssue[]) => {
  const order: DocumentTokenCatalogItem['section'][] = ['customer', 'move', 'estimate', 'invoice', 'inventory', 'checklist', 'signature', 'company'];
  const map = new Map<DocumentTokenCatalogItem['section'], ReadinessIssue[]>();
  issues.forEach((issue) => map.set(issue.section, [...(map.get(issue.section) ?? []), issue]));
  return order
    .filter((section) => map.has(section))
    .map((section) => ({ section, items: map.get(section) ?? [] }));
};

const destinationForSection = (section: DocumentTokenCatalogItem['section'], data: OperatorJobDetail): { label: string; onPress: () => void } | null => {
  if (section === 'customer' && data.contact?.id) {
    return { label: 'Open customer profile', onPress: () => router.push(`/customers/${data.contact?.id}`) };
  }
  if (section === 'estimate' && data.job.quote_request_id) {
    return { label: 'Open estimate editor', onPress: () => router.push(`/estimate/new?quote=${data.job.quote_request_id}`) };
  }
  if (section === 'move') return { label: 'Review move details', onPress: () => undefined };
  if (section === 'invoice') return { label: 'Review invoice card', onPress: () => undefined };
  if (section === 'inventory') return { label: 'Review inventory card', onPress: () => undefined };
  if (section === 'checklist') return { label: 'Review checklist card', onPress: () => undefined };
  return null;
};

const readinessChipLabel = (state: TemplateReadinessState | undefined): { label: string; tone: ReadinessTone } | null => {
  if (!state) return null;
  if (state.blockers.length) return { label: 'Missing fields', tone: 'blocker' };
  if (state.warnings.length) return { label: 'Warning', tone: 'warning' };
  return { label: 'Ready', tone: 'ready' };
};

const groupTemplates = (templates: JobDocumentTemplate[]) => {
  const map = new Map<string, { label: string; color?: string | null; bg?: string | null; templates: JobDocumentTemplate[] }>();
  templates.forEach((template) => {
    const category = template.category;
    const label = category?.label || 'Uncategorized';
    const current = map.get(label) ?? { label, color: category?.color, bg: category?.bg, templates: [] };
    current.templates.push(template);
    map.set(label, current);
  });
  return Array.from(map.values());
};

const templateTitle = (template: JobDocumentTemplate) =>
  template.label || template.template_name || titleCase(template.slug);

const templateStatusLabel = (template: JobDocumentTemplate) => {
  const version = template.state?.template_version ?? template.generated_from_version ?? template.version;
  if (template.status === 'signed' || template.locked_at) {
    return version < template.version ? `Signed · doc v${version} (template v${template.version})` : `Signed · doc v${version}`;
  }
  if (template.status === 'draft') return `Draft · v${version}`;
  return 'Not generated';
};

const documentStatus = (document: OperatorDocument) => {
  const record = document as OperatorDocument & {
    is_generated?: boolean | null;
    is_signed?: boolean | null;
    locked_at?: string | null;
    generated_from_version?: number | null;
  };
  if (record.locked_at || record.is_signed) return `Signed${record.generated_from_version ? ` · v${record.generated_from_version}` : ''}`;
  if (record.is_generated) return `Draft${record.generated_from_version ? ` · v${record.generated_from_version}` : ''}`;
  return document.mime_type || 'Document';
};

const isAdminDocumentLocked = (document: OperatorDocument) => {
  const record = document as OperatorDocument & { locked_at?: string | null; is_signed?: boolean | null };
  return Boolean(record.locked_at || record.is_signed);
};

const isAdminDocumentSent = (document: OperatorDocument) => {
  return Boolean(adminDocumentSentAt(document));
};

const adminDocumentSentAt = (document: OperatorDocument) => {
  const record = document as OperatorDocument & { sent_to_customer_at?: string | null };
  return record.sent_to_customer_at ?? null;
};

const signedDocumentLabel = (document: OperatorDocument) => {
  const record = document as OperatorDocument & { generated_from_version?: number | null };
  return `Signed${record.generated_from_version ? ` · v${record.generated_from_version}` : ''}`;
};

const relativeTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const seconds = Math.max(1, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

const isLockedDocumentError = (error: unknown) => {
  const message = errorMessage(error).toLowerCase();
  return message.includes('409') || message.includes('document_locked') || message.includes('locked');
};

const publicMediaUrl = (path: string) => path.startsWith('http') ? path : supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
const signedMediaUrl = async (path: string) => {
  if (path.startsWith('http')) return path;
  const { data, error } = await supabase.storage.from('media').createSignedUrl(path, 60 * 30);
  if (!error && data?.signedUrl) return data.signedUrl;
  return publicMediaUrl(path);
};
const titleCase = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const styles = {
  label: { color: brand.text, fontSize: 11, fontWeight: '900' as const, textTransform: 'uppercase' as const },
  emptyText: { color: brand.muted, fontSize: 13, lineHeight: 19, fontWeight: '700' as const },
  emptyPanel: { borderRadius: 13, borderWidth: 1, borderColor: brand.border, backgroundColor: brand.bg, padding: 12, gap: 4 },
  input: { minHeight: 44, borderWidth: 1, borderColor: brand.border, borderRadius: 12, backgroundColor: brand.surface, paddingHorizontal: 12, color: brand.text, fontSize: 13 },
  headerAction: { minHeight: 38, borderRadius: 12, borderWidth: 1, borderColor: brand.blue, backgroundColor: brand.blueSoft, paddingHorizontal: 10, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6 },
  headerActionText: { color: brand.blue, fontSize: 11, fontWeight: '900' as const },
  primaryButton: { minHeight: 46, borderRadius: 13, backgroundColor: brand.blue, flexDirection: 'row' as const, gap: 7, alignItems: 'center' as const, justifyContent: 'center' as const, paddingHorizontal: 12 },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' as const },
  secondaryButton: { minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: brand.blue, alignItems: 'center' as const, justifyContent: 'center' as const },
  secondaryText: { color: brand.blue, fontSize: 13, fontWeight: '900' as const },
  checkRow: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: brand.border, paddingHorizontal: 11, paddingVertical: 9, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 9 },
  checkDone: { width: 20, height: 20, borderRadius: 10, backgroundColor: brand.green, alignItems: 'center' as const, justifyContent: 'center' as const },
  listRow: { minHeight: 56, borderRadius: 13, borderWidth: 1, borderColor: brand.border, padding: 9, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
  paymentReviewRow: { minHeight: 64, borderRadius: 13, borderWidth: 1, borderColor: brand.border, padding: 10, flexDirection: 'row' as const, alignItems: 'flex-start' as const, flexWrap: 'wrap' as const, gap: 10 },
  reviewButton: { flex: 1, minHeight: 42, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const },
  rowIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: brand.blueSoft, alignItems: 'center' as const, justifyContent: 'center' as const },
  templateGroup: { gap: 8, borderTopWidth: 1, borderTopColor: brand.border, paddingTop: 10 },
  templateGroupHeader: { alignSelf: 'flex-start' as const, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  templateRow: { minHeight: 78, borderRadius: 13, borderWidth: 1, borderColor: brand.border, padding: 10, gap: 10 },
  templatePrimaryButton: { flex: 1, minHeight: 40, borderRadius: 11, backgroundColor: brand.blue, alignItems: 'center' as const, justifyContent: 'center' as const, paddingHorizontal: 9 },
  templatePrimaryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' as const },
  templateSecondaryButton: { flex: 1, minHeight: 40, borderRadius: 11, borderWidth: 1, borderColor: brand.blue, backgroundColor: brand.surface, alignItems: 'center' as const, justifyContent: 'center' as const, paddingHorizontal: 9 },
  templateSecondaryText: { color: brand.blue, fontSize: 11, fontWeight: '900' as const },
  documentMiniButton: { minHeight: 32, borderRadius: 10, borderWidth: 1, borderColor: brand.blue, backgroundColor: brand.surface, alignItems: 'center' as const, justifyContent: 'center' as const, paddingHorizontal: 8 },
  documentMiniText: { color: brand.blue, fontSize: 10, fontWeight: '900' as const },
  readinessCard: { borderRadius: 14, borderWidth: 1, backgroundColor: brand.bg, padding: 12, gap: 10 },
  readinessIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const },
  missingGroup: { gap: 8, borderTopWidth: 1, borderTopColor: brand.border, paddingTop: 10 },
  missingRow: { minHeight: 52, borderRadius: 12, borderWidth: 1, borderColor: brand.border, padding: 10, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
  previewSheet: { width: '100%' as const, maxWidth: 640, maxHeight: '88%' as const, alignSelf: 'center' as const, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: brand.border, backgroundColor: brand.surface, padding: 14, gap: 10 },
  previewBanner: { borderRadius: 12, backgroundColor: brand.blueSoft, paddingHorizontal: 12, paddingVertical: 9 },
  warningBox: { borderRadius: 13, borderWidth: 1, borderColor: brand.orange, backgroundColor: brand.orangeSoft, padding: 12, gap: 7 },
  webViewFrame: { height: 520, minHeight: 320, borderRadius: 16, borderWidth: 1, borderColor: brand.border, overflow: 'hidden' as const, backgroundColor: '#FFFFFF' },
  timelineRow: { flexDirection: 'row' as const, gap: 9, paddingVertical: 7 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, backgroundColor: brand.blue },
};
