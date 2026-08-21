"use client"

import { useState, useEffect } from "react"

export interface OpcionColacion {
  codigo: string
  descripcion: string
  precio: number
  cantidad: number
  subtotal: number
}

export interface PedidoDestinatarioColaciones {
  id: string
  nombre: string
  tipo: "estudiante" | "funcionario"
  colaciones: Record<string, OpcionColacion[]> // fecha -> array de colaciones con cantidades
}

export interface CarritoColaciones {
  destinatarios: PedidoDestinatarioColaciones[]
}

export function useCarritoColaciones(
  destinatariosIniciales: { id: string; nombre: string; tipo?: "estudiante" | "funcionario" }[],
) {
  const [carrito, setCarrito] = useState<CarritoColaciones>({ destinatarios: [] })

  // Inicializar carrito con destinatarios
  useEffect(() => {
    setCarrito({
      destinatarios: destinatariosIniciales.map((dest) => ({
        id: dest.id,
        nombre: dest.nombre,
        tipo: dest.tipo || "estudiante",
        colaciones: {},
      })),
    })
  }, [destinatariosIniciales])

  const agregarColacion = (
    destinatarioId: string,
    fecha: string,
    colacionBase: { codigo: string; descripcion: string; precio: number },
  ) => {
    setCarrito((prev) => ({
      destinatarios: prev.destinatarios.map((dest) => {
        if (dest.id === destinatarioId) {
          const colacionesActuales = dest.colaciones[fecha] || []
          const colacionExistente = colacionesActuales.find((c) => c.codigo === colacionBase.codigo)

          if (colacionExistente) {
            // Si ya existe, incrementar cantidad y recalcular subtotal
            const nuevaCantidad = colacionExistente.cantidad + 1
            const nuevoSubtotal = colacionBase.precio * nuevaCantidad

            return {
              ...dest,
              colaciones: {
                ...dest.colaciones,
                [fecha]: colacionesActuales.map((c) =>
                  c.codigo === colacionBase.codigo ? { ...c, cantidad: nuevaCantidad, subtotal: nuevoSubtotal } : c,
                ),
              },
            }
          } else {
            // Si no existe, agregar con cantidad 1
            const nuevaColacion: OpcionColacion = {
              ...colacionBase,
              cantidad: 1,
              subtotal: colacionBase.precio,
            }
            return {
              ...dest,
              colaciones: {
                ...dest.colaciones,
                [fecha]: [...colacionesActuales, nuevaColacion],
              },
            }
          }
        }
        return dest
      }),
    }))
  }

  const removerColacion = (destinatarioId: string, fecha: string, codigoColacion: string) => {
    setCarrito((prev) => ({
      destinatarios: prev.destinatarios.map((dest) => {
        if (dest.id === destinatarioId) {
          const colacionesActuales = dest.colaciones[fecha] || []
          const colacionExistente = colacionesActuales.find((c) => c.codigo === codigoColacion)

          if (colacionExistente && colacionExistente.cantidad > 1) {
            // Si tiene más de 1, decrementar cantidad y recalcular subtotal
            const nuevaCantidad = colacionExistente.cantidad - 1
            const nuevoSubtotal = colacionExistente.precio * nuevaCantidad

            return {
              ...dest,
              colaciones: {
                ...dest.colaciones,
                [fecha]: colacionesActuales.map((c) =>
                  c.codigo === codigoColacion ? { ...c, cantidad: nuevaCantidad, subtotal: nuevoSubtotal } : c,
                ),
              },
            }
          } else {
            // Si tiene 1 o menos, remover completamente
            return {
              ...dest,
              colaciones: {
                ...dest.colaciones,
                [fecha]: colacionesActuales.filter((c) => c.codigo !== codigoColacion),
              },
            }
          }
        }
        return dest
      }),
    }))
  }

  const setCantidadColacion = (destinatarioId: string, fecha: string, codigoColacion: string, cantidad: number) => {
    if (cantidad <= 0) {
      // Si la cantidad es 0 o menor, remover la colación
      setCarrito((prev) => ({
        destinatarios: prev.destinatarios.map((dest) => {
          if (dest.id === destinatarioId) {
            const colacionesActuales = dest.colaciones[fecha] || []
            return {
              ...dest,
              colaciones: {
                ...dest.colaciones,
                [fecha]: colacionesActuales.filter((c) => c.codigo !== codigoColacion),
              },
            }
          }
          return dest
        }),
      }))
    } else {
      // Actualizar cantidad y recalcular subtotal
      setCarrito((prev) => ({
        destinatarios: prev.destinatarios.map((dest) => {
          if (dest.id === destinatarioId) {
            const colacionesActuales = dest.colaciones[fecha] || []
            return {
              ...dest,
              colaciones: {
                ...dest.colaciones,
                [fecha]: colacionesActuales.map((c) => {
                  if (c.codigo === codigoColacion) {
                    const nuevoSubtotal = c.precio * cantidad
                    return { ...c, cantidad, subtotal: nuevoSubtotal }
                  }
                  return c
                }),
              },
            }
          }
          return dest
        }),
      }))
    }
  }

  const tieneColacion = (destinatarioId: string, fecha: string, codigoColacion: string): boolean => {
    const destinatario = carrito.destinatarios.find((d) => d.id === destinatarioId)
    if (!destinatario) return false

    const colacionesDia = destinatario.colaciones[fecha] || []
    return colacionesDia.some((c) => c.codigo === codigoColacion)
  }

  const getCantidadColacion = (destinatarioId: string, fecha: string, codigoColacion: string): number => {
    const destinatario = carrito.destinatarios.find((d) => d.id === destinatarioId)
    if (!destinatario) return 0

    const colacionesDia = destinatario.colaciones[fecha] || []
    const colacion = colacionesDia.find((c) => c.codigo === codigoColacion)
    return colacion ? colacion.cantidad : 0
  }

  const getTotalSelecciones = (): number => {
    return carrito.destinatarios.reduce((total, dest) => {
      return (
        total +
        Object.values(dest.colaciones).reduce((subtotal, colaciones) => {
          return subtotal + colaciones.reduce((sum, colacion) => sum + colacion.cantidad, 0)
        }, 0)
      )
    }, 0)
  }

  const getTotalPrecio = (): number => {
    return carrito.destinatarios.reduce((total, dest) => {
      return (
        total +
        Object.values(dest.colaciones).reduce((subtotal, colaciones) => {
          return subtotal + colaciones.reduce((sum, colacion) => sum + colacion.subtotal, 0)
        }, 0)
      )
    }, 0)
  }

  const getTotalPorDestinatario = (destinatarioId: string): number => {
    const destinatario = carrito.destinatarios.find((d) => d.id === destinatarioId)
    if (!destinatario) return 0

    return Object.values(destinatario.colaciones).reduce((total, colaciones) => {
      return total + colaciones.reduce((sum, colacion) => sum + colacion.subtotal, 0)
    }, 0)
  }

  const limpiarCarrito = () => {
    setCarrito((prev) => ({
      destinatarios: prev.destinatarios.map((dest) => ({
        ...dest,
        colaciones: {},
      })),
    }))
  }

  return {
    carrito,
    agregarColacion,
    removerColacion,
    setCantidadColacion,
    tieneColacion,
    getCantidadColacion,
    getTotalSelecciones,
    getTotalPrecio,
    getTotalPorDestinatario,
    limpiarCarrito,
  }
}
