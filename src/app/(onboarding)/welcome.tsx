import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import {
  Building2,
  CalendarDays,
  ChevronRight,
  Home,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-react-native';
import { useEffect } from 'react';
import { Image, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { onboardingColors } from '@/components/onboarding/chrome';
import { useBrandAsset } from '@/hooks/useBrandAsset';
import { useOnboardingNav } from '@/hooks/use-onboarding-nav';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const fallbackLogo = require('../../../assets/images/marlon-logo.png');

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { next } = useOnboardingNav();
  const reducedMotion = useReducedMotion();
  const logo = useBrandAsset('logo_primary');
  const hasRemoteLogo = logo.url.startsWith('http');
  const logoSource = hasRemoteLogo ? { uri: logo.url } : fallbackLogo;
  const float = useSharedValue(0);
  const compact = height < 900;

  useEffect(() => {
    if (reducedMotion) return;
    float.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [float, reducedMotion]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: reducedMotion ? 0 : -3 + float.value * 6 }],
  }));

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top + (compact ? 52 : 76),
        paddingBottom: insets.bottom + 54,
        paddingHorizontal: 22,
        justifyContent: 'space-between',
        gap: compact ? 10 : 18,
      }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: insets.top + 62,
          left: -width * 0.09,
          width: width * 1.18,
          height: compact ? 500 : 590,
          borderRadius: 999,
          backgroundColor: 'rgba(234,242,255,0.82)',
        }}
      />

      <BackgroundScene compact={compact} />

      <Animated.View
        entering={FadeInUp.duration(reducedMotion ? 220 : 430)}
        style={[{ alignItems: 'center', gap: compact ? 13 : 18 }, logoStyle]}>
        <Image
          source={logoSource}
          accessibilityLabel={logo.alt_text ?? t('onboarding.welcome.brand')}
          resizeMode="contain"
          style={{ width: compact ? 145 : 190, height: compact ? 146 : 192 }}
        />

        <Text
          selectable
          style={{
            maxWidth: 390,
            color: onboardingColors.text,
            fontSize: compact ? 37 : 47,
            lineHeight: compact ? 39 : 49,
            letterSpacing: -1.8,
            fontWeight: '900',
            textAlign: 'center',
          }}>
          {t('onboarding.welcome.headline')}
        </Text>

        <Text
          selectable
          style={{
            maxWidth: 350,
            color: onboardingColors.muted,
            fontSize: compact ? 13 : 15,
            lineHeight: compact ? 18 : 21,
            textAlign: 'center',
          }}>
          {t('onboarding.welcome.sub')}
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(reducedMotion ? 220 : 420).delay(reducedMotion ? 0 : 180)}
        style={{
          borderRadius: 24,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: '#D5E0EE',
          padding: compact ? 12 : 17,
          gap: compact ? 10 : 15,
          backgroundColor: 'rgba(255,255,255,0.94)',
          boxShadow: '0 16px 34px rgba(15,45,85,0.11)',
        }}>
        <Text
          selectable
          style={{
            color: onboardingColors.marlonDarkBlue,
            fontSize: compact ? 12 : 15,
            lineHeight: compact ? 17 : 21,
            textAlign: 'center',
          }}>
          {t('onboarding.welcome.tagline')}
        </Text>

        <View style={{ height: 1, backgroundColor: '#DCE6F0' }} />

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TrustBadge
            Icon={ShieldCheck}
            iconColor="#0757A0"
            label={t('onboarding.welcome.usdot').replace(' ', '\n')}
          />
          <TrustBadge Icon={Star} iconColor={onboardingColors.marlonRed} label={t('onboarding.welcome.rating').replace(' ', '\n')} />
          <TrustBadge Icon={CalendarDays} iconColor="#0757A0" label={t('onboarding.welcome.since').replace(' ', '\n')} />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(reducedMotion ? 220 : 420).delay(reducedMotion ? 0 : 320)}
        style={{ gap: 13 }}>
        <Pressable
          accessibilityLabel={t('onboarding.welcome.getStarted')}
          accessibilityRole="button"
          onPress={next}
          style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 15px 30px rgba(239,68,68,0.32)' }}>
          <LinearGradient
            colors={['#FF4A43', '#EF3838']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              minHeight: compact ? 62 : 68,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#FF625D',
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Truck color="#FFFFFF" size={27} strokeWidth={2.4} />
            <Text style={{ color: '#FFFFFF', fontSize: compact ? 18 : 20, fontWeight: '900' }}>
              {t('onboarding.welcome.getStarted')}
            </Text>
            <ChevronRight color="#FFFFFF" size={27} strokeWidth={2.7} />
          </LinearGradient>
        </Pressable>

        <Link href="/app/login" asChild>
          <Pressable
            accessibilityLabel={t('onboarding.welcome.alreadyAccount')}
            accessibilityRole="link"
            style={{ minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Text style={{ color: '#0B3975', fontSize: 14, fontWeight: '900' }}>
              {t('onboarding.welcome.alreadyAccount')}
            </Text>
            <ChevronRight color="#7393B8" size={17} strokeWidth={2.6} />
          </Pressable>
        </Link>
      </Animated.View>
    </View>
  );
}

function TrustBadge({
  Icon,
  iconColor,
  label,
}: {
  Icon: typeof ShieldCheck;
  iconColor: string;
  label: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 58,
        borderRadius: 18,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: '#D9E4F0',
        paddingHorizontal: 7,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        backgroundColor: '#FFFFFF',
        boxShadow: '0 7px 14px rgba(15,45,85,0.08)',
      }}>
      <Icon color={iconColor} fill={Icon === Star ? iconColor : 'transparent'} size={20} strokeWidth={2.3} />
      <Text style={{ color: '#103B72', fontSize: 9, lineHeight: 12, fontWeight: '900' }}>{label}</Text>
    </View>
  );
}

function BackgroundScene({ compact }: { compact: boolean }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: compact ? 470 : 560, left: -24, right: -24, height: 180 }}>
      <View style={{ position: 'absolute', left: 0, bottom: 18, opacity: 0.15 }}>
        <Home color="#78A5D8" size={110} strokeWidth={1.5} />
      </View>
      <View style={{ position: 'absolute', right: 0, bottom: 8, opacity: 0.14 }}>
        <Building2 color="#78A5D8" size={112} strokeWidth={1.5} />
      </View>
      <View style={{ position: 'absolute', right: 34, top: 7, opacity: 0.16 }}>
        <View style={{ width: 75, height: 23, borderRadius: 999, backgroundColor: '#DCEAF8' }} />
        <View style={{ position: 'absolute', left: -15, top: 9, width: 42, height: 20, borderRadius: 999, backgroundColor: '#DCEAF8' }} />
      </View>
    </View>
  );
}
