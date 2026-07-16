import { describe, it, expect, vi, beforeEach } from 'vitest';
import { citasService } from './citas.service';
import { NotFoundError, ValidationError } from '../domain/errors';

// Mock all repository and external dependencies used by citasService
vi.mock('../repositories/citas.repository', () => ({
  citasRepository: {
    getPendientes: vi.fn(),
    getByIdAndNegocio: vi.fn(),
    update: vi.fn(),
    getCitasCount: vi.fn(),
    getSumaIngresosHoy: vi.fn(),
    checkOcupado: vi.fn(),
    createIfSlotAvailable: vi.fn(),
    getAgenda: vi.fn(),
    getOcupadas: vi.fn(),
    getProximasCitas: vi.fn(),
    reprogramarIfSlotAvailable: vi.fn(),
  },
}));

vi.mock('../repositories/configuracion.repository', () => ({
  configuracionRepository: { findByNegocioId: vi.fn() },
}));

vi.mock('../repositories/chat.repository', () => ({
  chatRepository: { getUltimoMensajeEntrantePorTelefono: vi.fn() },
}));

vi.mock('../repositories/negocio.repository', () => ({
  negocioRepository: { findByIdForInternal: vi.fn() },
}));

vi.mock('../repositories/availability.repository', () => ({
  availabilityRepository: { getHorariosNegocio: vi.fn(), getHorariosEspeciales: vi.fn() },
}));

vi.mock('../lib/whatsapp', () => ({ enviarMensaje: vi.fn() }));
vi.mock('../lib/socket', () => ({
  getSocket: vi.fn(() => ({ to: vi.fn(() => ({ emit: vi.fn() })) })),
}));
vi.mock('./availability.service', () => ({ getSlotsDisponibles: vi.fn() }));

import { citasRepository } from '../repositories/citas.repository';

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeCita(overrides = {}) {
  return {
    id: 1,
    negocioId: 10,
    fecha: new Date('2026-08-01'),
    horario: '10:00',
    clienteNombre: 'Ana',
    clienteTelefono: '59170000001',
    servicio: 'Corte',
    monto: 100,
    estado: 'VALIDACION_PENDIENTE',
    estadoPago: 'PENDIENTE',
    comprobanteUrl: 'http://example.com/comp.jpg',
    descripcion: null,
    origen: 'virtual',
    recordatorio24h: false,
    recordatorio1h: false,
    encuestaEnviada: false,
    rating: null,
    comentario: null,
    creadoEn: new Date(),
    servicioId: null,
    duracionMinutos: 60,
    staffId: null,
    ...overrides,
  };
}

// ─── getResumen ────────────────────────────────────────────────────────────────

describe('citasService.getResumen', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns aggregated daily summary including real ingresos', async () => {
    vi.mocked(citasRepository.getCitasCount)
      .mockResolvedValueOnce(5) // totalHoy
      .mockResolvedValueOnce(2) // pendientes
      .mockResolvedValueOnce(3); // completadas
    vi.mocked(citasRepository.getSumaIngresosHoy).mockResolvedValueOnce(450);

    const result = await citasService.getResumen(10);

    expect(result).toEqual({ totalHoy: 5, pendientes: 2, completadas: 3, ingresos: 450 });
    expect(citasRepository.getSumaIngresosHoy).toHaveBeenCalledOnce();
  });

  it('returns ingresos as 0 when no confirmed citas exist', async () => {
    vi.mocked(citasRepository.getCitasCount).mockResolvedValue(0);
    vi.mocked(citasRepository.getSumaIngresosHoy).mockResolvedValueOnce(0);

    const result = await citasService.getResumen(10);

    expect(result.ingresos).toBe(0);
  });
});

// ─── validarCita ──────────────────────────────────────────────────────────────

describe('citasService.validarCita', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws ValidationError for invalid accion', async () => {
    await expect(citasService.validarCita(1, 10, 'DESCONOCIDA')).rejects.toThrow(ValidationError);
  });

  it('throws NotFoundError when cita does not belong to negocio', async () => {
    vi.mocked(citasRepository.getByIdAndNegocio).mockResolvedValueOnce(null as any);
    await expect(citasService.validarCita(1, 10, 'CONFIRMAR')).rejects.toThrow(NotFoundError);
  });

  it('sets estado to CONFIRMADA on CONFIRMAR', async () => {
    const cita = makeCita();
    const updated = makeCita({ estado: 'CONFIRMADA' });
    vi.mocked(citasRepository.getByIdAndNegocio).mockResolvedValueOnce(cita as any);
    vi.mocked(citasRepository.update).mockResolvedValueOnce(updated as any);

    const result = await citasService.validarCita(1, 10, 'CONFIRMAR');

    expect(citasRepository.update).toHaveBeenCalledWith(1, { estado: 'CONFIRMADA' });
    expect(result.estado).toBe('CONFIRMADA');
  });

  it('sets estado to CANCELADA and clears comprobanteUrl on CANCELAR', async () => {
    const cita = makeCita();
    const updated = makeCita({ estado: 'CANCELADA', comprobanteUrl: null });
    vi.mocked(citasRepository.getByIdAndNegocio).mockResolvedValueOnce(cita as any);
    vi.mocked(citasRepository.update).mockResolvedValueOnce(updated as any);

    const result = await citasService.validarCita(1, 10, 'CANCELAR');

    expect(citasRepository.update).toHaveBeenCalledWith(1, {
      estado: 'CANCELADA',
      comprobanteUrl: null,
    });
    expect(result.estado).toBe('CANCELADA');
  });
});

// ─── getPendientes ─────────────────────────────────────────────────────────────

describe('citasService.getPendientes', () => {
  it('returns paginated data with correct totalPages', async () => {
    vi.mocked(citasRepository.getPendientes).mockResolvedValueOnce({
      data: [makeCita() as any],
      total: 10,
      page: 1,
      limit: 5,
    });

    const result = await citasService.getPendientes(10, 1, 5);

    expect(result.pagination.totalPages).toBe(2);
    expect(result.pagination.total).toBe(10);
    expect(result.data).toHaveLength(1);
  });
});
