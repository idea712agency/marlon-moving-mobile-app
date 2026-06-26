import { router } from 'expo-router';
import {
  ArrowRight,
  CalendarDays,
  MessageCircle,
  MoreHorizontal,
  UserRoundPlus,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { StatusPill } from '@/components/operator/StatusPill';
import { brand } from '@/constants/operator-brand';

export type MoveListItem = {
  id: string;
  job_number: string;
  scheduled_date: string;
  scheduled_start_time: string | null;
  status: string;
  origin_address: string;
  destination_address: string;
  job_type: string;
  crew_size: number | null;
  crew_members: unknown;
  truck_size: string | null;
  packing_service_included: boolean | null;
  estimated_total: number | null;
  actual_total: number | null;
  payment_status: string | null;
  dispatch_status?: string | null;
  contacts: { name: string; phone: string | null } | null;
};

const avatarColors = ['#0057D9', '#7C5BD9', '#10B981', '#F59E0B', '#E94B7B'];

const titleCase = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const shortDate = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const shortTime = (value: string | null) => {
  if (!value) return 'TBD';
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

function getCrewNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((member) => {
      if (typeof member === 'string') return member.trim();
      if (member && typeof member === 'object') {
        const record = member as Record<string, unknown>;
        const name = record.name ?? record.full_name ?? record.display_name;
        return typeof name === 'string' ? name.trim() : '';
      }
      return '';
    })
    .filter(Boolean);
}

function balanceLabel(move: MoveListItem) {
  if (move.payment_status === 'paid') return { label: 'Paid in full', color: '#10B981' };
  if (move.payment_status === 'deposit_paid') return { label: 'Deposit paid', color: '#10B981' };
  if (move.payment_status === 'estimate_sent') return { label: 'Estimate sent', color: brand.blue };

  const total = move.actual_total ?? move.estimated_total;
  return total != null ? { label: `${money(total)} balance`, color: brand.text } : null;
}

export function MoveCard({ move, onAssignCrew }: { move: MoveListItem; onAssignCrew?: (move: MoveListItem) => void }) {
  const crew = getCrewNames(move.crew_members);
  const balance = balanceLabel(move);
  const customerName = move.contacts?.name || move.job_number;
  const phone = move.contacts?.phone;

  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: 20,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: brand.border,
        backgroundColor: brand.surface,
        overflow: 'hidden',
        boxShadow: '0 3px 12px rgba(7,21,47,0.06)',
      }}>
      <View
        style={{
          width: 72,
          paddingVertical: 17,
          alignItems: 'center',
          gap: 5,
          backgroundColor: '#F8FAFC',
          borderRightWidth: 1,
          borderRightColor: brand.border,
        }}>
        <CalendarDays color={brand.blue} size={19} strokeWidth={2.4} />
        <Text selectable style={{ color: brand.text, fontSize: 12, fontWeight: '900' }}>
          {shortDate(move.scheduled_date)}
        </Text>
        <Text selectable style={{ color: brand.muted, fontSize: 10, fontWeight: '800' }}>
          {shortTime(move.scheduled_start_time)}
        </Text>
      </View>

      <View style={{ flex: 1, padding: 14, gap: 13 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text selectable numberOfLines={1} style={{ color: brand.text, fontSize: 16, lineHeight: 20, fontWeight: '900' }}>
              {customerName}
            </Text>
            <Text selectable numberOfLines={1} style={{ color: brand.muted, fontSize: 11, lineHeight: 14, fontWeight: '700' }}>
              {phone ?? move.job_number}
            </Text>
          </View>
          <StatusPill status={move.status} />
          <Pressable
            accessibilityLabel={`More options for ${customerName}`}
            accessibilityRole="button"
            hitSlop={8}
            style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
            <MoreHorizontal color={brand.muted} size={18} strokeWidth={2.4} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Text selectable numberOfLines={1} style={{ flex: 1, color: brand.muted, fontSize: 11, lineHeight: 15 }}>
            {move.origin_address}
          </Text>
          <ArrowRight color={brand.blue} size={14} strokeWidth={2.5} />
          <Text selectable numberOfLines={1} style={{ flex: 1, color: brand.muted, fontSize: 11, lineHeight: 15 }}>
            {move.destination_address}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <InfoChip label={titleCase(move.job_type)} />
          {move.crew_size ? <InfoChip label={`${move.crew_size} Movers`} /> : null}
          {move.truck_size ? <InfoChip label="1 Truck" /> : null}
          {move.packing_service_included ? <InfoChip label="Packing" /> : null}
        </View>

        <View style={{ minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          {crew.length ? (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: Math.min(crew.length, 3) * 20 + 10, height: 30 }}>
                {crew.slice(0, 3).map((name, index) => (
                  <View
                    key={`${name}-${index}`}
                    style={{
                      position: 'absolute',
                      left: index * 20,
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: brand.surface,
                      backgroundColor: avatarColors[index % avatarColors.length],
                    }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>{name.charAt(0).toUpperCase()}</Text>
                  </View>
                ))}
              </View>
              <Text selectable numberOfLines={1} style={{ flex: 1, color: brand.text, fontSize: 11, fontWeight: '800' }}>
                {crew[0]}
                {crew.length > 1 ? ` +${crew.length - 1}` : ''}
              </Text>
            </View>
          ) : (
            <Text selectable style={{ flex: 1, color: brand.muted, fontSize: 11, fontWeight: '700' }}>
              No crew assigned
            </Text>
          )}
          {balance ? (
            <Text selectable style={{ color: balance.color, fontSize: 11, fontWeight: '900', textAlign: 'right' }}>
              {balance.label}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 7 }}>
          <ActionButton label="View" onPress={() => router.push(`/moves/${move.id}`)} />
          <ActionButton
            label="Assign Crew"
            icon={<UserRoundPlus color={brand.blue} size={13} strokeWidth={2.5} />}
            onPress={() => onAssignCrew ? onAssignCrew(move) : router.push(`/dispatch?job_id=${move.id}`)}
          />
          <ActionButton
            label="Message"
            icon={<MessageCircle color={brand.blue} size={13} strokeWidth={2.5} />}
            onPress={() => router.push(`/messages?job_id=${move.id}`)}
          />
        </View>
      </View>
    </View>
  );
}

function InfoChip({ label }: { label: string }) {
  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#F1F5F9' }}>
      <Text style={{ color: brand.muted, fontSize: 9, fontWeight: '800' }}>{label}</Text>
    </View>
  );
}

function ActionButton({ label, icon, onPress }: { label: string; icon?: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 36,
        borderRadius: 10,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: brand.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: brand.surface,
      }}>
      {icon}
      <Text numberOfLines={1} style={{ color: brand.blue, fontSize: 10, fontWeight: '900' }}>
        {label}
      </Text>
    </Pressable>
  );
}
