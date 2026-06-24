import { z } from 'zod';

export const adminDashboardSchema = z.object({
  counts: z.object({
    totalMoves: z.number(),
    upcoming: z.number(),
    inProgress: z.number(),
    completed: z.number(),
    completedDeltaPct: z.number().nullable(),
  }),
  movesByDay: z.array(z.object({ day: z.string(), count: z.number() })),
  revenueByDay: z.array(z.object({ day: z.string(), total: z.number() })),
  revenueThisMonth: z.number(),
  statusDonut: z.array(
    z.object({
      name: z.enum(['upcoming', 'in_progress', 'completed']),
      value: z.number(),
    }),
  ),
  upcomingMoves: z.array(
    z.object({
      id: z.string(),
      scheduled_date: z.string().nullable(),
      scheduled_start_time: z.string().nullable(),
      origin_address: z.string().nullable(),
      destination_address: z.string().nullable(),
      status: z.string(),
      contact: z.object({ name: z.string(), phone: z.string().nullable() }).nullable(),
    }),
  ),
  activity: z.array(
    z.object({
      id: z.string(),
      source: z.enum(['job', 'lead']),
      activity_type: z.string(),
      description: z.string().nullable(),
      created_at: z.string(),
    }),
  ),
});

export type AdminDashboard = z.infer<typeof adminDashboardSchema>;
