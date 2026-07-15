import { Request, Response, NextFunction } from 'express';
import { horariosService } from '../services/horarios.service';

export const getHorarios = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const horarios = await horariosService.listarHorarios(req.negocioId!);
    res.json(horarios);
  } catch (error) {
    next(error);
  }
};

export const updateHorarios = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { horarios } = req.body as {
      horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>;
    };
    const created = await horariosService.replaceHorarios(req.negocioId!, horarios);
    res.json(created);
  } catch (error) {
    next(error);
  }
};

export const getEspeciales = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const especiales = await horariosService.listarEspeciales(req.negocioId!);
    res.json(especiales);
  } catch (error) {
    next(error);
  }
};

export const createEspecial = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { fecha, cerrado, horaInicio, horaFin } = req.body;
    const especial = await horariosService.crearEspecial(req.negocioId!, {
      fecha: new Date(fecha),
      cerrado,
      horaInicio,
      horaFin,
    });
    res.status(201).json(especial);
  } catch (error) {
    next(error);
  }
};

export const deleteEspecial = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await horariosService.eliminarEspecial(req.negocioId!, id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
