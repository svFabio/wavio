import pino from 'pino';
import { prisma } from '../src/repositories/prisma';

const logger = pino();

const DAY_MAPPING: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

async function migrateHorarios() {
  logger.info('Iniciando migración de horarios y servicios...');

  try {
    // 1. Obtener todas las configuraciones con los campos JSON antiguos
    // Usamos queryRawUnsafe porque Prisma no expone las columnas eliminadas del schema
    const configuraciones: any[] = await prisma.$queryRawUnsafe(`
      SELECT id, "negocioId", servicios, horarios 
      FROM "Configuracion"
    `);

    logger.info(`Se encontraron ${configuraciones.length} configuraciones para migrar.`);

    for (const config of configuraciones) {
      const negocioId = config.negocioId;
      logger.info(`Migrando negocioId: ${negocioId}`);

      await prisma.$transaction(async (tx) => {
        // --- 1. MIGRAR SERVICIOS ---
        if (config.servicios) {
          let parsedServicios: Array<{ nombre: string; precio: number }> = [];
          
          if (typeof config.servicios === 'string') {
            try {
              parsedServicios = JSON.parse(config.servicios);
            } catch (e) {
              logger.error(`Error parseando servicios para negocio ${negocioId}: ${e}`);
            }
          } else if (Array.isArray(config.servicios)) {
            parsedServicios = config.servicios;
          }

          for (const servicio of parsedServicios) {
            if (!servicio.nombre) continue;

            await tx.servicio.upsert({
              where: {
                negocioId_nombre: {
                  negocioId,
                  nombre: servicio.nombre.trim(),
                },
              },
              update: {
                precio: Number(servicio.precio) || 0,
                activo: true,
              },
              create: {
                negocioId,
                nombre: servicio.nombre.trim(),
                duracionMinutos: 60,
                bufferMinutos: 10,
                precio: Number(servicio.precio) || 0,
                activo: true,
              },
            });
          }
          logger.info(`Migrados ${parsedServicios.length} servicios para negocio ${negocioId}`);
        }

        // --- 2. MIGRAR HORARIOS ---
        if (config.horarios) {
          let parsedHorarios: Record<string, string[]> = {};
          
          if (typeof config.horarios === 'string') {
            try {
              parsedHorarios = JSON.parse(config.horarios);
            } catch (e) {
              logger.error(`Error parseando horarios para negocio ${negocioId}: ${e}`);
            }
          } else if (typeof config.horarios === 'object') {
            parsedHorarios = config.horarios;
          }

          let horariosCreados = 0;

          for (const [diaStr, horas] of Object.entries(parsedHorarios)) {
            const diaSemana = DAY_MAPPING[diaStr.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")];
            
            if (diaSemana === undefined || !Array.isArray(horas) || horas.length === 0) continue;

            // Ordenar horas
            const sortedHoras = [...horas].sort();
            
            // Agrupar horas consecutivas en rangos
            let rangoActual = { inicio: sortedHoras[0], fin: sortedHoras[0] };
            const rangos = [];

            for (let i = 1; i < sortedHoras.length; i++) {
              const prevHora = rangoActual.fin;
              const curHora = sortedHoras[i];
              
              const prevMinutos = parseInt(prevHora.split(':')[0]) * 60 + parseInt(prevHora.split(':')[1] || '0');
              const curMinutos = parseInt(curHora.split(':')[0]) * 60 + parseInt(curHora.split(':')[1] || '0');

              // Si es exactamente 1 hora (60 mins) o menos de diferencia, extender rango
              if (curMinutos - prevMinutos <= 60) {
                rangoActual.fin = curHora;
              } else {
                rangos.push({ ...rangoActual });
                rangoActual = { inicio: curHora, fin: curHora };
              }
            }
            rangos.push({ ...rangoActual });

            for (const rango of rangos) {
              // El fin debe ser al menos 1 hora después del último slot
              const finParts = rango.fin.split(':');
              const finH = parseInt(finParts[0]) + 1;
              const finStr = `${finH.toString().padStart(2, '0')}:${finParts[1] || '00'}`;

              await tx.horarioNegocio.upsert({
                where: {
                  negocioId_diaSemana_horaInicio: {
                    negocioId,
                    diaSemana,
                    horaInicio: rango.inicio,
                  },
                },
                update: {
                  horaFin: finStr,
                  activo: true,
                },
                create: {
                  negocioId,
                  diaSemana,
                  horaInicio: rango.inicio,
                  horaFin: finStr,
                  activo: true,
                },
              });
              horariosCreados++;
            }
          }
          logger.info(`Migrados ${horariosCreados} rangos de horario para negocio ${negocioId}`);
        }
      });
    }

    logger.info('Migración completada exitosamente.');
  } catch (error) {
    logger.error({ err: error }, 'Error durante la migración');
  } finally {
    await prisma.$disconnect();
  }
}

migrateHorarios();
