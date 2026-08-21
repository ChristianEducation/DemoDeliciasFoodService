"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { TrendingUp } from "lucide-react"
import { CHART_COLORS } from "@/lib/chart-colors"

interface IngresoSemanal {
  semana: string
  semana_numero: number
  pagado: number
  fmd: number
  pgc: number
  total: number
}

interface GraficoSemanalProps {
  data: IngresoSemanal[]
}

export function GraficoSemanal({ data }: GraficoSemanalProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const chartConfig = {
    pagado: {
      label: "Pagado",
      color: CHART_COLORS.pagado,
    },
    fmd: {
      label: "FMD",
      color: CHART_COLORS.fmd,
    },
    pgc: {
      label: "PGC",
      color: CHART_COLORS.pgc,
    },
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ingresos por Semana
          </CardTitle>
          <CardDescription>Comparativa semanal del mes actual</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay datos disponibles para este mes</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Ingresos por Semana
        </CardTitle>
        <CardDescription>Comparativa semanal del mes actual por estado de pago</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap justify-center gap-4 mb-4 pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: CHART_COLORS.pagado }} />
            <span className="text-sm font-medium">Pagado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: CHART_COLORS.fmd }} />
            <span className="text-sm font-medium">FMD</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: CHART_COLORS.pgc }} />
            <span className="text-sm font-medium">PGC</span>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="semana" className="text-xs" />
              <YAxis
                className="text-xs"
                tickFormatter={(value) => {
                  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
                  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`
                  return `$${value}`
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{chartConfig[name as keyof typeof chartConfig]?.label}:</span>
                        <span className="font-bold">{formatPrice(value as number)}</span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="pagado" stackId="a" fill={CHART_COLORS.pagado} radius={[0, 0, 0, 0]} />
              <Bar dataKey="fmd" stackId="a" fill={CHART_COLORS.fmd} radius={[0, 0, 0, 0]} />
              <Bar dataKey="pgc" stackId="a" fill={CHART_COLORS.pgc} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
