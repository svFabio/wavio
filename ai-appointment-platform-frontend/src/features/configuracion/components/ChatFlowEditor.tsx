import { useState } from 'react';
import { Toggle } from '../../../shared/components/Toggle';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

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
  { id: 'bienvenida', titulo: '1. Bienvenida', mensaje: 'Hola! Soy el asistente de citas. ¿En qué puedo ayudarte?', tipoInput: 'texto', activo: true },
  { id: 'nombre', titulo: '2. Nombre', mensaje: '¿Cuál es tu nombre completo?', tipoInput: 'texto', activo: true },
  { id: 'servicio', titulo: '3. Servicio', mensaje: '¿Qué servicio deseas?', tipoInput: 'lista', opciones: [], activo: true },
  { id: 'fecha', titulo: '4. Fecha', mensaje: '¿Para qué fecha te gustaría?', tipoInput: 'texto', activo: true },
  { id: 'hora', titulo: '5. Hora', mensaje: '¿A qué hora prefieres?', tipoInput: 'texto', activo: true },
  { id: 'confirmacion', titulo: '6. Confirmación', mensaje: '¿Confirmas tu cita?', tipoInput: 'boton', opciones: ['Sí', 'No'], activo: true },
  { id: 'pago', titulo: '7. Pago', mensaje: 'Por favor envía tu comprobante de adelanto', tipoInput: 'texto', activo: true },
];

export const ChatFlowEditor = ({ chatFlow, onChange }: ChatFlowEditorProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const steps = chatFlow && chatFlow.length > 0 ? chatFlow : DEFAULT_CHAT_FLOW;

  const updateStep = (id: string, updates: Partial<ChatFlowStep>) => {
    onChange(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addOption = (stepId: string) => {
    onChange(steps.map(s => {
      if (s.id === stepId) {
        return { ...s, opciones: [...(s.opciones || []), ''] };
      }
      return s;
    }));
  };

  const updateOption = (stepId: string, index: number, value: string) => {
    onChange(steps.map(s => {
      if (s.id === stepId && s.opciones) {
        const newOps = [...s.opciones];
        newOps[index] = value;
        return { ...s, opciones: newOps };
      }
      return s;
    }));
  };

  const removeOption = (stepId: string, index: number) => {
    onChange(steps.map(s => {
      if (s.id === stepId && s.opciones) {
        const newOps = [...s.opciones];
        newOps.splice(index, 1);
        return { ...s, opciones: newOps };
      }
      return s;
    }));
  };

  return (
    <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-6 space-y-6">
      <div className="flex justify-between items-start">
        <p className="text-sm text-txt-muted max-w-md">
          Configura el flujo de conversación del asistente. Puedes personalizar el mensaje de cada paso o desactivar pasos que no necesites.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step) => {
          const isExpanded = expandedId === step.id;
          
          return (
            <div 
              key={step.id} 
              className={`rounded-xl border transition-colors ${
                step.activo ? 'border-border bg-surface' : 'border-border-light bg-surface-elevated/30 opacity-75'
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
                <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                  <Toggle
                    id={`toggle-${step.id}`}
                    checked={step.activo}
                    onChange={(checked) => updateStep(step.id, { activo: checked })}
                  />
                  <button onClick={() => setExpandedId(isExpanded ? null : step.id)} className="text-txt-muted">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 pt-0 border-t border-border mt-2 space-y-4">
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-txt-muted uppercase tracking-wide mb-1.5">
                      Mensaje del bot
                    </label>
                    <textarea
                      value={step.mensaje}
                      onChange={(e) => updateStep(step.id, { mensaje: e.target.value })}
                      disabled={!step.activo}
                      rows={2}
                      className="w-full border border-border rounded-xl px-4 py-3 text-sm text-txt focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none disabled:opacity-50 disabled:bg-surface-elevated"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-txt-muted uppercase tracking-wide mb-1.5">
                      Tipo de respuesta esperada
                    </label>
                    <select
                      value={step.tipoInput}
                      onChange={(e) => updateStep(step.id, { tipoInput: e.target.value as InputType })}
                      disabled={!step.activo}
                      className="w-full md:w-64 border border-border rounded-xl px-4 py-2 text-sm text-txt focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-50 disabled:bg-surface-elevated"
                    >
                      <option value="texto">Texto libre</option>
                      <option value="lista">Lista de opciones</option>
                      <option value="boton">Botones de respuesta rápida</option>
                    </select>
                  </div>

                  {(step.tipoInput === 'lista' || step.tipoInput === 'boton') && (
                    <div className="bg-surface-elevated p-4 rounded-xl border border-border">
                      <label className="block text-xs font-semibold text-txt-muted uppercase tracking-wide mb-3">
                        Opciones disponibles
                      </label>
                      <div className="space-y-2">
                        {step.opciones?.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              value={opt}
                              onChange={(e) => updateOption(step.id, idx, e.target.value)}
                              disabled={!step.activo}
                              placeholder="Escribe una opción..."
                              className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary disabled:opacity-50 disabled:bg-surface"
                            />
                            <button
                              onClick={() => removeOption(step.id, idx)}
                              disabled={!step.activo}
                              className="p-1.5 text-txt-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => addOption(step.id)}
                        disabled={!step.activo}
                        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-dark transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" /> Agregar opción
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
