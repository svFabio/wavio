import { z } from 'zod';

export const validarCitaSchema = z.object({
  accion: z.enum(['CONFIRMAR', 'APROBAR', 'CANCELAR', 'RECHAZAR'], {
    error: 'Acción inválida. Valores permitidos: CONFIRMAR, APROBAR, CANCELAR, RECHAZAR',
  }),
});

export const crearCitaAdminSchema = z.object({
  clienteNombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  clienteTelefono: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos numéricos'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  horario: z.string().min(1, 'El horario es requerido'),
  monto: z.number().min(0, 'El monto no puede ser negativo').optional(),
  servicioId: z.number().int().optional(),
  staffId: z.number().int().optional(),
  duracionMinutos: z.number().int().min(15).max(480).optional(),
});

export const reprogramarCitaSchema = z.object({
  fecha: z.string({ message: 'La fecha es requerida' }),
  horario: z.string({ message: 'El horario es requerido' }),
});

export const actualizarDescripcionSchema = z.object({
  descripcion: z.string().optional(),
});

export const agendaQuerySchema = z.object({
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  desde: z.string().datetime().optional(),
  hasta: z.string().datetime().optional(),
});

export const horariosQuerySchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  servicioId: z.coerce.number().int().optional(),
  staffId: z.coerce.number().int().optional(),
});

export type ValidarCitaDto = z.infer<typeof validarCitaSchema>;
export type CrearCitaAdminDto = z.infer<typeof crearCitaAdminSchema>;
export type ReprogramarCitaDto = z.infer<typeof reprogramarCitaSchema>;
export type ActualizarDescripcionDto = z.infer<typeof actualizarDescripcionSchema>;
export type AgendaQueryDto = z.infer<typeof agendaQuerySchema>;
export type HorariosQueryDto = z.infer<typeof horariosQuerySchema>;
