import { z } from 'zod';

export const createServicioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  duracionMinutos: z.number().int().min(15, 'Duración mínima 15 minutos').max(480).optional(),
  bufferMinutos: z.number().int().min(0).max(120).optional(),
  precio: z.number().min(0).optional(),
});

export const updateServicioSchema = z.object({
  nombre: z.string().min(1).optional(),
  duracionMinutos: z.number().int().min(15).max(480).optional(),
  bufferMinutos: z.number().int().min(0).max(120).optional(),
  precio: z.number().min(0).optional(),
  activo: z.boolean().optional(),
});

export const updateHorariosSchema = z.object({
  horarios: z.array(
    z.object({
      diaSemana: z.number().int().min(0).max(6),
      horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm'),
      horaFin: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm'),
    }),
  ),
});

export const createEspecialSchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  cerrado: z.boolean(),
  horaInicio: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  horaFin: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
});

export type CreateServicioDto = z.infer<typeof createServicioSchema>;
export type UpdateServicioDto = z.infer<typeof updateServicioSchema>;
export type UpdateHorariosDto = z.infer<typeof updateHorariosSchema>;
export type CreateEspecialDto = z.infer<typeof createEspecialSchema>;
