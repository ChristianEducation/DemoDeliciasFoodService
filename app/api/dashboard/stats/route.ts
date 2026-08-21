import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    console.log("📊 [API Dashboard Stats] Iniciando consulta...")

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

    // Obtener todos los pedidos
    const { data: pedidos, error: errorPedidos } = await supabase
      .from("pedidos")
      .select("id, total, estado_pago, nombre_cliente, created_at")
      .order("created_at", { ascending: false })

    if (errorPedidos) {
      console.error("❌ Error al obtener pedidos:", errorPedidos)
      return NextResponse.json({ error: errorPedidos.message, success: false }, { status: 500 })
    }

    // Calcular estadísticas
    const totalPedidos = pedidos?.length || 0
    const pedidosPagados = pedidos?.filter((p) => p.estado_pago === "pagado") || []
    const pedidosFMD = pedidos?.filter((p) => p.estado_pago === "FMD") || []
    const pedidosPGC = pedidos?.filter((p) => p.estado_pago === "PGC") || []

    const totalVentas = pedidosPagados.reduce((sum, p) => sum + (p.total || 0), 0)
    const totalFMD = pedidosFMD.reduce((sum, p) => sum + (p.total || 0), 0)
    const totalPGC = pedidosPGC.reduce((sum, p) => sum + (p.total || 0), 0)

    const clientesUnicos = new Set(pedidos?.map((p) => p.nombre_cliente)).size
    const tasaExito = totalPedidos > 0 ? (pedidosPagados.length / totalPedidos) * 100 : 0

    // Calcular comparativa con mes anterior
    const hoy = new Date()
    const mesActual = hoy.getMonth() + 1
    const añoActual = hoy.getFullYear()

    const primerDiaMesActual = new Date(añoActual, mesActual - 1, 1)
    const primerDiaMesAnterior = new Date(añoActual, mesActual - 2, 1)
    const ultimoDiaMesAnterior = new Date(añoActual, mesActual - 1, 0)

    const pedidosMesActual = pedidos?.filter((p) => new Date(p.created_at) >= primerDiaMesActual) || []
    const pedidosMesAnterior =
      pedidos?.filter(
        (p) => new Date(p.created_at) >= primerDiaMesAnterior && new Date(p.created_at) <= ultimoDiaMesAnterior,
      ) || []

    const ventasMesActual = pedidosMesActual
      .filter((p) => p.estado_pago === "pagado")
      .reduce((sum, p) => sum + (p.total || 0), 0)
    const ventasMesAnterior = pedidosMesAnterior
      .filter((p) => p.estado_pago === "pagado")
      .reduce((sum, p) => sum + (p.total || 0), 0)

    const cambioVentas = ventasMesAnterior > 0 ? ((ventasMesActual - ventasMesAnterior) / ventasMesAnterior) * 100 : 0

    console.log("✅ [API Dashboard Stats] Estadísticas calculadas")

    return NextResponse.json({
      success: true,
      stats: {
        totalPedidos,
        totalVentas,
        totalFMD,
        totalPGC,
        clientesUnicos,
        tasaExito,
        cantidadPagados: pedidosPagados.length,
        cantidadFMD: pedidosFMD.length,
        cantidadPGC: pedidosPGC.length,
        cambioVentas,
      },
    })
  } catch (error: any) {
    console.error("❌ Error inesperado:", error)
    return NextResponse.json({ error: error.message || "Error desconocido", success: false }, { status: 500 })
  }
}
