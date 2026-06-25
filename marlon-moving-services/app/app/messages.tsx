import { ActivityIndicator } from 'react-native';

import { CustomerConversationThread } from '@/components/messaging/conversation-thread';
import { CustomerEmpty, CustomerShell } from '@/components/customer/customer-shell';
import { brand } from '@/constants/operator-brand';
import { useCustomerDashboard } from '@/hooks/use-customer-dashboard';
import { errorMessage, shortDate, shortTime } from '@/lib/data';

export default function CustomerMessagesScreen() {
  const dashboard = useCustomerDashboard();
  const job = dashboard.data?.job ?? null;

  return (
    <CustomerShell title="Messages" subtitle="Chat directly with the Marlon Moving team." unread={dashboard.data?.unread_notifications ?? 0} refreshing={dashboard.isRefetching} onRefresh={() => void dashboard.refetch()}>
      {dashboard.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
      {dashboard.error ? <CustomerEmpty title="Messages unavailable" body={errorMessage(dashboard.error)} /> : null}
      {!dashboard.isLoading && !job ? <CustomerEmpty title="No linked move" body="Messages will be available once your move is linked." /> : null}
      {job ? <CustomerConversationThread title={`${job.job_number} · ${shortDate(job.scheduled_date)} · ${shortTime(job.scheduled_start_time)}`} jobId={job.id} /> : null}
    </CustomerShell>
  );
}

