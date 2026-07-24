import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Configuracion, ChatFlowStep } from '../domain/types';

function mapConfig(raw: Record<string, unknown>): Configuracion {
  return {
    id: raw.id as number,
    trigger: raw.trigger as string,
    mensajeBienvenida: raw.mensajeBienvenida as string,
    mensajeConfirmacion: raw.mensajeConfirmacion as string,
    qrContenido: raw.qrContenido as string,
    qrFotoUrl: (raw.qrFotoUrl as string) || null,
    cobrarAdelanto: raw.cobrarAdelanto as boolean,
    porcentajeAdelanto: raw.porcentajeAdelanto as number,
    timezone: raw.timezone as string,
    chatFlow: Array.isArray(raw.chatFlow) ? (raw.chatFlow as ChatFlowStep[]) : [],
    negocioId: raw.negocioId as number,
  };
}

@Injectable()
export class ConfiguracionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateByNegocioId(negocioId: number): Promise<Configuracion> {
    const config = await this.prisma.configuracion.upsert({
      where: { negocioId },
      update: {},
      create: { negocioId },
    });
    return mapConfig(config);
  }

  async upsert(negocioId: number, data: Record<string, unknown>): Promise<Configuracion> {
    const config = await this.prisma.configuracion.upsert({
      where: { negocioId },
      update: data,
      create: { negocioId, ...data },
    });
    return mapConfig(config);
  }
}
