import { Router } from 'express';
import { z } from 'zod';
import { verificarToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { validateBody } from '../middleware/validate';
import { paginate } from '../middleware/pagination';
import { clientesController } from '../controllers/clientes.controller';

const router = Router();
router.use(verificarToken, tenantMiddleware);

const createClienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  telefono: z.string().min(1, 'El telefono es requerido'),
  email: z.string().email('Email invalido').optional(),
  notas: z.string().optional(),
});

const updateClienteSchema = z.object({
  nombre: z.string().min(1).optional(),
  email: z.string().email('Email invalido').optional(),
  notas: z.string().optional(),
});

router.get('/', paginate, clientesController.getAll);
router.get('/:id', clientesController.getById);
router.post('/', validateBody(createClienteSchema), clientesController.create);
router.put('/:id', validateBody(updateClienteSchema), clientesController.update);
router.delete('/:id', clientesController.remove);

export default router;
