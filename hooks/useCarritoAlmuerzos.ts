"use client"

import { useState, useEffect } from "react"

export interface OpcionAlmuerzo {
  codigo_opcion: string
  descripcion_opcion: string
  categoria: string
  fecha: string
  dia_semana: string
  cantidad: number
  precio_unitario: number // Agregamos precio unitario
  subtotal: number // Agregamos subtotal
}

export interface PedidoDestinatario {
  id: string
  nombre: string
  tipo: "estudiante" | "funcionario" // Agregamos tipo para determinar precio
  nivel?: string // Agregamos nivel para hijos de funcionarios
  pedidos: Record<string, OpcionAlmuerzo[]> // fecha -> array de opciones con cantidades
}

export interface CarritoAlmuerzos {
  destinatarios: PedidoDestinatario[]
}

// Precios fijos
const PRECIOS = {
  ESTUDIANTE: 5500,
  FUNCIONARIO: 5250,
  HIJO_FUNCIONARIO_BASICO: 5250, // Preschool, LowerSchool, MiddleSchool
  HIJO_FUNCIONARIO_ALTO: 5250, // HighSchool
} as const

export function useCarritoAlmuerzos(
  destinatariosIniciales: { id: string; nombre: string; tipo?: "estudiante" | "funcionario"; nivel?: string }[],
) {
  const [carrito, setCarrito] = useState<CarritoAlmuerzos>({ destinatarios: [] })

  // Detectar si estamos en flujo "funcionario-con-hijos"
  const esFlujoFuncionarioConHijos =
    typeof window !== "undefined" && !!localStorage.getItem("funcionarioConHijosSeleccionado")

  // Función para determinar precio según tipo y nivel
  const determinarPrecioCarrito = (destinatario: { tipo: string; nivel?: string }) => {
    // Funcionario adulto
    if (destinatario.tipo === "funcionario") return PRECIOS.FUNCIONARIO

    // Hijo de funcionario
    if (esFlujoFuncionarioConHijos && destinatario.tipo === "estudiante") {
      const nivelesBasicos = ["PRESCHOOL", "LOWERSCHOOL", "MIDDLESCHOOL"]
      const nivelesAltos = ["HIGHSCHOOL"]

      if (destinatario.nivel && nivelesBasicos.includes(destinatario.nivel.toUpperCase())) {
        return PRECIOS.HIJO_FUNCIONARIO_BASICO
      }
      if (destinatario.nivel && nivelesAltos.includes(destinatario.nivel.toUpperCase())) {
        return PRECIOS.HIJO_FUNCIONARIO_ALTO
      }
    }

    // Estudiante normal
    return PRECIOS.ESTUDIANTE
  }

  // Inicializar carrito con destinatarios
  useEffect(() => {
    setCarrito({
      destinatarios: destinatariosIniciales.map((dest) => ({
        id: dest.id,
        nombre: dest.nombre,
        tipo: dest.tipo || "estudiante", // Por defecto estudiante
        nivel: dest.nivel, // Incluir nivel para hijos de funcionarios
        pedidos: {},
      })),
    })
  }, [destinatariosIniciales])

  const agregarOpcion = (
    destinatarioId: string,
    fecha: string,
    opcionBase: Omit<OpcionAlmuerzo, "cantidad" | "precio_unitario" | "subtotal">,
  ) => {
    setCarrito((prev) => ({
      destinatarios: prev.destinatarios.map((dest) => {
        if (dest.id === destinatarioId) {
          const pedidosActuales = dest.pedidos[fecha] || []
          const opcionExistente = pedidosActuales.find((p) => p.codigo_opcion === opcionBase.codigo_opcion)

          // Determinar precio según tipo y nivel del destinatario
          const precioUnitario = determinarPrecioCarrito(dest)

          if (opcionExistente) {
            // Si ya existe, incrementar cantidad y recalcular subtotal
            const nuevaCantidad = opcionExistente.cantidad + 1
            const nuevoSubtotal = precioUnitario * nuevaCantidad

            return {
              ...dest,
              pedidos: {
                ...dest.pedidos,
                [fecha]: pedidosActuales.map((p) =>
                  p.codigo_opcion === opcionBase.codigo_opcion
                    ? { ...p, cantidad: nuevaCantidad, subtotal: nuevoSubtotal }
                    : p,
                ),
              },
            }
          } else {
            // Si no existe, agregar con cantidad 1
            const nuevaOpcion: OpcionAlmuerzo = {
              ...opcionBase,
              cantidad: 1,
              precio_unitario: precioUnitario,
              subtotal: precioUnitario,
            }
            return {
              ...dest,
              pedidos: {
                ...dest.pedidos,
                [fecha]: [...pedidosActuales, nuevaOpcion],
              },
            }
          }
        }
        return dest
      }),
    }))
  }

  const removerOpcion = (destinatarioId: string, fecha: string, codigoOpcion: string) => {
    setCarrito((prev) => ({
      destinatarios: prev.destinatarios.map((dest) => {
        if (dest.id === destinatarioId) {
          const pedidosActuales = dest.pedidos[fecha] || []
          const opcionExistente = pedidosActuales.find((p) => p.codigo_opcion === codigoOpcion)

          if (opcionExistente && opcionExistente.cantidad > 1) {
            // Si tiene más de 1, decrementar cantidad y recalcular subtotal
            const nuevaCantidad = opcionExistente.cantidad - 1
            const nuevoSubtotal = opcionExistente.precio_unitario * nuevaCantidad

            return {
              ...dest,
              pedidos: {
                ...dest.pedidos,
                [fecha]: pedidosActuales.map((p) =>
                  p.codigo_opcion === codigoOpcion ? { ...p, cantidad: nuevaCantidad, subtotal: nuevoSubtotal } : p,
                ),
              },
            }
          } else {
            // Si tiene 1 o menos, remover completamente
            return {
              ...dest,
              pedidos: {
                ...dest.pedidos,
                [fecha]: pedidosActuales.filter((p) => p.codigo_opcion !== codigoOpcion),
              },
            }
          }
        }
        return dest
      }),
    }))
  }

  const setCantidadOpcion = (destinatarioId: string, fecha: string, codigoOpcion: string, cantidad: number) => {
    if (cantidad <= 0) {
      // Si la cantidad es 0 o menor, remover la opción
      setCarrito((prev) => ({
        destinatarios: prev.destinatarios.map((dest) => {
          if (dest.id === destinatarioId) {
            const pedidosActuales = dest.pedidos[fecha] || []
            return {
              ...dest,
              pedidos: {
                ...dest.pedidos,
                [fecha]: pedidosActuales.filter((p) => p.codigo_opcion !== codigoOpcion),
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
            const pedidosActuales = dest.pedidos[fecha] || []
            return {
              ...dest,
              pedidos: {
                ...dest.pedidos,
                [fecha]: pedidosActuales.map((p) => {
                  if (p.codigo_opcion === codigoOpcion) {
                    const nuevoSubtotal = p.precio_unitario * cantidad
                    return { ...p, cantidad, subtotal: nuevoSubtotal }
                  }
                  return p
                }),
              },
            }
          }
          return dest
        }),
      }))
    }
  }

  const tieneOpcion = (destinatarioId: string, fecha: string, codigoOpcion: string): boolean => {
    const destinatario = carrito.destinatarios.find((d) => d.id === destinatarioId)
    if (!destinatario) return false

    const pedidosDia = destinatario.pedidos[fecha] || []
    return pedidosDia.some((p) => p.codigo_opcion === codigoOpcion)
  }

  const getCantidadOpcion = (destinatarioId: string, fecha: string, codigoOpcion: string): number => {
    const destinatario = carrito.destinatarios.find((d) => d.id === destinatarioId)
    if (!destinatario) return 0

    const pedidosDia = destinatario.pedidos[fecha] || []
    const opcion = pedidosDia.find((p) => p.codigo_opcion === codigoOpcion)
    return opcion ? opcion.cantidad : 0
  }

  const getTotalSelecciones = (): number => {
    return carrito.destinatarios.reduce((total, dest) => {
      return (
        total +
        Object.values(dest.pedidos).reduce((subtotal, opciones) => {
          return subtotal + opciones.reduce((sum, opcion) => sum + opcion.cantidad, 0)
        }, 0)
      )
    }, 0)
  }

  const getTotalPrecio = (): number => {
    return carrito.destinatarios.reduce((total, dest) => {
      return (
        total +
        Object.values(dest.pedidos).reduce((subtotal, opciones) => {
          return subtotal + opciones.reduce((sum, opcion) => sum + opcion.subtotal, 0)
        }, 0)
      )
    }, 0)
  }

  const getTotalPorDestinatario = (destinatarioId: string): number => {
    const destinatario = carrito.destinatarios.find((d) => d.id === destinatarioId)
    if (!destinatario) return 0

    return Object.values(destinatario.pedidos).reduce((total, opciones) => {
      return total + opciones.reduce((sum, opcion) => sum + opcion.subtotal, 0)
    }, 0)
  }

  const limpiarCarrito = () => {
    setCarrito((prev) => ({
      destinatarios: prev.destinatarios.map((dest) => ({
        ...dest,
        pedidos: {},
      })),
    }))
  }

  return {
    carrito,
    agregarOpcion,
    removerOpcion,
    setCantidadOpcion,
    tieneOpcion,
    getCantidadOpcion,
    getTotalSelecciones,
    getTotalPrecio,
    getTotalPorDestinatario,
    limpiarCarrito,
    PRECIOS, // Exportar precios para uso en componentes
  }
}
