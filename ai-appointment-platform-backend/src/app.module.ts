import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';
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
import { StatisticsModule } from './statistics/statistics.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AppConfigModule,
    HealthModule,
    AuthModule,
    UsuariosModule,
    ServiciosModule,
    ClientesModule,
    NegocioModule,
    CitasModule,
    EventsModule,
    ChatModule,
    WebhookModule,
    StatisticsModule,
    SchedulingModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
