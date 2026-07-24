import { useRef } from 'react';
import { useModalAccessibility } from '../hooks/useModalAccessibility';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = false,
}: ConfirmModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const { handleKeyDown } = useModalAccessibility({
    isOpen,
    onClose,
    modalRef,
    triggerRef,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-overlay flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onKeyDown={handleKeyDown}
        className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <h3 id="confirm-modal-title" className="font-semibold text-txt flex items-center gap-2">
            {isDanger && <AlertTriangle className="text-danger w-5 h-5" />}
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1 rounded-full hover:bg-surface-alt text-txt-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 text-txt-secondary text-sm">{message}</div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-surface-alt border-t border-border-light">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-txt-secondary hover:text-txt transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white ${
              isDanger ? 'bg-danger hover:bg-danger-dark' : 'bg-primary hover:bg-primary-dark'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
