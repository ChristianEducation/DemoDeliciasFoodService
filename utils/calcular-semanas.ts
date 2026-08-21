/**
 * Calcula las semanas laborales (Lunes a Viernes) de un mes dado
 * Este archivo maneja la lógica de dividir un mes en semanas laborales
 */

export interface Semana {
  numero: number
  inicio: Date
  fin: Date
  texto: string
  inicioNum: number
  finNum: number
}

/**
 * Calcula todas las semanas laborales de un mes específico
 * @param mes - Número del mes (1-12)
 * @param año - Año completo (ej: 2025)
 * @returns Array de objetos Semana con información de cada semana laboral
 */
export function calcularSemanasDelMes(mes: number, año: number): Semana[] {
  const semanas: Semana[] = []
  const primerDia = new Date(año, mes - 1, 1)
  const ultimoDia = new Date(año, mes, 0).getDate()
  const nombreMes = primerDia.toLocaleDateString("es-CL", { month: "long" })

  let fechaActual = new Date(primerDia)
  let numeroSemana = 1

  // Si el primer día no es lunes, buscar el primer día laboral
  while (fechaActual.getDay() === 0 || fechaActual.getDay() === 6) {
    fechaActual.setDate(fechaActual.getDate() + 1)
    if (fechaActual.getDate() > ultimoDia) {
      return semanas // Mes sin días laborales (raro pero posible)
    }
  }

  // Si no empezamos en lunes, crear semana parcial hasta el viernes
  if (fechaActual.getDay() !== 1) {
    const inicioSemana = new Date(fechaActual)
    const finSemana = new Date(fechaActual)

    // Avanzar hasta el viernes de esa semana o hasta que termine el mes
    while (finSemana.getDay() !== 5 && finSemana.getDate() < ultimoDia) {
      finSemana.setDate(finSemana.getDate() + 1)
      // Si nos pasamos de mes, retroceder
      if (finSemana.getMonth() !== mes - 1) {
        finSemana.setDate(finSemana.getDate() - 1)
        break
      }
    }

    // Asegurar que no nos pasamos del mes
    if (finSemana.getMonth() !== mes - 1) {
      finSemana.setMonth(mes - 1)
      finSemana.setDate(ultimoDia)
    }

    semanas.push({
      numero: numeroSemana,
      inicio: new Date(inicioSemana),
      fin: new Date(finSemana),
      texto: `Semana del ${formatearDia(inicioSemana.getDate())} al ${formatearDia(finSemana.getDate())} de ${capitalizarPrimeraLetra(nombreMes)}`,
      inicioNum: inicioSemana.getDate(),
      finNum: finSemana.getDate(),
    })

    numeroSemana++
    fechaActual = new Date(finSemana)
    fechaActual.setDate(fechaActual.getDate() + 1)

    // Avanzar al siguiente lunes
    while (fechaActual.getDay() !== 1 && fechaActual.getDate() <= ultimoDia) {
      fechaActual.setDate(fechaActual.getDate() + 1)
    }

    // Si nos pasamos del mes, terminamos
    if (fechaActual.getMonth() !== mes - 1) {
      return semanas
    }
  }

  // Generar semanas completas (lunes a viernes)
  while (fechaActual.getMonth() === mes - 1 && fechaActual.getDate() <= ultimoDia) {
    const inicioSemana = new Date(fechaActual)
    const finSemana = new Date(fechaActual)

    // Calcular el viernes (4 días después del lunes)
    const diasHastaViernes = 4
    const diaViernes = inicioSemana.getDate() + diasHastaViernes

    // Si el viernes está dentro del mes
    if (diaViernes <= ultimoDia) {
      finSemana.setDate(diaViernes)
    } else {
      // Si se pasa del mes, usar el último día del mes
      finSemana.setDate(ultimoDia)
    }

    // Verificar que no nos pasamos de mes
    if (finSemana.getMonth() !== mes - 1) {
      finSemana.setMonth(mes - 1)
      finSemana.setDate(ultimoDia)
    }

    semanas.push({
      numero: numeroSemana,
      inicio: new Date(inicioSemana),
      fin: new Date(finSemana),
      texto: `Semana del ${formatearDia(inicioSemana.getDate())} al ${formatearDia(finSemana.getDate())} de ${capitalizarPrimeraLetra(nombreMes)}`,
      inicioNum: inicioSemana.getDate(),
      finNum: finSemana.getDate(),
    })

    numeroSemana++

    // Avanzar 7 días para el siguiente lunes
    fechaActual = new Date(inicioSemana)
    fechaActual.setDate(fechaActual.getDate() + 7)

    // Si nos pasamos del mes, terminamos
    if (fechaActual.getMonth() !== mes - 1) {
      break
    }
  }

  return semanas
}

/**
 * Formatea un número de día con ceros a la izquierda
 * @param dia - Número del día (1-31)
 * @returns String del día con formato (ej: "01", "15")
 */
function formatearDia(dia: number): string {
  return dia.toString().padStart(2, "0")
}

/**
 * Capitaliza la primera letra de un texto
 * @param texto - Texto a capitalizar
 * @returns Texto con la primera letra en mayúscula
 */
function capitalizarPrimeraLetra(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/**
 * Obtiene el nombre del mes en español
 * @param mes - Número del mes (1-12)
 * @returns Nombre del mes en español (ej: "enero", "febrero")
 */
export function obtenerNombreMes(mes: number): string {
  const fecha = new Date(2000, mes - 1, 1)
  return fecha.toLocaleDateString("es-CL", { month: "long" })
}

/**
 * Verifica si una fecha está dentro de una semana específica
 * @param fecha - Fecha a verificar
 * @param semana - Objeto Semana con inicio y fin
 * @returns true si la fecha está en la semana, false si no
 */
export function esFechaEnSemana(fecha: Date, semana: Semana): boolean {
  const fechaSinHora = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  const inicioSinHora = new Date(semana.inicio.getFullYear(), semana.inicio.getMonth(), semana.inicio.getDate())
  const finSinHora = new Date(semana.fin.getFullYear(), semana.fin.getMonth(), semana.fin.getDate())

  return fechaSinHora >= inicioSinHora && fechaSinHora <= finSinHora
}

/**
 * Obtiene la semana actual del mes
 * @param mes - Número del mes (1-12)
 * @param año - Año completo
 * @returns La semana en la que estamos actualmente, o null si no hay semanas
 */
export function obtenerSemanaActual(mes: number, año: number): Semana | null {
  const hoy = new Date()
  const semanas = calcularSemanasDelMes(mes, año)

  for (const semana of semanas) {
    if (esFechaEnSemana(hoy, semana)) {
      return semana
    }
  }

  return null
}

/**
 * Verifica si un mes tiene semanas laborales
 * @param mes - Número del mes (1-12)
 * @param año - Año completo
 * @returns true si el mes tiene al menos una semana laboral
 */
export function mesConSemanasLaborales(mes: number, año: number): boolean {
  const semanas = calcularSemanasDelMes(mes, año)
  return semanas.length > 0
}
