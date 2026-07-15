import { Router } from 'express';
import { z } from 'zod';
import { verificarToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { validateBody } from '../middleware/validate';
import {
  getHorarios,
  updateHorarios,
  getEspeciales,
  createEspecial,
  deleteEspecial,
} from '../controllers/horarios.controller';

const router = Router();
router.use(verificarToken, tenantMiddleware);

const updateHorariosSchema = z.object({
  horarios: z.array(
    z.object({
      diaSemana: z.number().int().min(0).max(6),
      horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm'),
      horaFin: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm'),
    }),
  ),
});

const createEspecialSchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  cerrado: z.boolean(),
  horaInicio: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  horaFin: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
});

router.get('/', getHorarios);
router.put('/', validateBody(updateHorariosSchema), updateHorarios);
router.get('/especiales', getEspeciales);
router.post('/especiales', validateBody(createEspecialSchema), createEspecial);
router.delete('/especiales/:id', deleteEspecial);

export default router;
