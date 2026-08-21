"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import type { CarritoAlmuerzos } from "@/hooks/useCarritoAlmuerzos"
import type { CarritoColaciones } from "@/hooks/useCarritoColaciones"

export interface ItemPedido {
  tipo: "almuerzo" | "colacion"
  codigo: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface PedidoDia {
  fecha: string
  diaSemana: string
  items: ItemPedido[]
  totalDia: number
}

export interface DestinatarioResumen {
  id: string
  nombre: string
  tipo: "estudiante" | "funcionario"
  casino?: string
  curso?: string
  nivel?: string
  dias: PedidoDia[]
  totalDestinatario: number
}

export interface ResumenCompleto {
  destinatarios: DestinatarioResumen[]
  totales: {
    almuerzos: number
    colaciones: number
    totalItems: number
    totalPrecio: number
  }
  datosEspecificos?: any // Para datos adicionales de funcionarios
}

export function useResumenPedido() {
  const [resumen, setResumen] = useState<ResumenCompleto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    cargarResumen()
  }, [])

  const cargarResumen = async () => {
    setLoading(true)
    setError(null)

    try {
      // Cargar datos de localStorage
      const carritoAlmuerzosData = localStorage.getItem("carritoAlmuerzos")
      const carritoColacionesData = localStorage.getItem("carritoColaciones")

      if (!carritoAlmuerzosData && !carritoColacionesData) {
        setError("No se encontraron pedidos guardados")
        return
      }

      const carritoAlmuerzos: CarritoAlmuerzos | null = carritoAlmuerzosData ? JSON.parse(carritoAlmuerzosData) : null
      const carritoColaciones: CarritoColaciones | null = carritoColacionesData
        ? JSON.parse(carritoColacionesData)
        : null

      // Leer datos específicos de funcionarios del localStorage
      const funcionarioSeleccionado = localStorage.getItem("funcionarioSeleccionado")
      const funcionarioConHijosSeleccionado = localStorage.getItem("funcionarioConHijosSeleccionado")
      const destinatariosSeleccionados = localStorage.getItem("destinatariosSeleccionados")

      let datosEspecificos = null
      let tipoUsuario = "apoderado"

      if (funcionarioSeleccionado) {
        datosEspecificos = JSON.parse(funcionarioSeleccionado)
        tipoUsuario = "funcionario-sin-hijos"
      } else if (funcionarioConHijosSeleccionado) {
        datosEspecificos = JSON.parse(funcionarioConHijosSeleccionado)
        tipoUsuario = "funcionario-con-hijos"
      } else if (destinatariosSeleccionados) {
        datosEspecificos = JSON.parse(destinatariosSeleccionados)
        tipoUsuario = "apoderado"
      }

      console.log("📋 Datos específicos cargados:", {
        tipoUsuario,
        datosEspecificos,
        funcionarioSeleccionado: !!funcionarioSeleccionado,
        funcionarioConHijosSeleccionado: !!funcionarioConHijosSeleccionado,
        destinatariosSeleccionados: !!destinatariosSeleccionados,
      })

      // Obtener todos los IDs de destinatarios únicos
      const idsDestinatarios = new Set<string>()
      carritoAlmuerzos?.destinatarios.forEach((d) => idsDestinatarios.add(d.id))
      carritoColaciones?.destinatarios.forEach((d) => idsDestinatarios.add(d.id))

      if (idsDestinatarios.size === 0) {
        setError("No se encontraron destinatarios")
        return
      }

      // Obtener nombres reales de destinatarios
      const nombresDestinatarios = await obtenerNombresDestinatarios(Array.from(idsDestinatarios))

      // Procesar datos y crear resumen
      const destinatariosResumen: DestinatarioResumen[] = []

      Array.from(idsDestinatarios).forEach((destinatarioId) => {
        const destAlmuerzos = carritoAlmuerzos?.destinatarios.find((d) => d.id === destinatarioId)
        const destColaciones = carritoColaciones?.destinatarios.find((d) => d.id === destinatarioId)

        const nombre = nombresDestinatarios[destinatarioId] || `Destinatario ${destinatarioId.slice(0, 8)}`
        const tipo = destAlmuerzos?.tipo || destColaciones?.tipo || "estudiante"

        // Agregar datos específicos para funcionarios
        const destinatarioResumen: DestinatarioResumen = {
          id: destinatarioId,
          nombre,
          tipo,
          dias: [],
          totalDestinatario: 0,
        }

        // Si es funcionario, agregar datos específicos
        if (tipoUsuario.includes("funcionario") && datosEspecificos) {
          if (tipoUsuario === "funcionario-sin-hijos") {
            // Para funcionario sin hijos, los datos están directamente
            destinatarioResumen.casino = datosEspecificos.casino
            destinatarioResumen.curso = datosEspecificos.curso
            destinatarioResumen.nivel = datosEspecificos.nivel
          } else if (tipoUsuario === "funcionario-con-hijos" && datosEspecificos.funcionario) {
            // Para funcionario con hijos, los datos están en .funcionario
            destinatarioResumen.casino = datosEspecificos.funcionario.casino
            destinatarioResumen.curso = datosEspecificos.funcionario.curso
            destinatarioResumen.nivel = datosEspecificos.funcionario.nivel
          }
        }

        // Obtener todas las fechas únicas para este destinatario
        const fechas = new Set<string>()
        if (destAlmuerzos) {
          Object.keys(destAlmuerzos.pedidos).forEach((fecha) => fechas.add(fecha))
        }
        if (destColaciones) {
          Object.keys(destColaciones.colaciones).forEach((fecha) => fechas.add(fecha))
        }

        const dias: PedidoDia[] = []

        Array.from(fechas)
          .sort()
          .forEach((fecha) => {
            const items: ItemPedido[] = []

            // Agregar almuerzos de este día
            if (destAlmuerzos && destAlmuerzos.pedidos[fecha]) {
              destAlmuerzos.pedidos[fecha].forEach((almuerzo) => {
                items.push({
                  tipo: "almuerzo",
                  codigo: almuerzo.codigo_opcion,
                  descripcion: almuerzo.descripcion_opcion,
                  cantidad: almuerzo.cantidad,
                  precioUnitario: almuerzo.precio_unitario,
                  subtotal: almuerzo.subtotal,
                })
              })
            }

            // Agregar colaciones de este día
            if (destColaciones && destColaciones.colaciones[fecha]) {
              destColaciones.colaciones[fecha].forEach((colacion) => {
                items.push({
                  tipo: "colacion",
                  codigo: colacion.codigo,
                  descripcion: colacion.descripcion,
                  cantidad: colacion.cantidad,
                  precioUnitario: colacion.precio,
                  subtotal: colacion.subtotal,
                })
              })
            }

            if (items.length > 0) {
              const totalDia = items.reduce((sum, item) => sum + item.subtotal, 0)
              const diaSemana = obtenerDiaSemana(fecha)

              dias.push({
                fecha,
                diaSemana,
                items,
                totalDia,
              })
            }
          })

        if (dias.length > 0) {
          const totalDestinatario = dias.reduce((sum, dia) => sum + dia.totalDia, 0)
          destinatarioResumen.dias = dias
          destinatarioResumen.totalDestinatario = totalDestinatario
          destinatariosResumen.push(destinatarioResumen)
        }
      })

      // Calcular totales generales
      let totalAlmuerzos = 0
      let totalColaciones = 0
      let totalItems = 0
      let totalPrecio = 0

      destinatariosResumen.forEach((dest) => {
        dest.dias.forEach((dia) => {
          dia.items.forEach((item) => {
            if (item.tipo === "almuerzo") {
              totalAlmuerzos += item.cantidad
            } else {
              totalColaciones += item.cantidad
            }
            totalItems += item.cantidad
            totalPrecio += item.subtotal
          })
        })
      })

      setResumen({
        destinatarios: destinatariosResumen,
        totales: {
          almuerzos: totalAlmuerzos,
          colaciones: totalColaciones,
          totalItems,
          totalPrecio,
        },
        datosEspecificos, // Incluir datos específicos en el resumen
      })
    } catch (err) {
      console.error("Error cargando resumen:", err)
      setError(err instanceof Error ? err.message : "Error cargando resumen")
    } finally {
      setLoading(false)
    }
  }

  const obtenerNombresDestinatarios = async (ids: string[]): Promise<Record<string, string>> => {
    const nombres: Record<string, string> = {}

    try {
      // Intentar obtener nombres de estudiantes
      const { data: estudiantes } = await supabase.from("estudiantes").select("id, name").in("id", ids)

      estudiantes?.forEach((estudiante) => {
        nombres[estudiante.id] = estudiante.name
      })

      // Intentar obtener nombres de funcionarios para los IDs restantes
      const idsRestantes = ids.filter((id) => !nombres[id])
      if (idsRestantes.length > 0) {
        const { data: funcionarios } = await supabase.from("funcionarios").select("id, nombre").in("id", idsRestantes)

        funcionarios?.forEach((funcionario) => {
          nombres[funcionario.id] = funcionario.nombre
        })
      }
    } catch (error) {
      console.error("Error obteniendo nombres:", error)
    }

    return nombres
  }

  const obtenerDiaSemana = (fecha: string): string => {
    const date = new Date(fecha + "T00:00:00")
    return date.toLocaleDateString("es-CL", { weekday: "long" })
  }

  return {
    resumen,
    loading,
    error,
    refetch: cargarResumen,
  }
}
