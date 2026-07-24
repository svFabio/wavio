import { useState } from 'react';
import { useCitasQuery } from '../api/useCitasQuery';
import { useQueryClient } from '@tanstack/react-query';
import { Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { useActualizarDescripcionMutation } from '../api/useActualizarDescripcionMutation';
import { useCrearCitaMutation } from '../api/useCrearCitaMutation';
import { useReprogramarCitaMutation } from '../api/useReprogramarCitaMutation';
import { useMarkNoShowMutation, useMarkAsistioMutation } from '../api/useNoShow';
import type { EventoCalendario } from '../types';
import { CalendarioView } from '../components/CalendarioView';
import { CalendarioSkeleton } from '../../../shared/components/skeletons/CalendarioSkeleton';
import { ModalNuevaCitaContainer } from './ModalNuevaCita.container';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { useCalendarHandlers } from '../hooks/useCalendarHandlers';

export const CalendarioContainer = () => {
  const { data: dataRaw = [], isLoading: loading } = useCitasQuery();
  const queryClient = useQueryClient();

  const actualizarDesc = useActualizarDescripcionMutation();
  const crearCita = useCrearCitaMutation();
  const reprogramarCita = useReprogramarCitaMutation();
  const markNoShow = useMarkNoShowMutation();
  const markAsistio = useMarkAsistioMutation();

  const [fecha, setFecha] = useState(new Date());
  const [vista, setVista] = useState<View>(Views.MONTH);
  const [citaSeleccionada, setCitaSeleccionada] = useState<EventoCalendario | null>(null);
  const [modalNuevaCita, setModalNuevaCita] = useState<{ isOpen: boolean; fecha?: Date }>({
    isOpen: false,
  });
  const [modalReprogramar, setModalReprogramar] = useState<{
    isOpen: boolean;
    cita?: EventoCalendario;
  }>({ isOpen: false });

  const { eventos, scrollToTime, eventStyleGetter } = useCalendarEvents({
    dataRaw,
    vista,
    fecha,
    loading,
  });

  const {
    handleSelectSlot,
    handleSelectEvent,
    handleNoAsistio,
    handleNuevaCita,
    handleCerrarDetalle,
    handleReprogramarDesdeDetalle,
    handleGuardarDescripcion,
    handleCerrarNuevaCita,
    handleCrearCita,
    handleCerrarReprogramar,
    handleReprogramarCita,
  } = useCalendarHandlers({
    vista,
    setVista,
    setFecha,
    markNoShow,
    markAsistio,
    citaSeleccionada,
    setCitaSeleccionada,
    queryClient,
    crearCita,
    reprogramarCita,
    actualizarDesc,
    setModalNuevaCita,
    setModalReprogramar,
  });

  if (loading && dataRaw.length === 0) {
    return <CalendarioSkeleton />;
  }

  return (
    <>
      <CalendarioView
        eventos={eventos}
        vista={vista}
        fecha={fecha}
        scrollToTime={scrollToTime}
        eventStyleGetter={eventStyleGetter}
        onNavigateFecha={setFecha}
        onNavigateVista={setVista}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onNuevaCita={handleNuevaCita}
        citaSeleccionada={citaSeleccionada}
        onCerrarDetalle={handleCerrarDetalle}
        onReprogramarDesdeDetalle={handleReprogramarDesdeDetalle}
        onNoAsistio={handleNoAsistio}
        onGuardarDescripcion={handleGuardarDescripcion}
        isLoadingNoShow={markNoShow.isPending || markAsistio.isPending}
        modalReprogramarAbierto={modalReprogramar.isOpen}
        citaReprogramar={modalReprogramar.cita}
        onCerrarReprogramar={handleCerrarReprogramar}
        onReprogramarCita={handleReprogramarCita}
      />
      <ModalNuevaCitaContainer
        isOpen={modalNuevaCita.isOpen}
        onClose={handleCerrarNuevaCita}
        fechaInicial={modalNuevaCita.fecha}
        onSubmit={handleCrearCita}
      />
    </>
  );
};
