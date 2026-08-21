import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Test Webhook - Simulando notificación de GetNet")

    const body = await request.json()
    const { transaction_id, status } = body

    console.log("📥 Datos del test webhook:", { transaction_id, status })

    if (!transaction_id) {
      return NextResponse.json({ error: "transaction_id requerido" }, { status: 400 })
    }

    const supabase = createClient()

    // Mapear estados de prueba a nuestros estados
    const estadoMap: Record<string, string> = {
      approved: "pagado",
      rejected: "fallido",
      pending: "pendiente",
      failed: "fallido",
      cancelled: "cancelado",
    }

    const nuevoEstado = estadoMap[status] || "pendiente"

    console.log("📝 Actualizando pedido de prueba:", {
      transaction_id,
      statusRecibido: status,
      nuevoEstado,
    })

    // Actualizar estado del pedido
    const { data, error } = await supabase
      .from("pedidos")
      .update({
        estado_pago: nuevoEstado,
        detalles: {
          testWebhook: {
            status: status,
            timestamp: new Date().toISOString(),
            simulado: true,
          },
          updatedAt: new Date().toISOString(),
        },
        observaciones: `Estado actualizado via test webhook: ${status} -> ${nuevoEstado}`,
      })
      .eq("transaction_id", transaction_id)
      .select()

    if (error) {
      console.error("❌ Error actualizando pedido:", error)
      return NextResponse.json({ error: "Error actualizando pedido" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.log("⚠️ No se encontró pedido con transaction_id:", transaction_id)
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
    }

    console.log("✅ Pedido actualizado exitosamente:", data[0])

    return NextResponse.json({
      success: true,
      message: "Test webhook procesado correctamente",
      pedido: data[0],
      estadoAnterior: data[0].estado_pago,
      estadoNuevo: nuevoEstado,
      simulado: true,
    })
  } catch (error) {
    console.error("💥 Error procesando test webhook:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "test-webhook-simulator",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    description: "Simulador de webhooks para pruebas",
  })
}
