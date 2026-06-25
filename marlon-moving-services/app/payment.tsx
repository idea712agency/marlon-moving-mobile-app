import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams } from 'expo-router';
import { CalendarDays, Check, ChevronRight, FileCheck2, Landmark, ReceiptText, Upload } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { brand } from '@/constants/operator-brand';
import type { ManualPaymentMethod, ManualPaymentSubmission, PaymentDetail, PaymentMethod } from '@/lib/data';
import { errorMessage, money, shortDate } from '@/lib/data';
import { invokeSupabaseFunction } from '@/lib/supabase-functions';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

const REFERENCE_REQUIRED = new Set<ManualPaymentMethod>(['zelle', 'bank_transfer', 'check']);

type SubmitPaymentResponse = {
  ok?: boolean;
  data?: {
    submission: ManualPaymentSubmission;
    invoice: PaymentDetail['invoice'];
  };
  error?: string;
  message?: string;
};

export default function PaymentScreen() {
  const params = useLocalSearchParams<{ invoice?: string }>();
  const invoiceId = Array.isArray(params.invoice) ? params.invoice[0] : params.invoice;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<ManualPaymentMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(today());
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [proof, setProof] = useState<{ name: string; path: string; publicUrl: string } | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');

  const detail = useQuery({
    queryKey: ['payment-detail', invoiceId ?? 'latest-open'],
    queryFn: () => invokeSupabaseFunction<PaymentDetail>('mobile-get-payment-detail', { body: invoiceId ? { invoice_id: invoiceId } : {} }),
  });

  const invoice = detail.data?.invoice ?? null;
  const methods = detail.data?.methods ?? [];
  const submissions = detail.data?.submissions ?? [];
  const approvedTotal = submissions.filter((submission) => submission.status === 'approved').reduce((total, submission) => total + Number(submission.amount || 0), 0);
  const submittedTotal = submissions.filter((submission) => submission.status === 'submitted').reduce((total, submission) => total + Number(submission.amount || 0), 0);
  const total = invoice?.total ?? 0;
  const remaining = Math.max(0, total - approvedTotal);
  const pendingReview = submittedTotal > 0 || invoice?.status === 'pending_review';
  const selected = methods.find((method) => method.method === selectedMethod) ?? null;

  const defaultAmount = useMemo(() => remaining ? String(remaining.toFixed(2)) : '', [remaining]);

  const submit = useMutation({
    mutationFn: async () => {
      if (!invoice) throw new Error('No invoice is available for payment.');
      if (!selectedMethod) throw new Error('Choose a payment method.');
      const normalizedAmount = Number(amount || defaultAmount);
      if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) throw new Error('Enter a valid payment amount.');
      if (normalizedAmount > remaining) throw new Error('Payment amount cannot be greater than the remaining balance.');
      if (!paymentDate.trim()) throw new Error('Enter the payment date.');
      if (REFERENCE_REQUIRED.has(selectedMethod) && !reference.trim()) throw new Error('Enter the payment reference number.');

      const result = await invokeSupabaseFunction<SubmitPaymentResponse>('mobile-submit-manual-payment', {
        body: {
          invoice_id: invoice.id,
          method: selectedMethod,
          amount: normalizedAmount,
          payment_date: paymentDate.trim(),
          reference_number: reference.trim() || undefined,
          notes: notes.trim() || undefined,
          proof_file_path: proof?.publicUrl,
        },
      });
      if (result?.ok === false) throw new Error(result.error || result.message || 'Payment submission failed.');
      return result.data;
    },
    onSuccess: async () => {
      setSuccess("Payment submitted. We'll verify within 1 business day.");
      setReference('');
      setNotes('');
      setProof(null);
      await queryClient.invalidateQueries({ queryKey: ['payment-detail', invoiceId ?? 'latest-open'] });
      await queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
      await detail.refetch();
    },
    onError: (error) => setLocalError(errorMessage(error)),
  });

  const chooseProof = async () => {
    if (!user?.id) {
      setLocalError('Sign in before uploading payment proof.');
      return;
    }
    setLocalError('');
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploadingProof(true);
    try {
      const response = await fetch(asset.uri);
      const body = await response.blob();
      const extension = asset.name.includes('.') ? asset.name.split('.').pop() : 'file';
      const safeName = asset.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `customers/${user.id}/payment-proofs/${Date.now()}-${safeName || `proof.${extension}`}`;
      const { error } = await supabase.storage.from('media').upload(path, body, {
        contentType: asset.mimeType || 'application/octet-stream',
        upsert: false,
      });
      if (error) throw error;
      const publicUrl = supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
      setProof({ name: asset.name, path, publicUrl });
    } catch (error) {
      setLocalError(errorMessage(error));
    } finally {
      setUploadingProof(false);
    }
  };

  const cannotSubmit = submit.isPending || uploadingProof || (Boolean(success) && detail.isFetching) || !invoice || invoice.status === 'paid';

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 18, gap: 14, paddingBottom: 34, backgroundColor: brand.bg }}>
      {detail.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
      {detail.error ? <StateCard title="Payment unavailable" body={detail.error instanceof Error ? detail.error.message : 'Unable to load payment details.'} danger /> : null}
      {localError ? <StateCard title="Check payment details" body={localError} danger /> : null}
      {success ? <StateCard title="Payment submitted" body={success} /> : null}
      {!detail.isLoading && !detail.error && !invoice ? <StateCard title="No open invoice" body="There is no invoice ready for payment right now." /> : null}

      {invoice ? (
        <>
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text selectable style={styles.kicker}>{invoice.invoice_number}</Text>
                <Text selectable style={styles.title}>{money(invoice.total)}</Text>
                <Text selectable style={styles.body}>Due {invoice.due_date ? shortDate(invoice.due_date) : 'on receipt'}</Text>
              </View>
              <StatusBadge status={invoice.status} />
            </View>
            <View style={styles.summaryGrid}>
              <Metric label="Approved" value={money(approvedTotal)} />
              <Metric label="Pending review" value={money(submittedTotal)} />
              <Metric label="Remaining" value={money(remaining)} />
            </View>
            {invoice.status === 'paid' ? <DoneRow label="This invoice is paid." /> : null}
            {pendingReview && invoice.status !== 'paid' ? <DoneRow label="A payment is waiting for verification." muted /> : null}
          </View>

          {invoice.status !== 'paid' ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Payment method</Text>
              {methods.length === 0 ? <Text style={styles.body}>Payment instructions are not available yet.</Text> : null}
              {methods.map((method) => (
                <PaymentMethodCard
                  key={method.method}
                  method={method}
                  selected={selectedMethod === method.method}
                  onPress={() => {
                    setSelectedMethod(method.method);
                    setLocalError('');
                    if (!amount) setAmount(defaultAmount);
                    setSuccess('');
                  }}
                />
              ))}

              {selected ? (
                <View style={{ gap: 10 }}>
                  <Text style={styles.sectionTitle}>Submit for review</Text>
                  <Field label="Amount paid" value={amount || defaultAmount} keyboardType="decimal-pad" onChangeText={setAmount} />
                  <Field label="Payment date" value={paymentDate} onChangeText={setPaymentDate} />
                  <Field label={REFERENCE_REQUIRED.has(selected.method) ? 'Reference number' : 'Reference number (optional)'} value={reference} onChangeText={setReference} />
                  <Field label="Notes (optional)" value={notes} multiline onChangeText={setNotes} />
                  <Pressable onPress={() => void chooseProof()} disabled={uploadingProof || submit.isPending} style={styles.secondaryButton}>
                    <Upload color={brand.blue} size={17} />
                    <Text style={styles.secondaryText}>{uploadingProof ? 'Uploading proof...' : proof ? proof.name : 'Attach proof (optional)'}</Text>
                  </Pressable>
                  <Pressable disabled={cannotSubmit} onPress={() => { setLocalError(''); submit.mutate(); }} style={[styles.primaryButton, { opacity: cannotSubmit ? 0.55 : 1 }]}>
                    <Text style={styles.primaryText}>{submit.isPending ? 'Submitting...' : 'Submit payment for review'}</Text>
                    <ChevronRight color="#FFFFFF" size={18} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Submission history</Text>
            {submissions.length === 0 ? <Text style={styles.body}>Submitted payments will appear here for review status.</Text> : null}
            {submissions.map((submission) => <SubmissionRow key={submission.id} submission={submission} />)}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function PaymentMethodCard({ method, selected, onPress }: { method: PaymentMethod; selected: boolean; onPress: () => void }) {
  const Icon = method.method === 'bank_transfer' ? Landmark : method.method === 'check' ? ReceiptText : method.method === 'cash' ? CalendarDays : FileCheck2;
  return (
    <Pressable onPress={onPress} style={[styles.methodCard, selected ? { borderColor: brand.blue, backgroundColor: brand.blueSoft } : null]}>
      <View style={styles.methodIcon}><Icon color={brand.blue} size={20} /></View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text selectable style={{ color: brand.text, fontSize: 15, fontWeight: '900' }}>{method.label}</Text>
        {method.description ? <Text selectable style={styles.body}>{method.description}</Text> : null}
        {selected && method.instructions ? <Text selectable style={{ color: brand.navy, fontSize: 13, lineHeight: 19, fontWeight: '700' }}>{method.instructions}</Text> : null}
      </View>
    </Pressable>
  );
}

function SubmissionRow({ submission }: { submission: ManualPaymentSubmission }) {
  return (
    <View style={styles.submissionRow}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text selectable style={{ color: brand.text, fontSize: 14, fontWeight: '900' }}>{money(submission.amount)} · {titleCase(submission.method)}</Text>
        <Text selectable style={styles.body}>{shortDate(submission.payment_date)}{submission.reference_number ? ` · Ref ${submission.reference_number}` : ''}</Text>
        {submission.proof_file_path ? <Text style={{ color: brand.blue, fontSize: 11, fontWeight: '900' }}>Proof attached</Text> : null}
        {submission.rejection_reason ? <Text selectable style={{ color: brand.red, fontSize: 12, lineHeight: 17 }}>{submission.rejection_reason}</Text> : null}
      </View>
      <StatusBadge status={submission.status} />
    </View>
  );
}

function StateCard({ title, body, danger }: { title: string; body: string; danger?: boolean }) {
  return <View style={[styles.card, danger ? { borderColor: brand.red, backgroundColor: brand.redSoft } : null]}><Text selectable style={{ color: danger ? brand.red : brand.text, fontSize: 17, fontWeight: '900' }}>{title}</Text><Text selectable style={styles.body}>{body}</Text></View>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.kicker}>{label}</Text><Text selectable style={{ color: brand.text, fontSize: 14, fontWeight: '900' }}>{value}</Text></View>;
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, multiline, style, ...inputProps } = props;
  return <View style={{ gap: 6 }}><Text style={styles.kicker}>{label}</Text><TextInput {...inputProps} multiline={multiline} placeholderTextColor="#94A3B8" style={[styles.input, multiline ? { minHeight: 84, paddingTop: 11, textAlignVertical: 'top' } : null, style]} /></View>;
}

function StatusBadge({ status }: { status: string }) {
  const paid = status === 'paid' || status === 'approved';
  const rejected = status === 'rejected' || status === 'void';
  return <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: paid ? brand.greenSoft : rejected ? brand.redSoft : brand.blueSoft }}><Text style={{ color: paid ? brand.green : rejected ? brand.red : brand.blue, fontSize: 10, fontWeight: '900' }}>{titleCase(status)}</Text></View>;
}

function DoneRow({ label, muted }: { label: string; muted?: boolean }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><Check color={muted ? brand.blue : brand.green} size={17} /><Text style={{ color: muted ? brand.blue : brand.green, fontSize: 13, fontWeight: '900' }}>{label}</Text></View>;
}

const today = () => new Date().toISOString().slice(0, 10);
const titleCase = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const styles = {
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, borderCurve: 'continuous' as const, borderWidth: 1, borderColor: brand.border, padding: 16, gap: 13, boxShadow: '0 2px 8px rgba(15,23,42,0.05)' },
  kicker: { color: brand.muted, fontSize: 10, fontWeight: '900' as const, textTransform: 'uppercase' as const },
  title: { color: brand.text, fontSize: 28, lineHeight: 34, fontWeight: '900' as const },
  sectionTitle: { color: brand.text, fontSize: 18, fontWeight: '900' as const },
  body: { color: brand.muted, fontSize: 13, lineHeight: 19 },
  summaryGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
  metric: { flex: 1, minWidth: 92, borderRadius: 13, backgroundColor: brand.bg, padding: 10, gap: 3 },
  methodCard: { minHeight: 86, borderRadius: 16, borderCurve: 'continuous' as const, borderWidth: 1, borderColor: brand.border, padding: 12, flexDirection: 'row' as const, gap: 11, backgroundColor: '#FFFFFF' },
  methodIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: brand.blueSoft, alignItems: 'center' as const, justifyContent: 'center' as const },
  input: { minHeight: 50, borderRadius: 13, borderWidth: 1, borderColor: brand.border, backgroundColor: '#FFFFFF', paddingHorizontal: 13, color: brand.text, fontSize: 14 },
  primaryButton: { minHeight: 52, borderRadius: 14, backgroundColor: brand.blue, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' as const },
  secondaryButton: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: brand.blue, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, paddingHorizontal: 12 },
  secondaryText: { color: brand.blue, fontSize: 13, fontWeight: '900' as const, flexShrink: 1 },
  submissionRow: { borderTopWidth: 1, borderTopColor: brand.border, paddingTop: 11, flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 10 },
};
