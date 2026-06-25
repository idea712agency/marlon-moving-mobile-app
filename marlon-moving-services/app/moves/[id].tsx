import { Image } from 'expo-image';
import { Link, router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Circle,
  CreditCard,
  FileText,
  MapPin,
  MessageCircle,
  Package,
  RefreshCw,
  Send,
  Truck,
  UserRound,
  Users,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';

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
import type { ManualPaymentSubmission } from '@/lib/data';
import { money, shortDate, shortTime } from '@/lib/data';
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
        <Link href="/messages" asChild><Pressable style={styles.headerAction}><MessageCircle color={brand.blue} size={16} /><Text style={styles.headerActionText}>Messages</Text></Pressable></Link>
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
      <DocumentsCard documents={data.documents} />
      <InvoiceCard data={data} actions={actions} />
      <ManualPaymentsCard payments={data.manual_payments ?? []} actions={actions} />
      <MessagesCard messages={data.messages} actions={actions} />
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

function DocumentsCard({ documents }: { documents: OperatorDocument[] }) {
  return (
    <OperatorCard>
      <SectionTitle icon={<FileText color={brand.blue} size={20} />} title={`Documents (${documents.length})`} />
      {!documents.length ? <EmptyPanel title="No job documents" body="Contracts, receipts, photos, and signed paperwork will appear here." /> : null}
      {documents.slice(0, 8).map((document) => {
        const isImage = document.mime_type?.startsWith('image/');
        const url = publicMediaUrl(document.file_path);
        return (
          <Pressable key={document.id} onPress={() => void WebBrowser.openBrowserAsync(url)} style={styles.listRow}>
            {isImage ? <Image source={url} style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: brand.blueSoft }} /> : <View style={styles.rowIcon}><FileText color={brand.blue} size={18} /></View>}
            <View style={{ flex: 1 }}>
              <Text selectable numberOfLines={1} style={{ color: brand.text, fontWeight: '900' }}>{document.name}</Text>
              <Text style={{ color: brand.muted, fontSize: 11 }}>{titleCase(String(document.document_type))} · {document.is_signed ? 'Signed' : 'Unsigned'}</Text>
            </View>
          </Pressable>
        );
      })}
      <Link href="/documents" asChild><Pressable style={styles.secondaryButton}><Text style={styles.secondaryText}>Open documents library</Text></Pressable></Link>
    </OperatorCard>
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

function MessagesCard({ messages, actions }: { messages: OperatorMessage[]; actions: ReturnType<typeof useOperatorJobActions> }) {
  const [content, setContent] = useState('');
  const recent = [...messages].sort((a, b) => String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''))).slice(-5);
  const send = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    runAction('Message sent', async () => {
      await actions.sendMessage.mutateAsync(trimmed);
      setContent('');
    });
  };
  return (
    <OperatorCard>
      <SectionTitle icon={<MessageCircle color={brand.blue} size={20} />} title="Messages" />
      {!recent.length ? <EmptyPanel title="No messages yet" body="Customer and admin messages linked to this move will appear here." /> : null}
      {recent.map((message) => <MessageBubble key={message.id} message={message} />)}
      <Field label="Reply" value={content} multiline onChangeText={setContent} />
      <PrimaryAction label={actions.sendMessage.isPending ? 'Sending…' : 'Send reply'} disabled={actions.sendMessage.isPending || !content.trim()} icon={<Send color="#FFFFFF" size={16} />} onPress={send} />
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

const numberOrNull = (value: string) => {
  const parsed = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && value.trim() ? parsed : null;
};

const publicMediaUrl = (path: string) => path.startsWith('http') ? path : supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
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
  timelineRow: { flexDirection: 'row' as const, gap: 9, paddingVertical: 7 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, backgroundColor: brand.blue },
};
