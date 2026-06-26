import { Link, type Href } from 'expo-router';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  MapPin,
  MessageSquareText,
  RefreshCw,
  Settings2,
  Truck,
} from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Polygon, Polyline } from 'react-native-svg';

import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { brand } from '@/constants/operator-brand';
import { useAdminDashboard } from '@/hooks/use-admin-dashboard';
import { money, shortDate, shortTime } from '@/lib/data';
import type { AdminDashboard } from '@/lib/schemas/admin-dashboard';

const quickActions = [
  { label: 'New Estimate', href: '/estimate/new?manual=true', Icon: CircleDollarSign },
  { label: 'New Move', href: '/jobs/new', Icon: Truck },
  { label: 'Quotes', href: '/quotes', Icon: MessageSquareText },
  { label: 'Schedule', href: '/schedule', Icon: Calendar },
  { label: 'Documents', href: '/documents', Icon: FileText },
  { label: 'Templates', href: '/templates', Icon: Settings2 },
] as const;

type MissingDispatchBreakdown = NonNullable<NonNullable<AdminDashboard['attention']>['missing_dispatch_breakdown']>;

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const dashboard = useAdminDashboard();
  const data = dashboard.data;

  return (
    <OperatorScreen refreshing={dashboard.isRefetching} onRefresh={() => void dashboard.refetch()}>
      <OperatorPageHeader title="Operations" subtitle="Today’s work, exceptions, and next actions." />

      {dashboard.isLoading ? <LoadingDashboard /> : null}
      {dashboard.error ? <DashboardError message={dashboard.error instanceof Error ? dashboard.error.message : 'Dashboard failed to load.'} onRetry={() => void dashboard.refetch()} /> : null}

      {data ? (
        <>
          <Text selectable style={{ color: brand.muted, fontSize: 12, fontWeight: '800' }}>
            {data.generated_at ? `Updated ${relativeTime(data.generated_at)}` : 'Live dashboard'}
          </Text>
          <OperationsCommand data={data} />
          <NeedsAttention data={data} />
          <QuotePipeline pipeline={data.quote_pipeline} />
          <QuickActions />
          <StatsGrid counts={data.counts} />
          <UpcomingMoves moves={data.upcomingMoves} />
          <MovesOverview movesByDay={data.movesByDay} width={width} />
          <RecentActivity activity={data.activity} />
          <MoveStatus statusDonut={data.statusDonut} />
          <RevenueOverview revenueThisMonth={data.revenueThisMonth} revenueByDay={data.revenueByDay} width={width} />
        </>
      ) : null}
    </OperatorScreen>
  );
}

