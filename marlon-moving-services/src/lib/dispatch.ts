import type { Json } from '@/types/supabase';
import { invokeSupabaseFunction } from '@/lib/supabase-functions';

export type DispatchStatus = 'unassigned' | 'assigned' | 'en_route' | 'arrived' | 'completed';
export type DispatchBlocker = 'missing_crew' | 'missing_truck' | 'missing_start_time' | 'missing_origin' | 'missing_destination' | 'missing_address';
export type CrewRole = 'lead' | 'mover' | 'driver' | 'helper';

export type DispatchCrewMember = {
  id: string;
  name: string;
  role: CrewRole | string;
  phone?: string | null;
  email?: string | null;
  active?: boolean | null;
  is_active?: boolean | null;
  notes?: string | null;
};

export type DispatchVehicle = {
  id: string;
  vehicle_number: string;
  vehicle_type?: string | null;
  truck_size?: string | null;
  status?: string | null;
  make?: string | null;
  model?: string | null;
  license_plate?: string | null;
};

export type DispatchReadiness = {
  ready?: boolean | null;
  blockers: DispatchBlocker[];
};

export type DispatchJobSummary = {
  id: string;
  job_number: string;
  scheduled_date: string;
  scheduled_start_time?: string | null;
  status: string;
  dispatch_status?: DispatchStatus | string | null;
  origin_address?: string | null;
  destination_address?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  contact?: { name?: string | null; phone?: string | null } | null;
  contacts?: { name?: string | null; phone?: string | null } | null;
  crew_size?: number | null;
  crew_members?: Json | null;
  crew_member_ids?: string[] | null;
  truck_id?: string | null;
  truck_size?: string | null;
  dispatch_notes?: string | null;
  dispatched_at?: string | null;
  readiness?: DispatchReadiness | null;
};

export type DispatchBoardResponse = {
  jobs?: DispatchJobSummary[];
  items?: DispatchJobSummary[];
  counts?: Partial<Record<DispatchStatus | string, number | null>> | null;
  date_from?: string | null;
  date_to?: string | null;
};

export type JobDispatchDetail = {
  job: DispatchJobSummary;
  crew_members?: DispatchCrewMember[];
  assigned_crew?: DispatchCrewMember[];
  vehicle?: DispatchVehicle | null;
  truck?: DispatchVehicle | null;
  readiness: DispatchReadiness;
};

export type AssignJobDispatchBody = {
  job_id: string;
  crew_member_ids: string[];
  truck_id?: string | null;
  scheduled_start_time?: string | null;
  dispatch_status?: DispatchStatus;
  dispatch_notes?: string | null;
};

export function listDispatchBoard(body: { date_from?: string; date_to?: string; status?: string | null; blocker?: string | null } = {}) {
  return invokeSupabaseFunction<DispatchBoardResponse>('admin-list-dispatch-board', { body });
}

export function getJobDispatchDetail(jobId: string) {
  return invokeSupabaseFunction<JobDispatchDetail>('admin-get-job-dispatch-detail', { body: { job_id: jobId } });
}

export function assignJobDispatch(body: AssignJobDispatchBody) {
  return invokeSupabaseFunction<JobDispatchDetail>('admin-assign-job-dispatch', { body });
}

export function listCrewMembers() {
  return invokeSupabaseFunction<{ crew_members?: DispatchCrewMember[]; members?: DispatchCrewMember[]; crew?: DispatchCrewMember[]; data?: DispatchCrewMember[] } | DispatchCrewMember[]>('admin-list-crew-members', { body: {} });
}

export function upsertCrewMember(member: Partial<DispatchCrewMember> & { name: string; role: CrewRole | string }) {
  return invokeSupabaseFunction<{ crew_member?: DispatchCrewMember; member?: DispatchCrewMember }>('admin-upsert-crew-member', { body: member });
}

export function deactivateCrewMember(crewMemberId: string) {
  return invokeSupabaseFunction<{ crew_member?: DispatchCrewMember; member?: DispatchCrewMember }>('admin-deactivate-crew-member', {
    body: { crew_member_id: crewMemberId, id: crewMemberId },
  });
}

export function dispatchJobs(response?: DispatchBoardResponse | null) {
  return response?.jobs ?? response?.items ?? [];
}

export function crewMembersFromResponse(response: Awaited<ReturnType<typeof listCrewMembers>>) {
  if (Array.isArray(response)) return response;
  return response.crew_members ?? response.members ?? response.crew ?? response.data ?? firstArrayValue<DispatchCrewMember>(response) ?? [];
}

function firstArrayValue<T>(value: unknown): T[] | null {
  if (!value || typeof value !== 'object') return null;
  return (Object.values(value) as unknown[]).find(Array.isArray) as T[] | undefined ?? null;
}

export function dispatchStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    unassigned: 'Unassigned',
    assigned: 'Assigned',
    en_route: 'En route',
    arrived: 'Arrived',
    completed: 'Completed',
  };
  return labels[status ?? ''] ?? 'Unassigned';
}

export function dispatchBlockerLabel(blocker: string) {
  const labels: Record<string, string> = {
    missing_crew: 'Missing crew',
    missing_truck: 'Missing truck',
    missing_start_time: 'Missing start time',
    missing_origin: 'Missing origin',
    missing_destination: 'Missing destination',
    missing_address: 'Missing address',
  };
  return labels[blocker] ?? blocker.replace(/_/g, ' ');
}

export function crewName(member: DispatchCrewMember) {
  return member.name || member.email || member.phone || 'Crew member';
}

export function vehicleLabel(vehicle?: DispatchVehicle | null) {
  if (!vehicle) return 'No truck selected';
  return [vehicle.vehicle_number, vehicle.truck_size, vehicle.make, vehicle.model].filter(Boolean).join(' · ');
}
