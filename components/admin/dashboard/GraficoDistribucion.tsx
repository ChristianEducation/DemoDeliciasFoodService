"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
import { Users, ShoppingBag } from "lucide-react"
import { PIE_COLORS_CLIENTES, PIE_COLORS_PRODUCTOS } from "@/lib/chart-colors"

interface DistribucionCliente {
  tipo: string
  cantidad: number
  porcentaje: number
}

interface DistribucionProducto {
  tipo: string
  cantidad: number
  monto_total: number
  porcentaje: number
}

interface GraficoDistribucionProps {
  dataClientes: DistribucionCliente[]
  dataProductos: DistribucionProducto[]
}

const COLORS_CLIENTES = PIE_COLORS_CLIENTES

const COLORS_PRODUCTOS = PIE_COLORS_PRODUCTOS

const NOMBRES_CLIENTES: Record<string, string> = {
  apoderado: "Apoderado",
  funcionario: "Funcionario",
  funcionario_con_hijos: "Funcionario con Hijos",
}

export function GraficoDistribucion({ dataClientes, dataProductos }: GraficoDistribucionProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const chartDataClientes = dataClientes.map((item, index) => ({
    name: NOMBRES_CLIENTES[item.tipo] || item.tipo,
    value: item.cantidad,
    porcentaje: item.porcentaje,
    fill: COLORS_CLIENTES[index % COLORS_CLIENTES.length],
  }))

  const chartDataProductos = dataProductos.map((item, index) => ({
    name: item.tipo === "almuerzo" ? "Almuerzos" : "Colaciones",
    value: item.cantidad,
    monto: item.monto_total,
    porcentaje: item.porcentaje,
    fill: COLORS_PRODUCTOS[index % COLORS_PRODUCTOS.length],
  }))

  const renderLegend = (props: any) => {
    const { payload } = props
    return (
      <div className="flex flex-col gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">
              {entry.value}: <span className="font-medium text-foreground">{entry.payload.porcentaje.toFixed(1)}%</span>{" "}
              ({entry.payload.value} pedidos)
            </span>
          </div>
        ))}
      </div>
    )
  }

  const renderLabel = (entry: any) => {
    if (entry.porcentaje < 5) return "" // No mostrar label si es muy pequeño
    return `${entry.porcentaje.toFixed(1)}%`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Distribución por Tipo de Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Distribución por Cliente
          </CardTitle>
          <CardDescription>Pedidos por tipo de cliente del mes actual</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              cantidad: {
                label: "Cantidad",
              },
            }}
            className="h-[380px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataClientes}
                  cx="50%"
                  cy="42%"
                  outerRadius={100}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                >
                  {chartDataClientes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, props) => {
                        const item = props.payload
                        return (
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{item.name}</span>
                            <span>Cantidad: {value} pedidos</span>
                            <span>Porcentaje: {item.porcentaje.toFixed(1)}%</span>
                          </div>
                        )
                      }}
                    />
                  }
                />
                <Legend content={renderLegend} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Distribución por Tipo de Producto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Almuerzos vs Colaciones
          </CardTitle>
          <CardDescription>Distribución por tipo de producto del mes actual</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              cantidad: {
                label: "Cantidad",
              },
            }}
            className="h-[380px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataProductos}
                  cx="50%"
                  cy="42%"
                  outerRadius={100}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                >
                  {chartDataProductos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, props) => {
                        const item = props.payload
                        return (
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{item.name}</span>
                            <span>Cantidad: {value} items</span>
                            <span>Monto: {formatPrice(item.monto)}</span>
                            <span>Porcentaje: {item.porcentaje.toFixed(1)}%</span>
                          </div>
                        )
                      }}
                    />
                  }
                />
                <Legend content={renderLegend} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