function OperationsCommand({ data }: { data: AdminDashboard }) {
  const today = localDateKey(new Date());
  const todayMoves = data.upcomingMoves.filter((move) => move.scheduled_date === today);
  const todaySummary = data.today;
  const scheduledToday = todaySummary?.scheduled_moves ?? todayMoves.length;
  const inProgressToday = todaySummary?.in_progress ?? data.counts.inProgress;
  const completedToday = todaySummary?.completed ?? 0;
  const revenueDue = todaySummary?.revenue_due ?? data.revenueThisMonth;
  const nextMove = [...data.upcomingMoves]
    .filter((move) => move.scheduled_date)
    .sort((a, b) => moveDateTime(a).getTime() - moveDateTime(b).getTime())[0] ?? null;
  const nextMoveHref = nextMove ? (`/moves/${nextMove.id}` as Href) : '/schedule';

  return (
    <OperatorCard>
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: brand.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.25 }}>Today’s board</Text>
            <Text selectable style={{ color: brand.muted, fontSize: 13, lineHeight: 19, fontWeight: '700' }}>
              {scheduledToday ? `${scheduledToday} move${scheduledToday === 1 ? '' : 's'} scheduled today.` : 'No moves scheduled for today.'}
            </Text>
          </View>
          <Link href="/schedule" asChild>
            <Pressable accessibilityLabel="Open schedule" accessibilityRole="link" style={{ height: 38, paddingHorizontal: 12, borderRadius: 12, backgroundColor: brand.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: brand.blue, fontSize: 12, fontWeight: '900' }}>Schedule</Text>
            </Pressable>
          </Link>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
          <OpsMetric label="Today" value={scheduledToday} sub="scheduled" Icon={Calendar} color={brand.blue} bg={brand.blueSoft} />
          <OpsMetric label="In Progress" value={inProgressToday} sub="active moves" Icon={Truck} color={brand.purple} bg={brand.purpleSoft} />
          <OpsMetric label="Completed" value={completedToday} sub="today" Icon={CheckCircle2} color={brand.green} bg={brand.greenSoft} />
          <OpsMetric label="Revenue Due" value={money(revenueDue)} sub="today" Icon={CircleDollarSign} color={brand.orange} bg={brand.orangeSoft} compact />
        </View>

        <Link href={nextMoveHref} asChild>
          <Pressable accessibilityLabel="Open next move" accessibilityRole="button" style={{ borderRadius: 16, borderWidth: 1, borderColor: brand.border, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FAFBFF' }}>
            <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: nextMove ? brand.blueSoft : brand.orangeSoft, alignItems: 'center', justifyContent: 'center' }}>
              {nextMove ? <MapPin color={brand.blue} size={20} strokeWidth={2.5} /> : <Calendar color={brand.orange} size={20} strokeWidth={2.5} />}
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: brand.muted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }}>{nextMove ? 'Next move' : 'Calendar clear'}</Text>
              <Text selectable numberOfLines={1} style={{ color: brand.text, fontSize: 15, fontWeight: '900' }}>{nextMove?.contact?.name ?? 'Review schedule'}</Text>
              <Text selectable numberOfLines={1} style={{ color: brand.muted, fontSize: 12, fontWeight: '700' }}>
                {nextMove ? `${shortDate(nextMove.scheduled_date)} · ${shortTime(nextMove.scheduled_start_time)}` : 'Open the schedule to plan the next job.'}
              </Text>
            </View>
            <ArrowRight color={brand.muted} size={18} strokeWidth={2.4} />
          </Pressable>
        </Link>
      </View>
    </OperatorCard>
  );
}

