// Función para convertir fecha a string YYYY-MM-DD en zona horaria local
export function dateToYYYYMMDD(date: Date): string {
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  )
}

// Función para obtener el inicio de la semana (lunes)
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Ajustar para que lunes sea el primer día
  return new Date(d.setDate(diff))
}

// Función para obtener el final de la semana (viernes)
export function getEndOfWeek(date: Date): Date {
  const startOfWeek = getStartOfWeek(date)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 4) // Lunes + 4 días = Viernes
  return endOfWeek
}

// Función para generar array de días de la semana
export function getWeekDays(startDate: Date): Array<{ fecha: string; diaSemana: string }> {
  const days = []
  const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

  for (let i = 0; i < 5; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)

    days.push({
      fecha: dateToYYYYMMDD(date),
      diaSemana: dayNames[i],
    })
  }

  return days
}
