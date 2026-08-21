// Colores hexadecimales directos que Recharts puede leer en producción
// Evita problemas con variables CSS que no se resuelven en tiempo de ejecución

export const CHART_COLORS = {
  // Colores para estados de pago (usados en líneas y barras)
  total: "#3b82f6", // Azul
  pagado: "#10b981", // Verde
  fmd: "#f59e0b", // Naranja/Amarillo
  pgc: "#ef4444", // Rojo

  // Colores para distribución de clientes (pie chart)
  apoderado: "#3b82f6", // Azul
  funcionarioConHijos: "#10b981", // Verde
  funcionarioSinHijos: "#f59e0b", // Naranja

  // Colores para distribución de productos (pie chart)
  almuerzo: "#3b82f6", // Azul
  colacion: "#10b981", // Verde
} as const

// Array de colores para gráficos pie (orden de aplicación)
export const PIE_COLORS_CLIENTES = [
  CHART_COLORS.apoderado,
  CHART_COLORS.funcionarioConHijos,
  CHART_COLORS.funcionarioSinHijos,
]

export const PIE_COLORS_PRODUCTOS = [CHART_COLORS.almuerzo, CHART_COLORS.colacion]
