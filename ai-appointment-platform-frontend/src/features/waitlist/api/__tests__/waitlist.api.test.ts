import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitlistApi } from '../waitlist.api';

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
const mockDelete = vi.mocked(apiClient.delete);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('waitlistApi.getWaitlist', () => {
  it('calls GET /waitlist', async () => {
    mockGet.mockResolvedValue([]);
    const result = await waitlistApi.getWaitlist();
    expect(mockGet).toHaveBeenCalledWith('/waitlist');
    expect(result).toEqual([]);
  });
});

describe('waitlistApi.addToWaitlist', () => {
  it('calls POST /waitlist with data', async () => {
    const payload = {
      clienteNombre: 'Juan Perez',
      clienteTelefono: '59170000000',
      fechaPreferida: '2026-02-01',
      horarioPreferido: '10:00',
    };
    const expectedResponse = {
      id: 1,
      ...payload,
      estado: 'PENDIENTE',
      creadoEn: '2026-01-15T00:00:00Z',
      notificadoEn: null,
      servicioId: null,
    };
    mockPost.mockResolvedValue(expectedResponse);
    const result = await waitlistApi.addToWaitlist(payload);
    expect(mockPost).toHaveBeenCalledWith('/waitlist', payload);
    expect(result).toEqual(expectedResponse);
  });
});

describe('waitlistApi.removeFromWaitlist', () => {
  it('calls DELETE /waitlist/:id', async () => {
    mockDelete.mockResolvedValue({});
    await waitlistApi.removeFromWaitlist(1);
    expect(mockDelete).toHaveBeenCalledWith('/waitlist/1');
  });
});

describe('waitlistApi.notifyWaitlist', () => {
  it('calls POST /waitlist/:id/notify', async () => {
    mockPost.mockResolvedValue({});
    await waitlistApi.notifyWaitlist(1);
    expect(mockPost).toHaveBeenCalledWith('/waitlist/1/notify');
  });
});
