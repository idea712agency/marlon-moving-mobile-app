import { Link } from 'expo-router';
import {
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  CreditCard,
  FileText,
  MapPin,
  MessageCircle,
  Package,
  Truck,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { CustomerEmpty, CustomerShell } from '@/components/customer/customer-shell';
import { brand } from '@/constants/operator-brand';
import { useCustomerDashboard } from '@/hooks/use-customer-dashboard';
import type { ChecklistItem, CrewLocation, Invoice, Job } from '@/lib/data';
import { money, shortDate, shortTime } from '@/lib/data';
import { useAuth } from '@/providers/auth-provider';

const QUICK_ACTIONS = [
  { label: 'Reschedule', href: '/reschedule' as const, Icon: CalendarDays },
  { label: 'Message us', href: '/app/messages' as const, Icon: MessageCircle },
  { label: 'Documents', href: '/app/documents' as const, Icon: FileText },
  { label: 'Inventory', href: '/inventory' as const, Icon: Package },
  { label: 'Payment', href: '/payment' as const, Icon: CreditCard },
];

export default function CustomerHomeScreen() {
  const { user } = useAuth();
  const dashboard = useCustomerDashboard();
  const [showDetails, setShowDetails] = useState(false);
  const data = dashboard.data;
  const job = data?.job;
  const firstName = useMemo(() => {
    const fullName = String(user?.user_metadata?.full_name ?? '').trim();
    return fullName.split(/\s+/)[0] || 'there';
  }, [user?.user_metadata?.full_name]);

  return (
    <CustomerShell
      title={`${greeting()}, ${firstName}!`}
      subtitle="Here’s what’s happening with your move."
      unread={data?.unread_notifications ?? 0}
      refreshing={dashboard.isRefetching}
      onRefresh={() => void dashboard.refetch()}>
      {dashboard.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
      {dashboard.error ? <CustomerEmpty title="Dashboard unavailable" body={dashboard.error instanceof Error ? dashboard.error.message : 'Unable to load your portal.'} /> : null}
      {!dashboard.isLoading && !dashboard.error && !job ? <NoLinkedMove /> : null}
      {job ? (
        <>
          <MoveHero job={job} expanded={showDetails} onToggle={() => setShowDetails((value) => !value)} />
          <QuickActions />
          <CrewCard job={job} crew={data?.crew ?? null} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <ChecklistCard checklist={data?.checklist ?? []} />
            <PaymentCard invoice={data?.invoice ?? null} job={job} />
          </View>
        </>
      ) : null}
    </CustomerShell>
  );
}

function NoLinkedMove() {
  return (
    <>
      <View style={[styles.card, { alignItems: 'center', paddingVertical: 28 }]}>
        <View style={styles.largeIcon}><Truck color={brand.blue} size={30} /></View>
        <Text selectable style={{ color: brand.text, fontSize: 21, fontWeight: '900', textAlign: 'center' }}>No linked move yet</Text>
        <Text selectable style={{ color: brand.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' }}>
          Your move dashboard will appear here once our team links your account to a scheduled job.
        </Text>
      </View>
      <Link href="/app/quote" asChild>
        <Pressable style={styles.primaryButton}><Text style={styles.primaryText}>View your quote requests</Text><ChevronRight color="#FFFFFF" size={18} /></Pressable>
      </Link>
      <QuickActions compact />
    </>
  );
}

function MoveHero({ job, expanded, onToggle }: { job: Job; expanded: boolean; onToggle: () => void }) {
  const currentStep = stepForStatus(job.status);
  const steps = [
    { label: 'Estimate', caption: 'Approved' },
    { label: 'Booked', caption: job.confirmed_at ? shortDate(job.confirmed_at.slice(0, 10)) : 'Confirmed' },
    { label: 'In Progress', caption: currentStep < 2 ? 'Upcoming' : titleCase(job.status) },
    { label: 'Completed', caption: currentStep === 3 ? 'Finished' : 'Pending' },
  ];

  return (
    <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
      <View style={styles.ribbon}><Text style={styles.ribbonText}>{currentStep === 3 ? 'COMPLETED MOVE' : 'UPCOMING MOVE'}</Text></View>
      <View style={{ padding: 16, gap: 18 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          <MoveFact Icon={CalendarDays} label="Move date" value={shortDate(job.scheduled_date)} detail={shortTime(job.scheduled_start_time)} />
          <MoveFact Icon={MapPin} label="From" value={shortAddress(job.origin_address)} detail={expanded ? job.origin_address : undefined} />
          <MoveFact Icon={MapPin} label="To" value={shortAddress(job.destination_address)} detail={expanded ? job.destination_address : undefined} />
        </View>
        {expanded ? (
          <View style={styles.detailsGrid}>
            <Detail label="Job number" value={job.job_number} />
            <Detail label="Move type" value={titleCase(job.job_type)} />
            <Detail label="Crew" value={job.crew_size ? `${job.crew_size} movers` : 'Pending assignment'} />
            <Detail label="Truck" value={job.truck_size || 'Pending assignment'} />
          </View>
        ) : null}
        <ProgressRail steps={steps} currentStep={currentStep} />
        <Pressable accessibilityRole="button" onPress={onToggle} style={styles.heroButton}>
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>{expanded ? 'Hide Move Details' : 'View Move Details'}</Text>
          <ChevronRight color="#FFFFFF" size={18} style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }} />
        </Pressable>
      </View>
    </View>
  );
}

function MoveFact({ Icon, label, value, detail }: { Icon: typeof CalendarDays; label: string; value: string; detail?: string }) {
  return (
    <View style={{ flexGrow: 1, flexBasis: 116, minWidth: 0, gap: 5 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon color={brand.navy} size={16} />
        <Text style={styles.factLabel}>{label}</Text>
      </View>
      <Text selectable numberOfLines={2} style={styles.factValue}>{value}</Text>
      {detail ? <Text selectable numberOfLines={2} style={styles.factDetail}>{detail}</Text> : null}
    </View>
  );
}

function ProgressRail({ steps, currentStep }: { steps: { label: string; caption: string }[]; currentStep: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      {steps.map((step, index) => {
        const complete = index < currentStep;
        const active = index === currentStep;
        return (
          <View key={step.label} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>
              {index > 0 ? <View style={{ flex: 1, height: 3, backgroundColor: index <= currentStep ? brand.blue : brand.border }} /> : <View style={{ flex: 1 }} />}
              <View style={[styles.stepCircle, { backgroundColor: complete || active ? brand.blue : '#A8AFBA' }]}>
                {complete ? <Check color="#FFFFFF" size={17} strokeWidth={3} /> : active ? <Truck color="#FFFFFF" size={16} /> : <Package color="#FFFFFF" size={15} />}
              </View>
              {index < steps.length - 1 ? <View style={{ flex: 1, height: 3, backgroundColor: index < currentStep ? brand.blue : brand.border }} /> : <View style={{ flex: 1 }} />}
            </View>
            <Text numberOfLines={1} style={{ color: active ? brand.blue : brand.text, fontSize: 10, fontWeight: '900' }}>{step.label}</Text>
            <Text numberOfLines={1} style={{ color: brand.muted, fontSize: 8, fontWeight: '700' }}>{step.caption}</Text>
          </View>
        );
      })}
    </View>
  );
}

function QuickActions({ compact = false }: { compact?: boolean }) {
  const actions = compact ? QUICK_ACTIONS.slice(0, 3) : QUICK_ACTIONS;
  return (
    <View style={{ gap: 10 }}>
      <Text selectable style={styles.sectionTitle}>Quick Actions</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {actions.map(({ label, href, Icon }) => (
          <Link key={label} href={href} asChild>
            <Pressable style={styles.quickAction}>
              <View style={styles.quickIcon}><Icon color={brand.blue} size={21} /></View>
              <Text numberOfLines={2} style={{ color: brand.text, fontSize: 10, lineHeight: 13, fontWeight: '900', textAlign: 'center' }}>{label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

function CrewCard({ job, crew }: { job: Job; crew: CrewLocation | null }) {
  const names = crewNames(job.crew_members);
  const eta = crew?.eta_window || (crew?.eta_minutes ? `Approximately ${crew.eta_minutes} minutes` : 'ETA will appear when the crew is en route.');
  const enRoute = Boolean(crew?.eta_window || crew?.eta_minutes);

  return (
    <View style={[styles.card, { backgroundColor: enRoute ? '#F2FBF6' : '#FFFFFF' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={[styles.quickIcon, { backgroundColor: enRoute ? brand.greenSoft : brand.blueSoft }]}>
          <Truck color={enRoute ? brand.green : brand.blue} size={21} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text selectable style={{ color: enRoute ? brand.green : brand.text, fontSize: 17, fontWeight: '900' }}>{enRoute ? 'Your crew is on the way!' : 'Crew update'}</Text>
          <Text selectable style={{ color: brand.muted, fontSize: 12 }}>{eta}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flexDirection: 'row' }}>
          {(names.length ? names : Array.from({ length: Math.min(job.crew_size ?? 1, 3) }, (_, index) => `Crew ${index + 1}`)).slice(0, 3).map((name, index) => (
            <View key={`${name}-${index}`} style={[styles.avatar, { marginLeft: index ? -8 : 0, backgroundColor: avatarColors[index % avatarColors.length] }]}>
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>{initials(name)}</Text>
            </View>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: brand.muted, fontSize: 10, fontWeight: '800' }}>CREW ASSIGNED</Text>
          <Text selectable numberOfLines={1} style={{ color: brand.text, fontSize: 14, fontWeight: '900' }}>{names.length ? names.join(', ') : `${job.crew_size ?? 0} movers`}</Text>
        </View>
        <Link href="/app/messages" asChild>
          <Pressable style={styles.smallButton}><MessageCircle color={brand.blue} size={16} /><Text style={{ color: brand.blue, fontSize: 11, fontWeight: '900' }}>Message</Text></Pressable>
        </Link>
      </View>
    </View>
  );
}

function ChecklistCard({ checklist }: { checklist: ChecklistItem[] }) {
  const sorted = [...checklist].sort((a, b) => a.sort_order - b.sort_order);
  const completed = sorted.filter((item) => item.status === 'completed').length;
  return (
    <View style={[styles.card, styles.halfCard]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text selectable style={styles.cardTitle}>Move Checklist</Text>
        <Text style={{ color: brand.blue, fontSize: 10, fontWeight: '900' }}>{completed}/{sorted.length}</Text>
      </View>
      {!sorted.length ? <Text selectable style={styles.emptyCopy}>Checklist items will appear as your move is prepared.</Text> : null}
      {sorted.slice(0, 5).map((item) => {
        const done = item.status === 'completed';
        const active = item.status === 'in_progress';
        return (
          <View key={item.id} style={styles.checkRow}>
            {done ? <View style={styles.checkDone}><Check color="#FFFFFF" size={12} strokeWidth={3} /></View> : <Circle color={active ? brand.blue : brand.muted} size={18} strokeWidth={active ? 3 : 2} />}
            <Text selectable numberOfLines={2} style={{ flex: 1, color: brand.text, fontSize: 11, lineHeight: 15 }}>{item.label}</Text>
            <Text style={{ color: done ? brand.green : active ? brand.blue : brand.muted, fontSize: 9, fontWeight: '900' }}>{done ? 'Completed' : active ? 'In progress' : 'Pending'}</Text>
          </View>
        );
      })}
    </View>
  );
}

function PaymentCard({ invoice, job }: { invoice: Invoice | null; job: Job }) {
  const total = invoice?.total ?? job.actual_total ?? job.estimated_total ?? 0;
  const paid = invoice?.status === 'paid' ? total : 0;
  const remaining = Math.max(0, total - paid);
  return (
    <View style={[styles.card, styles.halfCard]}>
      <Text selectable style={styles.cardTitle}>Payment Summary</Text>
      <PaymentRow label="Total" value={total ? money(total) : 'Pending'} />
      <PaymentRow label="Amount paid" value={money(paid)} accent={paid > 0} />
      <View style={{ height: 1, backgroundColor: brand.border }} />
      <PaymentRow label="Remaining" value={total ? money(remaining) : 'Pending'} bold />
      {invoice && invoice.status !== 'paid' ? (
        <Link href="/payment" asChild>
          <Pressable style={styles.paymentButton}><CreditCard color="#FFFFFF" size={16} /><Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>Make a Payment</Text></Pressable>
        </Link>
      ) : invoice?.status === 'paid' ? (
        <View style={[styles.paymentButton, { backgroundColor: brand.greenSoft }]}><Check color={brand.green} size={16} /><Text style={{ color: brand.green, fontSize: 12, fontWeight: '900' }}>Paid in full</Text></View>
      ) : (
        <View style={styles.pendingPayment}><Clock3 color={brand.muted} size={15} /><Text style={{ color: brand.muted, fontSize: 11, fontWeight: '800' }}>Invoice pending</Text></View>
      )}
    </View>
  );
}

function PaymentRow({ label, value, accent, bold }: { label: string; value: string; accent?: boolean; bold?: boolean }) {
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}><Text style={{ color: brand.muted, fontSize: 11 }}>{label}</Text><Text selectable style={{ color: accent ? brand.green : brand.text, fontSize: bold ? 15 : 12, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{value}</Text></View>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={{ flexBasis: '47%', gap: 2 }}><Text style={{ color: brand.muted, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>{label}</Text><Text selectable numberOfLines={2} style={{ color: brand.text, fontSize: 12, fontWeight: '800' }}>{value}</Text></View>;
}

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};
const stepForStatus = (status: string) => status === 'completed' ? 3 : status === 'in_progress' ? 2 : ['scheduled', 'confirmed'].includes(status) ? 1 : 0;
const titleCase = (value?: string | null) => (value ?? 'pending').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const shortAddress = (value: string) => value.split(',').slice(0, 2).join(',').trim();
const crewNames = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value.map((member) => typeof member === 'string' ? member : member && typeof member === 'object' && 'name' in member ? String(member.name) : '').filter(Boolean);
};
const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
const avatarColors = [brand.navy, brand.blue, '#7C5BD9'];

const styles = {
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, borderCurve: 'continuous' as const, borderWidth: 1, borderColor: brand.border, padding: 16, gap: 13, boxShadow: '0 2px 8px rgba(15,23,42,0.05)' },
  halfCard: { flexGrow: 1, flexBasis: 178, minWidth: 0 },
  cardTitle: { color: brand.text, fontSize: 16, fontWeight: '900' as const },
  sectionTitle: { color: brand.text, fontSize: 19, fontWeight: '900' as const },
  largeIcon: { width: 62, height: 62, borderRadius: 20, backgroundColor: brand.blueSoft, alignItems: 'center' as const, justifyContent: 'center' as const },
  primaryButton: { minHeight: 52, borderRadius: 14, backgroundColor: brand.blue, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' as const },
  ribbon: { alignSelf: 'flex-start' as const, backgroundColor: brand.navy, borderBottomRightRadius: 14, paddingHorizontal: 16, paddingVertical: 9 },
  ribbonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' as const, letterSpacing: 0.5 },
  factLabel: { color: brand.muted, fontSize: 10, fontWeight: '800' as const },
  factValue: { color: brand.text, fontSize: 14, lineHeight: 18, fontWeight: '900' as const },
  factDetail: { color: brand.muted, fontSize: 10, lineHeight: 14 },
  detailsGrid: { borderRadius: 14, backgroundColor: brand.bg, padding: 12, flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 12 },
  stepCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center' as const, justifyContent: 'center' as const },
  heroButton: { minHeight: 48, borderRadius: 13, backgroundColor: brand.navy, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8 },
  quickAction: { flexGrow: 1, flexBasis: 68, minWidth: 62, maxWidth: 90, height: 94, borderRadius: 16, borderCurve: 'continuous' as const, borderWidth: 1, borderColor: brand.border, backgroundColor: '#FFFFFF', alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, padding: 7, boxShadow: '0 2px 7px rgba(15,23,42,0.05)' },
  quickIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: brand.blueSoft, alignItems: 'center' as const, justifyContent: 'center' as const },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center' as const, justifyContent: 'center' as const },
  smallButton: { minHeight: 38, borderRadius: 12, borderWidth: 1, borderColor: brand.blue, paddingHorizontal: 10, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 5 },
  checkRow: { minHeight: 34, borderBottomWidth: 1, borderBottomColor: brand.border, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  checkDone: { width: 18, height: 18, borderRadius: 9, backgroundColor: brand.green, alignItems: 'center' as const, justifyContent: 'center' as const },
  emptyCopy: { color: brand.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' as const },
  paymentButton: { minHeight: 42, borderRadius: 11, backgroundColor: brand.blue, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 7 },
  pendingPayment: { minHeight: 42, borderRadius: 11, backgroundColor: brand.bg, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 7 },
};
