import { z } from 'zod';
import { normalizePhoneE164 } from '../../common/utils/phone.util';

export const createClienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  telefono: z
    .string()
    .min(1, 'El telefono es requerido')
    .transform((val) => normalizePhoneE164(val)),
  email: z.string().email('Email invalido').optional(),
  notas: z.string().optional(),
});

export const updateClienteSchema = z.object({
  nombre: z.string().min(1).optional(),
  email: z.string().email('Email invalido').optional(),
  notas: z.string().optional(),
});

export type CreateClienteDto = z.infer<typeof createClienteSchema>;
export type UpdateClienteDto = z.infer<typeof updateClienteSchema>;
