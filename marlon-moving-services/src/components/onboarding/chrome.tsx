import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect, useMemo } from 'react';
import { Pressable, StyleProp, Text, View, ViewStyle, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useOnboardingNav } from '@/hooks/use-onboarding-nav';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export const onboardingColors = {
  marlonBlue: '#3B82F6',
  marlonRed: '#EF4444',
  marlonDarkBlue: '#1E3A5F',
  marlonDarkAzure: '#0B1E36',
  marlonAzure: '#F0F9FF',
  white: '#FFFFFF',
  lightBg: '#F7F8FB',
  lightSurface: '#FFFFFF',
  lightSurfaceSoft: '#EEF4FB',
  lightBorder: '#DDE6F0',
  text: '#07152F',
  muted: '#64748B',
};

export function OnboardingChrome({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { t } = useTranslation();
  const { step, next, back, skip } = useOnboardingNav();
  const reducedMotion = useReducedMotion();
  const drift = useSharedValue(0);
  const isFinal = step === 5;

  useEffect(() => {
    if (reducedMotion) return;
    drift.value = withRepeat(withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [drift, reducedMotion]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [-width * 0.22, width * 0.16]) },
      { translateY: interpolate(drift.value, [0, 1], [-height * 0.08, height * 0.14]) },
      { scale: interpolate(drift.value, [0, 1], [1, 1.12]) },
    ],
    opacity: reducedMotion ? 0.26 : interpolate(drift.value, [0, 1], [0.22, 0.38]),
  }));

  const swipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-55, 55])
        .failOffsetY([-24, 24])
        .onEnd((event) => {
          const swipeLeft = event.translationX < -70 || event.velocityX < -650;
          const swipeRight = event.translationX > 70 || event.velocityX > 650;

          if (swipeLeft && step < 5) {
            runOnJS(next)();
          } else if (swipeRight && step > 1) {
            runOnJS(back)();
          }
        }),
    [back, next, step],
  );

  return (
    <View style={{ flex: 1, backgroundColor: onboardingColors.lightBg }}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={[onboardingColors.white, onboardingColors.lightBg, onboardingColors.marlonAzure]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={{ position: 'absolute', inset: 0 }}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: Math.max(width * 1.1, 390),
            height: Math.max(width * 1.1, 390),
            borderRadius: 999,
            top: height * 0.12,
            left: width * 0.05,
            backgroundColor: 'rgba(59,130,246,0.14)',
          },
          glowStyle,
        ]}
      />
      <View pointerEvents="none" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.36)' }} />
      {!isFinal ? (
        <Pressable
          accessibilityLabel={t('onboarding.common.skip')}
          accessibilityRole="button"
          onPress={skip}
          style={{
            position: 'absolute',
            zIndex: 10,
            top: insets.top + 14,
            right: 22,
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.86)',
            borderWidth: 1,
            borderColor: onboardingColors.lightBorder,
            boxShadow: '0 8px 20px rgba(15,23,42,0.08)',
          }}>
          <Text style={{ color: onboardingColors.text, fontSize: 14, fontWeight: '800' }}>{t('onboarding.common.skip')}</Text>
        </Pressable>
      ) : null}
      <GestureDetector gesture={swipeGesture}>
        <View style={{ flex: 1 }}>{children}</View>
      </GestureDetector>
      <Progress step={step} bottom={insets.bottom + 18} />
    </View>
  );
}

function Progress({ step, bottom }: { step: number; bottom: number }) {
  return (
    <View
      accessibilityLabel={`Onboarding progress ${step} of 5`}
      accessibilityRole="progressbar"
      style={{
        position: 'absolute',
        left: 22,
        right: 22,
        bottom,
        flexDirection: 'row',
        gap: 8,
      }}>
      {[1, 2, 3, 4, 5].map((item) => (
        <ProgressSegment key={item} active={item <= step} current={item === step} />
      ))}
    </View>
  );
}

function ProgressSegment({ active, current }: { active: boolean; current: boolean }) {
  const fill = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    fill.value = withTiming(active ? 1 : 0, { duration: current ? 520 : 240, easing: Easing.out(Easing.cubic) });
  }, [active, current, fill]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: fill.value }],
  }));

  return (
    <View style={{ flex: 1, height: 5, borderRadius: 999, overflow: 'hidden', backgroundColor: 'rgba(100,116,139,0.18)' }}>
      <Animated.View
        style={[
          {
            height: '100%',
            width: '100%',
            borderRadius: 999,
            backgroundColor: current ? onboardingColors.marlonRed : onboardingColors.marlonBlue,
            transformOrigin: 'left center',
          },
          fillStyle,
        ]}
      />
    </View>
  );
}

export function GlassCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        {
          overflow: 'hidden',
          borderRadius: 24,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: onboardingColors.lightBorder,
          backgroundColor: 'rgba(255,255,255,0.88)',
          boxShadow: '0 18px 38px rgba(15,23,42,0.10)',
        },
        style,
      ]}>
      <LinearGradient colors={['rgba(255,255,255,1)', 'rgba(240,249,255,0.82)']} style={{ flex: 1, padding: 20, gap: 12 }}>
        {children}
      </LinearGradient>
    </View>
  );
}

export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Animated.View entering={FadeIn.duration(360)} style={{ gap: 10 }}>
      <Text
        selectable
        style={{
          color: onboardingColors.text,
          fontSize: 36,
          lineHeight: 40,
          letterSpacing: -0.8,
          fontWeight: '900',
        }}>
        {title}
      </Text>
      {subtitle ? (
        <Text selectable style={{ color: onboardingColors.muted, fontSize: 16, lineHeight: 22 }}>
          {subtitle}
        </Text>
      ) : null}
    </Animated.View>
  );
}

export function OnboardingButton({
  label,
  onPress,
  variant = 'red',
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  variant?: 'red' | 'white' | 'ghost';
  accessibilityLabel?: string;
}) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const backgroundColor =
    variant === 'red' ? onboardingColors.marlonRed : variant === 'white' ? onboardingColors.white : 'rgba(255,255,255,0.82)';
  const color = variant === 'white' || variant === 'ghost' ? onboardingColors.marlonDarkBlue : onboardingColors.white;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={() => {
          if (!reducedMotion) scale.value = withTiming(0.97, { duration: 110 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 150 });
        }}
        style={{
          minHeight: 56,
          borderRadius: 16,
          borderCurve: 'continuous',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: onboardingColors.lightBorder,
          boxShadow: variant === 'red' ? '0 12px 32px rgba(239,68,68,0.35)' : '0 10px 24px rgba(0,0,0,0.16)',
        }}>
        <Text style={{ color, fontSize: 16, fontWeight: '900' }}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}
