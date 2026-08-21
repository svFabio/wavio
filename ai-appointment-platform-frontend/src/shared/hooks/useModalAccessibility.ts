import { useEffect, useCallback } from 'react';

interface UseModalAccessibilityProps {
  isOpen: boolean;
  onClose: () => void;
  modalRef: React.RefObject<HTMLDivElement | null>;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
}

interface UseModalAccessibilityResult {
  handleKeyDown: (e: React.KeyboardEvent | KeyboardEvent) => void;
}

export function useModalAccessibility({
  isOpen,
  onClose,
  modalRef,
  triggerRef,
}: UseModalAccessibilityProps): UseModalAccessibilityResult {
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      const timer = setTimeout(() => {
        const modal = modalRef.current;
        // Only move focus when the user has not already focused an element
        // inside the dialog (e.g. clicking straight into an input field).
        if (modal && !modal.contains(document.activeElement)) {
          const focusable = modal.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          if (focusable.length > 0) focusable[0].focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [isOpen, modalRef, triggerRef]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent | KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose, modalRef],
  );

  return { handleKeyDown };
}
