import { Module } from '@nestjs/common';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { PortalRepository } from './portal.repository';

@Module({
  controllers: [PortalController],
  providers: [PortalService, PortalRepository],
  exports: [PortalService],
})
export class PortalModule {}
