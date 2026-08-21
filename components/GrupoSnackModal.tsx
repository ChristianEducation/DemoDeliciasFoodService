"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, X } from 'lucide-react'
import type { GrupoSnack } from "@/lib/types"
import type { DiaInfo } from "@/hooks/useSemanaAlmuerzos"

interface GrupoSnackModalProps {
  isOpen: boolean
  onClose: () => void
  grupo: GrupoSnack | null
  dia: DiaInfo
  destinatario: { id: string; nombre: string; tipo: "estudiante" | "funcionario" }
  onAgregarColacion: (
    destinatarioId: string,
    fecha: string,
    colacion: { codigo: string; descripcion: string; precio: number }
  ) => void
  onRemoverColacion: (destinatarioId: string, fecha: string, codigoColacion: string) => void
  onSetCantidad: (destinatarioId: string, fecha: string, codigoColacion: string, cantidad: number) => void
  tieneColacion: (destinatarioId: string, fecha: string, codigoColacion: string) => boolean
  getCantidad: (destinatarioId: string, fecha: string, codigoColacion: string) => number
}

export default function GrupoSnackModal({
  isOpen,
  onClose,
  grupo,
  dia,
  destinatario,
  onAgregarColacion,
  onRemoverColacion,
  onSetCantidad,
  tieneColacion,
  getCantidad,
}: GrupoSnackModalProps) {
  if (!grupo) return null

  const handleAgregar = (colacion: any) => {
    onAgregarColacion(destinatario.id, dia.fecha, {
      codigo: colacion.codigo,
      descripcion: colacion.descripcion,
      precio: colacion.precio
    })
  }

  const handleRemover = (codigo: string) => {
    onRemoverColacion(destinatario.id, dia.fecha, codigo)
  }

  const handleSetCantidad = (codigo: string, cantidad: number) => {
    onSetCantidad(destinatario.id, dia.fecha, codigo, cantidad)
  }

  // Calcular totales del grupo para este día y destinatario
  const seleccionesGrupo = grupo.opciones.filter(opcion => 
    tieneColacion(destinatario.id, dia.fecha, opcion.codigo)
  )
  
  const totalCantidad = seleccionesGrupo.reduce((sum, opcion) => 
    sum + getCantidad(destinatario.id, dia.fecha, opcion.codigo), 0
  )
  
  const totalPrecio = seleccionesGrupo.reduce((sum, opcion) => 
    sum + (getCantidad(destinatario.id, dia.fecha, opcion.codigo) * opcion.precio), 0
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl">{grupo.emoji}</span>
            <div>
              <div className="text-lg font-semibold">{grupo.snack}</div>
              <div className="text-sm text-gray-500 font-normal">
                {dia.diaSemana} {dia.numeroDia} • {destinatario.nombre}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumen de selecciones actuales */}
          {totalCantidad > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-green-800">
                      {totalCantidad} seleccionado{totalCantidad !== 1 ? 's' : ''}
                    </div>
                    <div className="text-sm text-green-600">
                      Total: ${totalPrecio.toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {grupo.snack}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de opciones de bebida */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">
              Opciones de bebida ({grupo.opciones.length})
            </h3>
            
            {grupo.opciones.map((opcion) => {
              const cantidad = getCantidad(destinatario.id, dia.fecha, opcion.codigo)
              const tieneSeleccion = tieneColacion(destinatario.id, dia.fecha, opcion.codigo)
              
              return (
                <Card key={opcion.codigo} className={`transition-colors ${
                  tieneSeleccion ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          + {opcion.bebestible}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {opcion.descripcion}
                        </div>
                        <div className="text-lg font-bold text-blue-600 mt-1">
                          ${opcion.precio.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {tieneSeleccion ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (cantidad > 1) {
                                  handleSetCantidad(opcion.codigo, cantidad - 1)
                                } else {
                                  handleRemover(opcion.codigo)
                                }
                              }}
                              className="h-8 w-8 p-0"
                            >
                              {cantidad > 1 ? <Minus className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            </Button>
                            
                            <span className="min-w-[2rem] text-center font-medium">
                              {cantidad}
                            </span>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetCantidad(opcion.codigo, cantidad + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleAgregar(opcion)}
                            size="sm"
                            className="px-4"
                          >
                            Agregar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {totalCantidad > 0 && (
            <Button onClick={onClose} className="px-6">
              Confirmar ({totalCantidad})
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
