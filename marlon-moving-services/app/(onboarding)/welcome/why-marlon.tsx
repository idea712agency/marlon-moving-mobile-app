import { Clock, Heart, ShieldCheck } from 'lucide-react-native';
import { FlatList, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  type SharedValue,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { OnboardingButton, onboardingColors } from '@/components/onboarding/chrome';
import { useOnboardingNav } from '@/hooks/use-onboarding-nav';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<ProofCard>);

type ProofCard = {
  title: string;
  body: string;
  Icon: typeof ShieldCheck;
};

export default function WhyMarlonScreen() {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { next, back } = useOnboardingNav();
  const scrollX = useSharedValue(0);
  const compact = height < 900;
  const itemWidth = Math.min(width * 0.68, 310);
  const gap = 12;
  const sidePadding = (width - itemWidth) / 2;

  const cards: ProofCard[] = [
    { Icon: Clock, title: t('onboarding.whyMarlon.timeTitle'), body: t('onboarding.whyMarlon.timeBody') },
    { Icon: ShieldCheck, title: t('onboarding.whyMarlon.licensedTitle'), body: t('onboarding.whyMarlon.licensedBody') },
    { Icon: Heart, title: t('onboarding.whyMarlon.familyTitle'), body: t('onboarding.whyMarlon.familyBody') },
  ];

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top + (compact ? 62 : 94),
        paddingBottom: insets.bottom + 54,
        justifyContent: 'space-between',
        gap: compact ? 12 : 24,
      }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: insets.top + 95,
          left: -width * 0.14,
          width: width * 1.25,
          height: compact ? 500 : 570,
          borderRadius: 999,
          backgroundColor: 'rgba(234,242,255,0.66)',
        }}
      />

      <View style={{ paddingHorizontal: 22 }}>
        <Text
          selectable
          style={{
            maxWidth: 390,
            color: onboardingColors.text,
            fontSize: compact ? 35 : 43,
            lineHeight: compact ? 38 : 46,
            letterSpacing: -1.4,
            fontWeight: '900',
          }}>
          {t('onboarding.whyMarlon.headline')}
        </Text>
      </View>

      <AnimatedFlatList
        data={cards}
        keyExtractor={(item) => item.title}
        horizontal
        initialScrollIndex={1}
        getItemLayout={(_, index) => ({
          length: itemWidth + gap,
          offset: (itemWidth + gap) * index,
          index,
        })}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={itemWidth + gap}
        snapToAlignment="start"
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentContainerStyle={{ paddingHorizontal: sidePadding, gap }}
        renderItem={({ item }) => {
          const Icon = item.Icon;
          return (
            <Animated.View style={{ width: itemWidth, opacity: 1 }}>
              <View
                style={{
                  height: compact ? 292 : 370,
                  borderRadius: 24,
                  borderCurve: 'continuous',
                  borderWidth: 1,
                  borderColor: '#D5E1EF',
                  padding: compact ? 20 : 24,
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(255,255,255,0.94)',
                  boxShadow: '0 18px 38px rgba(15,45,85,0.09)',
                }}>
                  <View
                    style={{
                      width: compact ? 60 : 76,
                      height: compact ? 60 : 76,
                      borderRadius: 25,
                      borderCurve: 'continuous',
                      backgroundColor: '#EAF2FF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Icon color={onboardingColors.marlonBlue} size={compact ? 29 : 38} strokeWidth={2.2} />
                  </View>
                  <View style={{ gap: 13, paddingBottom: compact ? 8 : 16 }}>
                    <Text selectable style={{ color: onboardingColors.text, fontSize: compact ? 18 : 22, lineHeight: compact ? 23 : 27, fontWeight: '900', letterSpacing: -0.45 }}>
                      {item.title}
                    </Text>
                    <Text selectable style={{ color: onboardingColors.muted, fontSize: compact ? 13 : 15, lineHeight: compact ? 19 : 23 }}>
                      {item.body}
                    </Text>
                  </View>
              </View>
            </Animated.View>
          );
        }}
      />

      <View style={{ alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 7 }}>
          {cards.map((item, index) => (
            <CarouselDot key={item.title} index={index} scrollX={scrollX} itemWidth={itemWidth + gap} />
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: 22, gap: 12 }}>
        <OnboardingButton label={t('onboarding.common.continue')} onPress={next} />
        <Pressable accessibilityLabel={t('onboarding.common.back')} accessibilityRole="button" onPress={back} style={{ alignItems: 'center', paddingVertical: 9 }}>
          <Text style={{ color: onboardingColors.marlonDarkBlue, fontSize: 16, fontWeight: '900' }}>{t('onboarding.common.back')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CarouselDot({ index, scrollX, itemWidth }: { index: number; scrollX: SharedValue<number>; itemWidth: number }) {
  const style = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * itemWidth, index * itemWidth, (index + 1) * itemWidth];
    return {
      width: interpolate(scrollX.value, inputRange, [7, 22, 7], 'clamp'),
      opacity: interpolate(scrollX.value, inputRange, [0.38, 1, 0.38], 'clamp'),
    };
  });

  return <Animated.View style={[{ height: 7, borderRadius: 999, backgroundColor: onboardingColors.marlonBlue }, style]} />;
}
