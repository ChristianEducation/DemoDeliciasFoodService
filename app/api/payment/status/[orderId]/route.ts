import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/utils/supabase/admin"

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const { orderId } = params

    if (!orderId) {
      return NextResponse.json({ error: "Order ID requerido" }, { status: 400 })
    }

    console.log("🔍 Consultando estado del pedido:", orderId)

    // Usar cliente admin para consultar
    const { data: pedido, error } = await supabaseAdmin
      .from("pedidos")
      .select("*")
      .eq("transaction_id", orderId)
      .single()

    if (error) {
      console.error("❌ Error consultando Supabase:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Error consultando base de datos",
          source: "supabase",
        },
        { status: 500 },
      )
    }

    if (!pedido) {
      console.log("❌ Pedido no encontrado en Supabase:", orderId)
      return NextResponse.json(
        {
          success: false,
          error: "Pedido no encontrado",
          source: "supabase",
        },
        { status: 404 },
      )
    }

    console.log("✅ Estado encontrado:", {
      transaction_id: orderId,
      estado: pedido.estado_pago,
      fecha: pedido.created_at,
    })

    // En producción, también consultar GetNet si el estado está pendiente
    if (pedido.estado_pago === "pendiente" && process.env.GETNET_ENVIRONMENT === "production") {
      try {
        console.log("🔄 Consultando estado en GetNet...")

        const login = process.env.GETNET_LOGIN
        const secretKey = process.env.GETNET_SECRET
        const baseUrl = process.env.GETNET_BASE_URL

        if (!login || !secretKey || !baseUrl) {
          throw new Error("Credenciales de GetNet no configuradas")
        }

        // Generar autenticación
        const nonce = Buffer.from(Math.random().toString()).toString("base64")
        const seed = new Date().toISOString()
        const tranKey = Buffer.from(
          require("crypto")
            .createHash("sha256")
            .update(nonce + seed + secretKey)
            .digest(),
        ).toString("base64")

        const authData = {
          auth: {
            login: login,
            tranKey: tranKey,
            nonce: Buffer.from(nonce).toString("base64"),
            seed: seed,
          },
        }

        // Consultar GetNet
        const getnetResponse = await fetch(`${baseUrl}/api/session/${pedido.detalles?.getnetRequestId || orderId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(authData),
        })

        if (getnetResponse.ok) {
          const getnetData = await getnetResponse.json()
          console.log("📊 Respuesta de GetNet:", getnetData)

          // Actualizar estado según respuesta de GetNet
          let nuevoEstado = "pendiente"
          if (getnetData.status?.status === "APPROVED") {
            nuevoEstado = "pagado"
          } else if (getnetData.status?.status === "REJECTED") {
            nuevoEstado = "fallido"
          }

          // Actualizar en Supabase si cambió el estado
          if (nuevoEstado !== pedido.estado_pago) {
            const { error: updateError } = await supabaseAdmin
              .from("pedidos")
              .update({
                estado_pago: nuevoEstado,
                detalles: {
                  ...pedido.detalles,
                  getnetConsulta: getnetData,
                  ultimaConsulta: new Date().toISOString(),
                },
              })
              .eq("transaction_id", orderId)

            if (updateError) {
              console.error("❌ Error actualizando estado:", updateError)
            } else {
              console.log("✅ Estado actualizado a:", nuevoEstado)
            }
          }

          return NextResponse.json({
            success: true,
            orderId,
            status: nuevoEstado,
            total: pedido.total,
            fecha: pedido.fecha,
            cliente: pedido.nombre_cliente,
            email: pedido.email_cliente,
            getnetData: getnetData,
            source: "getnet",
          })
        }
      } catch (getnetError) {
        console.error("⚠️ Error consultando GetNet:", getnetError)
      }
    }

    return NextResponse.json({
      success: true,
      estado: pedido.estado_pago,
      pedido: {
        id: pedido.id,
        transaction_id: pedido.transaction_id,
        estado_pago: pedido.estado_pago,
        total: pedido.total,
        nombre_cliente: pedido.nombre_cliente,
        email_cliente: pedido.email_cliente,
        fecha: pedido.fecha,
        created_at: pedido.created_at,
        updated_at: pedido.updated_at,
      },
      source: "supabase",
    })
  } catch (error) {
    console.error("💥 Error consultando estado:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
        source: "server",
      },
      { status: 500 },
    )
  }
}
