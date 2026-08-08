import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invitationsApi } from '../invitations.api';

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

describe('invitationsApi.getInvitations', () => {
  it('calls GET /invitaciones and returns the plain array (no envelope unwrap)', async () => {
    const invitations = [
      {
        id: 1,
        email: 'invitado@test.com',
        rol: 'STAFF',
        estado: 'PENDIENTE',
        expiraEn: '2026-01-03T00:00:00Z',
        creadoEn: '2026-01-01T00:00:00Z',
      },
    ];
    mockGet.mockResolvedValue(invitations);
    const result = await invitationsApi.getInvitations();
    expect(mockGet).toHaveBeenCalledWith('/invitaciones');
    expect(result).toEqual(invitations);
  });

  it('passes the estado query param when provided', async () => {
    mockGet.mockResolvedValue([]);
    await invitationsApi.getInvitations('PENDIENTE');
    expect(mockGet).toHaveBeenCalledWith('/invitaciones?estado=PENDIENTE');
  });
});

describe('invitationsApi.createInvitation', () => {
  it('calls POST /invitaciones with data', async () => {
    mockPost.mockResolvedValue({ url: 'http://localhost:3000/api/v1/invitaciones/aceptar/tok' });
    const data = { email: 'nuevo@test.com', rol: 'STAFF' as const };
    const result = await invitationsApi.createInvitation(data);
    expect(mockPost).toHaveBeenCalledWith('/invitaciones', data);
    expect(result).toEqual({ url: 'http://localhost:3000/api/v1/invitaciones/aceptar/tok' });
  });
});

describe('invitationsApi.resendInvitation', () => {
  it('calls POST /invitaciones/:id/reenviar', async () => {
    mockPost.mockResolvedValue({
      url: 'http://localhost:3000/api/v1/invitaciones/aceptar/tok2',
      expiraEn: '2026-01-05T00:00:00Z',
    });
    const result = await invitationsApi.resendInvitation(7);
    expect(mockPost).toHaveBeenCalledWith('/invitaciones/7/reenviar');
    expect(result.expiraEn).toBe('2026-01-05T00:00:00Z');
  });
});

describe('invitationsApi.cancelInvitation', () => {
  it('calls POST /invitaciones/:id/cancelar', async () => {
    mockPost.mockResolvedValue({ id: 7, estado: 'CANCELADA' });
    const result = await invitationsApi.cancelInvitation(7);
    expect(mockPost).toHaveBeenCalledWith('/invitaciones/7/cancelar');
    expect(result).toEqual({ id: 7, estado: 'CANCELADA' });
  });
});
