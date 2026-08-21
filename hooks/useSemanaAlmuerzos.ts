"use client"

import { useState, useMemo, useEffect } from "react"
import { DateTime } from "luxon"
import { dateToYYYYMMDD, getStartOfWeek, getEndOfWeek, getWeekDays } from "@/utils/date-helpers"
import { obtenerFechaChile } from "@/utils/chile-time"
import { supabase } from "@/lib/supabase"

export function useSemanaAlmuerzos() {
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [config, setConfig] = useState({ hora_limite_lunes: 21, hora_limite_semana: 21 })
  const [feriados, setFeriados] = useState<string[]>([])

  useEffect(() => {
    supabase
      .from("configuracion_bloqueo")
      .select("hora_limite_lunes, hora_limite_semana")
      .single()
      .then(({ data }) => {
        if (data) {
          setConfig(data)
        }
      })

    supabase
      .from("dias_feriados")
      .select("fecha")
      .then(({ data }) => {
        if (data) {
          setFeriados(data.map((f) => f.fecha))
        }
      })
  }, [])

  const fechasCalculadas = useMemo(() => {
    const hoy = new Date()
    const fechaBase = new Date(hoy)
    fechaBase.setDate(hoy.getDate() + semanaOffset * 7)

    const inicioSemana = getStartOfWeek(fechaBase)
    const finSemana = getEndOfWeek(fechaBase)
    const diasSemanaBase = getWeekDays(inicioSemana)

    const ahoraChile = DateTime.now().setZone("America/Santiago")
    const fechaHoyChile = obtenerFechaChile()

    const diasSemana = diasSemanaBase.map((dia) => {
      const fechaDia = new Date(dia.fecha + "T00:00:00")
      const fechaDiaLuxon = DateTime.fromISO(dia.fecha, { zone: "America/Santiago" })
      const timestampDia = fechaDia.getTime()
      const timestampHoyChile = fechaHoyChile.getTime()
      const esPasado = timestampDia < timestampHoyChile

      let bloqueado = false
      const weekdayDia = fechaDiaLuxon.weekday

      if (weekdayDia === 1) {
        const domingoAnterior = fechaDiaLuxon.minus({ days: 1 })
        const limiteDomingo = domingoAnterior.set({
          hour: config.hora_limite_lunes,
          minute: 0,
          second: 0,
          millisecond: 0,
        })

        if (ahoraChile >= limiteDomingo) {
          bloqueado = true
        }
      }

      if (weekdayDia !== 1) {
        const diaAnterior = fechaDiaLuxon.minus({ days: 1 })
        const limiteDiaAnterior = diaAnterior.set({
          hour: config.hora_limite_semana,
          minute: 0,
          second: 0,
          millisecond: 0,
        })

        if (ahoraChile >= limiteDiaAnterior) {
          bloqueado = true
        }
      }

      if (feriados.includes(dia.fecha)) {
        bloqueado = true
      }

      const numeroDia = fechaDia.getDate()

      return {
        ...dia,
        esPasado,
        bloqueado,
        numeroDia,
      }
    })

    const diasDisponibles = diasSemana.filter((dia) => !dia.esPasado && !dia.bloqueado)

    return {
      fechaInicioSemana: dateToYYYYMMDD(inicioSemana),
      fechaFinSemana: dateToYYYYMMDD(finSemana),
      diasSemana,
      diasDisponibles,
    }
  }, [semanaOffset, config, feriados])

  const avanzarSemana = () => {
    setSemanaOffset((prev) => prev + 1)
  }

  const retrocederSemana = () => {
    setSemanaOffset((prev) => Math.max(prev - 1, 0))
  }

  const puedeRetroceder = semanaOffset > 0

  return {
    semanaOffset,
    ...fechasCalculadas,
    avanzarSemana,
    retrocederSemana,
    puedeRetroceder,
  }
}

