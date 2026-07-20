import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatRepository } from '../repositories/chat.repository';
import { NegocioModule } from '../negocio/negocio.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [NegocioModule, EventsModule],
  controllers: [ChatController],
  providers: [ChatRepository, ChatService],
  exports: [ChatService, ChatRepository],
})
export class ChatModule {}
