import { Router } from 'express';
import { z } from 'zod';
import {
  getPendientes,
  validarCita,
  getAgenda,
  getResumen,
  getHorariosDisponibles,
  crearCitaAdmin,
  reprogramarCita,
  marcarNoAsistio,
  marcarAsistio,
  actualizarDescripcion,
} from '../controllers/citas.controller';
import { verificarToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { validateBody, validateQuery } from '../middleware/validate';
import { paginate } from '../middleware/pagination';

const router = Router();

// Zod schemas
const validarCitaSchema = z.object({
  accion: z.enum(['CONFIRMAR', 'APROBAR', 'CANCELAR', 'RECHAZAR'], {
    error: 'Acción inválida. Valores permitidos: CONFIRMAR, APROBAR, CANCELAR, RECHAZAR',
  }),
});

const crearCitaAdminSchema = z.object({
  clienteNombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  clienteTelefono: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos numéricos'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  horario: z.string().min(1, 'El horario es requerido'),
  monto: z.number().min(0, 'El monto no puede ser negativo').optional(),
});

const reprogramarCitaSchema = z.object({
  fecha: z.string({ message: 'La fecha es requerida' }),
  horario: z.string({ message: 'El horario es requerido' }),
});

const actualizarDescripcionSchema = z.object({
  descripcion: z.string().optional(),
});

const agendaQuerySchema = z.object({
  desde: z.string().datetime().optional(),
  hasta: z.string().datetime().optional(),
});

router.use(verificarToken, tenantMiddleware);

router.get('/', validateQuery(agendaQuerySchema), paginate, getAgenda);
router.get('/pendientes', paginate, getPendientes);
router.get('/resumen', getResumen);
router.get('/horarios-disponibles', getHorariosDisponibles);
router.post('/admin', validateBody(crearCitaAdminSchema), crearCitaAdmin);
router.post('/:id/validar', validateBody(validarCitaSchema), validarCita);
router.put('/:id/reprogramar', validateBody(reprogramarCitaSchema), reprogramarCita);
router.put('/:id/no-asistio', marcarNoAsistio);
router.put('/:id/asistio', marcarAsistio);
router.put('/:id/descripcion', validateBody(actualizarDescripcionSchema), actualizarDescripcion);

export default router;
