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
  return {
    GoogleGenerativeAI: MockGoogleGenerativeAI,
    SchemaType: { STRING: 'string', NUMBER: 'number', OBJECT: 'object' },
    FunctionCallingMode: { AUTO: 'AUTO' },
  };
});

vi.mock('../config/env', () => ({
  env: { GEMINI_API_KEY: 'global-key' },
}));

vi.mock('../lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { procesarMensajeConIA, detectarIntencionSimple, herramientasCita } from './ai-engine';

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

    it('should execute tool calls and use the follow-up response when ejecutarHerramienta is provided', async () => {
      const ejecutarHerramienta = vi.fn().mockResolvedValue(['09:00', '10:00']);

      const firstResponse = {
        response: {
          functionCalls: () => [
            { name: 'consultar_disponibilidad', args: { fecha: '2026-08-05' } },
          ],
        },
      };
      const secondResponse = {
        response: {
          text: () =>
            JSON.stringify({
              intencion: 'CONSULTAR',
              entidades: { fecha: '2026-08-05' },
              sentimiento: 'positivo',
              confianza: 0.9,
              respuestaSugerida: 'Hay horarios a las 09:00 y 10:00.',
            }),
        },
      };
      mockGenerateContent
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse);

      const result = await procesarMensajeConIA(
        'Que horarios hay el 5 de agosto?',
        { estado: 'INICIO', datos: {}, intentosAclaracion: 0 },
        ['Corte de cabello ($250)'],
        [],
        [],
        undefined,
        ejecutarHerramienta,
      );

      expect(ejecutarHerramienta).toHaveBeenCalledWith('consultar_disponibilidad', {
        fecha: '2026-08-05',
      });
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);

      const [firstCall, secondCall] = mockGenerateContent.mock.calls;
      expect(firstCall[0]).toEqual({
        contents: [{ role: 'user', parts: [{ text: expect.any(String) }] }],
        tools: herramientasCita,
        toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
      });

      const followUpContents = secondCall[0].contents;
      expect(followUpContents[0]).toEqual({
        role: 'user',
        parts: [{ text: expect.any(String) }],
      });
      expect(followUpContents[1]).toEqual({
        role: 'model',
        parts: [
          {
            functionCall: {
              name: 'consultar_disponibilidad',
              args: { fecha: '2026-08-05' },
            },
          },
        ],
      });
      expect(followUpContents[2]).toEqual({
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: 'consultar_disponibilidad',
              response: ['09:00', '10:00'],
            },
          },
        ],
      });

      expect(result.intencion).toBe('CONSULTAR');
      expect(result.respuestaSugerida).toBe('Hay horarios a las 09:00 y 10:00.');
    });

    it('should call generateContent with a plain string when no ejecutarHerramienta is provided', async () => {
      mockText.mockReturnValue(
        JSON.stringify({
          intencion: 'OTRO',
          entidades: {},
          sentimiento: 'neutral',
          confianza: 0.2,
        }),
      );
      mockGenerateContent.mockResolvedValue(mockResponse);

      await procesarMensajeConIA('hola', {
        estado: 'INICIO',
        datos: {},
        intentosAclaracion: 0,
      });

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(typeof mockGenerateContent.mock.calls[0][0]).toBe('string');
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
