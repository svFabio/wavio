import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chat.service';

export const getConversaciones = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit } = req.pagination!;
    const result = await chatService.getConversaciones(req.negocioId!, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getMensajes = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit } = req.pagination!;
    const result = await chatService.getMensajes(
      req.negocioId!,
      String(req.params.jid),
      page,
      limit,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const sendMensaje = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await chatService.sendMensaje(
      req.negocioId!,
      String(req.params.jid),
      req.body.texto,
    );
    res.json(result);
  } catch (error) {
    // Here we can map internal service errors to HTTP 503 if they are WhatsApp connection issues
    // but for now relying on the standard error handler is better
    next(error);
  }
};

export const deleteConversacion = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await chatService.deleteConversacion(req.negocioId!, String(req.params.jid));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
