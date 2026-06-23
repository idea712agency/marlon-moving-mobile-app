import { useQuery } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native';

import { OperatorCard, OperatorScreen } from '@/components/operator/app-shell';
import { EstimateEditor } from '@/components/operator/estimate/estimate-editor';
import { brand } from '@/constants/operator-brand';
import { estimateFromUnknown } from '@/lib/adminEstimate';
import { estimateFromQuote, fetchQuote } from '@/lib/estimateRepository';
import type { AdminQuote } from '@/lib/estimateRepository';

export default function NewEstimateScreen() {
  const { quote: quoteId, manual } = useLocalSearchParams<{ quote?: string; manual?: string }>();
  const query = useQuery({ queryKey: ['admin-quote', quoteId], queryFn: () => fetchQuote(quoteId!), enabled: Boolean(quoteId) });
  if (manual === 'true') {
    const now = new Date().toISOString();
    const manualQuote: AdminQuote = {
      id: '',
      contact_id: null,
      conversation_data: { source: 'admin_manual' },
      created_at: now,
      destination: '',
      estimated_price_max: null,
      estimated_price_min: null,
      follow_up_email_id: null,
      follow_up_sent_at: null,
      home_size: 'Not specified',
      move_date: null,
      origin: '',
      special_items: false,
      status: 'draft',
      updated_at: now,
      contacts: null,
    };
    return <EstimateEditor initialQuote={manualQuote} initialEstimate={estimateFromUnknown(null)} manual />;
  }
  if (!quoteId) return <Redirect href="/quotes" />;
  if (query.isLoading) return <OperatorScreen><ActivityIndicator color={brand.blue} /></OperatorScreen>;
  if (!query.data || query.error) return <OperatorScreen><OperatorCard><Text style={{ color: brand.red }}>{query.error instanceof Error ? query.error.message : 'Quote not found.'}</Text></OperatorCard></OperatorScreen>;
  return <EstimateEditor initialQuote={query.data} initialEstimate={estimateFromQuote(query.data)} />;
}