function OpsMetric({
  label,
  value,
  sub,
  Icon,
  color,
  bg,
  compact,
}: {
  label: string;
  value: number | string;
  sub: string;
  Icon: typeof Calendar;
  color: string;
  bg: string;
  compact?: boolean;
}) {
  return (
    <View style={{ flexGrow: 1, width: '47%', minWidth: 132, borderRadius: 15, borderWidth: 1, borderColor: brand.border, backgroundColor: brand.surface, padding: 12, gap: 9 }}>
      <View style={{ width: 32, height: 32, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon color={color} size={18} strokeWidth={2.5} />
      </View>
      <View style={{ gap: 2 }}>
        <Text selectable numberOfLines={1} adjustsFontSizeToFit={compact} style={{ color: brand.text, fontSize: compact ? 21 : 24, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{value}</Text>
        <Text style={{ color: brand.text, fontSize: 12, fontWeight: '900' }}>{label}</Text>
        <Text style={{ color: brand.muted, fontSize: 11, fontWeight: '800' }}>{sub}</Text>
      </View>
    </View>
  );
}

function NeedsAttention({ data }: { data: AdminDashboard }) {
  const items = attentionItems(data);

  return (
    <OperatorCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <CardHeader title="Needs Attention" />
        <Text style={{ color: items.length ? brand.orange : brand.green, fontSize: 12, fontWeight: '900' }}>{items.length ? `${items.length} open` : 'Clear'}</Text>
      </View>
      {items.length ? (
        items.map((item) => (
          <Link key={item.key} href={item.href} asChild>
            <Pressable accessibilityLabel={item.title} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 15, borderWidth: 1, borderColor: item.border, backgroundColor: item.bg, padding: 12 }}>
              <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: brand.surface, alignItems: 'center', justifyContent: 'center' }}>
                <item.Icon color={item.color} size={19} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text selectable style={{ color: brand.text, fontSize: 14, fontWeight: '900' }}>{item.title}</Text>
                <Text selectable numberOfLines={2} style={{ color: brand.muted, fontSize: 12, lineHeight: 17, fontWeight: '700' }}>{item.detail}</Text>
              </View>
              <View style={{ minWidth: 32, height: 28, borderRadius: 999, backgroundColor: brand.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
                <Text style={{ color: item.color, fontSize: 12, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{item.count}</Text>
              </View>
            </Pressable>
          </Link>
        ))
      ) : (
        <View style={{ borderRadius: 15, backgroundColor: brand.greenSoft, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 color={brand.green} size={20} strokeWidth={2.5} />
          <Text selectable style={{ flex: 1, color: brand.text, fontSize: 13, lineHeight: 18, fontWeight: '800' }}>No operational exceptions in the current dashboard feed.</Text>
        </View>
      )}
    </OperatorCard>
  );
}

function QuotePipeline({ pipeline }: { pipeline?: AdminDashboard['quote_pipeline'] }) {
  if (!pipeline) return null;
  const stages = [
    { key: 'new', label: 'New', value: pipeline.new ?? 0, color: brand.orange, bg: brand.orangeSoft },
    { key: 'estimate_ready', label: 'Ready', value: pipeline.estimate_ready ?? 0, color: brand.purple, bg: brand.purpleSoft },
    { key: 'sent', label: 'Sent', value: pipeline.sent ?? 0, color: brand.blue, bg: brand.blueSoft },
    { key: 'booked', label: 'Booked', value: pipeline.booked ?? 0, color: brand.green, bg: brand.greenSoft },
    { key: 'lost', label: 'Lost', value: pipeline.lost ?? 0, color: brand.red, bg: brand.redSoft },
  ];
  const total = stages.reduce((sum, stage) => sum + stage.value, 0);

  return (
    <OperatorCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <CardHeader title="Quote Pipeline" />
        <Link href="/quotes" asChild>
          <Pressable accessibilityLabel="Open quotes" accessibilityRole="link">
            <Text style={{ color: brand.blue, fontSize: 13, fontWeight: '900' }}>View All</Text>
          </Pressable>
        </Link>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
        {stages.map((stage) => (
          <Link key={stage.key} href={`/quotes?readiness=${stage.key}` as Href} asChild>
            <Pressable accessibilityLabel={`Open ${stage.label} quotes`} accessibilityRole="button" style={{ flexGrow: 1, width: '22%', minWidth: 112, borderRadius: 15, backgroundColor: stage.bg, padding: 12, gap: 5 }}>
              <Text selectable style={{ color: stage.color, fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{stage.value}</Text>
              <Text style={{ color: brand.text, fontSize: 12, fontWeight: '900' }}>{stage.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
      <View style={{ height: 1, backgroundColor: brand.border }} />
      <Text selectable style={{ color: brand.muted, fontSize: 12, lineHeight: 17, fontWeight: '700' }}>
        {total ? `${total} quote${total === 1 ? '' : 's'} currently tracked across active pipeline stages.` : 'No active quote pipeline items returned.'}
      </Text>
    </OperatorCard>
  );
}

function LoadingDashboard() {
  return (
    <OperatorCard>
      <View style={{ minHeight: 110, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator color={brand.blue} />
        <Text style={{ color: brand.muted, fontSize: 14, fontWeight: '700' }}>Loading live dashboard…</Text>
      </View>
    </OperatorCard>
  );
}

function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <OperatorCard>
      <View style={{ gap: 12 }}>
        <Text selectable style={{ color: brand.red, fontSize: 17, fontWeight: '900' }}>Dashboard unavailable</Text>
        <Text selectable style={{ color: brand.muted, fontSize: 14, lineHeight: 20 }}>{message}</Text>
        <Pressable
          accessibilityLabel="Retry dashboard"
          accessibilityRole="button"
          onPress={onRetry}
          style={{ height: 46, borderRadius: 12, backgroundColor: brand.redSoft, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
          <RefreshCw color={brand.red} size={17} strokeWidth={2.5} />
          <Text style={{ color: brand.red, fontSize: 14, fontWeight: '900' }}>Try Again</Text>
        </Pressable>
      </View>
    </OperatorCard>
  );
}

function StatsGrid({ counts }: { counts: AdminDashboard['counts'] }) {
  const delta = counts.completedDeltaPct;
  const deltaPositive = (delta ?? 0) >= 0;
  const stats = [
    { label: 'Total Moves', value: counts.totalMoves, sub: 'all time', tint: brand.blue, bg: brand.blueSoft },
    { label: 'Upcoming', value: counts.upcoming, sub: 'scheduled', tint: brand.orange, bg: brand.orangeSoft },
    { label: 'In Progress', value: counts.inProgress, sub: 'today', tint: brand.purple, bg: brand.purpleSoft },
    {
      label: 'Completed',
      value: counts.completed,
      sub: delta === null ? 'vs last month pending' : `${deltaPositive ? '↑' : '↓'} ${Math.abs(delta).toFixed(0)}% vs last month`,
      tint: deltaPositive ? brand.green : brand.red,
      bg: deltaPositive ? brand.greenSoft : brand.redSoft,
    },
  ];

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {stats.map((stat) => (
        <View
          key={stat.label}
          style={{
            width: '47%',
            flexGrow: 1,
            backgroundColor: brand.surface,
            borderRadius: 18,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: brand.border,
            padding: 15,
            gap: 12,
            boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
          }}>
          <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: stat.bg, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: stat.tint }} />
          </View>
          <View style={{ gap: 3 }}>
            <Text selectable style={{ color: brand.text, fontSize: 27, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{stat.value}</Text>
            <Text style={{ color: brand.text, fontSize: 13, fontWeight: '900' }}>{stat.label}</Text>
            <Text selectable style={{ color: stat.label === 'Completed' ? stat.tint : brand.muted, fontSize: 12, fontWeight: '800' }}>{stat.sub}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function CardHeader({ title, action }: { title: string; action?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ color: brand.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.25 }}>{title}</Text>
      {action ? (
        <Text style={{ color: brand.muted, fontSize: 12, fontWeight: '900' }}>{action}</Text>
      ) : null}
    </View>
  );
}

function MovesOverview({ movesByDay, width }: { movesByDay: AdminDashboard['movesByDay']; width: number }) {
  return (
    <OperatorCard>
      <CardHeader title="Moves Overview" action="This Week" />
      <AreaChart data={movesByDay.map((item) => item.count)} width={Math.min(width - 68, 460)} height={150} color={brand.blue} softColor={brand.blueSoft} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {movesByDay.map((item) => (
          <Text key={item.day} style={{ color: brand.muted, fontSize: 10, fontWeight: '800' }}>
            {formatShortDay(item.day)}
          </Text>
        ))}
      </View>
    </OperatorCard>
  );
}

function RecentActivity({ activity }: { activity: AdminDashboard['activity'] }) {
  const visible = activity.slice(0, 5);

  return (
    <OperatorCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <CardHeader title="Recent Activity" />
        {visible[0] ? (
          <Link href={visible[0].source === 'lead' ? '/leads' : '/jobs'} asChild>
            <Pressable accessibilityLabel="View all recent activity" accessibilityRole="link">
              <Text style={{ color: brand.blue, fontSize: 13, fontWeight: '900' }}>View All</Text>
            </Pressable>
          </Link>
        ) : null}
      </View>
      {visible.length ? (
        visible.map((item) => {
          const Icon = activityIcon(item.activity_type);
          return (
            <View key={item.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: item.source === 'lead' ? brand.purpleSoft : brand.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon color={item.source === 'lead' ? brand.purple : brand.blue} size={18} strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text selectable style={{ color: brand.text, fontSize: 14, lineHeight: 19, fontWeight: '800' }}>{item.description || humanize(item.activity_type)}</Text>
                <Text selectable style={{ color: brand.muted, fontSize: 12, fontWeight: '700' }}>{relativeTime(item.created_at)}</Text>
              </View>
            </View>
          );
        })
      ) : (
        <Text selectable style={{ color: brand.muted, fontSize: 14 }}>No recent activity yet.</Text>
      )}
    </OperatorCard>
  );
}

function QuickActions() {
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>Quick Actions</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {quickActions.map(({ label, href, Icon }) => (
          <Link key={label} href={href} asChild>
            <Pressable
              accessibilityLabel={label}
              accessibilityRole="button"
              style={{
                width: '31%',
                minWidth: 98,
                flexGrow: 1,
                backgroundColor: brand.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: brand.border,
                padding: 12,
                gap: 10,
                boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
              }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: brand.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon color={brand.blue} size={20} strokeWidth={2.5} />
              </View>
              <Text style={{ color: brand.text, fontSize: 12, lineHeight: 16, fontWeight: '900' }}>{label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

function MoveStatus({ statusDonut }: { statusDonut: AdminDashboard['statusDonut'] }) {
  const total = statusDonut.reduce((sum, item) => sum + item.value, 0);

  return (
    <OperatorCard>
      <CardHeader title="Move Status" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        <DonutChart data={statusDonut} size={132} />
        <View style={{ flex: 1, gap: 10 }}>
          <Text selectable style={{ color: brand.text, fontSize: 32, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{total}</Text>
          <Text style={{ color: brand.muted, fontSize: 12, fontWeight: '800' }}>total moves in view</Text>
          {statusDonut.map((item) => (
            <View key={item.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 9, height: 9, borderRadius: 999, backgroundColor: statusColor(item.name) }} />
              <Text style={{ flex: 1, color: brand.text, fontSize: 13, fontWeight: '800' }}>{statusLabel(item.name)}</Text>
              <Text style={{ color: brand.muted, fontSize: 13, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>
      <Link href="/moves" asChild>
        <FooterButton label="View All Moves" />
      </Link>
    </OperatorCard>
  );
}

function RevenueOverview({ revenueThisMonth, revenueByDay, width }: { revenueThisMonth: number; revenueByDay: AdminDashboard['revenueByDay']; width: number }) {
  return (
    <OperatorCard>
      <CardHeader title="Revenue Overview" />
      <View style={{ gap: 3 }}>
        <Text selectable style={{ color: brand.text, fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -0.7 }}>
          {money(revenueThisMonth)}
        </Text>
        <Text style={{ color: brand.muted, fontSize: 13, fontWeight: '800' }}>this month</Text>
      </View>
      <LineChart data={revenueByDay.map((item) => item.total)} width={Math.min(width - 68, 460)} height={100} color={brand.green} />
      <FooterButton label="View Financial Reports" />
    </OperatorCard>
  );
}

function UpcomingMoves({ moves }: { moves: AdminDashboard['upcomingMoves'] }) {
  const visible = moves.slice(0, 6);

  return (
    <OperatorCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <CardHeader title="Upcoming Moves" />
        <Link href="/schedule" asChild>
          <Pressable accessibilityLabel="View all upcoming moves" accessibilityRole="link">
            <Text style={{ color: brand.blue, fontSize: 13, fontWeight: '900' }}>View All</Text>
          </Pressable>
        </Link>
      </View>
      {visible.length ? (
        visible.map((move) => (
          <Link key={move.id} href={`/moves/${move.id}` as Href} asChild>
            <Pressable accessibilityLabel={`Open move ${move.contact?.name ?? move.id}`} accessibilityRole="button" style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={{ width: 54, borderRadius: 15, backgroundColor: brand.blueSoft, paddingVertical: 9, alignItems: 'center', gap: 2 }}>
                <Text style={{ color: brand.blue, fontSize: 11, fontWeight: '900' }}>{month(move.scheduled_date)}</Text>
                <Text style={{ color: brand.text, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{day(move.scheduled_date)}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text selectable style={{ color: brand.text, fontSize: 15, fontWeight: '900' }}>{move.contact?.name ?? 'Customer pending'}</Text>
                <Text selectable style={{ color: brand.muted, fontSize: 12, fontWeight: '700' }}>
                  {move.contact?.phone ?? shortTime(move.scheduled_start_time)}
                </Text>
                <Text selectable numberOfLines={2} style={{ color: brand.muted, fontSize: 12, lineHeight: 17 }}>
                  {move.origin_address ?? 'Origin pending'} → {move.destination_address ?? 'Destination pending'}
                </Text>
              </View>
              <ArrowRight color={brand.muted} size={18} strokeWidth={2.4} />
            </Pressable>
          </Link>
        ))
      ) : (
        <Text selectable style={{ color: brand.muted, fontSize: 14 }}>No upcoming moves returned yet.</Text>
      )}
    </OperatorCard>
  );
}

function FooterButton({ label }: { label: string }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      style={{
        height: 46,
        borderRadius: 12,
        backgroundColor: brand.blueSoft,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 7,
      }}>
      <Text style={{ color: brand.blue, fontSize: 14, fontWeight: '900' }}>{label}</Text>
      <ArrowRight color={brand.blue} size={16} strokeWidth={2.6} />
    </Pressable>
  );
}

function AreaChart({ data, width, height, color, softColor }: { data: number[]; width: number; height: number; color: string; softColor: string }) {
  const points = chartPoints(data, width, height);
  const line = pathFromPoints(points);
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  return (
    <Svg width={width} height={height}>
      <Polygon points={area.replace(/[MLZ]/g, '').trim()} fill={softColor} opacity={0.82} />
      <Polyline points={points.map((point) => point.join(',')).join(' ')} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LineChart({ data, width, height, color }: { data: number[]; width: number; height: number; color: string }) {
  const points = chartPoints(data, width, height);
  return (
    <Svg width={width} height={height}>
      <Polyline points={points.map((point) => point.join(',')).join(' ')} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DonutChart({ data, size }: { data: AdminDashboard['statusDonut']; size: number }) {
  const total = Math.max(1, data.reduce((sum, item) => sum + item.value, 0));
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={brand.border} strokeWidth={18} fill="none" />
        {data.map((item) => {
          const length = (item.value / total) * circumference;
          const currentOffset = offset;
          offset += length;
          return (
            <Circle
              key={item.name}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={statusColor(item.name)}
              strokeWidth={18}
              fill="none"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-currentOffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          );
        })}
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text selectable style={{ color: brand.text, fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{data.reduce((sum, item) => sum + item.value, 0)}</Text>
        <Text style={{ color: brand.muted, fontSize: 10, fontWeight: '900' }}>TOTAL</Text>
      </View>
    </View>
  );
}

function chartPoints(values: number[], width: number, height: number) {
  const safe = values.length ? values : [0];
  const max = Math.max(...safe, 1);
  const min = Math.min(...safe, 0);
  const range = Math.max(1, max - min);
  return safe.map((value, index) => {
    const x = safe.length === 1 ? width / 2 : (index / (safe.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 22) - 11;
    return [x, y] as const;
  });
}

function pathFromPoints(points: readonly (readonly [number, number])[]) {
  return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
}

function attentionItems(data: AdminDashboard) {
  if (data.attention) {
    const backendItems = [
      {
        key: 'unsigned-documents',
        title: 'Documents awaiting signature',
        detail: 'Customer documents need a signature before the packet is complete.',
        count: data.attention.unsigned_documents ?? 0,
        href: '/documents' as Href,
        Icon: FileText,
        color: brand.red,
        bg: brand.redSoft,
        border: '#F7C8C8',
      },
      {
        key: 'pending-payments',
        title: 'Payments pending review',
        detail: 'Manual payments or invoice activity need admin confirmation.',
        count: data.attention.pending_payments ?? 0,
        href: '/documents' as Href,
        Icon: CircleDollarSign,
        color: brand.green,
        bg: brand.greenSoft,
        border: '#C5E8D1',
      },
      {
        key: 'new-quotes',
        title: 'New quote requests',
        detail: 'Fresh quote requests are waiting for estimate review.',
        count: data.attention.new_quotes ?? 0,
        href: '/quotes' as Href,
        Icon: MessageSquareText,
        color: brand.blue,
        bg: brand.blueSoft,
        border: '#CFE0FF',
      },
      {
        key: 'unread-messages',
        title: 'Unread customer messages',
        detail: 'Customer conversations have unread messages.',
        count: data.attention.unread_messages ?? 0,
        href: '/messages' as Href,
        Icon: MessageSquareText,
        color: brand.purple,
        bg: brand.purpleSoft,
        border: '#DDD3FA',
      },
      {
        key: 'missing-dispatch',
        title: 'Moves missing dispatch details',
        detail: missingDispatchDetail(data.attention.missing_dispatch_breakdown),
        count: data.attention.moves_missing_dispatch ?? 0,
        href: missingDispatchHref(data.attention.missing_dispatch_breakdown),
        Icon: AlertTriangle,
        color: brand.orange,
        bg: brand.orangeSoft,
        border: '#FAD7A2',
      },
    ];

    return backendItems.filter((item) => item.count > 0).slice(0, 4);
  }

  const incompleteUpcoming = data.upcomingMoves.filter(
    (move) => !move.scheduled_start_time || !move.origin_address || !move.destination_address || !move.contact?.phone,
  );
  const leadActivity = data.activity.filter((item) => item.source === 'lead' && daysAgo(item.created_at) <= 3);
  const items: {
    key: string;
    title: string;
    detail: string;
    count: number;
    href: Href;
    Icon: typeof AlertTriangle;
    color: string;
    bg: string;
    border: string;
  }[] = [];

  if (data.counts.inProgress > 0) {
    items.push({
      key: 'in-progress',
      title: 'Active moves need monitoring',
      detail: 'Check move status, crew notes, and customer updates before the next handoff.',
      count: data.counts.inProgress,
      href: '/moves',
      Icon: Truck,
      color: brand.purple,
      bg: brand.purpleSoft,
      border: '#DDD3FA',
    });
  }

  if (incompleteUpcoming.length > 0) {
    items.push({
      key: 'missing-details',
      title: 'Upcoming moves missing details',
      detail: 'Some scheduled moves are missing a time, route, or customer phone number.',
      count: incompleteUpcoming.length,
      href: '/schedule',
      Icon: AlertTriangle,
      color: brand.orange,
      bg: brand.orangeSoft,
      border: '#FAD7A2',
    });
  }

  if (leadActivity.length > 0) {
    items.push({
      key: 'recent-leads',
      title: 'Recent quote activity',
      detail: 'New lead activity has landed in the dashboard feed in the last 3 days.',
      count: leadActivity.length,
      href: '/quotes',
      Icon: MessageSquareText,
      color: brand.blue,
      bg: brand.blueSoft,
      border: '#CFE0FF',
    });
  }

  return items.slice(0, 3);
}

function missingDispatchHref(breakdown?: MissingDispatchBreakdown | null): Href {
  const entries = Object.entries(breakdown ?? {})
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .sort(([, a], [, b]) => Number(b) - Number(a));
  const key = entries[0]?.[0];
  return key ? `/dispatch?blocker=${key}` as Href : '/dispatch' as Href;
}

function missingDispatchDetail(breakdown?: MissingDispatchBreakdown | null) {
  const labels: Record<string, string> = {
    missing_crew: 'crew',
    missing_truck: 'truck',
    missing_start_time: 'start time',
    missing_address: 'address',
    missing_origin: 'origin',
    missing_destination: 'destination',
  };
  const entries = Object.entries(breakdown ?? {})
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .sort(([, a], [, b]) => Number(b) - Number(a));
  const first = entries[0]?.[0];
  return first ? `Upcoming moves need ${labels[first] ?? 'dispatch'} details.` : 'Upcoming moves need crew, truck, schedule, or route information.';
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const monthValue = String(date.getMonth() + 1).padStart(2, '0');
  const dayValue = String(date.getDate()).padStart(2, '0');
  return `${year}-${monthValue}-${dayValue}`;
}

function moveDateTime(move: AdminDashboard['upcomingMoves'][number]) {
  const date = move.scheduled_date ?? '9999-12-31';
  const time = move.scheduled_start_time ?? '23:59:59';
  return new Date(`${date}T${time}`);
}

function statusColor(name: string) {
  if (name === 'completed') return brand.green;
  if (name === 'in_progress') return brand.purple;
  return brand.orange;
}

function statusLabel(name: string) {
  if (name === 'in_progress') return 'In Progress';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function activityIcon(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes('complete')) return CheckCircle2;
  if (normalized.includes('invoice') || normalized.includes('payment')) return CircleDollarSign;
  if (normalized.includes('message') || normalized.includes('note')) return MessageSquareText;
  if (normalized.includes('schedule') || normalized.includes('date')) return Calendar;
  if (normalized.includes('dispatch') || normalized.includes('job')) return Truck;
  return Activity;
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

function daysAgo(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;
  return Math.max(0, (Date.now() - date.getTime()) / 86400000);
}

function formatShortDay(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value.slice(0, 3);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function month(value: string | null) {
  if (!value) return 'TBD';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

function day(value: string | null) {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { day: '2-digit' });
}
