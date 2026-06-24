import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Check, ChevronLeft, FileText, FolderOpen, Save, Send, Truck, X } from 'lucide-react-native';
import { ReactNode, useState } from 'react';
import { Alert, Modal, Pressable, Switch, Text, TextInput, View } from 'react-native';

import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { brand } from '@/constants/operator-brand';
import {
  computeGrid,
  CREW_PRESETS,
  formatMoney,
  hasPackingCharge,
  PACKING_KITS,
  priceRange,
  resolvePackingPrice,
  TRAVEL_ZONES,
  TRUCK_PRESETS,
  type DepositStatus,
  type EstimatePayload,
  type PackingKitId,
  type TravelZoneId,
} from '@/lib/adminEstimate';
import { convertEstimateToJob, saveEstimate, type AdminQuote, type QuoteStatus } from '@/lib/estimateRepository';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

const STATUSES: QuoteStatus[] = ['draft', 'sent', 'accepted', 'declined', 'won', 'lost'];
const DEPOSIT_STATUSES: DepositStatus[] = ['required', 'paid', 'applied'];

export function EstimateEditor({
  initialQuote,
  initialEstimate,
  manual = false,
}: {
  initialQuote: AdminQuote;
  initialEstimate: EstimatePayload;
  manual?: boolean;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quote, setQuote] = useState(initialQuote);
  const [estimate, setEstimate] = useState(initialEstimate);
  const [status, setStatus] = useState<QuoteStatus>((initialQuote.status as QuoteStatus) || 'draft');
  const [loadOpen, setLoadOpen] = useState(false);
  const [hoursText, setHoursText] = useState(initialEstimate.hours.join(', '));
  const range = priceRange(estimate);
  const packing = resolvePackingPrice(estimate);
  const showPackingColumn = hasPackingCharge(estimate);
  const showTravelColumn = (estimate.travelFee ?? 0) > 0;

  const recentQuotes = useQuery({
    queryKey: ['admin-estimate-load-list'],
    enabled: loadOpen,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('id, origin, destination, move_date, status, contacts(name, phone)')
        .order('updated_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (nextStatus: QuoteStatus) => {
      if (!user) throw new Error('Your admin session has expired.');
      if (!estimate.contact.name.trim()) throw new Error('Customer name is required.');
      if (!estimate.contact.phone.trim()) throw new Error('Customer phone is required.');
      return saveEstimate({ quote, estimate, status: nextStatus, userId: user.id, createQuote: manual && !quote.id });
    },
    onSuccess: ({ quote: savedQuote, estimate: savedEstimate }, nextStatus) => {
      setQuote(savedQuote);
      setEstimate(savedEstimate);
      setStatus(nextStatus);
      void queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-quote', savedQuote.id] });
      if (manual && !quote.id) router.replace(`/estimate/${savedQuote.id}`);
      else Alert.alert('Estimate saved', `Status is now ${titleCase(nextStatus)}.`);
    },
    onError: (error) => Alert.alert('Unable to save', messageOf(error)),
  });

  const convert = useMutation({
    mutationFn: () => convertEstimateToJob(quote, estimate),
    onSuccess: ({ jobId, alreadyConverted }) => {
      setEstimate((current) => ({ ...current, converted_job_id: jobId }));
      void queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
      if (alreadyConverted) router.push(`/moves/${jobId}`);
      else Alert.alert('Job created', 'The estimate was converted successfully.', [
        { text: 'Stay here' },
        { text: 'View job', onPress: () => router.push(`/moves/${jobId}`) },
      ]);
    },
    onError: (error) => Alert.alert(error instanceof Error && error.name === 'PartialConversionError' ? 'Recovery required' : 'Conversion failed', messageOf(error)),
  });

  const setContact = (key: keyof EstimatePayload['contact'], value: string) =>
    setEstimate((current) => ({ ...current, contact: { ...current.contact, [key]: value } }));
  const setAddress = (key: keyof EstimatePayload['addresses'], value: string) =>
    setEstimate((current) => ({ ...current, addresses: { ...current.addresses, [key]: value } }));
  const setSchedule = (key: keyof EstimatePayload['schedule'], value: string) =>
    setEstimate((current) => ({ ...current, schedule: { ...current.schedule, [key]: value } }));
  const setCrew = (key: keyof EstimatePayload['crew'], value: number | string) =>
    setEstimate((current) => ({ ...current, crew: { ...current.crew, [key]: value } }));
  const setTravel = (key: 'travelZone' | 'travelFee', value: TravelZoneId | number) =>
    setEstimate((current) => ({ ...current, [key]: value }));
  const setOptions = <K extends keyof EstimatePayload['options']>(key: K, value: EstimatePayload['options'][K]) =>
    setEstimate((current) => ({ ...current, options: { ...current.options, [key]: value } }));
  const setDeposit = <K extends keyof EstimatePayload['deposit']>(key: K, value: EstimatePayload['deposit'][K]) =>
    setEstimate((current) => ({ ...current, deposit: { ...current.deposit, [key]: value } }));
  const setUpdated = <K extends keyof EstimatePayload['updatedCopy']>(key: K, value: EstimatePayload['updatedCopy'][K]) =>
    setEstimate((current) => ({ ...current, updatedCopy: { ...current.updatedCopy, [key]: value } }));

  const footer = (
    <View style={styles.actionBar}>
      <FooterAction label="Save" icon={<Save color="#FFFFFF" size={16} />} primary disabled={save.isPending} onPress={() => save.mutate(status)} />
      <FooterAction label="PDF" icon={<FileText color={quote.id ? brand.blue : brand.muted} size={16} />} disabled={!quote.id} onPress={() => quote.id && router.push(`/estimate/${quote.id}/print`)} />
      <FooterAction label={estimate.converted_job_id ? 'Job' : 'Convert'} icon={estimate.converted_job_id ? <Check color={brand.green} size={16} /> : <Truck color={quote.id ? brand.orange : brand.muted} size={16} />} disabled={!quote.id || convert.isPending} onPress={() => estimate.converted_job_id ? router.push(`/moves/${estimate.converted_job_id}`) : confirmConvert(() => convert.mutate())} />
      <FooterAction label="Send" icon={<Send color={brand.muted} size={16} />} disabled onPress={() => {}} />
    </View>
  );

  return (
    <OperatorScreen footer={footer}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={[styles.loadButton, { width: 42, paddingHorizontal: 0, justifyContent: 'center' }]}>
          <ChevronLeft color={brand.navy} size={19} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <OperatorPageHeader title="Estimate" subtitle={`${estimate.estimateNumber} · ${formatMoney(range.min)}–${formatMoney(range.max)}`} />
        </View>
        <Pressable onPress={() => setLoadOpen(true)} style={styles.loadButton}>
          <FolderOpen color={brand.blue} size={17} />
          <Text style={{ color: brand.blue, fontSize: 12, fontWeight: '900' }}>Load</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text selectable style={{ color: brand.text, fontWeight: '900' }}>Estimate #{estimate.estimateNumber}</Text>
        <StatusPill status={status} />
      </View>

      <EstimateSection number="1" title="Customer">
        <Field label="Name" value={estimate.contact.name} onChangeText={(value) => setContact('name', value)} />
        <Field label="Phone" value={estimate.contact.phone} keyboardType="phone-pad" onChangeText={(value) => setContact('phone', value)} />
        <Field label="Email" value={estimate.contact.email} keyboardType="email-address" autoCapitalize="none" onChangeText={(value) => setContact('email', value)} />
      </EstimateSection>

      <EstimateSection number="2" title="Move details">
        <Field label="Origin" value={estimate.addresses.origin} onChangeText={(value) => setAddress('origin', value)} />
        <Field label="Destination" value={estimate.addresses.destination} onChangeText={(value) => setAddress('destination', value)} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Move date" placeholder="YYYY-MM-DD" value={estimate.schedule.moveDate} onChangeText={(value) => setSchedule('moveDate', value)} /></View>
          <View style={{ flex: 1 }}><Field label="Arrival window" value={estimate.schedule.arrivalWindow} onChangeText={(value) => setSchedule('arrivalWindow', value)} /></View>
        </View>
      </EstimateSection>

      <EstimateSection number="3" title="Crew & rates">
        <Text style={styles.label}>Crew presets</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CREW_PRESETS.map((preset) => (
            <PresetPill
              key={preset.label}
              active={estimate.crew.size === preset.crewSize && estimate.crew.hourlyRate === preset.hourlyRate}
              title={preset.label}
              subtitle={`${formatMoney(preset.hourlyRate)}/hr`}
              onPress={() => setEstimate((current) => ({ ...current, crew: { ...current.crew, size: preset.crewSize, hourlyRate: preset.hourlyRate } }))}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <NumberField label="Crew size" value={estimate.crew.size} onChange={(value) => setCrew('size', value)} />
          <NumberField label="Hourly rate" value={estimate.crew.hourlyRate} onChange={(value) => setCrew('hourlyRate', value)} />
          <NumberField label="Minimum hours" value={estimate.crew.minimumHours} onChange={(value) => setCrew('minimumHours', value)} />
        </View>
        <Text style={styles.label}>Truck presets</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TRUCK_PRESETS.map((preset) => (
            <PresetPill
              key={preset.size}
              active={estimate.crew.truckSize === preset.size && estimate.crew.truckFee === preset.fee}
              title={preset.size}
              subtitle={formatMoney(preset.fee)}
              onPress={() => setEstimate((current) => ({ ...current, crew: { ...current.crew, truckSize: preset.size, truckFee: preset.fee } }))}
            />
          ))}
        </View>
        <Field label="Truck size" value={estimate.crew.truckSize} onChangeText={(value) => setCrew('truckSize', value)} />
        <NumberField label="Truck fee" value={estimate.crew.truckFee} onChange={(value) => setCrew('truckFee', value)} />
        <Field
          label="Hours grid"
          value={hoursText}
          placeholder="7, 8, 10, 12"
          onChangeText={(value) => {
            setHoursText(value);
            const hours = value.split(',').map((item) => Number(item.trim())).filter((item) => Number.isFinite(item) && item > 0);
            if (hours.length) setEstimate((current) => ({ ...current, hours }));
          }}
        />
      </EstimateSection>

      <EstimateSection number="4" title="Options">
        <Text style={styles.label}>Travel zone</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TRAVEL_ZONES.map((zone) => (
            <PresetPill
              key={zone.id}
              active={estimate.travelZone === zone.id}
              title={zone.fee === null ? 'Custom' : zone.fee === 0 ? 'Free' : formatMoney(zone.fee)}
              subtitle={zone.range}
              onPress={() => setEstimate((current) => ({
                ...current,
                travelZone: zone.id,
                travelFee: zone.fee ?? current.travelFee ?? 0,
              }))}
            />
          ))}
        </View>
        <NumberField label="Travel fee ($)" value={estimate.travelFee ?? 0} onChange={(value) => setTravel('travelFee', value)} />
        <Text style={styles.label}>Packing material kit</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {PACKING_KITS.map((kit) => (
            <PresetPill
              key={kit.id}
              active={(estimate.options.packingKit ?? 'none') === kit.id}
              title={kit.label.replace(' Kit', '')}
              subtitle={kit.price ? formatMoney(kit.price) : 'No kit'}
              onPress={() => setEstimate((current) => ({
                ...current,
                options: {
                  ...current.options,
                  packingKit: kit.id as PackingKitId,
                  packingPackage: false,
                  packingPrice: kit.price,
                  packingPackagePrice: kit.price,
                },
              }))}
            />
          ))}
        </View>
        {packing.id === 'legacy' ? <Text style={{ color: brand.orange, fontSize: 11, lineHeight: 16 }}>Legacy packing package is active: {formatMoney(packing.price)}.</Text> : null}
        <ToggleRow title="No travel time disclaimer" subtitle="Show the italic disclaimer on the customer copy." value={estimate.options.noTravelTime} onChange={(value) => setOptions('noTravelTime', value)} />
      </EstimateSection>

      <EstimateSection number="5" title="Deposit">
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <NumberField label="Required" value={estimate.deposit.requiredAmount} onChange={(value) => setDeposit('requiredAmount', value)} />
          <NumberField label="Paid" value={estimate.deposit.paidAmount} onChange={(value) => setDeposit('paidAmount', value)} />
        </View>
        <Pills values={DEPOSIT_STATUSES} selected={estimate.deposit.status} onSelect={(value) => setDeposit('status', value)} />
      </EstimateSection>

      <EstimateSection number="6" title="Updated copy">
        <ToggleRow title="This is an updated copy" subtitle="Use after a deposit or estimate revision." value={estimate.updatedCopy.isUpdatedCopy} onChange={(value) => setUpdated('isUpdatedCopy', value)} />
        {estimate.updatedCopy.isUpdatedCopy ? <>
          <Field label="Updated date" placeholder="YYYY-MM-DD" value={estimate.updatedCopy.date} onChangeText={(value) => setUpdated('date', value)} />
          <Field label="Updated copy notice" value={estimate.updatedCopy.notice} multiline onChangeText={(value) => setUpdated('notice', value)} />
        </> : null}
      </EstimateSection>

      <EstimateSection number="7" title="Internal notes">
        <Field label="Notes" value={estimate.notes} multiline onChangeText={(notes) => setEstimate((current) => ({ ...current, notes }))} />
      </EstimateSection>

      <OperatorCard>
        <Text style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>Live pricing</Text>
        <Text style={{ color: brand.navy, fontWeight: '900' }}>{formatMoney(range.min)}–{formatMoney(range.max)}</Text>
        <View style={{ borderWidth: 1, borderColor: brand.border, borderRadius: 12, overflow: 'hidden' }}>
          <PriceRow header values={priceHeaders(showPackingColumn, showTravelColumn)} />
          {computeGrid(estimate).map((row, index) => (
            <PriceRow
              key={`${row.hours}-${index}`}
              values={priceValues(row, showPackingColumn, showTravelColumn)}
            />
          ))}
        </View>
        <Text style={styles.label}>Status</Text>
        <Pills
          values={STATUSES}
          selected={status}
          onSelect={(value) => {
            setStatus(value);
            save.mutate(value);
          }}
        />
      </OperatorCard>

      <LoadSheet visible={loadOpen} loading={recentQuotes.isLoading} quotes={recentQuotes.data ?? []} onClose={() => setLoadOpen(false)} />
    </OperatorScreen>
  );
}

