import { Link, type Href } from 'expo-router';
import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  MapPin,
  MessageSquareText,
  Plus,
  RefreshCw,
  Truck,
  Users,
} from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path, Polygon, Polyline } from 'react-native-svg';

import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { brand } from '@/constants/operator-brand';
import { useAdminDashboard } from '@/hooks/use-admin-dashboard';
import { money, shortDate, shortTime } from '@/lib/data';
import type { AdminDashboard } from '@/lib/schemas/admin-dashboard';

const quickActions = [
  { label: 'New Move', href: '/jobs/new', Icon: Truck },
  { label: 'Add Customer', href: '/customers/new', Icon: Users },
  { label: 'Schedule', href: '/schedule', Icon: Calendar },
  { label: 'Dispatch Crew', href: '/dispatch', Icon: Truck },
  { label: 'Invoices', href: '/invoices', Icon: FileText },
] as const;

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const dashboard = useAdminDashboard();
  const data = dashboard.data;

  return (
    <OperatorScreen refreshing={dashboard.isRefetching} onRefresh={() => void dashboard.refetch()}>
      <OperatorPageHeader title="Welcome back!" subtitle="Here's what's happening with your moving business." />
      <FreeEstimateCard />

      {dashboard.isLoading ? <LoadingDashboard /> : null}
      {dashboard.error ? <DashboardError message={dashboard.error instanceof Error ? dashboard.error.message : 'Dashboard failed to load.'} onRetry={() => void dashboard.refetch()} /> : null}

      {data ? (
        <>
          <StatsGrid counts={data.counts} />
          <MovesOverview movesByDay={data.movesByDay} width={width} />
          <RecentActivity activity={data.activity} />
          <QuickActions />
          <MoveStatus statusDonut={data.statusDonut} />
          <RevenueOverview revenueThisMonth={data.revenueThisMonth} revenueByDay={data.revenueByDay} width={width} />
          <UpcomingMoves moves={data.upcomingMoves} />
        </>
      ) : null}
    </OperatorScreen>
  );
}

function FreeEstimateCard() {
  return (
    <Link href="/estimate" asChild>
      <Pressable
        accessibilityLabel="Free Estimate"
        accessibilityRole="button"
        style={{
          minHeight: 104,
          borderRadius: 22,
          borderCurve: 'continuous',
          backgroundColor: brand.navy,
          padding: 18,
          justifyContent: 'space-between',
          overflow: 'hidden',
          boxShadow: '0 14px 30px rgba(11,46,111,0.22)',
        }}>
        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,87,217,0.42)', transform: [{ translateX: 120 }, { rotate: '-18deg' }] }} />
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
          <Plus color="#FFFFFF" size={22} strokeWidth={2.6} />
        </View>
        <View style={{ gap: 3 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: -0.35 }}>Free Estimate</Text>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '600' }}>Preview or start a customer request.</Text>
        </View>
      </Pressable>
    </Link>
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
      <Link href="/jobs" asChild>
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
          <Link key={move.id} href={`/jobs/${move.id}`} asChild>
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
