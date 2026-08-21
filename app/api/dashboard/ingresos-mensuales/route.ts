import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    console.log("📈 [API Ingresos Mensuales] Iniciando consulta...")

    const searchParams = request.nextUrl.searchParams
    const meses = Number.parseInt(searchParams.get("meses") || "12")

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

    // Calcular fecha de inicio (hace X meses)
    const fechaFin = new Date()
    const fechaInicio = new Date()
    fechaInicio.setMonth(fechaInicio.getMonth() - meses)

    const fechaInicioStr = fechaInicio.toISOString().split("T")[0]
    const fechaFinStr = fechaFin.toISOString().split("T")[0]

    console.log("📅 [API Ingresos Mensuales] Desde:", fechaInicioStr, "hasta:", fechaFinStr)

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

    console.log("✅ [API Ingresos Mensuales] Items encontrados:", items?.length || 0)

    // Agrupar por mes y estado de pago
    const ingresosPorMes: Record<string, { pagado: number; fmd: number; pgc: number; total: number }> = {}

    items?.forEach((item) => {
      const fecha = new Date(item.fecha + "T00:00:00")
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}` // YYYY-MM

      if (!ingresosPorMes[mes]) {
        ingresosPorMes[mes] = { pagado: 0, fmd: 0, pgc: 0, total: 0 }
      }

      const monto = item.subtotal || 0
      ingresosPorMes[mes].total += monto

      if (item.estado_pago === "pagado") {
        ingresosPorMes[mes].pagado += monto
      } else if (item.estado_pago === "FMD") {
        ingresosPorMes[mes].fmd += monto
      } else if (item.estado_pago === "PGC") {
        ingresosPorMes[mes].pgc += monto
      }
    })

    // Convertir a array y ordenar por mes
    const ingresos = Object.entries(ingresosPorMes)
      .map(([mes, montos]) => ({
        mes,
        ...montos,
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes))

    console.log("✅ [API Ingresos Mensuales] Datos agrupados:", ingresos.length, "meses")

    return NextResponse.json({
      success: true,
      ingresos,
    })
  } catch (error: any) {
    console.error("❌ Error inesperado:", error)
    return NextResponse.json({ error: error.message || "Error desconocido", success: false }, { status: 500 })
  }
}
