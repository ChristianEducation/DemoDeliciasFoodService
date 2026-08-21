"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"

interface HeatmapDia {
  fecha: string
  cantidad: number
  monto: number
  intensidad: number
  dia: number
}

interface HeatmapCalendarioProps {
  data: HeatmapDia[]
}

export function HeatmapCalendario({ data }: HeatmapCalendarioProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(value)
  }

  // Obtener mes y año del primer dato
  const primerDato = data[0]
  const fecha = primerDato ? new Date(primerDato.fecha + "T00:00:00") : new Date()
  const mes = fecha.toLocaleDateString("es-CL", { month: "long", year: "numeric" })

  // Crear mapa de día -> datos
  const datosPorDia = new Map(data.map((d) => [d.dia, d]))

  // Obtener primer día del mes y total de días
  const primerDiaMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
  const ultimoDiaMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0)
  const totalDias = ultimoDiaMes.getDate()
  const primerDiaSemana = primerDiaMes.getDay() // 0 = Domingo, 1 = Lunes, etc.

  // Crear array de días del mes
  const dias = Array.from({ length: totalDias }, (_, i) => i + 1)

  // Agregar días vacíos al inicio para alinear con el día de la semana
  const diasVacios = Array.from({ length: primerDiaSemana }, (_, i) => null)

  // Función para obtener color según intensidad
  const getColor = (intensidad: number) => {
    if (intensidad === 0) return "bg-gray-100"
    if (intensidad < 0.25) return "bg-green-200"
    if (intensidad < 0.5) return "bg-green-300"
    if (intensidad < 0.75) return "bg-green-400"
    return "bg-green-500"
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mapa de Calor - Demanda Diaria
          </CardTitle>
          <CardDescription>Visualización de demanda por día del mes</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay datos disponibles para este mes</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Mapa de Calor - Demanda Diaria
        </CardTitle>
        <CardDescription className="capitalize">Visualización de demanda por día de {mes}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-center justify-end gap-2 mb-3 pb-2 border-b">
          <span className="text-[10px] text-muted-foreground">Menos</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded-sm" />
            <div className="w-3 h-3 bg-green-200 border border-gray-200 rounded-sm" />
            <div className="w-3 h-3 bg-green-300 border border-gray-200 rounded-sm" />
            <div className="w-3 h-3 bg-green-400 border border-gray-200 rounded-sm" />
            <div className="w-3 h-3 bg-green-500 border border-gray-200 rounded-sm" />
          </div>
          <span className="text-[10px] text-muted-foreground">Más</span>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1.5">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((dia) => (
            <div key={dia} className="text-center text-[10px] font-medium text-muted-foreground">
              {dia}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Días vacíos al inicio */}
          {diasVacios.map((_, index) => (
            <div key={`empty-${index}`} className="h-10" />
          ))}

          {/* Días del mes */}
          {dias.map((dia) => {
            const datos = datosPorDia.get(dia)
            const intensidad = datos?.intensidad || 0
            const colorClass = getColor(intensidad)

            return (
              <div
                key={dia}
                className={`h-10 ${colorClass} border border-gray-200 rounded-sm flex items-center justify-center text-[11px] font-medium cursor-pointer hover:ring-2 hover:ring-primary transition-all group relative`}
                title={
                  datos ? `${dia}: ${datos.cantidad} pedidos - ${formatPrice(datos.monto)}` : `${dia}: Sin pedidos`
                }
              >
                <span className={datos ? "text-gray-700" : "text-gray-400"}>{dia}</span>

                {/* Tooltip */}
                {datos && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                      <div className="font-semibold mb-1">Día {dia}</div>
                      <div>Pedidos: {datos.cantidad}</div>
                      <div>Monto: {formatPrice(datos.monto)}</div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
