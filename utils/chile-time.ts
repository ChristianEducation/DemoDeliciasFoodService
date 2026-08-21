const TZ_CHILE = "America/Santiago"

/**
 * Hora actual de Chile como número entero (0-23).
 * Usa el timezone America/Santiago — maneja horario de verano automáticamente.
 * PREFERIR esta función cuando solo se necesita la hora.
 */
export function obtenerHoraChile(): number {
  const hora = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_CHILE,
    hour: "2-digit",
    hour12: false,
  }).format(new Date())
  // Intl.DateTimeFormat con hour12:false puede devolver "24" en algunos runtimes a las 0hs
  const n = Number(hora)
  return n === 24 ? 0 : n
}

/**
 * Fecha actual de Chile en formato ISO YYYY-MM-DD.
 * PREFERIR esta función para comparar fechas. NO usar .toISOString().split("T")[0]
 * sobre un Date local porque eso convierte a UTC y puede generar off-by-one.
 */
export function obtenerFechaChileISO(): string {
  // "en-CA" da formato YYYY-MM-DD por defecto en es-CL daría DD-MM-YYYY
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_CHILE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

/**
 * Obtiene la fecha y hora actual de Chile como Date.
 * NOTA: el Date retornado tiene los valores de hora/fecha de Chile pero internamente
 * sigue siendo un instante UTC. NO usar .toISOString() sobre el resultado para extraer
 * la fecha — usar obtenerFechaChileISO() en su lugar.
 * Mantenido por compatibilidad con código existente.
 */
export function obtenerFechaHoraChile(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_CHILE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date())
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0)
  const hour = get("hour")
  return new Date(
    get("year"),
    get("month") - 1,
    get("day"),
    hour === 24 ? 0 : hour,
    get("minute"),
    get("second")
  )
}

/**
 * Obtiene solo la fecha de Chile (sin hora) para comparaciones.
 * Mantenido por compatibilidad.
 */
export function obtenerFechaChile(): Date {
  const fechaHoraChile = obtenerFechaHoraChile()
  return new Date(fechaHoraChile.getFullYear(), fechaHoraChile.getMonth(), fechaHoraChile.getDate())
}

/**
 * Crea una fecha límite a las 9:00 AM del día especificado.
 * Mantenido por compatibilidad.
 */
export function crearFechaLimite9AM(fecha: Date): Date {
  const fechaLimite = new Date(fecha)
  fechaLimite.setHours(9, 0, 0, 0)
  return fechaLimite
}
