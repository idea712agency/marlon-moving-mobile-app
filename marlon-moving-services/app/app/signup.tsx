import Head from 'expo-router/head';
import { Link, router } from 'expo-router';
import { LockKeyhole, Mail, Truck, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { brand } from '@/constants/operator-brand';
import { errorMessage } from '@/lib/data';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';

export default function CustomerSignupScreen() {
  const { signUp } = useCustomerAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async () => {
    setMessage('');
    if (!fullName.trim()) return setMessage('Enter your full name.');
    if (!email.trim()) return setMessage('Enter your email address.');
    if (password.length < 6) return setMessage('Password must be at least 6 characters.');
    setBusy(true);
    try {
      await signUp({ fullName, email, password });
      router.replace('/app/home');
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create account | Marlon Moving Services</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <CustomerAuthFrame
        eyebrow="Customer portal"
        title="Create your account"
        subtitle="Save quotes, track your move, and message Marlon Moving Services."
        footer={<Text style={styles.footerText}>Already have an account? <Link href="/app/login" style={styles.footerLink}>Sign in</Link></Text>}>
        <AuthField label="Full name" value={fullName} onChangeText={setFullName} autoComplete="name" icon={<UserRound color={brand.muted} size={18} />} />
        <AuthField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" icon={<Mail color={brand.muted} size={18} />} />
        <AuthField label="Password" value={password} onChangeText={setPassword} autoComplete="new-password" secureTextEntry icon={<LockKeyhole color={brand.muted} size={18} />} />

        <Text selectable style={{ color: brand.muted, fontSize: 12, lineHeight: 18 }}>
          By creating an account, you agree to the{' '}
          <Link href="/app/terms-of-service" style={styles.inlineLink}>Terms of Service</Link>
          {' '}and{' '}
          <Link href="/app/privacy-policy" style={styles.inlineLink}>Privacy Policy</Link>.
        </Text>

        {message ? <ErrorBox message={message} /> : null}
        <PrimaryAuthButton label="Create account" busy={busy} onPress={() => void submit()} />
      </CustomerAuthFrame>
    </>
  );
}

function CustomerAuthFrame({ eyebrow, title, subtitle, children, footer }: { eyebrow: string; title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: brand.bg }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 22, gap: 22 }}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <View style={styles.iconBadge}><Truck color="#FFFFFF" size={34} strokeWidth={2.4} /></View>
          <View style={{ alignItems: 'center', gap: 5 }}>
            <Text style={{ color: brand.red, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{eyebrow}</Text>
            <Text selectable style={{ color: brand.text, fontSize: 30, lineHeight: 35, fontWeight: '900', textAlign: 'center', letterSpacing: -0.8 }}>{title}</Text>
            <Text selectable style={{ color: brand.muted, fontSize: 15, lineHeight: 21, textAlign: 'center' }}>{subtitle}</Text>
          </View>
        </View>
        <View style={styles.card}>{children}</View>
        {footer}
      </ScrollView>
    </KeyboardAvoidingView>
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
  errorBox: { borderRadius: 14, backgroundColor: brand.redSoft, padding: 12 },
  footerText: { color: brand.muted, textAlign: 'center' as const, fontSize: 14, fontWeight: '700' as const },
  footerLink: { color: brand.blue, fontWeight: '900' as const },
  inlineLink: { color: brand.blue, fontWeight: '900' as const },
};
