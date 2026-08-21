import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mesParam = searchParams.get("mes")
    const añoParam = searchParams.get("año")

    // Usar mes y año actual si no se especifican
    const ahora = new Date()
    const mes = mesParam ? Number.parseInt(mesParam) : ahora.getMonth() + 1
    const año = añoParam ? Number.parseInt(añoParam) : ahora.getFullYear()

    console.log(`📊 [API] Calculando heatmap para ${mes}/${año}`)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calcular primer y último día del mes
    const primerDia = new Date(año, mes - 1, 1)
    const ultimoDia = new Date(año, mes, 0)

    // Obtener todos los items del mes agrupados por fecha
    const { data: items, error } = await supabase
      .from("pedidos_item")
      .select("fecha, cantidad, subtotal")
      .gte("fecha", primerDia.toISOString().split("T")[0])
      .lte("fecha", ultimoDia.toISOString().split("T")[0])

    if (error) {
      console.error("❌ [API] Error al obtener items:", error)
      throw error
    }

    // Agrupar por fecha
    const datosPorFecha: Record<
      string,
      {
        fecha: string
        cantidad: number
        monto: number
      }
    > = {}

    items?.forEach((item) => {
      if (!datosPorFecha[item.fecha]) {
        datosPorFecha[item.fecha] = {
          fecha: item.fecha,
          cantidad: 0,
          monto: 0,
        }
      }
      datosPorFecha[item.fecha].cantidad += item.cantidad
      datosPorFecha[item.fecha].monto += item.subtotal
    })

    // Convertir a array y ordenar por fecha
    const heatmapData = Object.values(datosPorFecha).sort((a, b) => a.fecha.localeCompare(b.fecha))

    // Calcular valores máximos para normalización
    const maxCantidad = Math.max(...heatmapData.map((d) => d.cantidad), 1)
    const maxMonto = Math.max(...heatmapData.map((d) => d.monto), 1)

    // Agregar intensidad normalizada (0-1)
    const resultado = heatmapData.map((dato) => ({
      ...dato,
      intensidad: dato.cantidad / maxCantidad,
      dia: new Date(dato.fecha + "T00:00:00").getDate(),
    }))

    console.log(`✅ [API] Heatmap calculado: ${resultado.length} días con datos`)

    return NextResponse.json({
      success: true,
      heatmap: resultado,
      mes,
      año,
      maxCantidad,
      maxMonto,
    })
  } catch (error: any) {
    console.error("❌ [API] Error en heatmap:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al calcular heatmap",
      },
      { status: 500 },
    )
  }
}
