import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiError } from '../apiClient';

const BASE_URL = 'http://localhost:3000/api/v1';

describe('apiClient', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('sends GET request with correct headers', async () => {
    const mockData = { id: 1, name: 'Test' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      }),
    );

    const result = await apiClient.get('/citas');

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/citas`,
      expect.objectContaining({ method: 'GET' }),
    );

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');

    expect(result).toEqual(mockData);
  });

  it('sends Authorization header when token exists', async () => {
    localStorage.setItem('token', 'my-jwt');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

    await apiClient.get('/citas');

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer my-jwt');
  });

  it('does not set Content-Type for FormData bodies', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

    const formData = new FormData();
    formData.append('file', new Blob(), 'test.png');

    await apiClient.post('/upload', formData);

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.has('Content-Type')).toBe(false);
  });

  it('serializes JSON body for post requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ created: true }),
      }),
    );

    await apiClient.post('/citas', { title: 'Meeting' });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ title: 'Meeting' }));
  });

  it('throws ApiError on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Cita not found' }),
      }),
    );

    await expect(apiClient.get('/citas/999')).rejects.toThrow(ApiError);
  });

  it('clears token and dispatches unauthorized event on 401', async () => {
    localStorage.setItem('token', 'expired');
    const eventSpy = vi.spyOn(window, 'dispatchEvent');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({}),
      }),
    );

    await expect(apiClient.get('/citas')).rejects.toThrow(ApiError);

    expect(localStorage.getItem('token')).toBeNull();
    expect(eventSpy).toHaveBeenCalledWith(expect.any(Event));
    expect(eventSpy.mock.calls[0][0].type).toBe('unauthorized');
  });

  it('sets x-negocio-id header when activeNegocioId exists', async () => {
    localStorage.setItem('activeNegocioId', '42');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

    await apiClient.get('/citas');

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get('x-negocio-id')).toBe('42');
  });
});
