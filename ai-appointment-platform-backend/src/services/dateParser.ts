export function resolverFechaRelativa(textoFecha: string, fechaActual: Date): Date | null {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  const texto = normalize(textoFecha.trim());
  const year = fechaActual.getFullYear();
  const month = fechaActual.getMonth();
  const date = fechaActual.getDate();

  if (texto === 'hoy') {
    return new Date(year, month, date);
  }

  if (texto === 'manana' || texto === 'manan') {
    return new Date(year, month, date + 1);
  }

  if (texto === 'pasado manana') {
    return new Date(year, month, date + 2);
  }

  const daysMapping: Record<string, number> = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    vierne: 5,
    sabado: 6,
  };

  for (const [dayName, dayIndex] of Object.entries(daysMapping)) {
    if (texto === `el ${dayName}` || texto === dayName || texto === `este ${dayName}`) {
      const currentDay = fechaActual.getDay();
      let diff = dayIndex - currentDay;
      if (diff <= 0) diff += 7; // Next occurrence
      return new Date(year, month, date + diff);
    }

    if (texto === `el ${dayName} que viene` || texto === `proximo ${dayName}`) {
      const currentDay = fechaActual.getDay();
      let diff = dayIndex - currentDay;
      if (diff <= 0) diff += 7;
      diff += 7; // Next week
      return new Date(year, month, date + diff);
    }
  }

  if (texto === 'proxima semana' || texto === 'la proxima semana') {
    const currentDay = fechaActual.getDay();
    const diff = (1 - currentDay <= 0 ? 1 - currentDay + 7 : 1 - currentDay) + 7;
    return new Date(year, month, date + diff);
  }

  // Basic "el 25 de julio" support
  const match = texto.match(/el (\d{1,2}) de ([a-z]+)/);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthStr = match[2];
    const monthsMapping: Record<string, number> = {
      enero: 0,
      febrero: 1,
      marzo: 2,
      abril: 3,
      mayo: 4,
      junio: 5,
      julio: 6,
      agosto: 7,
      septiembre: 8,
      octubre: 9,
      noviembre: 10,
      diciembre: 11,
    };
    const m = monthsMapping[monthStr];
    if (m !== undefined) {
      const parsedDate = new Date(year, m, day);
      if (parsedDate < fechaActual) {
        parsedDate.setFullYear(year + 1);
      }
      return parsedDate;
    }
  }

  return null;
}
