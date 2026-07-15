import { Request, Response, NextFunction } from 'express';
import { configuracionService } from '../services/configuracion.service';
import { uploadBase64Image } from '../lib/cloudinary';
import { ValidationError } from '../domain/errors';

export const getConfiguracion = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await configuracionService.getConfiguracion(req.negocioId!);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const updateConfiguracion = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await configuracionService.updateConfiguracion(req.negocioId!, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const uploadQR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { imagen } = req.body;
    if (!imagen || typeof imagen !== 'string') {
      throw new ValidationError('imagen es requerida y debe ser un string base64');
    }

    const qrFotoUrl = await uploadBase64Image(imagen, `wavio/qr/${req.negocioId}`);

    const result = await configuracionService.updateConfiguracion(req.negocioId!, {
      qrFotoUrl,
    });

    res.json({ qrFotoUrl: result.qrFotoUrl });
  } catch (error) {
    next(error);
  }
};
