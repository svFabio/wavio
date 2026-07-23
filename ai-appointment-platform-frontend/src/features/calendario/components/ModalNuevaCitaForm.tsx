import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, AlertCircle, Scissors } from 'lucide-react';
import { ClientInfoInputs } from './ClientInfoInputs';
import { StaffSelect } from './StaffSelect';
import { HorariosGrid } from './HorariosGrid';
import { ResumenPrecio } from './ResumenPrecio';
import { RecurrenciaSection, calcularFechaFinPorDefecto } from './RecurrenciaSection';
import type { Servicio } from '../../configuracion/types';
import type { Configuracion } from '../../configuracion/types/domain';
import type { DatosNuevaCita } from '../types';
import type { Usuario } from '../../../types';

interface ModalNuevaCitaFormProps {
  formData: DatosNuevaCita;
  setFormData: React.Dispatch<React.SetStateAction<DatosNuevaCita>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleClose: () => void;
  loading: boolean;
  error: string | null;
  servicios: Servicio[];
  staffList: Usuario[];
  config: Configuracion | undefined;
  horariosDisponibles: string[];
  loadingHorarios: boolean;
}

export const ModalNuevaCitaForm = ({
  formData,
  setFormData,
  handleSubmit,
  handleClose,
  loading,
  error,
  servicios,
  staffList,
  config,
  horariosDisponibles,
  loadingHorarios,
}: ModalNuevaCitaFormProps): React.JSX.Element => {
  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {error && (
        <div className="p-3 bg-danger-light border border-danger/20 rounded-xl text-danger text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <ClientInfoInputs
        nombre={formData.clienteNombre}
        telefono={formData.clienteTelefono}
        onNombreChange={(val) => setFormData((prev) => ({ ...prev, clienteNombre: val }))}
        onTelefonoChange={(val) => setFormData((prev) => ({ ...prev, clienteTelefono: val }))}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-txt mb-1.5">Fecha *</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
            <input
              type="date"
              required
              value={formData.fecha}
              onChange={(e) => setFormData((prev) => ({ ...prev, fecha: e.target.value }))}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="input-modern pl-10"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-txt mb-1.5">Servicio</label>
          <div className="relative">
            <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
            <select
              value={formData.servicioId || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, servicioId: Number(e.target.value) }))
              }
              className="input-modern pl-10 appearance-none bg-surface"
            >
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} — ${s.precio} ({s.duracionMinutos} min)
                </option>
              ))}
            </select>
          </div>
        </div>

        <ResumenPrecio servicioId={formData.servicioId} servicios={servicios} config={config} />
      </div>

      <StaffSelect
        staffList={staffList}
        selectedStaffId={formData.staffId}
        onSelect={(val) => setFormData((prev) => ({ ...prev, staffId: val }))}
      />

      <div>
        <label className="block text-sm font-semibold text-txt mb-1.5">Horario *</label>
        <HorariosGrid
          horarios={horariosDisponibles}
          selected={formData.horario}
          onSelect={(h) => setFormData((prev) => ({ ...prev, horario: h }))}
          loading={loadingHorarios}
        />
      </div>

      <RecurrenciaSection
        esRecurrente={!!formData.esRecurrente}
        recurrence={formData.recurrence}
        recurrenceEnd={formData.recurrenceEnd}
        fechaBase={formData.fecha}
        onToggle={(checked) =>
          setFormData((prev) => ({
            ...prev,
            esRecurrente: checked,
            recurrence: checked ? 'weekly' : undefined,
            recurrenceEnd: checked ? calcularFechaFinPorDefecto(prev.fecha) : undefined,
          }))
        }
        onFrequencyChange={(value) => setFormData((prev) => ({ ...prev, recurrence: value }))}
        onEndDateChange={(value) => setFormData((prev) => ({ ...prev, recurrenceEnd: value }))}
      />

      <div className="flex gap-3 pt-4 border-t border-border">
        <button type="button" onClick={handleClose} className="btn-secondary flex-1">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !formData.horario}
          className="btn-primary flex-1"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Cita'}
        </button>
      </div>
    </form>
  );
};
