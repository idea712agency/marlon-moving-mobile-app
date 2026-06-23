import { useQuery } from '@tanstack/react-query';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { Download, Share2 } from 'lucide-react-native';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { brand } from '@/constants/operator-brand';
import { computeGrid, formatMoney, hasPackingCharge, resolvePackingPrice, resolveTravelLabel } from '@/lib/adminEstimate';
import { renderEstimateHtml } from '@/lib/estimateHtml';
import { estimateFromQuote, fetchQuote } from '@/lib/estimateRepository';

export default function EstimatePrintScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: ['admin-quote', id], queryFn: () => fetchQuote(id), enabled: Boolean(id) });
  if (query.isLoading) return <OperatorScreen><ActivityIndicator color={brand.blue} /></OperatorScreen>;
  if (!query.data || query.error) return <OperatorScreen><OperatorCard><Text style={{ color: brand.red }}>{query.error instanceof Error ? query.error.message : 'Estimate not found.'}</Text></OperatorCard></OperatorScreen>;
  const estimate = estimateFromQuote(query.data);
  const packing = resolvePackingPrice(estimate);
  const showPacking = hasPackingCharge(estimate);
  const showTravel = (estimate.travelFee ?? 0) > 0;
  const travelLabel = resolveTravelLabel(estimate);

  const createPdf = async (share: boolean) => {
    try {
      const result = await Print.printToFileAsync({ html: renderEstimateHtml(estimate), base64: false });
      if (share) {
        if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
        await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      } else {
        await Print.printAsync({ uri: result.uri });
      }
    } catch (error) {
      Alert.alert('PDF unavailable', error instanceof Error ? error.message : 'Unable to create the PDF.');
    }
  };

  return (
    <OperatorScreen>
      <OperatorPageHeader title="Estimate preview" subtitle={`${estimate.estimateNumber} · printable customer copy`} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <PrintButton label="Print" icon={<Download color="#FFFFFF" size={18} />} onPress={() => void createPdf(false)} />
        <PrintButton label="Share PDF" icon={<Share2 color="#FFFFFF" size={18} />} onPress={() => void createPdf(true)} />
      </View>
      <OperatorCard>
        <View style={{ borderBottomWidth: 2, borderBottomColor: brand.navy, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: brand.navy, fontSize: 18, fontWeight: '900' }}>MARLON MOVING SERVICES, LLC</Text>
            <Text style={styles.muted}>USDOT #3470374</Text>
            <Text style={styles.muted}>22054 Shaw Rd, Sterling, VA 20164</Text>
            <Text style={styles.muted}>571-525-6129 · marlonmovingservices@gmail.com</Text>
            <Text style={styles.muted}>marlonmovingservices.com</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: brand.navy, fontSize: 20, fontWeight: '900' }}>ESTIMATE</Text>
            <Text style={styles.muted}>#{estimate.estimateNumber}</Text>
            <Text style={styles.muted}>{estimate.issuedDate}</Text>
          </View>
        </View>
        <PreviewSection title="Customer">
          <PreviewLine label="Name" value={estimate.contact.name} />
          <PreviewLine label="Phone" value={estimate.contact.phone} />
          <PreviewLine label="Email" value={estimate.contact.email} />
        </PreviewSection>
        {estimate.updatedCopy.isUpdatedCopy ? (
          <View style={{ backgroundColor: brand.blueSoft, borderLeftWidth: 4, borderLeftColor: brand.red, padding: 12 }}>
            <Text style={{ color: brand.text, fontWeight: '900' }}>Updated Copy Notice</Text>
            <Text style={styles.muted}>{estimate.updatedCopy.notice}</Text>
          </View>
        ) : null}
        <PreviewSection title="Why Choose Marlon Moving Services">
          <Text style={styles.muted}>✓ Licensed & insured</Text>
          <Text style={styles.muted}>✓ Professional moving crews</Text>
          <Text style={styles.muted}>✓ Clear arrival windows</Text>
          <Text style={styles.muted}>✓ Written estimates</Text>
          <Text style={styles.muted}>✓ Furniture protection</Text>
          <Text style={styles.muted}>✓ Local Sterling team</Text>
        </PreviewSection>
        <PreviewSection title="Move details">
          <PreviewLine label="Origin" value={estimate.addresses.origin} />
          <PreviewLine label="Destination" value={estimate.addresses.destination} />
          <PreviewLine label="Move date" value={estimate.schedule.moveDate} />
          <PreviewLine label="Arrival" value={estimate.schedule.arrivalWindow} />
          <PreviewLine label="Crew" value={`${estimate.crew.size} movers · ${estimate.crew.truckSize}`} />
          {travelLabel ? <PreviewLine label="Travel Fee" value={travelLabel} /> : null}
          {estimate.options.noTravelTime ? <Text style={[styles.muted, { fontStyle: 'italic' }]}>No travel time is charged on this estimate.</Text> : null}
        </PreviewSection>
        <PreviewSection title="Estimated moving costs">
          <View style={{ borderWidth: 1, borderColor: brand.border, borderRadius: 10, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', padding: 9, backgroundColor: brand.navy }}>
              {costHeaders(showPacking, showTravel).map((header) => <Text key={header} style={[styles.cell, { color: '#FFFFFF', fontWeight: '900' }]}>{header}</Text>)}
            </View>
            {computeGrid(estimate).map((row, index) => (
              <View key={`${row.hours}-${index}`} style={{ flexDirection: 'row', padding: 9, borderBottomWidth: 1, borderBottomColor: brand.border }}>
                {costValues(row, showPacking, showTravel).map((value, valueIndex) => <Text key={`${value}-${valueIndex}`} style={[styles.cell, valueIndex === 0 || valueIndex === costValues(row, showPacking, showTravel).length - 1 ? { color: brand.navy, fontWeight: '900' } : null]}>{value}</Text>)}
              </View>
            ))}
          </View>
        </PreviewSection>
        {showPacking ? <PreviewSection title={`${packing.label} — ${formatMoney(packing.price)}`}><Text style={styles.muted}>Selected packing materials kit: {packing.label}.</Text></PreviewSection> : null}
        <PreviewSection title="Terms">
          <Text style={styles.muted}>Required deposit: {formatMoney(estimate.deposit.requiredAmount)}. Paid: {formatMoney(estimate.deposit.paidAmount)}.</Text>
          <Text style={styles.muted}>Final charges may change if scope, inventory, access conditions, crew requirements, or service time changes.</Text>
        </PreviewSection>
        <PreviewSection title="Important Estimate Notice">
          <Text style={styles.muted}>This estimate is based on the information supplied. Final charges may change if scope, inventory, access conditions, crew requirements, or service time changes.</Text>
        </PreviewSection>
        <PreviewSection title="Customer Approval">
          <View style={{ flexDirection: 'row', gap: 20, paddingTop: 28 }}>
            <View style={styles.signature}><Text style={styles.muted}>Customer signature</Text></View>
            <View style={styles.signature}><Text style={styles.muted}>Date</Text></View>
          </View>
        </PreviewSection>
      </OperatorCard>
    </OperatorScreen>
  );
}

