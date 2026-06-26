import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';

import { brand } from '@/constants/operator-brand';
import { useAssignJobDispatch, useCrewMembers, useJobDispatchDetail, useVehicles } from '@/hooks/use-dispatch';
import { crewName, dispatchBlockerLabel, dispatchStatusLabel, vehicleLabel, type DispatchStatus } from '@/lib/dispatch';

type DispatchAssignmentSheetProps = {
  visible: boolean;
  jobId?: string | null;
  onClose: () => void;
};

const STATUSES: DispatchStatus[] = ['assigned', 'en_route', 'arrived', 'completed'];

export function DispatchAssignmentSheet({ visible, jobId, onClose }: DispatchAssignmentSheetProps) {
  const detail = useJobDispatchDetail(visible ? jobId : null);
  const crew = useCrewMembers();
  const vehicles = useVehicles();
  const assign = useAssignJobDispatch(jobId);
  const [crewIds, setCrewIds] = useState<string[]>([]);
  const [truckId, setTruckId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('');
  const [dispatchStatus, setDispatchStatus] = useState<DispatchStatus>('assigned');
  const [notes, setNotes] = useState('');
  const assignedCrewIds = useMemo(() => {
    const fromJob = detail.data?.job.crew_member_ids ?? [];
    const fromMembers = (detail.data?.crew_members ?? detail.data?.assigned_crew ?? []).map((member) => member.id);
    return fromJob.length ? fromJob : fromMembers;
  }, [detail.data?.assigned_crew, detail.data?.crew_members, detail.data?.job.crew_member_ids]);

  useEffect(() => {
    if (!visible) return;
    setCrewIds(assignedCrewIds);
    setTruckId(detail.data?.job.truck_id ?? detail.data?.vehicle?.id ?? detail.data?.truck?.id ?? null);
    setStartTime(detail.data?.job.scheduled_start_time ?? '');
    setDispatchStatus((detail.data?.job.dispatch_status === 'en_route' || detail.data?.job.dispatch_status === 'arrived' || detail.data?.job.dispatch_status === 'completed' ? detail.data.job.dispatch_status : 'assigned') as DispatchStatus);
    setNotes(detail.data?.job.dispatch_notes ?? '');
  }, [assignedCrewIds, detail.data, visible]);

  const toggleCrew = (id: string) => {
    setCrewIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const save = async () => {
    try {
      await assign.mutateAsync({
        crew_member_ids: crewIds,
        truck_id: truckId,
        scheduled_start_time: startTime.trim() || null,
        dispatch_status: dispatchStatus,
        dispatch_notes: notes.trim() || null,
      });
      Alert.alert('Dispatch assigned');
      onClose();
    } catch (error) {
      Alert.alert('Dispatch update failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const loading = detail.isLoading || crew.isLoading || vehicles.isLoading;
  const error = detail.error || crew.error || vehicles.error;
  const job = detail.data?.job;
  const activeCrew = (crew.data ?? []).filter((member) => member.active !== false && member.is_active !== false);
  const activeVehicles = (vehicles.data ?? []).filter((vehicle) => !vehicle.status || ['active', 'available', 'ready'].includes(String(vehicle.status).toLowerCase()));
  const visibleVehicles = activeVehicles.length ? activeVehicles : vehicles.data ?? [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(7,21,47,0.32)' }}>
        <View style={{ width: '100%', maxWidth: 520, maxHeight: '88%', alignSelf: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: brand.surface, padding: 18, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: brand.text, fontSize: 22, fontWeight: '900' }}>Assign Dispatch</Text>
              <Text selectable style={{ color: brand.muted, fontSize: 12, fontWeight: '800' }}>{job?.job_number ?? 'Scheduled move'}</Text>
            </View>
            <Pressable accessibilityLabel="Close dispatch assignment" accessibilityRole="button" onPress={onClose} style={{ minHeight: 40, borderRadius: 12, borderWidth: 1, borderColor: brand.border, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <Text style={{ color: brand.muted, fontSize: 12, fontWeight: '900' }}>Close</Text>
              <X color={brand.muted} size={22} />
            </Pressable>
          </View>

          {loading ? <ActivityIndicator color={brand.blue} /> : null}
          {error ? <Text selectable style={{ color: brand.red, fontSize: 13, lineHeight: 18, fontWeight: '800' }}>{error instanceof Error ? error.message : 'Dispatch data could not be loaded.'}</Text> : null}

          {detail.data?.readiness?.blockers?.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {detail.data.readiness.blockers.map((blocker) => <WarningChip key={blocker} label={dispatchBlockerLabel(blocker)} />)}
            </View>
          ) : null}

          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Crew</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {activeCrew.map((member) => (
                <ChoiceChip
                  key={member.id}
                  label={`${crewName(member)} · ${member.role}`}
                  selected={crewIds.includes(member.id)}
                  onPress={() => toggleCrew(member.id)}
                />
              ))}
              {!activeCrew.length && !loading ? <Text selectable style={styles.emptyText}>No active crew members yet.</Text> : null}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Truck</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {visibleVehicles.map((vehicle) => (
                <ChoiceChip
                  key={vehicle.id}
                  label={vehicleLabel(vehicle)}
                  selected={truckId === vehicle.id}
                  onPress={() => setTruckId(truckId === vehicle.id ? null : vehicle.id)}
                />
              ))}
              {!visibleVehicles.length && !loading ? <Text selectable style={styles.emptyText}>No trucks found.</Text> : null}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.label}>Start time</Text>
              <TextInput value={startTime} onChangeText={setStartTime} placeholder="08:00" placeholderTextColor="#94A3B8" style={styles.input} />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.label}>Dispatch status</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {STATUSES.map((status) => <ChoiceChip key={status} compact label={dispatchStatusLabel(status)} selected={dispatchStatus === status} onPress={() => setDispatchStatus(status)} />)}
              </View>
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={styles.label}>Dispatch notes</Text>
            <TextInput value={notes} onChangeText={setNotes} multiline placeholder="Gate codes, truck notes, crew instructions..." placeholderTextColor="#94A3B8" style={[styles.input, { minHeight: 82, textAlignVertical: 'top' }]} />
          </View>

          <Pressable
            accessibilityLabel="Save dispatch assignment"
            accessibilityRole="button"
            disabled={assign.isPending || loading}
            onPress={save}
            style={{ minHeight: 50, borderRadius: 14, backgroundColor: brand.blue, opacity: assign.isPending || loading ? 0.65 : 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900' }}>{assign.isPending ? 'Saving...' : 'Save Dispatch'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ChoiceChip({ label, selected, compact, onPress }: { label: string; selected: boolean; compact?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ borderRadius: 999, borderWidth: 1, borderColor: selected ? brand.blue : brand.border, backgroundColor: selected ? brand.blueSoft : brand.surface, paddingHorizontal: compact ? 9 : 12, paddingVertical: compact ? 7 : 9 }}>
      <Text numberOfLines={1} style={{ color: selected ? brand.blue : brand.text, fontSize: compact ? 10 : 12, fontWeight: '900' }}>{label}</Text>
    </Pressable>
  );
}

function WarningChip({ label }: { label: string }) {
  return <View style={{ borderRadius: 999, backgroundColor: brand.orangeSoft, paddingHorizontal: 10, paddingVertical: 6 }}><Text style={{ color: brand.orange, fontSize: 11, fontWeight: '900' }}>{label}</Text></View>;
}

const styles = {
  label: { color: brand.text, fontSize: 12, fontWeight: '900' as const },
  input: { minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: brand.border, backgroundColor: '#FBFCFE', paddingHorizontal: 12, paddingVertical: 10, color: brand.text, fontSize: 13 },
  emptyText: { color: brand.muted, fontSize: 12, lineHeight: 17 },
};
