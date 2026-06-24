import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native';

import { OperatorCard, OperatorScreen } from '@/components/operator/app-shell';
import { EstimateEditor } from '@/components/operator/estimate/estimate-editor';
import { brand } from '@/constants/operator-brand';
import { estimateFromQuote, fetchQuote } from '@/lib/estimateRepository';

export default function EditEstimateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: ['admin-quote', id], queryFn: () => fetchQuote(id), enabled: Boolean(id) });
  if (query.isLoading) return <OperatorScreen><ActivityIndicator color={brand.blue} /></OperatorScreen>;
  if (!query.data || query.error) return <OperatorScreen><OperatorCard><Text style={{ color: brand.red }}>{query.error instanceof Error ? query.error.message : 'Estimate not found.'}</Text></OperatorCard></OperatorScreen>;
  return <EstimateEditor initialQuote={query.data} initialEstimate={estimateFromQuote(query.data)} />;
}
