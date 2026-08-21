"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FileCheck, Building2 } from "lucide-react"

interface Totales {
  pagado: { monto: number; cantidad: number }
  fmd: { monto: number; cantidad: number }
  pgc: { monto: number; cantidad: number }
  total: { monto: number; cantidad: number }
}

interface ResumenMesProps {
  totales: Totales
}

export function ResumenMes({ totales }: ResumenMesProps) {
  const formatearMonto = (monto: number) => {
    return `$${monto.toLocaleString("es-CL")}`
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Resumen del Mes</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagado</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatearMonto(totales.pagado.monto)}</div>
            <p className="text-xs text-muted-foreground">{totales.pagado.cantidad} pedidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FMD</CardTitle>
            <FileCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatearMonto(totales.fmd.monto)}</div>
            <p className="text-xs text-muted-foreground">{totales.fmd.cantidad} pedidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PGC</CardTitle>
            <Building2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatearMonto(totales.pgc.monto)}</div>
            <p className="text-xs text-muted-foreground">{totales.pgc.cantidad} pedidos</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Ingresos del Mes</p>
              <p className="text-3xl font-bold">{formatearMonto(totales.total.monto)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Total Pedidos</p>
              <p className="text-2xl font-bold">{totales.total.cantidad}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
