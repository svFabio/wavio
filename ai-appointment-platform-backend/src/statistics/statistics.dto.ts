import { z } from 'zod';

export const MonthsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(12).optional().default(6),
});

export type MonthsQuery = z.infer<typeof MonthsQuerySchema>;
