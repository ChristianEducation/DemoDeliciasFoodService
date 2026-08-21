"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Users, TrendingUp, CheckCircle, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useDashboard } from "@/hooks/useDashboard"
import { GraficoIngresos } from "@/components/admin/dashboard/GraficoIngresos"
import { GraficoMensual } from "@/components/admin/dashboard/GraficoMensual"
import { TopProductos } from "@/components/admin/dashboard/TopProductos"
import { GraficoDistribucion } from "@/components/admin/dashboard/GraficoDistribucion"
import { GraficoSemanal } from "@/components/admin/dashboard/GraficoSemanal"
import { HeatmapCalendario } from "@/components/admin/dashboard/HeatmapCalendario"

export default function AdminDashboard() {
  const {
    stats,
    ingresosDiarios,
    ingresosMensuales,
    topProductos,
    distribucion,
    ingresosSemanales,
    heatmap,
    cargando,
    error,
  } = useDashboard()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <ArrowUpRight className="h-4 w-4 text-green-600" />
    } else if (current < previous) {
      return <ArrowDownRight className="h-4 w-4 text-red-600" />
    }
    return null
  }

  const getTrendText = (current: number, previous: number) => {
    if (previous === 0) return "Sin datos previos"
    const diff = ((current - previous) / previous) * 100
    const sign = diff > 0 ? "+" : ""
    return `${sign}${diff.toFixed(1)}% vs mes anterior`
  }

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return "text-green-600"
    if (current < previous) return "text-red-600"
    return "text-muted-foreground"
  }

  if (cargando) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error al cargar el dashboard: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <p className="text-gray-600 mt-2">Resumen general del sistema de casino escolar</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPedidos || 0}</div>
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon(stats?.totalPedidos || 0, stats?.cambioVentas || 0)}
              <p className={`text-xs ${getTrendColor(stats?.totalPedidos || 0, stats?.cambioVentas || 0)}`}>
                {stats?.cambioVentas
                  ? `${stats.cambioVentas > 0 ? "+" : ""}${stats.cambioVentas.toFixed(1)}%`
                  : "Sin datos previos"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats?.totalVentas || 0)}</div>
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon(stats?.totalVentas || 0, stats?.cambioVentas || 0)}
              <p className={`text-xs ${getTrendColor(stats?.totalVentas || 0, stats?.cambioVentas || 0)}`}>
                {stats?.cambioVentas
                  ? `${stats.cambioVentas > 0 ? "+" : ""}${stats.cambioVentas.toFixed(1)}%`
                  : "Sin datos previos"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              FMD: {formatPrice(stats?.totalFMD || 0)} | PGC: {formatPrice(stats?.totalPGC || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.clientesUnicos || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Del mes actual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tasaExito?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">Pedidos pagados del total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {ingresosDiarios && ingresosDiarios.length > 0 && <GraficoIngresos data={ingresosDiarios} />}
        {ingresosMensuales && ingresosMensuales.length > 0 && <GraficoMensual data={ingresosMensuales} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {topProductos && topProductos.length > 0 && <TopProductos data={topProductos} />}
        {ingresosSemanales && ingresosSemanales.length > 0 && <GraficoSemanal data={ingresosSemanales} />}
      </div>

      {distribucion && distribucion.por_tipo_cliente && distribucion.por_tipo_producto && (
        <div className="w-full lg:w-[70%]">
          <GraficoDistribucion
            dataClientes={distribucion.por_tipo_cliente}
            dataProductos={distribucion.por_tipo_producto}
          />
        </div>
      )}

      {heatmap && heatmap.length > 0 && (
        <div className="w-full lg:w-[70%]">
          <HeatmapCalendario data={heatmap} />
        </div>
      )}
    </div>
  )
}
