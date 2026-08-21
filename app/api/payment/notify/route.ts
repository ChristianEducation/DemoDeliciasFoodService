import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/utils/supabase/admin"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    console.log("🔔 Webhook recibido de GetNet")

    const body = await request.json()
    console.log("📦 Datos recibidos:", JSON.stringify(body, null, 2))

    // Extraer datos del webhook de GetNet
    const { requestId, reference, status, signature } = body

    if (!requestId || !reference || !status) {
      console.error("❌ Datos faltantes en webhook:", { requestId, reference, status })
      return NextResponse.json({ error: "Datos faltantes" }, { status: 400 })
    }

    // Validar signature (en producción)
    if (process.env.GETNET_ENVIRONMENT === "production" && signature) {
      const secretKey = process.env.GETNET_SECRET!
      const expectedSignature = crypto
        .createHash("sha1")
        .update(`${requestId}${status.status}${status.date}${secretKey}`)
        .digest("hex")

      if (signature !== expectedSignature) {
        console.error("❌ Signature inválida")
        return NextResponse.json({ error: "Signature inválida" }, { status: 401 })
      }
    }

    // Mapear estado de GetNet a nuestro sistema
    let estadoPago = "pendiente"

    switch (status.status) {
      case "APPROVED":
        estadoPago = "pagado"
        break
      case "REJECTED":
        estadoPago = "fallido"
        break
      case "PENDING":
        estadoPago = "pendiente"
        break
      default:
        estadoPago = "pendiente"
    }

    console.log(`🔄 Cambiando estado de ${reference} a: ${estadoPago}`)

    // Actualizar estado en Supabase usando admin client
    const { data: pedido, error } = await supabaseAdmin
      .from("pedidos")
      .update({
        estado_pago: estadoPago,
      })
      .eq("transaction_id", reference)
      .select()
      .single()

    if (error) {
      console.error("❌ Error actualizando Supabase:", error)
      return NextResponse.json({ error: "Error actualizando base de datos" }, { status: 500 })
    }

    if (!pedido) {
      console.error("❌ Pedido no encontrado:", reference)
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
    }

    console.log("✅ Estado actualizado exitosamente:", {
      transaction_id: reference,
      estado_anterior: "pendiente",
      estado_nuevo: estadoPago,
      pedido_id: pedido.id,
    })

    // --- INICIO LÓGICA DE DESCUENTO DE CRÉDITOS ---
    if (estadoPago === "pagado" && pedido.detalles) {
      const detalles = typeof pedido.detalles === "string" ? JSON.parse(pedido.detalles) : pedido.detalles
      const creditosUsados = Number(detalles.creditos_usados)
      const estudianteCreditoId = detalles.estudiante_credito_id
      const creditosDescontados = detalles.creditos_descontados

      if (creditosUsados > 0 && estudianteCreditoId && !creditosDescontados) {
        try {
          console.log(`💳 Descontando ${creditosUsados} créditos al estudiante ${estudianteCreditoId}`)
          const { error: errorRpc } = await supabaseAdmin.rpc("decrementar_credito", {
            estudiante_id: estudianteCreditoId,
            cantidad: creditosUsados,
          })

          if (errorRpc) {
            console.error("❌ Error en RPC decrementar_credito:", errorRpc)
            // IMPORTANTE: No lanzamos error ni retornamos HTTP 500 para no romper la respuesta a GetNet
          } else {
            console.log("✅ Créditos descontados exitosamente de la base de datos")

            // Protección contra doble descuento (reintentos de webhook)
            const nuevosDetalles = { ...detalles, creditos_descontados: true }
            await supabaseAdmin
              .from("pedidos")
              .update({ detalles: nuevosDetalles })
              .eq("id", pedido.id)
          }
        } catch (errorCreditos) {
          console.error("💥 Excepción inesperada al intentar descontar créditos:", errorCreditos)
          // IMPORTANTE: Capturamos la excepción para asegurar que el webhook finaliza bien
        }
      }
    }
    // --- FIN LÓGICA DE DESCUENTO DE CRÉDITOS ---

    // Respuesta exitosa para GetNet
    return NextResponse.json({
      success: true,
      message: "Estado actualizado correctamente",
      transaction_id: reference,
      nuevo_estado: estadoPago,
    })
  } catch (error) {
    console.error("💥 Error procesando webhook:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
