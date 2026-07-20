import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import type { ChatFlowStep } from '../domain/types';
import pino from 'pino';

const logger = pino();
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export type EstadoConversacion =
  | 'INICIO'
  | 'ESPERANDO_FECHA'
  | 'CONFIRMANDO_FECHA'
  | 'ESPERANDO_HORA'
  | 'ESPERANDO_NOMBRE'
  | 'ESPERANDO_PAGO'
  | 'ESPERANDO_SERVICIO'
  | 'ESPERANDO_FEEDBACK';

export interface ContextoConversacion {
  estado: EstadoConversacion;
  datos: {
    fecha?: Date;
    horario?: string;
    nombre?: string;
    servicio?: string;
    citaId?: number;
    posiblesFechas?: Date[];
  };
  intentosAclaracion: number;
  ultimoMensaje?: string;
}

const PROMPT_EVALUACION = `
Eres un clasificador de intenciones para un bot de citas de Spa.
El usuario esta en un flujo de agendamiento pero ha dicho algo que no esperabamos.
Tu trabajo es clasificar su intencion en una de estas categorias:

1. CAMBIAR_FECHA: El usuario quiere cambiar la fecha de la cita (ej: "mejor el sabado", "no puedo el viernes").
2. CAMBIAR_HORA: El usuario quiere otra hora no listada o cambiarla.
3. PREGUNTA: El usuario tiene una duda sobre el servicio, ubicacion, precios, etc.
4. CANCELAR: El usuario quiere salir, cancelar o reiniciar.
5. CONTINUAR: El usuario esta tratando de seguir el flujo pero de forma ambigua.
6. OTRO: No se entiende o es irrelevante.

Responde SOLO con el nombre de la categoria.

Contexto actual: Agendando cita.
Mensaje del usuario: 
`;

export const evaluarIntencion = async (mensaje: string): Promise<string> => {
  try {
    const result = await model.generateContent(`${PROMPT_EVALUACION}"${mensaje}"`);
    const response = result.response.text().trim().toUpperCase();
    return response;
  } catch (error) {
    logger.error({ error }, 'Error evaluando intencion');
    return 'OTRO';
  }
};

export interface ResultadoIA {
  intencion: 'AGENDAR' | 'CONSULTAR' | 'CANCELAR' | 'OTRO' | 'ACLARAR';
  entidades: {
    fecha?: string;
    hora?: string;
    nombre?: string;
  };
  sentimiento: 'positivo' | 'neutral' | 'negativo';
  confianza: number;
  respuestaSugerida?: string;
}

export const procesarMensajeConIA = async (
  mensaje: string,
  contexto: ContextoConversacion,
  serviciosDisponibles?: string[],
  slotsDisponibles?: string[],
  chatFlow?: ChatFlowStep[],
): Promise<ResultadoIA> => {
  if (!mensaje || mensaje.length > 1000) {
    return {
      intencion: 'OTRO',
      entidades: {},
      sentimiento: 'neutral',
      confianza: 0,
      respuestaSugerida: 'Tu mensaje es demasiado largo. Por favor, envialo en un texto mas corto.',
    };
  }
  try {
    const prompt = construirPrompt(
      mensaje,
      contexto,
      serviciosDisponibles,
      slotsDisponibles,
      chatFlow,
    );

    const result = await model.generateContent(prompt);
    const response = result.response;
    const texto = response.text();

    const inicio = texto.indexOf('{');
    const fin = texto.lastIndexOf('}');

    if (inicio === -1 || fin === -1) {
      throw new Error('Respuesta IA no contiene JSON valido');
    }

    const textoLimpio = texto.substring(inicio, fin + 1);
    const resultado = JSON.parse(textoLimpio);

    logger.info({ intencion: resultado.intencion }, 'Gemini respondio con exito');

    return resultado as ResultadoIA;
  } catch (error) {
    logger.error({ error }, 'ERROR IA');

    const intencion = detectarIntencionSimple(mensaje);
    const tieneFecha = contieneInformacionFecha(mensaje);
    const tieneHora = contieneInformacionHora(mensaje);

    let respuestaRespaldo = '';
    if (intencion === 'AGENDAR') respuestaRespaldo = 'Entendido, quieres agendar. Para que fecha?';
    else if (intencion === 'CONSULTAR') respuestaRespaldo = 'Revisando tu agenda...';
    else
      respuestaRespaldo =
        'Disculpa, tuve un problema de conexion con mi cerebro. Podrias decirme para que dia buscas cita?';

    return {
      intencion: intencion,
      entidades: {
        fecha: tieneFecha ? mensaje : undefined,
        hora: tieneHora ? mensaje : undefined,
      },
      sentimiento: 'neutral',
      confianza: 0.5,
      respuestaSugerida: respuestaRespaldo,
    };
  }
};

