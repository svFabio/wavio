import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Negocio } from '../domain/types';
import { NEGOCIO_SAFE_SELECT } from './negocio-select';

@Injectable()
export class NegocioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByWaPhoneNumberId(
    waPhoneNumberId: string,
  ): Promise<(Omit<Negocio, 'waAccessToken' | 'geminiApiKey'> & { configuracion: unknown }) | null> {
    const negocio = await this.prisma.negocio.findUnique({
      where: { waPhoneNumberId },
      select: { ...NEGOCIO_SAFE_SELECT, configuracion: true },
    });
    return negocio;
  }

  async findByWaPhoneNumberIdForInternal(waPhoneNumberId: string): Promise<Negocio | null> {
    const negocio = await this.prisma.negocio.findUnique({
      where: { waPhoneNumberId },
      select: { ...NEGOCIO_SAFE_SELECT, waAccessToken: true, geminiApiKey: true, configuracion: true },
    });
    return negocio;
  }

  async findById(id: number): Promise<Omit<Negocio, 'waAccessToken' | 'geminiApiKey'> | null> {
    const negocio = await this.prisma.negocio.findUnique({
      where: { id },
      select: NEGOCIO_SAFE_SELECT,
    });
    return negocio;
  }

  async findByIdForInternal(id: number): Promise<Negocio | null> {
    return this.prisma.negocio.findUnique({
      where: { id },
      select: { ...NEGOCIO_SAFE_SELECT, waAccessToken: true, geminiApiKey: true },
    });
  }

  async update(id: number, data: Record<string, unknown>): Promise<Omit<Negocio, 'waAccessToken' | 'geminiApiKey'>> {
    const negocio = await this.prisma.negocio.update({
      where: { id },
      data,
      select: NEGOCIO_SAFE_SELECT,
    });
    return negocio;
  }

  async getActiveBusinessIds(): Promise<number[]> {
    const result = await this.prisma.negocio.findMany({
      select: { id: true },
    });
    return result.map((n) => n.id);
  }
}
