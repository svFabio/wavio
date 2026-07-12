import { statisticsRepository } from '../repositories/statistics.repository';
import { ValidationError } from '../domain/errors';

export const getOverview = async (negocioId: number) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const citasMes = await statisticsRepository.countCitasMes(negocioId, startOfMonth, endOfMonth);
    
    const citasConfirmadas = await statisticsRepository.getCitasConfirmadasMonto(negocioId, startOfMonth, endOfMonth);
    const ingresosMes = citasConfirmadas.reduce((sum, cita) => sum + cita.monto, 0);

    const clientesAgrupados = await statisticsRepository.getTopClientes(negocioId);
    const topClientes = clientesAgrupados.map(c => ({
        nombre: c.clienteNombre || 'Sin nombre',
        telefono: c.clienteTelefono,
        totalCitas: c.totalCitas
    }));

    const horariosAgrupados = await statisticsRepository.getHorariosPopulares(negocioId);
    const horariosPopulares = horariosAgrupados.map(h => ({
        horario: h.horario,
        totalReservas: h._count.id
    }));

    const ratingPromedio = await statisticsRepository.getRatingPromedio(negocioId);
    const ultimosComentarios = await statisticsRepository.getUltimosComentarios(negocioId);

    const citasVirtuales = await statisticsRepository.countCitasPorOrigen(negocioId, startOfMonth, endOfMonth, 'virtual');
    const citasPresenciales = await statisticsRepository.countCitasPorOrigen(negocioId, startOfMonth, endOfMonth, 'presencial');

    return { citasMes, ingresosMes, topClientes, horariosPopulares, citasVirtuales, citasPresenciales, ratingPromedio, ultimosComentarios };
};

export const getRevenue = async (negocioId: number, months: number) => {
    if (!months || months < 1 || months > 120) {
        throw new ValidationError('Months debe ser un número entre 1 y 120');
    }
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const citas = await statisticsRepository.getCitasIngresos(negocioId, startDate);

    const revenueByMonth: Record<string, number> = {};
    citas.forEach(cita => {
        const monthKey = `${cita.fecha.getFullYear()}-${String(cita.fecha.getMonth() + 1).padStart(2, '0')}`;
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + cita.monto;
    });

    const revenue = Object.entries(revenueByMonth)
        .map(([mes, total]) => ({ mes, total }))
        .sort((a, b) => a.mes.localeCompare(b.mes));

    return { revenue };
};
