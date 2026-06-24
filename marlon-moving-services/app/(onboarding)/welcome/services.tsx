import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import {
  Building2,
  ChevronRight,
  Clock3,
  Hand,
  Home,
  MapPin,
  MapPinned,
  PackageOpen,
  ShieldCheck,
  Siren,
  Trash2,
  Truck,
  UsersRound,
  Warehouse,
  Wrench,
} from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { OnboardingButton, onboardingColors } from '@/components/onboarding/chrome';
import { useOnboardingNav } from '@/hooks/use-onboarding-nav';

type Service = {
  title: string;
  description: string;
  Icon: typeof Home;
};

export default function ServicesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { next } = useOnboardingNav();
  const compact = height < 950;
  const sheetRef = useRef<BottomSheet>(null);
  const [selected, setSelected] = useState<Service | null>(null);
  const snapPoints = useMemo(() => ['55%', '85%'], []);

  const services: Service[] = [
    {
      Icon: Truck,
      title: t('onboarding.services.oneTimeTitle'),
      description: t('onboarding.services.oneTimeDescription'),
    },
    {
      Icon: Home,
      title: t('onboarding.services.residentialFullTitle'),
      description: t('onboarding.services.residentialFullDescription'),
    },
    {
      Icon: Building2,
      title: t('onboarding.services.commercialFullTitle'),
      description: t('onboarding.services.commercialFullDescription'),
    },
    {
      Icon: PackageOpen,
      title: t('onboarding.services.packingFullTitle'),
      description: t('onboarding.services.packingFullDescription'),
    },
    {
      Icon: Hand,
      title: t('onboarding.services.loadingFullTitle'),
      description: t('onboarding.services.loadingFullDescription'),
    },
    {
      Icon: UsersRound,
      title: t('onboarding.services.laborFullTitle'),
      description: t('onboarding.services.laborFullDescription'),
    },
    {
      Icon: Trash2,
      title: t('onboarding.services.junkFullTitle'),
      description: t('onboarding.services.junkFullDescription'),
    },
    {
      Icon: Wrench,
      title: t('onboarding.services.assemblyFullTitle'),
      description: t('onboarding.services.assemblyFullDescription'),
    },
    {
      Icon: Siren,
      title: t('onboarding.services.emergencyFullTitle'),
      description: t('onboarding.services.emergencyFullDescription'),
    },
    {
      Icon: Truck,
      title: t('onboarding.services.boxTruckFullTitle'),
      description: t('onboarding.services.boxTruckFullDescription'),
    },
    {
      Icon: MapPinned,
      title: t('onboarding.services.finalMileFullTitle'),
      description: t('onboarding.services.finalMileFullDescription'),
    },
    {
      Icon: Warehouse,
      title: t('onboarding.services.storageFullTitle'),
      description: t('onboarding.services.storageFullDescription'),
    },
  ];

  const openService = async (service: Service) => {
    if (process.env.EXPO_OS === 'ios') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(service);
    sheetRef.current?.snapToIndex(0);
  };

  return (
    <>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + (compact ? 54 : 74),
          paddingBottom: insets.bottom + 54,
          paddingHorizontal: 22,
          justifyContent: 'space-between',
          gap: compact ? 8 : 14,
        }}>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: insets.top + 68,
            left: -width * 0.12,
            width: width * 1.25,
            height: compact ? 610 : 690,
            borderRadius: 999,
            backgroundColor: 'rgba(234,242,255,0.66)',
          }}
        />

        <View style={{ gap: compact ? 4 : 7 }}>
          <Text
            selectable
            style={{
              maxWidth: 390,
              color: onboardingColors.text,
              fontSize: compact ? 33 : 41,
              lineHeight: compact ? 36 : 44,
              letterSpacing: -1.4,
              fontWeight: '900',
            }}>
            {t('onboarding.services.headline')}
          </Text>
          <Text selectable style={{ color: onboardingColors.muted, fontSize: compact ? 13 : 16, lineHeight: 21 }}>
            {t('onboarding.services.sub')}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            borderRadius: 22,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: '#D5E1EF',
            padding: compact ? 10 : 14,
            gap: compact ? 8 : 11,
            backgroundColor: 'rgba(255,255,255,0.92)',
            boxShadow: '0 16px 34px rgba(15,45,85,0.09)',
          }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TrustChip Icon={ShieldCheck} label={t('onboarding.services.licensed')} compact={compact} />
            <TrustChip Icon={Clock3} label={t('onboarding.services.sameDay')} compact={compact} />
            <TrustChip Icon={MapPin} label={t('onboarding.services.serving')} compact={compact} />
          </View>

          <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'space-between', gap: compact ? 7 : 9 }}>
            {services.map((service) => (
              <Animated.View key={service.title} style={{ width: compact ? '48.8%' : '48.6%', height: compact ? '15.45%' : '15.3%', opacity: 1 }}>
                <ServiceTile service={service} compact={compact} onPress={() => openService(service)} />
              </Animated.View>
            ))}
          </View>
        </View>
        <OnboardingButton label={t('onboarding.common.next')} onPress={next} />
      </View>

      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: onboardingColors.lightSurface }}
        handleIndicatorStyle={{ backgroundColor: 'rgba(100,116,139,0.35)', width: 44 }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} pressBehavior="close" />
        )}>
        <BottomSheetView style={{ flex: 1, paddingHorizontal: 22, paddingBottom: insets.bottom + 24 }}>
          {selected ? <ServiceSheet service={selected} /> : null}
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}

