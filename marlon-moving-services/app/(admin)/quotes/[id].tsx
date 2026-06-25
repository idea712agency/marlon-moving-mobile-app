import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { StatusBadge } from './index';
import { brand } from '@/constants/operator-brand';
import { bookEstimate, convertedJobIdFromQuote, estimateFromQuote, fetchQuote, validateBookableQuote } from '@/lib/estimateRepository';

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [bookingError, setBookingError] = useState('');
  const query = useQuery({ queryKey: ['admin-quote', id], queryFn: () => fetchQuote(id), enabled: Boolean(id) });
  const book = useMutation({
    mutationFn: bookEstimate,
    onSuccess: (result) => {
      setBookingError('');
      void queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-quote', result.quote_request_id] });
      void queryClient.invalidateQueries({ queryKey: ['operator-moves'] });
      void queryClient.invalidateQueries({ queryKey: ['operator-schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['operator-job', result.job_id] });
      Alert.alert(result.already_converted ? 'Already booked — opening move' : 'Move booked');
      router.push(`/moves/${result.job_id}`);
    },
    onError: (error) => setBookingError(error instanceof Error ? error.message : 'Unable to book this move.'),
  });

  if (query.isLoading) return <OperatorScreen><ActivityIndicator color={brand.blue} /></OperatorScreen>;
  if (!query.data || query.error) {
    return <OperatorScreen><OperatorCard><Text style={{ color: brand.red }}>{query.error instanceof Error ? query.error.message : 'Quote not found.'}</Text></OperatorCard></OperatorScreen>;
  }

  const quote = query.data;
  const estimate = estimateFromQuote(quote);
  const bookedJobId = estimate.converted_job_id ?? convertedJobIdFromQuote(quote);
  const validation = validateBookableQuote(quote);
  const hasEstimate = Boolean(
    quote.conversation_data &&
      typeof quote.conversation_data === 'object' &&
      !Array.isArray(quote.conversation_data) &&
      quote.conversation_data.estimate,
  );
  const requestBooking = () => {
    const validation = validateBookableQuote(quote);
    if (validation) {
      setBookingError(validation);
      return;
    }
    setBookingError('');
    Alert.alert('Book this move?', 'This creates one scheduled job and links it to this estimate.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Book Move', onPress: () => book.mutate(quote) },
    ]);
  };

  return (
    <OperatorScreen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <OperatorPageHeader title={quote.contacts?.name || 'Quote request'} subtitle={`Quote ${quote.id.slice(0, 8)}`} />
      <OperatorCard>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1, gap: 5 }}>
            <Text selectable style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>{nextStepTitle(hasEstimate, Boolean(bookedJobId), quote.status || 'new')}</Text>
            <Text selectable style={{ color: brand.muted, fontSize: 13, lineHeight: 19 }}>{nextStepCopy(hasEstimate, Boolean(bookedJobId), quote.status || 'new')}</Text>
          </View>
          <StatusBadge status={quoteStatusStage(hasEstimate, Boolean(bookedJobId), quote.status || 'new')} />
        </View>
      </OperatorCard>
      <OperatorCard>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>Request details</Text>
          <StatusBadge status={quoteStatusStage(hasEstimate, Boolean(bookedJobId), quote.status || 'new')} />
        </View>
        <Detail label="Phone" value={quote.contacts?.phone || 'Not provided'} />
        <Detail label="Email" value={quote.contacts?.email || 'Not provided'} />
        <Detail label="Move date" value={quote.move_date || 'Not selected'} />
        <Detail label="Home size" value={quote.home_size} />
        <Detail label="Origin" value={quote.origin} />
        <Detail label="Destination" value={quote.destination} />
      </OperatorCard>

      <OperatorCard>
        <Text style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>{hasEstimate ? 'Estimate ready' : 'Build estimate'}</Text>
        <Text style={{ color: brand.muted, lineHeight: 20 }}>
          {hasEstimate ? 'Open the saved estimate to edit pricing, send, print, or convert it.' : 'The request will prefill customer and move details.'}
        </Text>
        <Link href={hasEstimate ? `/estimate/${quote.id}` : `/estimate/new?quote=${quote.id}`} asChild>
          <Pressable style={{ height: 50, borderRadius: 13, backgroundColor: brand.blue, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900' }}>{hasEstimate ? 'Open estimate' : 'Build estimate'}</Text>
          </Pressable>
        </Link>
        {hasEstimate ? (
          <Link href={`/estimate/${quote.id}/print`} asChild>
            <Pressable style={{ height: 50, borderRadius: 13, borderWidth: 1, borderColor: brand.blue, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: brand.blue, fontSize: 15, fontWeight: '900' }}>Print preview</Text>
            </Pressable>
          </Link>
        ) : null}
        {bookedJobId ? (
          <Link href={`/moves/${bookedJobId}`} asChild>
            <Pressable style={{ height: 50, borderRadius: 13, borderWidth: 1, borderColor: brand.green, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: brand.green, fontSize: 15, fontWeight: '900' }}>View Job</Text>
            </Pressable>
          </Link>
        ) : null}
        {hasEstimate && !bookedJobId ? (
          <>
            <View style={{ borderRadius: 14, borderWidth: 1, borderColor: validation ? brand.orange : brand.green, backgroundColor: validation ? brand.orangeSoft : brand.greenSoft, padding: 12, gap: 8 }}>
              <Text selectable style={{ color: validation ? brand.orange : brand.green, fontSize: 13, fontWeight: '900' }}>{validation ? 'Review before booking' : 'Ready to book'}</Text>
              <Requirement label="Saved estimate" complete={hasEstimate} />
              <Requirement label="Customer contact" complete={Boolean(quote.contact_id)} />
              <Requirement label="Origin address" complete={Boolean(quote.origin)} />
              <Requirement label="Destination address" complete={Boolean(quote.destination)} />
              <Requirement label="Move date" complete={Boolean(quote.move_date)} />
            </View>
            <Pressable disabled={book.isPending} onPress={requestBooking} style={{ height: 50, borderRadius: 13, backgroundColor: brand.orange, opacity: book.isPending ? 0.62 : 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900' }}>{book.isPending ? 'Booking…' : 'Approve / Book Move'}</Text>
            </Pressable>
            {bookingError ? <Text selectable style={{ color: brand.red, fontSize: 13, lineHeight: 18, fontWeight: '800' }}>{bookingError}</Text> : null}
          </>
        ) : null}
      </OperatorCard>
    </OperatorScreen>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={{ gap: 3 }}><Text style={{ color: brand.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>{label}</Text><Text selectable style={{ color: brand.text, lineHeight: 20 }}>{value}</Text></View>;
}

function Requirement({ label, complete }: { label: string; complete: boolean }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}><Text style={{ color: brand.text, fontSize: 12, fontWeight: '800' }}>{label}</Text><Text style={{ color: complete ? brand.green : brand.orange, fontSize: 11, fontWeight: '900' }}>{complete ? 'Ready' : 'Missing'}</Text></View>;
}

function quoteStatusStage(hasEstimate: boolean, booked: boolean, status: string) {
  if (booked || status === 'won') return 'booked';
  if (status === 'lost' || status === 'declined') return 'lost';
  if (status === 'sent') return 'sent';
  if (hasEstimate) return 'estimate_ready';
  return 'new';
}

function nextStepTitle(hasEstimate: boolean, booked: boolean, status: string) {
  const stage = quoteStatusStage(hasEstimate, booked, status);
  if (stage === 'booked') return 'Move is booked';
  if (stage === 'sent') return 'Estimate sent';
  if (stage === 'estimate_ready') return 'Estimate is ready';
  if (stage === 'lost') return 'Quote closed';
  return 'Build the estimate';
}

function nextStepCopy(hasEstimate: boolean, booked: boolean, status: string) {
  const stage = quoteStatusStage(hasEstimate, booked, status);
  if (stage === 'booked') return 'Open the job command center to manage crew, invoice, documents, and customer updates.';
  if (stage === 'sent') return 'Use the saved estimate for print review or book the move when the customer approves.';
  if (stage === 'estimate_ready') return 'Review pricing, print or send the estimate, then approve and book the move.';
  if (stage === 'lost') return 'This quote is closed. Keep it for history unless the customer reopens the request.';
  return 'Start from this request to prefill customer, addresses, move date, and inventory details.';
}
