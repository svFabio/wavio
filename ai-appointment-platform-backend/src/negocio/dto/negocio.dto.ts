import { z } from 'zod';

export const ConfiguracionUpdateSchema = z.object({
  trigger: z.string().min(1).optional(),
  mensajeBienvenida: z.string().optional(),
  mensajeConfirmacion: z.string().optional(),
  qrFotoUrl: z.string().nullable().optional(),
  cobrarAdelanto: z.boolean().optional(),
  porcentajeAdelanto: z.number().min(1).max(100).optional(),
  timezone: z.string().optional(),
  chatFlow: z.record(z.string(), z.unknown()).optional(),
});

export const QrUploadSchema = z.object({
  imagen: z.string().min(1, 'La imagen es requerida'),
});

export const NegocioConfiguracionSchema = z.object({
  nombre: z.string().min(1, 'El nombre del negocio es requerido'),
});

export const CredencialesUpdateSchema = z.object({
  waAccessToken: z.string().min(1).optional(),
  waPhoneNumberId: z.string().min(1).optional(),
  waWabaId: z.string().min(1).optional(),
  waAppId: z.string().min(1).optional(),
  geminiApiKey: z.string().min(1).optional(),
});

export type UpdateConfiguracionDto = z.infer<typeof ConfiguracionUpdateSchema>;
export type UploadQrDto = z.infer<typeof QrUploadSchema>;
export type ConfigurarNegocioDto = z.infer<typeof NegocioConfiguracionSchema>;
export type UpdateCredencialesDto = z.infer<typeof CredencialesUpdateSchema>;
