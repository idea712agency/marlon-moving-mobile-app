import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { CustomerCard, CustomerEmpty, CustomerShell } from '@/components/customer/customer-shell';
import { brand } from '@/constants/operator-brand';
import {
  createEstimatePhotoUrls,
  customerEstimateFromLead,
  getCustomerQuoteRequest,
} from '@/lib/customer-quote-requests';
import { shortDate } from '@/lib/data';

export default function CustomerQuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const request = useQuery({
    queryKey: ['customer-quote-request', id],
    queryFn: () => getCustomerQuoteRequest(id),
    enabled: Boolean(id),
  });
  const parsedPayload = request.data ? safePayload(request.data) : { payload: null, error: '' };
  const payload = parsedPayload.payload;
  const photos = useQuery({
    queryKey: ['customer-quote-photos', id, payload?.photoPaths],
    queryFn: () => createEstimatePhotoUrls(payload?.photoPaths ?? []),
    enabled: Boolean(payload?.photoPaths.length),
  });

  if (request.isLoading) {
    return <CustomerShell title="Estimate request"><ActivityIndicator color={brand.blue} /></CustomerShell>;
  }
  if (!request.data || request.error) {
    return <CustomerShell title="Estimate request"><CustomerEmpty title="Request not found" body={request.error instanceof Error ? request.error.message : 'This estimate request could not be loaded.'} /></CustomerShell>;
  }
  if (!payload) {
    return <CustomerShell title="Estimate request"><CustomerEmpty title="Request details unavailable" body={parsedPayload.error || 'The request exists, but its saved details could not be read.'} /></CustomerShell>;
  }

  const lead = request.data;
  const status = customerStatus(lead.status);
  return (
    <CustomerShell title="Estimate request" subtitle={`Confirmation ${lead.id.slice(0, 8).toUpperCase()}`} refreshing={request.isRefetching} onRefresh={() => void request.refetch()}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={[styles.statusPill, { backgroundColor: status.bg }]}><Text style={[styles.statusText, { color: status.fg }]}>{status.label}</Text></View>
        <Text selectable style={{ color: brand.muted, fontSize: 12 }}>{shortDate(lead.created_at.slice(0, 10))}</Text>
      </View>
      <CustomerCard>
        <Text selectable style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>{status.heading}</Text>
        <Text selectable style={{ color: brand.muted, fontSize: 14, lineHeight: 21 }}>{status.description}</Text>
      </CustomerCard>
      {lead.revision_of ? <Text selectable style={{ color: brand.blue, fontSize: 12, fontWeight: '800' }}>Revision of {lead.revision_of.slice(0, 8).toUpperCase()}</Text> : null}

      <CustomerCard>
        <Section title="Move">
          <Detail label="Move type" value={payload.moveType === 'office' ? 'Commercial Moving' : 'Residential Moving'} />
          <Detail label="Move date" value={`${shortDate(payload.moveDate)} · ${payload.arrivalWindow}`} />
          <Detail label="Pickup" value={payload.pickup} />
          <Detail label="Delivery" value={payload.delivery} />
        </Section>
      </CustomerCard>

      <CustomerCard>
        <Section title="Services and inventory">
          <Detail label="Services" value={payload.services.join(', ') || 'None selected'} />
          <Detail label="Property details" value={payload.propertyTags.join(', ') || 'None provided'} />
          <Detail label="Inventory" value={payload.inventory.map((item) => `${item.qty ?? 1} × ${item.label}`).join(', ') || 'None provided'} />
          <Detail label="Photos" value={`${payload.photoPaths.length} attached`} />
          {photos.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
          {photos.data?.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {photos.data.map((photo) => <Image key={photo.path} source={{ uri: photo.url }} contentFit="cover" style={{ width: 92, height: 92, borderRadius: 14, backgroundColor: brand.blueSoft }} />)}
            </View>
          ) : null}
        </Section>
      </CustomerCard>

      <CustomerCard>
        <Section title="Contact">
          <Detail label="Name" value={payload.contact.name} />
          <Detail label="Phone" value={payload.contact.phone} />
          <Detail label="Email" value={payload.contact.email || 'Not provided'} />
          <Detail label="Preferred method" value={titleCase(payload.contact.preferredMethod)} />
          <Detail label="Notes" value={payload.notes || 'No notes'} />
        </Section>
      </CustomerCard>

      <Link href={`/app/estimate?request=${lead.id}`} asChild>
        <Pressable style={styles.primaryButton}><Text style={styles.primaryText}>Edit and submit revision</Text></Pressable>
      </Link>
      <Text selectable style={{ color: brand.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' }}>
        Changes create a new linked revision so the original submission remains on record.
      </Text>
    </CustomerShell>
  );
}

function safePayload(lead: Awaited<ReturnType<typeof getCustomerQuoteRequest>>) {
  try {
    return { payload: customerEstimateFromLead(lead), error: '' };
  } catch (error) {
    return { payload: null, error: error instanceof Error ? error.message : 'Unable to read saved request details.' };
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={{ gap: 12 }}><Text selectable style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>{title}</Text>{children}</View>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={{ gap: 3 }}><Text style={{ color: brand.muted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>{label}</Text><Text selectable style={{ color: brand.text, fontSize: 14, lineHeight: 20 }}>{value}</Text></View>;
}

const titleCase = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
function customerStatus(value?: string | null) {
  const status = (value || 'submitted').toLowerCase();
  if (['quoted', 'sent', 'estimate_ready'].includes(status)) {
    return {
      label: 'Estimate ready',
      heading: 'Your estimate is ready',
      description: 'Our team has reviewed your request. Open the latest update from your portal or contact us with questions.',
      bg: brand.blueSoft,
      fg: brand.blue,
    };
  }
  if (['converted', 'won', 'booked'].includes(status)) {
    return {
      label: 'Booked',
      heading: 'Your move is booked',
      description: 'This request has been converted into a scheduled move. Your move dashboard will show the next steps.',
      bg: brand.greenSoft,
      fg: brand.green,
    };
  }
  if (['lost', 'cancelled', 'declined'].includes(status)) {
    return {
      label: 'Closed',
      heading: 'This request is closed',
      description: 'This request is no longer active. You can submit a new estimate request anytime.',
      bg: brand.redSoft,
      fg: brand.red,
    };
  }
  return {
    label: 'Submitted',
    heading: 'We received your request',
    description: 'Our team is reviewing your move details, inventory, and photos. You can edit and submit a revision if anything changes.',
    bg: brand.greenSoft,
    fg: brand.green,
  };
}
const styles = {
  statusPill: { alignSelf: 'flex-start' as const, borderRadius: 999, backgroundColor: brand.greenSoft, paddingHorizontal: 11, paddingVertical: 6 },
  statusText: { color: brand.green, fontSize: 10, fontWeight: '900' as const, textTransform: 'uppercase' as const },
  primaryButton: { minHeight: 52, borderRadius: 14, backgroundColor: brand.red, alignItems: 'center' as const, justifyContent: 'center' as const },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' as const },
};
