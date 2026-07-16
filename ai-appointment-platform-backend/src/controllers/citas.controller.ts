import { Request, Response, NextFunction } from 'express';
import { citasService } from '../services/citas.service';

export const getPendientes = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit } = req.pagination!;
    const result = await citasService.getPendientes(req.negocioId!, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const validarCita = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await citasService.validarCita(
      parseInt(String(req.params.id)),
      req.negocioId!,
      req.body.accion,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getAgenda = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit } = req.pagination!;
    const query = req.validatedQuery ?? req.query;

    let desde = query.desde as string | undefined;
    let hasta = query.hasta as string | undefined;

    if (query.fecha && !desde && !hasta) {
      desde = `${query.fecha}T00:00:00.000Z`;
      hasta = `${query.fecha}T23:59:59.999Z`;
    }

    const result = await citasService.getAgenda(req.negocioId!, desde, hasta, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getResumen = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await citasService.getResumen(req.negocioId!);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getHorariosDisponibles = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await citasService.getHorariosDisponibles(
      req.negocioId!,
      req.query.fecha as string,
      req.query.servicioId ? Number(req.query.servicioId) : undefined,
    );
    res.json({ horarios: result });
  } catch (error) {
    next(error);
  }
};

export const crearCitaAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await citasService.crearCitaAdmin(req.negocioId!, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const reprogramarCita = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await citasService.reprogramarCita(
      parseInt(String(req.params.id)),
      req.negocioId!,
      req.body.fecha,
      req.body.horario,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const marcarNoAsistio = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await citasService.cambiarEstado(
      parseInt(String(req.params.id)),
      req.negocioId!,
      'NO_ASISTIO',
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const marcarAsistio = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await citasService.cambiarEstado(
      parseInt(String(req.params.id)),
      req.negocioId!,
      'CONFIRMADA',
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const actualizarDescripcion = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await citasService.actualizarDescripcion(
      parseInt(String(req.params.id)),
      req.negocioId!,
      req.body.descripcion,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};