const construirPrompt = (
  mensaje: string,
  contexto: ContextoConversacion,
  serviciosDisponibles?: string[],
  slotsDisponibles?: string[],
  chatFlow?: ChatFlowStep[],
): string => {
  const serviciosText = serviciosDisponibles?.length
    ? `\n- Servicios disponibles: ${serviciosDisponibles.join(', ')}`
    : '';
  const slotsText = slotsDisponibles?.length
    ? `\n- Horarios disponibles (slots): ${slotsDisponibles.join(', ')}`
    : '';

  let chatFlowText = '';
  if (chatFlow && chatFlow.length > 0) {
    const activeSteps = chatFlow.filter((s) => s.activo);
    if (activeSteps.length > 0) {
      chatFlowText = '\n**Mensajes personalizados del negocio:**\n';
      for (const step of activeSteps) {
        chatFlowText += `- ${step.titulo}: "${step.mensaje}"\n`;
      }
    }
  }

  const ejemplos = `
Eres un asistente virtual de una clinica/consultorio en Bolivia que ayuda a agendar citas por WhatsApp.

**Contexto actual:**
- Estado de conversacion: ${contexto.estado}
- Datos recopilados: ${JSON.stringify(contexto.datos)}${serviciosText}${slotsText}${chatFlowText}

**Tu tarea:**
Analiza el siguiente mensaje del usuario y extrae informacion estructurada en formato JSON.

**Mensaje del usuario:**
"${mensaje}"

**Instrucciones:**
1. Detecta la INTENCION principal: AGENDAR, CONSULTAR, CANCELAR, ACLARAR, OTRO
2. Extrae ENTIDADES clave:
   - fecha: cualquier referencia temporal (ej: "manana", "viernes proximo", "25 de enero", "la proxima semana")
   - hora: cualquier horario mencionado (ej: "3pm", "14:00", "por la tarde")
   - nombre: si menciona su nombre
3. Analiza SENTIMIENTO: positivo, neutral, negativo
4. Asigna CONFIANZA (0-1): que tan seguro estas del analisis

**Importante:**
- Si el mensaje es ambiguo o poco claro, marca confianza < 0.6
- Si menciona fechas relativas como "viernes" sin especificar cual, extraelo igual
- Se flexible con errores tipograficos (ej: "veirnes" = "viernes")
- NO inventes horarios. Solo ofrece los que estan en la lista de slots disponibles.

**Responde UNICAMENTE con JSON valido:**
{
  "intencion": "AGENDAR" | "CONSULTAR" | "CANCELAR" | "ACLARAR" | "OTRO",
  "entidades": {
    "fecha": "texto de fecha si existe",
    "hora": "texto de hora si existe",
    "nombre": "nombre si existe"
  },
  "sentimiento": "positivo" | "neutral" | "negativo",
  "confianza": 0.0 a 1.0,
  "respuestaSugerida": "Una respuesta corta, amigable y natural en espanol de Bolivia para el usuario basado en su mensaje y el contexto actual."
}
`;

  return ejemplos;
};

export const generarRespuestaContextual = async (
  contexto: ContextoConversacion,
  situacion: string,
): Promise<string> => {
  try {
    const prompt = `
Eres un asistente amigable de una clinica en Bolivia. Genera una respuesta CORTA y NATURAL en espanol para WhatsApp.

**Situacion:** ${situacion}
**Estado actual:** ${contexto.estado}
**Datos del usuario:** ${JSON.stringify(contexto.datos)}

**Instrucciones:**
- Usa emojis apropiados pero sin exagerar (maximo 2 por mensaje)
- Se breve y directo
- Usa un tono amigable pero profesional
- Si pides informacion, da ejemplos claros

Responde SOLO con el texto del mensaje, sin comillas ni formato adicional.
`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    logger.error({ error }, 'Error generando respuesta');
    return 'Disculpa, podrias repetir eso?';
  }
};

export const detectarIntencionSimple = (mensaje: string): ResultadoIA['intencion'] => {
  const textoLower = mensaje.toLowerCase();

  if (
    /hola|buenos|buenas|quiero|necesito|me gustaria|quisiera|agendar|cita|reserva|turno/.test(
      textoLower,
    )
  ) {
    return 'AGENDAR';
  }

  if (/cancelar|anular|borrar|eliminar/.test(textoLower)) {
    return 'CANCELAR';
  }

  if (/cuando|horario|disponible|libre|consultar/.test(textoLower)) {
    return 'CONSULTAR';
  }

  return 'OTRO';
};

export const contieneInformacionFecha = (mensaje: string): boolean => {
  const textoLower = mensaje.toLowerCase();

  const patronesFecha = [
    /\d{1,2}[\/-]\d{1,2}/,
    /manana|hoy|pasado manana/,
    /lunes|martes|miercoles|jueves|viernes|sabado|domingo/,
    /esta semana|proxima semana|siguiente semana/,
    /enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/,
  ];

  return patronesFecha.some((patron) => patron.test(textoLower));
};

export const contieneInformacionHora = (mensaje: string): boolean => {
  const textoLower = mensaje.toLowerCase();

  const patronesHora = [
    /\d{1,2}:\d{2}/,
    /\d{1,2}\s*(am|pm)/i,
    /manana|tarde|noche/,
    /(a las|tipo)\s*\d/,
  ];

  return patronesHora.some((patron) => patron.test(textoLower));
};
