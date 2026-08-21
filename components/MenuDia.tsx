"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, Trash2, AlertTriangle } from "lucide-react"
import type { DiaInfo } from "@/hooks/useSemanaAlmuerzos"

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

interface MenuDiaProps {
  dia: DiaInfo
  menus: AlmuerzoSupabase[]
  destinatario: {
    id: string
    nombre: string
    tipo: "estudiante" | "funcionario"
    nivel?: string
  }
  onAgregarOpcion: (
    destinatarioId: string,
    fecha: string,
    opcion: Omit<import("@/hooks/useCarritoAlmuerzos").OpcionAlmuerzo, "cantidad" | "precio_unitario" | "subtotal">,
  ) => void
  onRemoverOpcion: (destinatarioId: string, fecha: string, codigoOpcion: string) => void
  onSetCantidad: (destinatarioId: string, fecha: string, codigoOpcion: string, cantidad: number) => void
  tieneOpcion: (destinatarioId: string, fecha: string, codigoOpcion: string) => boolean
  getCantidad: (destinatarioId: string, fecha: string, codigoOpcion: string) => number
  bloqueado: boolean
}

export default function MenuDia({
  dia,
  menus,
  destinatario,
  onAgregarOpcion,
  onRemoverOpcion,
  onSetCantidad,
  tieneOpcion,
  getCantidad,
  bloqueado,
}: MenuDiaProps) {
  // Detectar si estamos en flujo "funcionario-con-hijos"
  const esFlujoFuncionarioConHijos =
    typeof window !== "undefined" && !!localStorage.getItem("funcionarioConHijosSeleccionado")

  // Función para determinar límite por código de opción
  const getLimiteOpcion = (codigoOpcion: number) => {
    // Opciones 1 y 2: 100 pedidos máximo
    // Opciones 3 y 4: 50 pedidos máximo
    return codigoOpcion === 1 || codigoOpcion === 2 ? 100 : 50
  }

  // Función para verificar disponibilidad
  const estaDisponible = (menu: AlmuerzoSupabase) => {
    const limite = getLimiteOpcion(menu.codigo_opcion)
    return menu.pedidos_actuales < limite && menu.activa
  }

  // Función para determinar precio según tipo y nivel
  const determinarPrecio = (destinatario: { tipo: string; nivel?: string }, esFlujoFuncionarioConHijos: boolean) => {
    // Debug logs
    console.log("🔍 Determinando precio para:", {
      nombre: destinatario,
      tipo: destinatario.tipo,
      nivel: destinatario.nivel,
      esFlujoFuncionarioConHijos,
    })

    // Funcionario adulto (sin cambios)
    if (destinatario.tipo === "funcionario") {
      console.log("💰 Precio funcionario: 5250")
      return 5250
    }

    // Hijo de funcionario (NUEVA LÓGICA)
    if (esFlujoFuncionarioConHijos && destinatario.tipo === "estudiante") {
      // Niveles en mayúscula y sin espacios según la base de datos
      const nivelesBasicos = ["PRESCHOOL", "LOWERSCHOOL", "MIDDLESCHOOL"]
      const nivelesAltos = ["HIGHSCHOOL"]

      console.log("🎓 Evaluando nivel del hijo:", destinatario.nivel)

      if (destinatario.nivel && nivelesBasicos.includes(destinatario.nivel.toUpperCase())) {
        console.log("💰 Precio hijo funcionario (básico): 5250")
        return 5250
      }
      if (destinatario.nivel && nivelesAltos.includes(destinatario.nivel.toUpperCase())) {
        console.log("💰 Precio hijo funcionario (alto): 5250")
        return 5250
      }
    }

    // Estudiante normal (sin cambios)
    console.log("💰 Precio estudiante normal: 5500")
    return 5500
  }

  const precioUnitario = determinarPrecio(destinatario, esFlujoFuncionarioConHijos)

  const handleAgregarOpcion = (menu: AlmuerzoSupabase) => {
    const opcion = {
      codigo_opcion: menu.codigo_opcion,
      descripcion_opcion: menu.descripcion_opcion,
      categoria: menu.categoria,
      fecha: menu.fecha,
      dia_semana: menu.dia_semana,
    }
    onAgregarOpcion(destinatario.id, dia.fecha, opcion)
  }

  const handleIncrementar = (codigoOpcion: number) => {
    const cantidadActual = getCantidad(destinatario.id, dia.fecha, codigoOpcion)
    onSetCantidad(destinatario.id, dia.fecha, codigoOpcion, cantidadActual + 1)
  }

  const handleDecrementar = (codigoOpcion: number) => {
    onRemoverOpcion(destinatario.id, dia.fecha, codigoOpcion)
  }

  const handleEliminar = (codigoOpcion: number) => {
    onSetCantidad(destinatario.id, dia.fecha, codigoOpcion, 0)
  }

  const getCategoriaColor = (categoria: string) => {
    switch (categoria.toLowerCase()) {
      case "vegetariano":
        return "bg-green-100 text-green-800"
      case "vegano":
        return "bg-green-200 text-green-900"
      case "celiaco":
        return "bg-yellow-100 text-yellow-800"
      case "sin lactosa":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {menus.map((menu) => {
        const seleccionado = tieneOpcion(destinatario.id, dia.fecha, menu.codigo_opcion)
        const cantidad = getCantidad(destinatario.id, dia.fecha, menu.codigo_opcion)
        const subtotal = cantidad * precioUnitario

        // Lógica de disponibilidad
        const limite = getLimiteOpcion(menu.codigo_opcion)
        const disponible = estaDisponible(menu)
        const restantes = limite - menu.pedidos_actuales
        const casiAgotado = restantes <= 10 && restantes > 0
        const agotado = !disponible

        return (
          <div
            key={menu.codigo_opcion}
            className={`border rounded-lg p-3 sm:p-4 transition-all ${
              seleccionado
                ? "border-blue-500 bg-blue-50"
                : agotado
                  ? "border-red-200 bg-red-50"
                  : bloqueado
                    ? "border-gray-200 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {/* Layout móvil y desktop */}
            <div className="space-y-3">
              {/* Header con código y precio */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                  <span className="font-medium text-gray-900 text-sm sm:text-base">{menu.codigo_opcion}</span>
                  {menu.categoria && (
                    <Badge variant="secondary" className={`text-xs ${getCategoriaColor(menu.categoria)}`}>
                      {menu.categoria}
                    </Badge>
                  )}
                  <div className="text-sm font-medium text-green-600">${precioUnitario.toLocaleString()}</div>

                  {/* Badges de estado */}
                  {agotado && (
                    <Badge variant="destructive" className="text-xs">
                      Agotado
                    </Badge>
                  )}
                  {casiAgotado && !agotado && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Quedan {restantes}
                    </Badge>
                  )}
                  {!agotado && !casiAgotado && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      {restantes} disponibles
                    </Badge>
                  )}

                  {seleccionado && (
                    <Badge variant="default" className="bg-blue-600 text-white text-xs">
                      {cantidad}x = ${subtotal.toLocaleString()}
                    </Badge>
                  )}
                </div>

                {/* Controles - Responsive */}
                <div className="flex-shrink-0">
                  {!seleccionado ? (
                    // Botón para agregar por primera vez
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAgregarOpcion(menu)}
                      disabled={bloqueado || agotado}
                      className={`text-xs sm:text-sm ${bloqueado || agotado ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {agotado ? "Agotado" : "Agregar"}
                    </Button>
                  ) : (
                    // Controles de cantidad
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDecrementar(menu.codigo_opcion)}
                        disabled={bloqueado}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <span className="min-w-[1.5rem] sm:min-w-[2rem] text-center font-medium text-sm">{cantidad}</span>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleIncrementar(menu.codigo_opcion)}
                        disabled={bloqueado || agotado}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEliminar(menu.codigo_opcion)}
                        disabled={bloqueado}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 ml-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <p className="text-sm text-gray-600 leading-relaxed">{menu.descripcion_opcion}</p>

              {/* Mensaje de estado para opciones agotadas */}
              {agotado && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                  Esta opción ha alcanzado su límite máximo de {limite} pedidos para este día.
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
