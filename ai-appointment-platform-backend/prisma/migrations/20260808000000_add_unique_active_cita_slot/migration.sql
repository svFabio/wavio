-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_cita_slot ON "Cita" ("negocioId", "fecha", "horario") WHERE "estado" != 'CANCELADA';
