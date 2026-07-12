import { negocioRepository } from '../repositories/negocio.repository';
import { ValidationError, NotFoundError } from '../domain/errors';

export const configurarNegocio = async (negocioId: number, nombre: string) => {
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
        throw new ValidationError('El nombre del negocio es inválido');
    }

    const negocio = await negocioRepository.update(negocioId, { nombre: nombre.trim() });
    if (!negocio) {
        throw new NotFoundError('Negocio');
    }

    return negocio;
};
