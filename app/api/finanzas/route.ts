import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    console.log("🔵 [SERVIDOR] 🔵 [API Finanzas] Iniciando consulta...")

    const searchParams = request.nextUrl.searchParams
    const mes = Number.parseInt(searchParams.get("mes") || "0")
    const año = Number.parseInt(searchParams.get("año") || "0")

    console.log("🔵 [SERVIDOR] 🔵 [API Finanzas] Consultando mes:", mes, "año:", año)

    if (!mes || !año || mes < 1 || mes > 12) {
      return NextResponse.json({ error: "Mes o año inválido", success: false }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ [SERVIDOR] Variables de entorno faltantes")
      return NextResponse.json({ error: "Configuración de servidor incompleta", success: false }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Crear fechas en formato YYYY-MM-DD (sin hora)
    const primerDia = `${año}-${mes.toString().padStart(2, "0")}-01`

    // Calcular último día del mes
    const ultimoDiaNum = new Date(año, mes, 0).getDate()
    const ultimoDia = `${año}-${mes.toString().padStart(2, "0")}-${ultimoDiaNum.toString().padStart(2, "0")}`

    console.log("📅 [SERVIDOR] 🔵 [API Finanzas] Desde:", primerDia, "hasta:", ultimoDia)

    // Consultar pedidos_item con límite alto para traer todos
    const { data: items, error } = await supabase
      .from("pedidos_item")
      .select("id, fecha, subtotal, estado_pago")
      .gte("fecha", primerDia)
      .lte("fecha", ultimoDia)
      .in("estado_pago", ["pagado", "FMD", "PGC"])
      .order("fecha", { ascending: true })
      .limit(10000) // Asegurar que traiga todos los items

    if (error) {
      console.error("❌ [SERVIDOR] Error en Supabase:", error)
      return NextResponse.json({ error: error.message, success: false }, { status: 500 })
    }

    console.log("✅ [SERVIDOR] 🔵 [API Finanzas] Items encontrados:", items?.length || 0)

    const estadosPorTipo = (items || []).reduce(
      (acc, item) => {
        acc[item.estado_pago] = (acc[item.estado_pago] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    console.log("📊 [SERVIDOR] Items por estado:", estadosPorTipo)

    // Limpiar datos - mantener fecha como string simple
    const itemsLimpios = (items || []).map((item) => ({
      id: item.id,
      fecha: typeof item.fecha === "string" ? item.fecha.split("T")[0] : item.fecha, // Asegurar formato YYYY-MM-DD
      subtotal: item.subtotal,
      estado_pago: item.estado_pago,
    }))

    console.log("📦 [SERVIDOR] 🔵 [API Finanzas] Datos limpiados:", itemsLimpios.length, "registros")
    console.log("✅ [SERVIDOR] 🔵 [API Finanzas] Enviando respuesta...")

    return NextResponse.json({
      success: true,
      total: itemsLimpios.length,
      items: itemsLimpios,
    })
  } catch (error: any) {
    console.error("❌ [SERVIDOR] Error inesperado:", error)
    return NextResponse.json({ error: error.message || "Error desconocido", success: false }, { status: 500 })
  }
}
