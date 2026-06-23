import { router } from 'expo-router';
import { Plus, Search, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTopBar } from '@/components/operator/app-shell';
import { CustomerRow } from '@/components/operator/CustomerRow';
import { brand } from '@/constants/operator-brand';
import { useCustomers } from '@/hooks/use-customers';

export default function CustomersScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const customersQuery = useCustomers(debouncedSearch);
  const customers = customersQuery.data ?? [];

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <View style={{ flex: 1, backgroundColor: brand.bg }}>
      <AppTopBar />
      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor={brand.blue}
            refreshing={customersQuery.isRefetching}
            onRefresh={() => void customersQuery.refetch()}
          />
        }
        contentContainerStyle={{
          flexGrow: customersQuery.isLoading || customers.length === 0 ? 1 : undefined,
          paddingHorizontal: 18,
          paddingTop: 18,
          paddingBottom: insets.bottom + 108,
          gap: 10,
        }}
        ListHeaderComponent={
          <View style={{ gap: 15, paddingBottom: 5 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text selectable style={{ color: brand.text, fontSize: 28, lineHeight: 33, fontWeight: '900', letterSpacing: -0.7 }}>
                  {t('customers.title')}
                </Text>
                <Text selectable style={{ color: brand.muted, fontSize: 13, fontWeight: '700' }}>
                  {t('customers.count', { count: customers.length })}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={t('customers.new')}
                accessibilityRole="button"
                onPress={() => router.push('/customers/new')}
                style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.blue }}>
                <Plus color="#FFFFFF" size={20} strokeWidth={2.7} />
              </Pressable>
            </View>

            <View
              style={{
                minHeight: 46,
                borderRadius: 14,
                borderCurve: 'continuous',
                borderWidth: 1,
                borderColor: brand.border,
                paddingHorizontal: 13,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 9,
                backgroundColor: brand.surface,
              }}>
              <Search color={brand.muted} size={18} strokeWidth={2.3} />
              <TextInput
                accessibilityLabel={t('customers.searchPlaceholder')}
                autoCapitalize="words"
                autoCorrect={false}
                clearButtonMode="while-editing"
                onChangeText={setSearch}
                placeholder={t('customers.searchPlaceholder')}
                placeholderTextColor="#94A3B8"
                returnKeyType="search"
                style={{ flex: 1, color: brand.text, fontSize: 13, fontWeight: '600' }}
                value={search}
              />
            </View>

            {customersQuery.error ? (
              <View style={{ borderRadius: 14, padding: 13, gap: 8, backgroundColor: brand.redSoft }}>
                <Text selectable style={{ color: brand.red, fontSize: 13, fontWeight: '900' }}>{t('customers.loadError')}</Text>
                <Text selectable style={{ color: brand.red, fontSize: 11, lineHeight: 15 }}>
                  {customersQuery.error instanceof Error ? customersQuery.error.message : String(customersQuery.error)}
                </Text>
                <Pressable accessibilityRole="button" onPress={() => void customersQuery.refetch()}>
                  <Text style={{ color: brand.blue, fontSize: 12, fontWeight: '900' }}>{t('customers.retry')}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          customersQuery.isLoading ? (
            <View style={{ flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 11 }}>
              <ActivityIndicator color={brand.blue} size="large" />
              <Text style={{ color: brand.muted, fontSize: 13, fontWeight: '700' }}>{t('customers.loading')}</Text>
            </View>
          ) : !customersQuery.error ? (
            <View style={{ flex: 1, minHeight: 280, alignItems: 'center', justifyContent: 'center', gap: 9 }}>
              <View style={{ width: 60, height: 60, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.blueSoft }}>
                <Users color={brand.blue} size={28} strokeWidth={2.2} />
              </View>
              <Text selectable style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>{t('customers.emptyTitle')}</Text>
              <Text selectable style={{ color: brand.muted, fontSize: 13 }}>{t('customers.emptyBody')}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/customers/new')}
                style={{ minHeight: 42, borderRadius: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.blue }}>
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>{t('customers.new')}</Text>
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item }) => <CustomerRow customer={item} onPress={() => router.push(`/customers/${item.id}`)} />}
      />
    </View>
  );
}
