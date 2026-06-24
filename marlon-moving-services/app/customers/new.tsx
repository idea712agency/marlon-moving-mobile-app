import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTopBar } from '@/components/operator/app-shell';
import { brand } from '@/constants/operator-brand';
import { supabase } from '@/lib/supabase';

export default function NewCustomerScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const trimmedNotes = notes.trim();
    const nextErrors: Record<string, string> = {};

    if (trimmedName.length < 2 || trimmedName.length > 100) nextErrors.name = t('customers.form.nameError');
    if (trimmedPhone && (trimmedPhone.length < 7 || trimmedPhone.length > 30)) nextErrors.phone = t('customers.form.phoneError');
    if (trimmedEmail && (trimmedEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))) {
      nextErrors.email = t('customers.form.emailError');
    }
    if (trimmedNotes.length > 1000) nextErrors.notes = t('customers.form.notesError');

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      Alert.alert(t('customers.form.validationTitle'), Object.values(nextErrors)[0]);
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(t('customers.form.notSignedIn'));
        return;
      }

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          name: trimmedName,
          email: trimmedEmail || null,
          phone: trimmedPhone || null,
          notes: trimmedNotes || null,
          contact_type: 'customer',
          status: 'active',
          user_id: user.id,
        })
        .select('id')
        .single();

      if (error) {
        Alert.alert(error.message);
        return;
      }

      router.replace(`/customers/${data.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: brand.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppTopBar />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 34, gap: 18 }}>
        <View style={{ gap: 5 }}>
          <Text selectable style={{ color: brand.text, fontSize: 28, lineHeight: 33, fontWeight: '900', letterSpacing: -0.7 }}>
            {t('customers.form.title')}
          </Text>
          <Text selectable style={{ color: brand.muted, fontSize: 13, lineHeight: 18 }}>{t('customers.form.subtitle')}</Text>
        </View>

        <View
          style={{
            borderRadius: 18,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: brand.border,
            padding: 16,
            gap: 15,
            backgroundColor: brand.surface,
          }}>
          <FormField
            required
            label={t('customers.form.name')}
            placeholder={t('customers.form.namePlaceholder')}
            value={name}
            error={errors.name}
            onChangeText={setName}
          />
          <FormField
            label={t('customers.form.phone')}
            placeholder={t('customers.form.phonePlaceholder')}
            value={phone}
            error={errors.phone}
            keyboardType="phone-pad"
            onChangeText={setPhone}
          />
          <FormField
            label={t('customers.form.email')}
            placeholder={t('customers.form.emailPlaceholder')}
            value={email}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={setEmail}
          />
          <FormField
            multiline
            label={t('customers.form.notes')}
            placeholder={t('customers.form.notesPlaceholder')}
            value={notes}
            error={errors.notes}
            onChangeText={setNotes}
          />
        </View>

        <Pressable
          accessibilityLabel={t('customers.form.save')}
          accessibilityRole="button"
          disabled={saving}
          onPress={() => void save()}
          style={{
            height: 48,
            borderRadius: 14,
            borderCurve: 'continuous',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: brand.blue,
            opacity: saving ? 0.72 : 1,
          }}>
          {saving ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>{t('customers.form.saving')}</Text>
            </View>
          ) : (
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>{t('customers.form.save')}</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function FormField({
  label,
  required,
  error,
  multiline,
  ...inputProps
}: React.ComponentProps<typeof TextInput> & { label: string; required?: boolean; error?: string }) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={{ color: brand.text, fontSize: 12, fontWeight: '900' }}>
        {label}{required ? ' *' : ''}
      </Text>
      <TextInput
        {...inputProps}
        multiline={multiline}
        placeholderTextColor="#94A3B8"
        style={{
          minHeight: multiline ? 112 : 46,
          borderRadius: 13,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: error ? brand.red : brand.border,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 12 : 10,
          color: brand.text,
          fontSize: 13,
          textAlignVertical: multiline ? 'top' : 'center',
          backgroundColor: '#FBFCFE',
        }}
      />
      {error ? <Text selectable style={{ color: brand.red, fontSize: 10, fontWeight: '700' }}>{error}</Text> : null}
    </View>
  );
}
