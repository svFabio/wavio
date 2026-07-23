export type InputType = 'texto' | 'lista' | 'boton';

export interface ChatFlowStep {
  id: string;
  titulo: string;
  mensaje: string;
  tipoInput: InputType;
  opciones?: string[];
  activo: boolean;
}

export const DEFAULT_CHAT_FLOW: ChatFlowStep[] = [
  {
    id: 'bienvenida',
    titulo: '1. Bienvenida',
    mensaje: 'Hola! Soy el asistente de citas. ¿En qué puedo ayudarte?',
    tipoInput: 'texto',
    activo: true,
  },
  {
    id: 'nombre',
    titulo: '2. Nombre',
    mensaje: '¿Cuál es tu nombre completo?',
    tipoInput: 'texto',
    activo: true,
  },
  {
    id: 'servicio',
    titulo: '3. Servicio',
    mensaje: '¿Qué servicio deseas?',
    tipoInput: 'lista',
    opciones: [],
    activo: true,
  },
  {
    id: 'fecha',
    titulo: '4. Fecha',
    mensaje: '¿Para qué fecha te gustaría?',
    tipoInput: 'texto',
    activo: true,
  },
  {
    id: 'hora',
    titulo: '5. Hora',
    mensaje: '¿A qué hora prefieres?',
    tipoInput: 'texto',
    activo: true,
  },
  {
    id: 'confirmacion',
    titulo: '6. Confirmación',
    mensaje: '¿Confirmas tu cita?',
    tipoInput: 'boton',
    opciones: ['Sí', 'No'],
    activo: true,
  },
  {
    id: 'pago',
    titulo: '7. Pago',
    mensaje: 'Por favor envía tu comprobante de adelanto',
    tipoInput: 'texto',
    activo: true,
  },
];

export interface Configuracion {
  triggerWord?: string;
  mensajeBienvenida?: string;
  mensajeConfirmacion?: string;
  cobrarAdelanto?: boolean;
  porcentajeAdelanto?: number;
  chatFlow?: ChatFlowStep[];
  qrFotoUrl?: string | null;
  negocioNombre?: string;
}
