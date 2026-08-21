"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, DollarSign, Coffee } from "lucide-react"
import type { CarritoColaciones } from "@/hooks/useCarritoColaciones"

interface ResumenColacionesProps {
  carrito: CarritoColaciones
  onContinuar: () => void
}

export default function ResumenColaciones({ carrito, onContinuar }: ResumenColacionesProps) {
  const getTotalSelecciones = () => {
    return carrito.destinatarios.reduce((total, dest) => {
      return (
        total +
        Object.values(dest.colaciones).reduce((subtotal, colaciones) => {
          return subtotal + colaciones.reduce((sum, colacion) => sum + colacion.cantidad, 0)
        }, 0)
      )
    }, 0)
  }

  const getTotalPrecio = () => {
    return carrito.destinatarios.reduce((total, dest) => {
      return (
        total +
        Object.values(dest.colaciones).reduce((subtotal, colaciones) => {
          return subtotal + colaciones.reduce((sum, colacion) => sum + colacion.subtotal, 0)
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
          <Coffee className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Resumen de Colaciones</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalSelecciones === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <Coffee className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-sm">No hay colaciones seleccionadas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resumen por destinatario */}
            <div className="space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
              {carrito.destinatarios.map((destinatario) => {
                const seleccionesDestinatario = Object.values(destinatario.colaciones).reduce(
                  (total, colaciones) => total + colaciones.reduce((sum, colacion) => sum + colacion.cantidad, 0),
                  0,
                )

                const totalDestinatario = Object.values(destinatario.colaciones).reduce(
                  (total, colaciones) => total + colaciones.reduce((sum, colacion) => sum + colacion.subtotal, 0),
                  0,
                )

                if (seleccionesDestinatario === 0) return null

                return (
                  <div key={destinatario.id} className="border-l-4 border-orange-500 pl-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{destinatario.nombre}</span>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {destinatario.tipo === "funcionario" ? "Func." : "Est."}
                        </Badge>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-sm font-medium text-green-600">${totalDestinatario.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{seleccionesDestinatario} colaciones</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {Object.entries(destinatario.colaciones).map(([fecha, colaciones]) => {
                        if (colaciones.length === 0) return null

                        const totalDia = colaciones.reduce((sum, colacion) => sum + colacion.subtotal, 0)

                        return (
                          <div key={fecha} className="text-xs text-gray-600">
                            <div className="flex justify-between items-center font-medium mb-1">
                              <span>{formatearFecha(fecha)}:</span>
                              <span className="text-green-600">${totalDia.toLocaleString()}</span>
                            </div>
                            <div className="ml-2 space-y-1">
                              {colaciones.map((colacion) => (
                                <div key={colacion.codigo} className="flex items-center justify-between">
                                  <span className="truncate flex-1 mr-2">• {colacion.codigo}</span>
                                  <div className="flex items-center space-x-1 flex-shrink-0">
                                    <Badge variant="outline" className="text-xs px-1">
                                      {colacion.cantidad}x
                                    </Badge>
                                    <span className="text-xs text-green-600">
                                      ${colacion.subtotal.toLocaleString()}
                                    </span>
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
                <span className="font-medium text-sm">Total colaciones:</span>
                <Badge variant="default" className="bg-orange-600">
                  {totalSelecciones}
                </Badge>
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
            "Selecciona colaciones"
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
