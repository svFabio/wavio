import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { verificarToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { validateBody } from '../middleware/validate';
import { serviciosRepository } from '../repositories/servicios.repository';
import { AppError } from '../domain/errors';

const router = Router();
router.use(verificarToken, tenantMiddleware);

const createServicioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  duracionMinutos: z.number().int().min(15, 'Duración mínima 15 minutos').max(480).optional(),
  bufferMinutos: z.number().int().min(0).max(120).optional(),
  precio: z.number().min(0).optional(),
});

const updateServicioSchema = z.object({
  nombre: z.string().min(1).optional(),
  duracionMinutos: z.number().int().min(15).max(480).optional(),
  bufferMinutos: z.number().int().min(0).max(120).optional(),
  precio: z.number().min(0).optional(),
  activo: z.boolean().optional(),
});

// GET /api/v1/servicios
const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const servicios = await serviciosRepository.findByNegocioId(req.negocioId!);
    res.json(servicios);
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/servicios
const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const servicio = await serviciosRepository.create({
      negocioId: req.negocioId!,
      ...req.body,
    });
    res.status(201).json(servicio);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/servicios/:id
const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const existing = await serviciosRepository.findById(id);
    if (!existing || existing.negocioId !== req.negocioId) {
      throw new AppError('Servicio no encontrado', 404, 'SERVICIO_NOT_FOUND');
    }
    const servicio = await serviciosRepository.update(id, req.body);
    res.json(servicio);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/servicios/:id
const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const existing = await serviciosRepository.findById(id);
    if (!existing || existing.negocioId !== req.negocioId) {
      throw new AppError('Servicio no encontrado', 404, 'SERVICIO_NOT_FOUND');
    }
    await serviciosRepository.softDelete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

router.get('/', getAll);
router.post('/', validateBody(createServicioSchema), create);
router.patch('/:id', validateBody(updateServicioSchema), update);
router.delete('/:id', remove);

export default router;
