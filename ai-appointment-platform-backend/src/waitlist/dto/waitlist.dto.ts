import { z } from 'zod';

export const addToWaitlistSchema = z.object({
  clienteNombre: z.string().min(1),
  clienteTelefono: z.string().min(1),
  servicioId: z.number().int().positive().optional(),
  fechaPreferida: z.string().transform((val) => new Date(val)),
  horarioPreferido: z.string().optional(),
});

export type AddToWaitlistDto = z.infer<typeof addToWaitlistSchema>;
