import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  assignJobDispatch,
  crewMembersFromResponse,
  deactivateCrewMember,
  dispatchJobs,
  getJobDispatchDetail,
  listCrewMembers,
  listDispatchBoard,
  upsertCrewMember,
  type AssignJobDispatchBody,
  type CrewRole,
  type DispatchCrewMember,
} from '@/lib/dispatch';
import { adminDashboardQueryKey } from '@/hooks/use-admin-dashboard';
import { supabase } from '@/lib/supabase';

export const dispatchBoardKey = (filters: { date_from?: string; date_to?: string; status?: string | null; blocker?: string | null }) =>
  ['dispatch-board', filters.date_from ?? '', filters.date_to ?? '', filters.status ?? 'all', filters.blocker ?? 'all'] as const;

export const jobDispatchKey = (jobId?: string | null) => ['job-dispatch-detail', jobId ?? 'missing'] as const;

export function useDispatchBoard(filters: { date_from?: string; date_to?: string; status?: string | null; blocker?: string | null }) {
  return useQuery({
    queryKey: dispatchBoardKey(filters),
    queryFn: () => listDispatchBoard(filters),
    select: (response) => ({ ...response, jobs: dispatchJobs(response) }),
  });
}

export function useJobDispatchDetail(jobId?: string | null) {
  return useQuery({
    queryKey: jobDispatchKey(jobId),
    enabled: Boolean(jobId),
    queryFn: () => getJobDispatchDetail(jobId!),
  });
}

export function useCrewMembers() {
  return useQuery({
    queryKey: ['dispatch-crew-members'],
    queryFn: listCrewMembers,
    select: crewMembersFromResponse,
  });
}

export function useVehicles() {
  return useQuery({
    queryKey: ['dispatch-vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, vehicle_number, vehicle_type, truck_size, status, make, model, license_plate')
        .order('vehicle_number', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAssignJobDispatch(jobId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<AssignJobDispatchBody, 'job_id'>) => {
      if (!jobId) throw new Error('Missing job id.');
      return assignJobDispatch({ job_id: jobId, ...body });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: jobDispatchKey(jobId) }),
        queryClient.invalidateQueries({ queryKey: ['dispatch-board'] }),
        queryClient.invalidateQueries({ queryKey: ['operator-moves'] }),
        queryClient.invalidateQueries({ queryKey: ['operator-schedule'] }),
        queryClient.invalidateQueries({ queryKey: ['operator-job', jobId] }),
        queryClient.invalidateQueries({ queryKey: adminDashboardQueryKey }),
      ]);
    },
  });
}

export function useCrewRosterActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['dispatch-crew-members'] });
  const upsert = useMutation({
    mutationFn: (member: Partial<DispatchCrewMember> & { name: string; role: CrewRole | string }) => upsertCrewMember(member),
    onSuccess: () => void invalidate(),
  });
  const deactivate = useMutation({
    mutationFn: (crewMemberId: string) => deactivateCrewMember(crewMemberId),
    onSuccess: () => void invalidate(),
  });
  return { upsert, deactivate };
}
