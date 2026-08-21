import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    console.log("📊 [API Distribución] Iniciando consulta...")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Variables de entorno faltantes")
      return NextResponse.json({ error: "Configuración de servidor incompleta", success: false }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Obtener mes actual
    const hoy = new Date()
    const mesActual = hoy.getMonth() + 1
    const añoActual = hoy.getFullYear()
    const primerDia = `${añoActual}-${mesActual.toString().padStart(2, "0")}-01`
    const ultimoDiaNum = new Date(añoActual, mesActual, 0).getDate()
    const ultimoDia = `${añoActual}-${mesActual.toString().padStart(2, "0")}-${ultimoDiaNum.toString().padStart(2, "0")}`

    console.log("📅 [API Distribución] Mes actual desde:", primerDia, "hasta:", ultimoDia)

    // Consultar pedidos del mes actual
    const { data: pedidos, error: errorPedidos } = await supabase
      .from("pedidos")
      .select("id, tipo_cliente, created_at")
      .gte("created_at", `${primerDia}T00:00:00`)
      .lte("created_at", `${ultimoDia}T23:59:59`)

    if (errorPedidos) {
      console.error("❌ Error al obtener pedidos:", errorPedidos)
      return NextResponse.json({ error: errorPedidos.message, success: false }, { status: 500 })
    }

    // Consultar items del mes actual
    const { data: items, error: errorItems } = await supabase
      .from("pedidos_item")
      .select("tipo, subtotal, cantidad")
      .gte("fecha", primerDia)
      .lte("fecha", ultimoDia)
      .in("estado_pago", ["pagado", "FMD", "PGC"])

    if (errorItems) {
      console.error("❌ Error al obtener items:", errorItems)
      return NextResponse.json({ error: errorItems.message, success: false }, { status: 500 })
    }

    console.log("✅ [API Distribución] Pedidos:", pedidos?.length || 0, "Items:", items?.length || 0)

    const porTipoClienteObj: Record<string, number> = {}
    pedidos?.forEach((pedido) => {
      const tipo = pedido.tipo_cliente || "sin_especificar"
      porTipoClienteObj[tipo] = (porTipoClienteObj[tipo] || 0) + 1
    })

    const totalClientes = pedidos?.length || 0
    const porTipoCliente = Object.entries(porTipoClienteObj).map(([tipo, cantidad]) => ({
      tipo,
      cantidad,
      porcentaje: totalClientes > 0 ? (cantidad / totalClientes) * 100 : 0,
    }))

    const porTipoProductoObj: Record<string, { cantidad: number; monto: number }> = {}
    items?.forEach((item) => {
      const tipo = item.tipo || "sin_especificar"
      if (!porTipoProductoObj[tipo]) {
        porTipoProductoObj[tipo] = { cantidad: 0, monto: 0 }
      }
      porTipoProductoObj[tipo].cantidad += item.cantidad || 0
      porTipoProductoObj[tipo].monto += item.subtotal || 0
    })

    const totalProductos = Object.values(porTipoProductoObj).reduce((sum, item) => sum + item.cantidad, 0)
    const porTipoProducto = Object.entries(porTipoProductoObj).map(([tipo, data]) => ({
      tipo,
      cantidad: data.cantidad,
      monto_total: data.monto,
      porcentaje: totalProductos > 0 ? (data.cantidad / totalProductos) * 100 : 0,
    }))

    console.log("✅ [API Distribución] Datos calculados con porcentajes")

    return NextResponse.json({
      success: true,
      distribucion: {
        por_tipo_cliente: porTipoCliente,
        por_tipo_producto: porTipoProducto,
      },
    })
  } catch (error: any) {
    console.error("❌ Error inesperado:", error)
    return NextResponse.json({ error: error.message || "Error desconocido", success: false }, { status: 500 })
  }
}
