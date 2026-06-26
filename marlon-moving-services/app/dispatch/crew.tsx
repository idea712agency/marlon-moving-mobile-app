import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { UserRoundPlus, Users } from 'lucide-react-native';

import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { brand } from '@/constants/operator-brand';
import { useCrewMembers, useCrewRosterActions } from '@/hooks/use-dispatch';
import { crewName, type CrewRole, type DispatchCrewMember } from '@/lib/dispatch';

const ROLES: CrewRole[] = ['lead', 'driver', 'mover', 'helper'];

export default function CrewRosterScreen() {
  const crew = useCrewMembers();
  const actions = useCrewRosterActions();
  const [editing, setEditing] = useState<DispatchCrewMember | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<CrewRole>('mover');

  const startNew = () => {
    setEditing(null);
    setName('');
    setPhone('');
    setRole('mover');
  };

  const startEdit = (member: DispatchCrewMember) => {
    setEditing(member);
    setName(member.name ?? '');
    setPhone(member.phone ?? '');
    setRole(ROLES.includes(member.role as CrewRole) ? member.role as CrewRole : 'mover');
  };

  const save = async () => {
    if (!name.trim()) return Alert.alert('Name required', 'Enter the crew member name.');
    try {
      await actions.upsert.mutateAsync({ id: editing?.id, name: name.trim(), phone: phone.trim() || null, role, active: true, is_active: true });
      Alert.alert(editing ? 'Crew member updated' : 'Crew member added');
      startNew();
    } catch (error) {
      Alert.alert('Crew save failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const deactivate = async (member: DispatchCrewMember) => {
    try {
      await actions.deactivate.mutateAsync(member.id);
      Alert.alert('Crew member deactivated');
    } catch (error) {
      Alert.alert('Deactivate failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const members = crew.data ?? [];

  return (
    <OperatorScreen refreshing={crew.isRefetching} onRefresh={() => void crew.refetch()}>
      <OperatorPageHeader title="Crew Roster" subtitle="Manage active crew members for dispatch assignment." />

      <OperatorCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <UserRoundPlus color={brand.blue} size={22} />
          <Text style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>{editing ? 'Edit crew member' : 'Add crew member'}</Text>
        </View>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Phone" value={phone} keyboardType="phone-pad" onChangeText={setPhone} />
        <Text style={styles.label}>Role</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ROLES.map((item) => (
            <Pressable key={item} onPress={() => setRole(item)} style={{ borderRadius: 999, backgroundColor: role === item ? brand.blue : brand.blueSoft, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ color: role === item ? '#FFFFFF' : brand.navy, fontSize: 11, fontWeight: '900' }}>{titleCase(item)}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable disabled={actions.upsert.isPending} onPress={save} style={{ flex: 1, minHeight: 48, borderRadius: 13, backgroundColor: brand.blue, opacity: actions.upsert.isPending ? 0.65 : 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>{actions.upsert.isPending ? 'Saving...' : 'Save Crew Member'}</Text>
          </Pressable>
          {editing ? (
            <Pressable onPress={startNew} style={{ minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: brand.border, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: brand.blue, fontSize: 13, fontWeight: '900' }}>Cancel</Text>
            </Pressable>
          ) : null}
        </View>
      </OperatorCard>

      {crew.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
      {crew.error ? <OperatorCard><Text selectable style={{ color: brand.red }}>{crew.error instanceof Error ? crew.error.message : 'Crew roster unavailable.'}</Text></OperatorCard> : null}
      {!crew.isLoading && !crew.error && !members.length ? (
        <OperatorCard>
          <Users color={brand.blue} size={30} />
          <Text style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>No crew members</Text>
          <Text style={{ color: brand.muted }}>Add your first crew member to assign dispatch jobs.</Text>
        </OperatorCard>
      ) : null}

      {members.map((member) => {
        const active = member.active !== false && member.is_active !== false;
        return (
          <OperatorCard key={member.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text selectable style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>{crewName(member)}</Text>
                <Text selectable style={{ color: brand.muted, fontSize: 12 }}>{titleCase(String(member.role ?? 'mover'))}{member.phone ? ` · ${member.phone}` : ''}</Text>
              </View>
              <View style={{ borderRadius: 999, backgroundColor: active ? brand.greenSoft : brand.redSoft, paddingHorizontal: 10, paddingVertical: 6 }}>
                <Text style={{ color: active ? brand.green : brand.red, fontSize: 10, fontWeight: '900' }}>{active ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={() => startEdit(member)} style={{ flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: brand.border, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: brand.blue, fontWeight: '900' }}>Edit</Text>
              </Pressable>
              {active ? (
                <Pressable onPress={() => void deactivate(member)} style={{ flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: brand.red, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: brand.red, fontWeight: '900' }}>Deactivate</Text>
                </Pressable>
              ) : null}
            </View>
          </OperatorCard>
        );
      })}
    </OperatorScreen>
  );
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, ...inputProps } = props;
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...inputProps} placeholderTextColor="#94A3B8" style={styles.input} />
    </View>
  );
}

const titleCase = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const styles = {
  label: { color: brand.text, fontSize: 12, fontWeight: '900' as const },
  input: { minHeight: 46, borderWidth: 1, borderColor: brand.border, borderRadius: 12, backgroundColor: '#FBFCFE', paddingHorizontal: 12, color: brand.text, fontSize: 13 },
};
