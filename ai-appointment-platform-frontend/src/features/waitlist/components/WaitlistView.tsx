import { useState } from 'react';
import { Plus, Users, AlertCircle, Loader2 } from 'lucide-react';
import { WaitlistCard } from './WaitlistCard';
import { WaitlistForm } from './WaitlistForm';
import type { WaitlistEntry } from '../types';

interface WaitlistViewProps {
  entries: WaitlistEntry[];
  loading: boolean;
  error: string | null;
  isAdding: boolean;
  onToggleForm: () => void;
  onAdd: (data: import('../types').AddToWaitlistPayload) => void;
  onNotify: (id: number) => void;
  onRemove: (id: number) => void;
  pendingNotifyId: number | null;
  pendingRemoveId: number | null;
}

const ESTADO_ORDER = ['PENDIENTE', 'NOTIFICADA', 'CONFIRMADA', 'CANCELADA'];

export const WaitlistView = ({
  entries,
  loading,
  error,
  isAdding,
  onToggleForm,
  onAdd,
  onNotify,
  onRemove,
  pendingNotifyId,
  pendingRemoveId,
}: WaitlistViewProps) => {
  const [filterEstado, setFilterEstado] = useState<string>('PENDIENTE');

  const filtered = entries.filter((e) =>
    filterEstado === 'TODOS' ? true : e.estado === filterEstado,
  );

  const pendientes = entries.filter((e) => e.estado === 'PENDIENTE').length;

  return (
    <div className="card-modern overflow-hidden">
      {/* Header */}
      <div className="p-5 md:p-6 border-b border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-txt">Lista de Espera</h2>
            <p className="text-sm text-txt-muted mt-1">
              {pendientes > 0 ? `${pendientes} clientes esperando disponibilidad` : 'Sin clientes en espera'}
            </p>
          </div>
          <button onClick={onToggleForm} className="btn-primary">
            <Plus className="w-5 h-5" />
            Nuevo Registro
          </button>
        </div>
      </div>

      <div className="p-5 md:p-6 space-y-4">
        {/* Form */}
        {isAdding && (
          <WaitlistForm onSubmit={onAdd} onCancel={onToggleForm} isLoading={false} />
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-danger-light border border-danger/20 rounded-xl text-danger text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-surface-elevated rounded-xl w-fit">
          {['PENDIENTE', 'NOTIFICADA', 'TODOS'].map((estado) => (
            <button
              key={estado}
              onClick={() => setFilterEstado(estado)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterEstado === estado
                  ? 'bg-surface text-txt shadow-sm'
                  : 'text-txt-muted hover:text-txt'
              }`}
            >
              {estado === 'TODOS' ? 'Todos' : estado === 'PENDIENTE' ? 'Pendientes' : 'Notificados'}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-txt-muted" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Users className="w-10 h-10 text-border mx-auto" />
            <p className="text-sm text-txt-muted">
              {filterEstado === 'TODOS' ? 'No hay entradas en la lista.' : 'No hay entradas en este estado.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...filtered]
              .sort((a, b) => ESTADO_ORDER.indexOf(a.estado) - ESTADO_ORDER.indexOf(b.estado))
              .map((entry) => (
                <WaitlistCard
                  key={entry.id}
                  entry={entry}
                  onNotify={onNotify}
                  onRemove={onRemove}
                  isNotifying={pendingNotifyId === entry.id}
                  isRemoving={pendingRemoveId === entry.id}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
