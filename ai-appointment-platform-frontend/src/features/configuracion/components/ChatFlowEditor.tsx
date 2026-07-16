import { useState } from 'react';
import { Toggle } from '../../../shared/components/Toggle';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { StepEditor } from './StepEditor';

export type InputType = 'texto' | 'lista' | 'boton';

export interface ChatFlowStep {
  id: string;
  titulo: string;
  mensaje: string;
  tipoInput: InputType;
  opciones?: string[];
  activo: boolean;
}

interface ChatFlowEditorProps {
  chatFlow: ChatFlowStep[];
  onChange: (flow: ChatFlowStep[]) => void;
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

export const ChatFlowEditor = ({ chatFlow, onChange }: ChatFlowEditorProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const steps = chatFlow && chatFlow.length > 0 ? chatFlow : DEFAULT_CHAT_FLOW;

  const updateStep = (id: string, updates: Partial<ChatFlowStep>) => {
    onChange(steps.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const addOption = (stepId: string) => {
    onChange(
      steps.map((s) => {
        if (s.id === stepId) {
          return { ...s, opciones: [...(s.opciones || []), ''] };
        }
        return s;
      }),
    );
  };

  const updateOption = (stepId: string, index: number, value: string) => {
    onChange(
      steps.map((s) => {
        if (s.id === stepId && s.opciones) {
          const newOps = [...s.opciones];
          newOps[index] = value;
          return { ...s, opciones: newOps };
        }
        return s;
      }),
    );
  };

  const removeOption = (stepId: string, index: number) => {
    onChange(
      steps.map((s) => {
        if (s.id === stepId && s.opciones) {
          const newOps = [...s.opciones];
          newOps.splice(index, 1);
          return { ...s, opciones: newOps };
        }
        return s;
      }),
    );
  };

  return (
    <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-6 space-y-6">
      <div className="flex justify-between items-start">
        <p className="text-sm text-txt-muted max-w-md">
          Configura el flujo de conversación del asistente. Puedes personalizar el mensaje de cada
          paso o desactivar pasos que no necesites.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step) => {
          const isExpanded = expandedId === step.id;

          return (
            <div
              key={step.id}
              className={`rounded-xl border transition-colors ${
                step.activo
                  ? 'border-border bg-surface'
                  : 'border-border-light bg-surface-elevated/30 opacity-75'
              }`}
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : step.id)}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-semibold ${step.activo ? 'text-txt' : 'text-txt-muted'}`}>
                    {step.titulo}
                  </span>
                </div>
                <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                  <Toggle
                    id={`toggle-${step.id}`}
                    checked={step.activo}
                    onChange={(checked) => updateStep(step.id, { activo: checked })}
                  />
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : step.id)}
                    className="text-txt-muted"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <StepEditor
                  step={step}
                  updateStep={updateStep}
                  updateOption={updateOption}
                  removeOption={removeOption}
                  addOption={addOption}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
