import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configuracionApi } from '../configuracion.api';

vi.mock('../../../../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '../../../../lib/apiClient';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const mockPut = vi.mocked(apiClient.put);
const mockPatch = vi.mocked(apiClient.patch);
const mockDelete = vi.mocked(apiClient.delete);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('configuracionApi', () => {
  describe('statusWhatsapp', () => {
    it('calls GET /whatsapp/status', async () => {
      mockGet.mockResolvedValue({ connected: true, phone: '123' });
      const result = await configuracionApi.statusWhatsapp();
      expect(mockGet).toHaveBeenCalledWith('/whatsapp/status');
      expect(result).toEqual({ connected: true, phone: '123' });
    });
  });

  describe('guardarCredencialesWhatsApp', () => {
    it('calls POST /whatsapp/save-credentials with body', async () => {
      mockPost.mockResolvedValue({ success: true });
      await configuracionApi.guardarCredencialesWhatsApp('tok', 'ph-id', 'waba-id');
      expect(mockPost).toHaveBeenCalledWith('/whatsapp/save-credentials', {
        waAccessToken: 'tok',
        waPhoneNumberId: 'ph-id',
        waWabaId: 'waba-id',
      });
    });
  });

  describe('desvincularWhatsApp', () => {
    it('calls POST /whatsapp/disconnect', async () => {
      mockPost.mockResolvedValue({ success: true });
      await configuracionApi.desvincularWhatsApp();
      expect(mockPost).toHaveBeenCalledWith('/whatsapp/disconnect');
    });
  });

  describe('getConfiguracion', () => {
    it('calls GET /configuracion', async () => {
      const fakeConfig = {
        id: 1,
        trigger: 'hola',
        mensajeBienvenida: 'Bienvenido',
        mensajeConfirmacion: 'OK',
        qrFotoUrl: null,
        cobrarAdelanto: false,
        porcentajeAdelanto: 0,
        timezone: 'America/Bogota',
        chatFlow: [],
      };
      mockGet.mockResolvedValue(fakeConfig);
      const result = await configuracionApi.getConfiguracion();
      expect(mockGet).toHaveBeenCalledWith('/configuracion');
      expect(result).toEqual(fakeConfig);
    });
  });

  describe('updateConfiguracion', () => {
    it('calls PATCH /configuracion with data', async () => {
      mockPatch.mockResolvedValue({});
      await configuracionApi.updateConfiguracion({ trigger: 'hola', cobrarAdelanto: true });
      expect(mockPatch).toHaveBeenCalledWith('/configuracion', {
        trigger: 'hola',
        cobrarAdelanto: true,
      });
    });
  });

  describe('uploadQR', () => {
    it('calls POST /configuracion/qr with imagen', async () => {
      mockPost.mockResolvedValue({ qrFotoUrl: 'https://example.com/qr.png' });
      const result = await configuracionApi.uploadQR('base64data');
      expect(mockPost).toHaveBeenCalledWith('/configuracion/qr', { imagen: 'base64data' });
      expect(result).toEqual({ qrFotoUrl: 'https://example.com/qr.png' });
    });
  });

  describe('configurarNegocio', () => {
    it('calls PATCH /negocio/configurar with nombre', async () => {
      mockPatch.mockResolvedValue({});
      await configuracionApi.configurarNegocio('Mi Negocio');
      expect(mockPatch).toHaveBeenCalledWith('/negocio/configurar', { nombre: 'Mi Negocio' });
    });
  });

  describe('getServicios', () => {
    it('calls GET /servicios', async () => {
      mockGet.mockResolvedValue([]);
      const result = await configuracionApi.getServicios();
      expect(mockGet).toHaveBeenCalledWith('/servicios');
      expect(result).toEqual([]);
    });
  });

  describe('createServicio', () => {
    it('calls POST /servicios with data', async () => {
      const newSvc = {
        id: 1,
        nombre: 'Corte',
        duracionMinutos: 30,
        bufferMinutos: 5,
        precio: 50,
        activo: true,
      };
      mockPost.mockResolvedValue(newSvc);
      const result = await configuracionApi.createServicio({
        nombre: 'Corte',
        duracionMinutos: 30,
        bufferMinutos: 5,
        precio: 50,
      });
      expect(mockPost).toHaveBeenCalledWith('/servicios', {
        nombre: 'Corte',
        duracionMinutos: 30,
        bufferMinutos: 5,
        precio: 50,
      });
      expect(result).toEqual(newSvc);
    });
  });

  describe('updateServicio', () => {
    it('calls PATCH /servicios/:id', async () => {
      mockPatch.mockResolvedValue({ id: 5, activo: false });
      await configuracionApi.updateServicio(5, { activo: false });
      expect(mockPatch).toHaveBeenCalledWith('/servicios/5', { activo: false });
    });
  });

  describe('deleteServicio', () => {
    it('calls DELETE /servicios/:id', async () => {
      mockDelete.mockResolvedValue({});
      await configuracionApi.deleteServicio(7);
      expect(mockDelete).toHaveBeenCalledWith('/servicios/7');
    });
  });

  describe('getHorariosNegocio', () => {
    it('calls GET /horarios', async () => {
      mockGet.mockResolvedValue([]);
      await configuracionApi.getHorariosNegocio();
      expect(mockGet).toHaveBeenCalledWith('/horarios');
    });
  });

  describe('updateHorariosNegocio', () => {
    it('calls PUT /horarios with horarios array', async () => {
      mockPut.mockResolvedValue({});
      const horarios = [{ diaSemana: 1, horaInicio: '09:00', horaFin: '18:00' }];
      await configuracionApi.updateHorariosNegocio(horarios);
      expect(mockPut).toHaveBeenCalledWith('/horarios', { horarios });
    });
  });

  describe('getHorariosEspeciales', () => {
    it('calls GET /horarios/especiales', async () => {
      mockGet.mockResolvedValue([]);
      await configuracionApi.getHorariosEspeciales();
      expect(mockGet).toHaveBeenCalledWith('/horarios/especiales');
    });
  });

  describe('createHorarioEspecial', () => {
    it('calls POST /horarios/especiales with data', async () => {
      const fake = { id: 1, fecha: '2026-12-25', cerrado: true, horaInicio: null, horaFin: null };
      mockPost.mockResolvedValue(fake);
      const result = await configuracionApi.createHorarioEspecial({
        fecha: '2026-12-25',
        cerrado: true,
      });
      expect(mockPost).toHaveBeenCalledWith('/horarios/especiales', {
        fecha: '2026-12-25',
        cerrado: true,
      });
      expect(result).toEqual(fake);
    });
  });

  describe('deleteHorarioEspecial', () => {
    it('calls DELETE /horarios/especiales/:id', async () => {
      mockDelete.mockResolvedValue({});
      await configuracionApi.deleteHorarioEspecial(3);
      expect(mockDelete).toHaveBeenCalledWith('/horarios/especiales/3');
    });
  });
});
