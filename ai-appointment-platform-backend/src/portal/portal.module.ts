import { Module } from '@nestjs/common';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { PortalRepository } from '../repositories/portal.repository';

@Module({
  controllers: [PortalController],
  providers: [PortalService, PortalRepository],
  exports: [PortalService],
})
export class PortalModule {}
