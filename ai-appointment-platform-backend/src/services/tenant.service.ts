import { usuarioNegocioRepository } from '../repositories/usuarioNegocio.repository';

export const tenantService = {
  async verificarMembresia(
    usuarioId: number,
    negocioId: number,
  ): Promise<{ usuarioId: number; negocioId: number; rol: string } | null> {
    return usuarioNegocioRepository.findByUsuarioIdAndNegocioId(usuarioId, negocioId);
  },
};
