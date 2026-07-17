import { z } from 'zod';

export const enviarMensajeSchema = z.object({
  texto: z.string().min(1, 'El texto es requerido').max(5000),
});

export type EnviarMensajeDto = z.infer<typeof enviarMensajeSchema>;
