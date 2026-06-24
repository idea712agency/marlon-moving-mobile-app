import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, router } from 'expo-router';
import { BookOpen, Globe, LockKeyhole, Mail } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { brand } from '@/constants/operator-brand';
import { errorMessage } from '@/lib/data';
import { operatorSignInSchema, type OperatorSignInInput } from '@/lib/schemas/auth';
import { useAuth } from '@/providers/auth-provider';

export default function AuthScreen() {
  const { session, isAdmin, loading, authError, signInWithEmail, signInWithGoogle } = useAuth();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OperatorSignInInput>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(operatorSignInSchema),
  });

  if (session && isAdmin) return <Redirect href="/home" />;

  const submit = async (values: OperatorSignInInput) => {
    try {
      await signInWithEmail(values.email, values.password);
    } catch (error) {
      setError('root', { message: errorMessage(error) });
    }
  };

  const google = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      setError('root', { message: errorMessage(error) });
    }
  };

  const message = errors.root?.message ?? authError;
  const busy = loading || isSubmitting;

  return (
    <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: brand.bg }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 22, gap: 24 }}>
        <View style={{ gap: 12 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 24,
              borderCurve: 'continuous',
              backgroundColor: brand.navy,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 16px 30px rgba(11,46,111,0.22)',
            }}>
            <LockKeyhole color="#FFFFFF" size={34} strokeWidth={2.4} />
          </View>
          <View style={{ gap: 6 }}>
            <Text selectable style={{ color: brand.text, fontSize: 30, lineHeight: 35, fontWeight: '900', letterSpacing: -0.7 }}>
              Marlon Moving Operator
            </Text>
            <Text selectable style={{ color: brand.muted, fontSize: 15, lineHeight: 21 }}>
              Sign in with an admin account to manage moves, customers, dispatch, and billing.
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: brand.surface,
            borderRadius: 24,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: brand.border,
            padding: 18,
            gap: 14,
            boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
          }}>
          <View style={{ gap: 7 }}>
            <Text style={{ color: brand.text, fontSize: 13, fontWeight: '800' }}>Email</Text>
            <View
              style={{
                minHeight: 52,
                borderWidth: 1,
                borderColor: errors.email ? brand.red : brand.border,
                borderRadius: 14,
                paddingHorizontal: 13,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}>
              <Mail color={brand.muted} size={19} />
              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    accessibilityLabel="Email"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="admin@marlonmovingservices.com"
                    placeholderTextColor="#94A3B8"
                    style={{ flex: 1, color: brand.text, fontSize: 15 }}
                    value={value}
                  />
                )}
              />
            </View>
            {errors.email?.message ? <Text selectable style={{ color: brand.red, fontSize: 12 }}>{errors.email.message}</Text> : null}
          </View>

          <View style={{ gap: 7 }}>
            <Text style={{ color: brand.text, fontSize: 13, fontWeight: '800' }}>Password</Text>
            <View
              style={{
                minHeight: 52,
                borderWidth: 1,
                borderColor: errors.password ? brand.red : brand.border,
                borderRadius: 14,
                paddingHorizontal: 13,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}>
              <LockKeyhole color={brand.muted} size={19} />
              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    accessibilityLabel="Password"
                    autoComplete="current-password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    style={{ flex: 1, color: brand.text, fontSize: 15 }}
                    value={value}
                  />
                )}
              />
            </View>
            {errors.password?.message ? <Text selectable style={{ color: brand.red, fontSize: 12 }}>{errors.password.message}</Text> : null}
          </View>

          {message ? (
            <View style={{ borderRadius: 14, backgroundColor: brand.redSoft, padding: 12 }}>
              <Text selectable style={{ color: brand.red, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>
                {message}
              </Text>
            </View>
          ) : null}

          <Pressable
            accessibilityLabel="Sign in"
            accessibilityRole="button"
            disabled={busy}
            onPress={handleSubmit(submit)}
            style={{
              height: 52,
              borderRadius: 14,
              backgroundColor: brand.blue,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: busy ? 0.62 : 1,
            }}>
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900' }}>Sign in</Text>}
          </Pressable>

          <Pressable
            accessibilityLabel="Sign in with Google"
            accessibilityRole="button"
            disabled={busy}
            onPress={google}
            style={{
              height: 52,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: brand.border,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 9,
              opacity: busy ? 0.62 : 1,
            }}>
            <Globe color={brand.text} size={18} strokeWidth={2.4} />
            <Text style={{ color: brand.text, fontSize: 15, fontWeight: '900' }}>Continue with Google</Text>
          </Pressable>

          <Pressable
            accessibilityLabel="View welcome pages"
            accessibilityRole="link"
            disabled={busy}
            onPress={() => router.navigate('/welcome?preview=true')}
            style={{
              height: 52,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: brand.border,
              backgroundColor: brand.blueSoft,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 9,
              opacity: busy ? 0.62 : 1,
            }}>
            <BookOpen color={brand.blue} size={18} strokeWidth={2.4} />
            <Text style={{ color: brand.blue, fontSize: 15, fontWeight: '900' }}>View welcome pages</Text>
          </Pressable>
        </View>

        <Text selectable style={{ color: brand.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' }}>
          Admin access is required. Non-admin users are signed out automatically.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
