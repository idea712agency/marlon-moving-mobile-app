import { LinearGradient } from 'expo-linear-gradient';
import {
  FileText,
  Mail,
  MapPinned,
  MapPin,
  MessageSquareText,
  Phone,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-react-native';
import { Linking, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { onboardingColors } from '@/components/onboarding/chrome';
import { useOnboardingNav } from '@/hooks/use-onboarding-nav';

export default function GetStartedScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { finish } = useOnboardingNav();
  const compact = height < 900;

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top + (compact ? 50 : 78),
        paddingBottom: insets.bottom + 52,
        paddingHorizontal: 22,
        justifyContent: 'space-between',
        gap: compact ? 9 : 14,
      }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: insets.top + 62,
          left: -width * 0.11,
          width: width * 1.18,
          height: compact ? 510 : 580,
          borderRadius: 999,
          backgroundColor: 'rgba(234,242,255,0.72)',
        }}
      />
      <TruckScene compact={compact} />

      <View style={{ gap: compact ? 7 : 10 }}>
        <Text
          selectable
          style={{
            maxWidth: 360,
            color: onboardingColors.text,
            fontSize: compact ? 38 : 46,
            lineHeight: compact ? 41 : 49,
            letterSpacing: -1.5,
            fontWeight: '900',
          }}>
          {t('onboarding.getStarted.headline')}
        </Text>
        <Text
          selectable
          style={{
            maxWidth: compact ? 310 : 340,
            color: onboardingColors.muted,
            fontSize: compact ? 13 : 15,
            lineHeight: compact ? 18 : 22,
          }}>
          {t('onboarding.getStarted.sub')}
        </Text>
      </View>

      <LinearGradient
        colors={['rgba(255,255,255,1)', 'rgba(247,251,255,0.96)']}
        style={{
          borderRadius: 22,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: '#D5E1EF',
          padding: compact ? 12 : 16,
          gap: compact ? 10 : 14,
          backgroundColor: '#FFFFFF',
          boxShadow: '0 16px 34px rgba(15,45,85,0.10)',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
          <TrustItem Icon={ShieldCheck} label={t('onboarding.welcome.usdot')} compact={compact} />
          <Divider />
          <TrustItem Icon={Star} label={t('onboarding.welcome.rating')} compact={compact} star />
          <Divider />
          <TrustItem Icon={MapPin} label="Sterling, VA" compact={compact} />
        </View>

        <View style={{ height: 1, backgroundColor: '#DCE6F0' }} />

        <BenefitRow
          compact={compact}
          Icon={FileText}
          title={t('onboarding.getStarted.saveTitle')}
          body={t('onboarding.getStarted.saveBody')}
        />
        <BenefitRow
          compact={compact}
          Icon={MapPinned}
          title={t('onboarding.getStarted.trackTitle')}
          body={t('onboarding.getStarted.trackBody')}
        />
        <BenefitRow
          compact={compact}
          Icon={MessageSquareText}
          title={t('onboarding.getStarted.messageTitle')}
          body={t('onboarding.getStarted.messageBody')}
        />

        <View style={{ height: 1, backgroundColor: '#DCE6F0' }} />

        <View style={{ flexDirection: 'row', gap: 9 }}>
          <ContactPill
            Icon={Phone}
            label={t('onboarding.getStarted.call')}
            compact={compact}
            onPress={() => Linking.openURL('tel:5715256129')}
          />
          <ContactPill
            Icon={Mail}
            label={t('onboarding.getStarted.email')}
            compact={compact}
            onPress={() => Linking.openURL('mailto:marlonmovingservices@gmail.com')}
          />
        </View>
      </LinearGradient>

      <View style={{ gap: compact ? 8 : 10 }}>
        <Pressable
          accessibilityLabel={t('onboarding.getStarted.createAccount')}
          accessibilityRole="button"
          onPress={() => finish('/app/signup')}
          style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 12px 28px rgba(239,68,68,0.30)' }}>
          <LinearGradient
            colors={['#FF4A43', '#EF3838']}
            style={{ minHeight: compact ? 50 : 56, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: compact ? 15 : 17, fontWeight: '900' }}>
              {t('onboarding.getStarted.createAccount')}
            </Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          accessibilityLabel={t('onboarding.getStarted.freeQuote')}
          accessibilityRole="button"
          onPress={() => finish('/quote/new')}
          style={{
            minHeight: compact ? 48 : 54,
            borderRadius: 16,
            borderCurve: 'continuous',
            borderWidth: 1.5,
            borderColor: onboardingColors.text,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
          }}>
          <Text style={{ color: onboardingColors.text, fontSize: compact ? 15 : 17, fontWeight: '900' }}>
            {t('onboarding.getStarted.freeQuote')}
          </Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Text style={{ color: onboardingColors.muted, fontSize: compact ? 12 : 14 }}>
            {t('onboarding.getStarted.alreadyAccount')}
          </Text>
          <Pressable accessibilityRole="link" onPress={() => finish('/app/login')}>
            <Text style={{ color: onboardingColors.text, fontSize: compact ? 12 : 14, fontWeight: '900' }}>
              {t('onboarding.getStarted.signIn')}
            </Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Text style={{ color: onboardingColors.muted, fontSize: compact ? 10 : 12 }}>
            Admin / Operator?
          </Text>
          <Pressable accessibilityRole="link" onPress={() => finish('/auth/sign-in')}>
            <Text style={{ color: onboardingColors.marlonBlue, fontSize: compact ? 10 : 12, fontWeight: '800' }}>
              Sign in here
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function TrustItem({
  Icon,
  label,
  compact,
  star,
}: {
  Icon: typeof ShieldCheck;
  label: string;
  compact: boolean;
  star?: boolean;
}) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
      <Icon color={onboardingColors.marlonBlue} fill={star ? onboardingColors.marlonBlue : 'transparent'} size={compact ? 15 : 17} strokeWidth={2.3} />
      <Text numberOfLines={1} style={{ color: onboardingColors.muted, fontSize: compact ? 8 : 9, fontWeight: '800' }}>
        {label}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={{ width: 1, height: 24, backgroundColor: '#DCE6F0' }} />;
}

function BenefitRow({
  Icon,
  title,
  body,
  compact,
}: {
  Icon: typeof FileText;
  title: string;
  body: string;
  compact: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 9 : 12 }}>
      <View
        style={{
          width: compact ? 40 : 48,
          height: compact ? 40 : 48,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#EAF2FF',
        }}>
        <Icon color={onboardingColors.marlonBlue} size={compact ? 21 : 24} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text selectable style={{ color: onboardingColors.text, fontSize: compact ? 12 : 14, fontWeight: '900' }}>{title}</Text>
        <Text selectable numberOfLines={2} style={{ color: onboardingColors.muted, fontSize: compact ? 9 : 11, lineHeight: compact ? 12 : 15 }}>{body}</Text>
      </View>
    </View>
  );
}

function ContactPill({
  Icon,
  label,
  compact,
  onPress,
}: {
  Icon: typeof Phone;
  label: string;
  compact: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: compact ? 42 : 48,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: '#D5E1EF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        backgroundColor: '#FFFFFF',
      }}>
      <Icon color={onboardingColors.marlonBlue} size={compact ? 17 : 19} strokeWidth={2.3} />
      <Text numberOfLines={1} style={{ color: onboardingColors.text, fontSize: compact ? 10 : 12, fontWeight: '900' }}>{label}</Text>
    </Pressable>
  );
}

function TruckScene({ compact }: { compact: boolean }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', right: 24, top: compact ? 205 : 255, opacity: 0.13 }}>
      <Truck color="#4F8DDD" size={compact ? 104 : 126} strokeWidth={1.3} />
      <View style={{ position: 'absolute', right: -8, bottom: -4, width: compact ? 72 : 88, height: compact ? 24 : 30, borderRadius: 4, backgroundColor: '#8DB5E5' }} />
    </View>
  );
}
