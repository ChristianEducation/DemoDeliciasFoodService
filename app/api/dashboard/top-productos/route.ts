import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    console.log("🏆 [API Top Productos] Iniciando consulta...")

    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "5")

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

    console.log("📅 [API Top Productos] Mes actual desde:", primerDia, "hasta:", ultimoDia)

    // Consultar items del mes actual
    const { data: items, error } = await supabase
      .from("pedidos_item")
      .select("codigo, descripcion, cantidad, subtotal, tipo")
      .gte("fecha", primerDia)
      .lte("fecha", ultimoDia)
      .in("estado_pago", ["pagado", "FMD", "PGC"])

    if (error) {
      console.error("❌ Error en Supabase:", error)
      return NextResponse.json({ error: error.message, success: false }, { status: 500 })
    }

    console.log("✅ [API Top Productos] Items encontrados:", items?.length || 0)

    // Agrupar por código y descripción
    const productosPorCodigo: Record<
      string,
      {
        codigo: string
        descripcion: string
        tipo: string
        cantidad: number
        monto_total: number
      }
    > = {}

    items?.forEach((item) => {
      const key = `${item.codigo}-${item.descripcion}`

      if (!productosPorCodigo[key]) {
        productosPorCodigo[key] = {
          codigo: item.codigo,
          descripcion: item.descripcion,
          tipo: item.tipo,
          cantidad: 0,
          monto_total: 0,
        }
      }

      productosPorCodigo[key].cantidad += item.cantidad || 0
      productosPorCodigo[key].monto_total += item.subtotal || 0
    })

    // Convertir a array, ordenar por cantidad y limitar
    const topProductos = Object.values(productosPorCodigo)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, limit)

    console.log("✅ [API Top Productos] Top productos calculados:", topProductos.length)

    return NextResponse.json({
      success: true,
      productos: topProductos,
    })
  } catch (error: any) {
    console.error("❌ Error inesperado:", error)
    return NextResponse.json({ error: error.message || "Error desconocido", success: false }, { status: 500 })
  }
}
