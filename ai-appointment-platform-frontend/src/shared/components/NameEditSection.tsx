import { Check, Loader2, Pencil } from 'lucide-react';

interface NameEditSectionProps {
  nombre: string;
  editingNombre: boolean;
  setEditingNombre: (v: boolean) => void;
  nombreValue: string;
  setNombreValue: (v: string) => void;
  nombreLoading: boolean;
  onSave: () => void;
  nombreInputRef: React.RefObject<HTMLInputElement | null>;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export const NameEditSection = ({
  nombre,
  editingNombre,
  setEditingNombre,
  nombreValue,
  setNombreValue,
  nombreLoading,
  onSave,
  nombreInputRef,
  onKeyDown,
}: NameEditSectionProps) => {
  return (
    <div>
      <label
        htmlFor="profile-name"
        className="text-xs font-semibold text-txt-muted uppercase tracking-wider"
      >
        Nombre
      </label>
      <div className="mt-1 flex items-center gap-1.5">
        {editingNombre ? (
          <>
            <input
              ref={nombreInputRef}
              id="profile-name"
              value={nombreValue}
              onChange={(e) => setNombreValue(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={nombreLoading}
              aria-label="Nombre"
              className="flex-1 px-3 py-2 text-sm border border-primary/60 rounded-xl outline-none ring-2 ring-primary/20 text-txt disabled:opacity-60"
            />
            <button
              onClick={onSave}
              disabled={nombreLoading}
              aria-label="Guardar nombre"
              className="p-2 rounded-xl bg-primary text-on-primary hover:bg-primary-dark transition-colors disabled:opacity-60 flex-shrink-0"
            >
              {nombreLoading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            </button>
          </>
        ) : (
          <>
            <div className="flex-1 p-2.5 bg-surface-alt border border-border rounded-xl text-sm text-txt">
              {nombre}
            </div>
            <button
              onClick={() => setEditingNombre(true)}
              aria-label="Editar nombre"
              className="p-2 rounded-xl text-txt-muted hover:text-txt hover:bg-surface-alt transition-colors flex-shrink-0"
            >
              <Pencil size={15} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
