"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import type { ResumenCompleto } from "@/hooks/useResumenPedido"
import type { PedidoSupabase } from "@/lib/types-pedidos"

export function usePedidosSupabase() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const crearPedido = async (
    resumen: ResumenCompleto,
    emailCliente: string,
    tipoCliente: "apoderado" | "funcionario-sin-hijos" | "funcionario-con-hijos",
    datosEspecificos?: any,
    descuento: number = 0,
    creditosUsados: number = 0,
    estudianteCreditoId: string | null = null,
  ): Promise<string | null> => {
    setLoading(true)
    setError(null)

    try {
      console.log("📝 Iniciando creación de pedido en Supabase...")
      console.log("📊 Resumen recibido:", resumen)
      console.log("👤 Tipo cliente:", tipoCliente)
      console.log("📋 Datos específicos:", datosEspecificos)

      // Validar que hay datos
      if (!resumen || !resumen.destinatarios || resumen.destinatarios.length === 0) {
        throw new Error("No hay destinatarios en el resumen")
      }

      if (resumen.totales.totalItems === 0) {
        throw new Error("No hay items seleccionados")
      }

      // Generar ID único para el pedido
      const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

      // Obtener nombre del primer destinatario como nombre del cliente
      const nombreCliente = resumen.destinatarios[0]?.nombre || "Cliente"

      // Preparar datos del pedido principal
      const pedidoData: Omit<PedidoSupabase, "id" | "created_at"> = {
        fecha: new Date().toISOString(),
        nombre_cliente: nombreCliente,
        email_cliente: emailCliente,
        tipo_cliente: tipoCliente,
        total: resumen.totales.totalPrecio - descuento,
        descuento: descuento,
        estado_pago: "pendiente",
        transaction_id: orderId,
        detalles: {
          resumenOriginal: {
            totalAlmuerzos: resumen.totales.almuerzos,
            totalColaciones: resumen.totales.colaciones,
            totalItems: resumen.totales.totalItems,
            cantidadDestinatarios: resumen.destinatarios.length,
          },
          tipoUsuario: tipoCliente,
          fechaCreacion: new Date().toISOString(),
          datosEspecificos: datosEspecificos, // Incluir datos específicos
          creditos_usados: creditosUsados,
          estudiante_credito_id: estudianteCreditoId,
        },
        observaciones: `Pedido creado desde la plataforma web - ${resumen.totales.totalItems} items para ${resumen.destinatarios.length} destinatario(s)`,
      }

      console.log("📊 Datos del pedido principal:", {
        orderId,
        nombreCliente,
        emailCliente,
        tipoCliente,
        total: resumen.totales.totalPrecio,
        cantidadDestinatarios: resumen.destinatarios.length,
        totalItems: resumen.totales.totalItems,
        tieneDatosEspecificos: !!datosEspecificos,
      })

      // 1. Crear el pedido principal
      const { data: pedidoCreado, error: errorPedido } = await supabase
        .from("pedidos")
        .insert(pedidoData)
        .select("id, transaction_id")
        .single()

      if (errorPedido) {
        console.error("❌ Error creando pedido principal:", errorPedido)
        throw new Error(`Error creando pedido: ${errorPedido.message}`)
      }

      if (!pedidoCreado) {
        throw new Error("No se pudo crear el pedido")
      }

      console.log("✅ Pedido principal creado:", {
        id: pedidoCreado.id,
        transactionId: pedidoCreado.transaction_id,
      })

      // 2. Preparar items del pedido
      const itemsPedido: any[] = []

      resumen.destinatarios.forEach((destinatario) => {
        destinatario.dias.forEach((dia) => {
          dia.items.forEach((item) => {
            // Preparar item base
            const itemBase = {
              pedido_id: pedidoCreado.id,
              destinatario: destinatario.nombre,
              tipo_destinatario: destinatario.tipo,
              fecha: dia.fecha,
              tipo: item.tipo,
              codigo: item.codigo,
              descripcion: item.descripcion,
              categoria: item.tipo === "almuerzo" ? "almuerzo" : "colacion",
              cantidad: item.cantidad,
              precio_unitario: item.precioUnitario,
              subtotal: item.subtotal,
            }

            // Agregar datos específicos de funcionarios si existen
            if (destinatario.casino) {
              itemBase.casino = destinatario.casino
            }
            if (destinatario.curso) {
              itemBase.curso = destinatario.curso
            }
            if (destinatario.nivel) {
              itemBase.nivel = destinatario.nivel
            }

            itemsPedido.push(itemBase)
          })
        })
      })

      console.log("📋 Items del pedido preparados:", {
        totalItems: itemsPedido.length,
        primerosItems: itemsPedido.slice(0, 3).map((item) => ({
          destinatario: item.destinatario,
          fecha: item.fecha,
          tipo: item.tipo,
          codigo: item.codigo,
          cantidad: item.cantidad,
          subtotal: item.subtotal,
          casino: item.casino,
          curso: item.curso,
          nivel: item.nivel,
        })),
      })

      // 3. Insertar items del pedido
      if (itemsPedido.length > 0) {
        const { error: errorItems } = await supabase.from("pedidos_item").insert(itemsPedido)

        if (errorItems) {
          console.error("❌ Error creando items del pedido:", errorItems)
          console.error("❌ Detalles del error:", errorItems.details)
          console.error("❌ Mensaje del error:", errorItems.message)
          // Intentar eliminar el pedido principal si falló la creación de items
          await supabase.from("pedidos").delete().eq("id", pedidoCreado.id)
          throw new Error(`Error creando items del pedido: ${errorItems.message}`)
        }

        console.log("✅ Items del pedido creados exitosamente")
      }

      // 4. Verificar que todo se creó correctamente
      const { data: verificacion, error: errorVerificacion } = await supabase
        .from("pedidos")
        .select(
          `
          id,
          transaction_id,
          nombre_cliente,
          total,
          estado_pago,
          pedidos_item (
            id,
            destinatario,
            tipo_destinatario,
            fecha,
            tipo,
            codigo,
            cantidad,
            subtotal,
            casino,
            curso,
            nivel
          )
        `,
        )
        .eq("id", pedidoCreado.id)
        .single()

      if (errorVerificacion) {
        console.error("❌ Error verificando pedido creado:", errorVerificacion)
      } else {
        console.log("✅ Verificación del pedido creado:", {
          id: verificacion.id,
          transactionId: verificacion.transaction_id,
          cliente: verificacion.nombre_cliente,
          total: verificacion.total,
          estado: verificacion.estado_pago,
          cantidadItems: verificacion.pedidos_item?.length || 0,
          tienenDatosEspecificos: verificacion.pedidos_item?.some((item) => item.casino || item.curso || item.nivel),
        })
      }

      console.log("🎉 Pedido creado exitosamente en Supabase")
      return orderId
    } catch (err) {
      console.error("❌ Error completo creando pedido:", err)
      const errorMessage = err instanceof Error ? err.message : "Error desconocido creando pedido"
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  const obtenerPedido = async (orderId: string): Promise<PedidoSupabase | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select(
          `
          *,
          pedidos_item (
            id,
            destinatario,
            tipo_destinatario,
            fecha,
            tipo,
            codigo,
            descripcion,
            categoria,
            cantidad,
            precio_unitario,
            subtotal,
            casino,
            curso,
            nivel
          )
        `,
        )
        .eq("transaction_id", orderId)
        .single()

      if (error) {
        console.error("Error obteniendo pedido:", error)
        setError(error.message)
        return null
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  const consultarPedido = async (orderId: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data: pedido, error } = await supabase
        .from("pedidos")
        .select(`
        *,
        pedidos_item (
          id,
          destinatario,
          tipo_destinatario,
          fecha,
          tipo,
          codigo,
          descripcion,
          categoria,
          cantidad,
          precio_unitario,
          subtotal,
          casino,
          curso,
          nivel
        )
      `)
        .eq("transaction_id", orderId)
        .single()

      if (error) {
        console.error("Error consultando pedido:", error)
        setError(error.message)
        return null
      }

      return pedido
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  const actualizarEstadoPedido = async (
    orderId: string,
    nuevoEstado: "pendiente" | "pagado" | "fallido" | "cancelado",
    observaciones?: string,
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const updateData: any = {
        estado_pago: nuevoEstado,
      }

      if (observaciones) {
        updateData.observaciones = observaciones
      }

      const { error } = await supabase.from("pedidos").update(updateData).eq("transaction_id", orderId)

      if (error) {
        console.error("Error actualizando estado del pedido:", error)
        setError(error.message)
        return false
      }

      console.log(`✅ Estado del pedido ${orderId} actualizado a: ${nuevoEstado}`)
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  const obtenerPedidosPorEmail = async (email: string): Promise<PedidoSupabase[]> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("email_cliente", email)
        .order("fecha", { ascending: false })

      if (error) {
        console.error("Error obteniendo pedidos por email:", error)
        setError(error.message)
        return []
      }

      return data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }

  return {
    crearPedido,
    obtenerPedido,
    consultarPedido,
    actualizarEstadoPedido,
    obtenerPedidosPorEmail,
    loading,
    error,
  }
}
