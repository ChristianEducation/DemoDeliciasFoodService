"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { obtenerNombreMes } from "@/utils/calcular-semanas"

interface SelectorMesProps {
  mesSeleccionado: { mes: number; año: number }
  onCambiarMes: (incremento: number) => void
  onSeleccionarMes: (mes: number, año: number) => void
}

export function SelectorMes({ mesSeleccionado, onCambiarMes, onSeleccionarMes }: SelectorMesProps) {
  const { mes, año } = mesSeleccionado
  const nombreMes = obtenerNombreMes(mes)
  const nombreMesCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)

  const meses = Array.from({ length: 12 }, (_, i) => ({
    valor: i + 1,
    nombre:
      obtenerNombreMes(i + 1)
        .charAt(0)
        .toUpperCase() + obtenerNombreMes(i + 1).slice(1),
  }))

  const añoActual = new Date().getFullYear()
  const años = Array.from({ length: 5 }, (_, i) => añoActual - 2 + i)

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => onCambiarMes(-1)} aria-label="Mes anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <Select value={mes.toString()} onValueChange={(value) => onSeleccionarMes(Number.parseInt(value), año)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {meses.map((m) => (
                <SelectItem key={m.valor} value={m.valor.toString()}>
                  {m.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={año.toString()} onValueChange={(value) => onSeleccionarMes(mes, Number.parseInt(value))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {años.map((a) => (
                <SelectItem key={a} value={a.toString()}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="icon" onClick={() => onCambiarMes(1)} aria-label="Mes siguiente">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <h2 className="text-2xl font-bold">
        FINANZAS - {nombreMesCapitalizado.toUpperCase()} {año}
      </h2>
    </div>
  )
}
