import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams, type Href } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Armchair,
  Bed,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Lamp,
  Package,
  Plus,
  Refrigerator,
  Send,
  Shirt,
  Sofa,
  Table,
  Trash2,
  Tv,
} from 'lucide-react-native';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { brand } from '@/constants/operator-brand';
import { CustomerFooter } from '@/components/customer/customer-shell';
import {
  ARRIVAL_WINDOWS,
  customerEstimateDefaults,
  EstimateSchema,
  PROPERTY_TAG_OPTIONS,
  SERVICE_OPTIONS,
  type CustomerEstimatePayload,
} from '@/lib/estimate-schema';
import { createEstimatePhotoUrls, customerEstimateFromLead, getCustomerQuoteRequest } from '@/lib/customer-quote-requests';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

const STEP_LABELS = ['Type', 'Location', 'Details', 'Inventory', 'Date', 'Contact', 'Review'];
const QUICK_ITEMS = [
  { label: 'Sofa', Icon: Sofa },
  { label: 'Bed', Icon: Bed },
  { label: 'Boxes', Icon: Package },
  { label: 'Refrigerator', Icon: Refrigerator },
  { label: 'Table', Icon: Table },
  { label: 'TV', Icon: Tv },
  { label: 'Lamp', Icon: Lamp },
  { label: 'Clothes', Icon: Shirt },
  { label: 'Books', Icon: BookOpen },
  { label: 'Armchair', Icon: Armchair },
] as const;

type UploadedPhoto = { path: string; uri: string; name: string };

