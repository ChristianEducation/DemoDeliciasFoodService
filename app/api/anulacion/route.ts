import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/utils/supabase/admin"
import { obtenerHoraChile } from "@/utils/chile-time"

/**
 * GET /api/anulacion
 * Retorna si está permitido anular en base a la hora actual de Chile y la hora límite configurada.
 */
export async function GET() {
  try {
    // 1. Obtener la hora límite configurada (default 9 AM si no se encuentra)
    let horaLimite = 9
    const { data: config, error: configError } = await supabaseAdmin
      .from("configuracion_bloqueo")
      .select("hora_limite_anulacion")
      .limit(1)
      .single()

    if (!configError && config) {
      horaLimite = config.hora_limite_anulacion ?? 9
    } else if (configError && configError.code !== "PGRST116") { // PGRST116 es "no rows returned", lo cual es aceptable
      console.warn("⚠️ Warning obteniendo configuracion_bloqueo, usando default 9:", configError)
    }

    // 2. Obtener hora actual en Chile
    const horaActual = obtenerHoraChile()

    // 3. Responder con el estado de permiso
    return NextResponse.json({
      permitido: horaActual < horaLimite,
      hora_limite: horaLimite,
      hora_actual: horaActual,
    })
  } catch (error) {
    console.error("💥 Error en GET /api/anulacion:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno al verificar horario de anulación",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/anulacion
 * Ejecuta la anulación atómica de un almuerzo a través de la función RPC.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pedido_item_id, estudiante_id } = body

    // 1. Validación de campos obligatorios (UUIDs)
    if (!pedido_item_id || !estudiante_id) {
      return NextResponse.json(
        { success: false, message: "Datos faltantes: pedido_item_id y estudiante_id son requeridos" },
        { status: 400 }
      )
    }

    // 2. Validación de horario antes de ejecutar
    let horaLimite = 9
    const { data: config, error: configError } = await supabaseAdmin
      .from("configuracion_bloqueo")
      .select("hora_limite_anulacion")
      .limit(1)
      .single()

    if (!configError && config) {
      horaLimite = config.hora_limite_anulacion ?? 9
    }

    const horaActual = obtenerHoraChile()
    if (horaActual >= horaLimite) {
      return NextResponse.json(
        { success: false, message: `El horario de anulación venció a las ${horaLimite}:00 hrs` },
        { status: 403 }
      )
    }

    // 3. Ejecutar llamada RPC atómica en la base de datos
    const { data, error: rpcError } = await supabaseAdmin.rpc("anular_almuerzo_con_credito", {
      p_pedido_item_id: pedido_item_id,
      p_estudiante_id: estudiante_id,
    })

    if (rpcError) {
      console.error("❌ Error en Postgres RPC anular_almuerzo_con_credito:", rpcError)
      return NextResponse.json(
        { success: false, message: "Error interno al procesar la anulación" },
        { status: 500 }
      )
    }

    // 4. Mapeo y manejo de respuestas personalizadas de la RPC
    if (!data || !data.success) {
      const errorMsg = data?.error ?? "desconocido"
      const mensajes: Record<string, { msg: string; status: number }> = {
        item_no_existe: { msg: "Almuerzo no encontrado", status: 404 },
        item_ya_anulado: { msg: "Este almuerzo ya fue anulado", status: 400 },
        solo_almuerzos: { msg: "Solo se pueden anular almuerzos", status: 400 },
        solo_estudiantes: { msg: "Solo se pueden anular almuerzos de estudiantes", status: 400 },
        pedido_no_pagado: { msg: "Solo se pueden anular almuerzos de pedidos pagados", status: 400 },
        fecha_pasada: { msg: "Solo se pueden anular almuerzos futuros", status: 400 },
      }

      const info = mensajes[errorMsg] ?? { msg: `Error de validación: ${errorMsg}`, status: 400 }
      return NextResponse.json(
        { success: false, message: info.msg },
        { status: info.status }
      )
    }

    // 5. Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: "Almuerzo anulado correctamente. Se acreditó 1 crédito.",
    })
  } catch (error) {
    console.error("💥 Error en POST /api/anulacion:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno al procesar la solicitud",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}
