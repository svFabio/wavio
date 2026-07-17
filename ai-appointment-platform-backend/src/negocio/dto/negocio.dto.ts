import { z } from 'zod';

export const updateConfiguracionSchema = z.object({
  trigger: z.string().min(1).optional(),
  mensajeBienvenida: z.string().optional(),
  mensajeConfirmacion: z.string().optional(),
  qrFotoUrl: z.string().nullable().optional(),
  cobrarAdelanto: z.boolean().optional(),
  porcentajeAdelanto: z.number().min(1).max(100).optional(),
  timezone: z.string().optional(),
  chatFlow: z.record(z.string(), z.unknown()).optional(),
});

export const uploadQrSchema = z.object({
  imagen: z.string().min(1, 'La imagen es requerida'),
});

export const configurarNegocioSchema = z.object({
  nombre: z.string().min(1, 'El nombre del negocio es requerido'),
});

export type UpdateConfiguracionDto = z.infer<typeof updateConfiguracionSchema>;
export type UploadQrDto = z.infer<typeof uploadQrSchema>;
export type ConfigurarNegocioDto = z.infer<typeof configurarNegocioSchema>;
