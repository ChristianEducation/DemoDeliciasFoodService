import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { calcularSemanasDelMes } from "@/utils/calcular-semanas"

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

    console.log(`📊 [API] Calculando ingresos semanales para ${mes}/${año}`)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calcular semanas del mes
    const semanas = calcularSemanasDelMes(mes, año)

    if (semanas.length === 0) {
      return NextResponse.json({
        success: true,
        ingresos: [],
        mes,
        año,
      })
    }

    // Obtener todos los items del mes
    const primerDia = semanas[0].inicio
    const ultimoDia = semanas[semanas.length - 1].fin

    const { data: items, error } = await supabase
      .from("pedidos_item")
      .select("fecha, subtotal, pedido_id")
      .gte("fecha", primerDia.toISOString().split("T")[0])
      .lte("fecha", ultimoDia.toISOString().split("T")[0])

    if (error) {
      console.error("❌ [API] Error al obtener items:", error)
      throw error
    }

    // Obtener estados de pago de los pedidos
    const pedidoIds = [...new Set(items?.map((item) => item.pedido_id) || [])]
    const { data: pedidos, error: pedidosError } = await supabase
      .from("pedidos")
      .select("id, estado_pago")
      .in("id", pedidoIds)

    if (pedidosError) {
      console.error("❌ [API] Error al obtener pedidos:", error)
      throw pedidosError
    }

    // Crear mapa de pedido_id -> estado_pago
    const estadosPago = new Map(pedidos?.map((p) => [p.id, p.estado_pago]) || [])

    // Agrupar por semana y estado de pago
    const ingresosPorSemana = semanas.map((semana) => {
      const itemsSemana = items?.filter((item) => {
        const fechaItem = new Date(item.fecha + "T00:00:00")
        return fechaItem >= semana.inicio && fechaItem <= semana.fin
      })

      let pagado = 0
      let fmd = 0
      let pgc = 0

      itemsSemana?.forEach((item) => {
        const estadoPago = estadosPago.get(item.pedido_id)
        if (estadoPago === "pagado") {
          pagado += item.subtotal
        } else if (estadoPago === "FMD") {
          fmd += item.subtotal
        } else if (estadoPago === "PGC") {
          pgc += item.subtotal
        }
      })

      return {
        semana: `Semana ${semana.numero}`,
        semana_numero: semana.numero,
        pagado,
        fmd,
        pgc,
        total: pagado + fmd + pgc,
      }
    })

    console.log(`✅ [API] Ingresos semanales calculados: ${ingresosPorSemana.length} semanas`)

    return NextResponse.json({
      success: true,
      ingresos: ingresosPorSemana,
      mes,
      año,
    })
  } catch (error: any) {
    console.error("❌ [API] Error en ingresos-semanales:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al calcular ingresos semanales",
      },
      { status: 500 },
    )
  }
}
