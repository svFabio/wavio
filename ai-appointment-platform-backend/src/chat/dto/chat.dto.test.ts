import { describe, it, expect } from 'vitest';
import { enviarMensajeSchema } from './chat.dto';

describe('chat.dto', () => {
  describe('enviarMensajeSchema', () => {
    it('should accept valid message text', () => {
      const result = enviarMensajeSchema.parse({ texto: 'Hola, quiero agendar una cita' });
      expect(result.texto).toBe('Hola, quiero agendar una cita');
    });

    it('should reject empty text', () => {
      const result = enviarMensajeSchema.safeParse({ texto: '' });
      expect(result.success).toBe(false);
    });

    it('should reject text exceeding max length', () => {
      const result = enviarMensajeSchema.safeParse({ texto: 'a'.repeat(1001) });
      expect(result.success).toBe(false);
    });

    it('should accept text at max length', () => {
      const result = enviarMensajeSchema.parse({ texto: 'a'.repeat(1000) });
      expect(result.texto).toHaveLength(1000);
    });

    it('should reject missing texto', () => {
      const result = enviarMensajeSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
