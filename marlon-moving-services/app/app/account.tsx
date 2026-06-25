import { router } from 'expo-router';
import { LogOut, Save } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';

import { CustomerCard, CustomerEmpty, CustomerShell } from '@/components/customer/customer-shell';
import { brand } from '@/constants/operator-brand';
import { errorMessage, type Profile } from '@/lib/data';
import { invokeSupabaseFunction } from '@/lib/supabase-functions';
import { useAuth } from '@/providers/auth-provider';

export default function CustomerAccountScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFullName(String(user?.user_metadata?.full_name ?? ''));
    setPhone(String(user?.user_metadata?.phone ?? ''));
    setLoading(false);
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      const data = await invokeSupabaseFunction<{ profile?: Profile; full_name?: string | null; phone?: string | null }>('mobile-update-profile', {
        body: { full_name: fullName.trim() || undefined, phone: phone.trim() || undefined },
      });
      if (data.profile) setProfile(data.profile);
      setFullName(data.profile?.full_name ?? data.full_name ?? fullName.trim());
      setPhone(data.profile?.phone ?? data.phone ?? phone.trim());
      Alert.alert('Saved', 'Your account details were updated.');
    } catch (updateError) {
      setError(errorMessage(updateError));
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await signOut();
    router.replace('/app/login');
  };

  return (
    <CustomerShell title="Account" subtitle="Manage your customer profile and portal access.">
      {loading ? <ActivityIndicator color={brand.blue} /> : null}
      {error ? <CustomerEmpty title="Account unavailable" body={error} /> : null}
      <CustomerCard>
        <Text style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>Profile</Text>
        <Field label="Full name" value={fullName} onChangeText={setFullName} />
        <Field label="Email" value={profile?.email ?? user?.email ?? ''} editable={false} />
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Pressable disabled={saving} onPress={() => void save()} style={{ minHeight: 48, borderRadius: 14, backgroundColor: brand.blue, opacity: saving ? 0.6 : 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Save color="#FFFFFF" size={17} />
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>{saving ? 'Saving…' : 'Save profile'}</Text>
        </Pressable>
      </CustomerCard>
      <Pressable onPress={() => void logout()} style={{ minHeight: 52, borderRadius: 16, backgroundColor: brand.redSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <LogOut color={brand.red} size={18} />
        <Text style={{ color: brand.red, fontSize: 15, fontWeight: '900' }}>Sign out</Text>
      </Pressable>
    </CustomerShell>
  );
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, ...inputProps } = props;
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: brand.text, fontSize: 12, fontWeight: '900' }}>{label}</Text>
      <TextInput
        {...inputProps}
        placeholderTextColor="#94A3B8"
        style={{ minHeight: 46, borderWidth: 1, borderColor: brand.border, borderRadius: 13, backgroundColor: inputProps.editable === false ? brand.bg : brand.surface, paddingHorizontal: 12, color: brand.text }}
      />
    </View>
  );
}
