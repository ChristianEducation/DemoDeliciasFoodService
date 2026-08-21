"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"

interface SelectorSemanaProps {
  fechaInicio: string
  fechaFin: string
  semanaOffset: number
  onAvanzar: () => void
  onRetroceder: () => void
  puedeRetroceder: boolean
}

export default function SelectorSemana({
  fechaInicio,
  fechaFin,
  semanaOffset,
  onAvanzar,
  onRetroceder,
  puedeRetroceder,
}: SelectorSemanaProps) {
  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr + "T00:00:00")
    return fecha.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
    })
  }

  const getTituloSemana = () => {
    if (semanaOffset === 0) return "Esta semana"
    if (semanaOffset === 1) return "Próxima semana"
    return `Semana +${semanaOffset}`
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-800">{getTituloSemana()}</h3>
              <p className="text-sm text-gray-600">
                {formatearFecha(fechaInicio)} - {formatearFecha(fechaFin)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetroceder}
              disabled={!puedeRetroceder}
              className="flex items-center space-x-1 bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAvanzar}
              className="flex items-center space-x-1 bg-transparent"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
