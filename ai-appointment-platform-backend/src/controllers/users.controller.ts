import { Request, Response, NextFunction } from 'express';
import * as usuariosService from '../services/usuarios.service';
import pino from 'pino';

const logger = pino();

export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const negocioId = req.negocioId!;
        const usuarios = await usuariosService.getAllUsers(negocioId);
        res.json(usuarios);
    } catch (error) {
        logger.error({ err: error }, 'Error obteniendo usuarios');
        next(error);
    }
};

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const negocioId = req.negocioId!;
        const nuevoUsuario = await usuariosService.createUser(negocioId, req.body);
        res.status(201).json(nuevoUsuario);
    } catch (error) {
        logger.error({ err: error }, 'Error creando usuario');
        next(error);
    }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const negocioId = req.negocioId!;
        const { id } = req.params;
        const usuarioActualizado = await usuariosService.updateUser(negocioId, parseInt(String(id)), req.body);
        res.json(usuarioActualizado);
    } catch (error) {
        logger.error({ err: error }, 'Error actualizando usuario');
        next(error);
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const negocioId = req.negocioId!;
        const { id } = req.params;
        const requestingUserId = req.usuario?.id!;

        await usuariosService.deleteUser(negocioId, parseInt(String(id)), requestingUserId);
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        logger.error({ err: error }, 'Error eliminando usuario');
        next(error);
    }
};
