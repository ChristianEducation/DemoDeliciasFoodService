"use client"

import { useState, useEffect, useCallback } from "react"
import { calcularSemanasDelMes } from "@/utils/calcular-semanas"

interface Totales {
  pagado: { monto: number; cantidad: number }
  fmd: { monto: number; cantidad: number }
  pgc: { monto: number; cantidad: number }
  total: { monto: number; cantidad: number }
}

interface Semana {
  texto: string
  inicioNum: number
  finNum: number
  inicio: Date
  fin: Date
  items: any[]
  totales: Totales
}

interface ItemFinanzas {
  id: number
  fecha: string // Formato YYYY-MM-DD
  subtotal: number
  estado_pago: string
}

/**
 * Función simple para verificar si una fecha está en una semana
 * Trabaja solo con strings de fecha YYYY-MM-DD sin timestamps
 */
function estaFechaEnSemana(fechaStr: string, semana: { inicioNum: number; finNum: number; inicio: Date }): boolean {
  // Extraer solo el día del mes de la fecha string
  const partes = fechaStr.split("-")
  const diaDelMes = Number.parseInt(partes[2], 10)

  // Verificar que sea del mismo mes y año
  const añoFecha = Number.parseInt(partes[0], 10)
  const mesFecha = Number.parseInt(partes[1], 10)
  const añoSemana = semana.inicio.getFullYear()
  const mesSemana = semana.inicio.getMonth() + 1

  // Debe ser del mismo mes y año, y el día debe estar en el rango
  return añoFecha === añoSemana && mesFecha === mesSemana && diaDelMes >= semana.inicioNum && diaDelMes <= semana.finNum
}

export function useFinanzas() {
  const hoy = new Date()
  const [mesSeleccionado, setMesSeleccionado] = useState({
    mes: hoy.getMonth() + 1,
    año: hoy.getFullYear(),
  })

  const [resumenMes, setResumenMes] = useState<Totales>({
    pagado: { monto: 0, cantidad: 0 },
    fmd: { monto: 0, cantidad: 0 },
    pgc: { monto: 0, cantidad: 0 },
    total: { monto: 0, cantidad: 0 },
  })

  const [semanas, setSemanas] = useState<Semana[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const calcularTotales = useCallback((items: ItemFinanzas[]): Totales => {
    const totales: Totales = {
      pagado: { monto: 0, cantidad: 0 },
      fmd: { monto: 0, cantidad: 0 },
      pgc: { monto: 0, cantidad: 0 },
      total: { monto: 0, cantidad: 0 },
    }

    items.forEach((item) => {
      const monto = item.subtotal || 0
      totales.total.monto += monto
      totales.total.cantidad += 1

      if (item.estado_pago === "pagado") {
        totales.pagado.monto += monto
        totales.pagado.cantidad += 1
      } else if (item.estado_pago === "FMD") {
        totales.fmd.monto += monto
        totales.fmd.cantidad += 1
      } else if (item.estado_pago === "PGC") {
        totales.pgc.monto += monto
        totales.pgc.cantidad += 1
      }
    })

    return totales
  }, [])

  const cargarDatosFinancieros = useCallback(
    async (mes: number, año: number) => {
      try {
        setCargando(true)
        setError(null)

        console.log("🔍 [Cliente] Solicitando datos del mes:", mes, "año:", año)

        const response = await fetch(`/api/finanzas?mes=${mes}&año=${año}`)

        console.log("🎯 [Cliente] Respuesta recibida, status:", response.status)

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`)
        }

        const data = await response.json()

        console.log("✅ [Cliente] Datos parseados:", data.items?.length || 0, "items")

        const items: ItemFinanzas[] = data.items || []

        const estadosPorTipo = items.reduce(
          (acc, item) => {
            acc[item.estado_pago] = (acc[item.estado_pago] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )
        console.log("📊 [Cliente] Items por estado:", estadosPorTipo)

        // Calcular resumen del mes
        const totalesMes = calcularTotales(items)
        setResumenMes(totalesMes)

        console.log("💰 [Cliente] Totales del mes calculados:", totalesMes)

        // Calcular semanas del mes
        console.log("📅 [Cliente] Calculando semanas para mes:", mes, "año:", año)
        const semanasDelMes = calcularSemanasDelMes(mes, año)

        console.log("📅 [Cliente] Semanas del mes:", semanasDelMes.length)

        // Agrupar items por semana usando comparación simple de strings
        const semanasConDatos = semanasDelMes.map((semana) => {
          console.log(`\n🔍 [Cliente] Procesando ${semana.texto}:`)
          console.log(`   Rango: día ${semana.inicioNum} al ${semana.finNum}`)

          const itemsSemana = items.filter((item) => {
            const estaEnSemana = estaFechaEnSemana(item.fecha, semana)

            if (estaEnSemana) {
              console.log(`   ✅ Item ${item.id} - Fecha: ${item.fecha} - $${item.subtotal} - ${item.estado_pago}`)
            }

            return estaEnSemana
          })

          const totalesSemana = calcularTotales(itemsSemana)

          console.log(`   📊 Total items en esta semana: ${itemsSemana.length}`)
          console.log(`   💰 Totales:`, totalesSemana)

          return {
            ...semana,
            items: itemsSemana,
            pedidos: itemsSemana, // Mantener compatibilidad
            totales: totalesSemana,
          }
        })

        console.log("✅ [Cliente] Semanas con datos procesadas:", semanasConDatos.length)
        console.log(
          "📊 [Cliente] Resumen de semanas:",
          semanasConDatos.map((s) => ({
            texto: s.texto,
            items: s.items.length,
            total: s.totales.total.monto,
          })),
        )

        // Verificar que todos los items estén asignados
        const totalItemsEnSemanas = semanasConDatos.reduce((sum, s) => sum + s.items.length, 0)
        console.log("🔢 [Cliente] Items en semanas:", totalItemsEnSemanas, "de", items.length, "totales")

        if (totalItemsEnSemanas !== items.length) {
          console.warn("⚠️ [Cliente] HAY ITEMS SIN ASIGNAR:", items.length - totalItemsEnSemanas)
        }

        setSemanas(semanasConDatos)
      } catch (err: any) {
        console.error("❌ [Cliente] Error al cargar datos:", err)
        setError(err.message || "Error al cargar datos financieros")
      } finally {
        setCargando(false)
      }
    },
    [calcularTotales],
  )

  useEffect(() => {
    console.log("🔄 [Cliente] useEffect disparado - mes:", mesSeleccionado.mes, "año:", mesSeleccionado.año)
    cargarDatosFinancieros(mesSeleccionado.mes, mesSeleccionado.año)
  }, [mesSeleccionado, cargarDatosFinancieros])

  const cambiarMes = useCallback((incremento: number) => {
    setMesSeleccionado((prev) => {
      let nuevoMes = prev.mes + incremento
      let nuevoAño = prev.año

      if (nuevoMes > 12) {
        nuevoMes = 1
        nuevoAño += 1
      } else if (nuevoMes < 1) {
        nuevoMes = 12
        nuevoAño -= 1
      }

      console.log("📅 [Cliente] Cambiando a mes:", nuevoMes, "año:", nuevoAño)
      return { mes: nuevoMes, año: nuevoAño }
    })
  }, [])

  const seleccionarMes = useCallback((mes: number, año: number) => {
    console.log("📅 [Cliente] Seleccionando mes:", mes, "año:", año)
    setMesSeleccionado({ mes, año })
  }, [])

  return {
    mesSeleccionado,
    resumenMes,
    semanas,
    cargando,
    error,
    cambiarMes,
    seleccionarMes,
  }
}
