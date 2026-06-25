import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { invokeSupabaseFunction } from '@/lib/supabase-functions';

export type JobDocumentTemplateStatus = 'none' | 'draft' | 'signed';

export type JobDocumentTemplateCategory = {
  id?: string | null;
  label: string;
  color?: string | null;
  bg?: string | null;
};

export type JobDocumentTemplate = {
  id: string;
  slug: string;
  label?: string | null;
  template_name?: string | null;
  version: number;
  signature_required: boolean;
  required_in_package?: boolean | null;
  status: JobDocumentTemplateStatus;
  category?: JobDocumentTemplateCategory | null;
  category_id?: string | null;
  document_id?: string | null;
  generated_from_version?: number | null;
  locked_at?: string | null;
};

type TemplateListResponse = JobDocumentTemplate[] | { templates?: JobDocumentTemplate[]; data?: JobDocumentTemplate[] };
type RenderSource = 'docx' | 'body_html';
type PreviewResponse = { html: string; version?: number | null; html_source?: RenderSource; missing_tokens?: string[] };
type GenerateResponse = { document_id: string; storage_path: string; version: number; html_source?: RenderSource };
type PackageResponse = {
  generated: { template_slug?: string; document_id?: string; file_url?: string; status?: string }[];
  skipped_locked: { template_slug?: string; document_id?: string; status?: string }[];
};

export function useJobDocumentTemplates(jobId: string | undefined) {
  return useQuery({
    queryKey: ['job-document-templates', jobId],
    enabled: Boolean(jobId),
    queryFn: async () => {
      if (!jobId) throw new Error('Missing job id.');
      const result = await invokeSupabaseFunction<TemplateListResponse>('admin-list-document-templates', { body: { job_id: jobId } });
      return Array.isArray(result) ? result : result.templates ?? result.data ?? [];
    },
  });
}

export function useJobDocumentTemplateActions(jobId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    if (jobId) {
      await queryClient.invalidateQueries({ queryKey: ['job-document-templates', jobId] });
      await queryClient.invalidateQueries({ queryKey: ['operator-job', jobId] });
    }
  };

  const previewTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      if (!jobId) throw new Error('Missing job id.');
      return invokeSupabaseFunction<PreviewResponse>('admin-preview-document-template', { body: { template_id: templateId, job_id: jobId } });
    },
  });

  const generateDocument = useMutation({
    mutationFn: async ({ templateId, replace = true }: { templateId: string; replace?: boolean }) => {
      if (!jobId) throw new Error('Missing job id.');
      return invokeSupabaseFunction<GenerateResponse>('admin-generate-job-document', {
        body: { job_id: jobId, template_id: templateId, replace },
      });
    },
    onSuccess: () => void invalidate(),
  });

  const generatePackage = useMutation({
    mutationFn: async () => {
      if (!jobId) throw new Error('Missing job id.');
      return invokeSupabaseFunction<PackageResponse>('admin-generate-job-document-package', { body: { job_id: jobId } });
    },
    onSuccess: () => void invalidate(),
  });

  return { previewTemplate, generateDocument, generatePackage, invalidate };
}
