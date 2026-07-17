import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AppConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ServiciosModule } from './servicios/servicios.module';
import { ClientesModule } from './clientes/clientes.module';
import { NegocioModule } from './negocio/negocio.module';
import { CitasModule } from './citas/citas.module';
import { EventsModule } from './events/events.module';
import { ChatModule } from './chat/chat.module';
import { WebhookModule } from './webhooks/webhook.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [PrismaModule, AppConfigModule, HealthModule, AuthModule, UsuariosModule, ServiciosModule, ClientesModule, NegocioModule, CitasModule, EventsModule, ChatModule, WebhookModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
