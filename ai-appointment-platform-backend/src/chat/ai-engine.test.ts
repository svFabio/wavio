import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGenerateContent, mockText, mockResponse, genAICalls } = vi.hoisted(() => {
  const mockGenerateContent = vi.fn();
  const mockText = vi.fn();
  const mockResponse = { response: { text: mockText } };
  const genAICalls: string[] = [];
  return { mockGenerateContent, mockText, mockResponse, genAICalls };
});

vi.mock('@google/generative-ai', () => {
  function MockGoogleGenerativeAI(this: { apiKey: string; getGenerativeModel: () => unknown }, apiKey: string) {
    this.apiKey = apiKey;
    genAICalls.push(apiKey);
    this.getGenerativeModel = () => ({ generateContent: mockGenerateContent });
  }
  return { GoogleGenerativeAI: MockGoogleGenerativeAI };
});

vi.mock('../config/env', () => ({
  env: { GEMINI_API_KEY: 'global-key' },
}));

vi.mock('../lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { procesarMensajeConIA, detectarIntencionSimple } from './ai-engine';

describe('ai-engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    genAICalls.length = 0;
  });

  describe('procesarMensajeConIA', () => {
    it('should use the per-business apiKey when provided', async () => {
      mockText.mockReturnValue(
        JSON.stringify({
          intencion: 'AGENDAR',
          entidades: { fecha: 'manana' },
          sentimiento: 'positivo',
          confianza: 0.9,
          respuestaSugerida: 'Claro!',
        }),
      );
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await procesarMensajeConIA(
        'Quiero una cita manana',
        { estado: 'INICIO', datos: {}, intentosAclaracion: 0 },
        [],
        [],
        [],
        'business-key-123',
      );

      expect(result.intencion).toBe('AGENDAR');
      expect(genAICalls).toContain('business-key-123');
    });

    it('should fall back to the global singleton when no apiKey is provided', async () => {
      mockText.mockReturnValue(
        JSON.stringify({
          intencion: 'OTRO',
          entidades: {},
          sentimiento: 'neutral',
          confianza: 0.2,
        }),
      );
      mockGenerateContent.mockResolvedValue(mockResponse);

      await procesarMensajeConIA('hola', { estado: 'INICIO', datos: {}, intentosAclaracion: 0 });

      // No new GoogleGenerativeAI instance is created: the module-level singleton (global key) is reused
      expect(genAICalls).toEqual([]);
    });

    it('should return fallback for empty message', async () => {
      const result = await procesarMensajeConIA('', {
        estado: 'INICIO',
        datos: {},
        intentosAclaracion: 0,
      });
      expect(result.intencion).toBe('OTRO');
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });
  });

  describe('detectarIntencionSimple', () => {
    it('should detect AGENDAR for booking intent', () => {
      expect(detectarIntencionSimple('quiero agendar una cita')).toBe('AGENDAR');
    });

    it('should detect CANCELAR for cancellation intent', () => {
      expect(detectarIntencionSimple('quiero cancelar mi cita')).toBe('CANCELAR');
    });

    it('should detect CONSULTAR for availability intent', () => {
      expect(detectarIntencionSimple('cuando tienes horario disponible')).toBe('CONSULTAR');
    });

    it('should return OTRO for unrelated text', () => {
      expect(detectarIntencionSimple('como estas')).toBe('OTRO');
    });
  });
});
