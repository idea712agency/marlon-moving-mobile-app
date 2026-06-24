import { Calculator, CalendarCheck, Truck } from 'lucide-react-native';
import { Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { OnboardingButton, onboardingColors } from '@/components/onboarding/chrome';
import { useOnboardingNav } from '@/hooks/use-onboarding-nav';

type TimelineStep = {
  number: string;
  title: string;
  body: string;
  Icon: typeof Calculator;
};

export default function HowItWorksScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { next } = useOnboardingNav();
  const compact = height < 900;

  const steps: TimelineStep[] = [
    { number: '01', Icon: Calculator, title: t('onboarding.howItWorks.quoteTitle'), body: t('onboarding.howItWorks.quoteBody') },
    { number: '02', Icon: CalendarCheck, title: t('onboarding.howItWorks.dateTitle'), body: t('onboarding.howItWorks.dateBody') },
    { number: '03', Icon: Truck, title: t('onboarding.howItWorks.moveTitle'), body: t('onboarding.howItWorks.moveBody') },
  ];

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top + (compact ? 62 : 90),
        paddingBottom: insets.bottom + 54,
        paddingHorizontal: 22,
        justifyContent: 'space-between',
        gap: compact ? 10 : 20,
      }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: insets.top + 70,
          left: -width * 0.14,
          width: width * 1.25,
          height: compact ? 570 : 650,
          borderRadius: 999,
          backgroundColor: 'rgba(234,242,255,0.68)',
        }}
      />

      <Text
        selectable
        style={{
          maxWidth: 390,
          color: onboardingColors.text,
          fontSize: compact ? 36 : 44,
          lineHeight: compact ? 39 : 47,
          letterSpacing: -1.4,
          fontWeight: '900',
        }}>
        {t('onboarding.howItWorks.headline')}
      </Text>

      <View style={{ flex: 1, position: 'relative', justifyContent: 'space-evenly', paddingVertical: compact ? 2 : 8 }}>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: compact ? 48 : 58,
            bottom: compact ? 48 : 58,
            left: compact ? 24 : 28,
            width: 3,
            borderRadius: 999,
            backgroundColor: onboardingColors.marlonBlue,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: '42%',
            bottom: compact ? 48 : 58,
            left: compact ? 24 : 28,
            width: 3,
            borderRadius: 999,
            backgroundColor: onboardingColors.marlonRed,
          }}
        />

        {steps.map((step) => (
          <TimelineItem key={step.number} step={step} compact={compact} />
        ))}
      </View>

      <OnboardingButton label={t('onboarding.common.next')} onPress={next} />
    </View>
  );
}

function TimelineItem({ step, compact }: { step: TimelineStep; compact: boolean }) {
  const Icon = step.Icon;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 12 : 16 }}>
      <View
        style={{
          width: compact ? 50 : 58,
          height: compact ? 50 : 58,
          borderRadius: 999,
          zIndex: 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: '#D7E2EE',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 8px 18px rgba(15,45,85,0.08)',
        }}>
        <Text style={{ color: onboardingColors.text, fontSize: compact ? 14 : 16, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
          {step.number}
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          minHeight: compact ? 104 : 126,
          borderRadius: 20,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: '#D5E1EF',
          padding: compact ? 13 : 18,
          flexDirection: 'row',
          alignItems: 'center',
          gap: compact ? 11 : 15,
          backgroundColor: 'rgba(255,255,255,0.95)',
          boxShadow: '0 12px 28px rgba(15,45,85,0.08)',
        }}>
        <View
          style={{
            width: compact ? 48 : 58,
            height: compact ? 48 : 58,
            borderRadius: 18,
            borderCurve: 'continuous',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#EAF2FF',
          }}>
          <Icon color={onboardingColors.marlonBlue} size={compact ? 25 : 30} strokeWidth={2.3} />
        </View>
        <View style={{ flex: 1, gap: compact ? 4 : 7 }}>
          <Text selectable style={{ color: onboardingColors.text, fontSize: compact ? 17 : 20, lineHeight: compact ? 21 : 25, fontWeight: '900', letterSpacing: -0.3 }}>
            {step.title}
          </Text>
          <Text selectable style={{ color: onboardingColors.muted, fontSize: compact ? 12 : 14, lineHeight: compact ? 17 : 20 }}>
            {step.body}
          </Text>
        </View>
      </View>
    </View>
  );
}
