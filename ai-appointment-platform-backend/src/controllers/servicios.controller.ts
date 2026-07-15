import { Request, Response, NextFunction } from 'express';
import { serviciosService } from '../services/servicios.service';

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const servicios = await serviciosService.listarServicios(req.negocioId!);
    res.json(servicios);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const servicio = await serviciosService.crearServicio(req.negocioId!, req.body);
    res.status(201).json(servicio);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const servicio = await serviciosService.actualizarServicio(req.negocioId!, id, req.body);
    res.json(servicio);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await serviciosService.eliminarServicio(req.negocioId!, id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
