import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { brand } from '@/constants/operator-brand';

const logo = require('../../../assets/images/marlon-logo.png');

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function LegalScreen({
  title,
  subtitle,
  sections,
}: {
  title: string;
  subtitle: string;
  sections: LegalSection[];
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: brand.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: brand.border }}>
        <View style={{ minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color={brand.navy} size={22} strokeWidth={2.6} />
          </Pressable>
          <Image source={logo} contentFit="contain" style={{ width: 76, height: 50 }} />
          <View style={{ width: 42 }} />
        </View>
      </View>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ width: '100%', maxWidth: 620, alignSelf: 'center', padding: 18, paddingBottom: insets.bottom + 32, gap: 14 }}>
        <View style={{ gap: 6, paddingBottom: 4 }}>
          <Text selectable style={{ color: brand.text, fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -0.7 }}>{title}</Text>
          <Text selectable style={{ color: brand.muted, fontSize: 14, lineHeight: 21 }}>{subtitle}</Text>
        </View>
        {sections.map((section, index) => (
          <View key={`${section.title}-${index}`} style={styles.card}>
            <Text selectable style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs?.map((paragraph, paragraphIndex) => (
              <Text selectable key={`${section.title}-p-${paragraphIndex}`} style={styles.body}>{paragraph}</Text>
            ))}
            {section.bullets?.map((bullet, bulletIndex) => (
              <View key={`${section.title}-b-${bulletIndex}`} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9 }}>
                <Text selectable style={styles.bullet}>•</Text>
                <Text selectable style={[styles.body, { flex: 1 }]}>{bullet}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = {
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: brand.blueSoft, alignItems: 'center' as const, justifyContent: 'center' as const },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, borderCurve: 'continuous' as const, borderWidth: 1, borderColor: brand.border, padding: 17, gap: 10, boxShadow: '0 1px 2px rgba(15,23,42,0.04)' },
  sectionTitle: { color: brand.navy, fontSize: 18, lineHeight: 23, fontWeight: '900' as const },
  body: { color: brand.muted, fontSize: 14, lineHeight: 21 },
  bullet: { color: brand.blue, fontSize: 18, lineHeight: 21, fontWeight: '900' as const },
};
