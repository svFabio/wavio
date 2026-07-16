import { Request, Response, NextFunction } from 'express';
import { clientesService } from '../services/clientes.service';

export const clientesController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = req.pagination!;
      const result = await clientesService.listarClientes(req.negocioId!, page, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const cliente = await clientesService.obtenerCliente(req.negocioId!, id);
      res.json(cliente);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cliente = await clientesService.crearCliente(req.negocioId!, req.body);
      res.status(201).json(cliente);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const cliente = await clientesService.actualizarCliente(req.negocioId!, id, req.body);
      res.json(cliente);
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      await clientesService.eliminarCliente(req.negocioId!, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
