import { z } from 'zod';

export const calendarCallbackSchema = z.object({
  code: z.string().min(1, 'Missing authorization code'),
  state: z.string().min(1, 'Missing state parameter'),
});

export type CalendarCallbackDto = z.infer<typeof calendarCallbackSchema>;
