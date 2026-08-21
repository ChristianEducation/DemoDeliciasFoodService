"use client"

import { useState } from "react"

// Custom hook para manejar el estado del pedido (carrito)
export function usePedido() {
  const [pedido, setPedido] = useState({
    destinatarios: [],
    items: [],
    total: 0,
  })

  const agregarItem = (item: any) => {
    // Lógica para agregar item al pedido
  }

  const removerItem = (itemId: string) => {
    // Lógica para remover item del pedido
  }

  const limpiarPedido = () => {
    setPedido({
      destinatarios: [],
      items: [],
      total: 0,
    })
  }

  return {
    pedido,
    agregarItem,
    removerItem,
    limpiarPedido,
  }
}
