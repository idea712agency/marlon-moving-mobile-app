import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { BriefcaseBusiness, Calendar, MessageSquareText, Send, Truck, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';

import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { StatusBadge } from './index';
import { brand } from '@/constants/operator-brand';
import { getAdminQuoteDetail, updateAdminQuoteStatus, type AdminQuoteDetail, type QuoteWorkspaceAction } from '@/lib/admin-quotes';
import { bookEstimate, convertedJobIdFromQuote, estimateFromQuote, type AdminQuote } from '@/lib/estimateRepository';
import { money, shortDate } from '@/lib/data';

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [bookingError, setBookingError] = useState('');
  const [lostSheetOpen, setLostSheetOpen] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const query = useQuery({ queryKey: ['admin-quote-detail', id], queryFn: () => getAdminQuoteDetail(id), enabled: Boolean(id) });
  const detail = query.data;
  const adminQuote = useMemo(() => (detail ? quoteDetailToAdminQuote(detail) : null), [detail]);
  const actions = new Set<QuoteWorkspaceAction>(detail?.available_actions ?? []);
  const book = useMutation({
    mutationFn: bookEstimate,
    onSuccess: (result) => {
      setBookingError('');
      invalidateQuoteQueries(queryClient, id);
      void queryClient.invalidateQueries({ queryKey: ['operator-moves'] });
      void queryClient.invalidateQueries({ queryKey: ['operator-schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['operator-job', result.job_id] });
      Alert.alert(result.already_converted ? 'Already booked - opening move' : 'Move booked');
      router.push(`/moves/${result.job_id}`);
    },
    onError: (error) => setBookingError(error instanceof Error ? error.message : 'Unable to book this move.'),
  });
  const markLost = useMutation({
    mutationFn: () => updateAdminQuoteStatus(id, 'lost', lostReason.trim() || undefined),
    onSuccess: () => {
      setLostSheetOpen(false);
      setLostReason('');
      invalidateQuoteQueries(queryClient, id);
      Alert.alert('Quote marked lost');
    },
    onError: (error) => Alert.alert('Status update failed', error instanceof Error ? error.message : 'Unable to mark quote lost.'),
  });

  if (query.isLoading) return <OperatorScreen><ActivityIndicator color={brand.blue} /></OperatorScreen>;
  if (!detail || !adminQuote || query.error) {
    return <OperatorScreen><OperatorCard><Text style={{ color: brand.red }}>{query.error instanceof Error ? query.error.message : 'Quote not found.'}</Text></OperatorCard></OperatorScreen>;
  }

  const quote = detail.quote;
  const estimate = estimateFromQuote(adminQuote);
  const bookedJobId = detail.job?.id ?? detail.job?.job_id ?? estimate.converted_job_id ?? convertedJobIdFromQuote(adminQuote);
  const canBuildEstimate = actions.has('build_estimate');
  const canSendEstimate = actions.has('send_estimate');
  const canMarkLost = actions.has('mark_lost');
  const canConvert = actions.has('convert_to_job');
  const canMessage = actions.has('message_customer');

  const requestBooking = () => {
    setBookingError('');
    Alert.alert('Book this move?', 'This creates one scheduled job and links it to this estimate.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Book Move', onPress: () => book.mutate(adminQuote) },
    ]);
  };

  return (
    <OperatorScreen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <OperatorPageHeader title={customerName(detail) || 'Quote request'} subtitle={quote.quote_number ?? `Quote ${quote.id.slice(0, 8)}`} />

      <OperatorCard>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1, gap: 5 }}>
            <Text selectable style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>{nextStepTitle(quote.readiness)}</Text>
            <Text selectable style={{ color: brand.muted, fontSize: 13, lineHeight: 19 }}>{nextStepCopy(quote.readiness)}</Text>
          </View>
          <StatusBadge status={quote.readiness} />
        </View>
      </OperatorCard>

      <OperatorCard>
        <SectionHeader title="Customer" Icon={MessageSquareText} />
        <Detail label="Name" value={customerName(detail) || 'Customer pending'} />
        <Detail label="Phone" value={customerPhone(detail) || 'Not provided'} />
        <Detail label="Email" value={customerEmail(detail) || 'Not provided'} />
        <Detail label="Lead source" value={leadSource(detail) || 'Not provided'} />
      </OperatorCard>

      <OperatorCard>
        <SectionHeader title="Move details" Icon={Calendar} />
        <Detail label="Service type" value={quote.service_type || 'Move'} />
        <Detail label="Move date" value={quote.move_date ? shortDate(quote.move_date) : 'Not selected'} />
        <Detail label="Home size" value={quote.home_size || 'Not provided'} />
        <Detail label="Origin" value={quote.origin || quote.origin_city || 'Origin pending'} />
        <Detail label="Destination" value={quote.destination || quote.destination_city || 'Destination pending'} />
      </OperatorCard>

      <OperatorCard>
        <SectionHeader title="Estimate" Icon={BriefcaseBusiness} />
        <Text selectable style={{ color: brand.text, fontSize: 24, fontWeight: '900' }}>{estimateTotalLabel(detail)}</Text>
        <Text selectable style={{ color: brand.muted, lineHeight: 20 }}>
          {quote.has_estimate ? 'Estimate data is linked to this quote.' : 'No saved estimate is linked yet.'}
        </Text>
        {detail.estimate?.totals ? <EstimateTotals totals={detail.estimate.totals} /> : null}
      </OperatorCard>

      {bookedJobId ? (
        <OperatorCard>
          <SectionHeader title="Linked job" Icon={Truck} />
          <Detail label="Job" value={detail.job?.job_number || bookedJobId} />
          <Detail label="Status" value={detail.job?.status || 'Booked'} />
          <Detail label="Scheduled" value={detail.job?.scheduled_date ? shortDate(detail.job.scheduled_date) : 'Not scheduled'} />
          <Link href={`/moves/${bookedJobId}`} asChild>
            <Pressable style={{ height: 50, borderRadius: 13, borderWidth: 1, borderColor: brand.green, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: brand.green, fontSize: 15, fontWeight: '900' }}>View Job</Text>
            </Pressable>
          </Link>
        </OperatorCard>
      ) : null}

      <OperatorCard>
        <SectionHeader title="Actions" Icon={Send} />
        {canBuildEstimate ? (
          <Link href={quote.has_estimate ? `/estimate/${quote.id}` : `/estimate/new?quote=${quote.id}`} asChild>
            <Pressable style={{ height: 50, borderRadius: 13, backgroundColor: brand.blue, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900' }}>{quote.has_estimate ? 'Open estimate' : 'Build estimate'}</Text>
            </Pressable>
          </Link>
        ) : null}
        {canSendEstimate ? (
          <Pressable onPress={() => Alert.alert('Send estimate', 'Send flow is ready to connect to the existing estimate send action.')} style={{ height: 50, borderRadius: 13, borderWidth: 1, borderColor: brand.blue, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: brand.blue, fontSize: 15, fontWeight: '900' }}>Send estimate</Text>
          </Pressable>
        ) : null}
        {canConvert ? (
          <Pressable disabled={book.isPending} onPress={requestBooking} style={{ height: 50, borderRadius: 13, backgroundColor: brand.orange, opacity: book.isPending ? 0.62 : 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900' }}>{book.isPending ? 'Booking...' : 'Approve / Book Move'}</Text>
          </Pressable>
        ) : null}
        {canMessage ? (
          <Pressable onPress={() => router.push('/messages')} style={{ height: 50, borderRadius: 13, borderWidth: 1, borderColor: brand.purple, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: brand.purple, fontSize: 15, fontWeight: '900' }}>Message customer</Text>
          </Pressable>
        ) : null}
        {canMarkLost ? (
          <Pressable onPress={() => setLostSheetOpen(true)} style={{ height: 50, borderRadius: 13, borderWidth: 1, borderColor: brand.red, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: brand.red, fontSize: 15, fontWeight: '900' }}>Mark lost</Text>
          </Pressable>
        ) : null}
        {bookingError ? <Text selectable style={{ color: brand.red, fontSize: 13, lineHeight: 18, fontWeight: '800' }}>{bookingError}</Text> : null}
        {!detail.available_actions?.length ? <Text selectable style={{ color: brand.muted, fontSize: 13, lineHeight: 18 }}>No actions are available for this quote right now.</Text> : null}
      </OperatorCard>

      <OperatorCard>
        <Text style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>Timeline</Text>
        {detail.timeline?.length ? (
          detail.timeline.map((item, index) => (
            <View key={item.id ?? `${item.created_at}-${index}`} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <View style={{ width: 9, height: 9, borderRadius: 999, marginTop: 6, backgroundColor: brand.blue }} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text selectable style={{ color: brand.text, fontSize: 13, fontWeight: '900' }}>{item.label || item.event_type || item.type || 'Activity'}</Text>
                {item.description ? <Text selectable style={{ color: brand.muted, fontSize: 12, lineHeight: 17 }}>{item.description}</Text> : null}
                <Text selectable style={{ color: brand.muted, fontSize: 11, fontWeight: '800' }}>{item.created_at ? relativeTime(item.created_at) : 'Time pending'}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text selectable style={{ color: brand.muted, fontSize: 13 }}>No timeline events returned yet.</Text>
        )}
      </OperatorCard>

      <LostReasonSheet
        visible={lostSheetOpen}
        reason={lostReason}
        saving={markLost.isPending}
        onReasonChange={setLostReason}
        onClose={() => setLostSheetOpen(false)}
        onSubmit={() => markLost.mutate()}
      />
    </OperatorScreen>
  );
}

function SectionHeader({ title, Icon }: { title: string; Icon: typeof MessageSquareText }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: brand.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon color={brand.blue} size={18} strokeWidth={2.5} />
      </View>
      <Text style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>{title}</Text>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={{ gap: 3 }}><Text style={{ color: brand.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>{label}</Text><Text selectable style={{ color: brand.text, lineHeight: 20 }}>{value}</Text></View>;
}

function EstimateTotals({ totals }: { totals: Record<string, unknown> }) {
  return (
    <View style={{ borderRadius: 14, borderWidth: 1, borderColor: brand.border, padding: 12, gap: 8 }}>
      {Object.entries(totals).slice(0, 6).map(([key, value]) => (
        <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
          <Text style={{ flex: 1, color: brand.muted, fontSize: 12, fontWeight: '800' }}>{humanize(key)}</Text>
          <Text selectable style={{ color: brand.text, fontSize: 12, fontWeight: '900' }}>{formatUnknownValue(value)}</Text>
        </View>
      ))}
    </View>
  );
}

function LostReasonSheet({
  visible,
  reason,
  saving,
  onReasonChange,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  reason: string;
  saving: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(7,21,47,0.28)' }}>
        <View style={{ width: '100%', maxWidth: 448, alignSelf: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: brand.surface, padding: 18, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Text style={{ color: brand.text, fontSize: 20, fontWeight: '900' }}>Mark quote lost</Text>
            <Pressable accessibilityLabel="Close" accessibilityRole="button" onPress={onClose} style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}>
              <X color={brand.muted} size={20} strokeWidth={2.4} />
            </Pressable>
          </View>
          <TextInput
            value={reason}
            onChangeText={onReasonChange}
            placeholder="Reason"
            placeholderTextColor="#94A3B8"
            multiline
            style={{ minHeight: 92, borderRadius: 14, borderWidth: 1, borderColor: brand.border, padding: 12, color: brand.text, textAlignVertical: 'top' }}
          />
          <Pressable disabled={saving} onPress={onSubmit} style={{ height: 50, borderRadius: 13, backgroundColor: brand.red, opacity: saving ? 0.62 : 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900' }}>{saving ? 'Saving...' : 'Mark lost'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function quoteDetailToAdminQuote(detail: AdminQuoteDetail): AdminQuote {
  const quote = detail.quote;
  const contactName = customerName(detail);
  return {
    id: quote.id,
    contact_id: quote.contact_id ?? null,
    origin: quote.origin ?? quote.origin_city ?? '',
    destination: quote.destination ?? quote.destination_city ?? '',
    home_size: quote.home_size ?? '',
    move_date: quote.move_date ?? null,
    status: quote.status ?? 'new',
    conversation_data: quote.conversation_data ?? null,
    estimated_price_min: quote.estimate_total ?? null,
    estimated_price_max: quote.estimate_total ?? null,
    contacts: {
      id: quote.contact_id ?? '',
      name: contactName ?? '',
      phone: customerPhone(detail),
      email: customerEmail(detail),
    },
  } as AdminQuote;
}

function customerName(detail: AdminQuoteDetail) {
  return firstString(
    detail.quote.customer_name,
    recordString(detail.quote, 'contact_name'),
    recordString(detail.quote, 'name'),
    nestedString(detail.quote, 'contact', 'name'),
    nestedString(detail.quote, 'contacts', 'name'),
    recordString(detail.lead, 'customer_name'),
    recordString(detail.lead, 'name'),
    nestedString(detail.lead, 'contact', 'name'),
    nestedString(detail.lead, 'contacts', 'name'),
  );
}

function customerPhone(detail: AdminQuoteDetail) {
  return firstString(
    detail.quote.customer_phone,
    recordString(detail.quote, 'phone'),
    nestedString(detail.quote, 'contact', 'phone'),
    nestedString(detail.quote, 'contacts', 'phone'),
    recordString(detail.lead, 'phone'),
    nestedString(detail.lead, 'contact', 'phone'),
    nestedString(detail.lead, 'contacts', 'phone'),
  );
}

function customerEmail(detail: AdminQuoteDetail) {
  return firstString(
    detail.quote.customer_email,
    recordString(detail.quote, 'email'),
    nestedString(detail.quote, 'contact', 'email'),
    nestedString(detail.quote, 'contacts', 'email'),
    recordString(detail.lead, 'email'),
    nestedString(detail.lead, 'contact', 'email'),
    nestedString(detail.lead, 'contacts', 'email'),
  );
}

function leadSource(detail: AdminQuoteDetail) {
  return firstString(detail.quote.lead_source, recordString(detail.lead, 'lead_source'), recordString(detail.lead, 'source'));
}

function estimateTotalLabel(detail: AdminQuoteDetail) {
  const estimate = detail.estimate;
  const direct = estimate?.total ?? estimate?.estimate_total ?? detail.quote.estimate_total;
  if (typeof direct === 'number') return money(direct);
  const totals = estimate?.totals;
  if (totals) {
    const likely = totals.total ?? totals.grand_total ?? totals.estimate_total;
    if (typeof likely === 'number') return money(likely);
  }
  return 'Estimate not built';
}

function nextStepTitle(readiness: string) {
  if (readiness === 'booked') return 'Move is booked';
  if (readiness === 'sent') return 'Estimate sent';
  if (readiness === 'estimate_ready') return 'Estimate is ready';
  if (readiness === 'lost') return 'Quote closed';
  return 'Build the estimate';
}

function nextStepCopy(readiness: string) {
  if (readiness === 'booked') return 'Open the job command center to manage crew, invoice, documents, and customer updates.';
  if (readiness === 'sent') return 'Use the saved estimate for print review or book the move when the customer approves.';
  if (readiness === 'estimate_ready') return 'Review pricing, send the estimate, then approve and book the move.';
  if (readiness === 'lost') return 'This quote is closed. Keep it for history unless the customer reopens the request.';
  return 'Start from this request to prefill customer, addresses, move date, and inventory details.';
}

function invalidateQuoteQueries(queryClient: ReturnType<typeof useQueryClient>, quoteId?: string) {
  void queryClient.invalidateQueries({ queryKey: ['admin-quotes-workspace'] });
  void queryClient.invalidateQueries({ queryKey: ['admin-app-dashboard'] });
  if (quoteId) void queryClient.invalidateQueries({ queryKey: ['admin-quote-detail', quoteId] });
}

function formatUnknownValue(value: unknown) {
  if (typeof value === 'number') return money(value);
  if (typeof value === 'string') return value;
  if (value == null) return '-';
  return JSON.stringify(value);
}

function firstString(...values: unknown[]) {
  const value = values.find((item) => typeof item === 'string' && item.trim());
  return typeof value === 'string' ? value : null;
}

function recordString(value: unknown, key: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const item = (value as Record<string, unknown>)[key];
  return typeof item === 'string' ? item : null;
}

function nestedString(value: unknown, parent: string, key: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const child = (value as Record<string, unknown>)[parent];
  return recordString(child, key);
}

function humanize(value: string) {
  return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function relativeTime(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(diff)) return value;
  const minutes = Math.max(0, Math.round(diff / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
