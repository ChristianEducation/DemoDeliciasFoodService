"use client"

import { useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"

// Respaldo silencioso: aunque la conexión en tiempo real esté funcionando,
// esto revisa igual cada cierto tiempo. Es deliberadamente simple (siempre
// activo, sin lógica condicional de "solo si falla el tiempo real") porque
// el costo es bajo y detectar desconexiones agrega complejidad innecesaria.
const INTERVALO_RESPALDO_MS = 90_000

/**
 * Detecta cambios en pedidos/pedidos_item (vía Supabase Realtime + un respaldo
 * por intervalo) y expone un aviso para que la pantalla lo muestre, sin
 * reemplazar los datos en pantalla por su cuenta.
 */
export function useAvisoActualizacion(supabase: SupabaseClient) {
  const [hayNuevos, setHayNuevos] = useState(false)

  useEffect(() => {
    const marcarCambio = () => setHayNuevos(true)

    const canal = supabase
      .channel("pedidos-cambios")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, marcarCambio)
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos_item" }, marcarCambio)
      .subscribe()

    const intervalo = setInterval(marcarCambio, INTERVALO_RESPALDO_MS)

    return () => {
      supabase.removeChannel(canal)
      clearInterval(intervalo)
    }
  }, [supabase])

  return { hayNuevos, limpiarAviso: () => setHayNuevos(false) }
}
