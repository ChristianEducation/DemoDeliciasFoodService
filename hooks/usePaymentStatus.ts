"use client"

import { useState, useEffect } from "react"

interface PaymentStatus {
  estado: string
  pedido?: any
  loading: boolean
  error?: string
}

export function usePaymentStatus(orderId: string | null, autoRefresh = true) {
  const [status, setStatus] = useState<PaymentStatus>({
    estado: "pendiente",
    loading: false,
  })

  const consultarEstado = async () => {
    if (!orderId) return

    setStatus((prev) => ({ ...prev, loading: true, error: undefined }))

    try {
      const response = await fetch(`/api/payment/status/${orderId}`)
      const data = await response.json()

      if (data.success) {
        setStatus({
          estado: data.estado,
          pedido: data.pedido,
          loading: false,
        })
      } else {
        setStatus((prev) => ({
          ...prev,
          loading: false,
          error: data.error || "Error consultando estado",
        }))
      }
    } catch (error) {
      console.error("Error consultando estado:", error)
      setStatus((prev) => ({
        ...prev,
        loading: false,
        error: "Error de conexión",
      }))
    }
  }

  useEffect(() => {
    if (!orderId || !autoRefresh) return

    // Consulta inicial
    consultarEstado()

    // Solo hacer polling si el estado está pendiente
    const interval = setInterval(() => {
      if (status.estado === "pendiente") {
        consultarEstado()
      }
    }, 10000) // Cada 10 segundos

    return () => clearInterval(interval)
  }, [orderId, autoRefresh, status.estado])

  return {
    ...status,
    refetch: consultarEstado,
  }
}
