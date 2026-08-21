"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Clock, AlertCircle } from "lucide-react"
import MenuDia from "@/components/MenuDia"
import type { DiaInfo } from "@/hooks/useSemanaAlmuerzos"

interface MenusSemanaProps {
  diasSemana: DiaInfo[]
  destinatarios: { id: string; nombre: string; tipo: "estudiante" | "funcionario"; nivel?: string }[]
  onAgregarOpcion: (
    destinatarioId: string,
    fecha: string,
    opcion: Omit<import("@/hooks/useCarritoAlmuerzos").OpcionAlmuerzo, "cantidad" | "precio_unitario" | "subtotal">,
  ) => void
  onRemoverOpcion: (destinatarioId: string, fecha: string, codigoOpcion: string) => void
  onSetCantidad: (destinatarioId: string, fecha: string, codigoOpcion: string, cantidad: number) => void
  tieneOpcion: (destinatarioId: string, fecha: string, codigoOpcion: string) => boolean
  getCantidad: (destinatarioId: string, fecha: string, codigoOpcion: string) => number
}

interface AlmuerzoSupabase {
  fecha: string
  dia_semana: string
  numero_dia: number
  codigo_opcion: number
  descripcion_opcion: string
  categoria: string
  activa: boolean
  pedidos_actuales: number
}

export default function MenusSemana({
  diasSemana,
  destinatarios,
  onAgregarOpcion,
  onRemoverOpcion,
  onSetCantidad,
  tieneOpcion,
  getCantidad,
}: MenusSemanaProps) {
  const [almuerzos, setAlmuerzos] = useState<Record<string, AlmuerzoSupabase[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [destinatarioActivo, setDestinatarioActivo] = useState(destinatarios[0]?.id || "")

  const supabase = createClient()

  // Detectar si estamos en flujo "funcionario-con-hijos"
  const esFlujoFuncionarioConHijos =
    typeof window !== "undefined" && !!localStorage.getItem("funcionarioConHijosSeleccionado")

  // Función para determinar precio a mostrar
  const determinarPrecioMostrar = (destinatario: { tipo: string; nivel?: string }) => {
    // Funcionario adulto
    if (destinatario.tipo === "funcionario") return "5,250"

    // Hijo de funcionario
    if (esFlujoFuncionarioConHijos && destinatario.tipo === "estudiante") {
      const nivelesBasicos = ["PRESCHOOL", "LOWERSCHOOL", "MIDDLESCHOOL"]
      const nivelesAltos = ["HIGHSCHOOL"]

      if (destinatario.nivel && nivelesBasicos.includes(destinatario.nivel.toUpperCase())) {
        return "5,250"
      }
      if (destinatario.nivel && nivelesAltos.includes(destinatario.nivel.toUpperCase())) {
        return "5,250"
      }
    }

    // Estudiante normal
    return "5,500"
  }

  useEffect(() => {
    if (destinatarios.length > 0 && !destinatarioActivo) {
      setDestinatarioActivo(destinatarios[0].id)
    }
  }, [destinatarios, destinatarioActivo])

  useEffect(() => {
    async function fetchAlmuerzos() {
      if (diasSemana.length === 0) return

      setLoading(true)
      setError(null)

      try {
        const fechaInicio = diasSemana[0].fecha
        const fechaFin = diasSemana[diasSemana.length - 1].fecha

        const { data, error } = await supabase
          .from("almuerzos")
          .select(
            "fecha, dia_semana, numero_dia, codigo_opcion, descripcion_opcion, categoria, activa, pedidos_actuales",
          )
          .gte("fecha", fechaInicio)
          .lte("fecha", fechaFin)
          .eq("activa", true)
          .order("fecha")
          .order("codigo_opcion")

        if (error) throw error

        // Agrupar por fecha
        const almuerzosPorFecha: Record<string, AlmuerzoSupabase[]> = {}
        data?.forEach((almuerzo) => {
          if (!almuerzosPorFecha[almuerzo.fecha]) {
            almuerzosPorFecha[almuerzo.fecha] = []
          }
          almuerzosPorFecha[almuerzo.fecha].push(almuerzo)
        })

        setAlmuerzos(almuerzosPorFecha)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando almuerzos")
      } finally {
        setLoading(false)
      }
    }

    fetchAlmuerzos()
  }, [diasSemana])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando menús de la semana...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-2">Error cargando menús</p>
          <p className="text-sm text-gray-600">{error}</p>
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
                      <span className="text-xs text-gray-500 mt-1">${determinarPrecioMostrar(destinatario)}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Menús por día - Responsive */}
      <div className="grid gap-4 sm:gap-6">
        {diasSemana.map((dia) => {
          const menusDia = almuerzos[dia.fecha] || []
          const destinatarioActual = destinatarios.find((d) => d.id === destinatarioActivo)

          if (!destinatarioActual) return null

          return (
            <Card key={dia.fecha} className={dia.bloqueado || dia.esPasado ? "opacity-60" : ""}>
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
                      </div>
                    </CardTitle>
                    {dia.bloqueado && (
                      <p className="text-xs sm:text-sm text-orange-600 mt-1">
                        Las opciones para hoy ya no están disponibles (después de las 9:00 AM)
                      </p>
                    )}
                  </div>
                  {destinatarioActual && (
                    <div className="text-left sm:text-right flex-shrink-0">
                      <div className="text-sm font-medium text-gray-700 truncate">{destinatarioActual.nombre}</div>
                      <div className="text-xs text-gray-500">
                        ${determinarPrecioMostrar(destinatarioActual)} por almuerzo
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {menusDia.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 text-sm">No hay menús disponibles para este día</p>
                ) : (
                  <MenuDia
                    dia={dia}
                    menus={menusDia}
                    destinatario={destinatarioActual}
                    onAgregarOpcion={onAgregarOpcion}
                    onRemoverOpcion={onRemoverOpcion}
                    onSetCantidad={onSetCantidad}
                    tieneOpcion={tieneOpcion}
                    getCantidad={getCantidad}
                    bloqueado={dia.bloqueado || dia.esPasado}
                  />
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
