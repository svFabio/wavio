import React from 'react';
import { Plus, X } from 'lucide-react';
import { ModalShell } from '../../../shared/components/ModalShell';

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
    <ModalShell
      isOpen={true}
      onClose={handleClose}
      title="Nueva Cita"
      size={isLarge ? 'lg' : 'md'}
    >
      {children}
    </ModalShell>
  );
};
