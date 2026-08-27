import { z } from 'zod';

export const bookAppointmentSchema = z.object({
  fecha: z.string().min(1, 'Fecha es requerida'),
  horario: z.string().min(1, 'Horario es requerido'),
  servicioId: z.number().optional(),
});

export type BookAppointmentDto = z.infer<typeof bookAppointmentSchema>;
