import { useState } from 'react';
import { format } from 'date-fns';
import { X, User, Phone, Calendar, Clock } from 'lucide-react';
import type { AddToWaitlistPayload } from '../types';

interface WaitlistFormProps {
  onSubmit: (data: AddToWaitlistPayload) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const WaitlistForm = ({ onSubmit, onCancel, isLoading }: WaitlistFormProps) => {
  const [form, setForm] = useState<AddToWaitlistPayload>({
    clienteNombre: '',
    clienteTelefono: '',
    fechaPreferida: format(new Date(), 'yyyy-MM-dd'),
    horarioPreferido: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      horarioPreferido: form.horarioPreferido?.trim() || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-elevated border border-border rounded-xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-txt">Agregar a lista de espera</h4>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 hover:bg-surface-alt rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-txt-muted" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-txt-muted font-medium">Nombre *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
            <input
              required
              value={form.clienteNombre}
              onChange={(e) => setForm({ ...form, clienteNombre: e.target.value })}
              placeholder="Nombre del cliente"
              className="input-modern pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-txt-muted font-medium">Teléfono *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
            <input
              required
              type="tel"
              value={form.clienteTelefono}
              onChange={(e) =>
                setForm({ ...form, clienteTelefono: e.target.value.replace(/\D/g, '') })
              }
              placeholder="591 70000000"
              className="input-modern pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-txt-muted font-medium">Fecha preferida *</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
            <input
              required
              type="date"
              value={form.fechaPreferida}
              onChange={(e) => setForm({ ...form, fechaPreferida: e.target.value })}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="input-modern pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-txt-muted font-medium">Horario preferido</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
            <input
              type="time"
              value={form.horarioPreferido ?? ''}
              onChange={(e) => setForm({ ...form, horarioPreferido: e.target.value })}
              className="input-modern pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary">
          Agregar a la Lista
        </button>
      </div>
    </form>
  );
};
