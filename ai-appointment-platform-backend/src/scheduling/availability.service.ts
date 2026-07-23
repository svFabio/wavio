import { Injectable } from '@nestjs/common';
import { AvailabilityRepository } from '../repositories/availability.repository';
import { getSlotsDisponibles } from './availability-engine';
import type { Slot } from './availability-engine';

@Injectable()
export class AvailabilityService {
  constructor(private readonly availabilityRepository: AvailabilityRepository) {}

  async getSlotsDisponibles(params: {
    negocioId: number;
    servicioId: number;
    fecha: string;
  }): Promise<Slot[]> {
    return getSlotsDisponibles(this.availabilityRepository, params);
  }
}
