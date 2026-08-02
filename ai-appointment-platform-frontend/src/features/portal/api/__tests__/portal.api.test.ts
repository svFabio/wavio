import { describe, it, expect, vi, beforeEach } from 'vitest';
import { portalApi } from '../portal.api';

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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('portalApi.generateMagicLink', () => {
  it('calls POST /portal/generate/:id', async () => {
    mockPost.mockResolvedValue({ url: 'http://test.com/portal/abc', token: 'abc' });
    const result = await portalApi.generateMagicLink(1);
    expect(mockPost).toHaveBeenCalledWith('/portal/generate/1');
    expect(result).toEqual({ url: 'http://test.com/portal/abc', token: 'abc' });
  });
});

describe('portalApi.validateMagicLink', () => {
  it('calls GET /portal/:token', async () => {
    const data = {
      cliente: { id: 1, nombre: 'Juan', telefono: '59170000000', email: null },
      negocio: { id: 1, nombre: 'Mi Negocio' },
    };
    mockGet.mockResolvedValue(data);
    const result = await portalApi.validateMagicLink('valid-token');
    expect(mockGet).toHaveBeenCalledWith('/portal/valid-token');
    expect(result).toEqual(data);
  });
});

describe('portalApi.getPortalAppointments', () => {
  it('calls GET /portal/:token/appointments', async () => {
    mockGet.mockResolvedValue([]);
    await portalApi.getPortalAppointments('token');
    expect(mockGet).toHaveBeenCalledWith('/portal/token/appointments');
  });
});

describe('portalApi.getPortalServices', () => {
  it('calls GET /portal/:token/services', async () => {
    mockGet.mockResolvedValue([]);
    await portalApi.getPortalServices('token');
    expect(mockGet).toHaveBeenCalledWith('/portal/token/services');
  });
});

describe('portalApi.getPortalAvailableSlots', () => {
  it('calls GET with fecha param', async () => {
    mockGet.mockResolvedValue([]);
    await portalApi.getPortalAvailableSlots('token', '2026-02-01');
    expect(mockGet).toHaveBeenCalledWith('/portal/token/available-slots?fecha=2026-02-01');
  });

  it('includes servicioId when provided', async () => {
    mockGet.mockResolvedValue([]);
    await portalApi.getPortalAvailableSlots('token', '2026-02-01', 5);
    expect(mockGet).toHaveBeenCalledWith(
      '/portal/token/available-slots?fecha=2026-02-01&servicioId=5',
    );
  });
});

describe('portalApi.bookPortalAppointment', () => {
  it('calls POST /portal/:token/book', async () => {
    mockPost.mockResolvedValue({ success: true, message: 'Cita agendada' });
    const result = await portalApi.bookPortalAppointment('token', {
      fecha: '2026-02-01',
      horario: '10:00',
    });
    expect(mockPost).toHaveBeenCalledWith('/portal/token/book', {
      fecha: '2026-02-01',
      horario: '10:00',
    });
    expect(result).toEqual({ success: true, message: 'Cita agendada' });
  });
});
