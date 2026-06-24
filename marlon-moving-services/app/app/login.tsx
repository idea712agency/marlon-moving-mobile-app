import Head from 'expo-router/head';
import { router } from 'expo-router';
import { LockKeyhole, Mail, ShieldCheck, Truck } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { brand } from '@/constants/operator-brand';
import { errorMessage } from '@/lib/data';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';

export default function CustomerLoginScreen() {
  const { signIn, resetPassword } = useCustomerAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async () => {
    setMessage('');
    if (!email.trim()) return setMessage('Enter your email address.');
    if (!password) return setMessage('Enter your password.');
    setBusy(true);
    try {
      const result = await signIn({ email, password });
      router.replace(result.isAdmin ? '/home' : '/app/home');
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const forgotPassword = async () => {
    setMessage('');
    if (!email.trim()) return setMessage('Enter your email address first, then tap Forgot password.');
    setResetBusy(true);
    try {
      await resetPassword(email);
      Alert.alert('Password reset sent', 'Check your email for a password reset link.');
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <>
      <Head>
        <title>Customer sign in | Marlon Moving Services</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: brand.bg }}>
        <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 22, gap: 22 }}>
          <View style={{ alignItems: 'center', gap: 12 }}>
            <View style={styles.iconBadge}><Truck color="#FFFFFF" size={34} strokeWidth={2.4} /></View>
            <View style={{ alignItems: 'center', gap: 5 }}>
              <Text style={{ color: brand.red, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Customer portal</Text>
              <Text selectable style={{ color: brand.text, fontSize: 30, lineHeight: 35, fontWeight: '900', textAlign: 'center', letterSpacing: -0.8 }}>Welcome back</Text>
              <Text selectable style={{ color: brand.muted, fontSize: 15, lineHeight: 21, textAlign: 'center' }}>Sign in to view quotes, track your move, and message your crew.</Text>
            </View>
          </View>

          <View style={styles.card}>
            <AuthField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" icon={<Mail color={brand.muted} size={18} />} />
            <AuthField label="Password" value={password} onChangeText={setPassword} autoComplete="current-password" secureTextEntry icon={<LockKeyhole color={brand.muted} size={18} />} />
            <Pressable accessibilityLabel="Forgot password" accessibilityRole="button" disabled={resetBusy || busy} onPress={() => void forgotPassword()} style={{ alignSelf: 'flex-end', opacity: resetBusy || busy ? 0.6 : 1 }}>
              <Text style={{ color: brand.blue, fontSize: 13, fontWeight: '900' }}>{resetBusy ? 'Sending reset…' : 'Forgot password?'}</Text>
            </Pressable>

            {message ? <ErrorBox message={message} /> : null}
            <PrimaryAuthButton label="Sign in" busy={busy} onPress={() => void submit()} />

            <Pressable
              accessibilityLabel="Create an account"
              accessibilityRole="link"
              disabled={busy}
              onPress={() => router.navigate('/app/signup')}
              style={[styles.createButton, { opacity: busy ? 0.62 : 1 }]}>
                <Text style={{ color: brand.blue, fontSize: 16, fontWeight: '900' }}>Create an account</Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>STAFF ACCESS</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              accessibilityLabel="Admin or staff sign in"
              accessibilityRole="link"
              disabled={busy}
              onPress={() => router.navigate('/auth')}
              style={[styles.adminButton, { opacity: busy ? 0.62 : 1 }]}>
                <ShieldCheck color={brand.navy} size={19} strokeWidth={2.4} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: brand.navy, fontSize: 14, fontWeight: '900' }}>Admin or staff sign in</Text>
                  <Text style={{ color: brand.muted, fontSize: 11 }}>Open the operator portal</Text>
                </View>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function AuthField({ label, icon, ...props }: React.ComponentProps<typeof TextInput> & { label: string; icon: React.ReactNode }) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        {icon}
        <TextInput placeholderTextColor="#94A3B8" style={styles.input} {...props} />
      </View>
    </View>
  );
}

function ErrorBox({ message }: { message: string }) {
  return <View style={styles.errorBox}><Text selectable style={{ color: brand.red, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>{message}</Text></View>;
}

function PrimaryAuthButton({ label, busy, onPress }: { label: string; busy: boolean; onPress: () => void }) {
  return <Pressable accessibilityLabel={label} accessibilityRole="button" disabled={busy} onPress={onPress} style={[styles.primaryButton, { opacity: busy ? 0.62 : 1 }]}>{busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{label}</Text>}</Pressable>;
}

const styles = {
  iconBadge: { width: 74, height: 74, borderRadius: 25, borderCurve: 'continuous' as const, backgroundColor: brand.navy, alignItems: 'center' as const, justifyContent: 'center' as const, boxShadow: '0 16px 30px rgba(11,46,111,0.22)' },
  card: { backgroundColor: brand.surface, borderRadius: 24, borderCurve: 'continuous' as const, borderWidth: 1, borderColor: brand.border, padding: 18, gap: 14, boxShadow: '0 1px 2px rgba(15,23,42,0.04)' },
  label: { color: brand.text, fontSize: 13, fontWeight: '800' as const },
  inputWrap: { minHeight: 52, borderWidth: 1, borderColor: brand.border, borderRadius: 14, paddingHorizontal: 13, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
  input: { flex: 1, color: brand.text, fontSize: 15 },
  primaryButton: { height: 52, borderRadius: 14, backgroundColor: brand.blue, alignItems: 'center' as const, justifyContent: 'center' as const },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' as const },
  createButton: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: brand.blue, backgroundColor: brand.blueSoft, alignItems: 'center' as const, justifyContent: 'center' as const },
  divider: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 9, paddingVertical: 3 },
  dividerLine: { flex: 1, height: 1, backgroundColor: brand.border },
  dividerText: { color: brand.muted, fontSize: 9, fontWeight: '900' as const, letterSpacing: 0.8 },
  adminButton: { minHeight: 58, borderRadius: 14, borderWidth: 1, borderColor: brand.border, backgroundColor: '#FFFFFF', paddingHorizontal: 14, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 11 },
  errorBox: { borderRadius: 14, backgroundColor: brand.redSoft, padding: 12 },
};
