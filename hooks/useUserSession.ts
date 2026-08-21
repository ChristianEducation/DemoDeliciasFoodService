"use client"

import { useState, useEffect } from "react"
import type { TIPOS_USUARIO } from "@/utils/constants"

export type TipoUsuario = (typeof TIPOS_USUARIO)[keyof typeof TIPOS_USUARIO]

interface UserSession {
  tipoUsuario: TipoUsuario | null
  destinatariosSeleccionados: string[]
  pedidoActual: any
}

export function useUserSession() {
  const [session, setSession] = useState<UserSession>({
    tipoUsuario: null,
    destinatariosSeleccionados: [],
    pedidoActual: null,
  })

  // Cargar datos del localStorage al inicializar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const tipoUsuario = localStorage.getItem("tipoUsuario") as TipoUsuario
      const destinatarios = JSON.parse(localStorage.getItem("destinatariosSeleccionados") || "[]")
      const pedido = JSON.parse(localStorage.getItem("pedidoActual") || "null")

      if (tipoUsuario) {
        setSession({
          tipoUsuario,
          destinatariosSeleccionados: destinatarios,
          pedidoActual: pedido,
        })
      }
    }
  }, [])

  const setTipoUsuario = (tipo: TipoUsuario) => {
    setSession((prev) => ({ ...prev, tipoUsuario: tipo }))
    localStorage.setItem("tipoUsuario", tipo)
  }

  const setDestinatarios = (destinatarios: string[]) => {
    setSession((prev) => ({ ...prev, destinatariosSeleccionados: destinatarios }))
    localStorage.setItem("destinatariosSeleccionados", JSON.stringify(destinatarios))
  }

  const setPedido = (pedido: any) => {
    setSession((prev) => ({ ...prev, pedidoActual: pedido }))
    localStorage.setItem("pedidoActual", JSON.stringify(pedido))
  }

  const limpiarSession = () => {
    setSession({
      tipoUsuario: null,
      destinatariosSeleccionados: [],
      pedidoActual: null,
    })
    localStorage.removeItem("tipoUsuario")
    localStorage.removeItem("destinatariosSeleccionados")
    localStorage.removeItem("pedidoActual")
  }

  const isSessionLoaded = () => {
    return typeof window !== "undefined"
  }

  return {
    session,
    setTipoUsuario,
    setDestinatarios,
    setPedido,
    limpiarSession,
    isSessionLoaded,
  }
}
