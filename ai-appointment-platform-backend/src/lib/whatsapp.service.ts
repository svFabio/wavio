import { Injectable } from '@nestjs/common';
import { enviarMensaje, enviarImagen, WaCredentials } from './whatsapp';

@Injectable()
export class WhatsAppService {
  async sendMessage(
    credentials: WaCredentials,
    to: string,
    message: string,
  ): Promise<{ success: true; waMessageId: string }> {
    return enviarMensaje(credentials, to, message);
  }

  async sendImage(
    credentials: WaCredentials,
    to: string,
    imageUrl: string,
    caption: string,
  ): Promise<{ success: true; waMessageId: string }> {
    return enviarImagen(credentials, to, imageUrl, caption);
  }
}
