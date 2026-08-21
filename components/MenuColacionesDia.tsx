"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Minus, Trash2, Clock, ShoppingCart } from 'lucide-react'
import type { DiaInfo } from "@/hooks/useSemanaAlmuerzos"
import type { GrupoSnack } from "@/lib/types"

interface MenuColacionesDiaProps {
  dia: DiaInfo
  gruposSnack: GrupoSnack[]
  destinatario: { id: string; nombre: string; tipo: "estudiante" | "funcionario" }
  onAgregarColacion: (
    destinatarioId: string,
    fecha: string,
    colacion: { codigo: string; descripcion: string; precio: number },
  ) => void
  onRemoverColacion: (destinatarioId: string, fecha: string, codigoColacion: string) => void
  onSetCantidad: (destinatarioId: string, fecha: string, codigoColacion: string, cantidad: number) => void
  tieneColacion: (destinatarioId: string, fecha: string, codigoColacion: string) => boolean
  getCantidad: (destinatarioId: string, fecha: string, codigoColacion: string) => number
}

export default function MenuColacionesDia({
  dia,
  gruposSnack,
  destinatario,
  onAgregarColacion,
  onRemoverColacion,
  onSetCantidad,
  tieneColacion,
  getCantidad,
}: MenuColacionesDiaProps) {
  const [seleccionesBebida, setSeleccionesBebida] = useState<Record<string, string>>({})

  const bloqueado = dia.bloqueado || dia.esPasado

  // Validación de datos
  if (!gruposSnack || gruposSnack.length === 0) {
    return (
      <Card className="opacity-60">
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">No hay grupos de snacks disponibles</p>
        </CardContent>
      </Card>
    )
  }

  // Calcular selecciones para este día
  const todasLasColaciones = gruposSnack.flatMap(grupo => grupo.opciones)
  const seleccionesDelDia = todasLasColaciones.filter(colacion => 
    tieneColacion(destinatario.id, dia.fecha, colacion.codigo)
  )
  
  const totalColaciones = seleccionesDelDia.reduce((total, colacion) => {
    return total + getCantidad(destinatario.id, dia.fecha, colacion.codigo)
  }, 0)
  
  const totalPrecio = seleccionesDelDia.reduce((total, colacion) => {
    const cantidad = getCantidad(destinatario.id, dia.fecha, colacion.codigo)
    return total + colacion.precio * cantidad
  }, 0)

  // Manejar selección de bebida
  const handleSeleccionarBebida = (grupoSnack: string, codigoColacion: string) => {
    const colacion = todasLasColaciones.find(c => c.codigo === codigoColacion)
    if (colacion && !bloqueado) {
      onAgregarColacion(destinatario.id, dia.fecha, {
        codigo: colacion.codigo,
        descripcion: colacion.descripcion,
        precio: colacion.precio
      })
      setSeleccionesBebida(prev => ({
        ...prev,
        [`${grupoSnack}-${dia.fecha}`]: codigoColacion
      }))
    }
  }

  // Manejar cambios de cantidad
  const handleIncrementar = (codigoColacion: string) => {
    const cantidadActual = getCantidad(destinatario.id, dia.fecha, codigoColacion)
    onSetCantidad(destinatario.id, dia.fecha, codigoColacion, cantidadActual + 1)
  }

  const handleDecrementar = (codigoColacion: string) => {
    onRemoverColacion(destinatario.id, dia.fecha, codigoColacion)
  }

  const handleEliminar = (codigoColacion: string, grupoSnack: string) => {
    onSetCantidad(destinatario.id, dia.fecha, codigoColacion, 0)
    setSeleccionesBebida(prev => {
      const newState = { ...prev }
      delete newState[`${grupoSnack}-${dia.fecha}`]
      return newState
    })
  }

  // Obtener colación seleccionada para un grupo
  const getColacionSeleccionada = (grupo: GrupoSnack) => {
    return grupo.opciones.find(colacion => 
      tieneColacion(destinatario.id, dia.fecha, colacion.codigo)
    )
  }

  return (
    <Card className={`${bloqueado ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-lg sm:text-xl">
                {dia.diaSemana} {dia.numeroDia}
              </span>
              <div className="flex flex-wrap gap-2">
                {dia.bloqueado && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Bloqueado
                  </Badge>
                )}
                {dia.esPasado && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                    Pasado
                  </Badge>
                )}
                {totalColaciones > 0 && (
                  <Badge variant="default" className="bg-green-600 text-white text-xs">
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    {totalColaciones} colaciones - ${totalPrecio.toLocaleString()}
                  </Badge>
                )}
              </div>
            </CardTitle>
            {dia.bloqueado && (
              <p className="text-xs sm:text-sm text-orange-600 mt-1">
                Las opciones para hoy ya no están disponibles (después de las 9:00 AM)
              </p>
            )}
          </div>
          {destinatario && (
            <div className="text-left sm:text-right flex-shrink-0">
              <div className="text-sm font-medium text-gray-700 truncate">{destinatario.nombre}</div>
              <div className="text-xs text-gray-500">
                {destinatario.tipo === "funcionario" ? "Funcionario" : "Estudiante"}
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Grid de cards de snacks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gruposSnack.map((grupo) => {
            const colacionSeleccionada = getColacionSeleccionada(grupo)
            const cantidad = colacionSeleccionada ? getCantidad(destinatario.id, dia.fecha, colacionSeleccionada.codigo) : 0

            return (
              <Card key={grupo.snack} className={`${
                bloqueado 
                  ? "opacity-50" 
                  : colacionSeleccionada 
                  ? "border-blue-500 bg-blue-50" 
                  : "hover:border-gray-300"
              }`}>
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    {/* Emoji y nombre del snack */}
                    <div className="space-y-2">
                      <div className="text-3xl">{grupo.emoji}</div>
                      <h3 className="font-medium text-sm text-gray-900 leading-tight">
                        {grupo.snack}
                      </h3>
                      <div className="text-xs text-gray-600">
                        {grupo.opciones.length} opciones • desde ${grupo.precioMinimo.toLocaleString()}
                      </div>
                    </div>

                    {/* Selector de bebida */}
                    {!colacionSeleccionada ? (
                      <Select 
                        onValueChange={(value) => handleSeleccionarBebida(grupo.snack, value)}
                        disabled={bloqueado}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar bebida" />
                        </SelectTrigger>
                        <SelectContent>
                          {grupo.opciones.map((opcion) => (
                            <SelectItem key={opcion.codigo} value={opcion.codigo}>
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{opcion.bebestible}</span>
                                <span className="text-sm text-green-600">${opcion.precio.toLocaleString()}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-3">
                        {/* Mostrar selección actual */}
                        <div className="p-3 bg-white border border-blue-200 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">
                            {colacionSeleccionada.bebestible}
                          </div>
                          <div className="text-sm text-green-600 font-medium">
                            ${colacionSeleccionada.precio.toLocaleString()}
                          </div>
                        </div>

                        {/* Controles de cantidad */}
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDecrementar(colacionSeleccionada.codigo)}
                            disabled={bloqueado}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>

                          <span className="min-w-[2rem] text-center font-medium">
                            {cantidad}
                          </span>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleIncrementar(colacionSeleccionada.codigo)}
                            disabled={bloqueado}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEliminar(colacionSeleccionada.codigo, grupo.snack)}
                            disabled={bloqueado}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Opción para cambiar bebida */}
                        <Select 
                          value={colacionSeleccionada.codigo}
                          onValueChange={(value) => {
                            // Primero eliminar la selección actual
                            handleEliminar(colacionSeleccionada.codigo, grupo.snack)
                            // Luego agregar la nueva selección
                            setTimeout(() => {
                              handleSeleccionarBebida(grupo.snack, value)
                            }, 100)
                          }}
                          disabled={bloqueado}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Cambiar bebida" />
                          </SelectTrigger>
                          <SelectContent>
                            {grupo.opciones.map((opcion) => (
                              <SelectItem key={opcion.codigo} value={opcion.codigo}>
                                <div className="flex flex-col items-start">
                                  <span className="font-medium">{opcion.bebestible}</span>
                                  <span className="text-sm text-green-600">${opcion.precio.toLocaleString()}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Total para esta selección */}
                        <div className="pt-2 border-t border-blue-200">
                          <Badge variant="default" className="bg-blue-600 text-white">
                            Total: ${(colacionSeleccionada.precio * cantidad).toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Mensaje si no hay selecciones */}
        {totalColaciones === 0 && !bloqueado && (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">Selecciona bebidas para los snacks que desees</p>
          </div>
        )}

        {/* Mensaje si está bloqueado */}
        {bloqueado && (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">
              {dia.esPasado 
                ? "Este día ya pasó" 
                : "Las colaciones para este día ya no están disponibles"
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
