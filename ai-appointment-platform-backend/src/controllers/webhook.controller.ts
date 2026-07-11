import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { enviarMensaje } from '../services/metaGraph.service';
import { evaluarIntencion, procesarMensajeConIA, detectarIntencionSimple, ContextoConversacion } from '../services/aiService';
// TODO: Import the specific appointment logic functions once refactored, for now we will just log and reply.

// Token de verificación configurado en el panel de Meta (App Dashboard)
const WEBHOOK_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'mi_token_secreto_wavio';

/**
 * GET /api/webhooks/whatsapp
 * Meta usa este endpoint para verificar que somos los dueños del webhook.
 */
export const verifyWebhook = (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
            console.log('✅ Webhook verificado por Meta!');
            return res.status(200).send(challenge);
        } else {
            console.error('❌ Falló la verificación del Webhook de Meta');
            return res.sendStatus(403);
        }
    }
    return res.sendStatus(400);
};

/**
 * POST /api/webhooks/whatsapp
 * Recibe todos los mensajes y eventos de estado de WhatsApp para todos los negocios.
 */
export const handleWebhook = async (req: Request, res: Response) => {
    // Retornamos 200 OK inmediatamente para evitar que Meta reintente.
    // En el futuro, esto se debería encolar en RabbitMQ/BullMQ.
    res.sendStatus(200);

    try {
        const body = req.body;

        if (body.object === 'whatsapp_business_account') {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    const value = change.value;

                    // Si es un mensaje entrante
                    if (value.messages && value.messages.length > 0) {
                        const message = value.messages[0];
                        const phoneNumberId = value.metadata.phone_number_id;
                        const from = message.from; // Número del paciente/cliente
                        
                        // Solo procesar mensajes de texto por ahora
                        if (message.type !== 'text') continue;
                        const text = message.text.body;
                        const waMessageId = message.id;

                        // 1. Identificar a qué Negocio pertenece este phoneNumberId
                        const negocio = await prisma.negocio.findUnique({
                            where: { waPhoneNumberId: phoneNumberId },
                            include: { configuracion: true }
                        });

                        if (!negocio) {
                            console.warn(`[Webhook] Mensaje recibido para un phoneNumberId no registrado: ${phoneNumberId}`);
                            continue;
                        }

                        // 2. Guardar el mensaje entrante en la BD
                        const nuevoMensaje = await prisma.mensajeChat.create({
                            data: {
                                remoteJid: from,
                                contenido: text,
                                direccion: 'ENTRANTE',
                                waMessageId: waMessageId,
                                estadoEntrega: 'entregado',
                                negocioId: negocio.id
                            }
                        });
                        
                        // Emitir socket para actualizar el frontend en la sala del negocio
                        const io = req.app.get('io');
                        if (io) {
                            io.to(negocio.id.toString()).emit('nuevo-mensaje', nuevoMensaje);
                        }
                        
                        console.log(`[Webhook] Mensaje recibido: Negocio=${negocio.nombre}, De=${from}, Texto=${text}`);
                        
                        // 3. Procesar el mensaje con IA
                        const contexto: ContextoConversacion = { estado: 'INICIO', datos: {}, intentosAclaracion: 0 };
                        const resultadoIA = await procesarMensajeConIA(text, contexto);
                        
                        if (resultadoIA.intencion === 'AGENDAR') {
                            await enviarMensaje(negocio.id, from, "¡Perfecto! Vamos a agendar tu cita. ¿Para qué fecha te gustaría?");
                        } else if (resultadoIA.respuestaSugerida) {
                            await enviarMensaje(negocio.id, from, resultadoIA.respuestaSugerida);
                        } else {
                            await enviarMensaje(negocio.id, from, "He recibido tu mensaje.");
                        }

                    }
                    
                    // Si es una actualización de estado de mensaje (entregado, leído, fallido)
                    if (value.statuses && value.statuses.length > 0) {
                        const status = value.statuses[0];
                        const waMessageId = status.id;
                        const messageStatus = status.status; // sent, delivered, read, failed
                        
                        // Actualizar en DB
                        await prisma.mensajeChat.updateMany({
                            where: { waMessageId: waMessageId },
                            data: { estadoEntrega: messageStatus }
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('[Webhook] Error procesando el webhook:', error);
    }
};
