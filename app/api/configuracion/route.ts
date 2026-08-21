export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// GET: Obtener configuración de horarios de bloqueo
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Configuración de servidor incompleta", success: false }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabase.from("configuracion_bloqueo").select("*").limit(1).single()

    if (error) {
      console.error("Error al obtener configuración:", error)
      return NextResponse.json({ error: error.message, success: false }, { status: 500 })
    }

    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error("Error en API configuración:", error)
    return NextResponse.json({ error: "Error interno del servidor", success: false }, { status: 500 })
  }
}

// PUT: Actualizar configuración de horarios de bloqueo
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { hora_limite_lunes, hora_limite_semana } = body

    if (hora_limite_lunes === undefined || hora_limite_semana === undefined) {
      return NextResponse.json({ error: "Faltan parámetros requeridos", success: false }, { status: 400 })
    }

    if (hora_limite_lunes < 0 || hora_limite_lunes > 23 || hora_limite_semana < 0 || hora_limite_semana > 23) {
      return NextResponse.json({ error: "Las horas deben estar entre 0 y 23", success: false }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Configuración de servidor incompleta", success: false }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: idData, error: idError } = await supabase.from("configuracion_bloqueo").select("id").limit(1).single()
    if (idError) {
      console.error("Error al obtener ID de configuración:", idError)
      return NextResponse.json({ error: idError.message, success: false }, { status: 500 })
    }

    const { data, error } = await supabase
      .from("configuracion_bloqueo")
      .update({
        hora_limite_lunes,
        hora_limite_semana,
        updated_at: new Date().toISOString(),
      })
      .eq("id", idData?.id)
      .select()
      .single()

    if (error) {
      console.error("Error al actualizar configuración:", error)
      return NextResponse.json({ error: error.message, success: false }, { status: 500 })
    }

    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error("Error en API configuración:", error)
    return NextResponse.json({ error: "Error interno del servidor", success: false }, { status: 500 })
  }
}

