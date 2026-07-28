import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test-setup';
import { citasApi } from '../citas.api';
import type { Cita } from '../../../../types';

const BASE = '*/api/v1';

const mockCita: Cita = {
  id: 'abc-123',
  clienteNombre: 'Juan Pérez',
  clienteTelefono: '1234567890',
  fecha: '2025-12-20',
  horario: '14:00',
  servicio: 'Corte',
  estado: 'CONFIRMADA',
  origen: 'virtual',
  creadoEn: '2025-12-01T00:00:00Z',
};

beforeEach(() => {
  localStorage.clear();
});

describe('citasApi.obtenerCitas', () => {
  it('returns the data array from /citas', async () => {
    server.use(
      http.get(`${BASE}/citas`, () => HttpResponse.json({ data: [mockCita], pagination: {} })),
    );
    const result = await citasApi.obtenerCitas();
    expect(result).toEqual([mockCita]);
  });

  it('passes fecha query param when provided', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/citas`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ data: [], pagination: {} });
      }),
    );
    await citasApi.obtenerCitas('2025-12-20');
    expect(capturedUrl).toContain('fecha=2025-12-20');
  });

  it('throws on network error', async () => {
    server.use(http.get(`${BASE}/citas`, () => HttpResponse.error()));
    await expect(citasApi.obtenerCitas()).rejects.toThrow();
  });
});

describe('citasApi.obtenerPendientes', () => {
  it('returns pending citas from /citas/pendientes', async () => {
    server.use(
      http.get(`${BASE}/citas/pendientes`, () =>
        HttpResponse.json({ data: [mockCita], pagination: {} }),
      ),
    );
    const result = await citasApi.obtenerPendientes();
    expect(result).toEqual([mockCita]);
  });
});

describe('citasApi.validarPago', () => {
  it('returns true on success APROBAR', async () => {
    server.use(http.post(`${BASE}/citas/:id/validar`, () => HttpResponse.json({ success: true })));
    const result = await citasApi.validarPago('abc-123', 'APROBAR');
    expect(result).toBe(true);
  });

  it('throws ApiError on non-ok response', async () => {
    server.use(
      http.post(`${BASE}/citas/:id/validar`, () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 }),
      ),
    );
    await expect(citasApi.validarPago('bad-id', 'RECHAZAR')).rejects.toThrow();
  });
});

describe('citasApi.obtenerHorariosDisponibles', () => {
  it('returns horarios array', async () => {
    server.use(
      http.get(`${BASE}/citas/horarios-disponibles`, () =>
        HttpResponse.json({ horarios: ['09:00', '10:00'] }),
      ),
    );
    const result = await citasApi.obtenerHorariosDisponibles('2025-12-20');
    expect(result).toEqual(['09:00', '10:00']);
  });

  it('returns empty array when horarios is missing', async () => {
    server.use(http.get(`${BASE}/citas/horarios-disponibles`, () => HttpResponse.json({})));
    const result = await citasApi.obtenerHorariosDisponibles('2025-12-20');
    expect(result).toEqual([]);
  });

  it('includes servicioId param when provided', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/citas/horarios-disponibles`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ horarios: [] });
      }),
    );
    await citasApi.obtenerHorariosDisponibles('2025-12-20', 5);
    expect(capturedUrl).toContain('servicioId=5');
  });
});

describe('citasApi.crearCitaAdmin', () => {
  const payload = {
    clienteNombre: 'Ana',
    clienteTelefono: '9876543210',
    fecha: '2025-12-21',
    horario: '11:00',
  };

  it('returns { success: true } on ok response', async () => {
    server.use(
      http.post(`${BASE}/citas/admin`, () =>
        HttpResponse.json({ id: 'new-cita' }, { status: 201 }),
      ),
    );
    const result = await citasApi.crearCitaAdmin(payload);
    expect(result).toEqual({ success: true });
  });

  it('returns { success: false, error } on ApiError', async () => {
    server.use(
      http.post(`${BASE}/citas/admin`, () =>
        HttpResponse.json({ error: 'Conflict' }, { status: 409 }),
      ),
    );
    const result = await citasApi.crearCitaAdmin(payload);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns { success: false } on network error', async () => {
    server.use(http.post(`${BASE}/citas/admin`, () => HttpResponse.error()));
    const result = await citasApi.crearCitaAdmin(payload);
    expect(result.success).toBe(false);
  });
});

describe('citasApi.reprogramarCita', () => {
  it('returns { success: true } on ok response', async () => {
    server.use(http.put(`${BASE}/citas/:id/reprogramar`, () => HttpResponse.json({ ok: true })));
    const result = await citasApi.reprogramarCita('abc-123', '2025-12-22', '15:00');
    expect(result).toEqual({ success: true });
  });

  it('returns { success: false } on error response', async () => {
    server.use(
      http.put(`${BASE}/citas/:id/reprogramar`, () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 }),
      ),
    );
    const result = await citasApi.reprogramarCita('bad-id', '2025-12-22', '15:00');
    expect(result.success).toBe(false);
  });
});

describe('citasApi.marcarNoAsistio', () => {
  it('returns { success: true } on ok response', async () => {
    server.use(http.put(`${BASE}/citas/:id/no-asistio`, () => HttpResponse.json({ ok: true })));
    const result = await citasApi.marcarNoAsistio('abc-123');
    expect(result).toEqual({ success: true });
  });

  it('returns { success: false } on error', async () => {
    server.use(
      http.put(`${BASE}/citas/:id/no-asistio`, () =>
        HttpResponse.json({ error: 'Bad request' }, { status: 400 }),
      ),
    );
    const result = await citasApi.marcarNoAsistio('abc-123');
    expect(result.success).toBe(false);
  });
});

describe('citasApi.marcarAsistio', () => {
  it('returns { success: true } on ok response', async () => {
    server.use(http.put(`${BASE}/citas/:id/asistio`, () => HttpResponse.json({ ok: true })));
    const result = await citasApi.marcarAsistio('abc-123');
    expect(result).toEqual({ success: true });
  });

  it('returns { success: false } on error', async () => {
    server.use(
      http.put(`${BASE}/citas/:id/asistio`, () =>
        HttpResponse.json({ error: 'Forbidden' }, { status: 403 }),
      ),
    );
    const result = await citasApi.marcarAsistio('abc-123');
    expect(result.success).toBe(false);
  });
});

describe('citasApi.actualizarDescripcion', () => {
  it('returns { success: true } on ok response', async () => {
    server.use(http.put(`${BASE}/citas/:id/descripcion`, () => HttpResponse.json({ ok: true })));
    const result = await citasApi.actualizarDescripcion('abc-123', 'Nueva descripción');
    expect(result).toEqual({ success: true });
  });

  it('returns { success: false } on error', async () => {
    server.use(
      http.put(`${BASE}/citas/:id/descripcion`, () =>
        HttpResponse.json({ error: 'Server error' }, { status: 500 }),
      ),
    );
    const result = await citasApi.actualizarDescripcion('abc-123', 'desc');
    expect(result.success).toBe(false);
  });
});
