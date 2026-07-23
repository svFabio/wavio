import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatRepository } from './chat.repository';
import { SesionChatRepository } from './sesion-chat.repository';
import { NegocioModule } from '../negocio/negocio.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [NegocioModule, EventsModule],
  controllers: [ChatController],
  providers: [ChatRepository, ChatService, SesionChatRepository],
  exports: [ChatService, ChatRepository, SesionChatRepository],
})
export class ChatModule {}