function EstimateSection({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return <OperatorCard><View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><View style={styles.step}><Text style={{ color: brand.blue, fontWeight: '900' }}>{number}</Text></View><Text style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>{title}</Text></View>{children}</OperatorCard>;
}
function Field({ label, multiline, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) {
  return <View style={{ gap: 6 }}><Text style={styles.label}>{label}</Text><TextInput {...props} multiline={multiline} placeholderTextColor="#94A3B8" style={[styles.input, multiline ? { minHeight: 94, paddingTop: 12, textAlignVertical: 'top' } : null]} /></View>;
}
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <View style={{ minWidth: '45%', flex: 1, gap: 6 }}><Text style={styles.label}>{label}</Text><TextInput value={String(value)} keyboardType="decimal-pad" onChangeText={(text) => onChange(Number(text.replace(/[^0-9.]/g, '')) || 0)} style={styles.input} /></View>;
}
function ToggleRow({ title, subtitle, value, onChange }: { title: string; subtitle: string; value: boolean; onChange: (value: boolean) => void }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><View style={{ flex: 1 }}><Text style={styles.label}>{title}</Text><Text style={{ color: brand.muted, fontSize: 11, lineHeight: 16 }}>{subtitle}</Text></View><Switch value={value} onValueChange={onChange} trackColor={{ false: brand.border, true: brand.blue }} /></View>;
}
function PresetPill({ title, subtitle, active, onPress }: { title: string; subtitle: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ minWidth: '30%', flex: 1, borderRadius: 14, borderWidth: 1, borderColor: active ? brand.blue : brand.border, backgroundColor: active ? brand.blueSoft : brand.surface, paddingHorizontal: 10, paddingVertical: 10, gap: 2 }}><Text numberOfLines={1} style={{ color: active ? brand.blue : brand.text, fontSize: 12, fontWeight: '900' }}>{title}</Text><Text numberOfLines={1} style={{ color: brand.muted, fontSize: 10, fontWeight: '700' }}>{subtitle}</Text></Pressable>;
}
function Pills<T extends string>({ values, selected, onSelect }: { values: readonly T[]; selected: T; onSelect: (value: T) => void }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{values.map((value) => <Pressable key={value} onPress={() => onSelect(value)} style={{ borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: selected === value ? brand.blue : brand.blueSoft }}><Text style={{ color: selected === value ? '#FFFFFF' : brand.navy, fontSize: 10, fontWeight: '900' }}>{titleCase(value)}</Text></Pressable>)}</View>;
}
function PriceRow({ values, header }: { values: string[]; header?: boolean }) {
  return <View style={{ flexDirection: 'row', backgroundColor: header ? brand.navy : brand.surface, borderBottomWidth: header ? 0 : 1, borderBottomColor: brand.border }}>{values.map((value, index) => <Text key={`${header ? 'h' : 'r'}-${index}`} numberOfLines={1} style={{ flex: 1, paddingHorizontal: 2, paddingVertical: 9, textAlign: 'center', color: header ? '#FFFFFF' : brand.text, fontSize: 8, fontWeight: header ? '900' : '700', fontVariant: ['tabular-nums'] }}>{value}</Text>)}</View>;
}
function FooterAction({ label, icon, primary, disabled, onPress }: { label: string; icon: ReactNode; primary?: boolean; disabled?: boolean; onPress: () => void }) {
  return <Pressable disabled={disabled} onPress={onPress} style={{ flex: 1, height: 48, borderRadius: 13, backgroundColor: primary ? brand.blue : brand.surface, borderWidth: primary ? 0 : 1, borderColor: brand.border, opacity: disabled ? 0.5 : 1, alignItems: 'center', justifyContent: 'center', gap: 2 }}>{icon}<Text numberOfLines={1} style={{ color: primary ? '#FFFFFF' : brand.text, fontSize: 8, fontWeight: '900' }}>{label}</Text></Pressable>;
}
function StatusPill({ status }: { status: string }) { return <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, backgroundColor: brand.blueSoft }}><Text style={{ color: brand.blue, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>{status}</Text></View>; }
function LoadSheet({ visible, loading, quotes, onClose }: { visible: boolean; loading: boolean; quotes: any[]; onClose: () => void }) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(7,21,47,0.28)' }}><View style={{ width: '100%', maxWidth: 448, maxHeight: '72%', alignSelf: 'center', backgroundColor: brand.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, gap: 10 }}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: brand.text, fontSize: 20, fontWeight: '900' }}>Load quote</Text><Pressable onPress={onClose}><X color={brand.muted} size={22} /></Pressable></View>{loading ? <Text style={{ color: brand.muted }}>Loading…</Text> : quotes.map((item) => <Pressable key={item.id} onPress={() => { onClose(); router.replace(`/estimate/new?quote=${item.id}`); }} style={{ borderRadius: 14, borderWidth: 1, borderColor: brand.border, padding: 12, gap: 3 }}><Text style={{ color: brand.text, fontWeight: '900' }}>{item.contacts?.name || `Quote ${item.id.slice(0, 8)}`}</Text><Text numberOfLines={1} style={{ color: brand.muted, fontSize: 11 }}>{item.origin || 'TBD'} → {item.destination || 'TBD'}</Text></Pressable>)}</View></View></Modal>;
}
const confirmConvert = (action: () => void) => Alert.alert('Convert to job?', 'This creates one scheduled job and links it to this estimate.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Convert', onPress: action }]);
const moneyShort = (value: number) => `$${Math.round(value).toLocaleString('en-US')}`;
const titleCase = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const messageOf = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong.';
const priceHeaders = (showPacking: boolean, showTravel: boolean) => [
  'Hrs',
  'Labor',
  ...(showPacking ? ['Pack'] : []),
  'Truck',
  ...(showTravel ? ['Travel'] : []),
  'Total',
  'Dep.',
  'After',
];
const priceValues = (row: ReturnType<typeof computeGrid>[number], showPacking: boolean, showTravel: boolean) => [
  String(row.hours),
  moneyShort(row.labor),
  ...(showPacking ? [moneyShort(row.packing)] : []),
  moneyShort(row.truckFee),
  ...(showTravel ? [moneyShort(row.travelFee)] : []),
  moneyShort(row.total),
  moneyShort(row.depositPaid),
  moneyShort(row.afterDeposit),
];
const styles = {
  label: { color: brand.text, fontSize: 12, fontWeight: '900' as const },
  input: { minHeight: 46, borderWidth: 1, borderColor: brand.border, borderRadius: 12, backgroundColor: brand.surface, paddingHorizontal: 12, color: brand.text, fontSize: 13 },
  step: { width: 29, height: 29, borderRadius: 15, backgroundColor: brand.blueSoft, alignItems: 'center' as const, justifyContent: 'center' as const },
  loadButton: { minHeight: 42, borderRadius: 12, backgroundColor: brand.blueSoft, paddingHorizontal: 12, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  actionBar: { borderRadius: 20, borderWidth: 1, borderColor: brand.border, backgroundColor: brand.surface, padding: 7, flexDirection: 'row' as const, gap: 6, boxShadow: '0 10px 28px rgba(7,21,47,0.18)' },
};