export default function CustomerEstimateScreen() {
  const { request } = useLocalSearchParams<{ request?: string }>();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CustomerEstimatePayload>(() => customerEstimateDefaults());
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [leadId, setLeadId] = useState('');
  const [savedRequestId, setSavedRequestId] = useState('');
  const [loadingDraft, setLoadingDraft] = useState(Boolean(request));
  const sessionId = useRef(makeSessionId()).current;

  useEffect(() => {
    let active = true;
    if (!request || !session?.user.id) {
      setLoadingDraft(false);
      return;
    }
    getCustomerQuoteRequest(request)
      .then(async (lead) => {
        const payload = customerEstimateFromLead(lead);
        if (!active) return;
        setForm(payload);
        const signedPhotos = await createEstimatePhotoUrls(payload.photoPaths);
        if (active) setPhotos(signedPhotos.map((photo) => ({ path: photo.path, uri: photo.url, name: photo.path.split('/').pop() || 'Photo' })));
      })
      .catch((error) => {
        if (active) Alert.alert('Could not load request', messageOf(error));
      })
      .finally(() => {
        if (active) setLoadingDraft(false);
      });
    return () => {
      active = false;
    };
  }, [request, session?.user.id]);

  const update = <K extends keyof CustomerEstimatePayload>(key: K, value: CustomerEstimatePayload[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const next = () => {
    const issue = validateStep(step, form);
    if (issue) return Alert.alert('Review this step', issue);
    setStep((current) => Math.min(STEP_LABELS.length - 1, current + 1));
  };

  const uploadPhotos = async () => {
    if (form.photoPaths.length >= 5) return Alert.alert('Maximum 5 photos.');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission required', 'Allow photo access to attach images.');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - form.photoPaths.length,
      quality: 0.9,
    });
    if (result.canceled) return;

    const uploaded: UploadedPhoto[] = [];
    for (const asset of result.assets.slice(0, 5 - form.photoPaths.length)) {
      const name = asset.fileName || `photo-${Date.now()}.jpg`;
      if ((asset.fileSize ?? 0) > 5 * 1024 * 1024) {
        Alert.alert(`"${name}" is larger than 5MB.`);
        continue;
      }
      try {
        const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `pending/${sessionId}/${Date.now()}-${safeName}`;
        const response = await fetch(asset.uri);
        if (!response.ok) throw new Error('The photo could not be read.');
        const body = await response.arrayBuffer();
        if (body.byteLength > 5 * 1024 * 1024) {
          Alert.alert(`"${name}" is larger than 5MB.`);
          continue;
        }
        const { error } = await supabase.storage
          .from('estimate-photos')
          .upload(path, body, { contentType: asset.mimeType || 'image/jpeg', upsert: false });
        if (error) throw error;
        uploaded.push({ path, uri: asset.uri, name });
      } catch (error) {
        Alert.alert('Photo not uploaded', messageOf(error));
      }
    }
    const nextPhotos = [...photos, ...uploaded].slice(0, 5);
    setPhotos(nextPhotos);
    update('photoPaths', [...new Set([...form.photoPaths, ...uploaded.map((photo) => photo.path)])].slice(0, 5));
  };

  const removePhoto = async (photo: UploadedPhoto) => {
    const { error } = await supabase.storage.from('estimate-photos').remove([photo.path]);
    if (error) return Alert.alert('Could not remove photo', error.message);
    const nextPhotos = photos.filter((item) => item.path !== photo.path);
    setPhotos(nextPhotos);
    update('photoPaths', form.photoPaths.filter((path) => path !== photo.path));
  };

  const submit = async () => {
    const parsed = EstimateSchema.safeParse(form);
    if (!parsed.success) return Alert.alert('Review your request', parsed.error.issues[0]?.message || 'Complete the required fields.');
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-estimate', {
        body: { ...parsed.data, entryPoint: 'customer_app', ...(request ? { revisionOf: request } : {}) },
      });
      if (error) throw error;
      const id = data?.leadId || data?.lead_id;
      if (!id) throw new Error('The request was received without a confirmation number.');
      if (session?.user.id) setSavedRequestId(id);
      await queryClient.invalidateQueries({ queryKey: ['customer-quote-requests'] });
      setLeadId(id);
    } catch (error) {
      Alert.alert('Could not submit', messageOf(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDraft) {
    return <View style={{ flex: 1, backgroundColor: brand.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: brand.muted, fontWeight: '800' }}>Loading your request…</Text></View>;
  }

  if (leadId) return <SuccessScreen leadId={leadId} requestId={savedRequestId} revised={Boolean(request)} />;

  return (
    <View style={{ flex: 1, backgroundColor: brand.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ width: '100%', maxWidth: 448, alignSelf: 'center', padding: 18, paddingTop: insets.top + 12, paddingBottom: 150, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable accessibilityLabel="Back" onPress={() => (step ? setStep(step - 1) : router.back())} style={styles.circleButton}>
            <ChevronLeft color={brand.navy} size={21} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>{request ? 'Edit estimate request' : 'Request an estimate'}</Text>
            <Text style={{ color: brand.muted, fontSize: 11 }}>{request ? 'Submit your changes as a revision' : 'No account required'}</Text>
          </View>
          <View style={{ width: 42 }} />
        </View>

        <View style={{ flexDirection: 'row', gap: 5 }}>
          {STEP_LABELS.map((label, index) => (
            <View key={label} style={{ flex: 1, gap: 5 }}>
              <View style={{ height: 5, borderRadius: 99, backgroundColor: index <= step ? (index === step ? brand.red : brand.blue) : brand.border }} />
              <Text numberOfLines={1} style={{ color: index === step ? brand.text : brand.muted, fontSize: 8, fontWeight: '800', textAlign: 'center' }}>{label}</Text>
            </View>
          ))}
        </View>

        <LinearGradient colors={[brand.navy, brand.blue]} style={{ borderRadius: 20, padding: 17, gap: 4 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900' }}>{STEP_LABELS[step]}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.76)', fontSize: 13 }}>{stepSubtitle(step)}</Text>
        </LinearGradient>

        <View style={styles.card}>
          {step === 0 ? <TypeStep form={form} update={update} /> : null}
          {step === 1 ? <LocationStep form={form} update={update} /> : null}
          {step === 2 ? <DetailsStep form={form} update={update} /> : null}
          {step === 3 ? <InventoryStep form={form} update={update} photos={photos} uploadPhotos={uploadPhotos} removePhoto={removePhoto} /> : null}
          {step === 4 ? <DateStep form={form} update={update} /> : null}
          {step === 5 ? <ContactStep form={form} update={update} /> : null}
          {step === 6 ? <ReviewStep form={form} photos={photos} /> : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {step > 0 ? <NavButton secondary label="Back" onPress={() => setStep(step - 1)} /> : null}
          <NavButton
            label={step === 6 ? (submitting ? 'Submitting…' : 'Submit request') : 'Continue'}
            disabled={submitting}
            icon={step === 6 ? <Send color="#FFFFFF" size={17} /> : <ChevronRight color="#FFFFFF" size={17} />}
            onPress={() => (step === 6 ? void submit() : next())}
          />
        </View>
      </ScrollView>
      <CustomerFooter bottom={insets.bottom} />
    </View>
  );
}

function TypeStep({ form, update }: StepProps) {
  return <>
    <SectionLabel>Move type</SectionLabel>
    <View style={{ flexDirection: 'row', gap: 9 }}>
      {([['residential', 'Residential Moving'], ['office', 'Commercial Moving']] as const).map(([value, label]) => <Choice key={value} label={label} selected={form.moveType === value} onPress={() => update('moveType', value)} />)}
    </View>
    <SectionLabel>Servicios</SectionLabel>
    <ChoiceGrid values={SERVICE_OPTIONS} selected={form.services} onToggle={(value) => update('services', toggleValue(form.services, value, 20))} />
  </>;
}

function LocationStep({ form, update }: StepProps) {
  return <>
    <Field label="Pickup address *" value={form.pickup} onChangeText={(pickup) => update('pickup', pickup)} />
    <Field label="Delivery address *" value={form.delivery} onChangeText={(delivery) => update('delivery', delivery)} />
  </>;
}

function DetailsStep({ form, update }: StepProps) {
  return <>
    <SectionLabel>Property details</SectionLabel>
    <ChoiceGrid values={PROPERTY_TAG_OPTIONS} selected={form.propertyTags} onToggle={(value) => update('propertyTags', toggleValue(form.propertyTags, value, 20))} />
    <Field label="Notes" value={form.notes} onChangeText={(notes) => update('notes', notes.slice(0, 2000))} multiline />
    <Text style={styles.help}>{form.notes.length}/2000</Text>
  </>;
}

function InventoryStep({ form, update, photos, uploadPhotos, removePhoto }: StepProps & { photos: UploadedPhoto[]; uploadPhotos: () => void; removePhoto: (photo: UploadedPhoto) => void }) {
  const [customItem, setCustomItem] = useState('');
  const add = (label: string) => {
    const existing = form.inventory.find((item) => item.label.toLowerCase() === label.toLowerCase());
    const inventory = existing
      ? form.inventory.map((item) => item === existing ? { ...item, qty: (item.qty || 1) + 1 } : item)
      : [...form.inventory, { label, qty: 1 }].slice(0, 50);
    update('inventory', inventory);
  };
  return <>
    <SectionLabel>Quick add</SectionLabel>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {QUICK_ITEMS.map(({ label, Icon }) => <Pressable key={label} onPress={() => add(label)} style={styles.quickItem}><Icon color={brand.blue} size={17} /><Text style={styles.quickText}>{label}</Text></Pressable>)}
    </View>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <TextInput value={customItem} onChangeText={setCustomItem} placeholder="Other item" placeholderTextColor="#94A3B8" style={[styles.input, { flex: 1 }]} />
      <Pressable onPress={() => { if (customItem.trim()) add(customItem.trim()); setCustomItem(''); }} style={styles.addButton}><Plus color="#FFFFFF" size={18} /></Pressable>
    </View>
    {form.inventory.map((item, index) => <View key={`${item.label}-${index}`} style={styles.inventoryRow}><Text style={{ flex: 1, color: brand.text, fontWeight: '800' }}>{item.label}</Text><TextInput value={String(item.qty || 1)} keyboardType="number-pad" onChangeText={(text) => update('inventory', form.inventory.map((row, rowIndex) => rowIndex === index ? { ...row, qty: Math.max(1, Number(text) || 1) } : row))} style={styles.qtyInput} /><Pressable onPress={() => update('inventory', form.inventory.filter((_, rowIndex) => rowIndex !== index))}><Trash2 color={brand.red} size={17} /></Pressable></View>)}
    <SectionLabel>Photos ({form.photoPaths.length}/5)</SectionLabel>
    <Pressable onPress={() => void uploadPhotos()} style={styles.uploadButton}><Plus color={brand.blue} size={18} /><Text style={{ color: brand.blue, fontWeight: '900' }}>Add photos</Text></Pressable>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {photos.map((photo) => <View key={photo.path}><Image source={photo.uri} style={{ width: 86, height: 86, borderRadius: 12 }} contentFit="cover" /><Pressable onPress={() => void removePhoto(photo)} style={styles.photoRemove}><Trash2 color="#FFFFFF" size={13} /></Pressable></View>)}
    </View>
  </>;
}

function DateStep({ form, update }: StepProps) {
  return <>
    <Field label="Move date *" value={form.moveDate} onChangeText={(moveDate) => update('moveDate', moveDate)} placeholder="YYYY-MM-DD" />
    <SectionLabel>Arrival window</SectionLabel>
    <ChoiceGrid values={ARRIVAL_WINDOWS} selected={[form.arrivalWindow]} onToggle={(arrivalWindow) => update('arrivalWindow', arrivalWindow as CustomerEstimatePayload['arrivalWindow'])} />
  </>;
}

function ContactStep({ form, update }: StepProps) {
  const setContact = (key: keyof CustomerEstimatePayload['contact'], value: string) => update('contact', { ...form.contact, [key]: value });
  return <>
    <Field label="Full name *" value={form.contact.name} onChangeText={(value) => setContact('name', value)} />
    <Field label="Phone *" value={form.contact.phone} keyboardType="phone-pad" onChangeText={(value) => setContact('phone', value)} />
    <Field label="Email" value={form.contact.email} keyboardType="email-address" autoCapitalize="none" onChangeText={(value) => setContact('email', value)} />
    <SectionLabel>Preferred contact method</SectionLabel>
    <View style={{ flexDirection: 'row', gap: 8 }}>{(['phone', 'email', 'text'] as const).map((method) => <Choice key={method} label={{ phone: 'Call', email: 'Email', text: 'Text' }[method]} selected={form.contact.preferredMethod === method} onPress={() => setContact('preferredMethod', method)} />)}</View>
  </>;
}

function ReviewStep({ form }: { form: CustomerEstimatePayload; photos: UploadedPhoto[] }) {
  return <View style={{ gap: 12 }}>
    <Review label="Type" value={form.moveType === 'office' ? 'Commercial Moving' : 'Residential Moving'} />
    <Review label="Pickup" value={form.pickup} />
    <Review label="Delivery" value={form.delivery} />
    <Review label="Date" value={`${form.moveDate} · ${form.arrivalWindow}`} />
    <Review label="Inventory" value={`${form.inventory.length} item types`} />
    <Review label="Services" value={form.services.join(', ')} />
    <Review label="Photos" value={`${form.photoPaths.length} attached`} />
    <Review label="Contact" value={`${form.contact.name} · ${form.contact.phone}`} />
  </View>;
}

function SuccessScreen({ leadId, requestId, revised }: { leadId: string; requestId: string; revised: boolean }) {
  const { session, isAdmin } = useAuth();
  const destination = (session ? (isAdmin ? '/home' : requestId ? `/app/quote/${requestId}` : '/app/quote') : '/welcome/get-started') as Href;
  const buttonLabel = session ? (requestId ? 'Review request' : 'Return to portal') : 'Done';

  return <View style={{ flex: 1, backgroundColor: brand.bg, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 }}><View style={{ width: 76, height: 76, borderRadius: 26, backgroundColor: brand.greenSoft, alignItems: 'center', justifyContent: 'center' }}><Send color={brand.green} size={34} /></View><Text style={{ color: brand.text, fontSize: 27, fontWeight: '900', textAlign: 'center' }}>{revised ? 'Revision received!' : 'Request received!'}</Text><Text style={{ color: brand.muted, lineHeight: 21, textAlign: 'center' }}>We’ll review the details and contact you soon.</Text><Text selectable style={{ color: brand.blue, fontWeight: '900' }}>Confirmation: {leadId.slice(0, 8).toUpperCase()}</Text><Pressable onPress={() => router.replace(destination)} style={[styles.primaryButton, { alignSelf: 'stretch' }]}><Text style={styles.primaryText}>{buttonLabel}</Text></Pressable></View>;
}

type StepProps = { form: CustomerEstimatePayload; update: <K extends keyof CustomerEstimatePayload>(key: K, value: CustomerEstimatePayload[K]) => void };
function ChoiceGrid({ values, selected, onToggle }: { values: readonly string[]; selected: string[]; onToggle: (value: string) => void }) { return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{values.map((value) => <Choice key={value} label={value} selected={selected.includes(value)} onPress={() => onToggle(value)} />)}</View>; }
function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.choice, selected ? { backgroundColor: brand.blue, borderColor: brand.blue } : null]}><Text style={{ color: selected ? '#FFFFFF' : brand.text, fontSize: 10, fontWeight: '900' }}>{label}</Text></Pressable>; }
function Field({ label, multiline, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) { return <View style={{ gap: 6 }}><Text style={styles.label}>{label}</Text><TextInput {...props} multiline={multiline} placeholderTextColor="#94A3B8" style={[styles.input, multiline ? { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' } : null]} /></View>; }
function SectionLabel({ children }: { children: ReactNode }) { return <Text style={styles.label}>{children}</Text>; }
function NavButton({ label, secondary, icon, disabled, onPress }: { label: string; secondary?: boolean; icon?: React.ReactNode; disabled?: boolean; onPress: () => void }) { return <Pressable disabled={disabled} onPress={onPress} style={[secondary ? styles.secondaryButton : styles.primaryButton, { flex: 1, opacity: disabled ? 0.6 : 1 }]}><Text style={secondary ? styles.secondaryText : styles.primaryText}>{label}</Text>{icon}</Pressable>; }
function Review({ label, value }: { label: string; value: string }) { return <View style={{ gap: 3 }}><Text style={{ color: brand.muted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>{label}</Text><Text selectable style={{ color: brand.text, lineHeight: 19 }}>{value || '—'}</Text></View>; }
const toggleValue = (values: string[], value: string, max: number) => values.includes(value) ? values.filter((item) => item !== value) : [...values, value].slice(0, max);
const validateStep = (step: number, form: CustomerEstimatePayload) => {
  if (step === 1 && (form.pickup.trim().length < 3 || form.delivery.trim().length < 3)) return 'Enter valid pickup and delivery addresses.';
  if (step === 4 && !/^\d{4}-\d{2}-\d{2}$/.test(form.moveDate)) return 'Use a valid date in YYYY-MM-DD format.';
  if (step === 5 && (form.contact.name.trim().length < 2 || form.contact.phone.trim().length < 7)) return 'Enter your name and a valid phone number.';
  return '';
};
const stepSubtitle = (step: number) => ['Choose the move type and services.', 'Where are we picking up and delivering?', 'Tell us about the property.', 'Add items and photos.', 'Select a date and arrival window.', 'How should we contact you?', 'Confirm everything before submitting.'][step];
const makeSessionId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const messageOf = (error: unknown) => error instanceof Error ? error.message : 'Please try again.';
const styles = {
  card: { borderRadius: 20, borderWidth: 1, borderColor: brand.border, backgroundColor: '#FFFFFF', padding: 16, gap: 14 },
  circleButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: brand.blueSoft, alignItems: 'center' as const, justifyContent: 'center' as const },
  label: { color: brand.text, fontSize: 12, fontWeight: '900' as const },
  help: { color: brand.muted, fontSize: 10, textAlign: 'right' as const },
  input: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: brand.border, backgroundColor: '#FBFCFE', paddingHorizontal: 12, color: brand.text, fontSize: 13 },
  choice: { minHeight: 38, borderRadius: 999, borderWidth: 1, borderColor: brand.border, backgroundColor: '#FBFCFE', paddingHorizontal: 12, alignItems: 'center' as const, justifyContent: 'center' as const },
  quickItem: { width: '31%' as const, minHeight: 70, borderRadius: 14, backgroundColor: brand.blueSoft, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 5, padding: 6 },
  quickText: { color: brand.text, fontSize: 9, fontWeight: '900' as const, textAlign: 'center' as const },
  addButton: { width: 46, borderRadius: 12, backgroundColor: brand.blue, alignItems: 'center' as const, justifyContent: 'center' as const },
  inventoryRow: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: brand.border, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 9, paddingHorizontal: 11 },
  qtyInput: { width: 48, height: 34, borderRadius: 9, backgroundColor: brand.blueSoft, textAlign: 'center' as const, color: brand.text, fontWeight: '900' as const },
  uploadButton: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' as const, borderColor: brand.blue, flexDirection: 'row' as const, gap: 7, alignItems: 'center' as const, justifyContent: 'center' as const },
  photoRemove: { position: 'absolute' as const, right: 4, top: 4, width: 25, height: 25, borderRadius: 13, backgroundColor: brand.red, alignItems: 'center' as const, justifyContent: 'center' as const },
  primaryButton: { minHeight: 52, borderRadius: 14, backgroundColor: brand.red, flexDirection: 'row' as const, gap: 7, alignItems: 'center' as const, justifyContent: 'center' as const },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' as const },
  secondaryButton: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: brand.border, backgroundColor: '#FFFFFF', alignItems: 'center' as const, justifyContent: 'center' as const },
  secondaryText: { color: brand.navy, fontSize: 14, fontWeight: '900' as const },
};
