import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { verificarToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { validateBody } from '../middleware/validate';
import { clientesService } from '../services/clientes.service';

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

const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientes = await clientesService.listarClientes(req.negocioId!);
    res.json(clientes);
  } catch (error) {
    next(error);
  }
};

const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const cliente = await clientesService.obtenerCliente(req.negocioId!, id);
    res.json(cliente);
  } catch (error) {
    next(error);
  }
};

const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cliente = await clientesService.crearCliente(req.negocioId!, req.body);
    res.status(201).json(cliente);
  } catch (error) {
    next(error);
  }
};

const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const cliente = await clientesService.actualizarCliente(req.negocioId!, id, req.body);
    res.json(cliente);
  } catch (error) {
    next(error);
  }
};

const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await clientesService.eliminarCliente(req.negocioId!, id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', validateBody(createClienteSchema), create);
router.put('/:id', validateBody(updateClienteSchema), update);
router.delete('/:id', remove);

export default router;
