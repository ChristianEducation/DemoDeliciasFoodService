"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, User, DollarSign } from "lucide-react"
import type { CarritoAlmuerzos } from "@/hooks/useCarritoAlmuerzos"

interface ResumenCarritoProps {
  carrito: CarritoAlmuerzos
  onContinuar: () => void
}

export default function ResumenCarrito({ carrito, onContinuar }: ResumenCarritoProps) {
  const getTotalSelecciones = () => {
    return carrito.destinatarios.reduce((total, dest) => {
      return (
        total +
        Object.values(dest.pedidos).reduce((subtotal, opciones) => {
          return subtotal + opciones.reduce((sum, opcion) => sum + opcion.cantidad, 0)
        }, 0)
      )
    }, 0)
  }

  const getTotalPrecio = () => {
    return carrito.destinatarios.reduce((total, dest) => {
      return (
        total +
        Object.values(dest.pedidos).reduce((subtotal, opciones) => {
          return subtotal + opciones.reduce((sum, opcion) => sum + opcion.subtotal, 0)
        }, 0)
      )
    }, 0)
  }

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha + "T00:00:00")
    return date.toLocaleDateString("es-CL", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  }

  const totalSelecciones = getTotalSelecciones()
  const totalPrecio = getTotalPrecio()

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Resumen de Almuerzos</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalSelecciones === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-sm">No hay almuerzos seleccionados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resumen por destinatario */}
            <div className="space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
              {carrito.destinatarios.map((destinatario) => {
                const seleccionesDestinatario = Object.values(destinatario.pedidos).reduce(
                  (total, opciones) => total + opciones.reduce((sum, opcion) => sum + opcion.cantidad, 0),
                  0,
                )

                const totalDestinatario = Object.values(destinatario.pedidos).reduce(
                  (total, opciones) => total + opciones.reduce((sum, opcion) => sum + opcion.subtotal, 0),
                  0,
                )

                if (seleccionesDestinatario === 0) return null

                return (
                  <div key={destinatario.id} className="border-l-4 border-blue-500 pl-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{destinatario.nombre}</span>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {destinatario.tipo === "funcionario" ? "Func." : "Est."}
                        </Badge>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-sm font-medium text-green-600">${totalDestinatario.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{seleccionesDestinatario} almuerzos</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {Object.entries(destinatario.pedidos).map(([fecha, opciones]) => {
                        if (opciones.length === 0) return null

                        const totalDia = opciones.reduce((sum, opcion) => sum + opcion.subtotal, 0)

                        return (
                          <div key={fecha} className="text-xs text-gray-600">
                            <div className="flex justify-between items-center font-medium mb-1">
                              <span>{formatearFecha(fecha)}:</span>
                              <span className="text-green-600">${totalDia.toLocaleString()}</span>
                            </div>
                            <div className="ml-2 space-y-1">
                              {opciones.map((opcion) => (
                                <div key={opcion.codigo_opcion} className="flex items-center justify-between">
                                  <span className="truncate flex-1 mr-2">
                                    • {opcion.codigo_opcion}
                                    {opcion.categoria && <span className="text-gray-400"> ({opcion.categoria})</span>}
                                  </span>
                                  <div className="flex items-center space-x-1 flex-shrink-0">
                                    <Badge variant="outline" className="text-xs px-1">
                                      {opcion.cantidad}x
                                    </Badge>
                                    <span className="text-xs text-green-600">${opcion.subtotal.toLocaleString()}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total general */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">Total almuerzos:</span>
                <Badge variant="default">{totalSelecciones}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-base sm:text-lg flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Total a pagar:
                </span>
                <span className="font-bold text-base sm:text-lg text-green-600">${totalPrecio.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Botón continuar */}
        <Button onClick={onContinuar} disabled={totalSelecciones === 0} className="w-full" size="lg">
          {totalSelecciones === 0 ? (
            "Selecciona almuerzos"
          ) : (
            <span className="flex items-center justify-center">
              <span className="sm:hidden">Continuar - ${totalPrecio.toLocaleString()}</span>
              <span className="hidden sm:inline">Continuar - ${totalPrecio.toLocaleString()}</span>
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
