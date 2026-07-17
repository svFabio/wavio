import { Module } from '@nestjs/common';
import { WhatsAppController } from './whatsapp.controller';
import { StripeController } from './stripe.controller';
import { WebhookService } from './webhook.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AppConfigModule } from '../config/config.module';
import { ChatModule } from '../chat/chat.module';
import { NegocioModule } from '../negocio/negocio.module';
import { ServiciosModule } from '../servicios/servicios.module';
import { CitasModule } from '../citas/citas.module';

@Module({
  imports: [PrismaModule, AppConfigModule, ChatModule, NegocioModule, ServiciosModule, CitasModule],
  controllers: [WhatsAppController, StripeController],
  providers: [WebhookService],
})
export class WebhookModule {}
