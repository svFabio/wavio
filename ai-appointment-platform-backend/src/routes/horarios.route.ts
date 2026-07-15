import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { verificarToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { validateBody } from '../middleware/validate';
import { horariosNegocioRepository } from '../repositories/horariosNegocio.repository';
import { horariosEspecialesRepository } from '../repositories/horariosEspeciales.repository';

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

// ── HORARIOS NEGOCIO ────────────────────────────────────────────────────────

// GET /api/v1/horarios
const getHorarios = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const horarios = await horariosNegocioRepository.findByNegocioId(req.negocioId!);
    res.json(horarios);
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/horarios — bulk replace all horarios for a negocio
const updateHorarios = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const negocioId = req.negocioId!;
    const { horarios } = req.body as {
      horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>;
    };

    // Delete existing, then re-create
    await horariosNegocioRepository.deleteByNegocioId(negocioId);

    const created = await Promise.all(
      horarios.map((h) =>
        horariosNegocioRepository.upsert(negocioId, h.diaSemana, h.horaInicio, h.horaFin),
      ),
    );

    res.json(created);
  } catch (error) {
    next(error);
  }
};

// ── HORARIOS ESPECIALES ─────────────────────────────────────────────────────

// GET /api/v1/horarios/especiales
const getEspeciales = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const especiales = await horariosEspecialesRepository.findByNegocioId(req.negocioId!);
    res.json(especiales);
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/horarios/especiales
const createEspecial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fecha, cerrado, horaInicio, horaFin } = req.body;
    const fechaDate = new Date(fecha);
    const existing = await horariosEspecialesRepository.findByNegocioIdYFecha(
      req.negocioId!,
      fechaDate,
    );

    let especial;
    if (existing) {
      await horariosEspecialesRepository.deleteById(existing.id);
    }
    especial = await horariosEspecialesRepository.create({
      negocioId: req.negocioId!,
      fecha: fechaDate,
      cerrado,
      horaInicio: horaInicio ?? undefined,
      horaFin: horaFin ?? undefined,
    });
    res.status(201).json(especial);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/horarios/especiales/:id
const deleteEspecial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await horariosEspecialesRepository.deleteById(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

router.get('/', getHorarios);
router.put('/', validateBody(updateHorariosSchema), updateHorarios);
router.get('/especiales', getEspeciales);
router.post('/especiales', validateBody(createEspecialSchema), createEspecial);
router.delete('/especiales/:id', deleteEspecial);

export default router;
