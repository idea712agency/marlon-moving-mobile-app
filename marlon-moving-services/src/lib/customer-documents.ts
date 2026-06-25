import type { Document } from '@/lib/data';
import { invokeSupabaseFunction } from '@/lib/supabase-functions';

export type CustomerDocumentCategory = {
  id?: string | null;
  label: string;
  color?: string | null;
  bg?: string | null;
};

export type CustomerDocument = Document & {
  category?: CustomerDocumentCategory | null;
  category_id?: string | null;
  generated_from_version?: number | null;
  html_preview_url?: string | null;
  is_html_snapshot?: boolean | null;
  is_pdf?: boolean | null;
  locked_at?: string | null;
  sent_to_customer_at?: string | null;
  signature_required?: boolean | null;
  status?: 'none' | 'draft' | 'sent' | 'signed' | string | null;
};

export type CustomerDocumentListResponse = {
  documents: CustomerDocument[];
};

export type CustomerDocumentDetailResponse = {
  document: CustomerDocument;
  signed: boolean;
  signer_name?: string | null;
  signed_at?: string | null;
  signed_url?: string | null;
  html_preview_url?: string | null;
  is_pdf?: boolean | null;
  is_html_snapshot: boolean;
};

export type CustomerSignDocumentResponse = {
  ok?: boolean;
  document_id?: string;
  status?: 'signed' | 'already_signed';
  signed_at?: string;
  signer_name?: string;
  version?: number | null;
};

export const customerDocumentListKey = (jobId?: string | null) => ['customer-job-documents', jobId ?? 'current'] as const;
export const customerDocumentDetailKey = (documentId?: string | null) => ['customer-document', documentId ?? 'missing'] as const;

export function listCustomerJobDocuments(jobId?: string | null) {
  return invokeSupabaseFunction<CustomerDocumentListResponse>('customer-list-job-documents', {
    body: jobId ? { job_id: jobId } : {},
  });
}

export function getCustomerDocumentDetail(documentId: string) {
  return invokeSupabaseFunction<CustomerDocumentDetailResponse>('customer-get-document-detail', {
    body: { document_id: documentId },
  });
}

export function signCustomerDocument(documentId: string, typedName: string) {
  return invokeSupabaseFunction<CustomerSignDocumentResponse>('customer-sign-document', {
    body: { document_id: documentId, signer_name: typedName },
  });
}

export function customerDocumentTitle(document: CustomerDocument) {
  return document.name || 'Document';
}

export function customerDocumentVersion(document: CustomerDocument) {
  return document.generated_from_version ?? null;
}

export function isCustomerDocumentSigned(document: CustomerDocument, signed?: boolean) {
  return Boolean(signed || document.is_signed || document.locked_at || document.status === 'signed');
}

export function customerDocumentChip(document: CustomerDocument, signed?: boolean) {
  if (isCustomerDocumentSigned(document, signed)) {
    const version = customerDocumentVersion(document);
    return {
      label: `Signed${version ? ` v${version}` : ''}`,
      color: '#16A34A',
      bg: '#E7F6EC',
    };
  }

  if (document.signature_required) {
    return { label: 'Awaiting signature', color: '#F59E0B', bg: '#FEF3E0' };
  }

  return { label: 'Sent', color: '#0057D9', bg: '#EAF2FF' };
}

export function groupCustomerDocuments(documents: CustomerDocument[]) {
  const map = new Map<string, { label: string; color?: string | null; bg?: string | null; documents: CustomerDocument[] }>();
  documents.filter((document) => document.status !== 'draft').forEach((document) => {
    const category = document.category;
    const label = category?.label || 'Documents';
    const current = map.get(label) ?? { label, color: category?.color, bg: category?.bg, documents: [] };
    current.documents.push(document);
    map.set(label, current);
  });
  return Array.from(map.values());
}
