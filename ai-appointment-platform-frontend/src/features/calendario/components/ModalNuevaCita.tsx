import React from 'react';
import { ModalShell } from '../../../shared/components/ModalShell';

export interface ModalNuevaCitaProps {
  handleClose: () => void;
  isLarge: boolean;
  children: React.ReactNode;
}

export const ModalNuevaCita = ({
  handleClose,
  isLarge,
  children,
}: ModalNuevaCitaProps): React.JSX.Element => {
  return (
    <ModalShell isOpen={true} onClose={handleClose} title="Nueva Cita" size={isLarge ? 'lg' : 'md'}>
      {children}
    </ModalShell>
  );
};
