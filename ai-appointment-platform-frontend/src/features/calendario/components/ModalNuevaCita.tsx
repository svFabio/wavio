import React from 'react';
import { Plus, X } from 'lucide-react';

export interface ModalNuevaCitaProps {
  modalRef: React.RefObject<HTMLDivElement | null>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleClose: () => void;
  isLarge: boolean;
  children: React.ReactNode;
}

export const ModalNuevaCita = ({
  modalRef,
  handleKeyDown,
  handleClose,
  isLarge,
  children,
}: ModalNuevaCitaProps): React.JSX.Element => {
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-sidebar/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Nueva cita"
        onKeyDown={handleKeyDown}
        className={`card-modern w-full overflow-hidden animate-modal-pop shadow-2xl transition-all duration-300 ${isLarge ? 'max-w-lg' : 'max-w-md'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-elevated/30">
          <h3 className="font-bold text-lg text-txt flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Nueva Cita
          </h3>
          <button
            onClick={handleClose}
            aria-label="Cerrar"
            className="p-1.5 hover:bg-surface-elevated rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-txt-muted" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
