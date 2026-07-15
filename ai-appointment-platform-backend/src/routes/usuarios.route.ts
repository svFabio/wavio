import { Router } from 'express';
import { requireAdmin } from '../middleware/permissions.middleware';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/usuarios.controller';
import { verificarToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { paginate } from '../middleware/pagination';

const router = Router();

// Todas las rutas requieren auth + tenant + rol ADMIN
router.use(verificarToken, tenantMiddleware, requireAdmin);

router.get('/', paginate, getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
