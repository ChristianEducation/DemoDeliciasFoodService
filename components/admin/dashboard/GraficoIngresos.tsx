"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { TrendingUp } from "lucide-react"
import { CHART_COLORS } from "@/lib/chart-colors"

interface IngresosDiariosData {
  fecha: string
  total: number
  pagado: number
  fmd: number
  pgc: number
}

interface GraficoIngresosProps {
  data: IngresosDiariosData[]
}

export function GraficoIngresos({ data }: GraficoIngresosProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-CL", { day: "numeric", month: "short" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Evolución de Ingresos
        </CardTitle>
        <CardDescription>Ingresos diarios de los últimos 30 días</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4 pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.total }} />
            <span className="text-sm font-medium">Total</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.pagado }} />
            <span className="text-sm font-medium">Pagado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.fmd }} />
            <span className="text-sm font-medium">FMD</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.pgc }} />
            <span className="text-sm font-medium">PGC</span>
          </div>
        </div>

        <ChartContainer
          config={{
            total: {
              label: "Total",
              color: CHART_COLORS.total,
            },
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
          }}
          className="h-[350px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="fecha"
                tickFormatter={formatDate}
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => formatDate(value as string)}
                    formatter={(value) => formatPrice(value as number)}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke={CHART_COLORS.total}
                strokeWidth={2.5}
                dot={false}
                name="Total"
              />
              <Line
                type="monotone"
                dataKey="pagado"
                stroke={CHART_COLORS.pagado}
                strokeWidth={2.5}
                dot={false}
                name="Pagado"
              />
              <Line type="monotone" dataKey="fmd" stroke={CHART_COLORS.fmd} strokeWidth={2.5} dot={false} name="FMD" />
              <Line type="monotone" dataKey="pgc" stroke={CHART_COLORS.pgc} strokeWidth={2.5} dot={false} name="PGC" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
