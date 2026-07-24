import { Plus, Trash2 } from 'lucide-react';
import type { ChatFlowStep, InputType } from '../types/domain';

interface StepEditorProps {
  step: ChatFlowStep;
  updateStep: (id: string, updates: Partial<ChatFlowStep>) => void;
  updateOption: (stepId: string, index: number, value: string) => void;
  removeOption: (stepId: string, index: number) => void;
  addOption: (stepId: string) => void;
}

export const StepEditor = ({
  step,
  updateStep,
  updateOption,
  removeOption,
  addOption,
}: StepEditorProps) => {
  return (
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
              <div key={`${step.id}-opt-${opt}-${idx}`} className="flex items-center gap-2">
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
  );
};
