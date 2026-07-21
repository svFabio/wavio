import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  useValidateMagicLinkQuery,
  usePortalAppointmentsQuery,
  usePortalServicesQuery,
  usePortalAvailableSlotsQuery,
  useBookAppointmentMutation,
} from '../api/usePortal';
import { PortalView } from '../components/PortalView';
import type { BookAppointmentPayload } from '../types';

export const PortalContainer = () => {
  const { token } = useParams<{ token: string }>();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedServicioId, setSelectedServicioId] = useState<number | undefined>();

  const {
    data: validation,
    isLoading: loadingValidation,
    error: validationError,
  } = useValidateMagicLinkQuery(token ?? '');

  const { data: citas = [] } = usePortalAppointmentsQuery(token ?? '');
  const { data: servicios = [] } = usePortalServicesQuery(token ?? '');
  const { data: slots = [], isLoading: loadingSlots } = usePortalAvailableSlotsQuery(
    token ?? '',
    selectedDate,
    selectedServicioId,
  );

  const bookMutation = useBookAppointmentMutation(token ?? '');

  const handleBook = (data: BookAppointmentPayload) => {
    bookMutation.mutate(data, {
      onSuccess: () => {
        setSelectedDate('');
        setSelectedServicioId(undefined);
      },
    });
  };

  if (loadingValidation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-alt">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="mt-3 text-sm text-txt-secondary">Validando enlace...</p>
        </div>
      </div>
    );
  }

  if (validationError || !validation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-alt">
        <div className="text-center max-w-sm mx-auto px-4">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3" />
          <h1 className="text-xl font-bold text-txt mb-2">Enlace invalido</h1>
          <p className="text-sm text-txt-secondary">
            Este enlace no es valido o ha expirado. Solicita un nuevo enlace a tu negocio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PortalView
      cliente={validation.cliente}
      negocio={validation.negocio}
      citas={citas}
      servicios={servicios}
      slots={slots}
      loadingSlots={loadingSlots}
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
      selectedServicioId={selectedServicioId}
      onServicioChange={setSelectedServicioId}
      onBook={handleBook}
      booking={bookMutation.isPending}
      bookingResult={bookMutation.data ?? null}
      bookingError={bookMutation.error?.message ?? null}
    />
  );
};
