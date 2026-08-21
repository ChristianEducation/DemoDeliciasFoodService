"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, FileDown } from "lucide-react"

interface Totales {
  pagado: { monto: number; cantidad: number }
  fmd: { monto: number; cantidad: number }
  pgc: { monto: number; cantidad: number }
  total: { monto: number; cantidad: number }
}

interface SemanaCardProps {
  texto: string
  totales: Totales
  onExportar: () => void
}

export function SemanaCard({ texto, totales, onExportar }: SemanaCardProps) {
  const formatearMonto = (monto: number) => {
    return `$${monto.toLocaleString("es-CL")}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span>{texto}</span>
          </div>
          <span className="text-lg font-bold">{formatearMonto(totales.total.monto)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">• Pagado:</span>
            <span className="font-medium">
              {formatearMonto(totales.pagado.monto)} ({totales.pagado.cantidad} items)
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">• FMD:</span>
            <span className="font-medium">
              {formatearMonto(totales.fmd.monto)} ({totales.fmd.cantidad} items)
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">• PGC:</span>
            <span className="font-medium">
              {formatearMonto(totales.pgc.monto)} ({totales.pgc.cantidad} items)
            </span>
          </div>
        </div>

        <Button variant="outline" className="w-full bg-transparent" onClick={onExportar}>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </CardContent>
    </Card>
  )
}
