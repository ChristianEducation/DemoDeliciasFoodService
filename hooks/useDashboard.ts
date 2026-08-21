"use client"

import { useState, useEffect, useCallback } from "react"

interface Stats {
  totalPedidos: number
  totalVentas: number
  totalFMD: number
  totalPGC: number
  clientesUnicos: number
  tasaExito: number
  cantidadPagados: number
  cantidadFMD: number
  cantidadPGC: number
  cambioVentas: number
}

interface IngresosDiarios {
  fecha: string
  pagado: number
  fmd: number
  pgc: number
  total: number
}

interface TopProducto {
  codigo: string
  descripcion: string
  tipo: string
  cantidad: number
  montoTotal: number
}

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

interface Distribucion {
  por_tipo_cliente: DistribucionCliente[]
  por_tipo_producto: DistribucionProducto[]
}

interface IngresoSemanal {
  semana: string
  semana_numero: number
  pagado: number
  fmd: number
  pgc: number
  total: number
}

interface HeatmapDia {
  fecha: string
  cantidad: number
  monto: number
  intensidad: number
  dia: number
}

interface IngresosMensuales {
  mes: string
  pagado: number
  fmd: number
  pgc: number
  total: number
}

export function useDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [ingresosDiarios, setIngresosDiarios] = useState<IngresosDiarios[]>([])
  const [ingresosMensuales, setIngresosMensuales] = useState<IngresosMensuales[]>([])
  const [topProductos, setTopProductos] = useState<TopProducto[]>([])
  const [distribucion, setDistribucion] = useState<Distribucion | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [ingresosSemanales, setIngresosSemanales] = useState<IngresoSemanal[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapDia[]>([])

  const cargarStats = useCallback(async () => {
    try {
      console.log("📊 [useDashboard] Cargando estadísticas...")
      const response = await fetch("/api/dashboard/stats")

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
        console.log("✅ [useDashboard] Estadísticas cargadas")
      } else {
        throw new Error(data.error || "Error al cargar estadísticas")
      }
    } catch (err: any) {
      console.error("❌ [useDashboard] Error al cargar stats:", err)
      setError(err.message)
    }
  }, [])

  const cargarIngresosDiarios = useCallback(async (dias = 30) => {
    try {
      console.log("📈 [useDashboard] Cargando ingresos diarios...")
      const response = await fetch(`/api/dashboard/ingresos-diarios?dias=${dias}`)

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setIngresosDiarios(data.ingresos)
        console.log("✅ [useDashboard] Ingresos diarios cargados:", data.ingresos.length)
      } else {
        throw new Error(data.error || "Error al cargar ingresos")
      }
    } catch (err: any) {
      console.error("❌ [useDashboard] Error al cargar ingresos:", err)
      setError(err.message)
    }
  }, [])

  const cargarTopProductos = useCallback(async (limit = 5) => {
    try {
      console.log("🏆 [useDashboard] Cargando top productos...")
      const response = await fetch(`/api/dashboard/top-productos?limit=${limit}`)

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setTopProductos(data.productos)
        console.log("✅ [useDashboard] Top productos cargados:", data.productos.length)
      } else {
        throw new Error(data.error || "Error al cargar productos")
      }
    } catch (err: any) {
      console.error("❌ [useDashboard] Error al cargar productos:", err)
      setError(err.message)
    }
  }, [])

  const cargarDistribucion = useCallback(async () => {
    try {
      console.log("📊 [useDashboard] Cargando distribución...")
      const response = await fetch("/api/dashboard/distribucion")

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setDistribucion(data.distribucion)
        console.log("✅ [useDashboard] Distribución cargada")
      } else {
        throw new Error(data.error || "Error al cargar distribución")
      }
    } catch (err: any) {
      console.error("❌ [useDashboard] Error al cargar distribución:", err)
      setError(err.message)
    }
  }, [])

  const cargarIngresosSemanales = useCallback(async () => {
    try {
      console.log("📊 [useDashboard] Cargando ingresos semanales...")
      const ahora = new Date()
      const mes = ahora.getMonth() + 1
      const año = ahora.getFullYear()

      const response = await fetch(`/api/dashboard/ingresos-semanales?mes=${mes}&año=${año}`)

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setIngresosSemanales(data.ingresos)
        console.log("✅ [useDashboard] Ingresos semanales cargados:", data.ingresos.length)
      } else {
        throw new Error(data.error || "Error al cargar ingresos semanales")
      }
    } catch (err: any) {
      console.error("❌ [useDashboard] Error al cargar ingresos semanales:", err)
      setError(err.message)
    }
  }, [])

  const cargarHeatmap = useCallback(async () => {
    try {
      console.log("📊 [useDashboard] Cargando heatmap...")
      const ahora = new Date()
      const mes = ahora.getMonth() + 1
      const año = ahora.getFullYear()

      const response = await fetch(`/api/dashboard/heatmap?mes=${mes}&año=${año}`)

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setHeatmap(data.heatmap)
        console.log("✅ [useDashboard] Heatmap cargado:", data.heatmap.length)
      } else {
        throw new Error(data.error || "Error al cargar heatmap")
      }
    } catch (err: any) {
      console.error("❌ [useDashboard] Error al cargar heatmap:", err)
      setError(err.message)
    }
  }, [])

  const cargarIngresosMensuales = useCallback(async (meses = 12) => {
    try {
      console.log("📈 [useDashboard] Cargando ingresos mensuales...")
      const response = await fetch(`/api/dashboard/ingresos-mensuales?meses=${meses}`)

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setIngresosMensuales(data.ingresos)
        console.log("✅ [useDashboard] Ingresos mensuales cargados:", data.ingresos.length)
      } else {
        throw new Error(data.error || "Error al cargar ingresos mensuales")
      }
    } catch (err: any) {
      console.error("❌ [useDashboard] Error al cargar ingresos mensuales:", err)
      setError(err.message)
    }
  }, [])

  const cargarTodo = useCallback(async () => {
    setCargando(true)
    setError(null)

    try {
      await Promise.all([
        cargarStats(),
        cargarIngresosDiarios(30),
        cargarIngresosMensuales(12),
        cargarTopProductos(5),
        cargarDistribucion(),
        cargarIngresosSemanales(),
        cargarHeatmap(),
      ])
    } catch (err: any) {
      console.error("❌ [useDashboard] Error al cargar datos:", err)
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [
    cargarStats,
    cargarIngresosDiarios,
    cargarIngresosMensuales,
    cargarTopProductos,
    cargarDistribucion,
    cargarIngresosSemanales,
    cargarHeatmap,
  ])

  useEffect(() => {
    cargarTodo()
  }, [cargarTodo])

  return {
    stats,
    ingresosDiarios,
    ingresosMensuales,
    topProductos,
    distribucion,
    ingresosSemanales,
    heatmap,
    cargando,
    error,
    recargar: cargarTodo,
  }
}