function PrintButton({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ flex: 1, height: 48, borderRadius: 13, backgroundColor: brand.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{icon}<Text style={{ color: '#FFFFFF', fontWeight: '900' }}>{label}</Text></Pressable>;
}
function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={{ gap: 8 }}><Text style={{ color: brand.navy, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Text>{children}</View>;
}
function PreviewLine({ label, value }: { label: string; value: string }) {
  return <View style={{ flexDirection: 'row', gap: 8 }}><Text style={{ color: brand.text, fontWeight: '900' }}>{label}:</Text><Text selectable style={{ flex: 1, color: brand.muted }}>{value || '—'}</Text></View>;
}
const costHeaders = (showPacking: boolean, showTravel: boolean) => [
  'Hrs',
  'Labor',
  ...(showPacking ? ['Pack'] : []),
  'Truck',
  ...(showTravel ? ['Travel'] : []),
  'Total',
];
const costValues = (row: ReturnType<typeof computeGrid>[number], showPacking: boolean, showTravel: boolean) => [
  `${row.hours}`,
  formatMoney(row.labor),
  ...(showPacking ? [formatMoney(row.packing)] : []),
  formatMoney(row.truckFee),
  ...(showTravel ? [formatMoney(row.travelFee)] : []),
  formatMoney(row.total),
];
const styles = {
  muted: { color: brand.muted, fontSize: 12, lineHeight: 18 },
  cell: { flex: 1, color: brand.text, fontSize: 10, fontVariant: ['tabular-nums'] as 'tabular-nums'[] },
  signature: { flex: 1, borderTopWidth: 1, borderTopColor: brand.text, paddingTop: 6 },
};
