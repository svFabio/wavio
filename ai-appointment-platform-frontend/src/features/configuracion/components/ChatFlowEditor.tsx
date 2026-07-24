import React from 'react';
import { useState } from 'react';
import { Toggle } from '../../../shared/components/Toggle';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { StepEditor } from './StepEditor';
import type { ChatFlowStep } from '../types/domain';
import { DEFAULT_CHAT_FLOW } from '../types/domain';

interface ChatFlowEditorProps {
  chatFlow: ChatFlowStep[];
  onChange: (flow: ChatFlowStep[]) => void;
}

export const ChatFlowEditor = ({ chatFlow, onChange }: ChatFlowEditorProps): React.JSX.Element => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const steps = chatFlow && chatFlow.length > 0 ? chatFlow : DEFAULT_CHAT_FLOW;

  const updateStep = (id: string, updates: Partial<ChatFlowStep>): void => {
    onChange(steps.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const addOption = (stepId: string): void => {
    onChange(
      steps.map((s) => {
        if (s.id === stepId) return { ...s, opciones: [...(s.opciones || []), ''] };
        return s;
      }),
    );
  };

  const updateOption = (stepId: string, index: number, value: string): void => {
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

  const removeOption = (stepId: string, index: number): void => {
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
