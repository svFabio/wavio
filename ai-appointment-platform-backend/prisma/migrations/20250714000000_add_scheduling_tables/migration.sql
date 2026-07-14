-- CreateTable: Servicio
CREATE TABLE "Servicio" (
    "id" SERIAL NOT NULL,
    "negocioId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "duracionMinutos" INTEGER NOT NULL DEFAULT 60,
    "bufferMinutos" INTEGER NOT NULL DEFAULT 10,
    "precio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable: HorarioNegocio
CREATE TABLE "HorarioNegocio" (
    "id" SERIAL NOT NULL,
    "negocioId" INTEGER NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HorarioNegocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable: HorarioStaff
CREATE TABLE "HorarioStaff" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HorarioStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable: HorarioEspecial
CREATE TABLE "HorarioEspecial" (
    "id" SERIAL NOT NULL,
    "negocioId" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "cerrado" BOOLEAN NOT NULL DEFAULT false,
    "horaInicio" TEXT,
    "horaFin" TEXT,

    CONSTRAINT "HorarioEspecial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Servicio
CREATE UNIQUE INDEX "Servicio_negocioId_nombre_key" ON "Servicio"("negocioId", "nombre");
CREATE INDEX "Servicio_negocioId_idx" ON "Servicio"("negocioId");

-- CreateIndex: HorarioNegocio
CREATE UNIQUE INDEX "HorarioNegocio_negocioId_diaSemana_horaInicio_key" ON "HorarioNegocio"("negocioId", "diaSemana", "horaInicio");
CREATE INDEX "HorarioNegocio_negocioId_idx" ON "HorarioNegocio"("negocioId");

-- CreateIndex: HorarioStaff
CREATE UNIQUE INDEX "HorarioStaff_usuarioId_diaSemana_horaInicio_key" ON "HorarioStaff"("usuarioId", "diaSemana", "horaInicio");
CREATE INDEX "HorarioStaff_usuarioId_idx" ON "HorarioStaff"("usuarioId");

-- CreateIndex: HorarioEspecial
CREATE UNIQUE INDEX "HorarioEspecial_negocioId_fecha_key" ON "HorarioEspecial"("negocioId", "fecha");
CREATE INDEX "HorarioEspecial_negocioId_idx" ON "HorarioEspecial"("negocioId");

-- AlterTable: Cita — add new columns
ALTER TABLE "Cita" ADD COLUMN "servicioId" INTEGER;
ALTER TABLE "Cita" ADD COLUMN "duracionMinutos" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "Cita" ADD COLUMN "staffId" INTEGER;
ALTER TABLE "Cita" ADD COLUMN "estadoPago" TEXT NOT NULL DEFAULT 'PENDIENTE';

-- AlterTable: Configuracion — remove old JSON columns, add timezone
ALTER TABLE "Configuracion" DROP COLUMN "servicios";
ALTER TABLE "Configuracion" DROP COLUMN "horarios";
ALTER TABLE "Configuracion" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/La_Paz';

-- AddForeignKey: Servicio
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: HorarioNegocio
ALTER TABLE "HorarioNegocio" ADD CONSTRAINT "HorarioNegocio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: HorarioStaff
ALTER TABLE "HorarioStaff" ADD CONSTRAINT "HorarioStaff_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: HorarioEspecial
ALTER TABLE "HorarioEspecial" ADD CONSTRAINT "HorarioEspecial_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Cita → Servicio
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Cita → Staff (Usuario)
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
