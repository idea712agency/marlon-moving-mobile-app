import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { invokeSupabaseFunction } from '@/lib/supabase-functions';

export type AdminDocumentTemplate = {
  id: string;
  slug: string;
  template_name: string;
  document_type: string;
  category_id?: string | null;
  body_html: string;
  docx_template_path?: string | null;
  source_file_path?: string | null;
  source_mime_type?: string | null;
  source_uploaded_at?: string | null;
  source_uploaded_by?: string | null;
  version: number;
  signature_required: boolean;
  required_for_job: boolean;
  is_active: boolean;
  display_order?: number | null;
  updated_at?: string | null;
};

export type TemplatePayload = {
  template_id?: string;
  slug: string;
  template_name: string;
  document_type: string;
  category_id?: string | null;
  body_html: string;
  docx_template_path?: string | null;
  source_file_path?: string | null;
  signature_required: boolean;
  required_for_job: boolean;
  is_active: boolean;
  display_order?: number | null;
};

type TemplateListResponse = AdminDocumentTemplate[] | { templates?: AdminDocumentTemplate[]; data?: AdminDocumentTemplate[] };
type TemplateDetailResponse = { template: AdminDocumentTemplate; merge_tokens: string[] };
type UpsertTemplateResponse = { template: AdminDocumentTemplate; version_bumped: boolean };
type PreviewTemplateResponse = { html: string; html_source?: 'docx' | 'body_html'; missing_tokens?: string[] };
type DeleteTemplateResponse = { ok: true };
type UploadTemplateSourceResponse = {
  template: AdminDocumentTemplate;
  version_bumped?: boolean;
  warnings?: string[];
};

export const templateListKey = ['admin-document-templates'] as const;
export const templateDetailKey = (id?: string | null) => ['admin-document-template', id ?? 'new'] as const;

const normalizeTemplates = (response: TemplateListResponse) =>
  Array.isArray(response) ? response : response.templates ?? response.data ?? [];

export function useTemplateList() {
  return useQuery({
    queryKey: templateListKey,
    queryFn: async () => normalizeTemplates(await invokeSupabaseFunction<TemplateListResponse>('admin-list-document-templates', { body: {} })),
  });
}

export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: templateDetailKey(id),
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) throw new Error('Missing template id.');
      return invokeSupabaseFunction<TemplateDetailResponse>('admin-get-document-template', { body: { template_id: id } });
    },
  });
}

export function useUpsertTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TemplatePayload) =>
      invokeSupabaseFunction<UpsertTemplateResponse>('admin-upsert-document-template', { body: payload }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: templateListKey });
      await queryClient.invalidateQueries({ queryKey: templateDetailKey(response.template.id) });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) =>
      invokeSupabaseFunction<DeleteTemplateResponse>('admin-delete-document-template', { body: { template_id: templateId } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: templateListKey });
    },
  });
}

export function useUploadTemplateSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { templateId?: string; slug: string; file: { uri: string; name: string; mimeType?: string | null; file?: File | null } }) => {
      const formData = new FormData();
      if (payload.templateId) formData.append('template_id', payload.templateId);
      formData.append('slug', payload.slug);
      if (payload.file.file) {
        formData.append('file', payload.file.file);
      } else {
        formData.append('file', {
          uri: payload.file.uri,
          name: payload.file.name,
          type: payload.file.mimeType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        } as unknown as Blob);
      }
      return invokeSupabaseFunction<UploadTemplateSourceResponse>('admin-upload-document-template-source', { body: formData as any });
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: templateListKey });
      await queryClient.invalidateQueries({ queryKey: templateDetailKey(response.template.id) });
    },
  });
}

export function usePreviewTemplate() {
  return useMutation({
    mutationFn: (payload: { template_id?: string; body_html?: string; job_id?: string }) =>
      invokeSupabaseFunction<PreviewTemplateResponse>('admin-preview-document-template', { body: payload }),
  });
}
