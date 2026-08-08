import { apiClient } from '../../../lib/apiClient';

export interface AcceptInvitationResponse {
  ok: boolean;
  usuario: { id: number; nombre: string; email: string; rol: string };
}

export interface AcceptInvitationData {
  nombre: string;
  password: string;
}

export const aceptarInvitacion = (
  token: string,
  data: AcceptInvitationData,
): Promise<AcceptInvitationResponse> =>
  apiClient.post<AcceptInvitationResponse>('/invitaciones/aceptar', { token, ...data });