function ServiceTile({ service, compact, onPress }: { service: Service; compact: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const Icon = service.Icon;

  return (
    <Animated.View style={[{ flex: 1 }, style]}>
      <Pressable
        accessibilityLabel={service.title}
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.98, { duration: 110 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 150 });
        }}
        style={{
          flex: 1,
          borderRadius: 14,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: onboardingColors.lightBorder,
          backgroundColor: onboardingColors.lightSurface,
          paddingHorizontal: compact ? 8 : 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: compact ? 7 : 9,
          overflow: 'hidden',
          boxShadow: '0 16px 34px rgba(0,0,0,0.18)',
        }}>
        <View
          style={{
            width: compact ? 36 : 42,
            height: compact ? 36 : 42,
            borderRadius: 13,
            borderCurve: 'continuous',
            backgroundColor: 'rgba(59,130,246,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon color={onboardingColors.marlonBlue} size={compact ? 20 : 23} strokeWidth={2.35} />
        </View>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Text selectable numberOfLines={2} style={{ flex: 1, color: onboardingColors.text, fontSize: compact ? 10 : 12, lineHeight: compact ? 13 : 15, fontWeight: '900', letterSpacing: -0.15 }}>
            {service.title}
          </Text>
          <ChevronRight color={onboardingColors.muted} size={compact ? 14 : 16} strokeWidth={2.4} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ServiceSheet({ service }: { service: Service }) {
  const Icon = service.Icon;

  return (
    <View style={{ flex: 1, gap: 18, paddingTop: 14 }}>
      <View style={{ position: 'absolute', top: -60, left: -24, right: -24, height: 120, backgroundColor: 'rgba(59,130,246,0.10)' }} />
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 26,
          borderCurve: 'continuous',
          backgroundColor: 'rgba(59,130,246,0.14)',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: onboardingColors.lightBorder,
        }}>
        <Icon color={onboardingColors.marlonBlue} size={36} strokeWidth={2.2} />
      </View>
      <View style={{ gap: 10 }}>
        <Text selectable style={{ color: onboardingColors.text, fontSize: 30, lineHeight: 34, fontWeight: '900', letterSpacing: -0.7 }}>
          {service.title}
        </Text>
        <Text selectable style={{ color: onboardingColors.muted, fontSize: 15, lineHeight: 22 }}>
          {service.description}
        </Text>
        <Text selectable style={{ color: onboardingColors.muted, fontSize: 15, lineHeight: 22 }}>
          Available across Sterling, Ashburn, Loudoun County, Northern Virginia, Maryland, DC, and the greater DMV.
        </Text>
      </View>
    </View>
  );
}

function TrustChip({ Icon, label, compact }: { Icon: typeof ShieldCheck; label: string; compact: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: compact ? 34 : 40,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DCE6F0',
        paddingHorizontal: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: '#FFFFFF',
      }}>
      <Icon color={onboardingColors.marlonBlue} size={compact ? 13 : 15} strokeWidth={2.4} />
      <Text numberOfLines={1} style={{ color: onboardingColors.text, fontSize: compact ? 7 : 8, fontWeight: '800' }}>{label}</Text>
    </View>
  );
}
