import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    console.log("📈 [API Ingresos Diarios] Iniciando consulta...")

    const searchParams = request.nextUrl.searchParams
    const dias = Number.parseInt(searchParams.get("dias") || "30")

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

    // Calcular fecha de inicio (hace X días)
    const fechaFin = new Date()
    const fechaInicio = new Date()
    fechaInicio.setDate(fechaInicio.getDate() - dias)

    const fechaInicioStr = fechaInicio.toISOString().split("T")[0]
    const fechaFinStr = fechaFin.toISOString().split("T")[0]

    console.log("📅 [API Ingresos Diarios] Desde:", fechaInicioStr, "hasta:", fechaFinStr)

    // Consultar items con fecha de entrega en el rango
    const { data: items, error } = await supabase
      .from("pedidos_item")
      .select("fecha, subtotal, estado_pago")
      .gte("fecha", fechaInicioStr)
      .lte("fecha", fechaFinStr)
      .in("estado_pago", ["pagado", "FMD", "PGC"])
      .order("fecha", { ascending: true })

    if (error) {
      console.error("❌ Error en Supabase:", error)
      return NextResponse.json({ error: error.message, success: false }, { status: 500 })
    }

    console.log("✅ [API Ingresos Diarios] Items encontrados:", items?.length || 0)

    // Agrupar por fecha y estado de pago
    const ingresosPorDia: Record<string, { pagado: number; fmd: number; pgc: number; total: number }> = {}

    items?.forEach((item) => {
      const fecha = item.fecha.split("T")[0] // Asegurar formato YYYY-MM-DD

      if (!ingresosPorDia[fecha]) {
        ingresosPorDia[fecha] = { pagado: 0, fmd: 0, pgc: 0, total: 0 }
      }

      const monto = item.subtotal || 0
      ingresosPorDia[fecha].total += monto

      if (item.estado_pago === "pagado") {
        ingresosPorDia[fecha].pagado += monto
      } else if (item.estado_pago === "FMD") {
        ingresosPorDia[fecha].fmd += monto
      } else if (item.estado_pago === "PGC") {
        ingresosPorDia[fecha].pgc += monto
      }
    })

    // Convertir a array y ordenar por fecha
    const ingresos = Object.entries(ingresosPorDia)
      .map(([fecha, montos]) => ({
        fecha,
        ...montos,
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))

    console.log("✅ [API Ingresos Diarios] Datos agrupados:", ingresos.length, "días")

    return NextResponse.json({
      success: true,
      ingresos,
    })
  } catch (error: any) {
    console.error("❌ Error inesperado:", error)
    return NextResponse.json({ error: error.message || "Error desconocido", success: false }, { status: 500 })
  }
}
