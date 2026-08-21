"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { useUserSession } from "@/hooks/useUserSession"
import { useSemanaAlmuerzos } from "@/hooks/useSemanaAlmuerzos"
import { useCarritoAlmuerzos } from "@/hooks/useCarritoAlmuerzos"
import SelectorSemana from "@/components/SelectorSemana"
import MenusSemana from "@/components/MenusSemana"
import ResumenCarrito from "@/components/ResumenCarrito"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import DebugSession from "@/components/DebugSession"

export default function AlmuerzosPage() {
  const { session } = useUserSession()
  const router = useRouter()
  const [destinatarios, setDestinatarios] = useState<
    { id: string; nombre: string; tipo: "estudiante" | "funcionario"; nivel?: string }[]
  >([])
  const [loadingDestinatarios, setLoadingDestinatarios] = useState(true)

  const supabase = createClient()

  const {
    diasSemana,
    diasDisponibles,
    semanaOffset,
    fechaInicioSemana,
    fechaFinSemana,
    avanzarSemana,
    retrocederSemana,
    puedeRetroceder,
  } = useSemanaAlmuerzos()

  const {
    carrito,
    agregarOpcion,
    removerOpcion,
    setCantidadOpcion,
    tieneOpcion,
    getCantidadOpcion,
    getTotalSelecciones,
    getTotalPrecio,
    PRECIOS,
  } = useCarritoAlmuerzos(destinatarios)

  // Cargar destinatarios según el tipo de usuario
  useEffect(() => {
    // Esperar a que la sesión se cargue desde localStorage
    const checkSession = () => {
      const tipoUsuarioLS = localStorage.getItem("tipoUsuario")

      if (!tipoUsuarioLS) {
        router.push("/")
        return
      }

      // Si hay tipo de usuario en localStorage pero no en session, esperar un poco más
      if (!session.tipoUsuario && tipoUsuarioLS) {
        setTimeout(checkSession, 100)
        return
      }

      if (session.tipoUsuario) {
        cargarDestinatarios()
      }
    }

    checkSession()
  }, [session.tipoUsuario, router])

  const cargarDestinatarios = async () => {
    setLoadingDestinatarios(true)

    try {
      if (session.tipoUsuario === "apoderado") {
        // Cargar estudiantes seleccionados con nombres reales
        const estudiantesData = localStorage.getItem("estudiantesSeleccionados")
        console.log("📊 Datos de estudiantes desde localStorage:", estudiantesData)

        if (estudiantesData) {
          let estudiantesIds: string[] = []

          try {
            const parsedData = JSON.parse(estudiantesData)
            console.log("📊 Datos parseados:", parsedData)

            // Verificar si es un array de strings (IDs) o array de objetos
            if (Array.isArray(parsedData)) {
              if (typeof parsedData[0] === "string") {
                // Es un array de IDs
                estudiantesIds = parsedData
              } else if (typeof parsedData[0] === "object" && parsedData[0].id) {
                // Es un array de objetos, extraer los IDs
                estudiantesIds = parsedData.map((item: any) => item.id)
              }
            }

            console.log("📊 IDs de estudiantes extraídos:", estudiantesIds)

            if (estudiantesIds.length > 0) {
              // Obtener nombres reales de la base de datos
              const { data: estudiantes, error } = await supabase
                .from("estudiantes")
                .select("id, name")
                .in("id", estudiantesIds)

              console.log("📊 Respuesta de Supabase:", { estudiantes, error })

              if (error) {
                console.error("Error cargando nombres de estudiantes:", error)
                // Fallback a IDs si hay error
                setDestinatarios(
                  estudiantesIds.map((id: string) => ({
                    id,
                    nombre: `Estudiante ${id.slice(0, 8)}...`,
                    tipo: "estudiante" as const,
                  })),
                )
              } else {
                setDestinatarios(
                  estudiantes.map((e) => ({
                    id: e.id,
                    nombre: e.name,
                    tipo: "estudiante" as const,
                  })),
                )
              }
            } else {
              console.error("No se encontraron IDs de estudiantes válidos")
              setDestinatarios([])
            }
          } catch (parseError) {
            console.error("Error parseando datos de estudiantes:", parseError)
            setDestinatarios([])
          }
        }
      } else if (session.tipoUsuario === "funcionario-sin-hijos") {
        // Cargar datos del funcionario
        const funcionarioData = localStorage.getItem("funcionarioSeleccionado")
        if (funcionarioData) {
          const funcionario = JSON.parse(funcionarioData)
          setDestinatarios([
            {
              id: funcionario.funcionarioId,
              nombre: funcionario.funcionarioNombre,
              tipo: "funcionario" as const,
            },
          ])
        }
      } else if (session.tipoUsuario === "funcionario-con-hijos") {
        // Cargar funcionario + hijos con nombres reales
        const datosCompletos = localStorage.getItem("funcionarioConHijosSeleccionado")
        if (datosCompletos) {
          const datos = JSON.parse(datosCompletos)
          const destinatariosArray = [
            {
              id: datos.funcionario.funcionarioId,
              nombre: datos.funcionario.funcionarioNombre,
              tipo: "funcionario" as const,
            },
          ]

          // Obtener nombres reales de los hijos
          if (datos.hijosIds && datos.hijosIds.length > 0) {
            console.log("📊 IDs de hijos:", datos.hijosIds)

            const { data: estudiantes, error } = await supabase
              .from("estudiantes")
              .select("id, name, level")
              .in("id", datos.hijosIds)

            if (error) {
              console.error("Error cargando nombres de hijos:", error)
              // Fallback a IDs si hay error
              datos.hijosIds.forEach((id: string, index: number) => {
                destinatariosArray.push({
                  id,
                  nombre: `Hijo ${index + 1}`,
                  tipo: "estudiante" as const,
                })
              })
            } else {
              estudiantes.forEach((estudiante) => {
                destinatariosArray.push({
                  id: estudiante.id,
                  nombre: estudiante.name,
                  tipo: "estudiante" as const,
                  nivel: estudiante.level,
                })
              })
            }
          }

          setDestinatarios(destinatariosArray)
        }
      }
    } catch (error) {
      console.error("Error cargando destinatarios:", error)
    } finally {
      setLoadingDestinatarios(false)
    }
  }

  const handleVolver = () => {
    if (session.tipoUsuario === "apoderado") {
      router.push("/apoderado")
    } else if (session.tipoUsuario === "funcionario-sin-hijos") {
      router.push("/funcionario")
    } else if (session.tipoUsuario === "funcionario-con-hijos") {
      router.push("/funcionario-con-hijos")
    } else {
      router.push("/")
    }
  }

  const handleContinuar = () => {
    // Guardar carrito en localStorage (aunque esté vacío)
    localStorage.setItem("carritoAlmuerzos", JSON.stringify(carrito))
    router.push("/colaciones")
  }

  if (loadingDestinatarios || destinatarios.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#f0f6fe" }}>
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            {loadingDestinatarios ? "Cargando destinatarios..." : "No se encontraron destinatarios"}
          </p>
          <Button onClick={handleVolver} variant="outline">
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#f0f6fe" }}>
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header - Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-start sm:items-center gap-3">
              <Button variant="ghost" onClick={handleVolver} className="text-gray-600 p-2 sm:p-3">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-light text-gray-800 truncate">Seleccionar Almuerzos</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Para {destinatarios.length} destinatario{destinatarios.length !== 1 ? "s" : ""}
                </p>
                <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-2">
                  <span>Estudiantes: ${PRECIOS.ESTUDIANTE.toLocaleString()}</span>
                  <span>•</span>
                  <span>Funcionarios: ${PRECIOS.FUNCIONARIO.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Botón continuar - Siempre visible */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {getTotalSelecciones() > 0 && (
                <div className="text-center sm:text-right">
                  <div className="text-lg font-bold text-green-600">${getTotalPrecio().toLocaleString()}</div>
                  <div className="text-xs text-gray-500">
                    {getTotalSelecciones()} seleccionado{getTotalSelecciones() !== 1 ? "s" : ""}
                  </div>
                </div>
              )}
              <Button onClick={handleContinuar} size="lg" className="px-4 sm:px-6 whitespace-nowrap">
                <span className="sm:hidden">Continuar</span>
                <span className="hidden sm:inline">
                  Continuar {getTotalSelecciones() > 0 ? `(${getTotalSelecciones()})` : ""}
                </span>
              </Button>
            </div>
          </div>

          {/* Debug component - solo en desarrollo */}
          <DebugSession />

          {/* Layout principal - Responsive */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
            {/* Contenido principal */}
            <div className="xl:col-span-3 space-y-4 sm:space-y-6">
              {/* Selector de semana - SIEMPRE VISIBLE */}
              <SelectorSemana
                fechaInicio={fechaInicioSemana}
                fechaFin={fechaFinSemana}
                semanaOffset={semanaOffset}
                onAvanzar={avanzarSemana}
                onRetroceder={retrocederSemana}
                puedeRetroceder={puedeRetroceder}
              />

              {/* Contenido condicional: Menús o mensaje de no disponible */}
              {diasDisponibles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg mb-4">
                    No hay días disponibles para hacer pedidos en esta semana.
                  </p>
                  <p className="text-gray-500 text-sm mb-6">
                    Los pedidos se pueden hacer hasta las 9:00 AM del día en curso.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={handleVolver} variant="outline">
                      Volver
                    </Button>
                    <Button onClick={handleContinuar} className="px-6">
                      Continuar sin almuerzos
                    </Button>
                  </div>
                </div>
              ) : (
                /* Menús de la semana - Solo días disponibles */
                <MenusSemana
                  diasSemana={diasDisponibles}
                  destinatarios={destinatarios}
                  onAgregarOpcion={agregarOpcion}
                  onRemoverOpcion={removerOpcion}
                  onSetCantidad={setCantidadOpcion}
                  tieneOpcion={tieneOpcion}
                  getCantidad={getCantidadOpcion}
                />
              )}
            </div>

            {/* Sidebar con resumen - Responsive */}
            <div className="xl:col-span-1">
              <div className="xl:sticky xl:top-4">
                <ResumenCarrito carrito={carrito} onContinuar={handleContinuar} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
