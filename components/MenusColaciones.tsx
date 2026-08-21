"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle } from 'lucide-react'
import MenuColacionesDia from "@/components/MenuColacionesDia"
import type { DiaInfo } from "@/hooks/useSemanaAlmuerzos"
import type { ColacionSupabase, GrupoSnack } from "@/lib/types"

interface MenusColacionesProps {
  diasSemana: DiaInfo[]
  destinatarios: { id: string; nombre: string; tipo: "estudiante" | "funcionario" }[]
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

// Función para obtener emoji según el tipo de snack
function getSnackEmoji(snack: string): string {
  const snackLower = snack.toLowerCase()
  if (snackLower.includes('yogurt')) return '🥛'
  if (snackLower.includes('miga')) return '🥪'
  if (snackLower.includes('muffin')) return '🧁'
  if (snackLower.includes('galleton')) return '🍪'
  if (snackLower.includes('galleta')) return '🍘'
  if (snackLower.includes('nutripon')) return '🍫'
  if (snackLower.includes('super')) return '🥨'
  if (snackLower.includes('puff')) return '🍚'
  return '🥪'
}

// Función para agrupar colaciones por snack
function agruparPorSnack(colaciones: ColacionSupabase[]): GrupoSnack[] {
  const grupos = colaciones.reduce((acc, colacion) => {
    if (!acc[colacion.snack]) {
      acc[colacion.snack] = []
    }
    acc[colacion.snack].push(colacion)
    return acc
  }, {} as Record<string, ColacionSupabase[]>)

  return Object.entries(grupos).map(([snack, opciones]) => ({
    snack,
    emoji: getSnackEmoji(snack),
    opciones,
    precioMinimo: Math.min(...opciones.map(o => o.precio))
  }))
}

export default function MenusColaciones({
  diasSemana,
  destinatarios,
  onAgregarColacion,
  onRemoverColacion,
  onSetCantidad,
  tieneColacion,
  getCantidad,
}: MenusColacionesProps) {
  const [colaciones, setColaciones] = useState<ColacionSupabase[]>([])
  const [gruposSnack, setGruposSnack] = useState<GrupoSnack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [destinatarioActivo, setDestinatarioActivo] = useState(destinatarios[0]?.id || "")

  const supabase = createClient()

  useEffect(() => {
    if (destinatarios.length > 0 && !destinatarioActivo) {
      setDestinatarioActivo(destinatarios[0].id)
    }
  }, [destinatarios, destinatarioActivo])

  useEffect(() => {
    async function fetchColaciones() {
      setLoading(true)
      setError(null)

      try {
        // Cargar datos completos incluyendo snack y bebestible
        const { data, error } = await supabase
          .from("colaciones")
          .select("codigo, descripcion, snack, bebestible, precio")
          .order("snack", { ascending: true })
          .order("precio", { ascending: true })

        if (error) throw error

        const colacionesData = data || []
        setColaciones(colacionesData)
        
        // Agrupar por snack
        const grupos = agruparPorSnack(colacionesData)
        setGruposSnack(grupos)
        
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando colaciones")
      } finally {
        setLoading(false)
      }
    }

    fetchColaciones()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando opciones de colaciones...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-2">Error cargando colaciones</p>
          <p className="text-sm text-gray-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (colaciones.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">No hay colaciones disponibles</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Selector de destinatario - Responsive */}
      {destinatarios.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Seleccionar para:</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={destinatarioActivo} onValueChange={setDestinatarioActivo}>
              <TabsList
                className={`grid w-full ${destinatarios.length <= 2 ? "grid-cols-2" : destinatarios.length <= 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3"} gap-1`}
              >
                {destinatarios.map((destinatario) => (
                  <TabsTrigger key={destinatario.id} value={destinatario.id} className="text-xs sm:text-sm p-2 sm:p-3">
                    <div className="flex flex-col items-center min-w-0">
                      <span className="truncate max-w-full">{destinatario.nombre}</span>
                      <span className="text-xs text-gray-500 mt-1">
                        {destinatario.tipo === "funcionario" ? "Funcionario" : "Estudiante"}
                      </span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Información sobre colaciones */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="text-blue-600 text-2xl">🥪</div>
            <div>
              <h3 className="font-medium text-blue-800 mb-1">Colaciones Disponibles</h3>
              <p className="text-sm text-blue-700">
                Las mismas opciones están disponibles todos los días de la semana. Puedes seleccionar múltiples
                colaciones por día.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {colaciones.length} opciones en {gruposSnack.length} tipos de snacks
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menús por día - Responsive */}
      <div className="grid gap-4 sm:gap-6">
        {diasSemana.map((dia) => {
          const destinatarioActual = destinatarios.find((d) => d.id === destinatarioActivo)

          if (!destinatarioActual) return null

          return (
            <MenuColacionesDia
              key={dia.fecha}
              dia={dia}
              gruposSnack={gruposSnack}
              destinatario={destinatarioActual}
              onAgregarColacion={onAgregarColacion}
              onRemoverColacion={onRemoverColacion}
              onSetCantidad={onSetCantidad}
              tieneColacion={tieneColacion}
              getCantidad={getCantidad}
            />
          )
        })}
      </div>
    </div>
  )
}
