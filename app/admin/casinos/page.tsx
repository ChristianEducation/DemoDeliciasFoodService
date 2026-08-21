"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Download, Calendar, FileText } from "lucide-react"
import Image from "next/image"
import { exportarPlanilla } from "./excel-exporter"
import { exportarTicketsPDF } from "./tickets-pdf"
import { useAvisoActualizacion } from "@/hooks/useAvisoActualizacion"
import AvisoNuevosPedidos from "@/components/admin/AvisoNuevosPedidos"

interface PedidoCasino {
  id: string
  destinatario: string
  tipo_destinatario: string
  fecha: string
  tipo: string
  codigo: string
  descripcion: string
  cantidad: number
  casino: string | null
  nivel: string | null
  curso: string | null
  estado_pago?: string
}

interface OpcionMenu {
  codigo_opcion: string
  descripcion_opcion: string
}

// Función para ordenar por curso y nombre
const ordenarPorCursoYNombre = (estudiantes: PedidoCasino[]) => {
  return estudiantes.sort((a, b) => {
    // Extraer información del curso
    const extraerInfoCurso = (curso: string | null) => {
      if (!curso) return { numero: 0, letra: "Z", original: "" }

      const cursoUpper = curso.toUpperCase()

      // Manejar casos especiales de PRESCHOOL con jerarquía correcta
      if (cursoUpper.includes("PLAYGROUP") || cursoUpper.includes("PG")) {
        const letra = curso.match(/([A-Z])$/)?.[1] || "A"
        return { numero: -3, letra, original: curso }
      }
      if (cursoUpper.includes("PRE-KINDER") || cursoUpper.includes("PREKINDER") || cursoUpper.includes("PK")) {
        const letra = curso.match(/([A-Z])$/)?.[1] || "A"
        return { numero: -2, letra, original: curso }
      }
      if (cursoUpper.includes("KINDER") && !cursoUpper.includes("PRE")) {
        const letra = curso.match(/([A-Z])$/)?.[1] || "A"
        return { numero: -1, letra, original: curso }
      }

      // Extraer número y letra del formato "1°A", "10°B", etc.
      const match = curso.match(/(\d+)°?([A-Z]?)/)
      if (match) {
        const numero = Number.parseInt(match[1])
        const letra = match[2] || "A"
        return { numero, letra, original: curso }
      }

      return { numero: 999, letra: "Z", original: curso }
    }

    const cursoA = extraerInfoCurso(a.curso)
    const cursoB = extraerInfoCurso(b.curso)

    // Ordenar por número de curso
    if (cursoA.numero !== cursoB.numero) {
      return cursoA.numero - cursoB.numero
    }

    // Si el número es igual, ordenar por letra
    if (cursoA.letra !== cursoB.letra) {
      return cursoA.letra.localeCompare(cursoB.letra)
    }

    // Si curso es igual, ordenar por nombre
    return a.destinatario.localeCompare(b.destinatario)
  })
}

const getColorHeader = (nivel: string) => {
  switch (nivel) {
    case "PRESCHOOL":
      return { backgroundColor: "#CCFF99", color: "#000000" }
    case "LOWERSCHOOL":
      return { backgroundColor: "#FFFF99", color: "#000000" }
    case "MIDDLESCHOOL":
      return { backgroundColor: "#FF420E", color: "#FFFFFF" }
    case "HIGH SCHOOL":
    case "HIGH SCHOOL (9° - 10°)":
    case "HIGH SCHOOL (11° - 12°)":
    case "HIGHSCHOOL":
      return { backgroundColor: "#0066CC", color: "#FFFFFF" }
    case "FUNCIONARIOS":
      return { backgroundColor: "#0066CC", color: "#FFFFFF" }
    default:
      return { backgroundColor: "#6B7280", color: "#FFFFFF" }
  }
}

// Función para obtener color de la opción
const getColorOpcion = (codigo: string) => {
  switch (codigo) {
    case "1":
      return { backgroundColor: "#FEFFCC", color: "#000000" }
    case "2":
      return { backgroundColor: "#CCCCFF", color: "#000000" }
    case "3":
      return { backgroundColor: "#FFC7C7", color: "#000000" }
    case "4":
      return { backgroundColor: "#CCFFCC", color: "#000000" }
    default:
      return { backgroundColor: "#F3F4F6", color: "#000000" }
  }
}

// Función para obtener color RGB del header por nivel
const getColorHeaderRGB = (nivel: string): string => {
  switch (nivel) {
    case "PRESCHOOL":
      return "CCFF99"
    case "LOWERSCHOOL":
      return "FFFF99"
    case "MIDDLESCHOOL":
      return "FF420E"
    case "HIGH SCHOOL":
    case "HIGH SCHOOL (9° - 10°)":
    case "HIGH SCHOOL (11° - 12°)":
      return "0066CC"
    case "FUNCIONARIOS":
      return "0066CC"
    default:
      return "6B7280"
  }
}

// Función para obtener color RGB de la opción
const getColorOpcionRGB = (codigo: string): string => {
  switch (codigo) {
    case "1":
      return "FEFFCC"
    case "2":
      return "CCCCFF"
    case "3":
      return "FFC7C7"
    case "4":
      return "CCFFCC"
    default:
      return "F3F4F6"
  }
}

export default function AdminCasinos() {
  const [pedidosCasinos, setPedidosCasinos] = useState<PedidoCasino[]>([])
  const [loading, setLoading] = useState(true)
  const [fechaSeleccionada, setFechaSeleccionada] = useState("")
  const [fechasDisponibles, setFechasDisponibles] = useState<string[]>([])
  const [casinoSeleccionado, setCasinoSeleccionado] = useState("Básica")
  const [opcionesMenu, setOpcionesMenu] = useState<OpcionMenu[]>([])
  const [actualizando, setActualizando] = useState(false)

  const pedidosCasinosRef = useRef<PedidoCasino[]>([])

  const { hayNuevos, limpiarAviso } = useAvisoActualizacion(supabase)

  const actualizarAhora = async () => {
    setActualizando(true)
    try {
      await cargarPedidosCasinos()
      limpiarAviso()
    } finally {
      setActualizando(false)
    }
  }

  // Función para formatear fecha en español
  const formatearFechaCompleta = (fechaStr: string) => {
    const [y, m, d] = fechaStr.split("-")
    const date = new Date(Number(y), Number(m) - 1, Number(d))
    return date
      .toLocaleDateString("es-CL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      .toUpperCase()
  }

  const formatearFecha = (fechaStr: string) => {
    const [y, m, d] = fechaStr.split("-")
    const date = new Date(Number(y), Number(m) - 1, Number(d))
    return date.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const cargarFechasDisponibles = async () => {
    try {
      const { data, error } = await supabase
        .from("pedidos_item")
        .select(`
          fecha,
          pedidos!inner(estado_pago)
        `)
        .in("pedidos.estado_pago", ["pagado", "FMD", "PGC"])
        .order("fecha", { ascending: false })

      if (error) throw error

      const fechasUnicas = [...new Set(data?.map((item) => item.fecha) || [])]
      setFechasDisponibles(fechasUnicas.sort().reverse())

      if (fechasUnicas.length > 0 && !fechaSeleccionada) {
        setFechaSeleccionada(fechasUnicas[0])
      }
    } catch (error) {
      console.error("Error cargando fechas:", error)
    }
  }

  const cargarOpcionesMenu = async () => {
    if (!fechaSeleccionada) return

    try {
      const { data, error } = await supabase
        .from("almuerzos")
        .select("codigo_opcion, descripcion_opcion")
        .eq("fecha", fechaSeleccionada)
        .order("codigo_opcion")

      if (error) throw error

      // Obtener opciones únicas
      const opcionesUnicas =
        data?.reduce((acc: OpcionMenu[], item) => {
          if (!acc.find((op) => op.codigo_opcion === item.codigo_opcion)) {
            acc.push({ codigo_opcion: item.codigo_opcion, descripcion_opcion: item.descripcion_opcion })
          }
          return acc
        }, []) || []

      setOpcionesMenu(opcionesUnicas)
    } catch (error) {
      console.error("Error cargando opciones del menú:", error)
    }
  }

  const cargarPedidosCasinos = async () => {
    if (!fechaSeleccionada) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("pedidos_item")
        .select(`
          id, 
          destinatario, 
          tipo_destinatario, 
          fecha, 
          tipo, 
          codigo, 
          descripcion, 
          cantidad, 
          casino, 
          nivel,
          curso,
          pedidos!inner(estado_pago)
        `)
        .eq("fecha", fechaSeleccionada)
        .in("pedidos.estado_pago", ["pagado", "FMD", "PGC"])
        .eq("tipo", "almuerzo")
        .order("destinatario")

      if (error) throw error

      const pedidosConEstado =
        data?.map((item) => ({
          ...item,
          estado_pago: item.pedidos?.estado_pago || "pagado",
        })) || []

      pedidosCasinosRef.current = pedidosConEstado
      setPedidosCasinos(pedidosConEstado)
    } catch (error) {
      console.error("Error cargando pedidos de casinos:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPedidosPorCasino = (casino: string) => {
    // Se lee del ref (siempre al día) en vez del estado, para que un
    // refresco forzado justo antes de exportar/generar tickets se vea
    // reflejado de inmediato, sin esperar al siguiente render.
    return pedidosCasinosRef.current.filter((pedido) => {
      if (casino === "Básica") {
        return (
          // Estudiantes: incluir tanto casino null (Preschool) como casino "Básica"
          (pedido.tipo_destinatario === "estudiante" && (pedido.casino === null || pedido.casino === "Básica")) ||
          // Estudiantes de Media que están en 9° o 10° ahora pertenecen a Básica
          (pedido.tipo_destinatario === "estudiante" && pedido.casino === "Media" && (pedido.curso?.includes("9°") || pedido.curso?.includes("10°"))) ||
          // Funcionarios: incluir preschool y basica
          (pedido.tipo_destinatario === "funcionario" && (pedido.nivel === "preschool" || pedido.nivel === "basica"))
        )
      } else if (casino === "Media") {
        return (
          (pedido.tipo_destinatario === "estudiante" && pedido.casino === "Media" && !pedido.curso?.includes("9°") && !pedido.curso?.includes("10°")) ||
          (pedido.tipo_destinatario === "funcionario" && pedido.nivel === "media")
        )
      }
      return false
    })
  }

  const getEstudiantesPorNivel = (casino: string) => {
    const pedidosCasino = getPedidosPorCasino(casino)
    const estudiantes = pedidosCasino.filter((p) => p.tipo_destinatario === "estudiante")

    // Agrupar por niveles específicos
    const grupos: { [key: string]: PedidoCasino[] } = {}

    estudiantes.forEach((estudiante) => {
      let nivel = "Sin clasificar"

      if (casino === "Básica") {
        // Determinar nivel basado en casino y curso
        if (estudiante.casino === null) {
          nivel = "PRESCHOOL"
        } else if (estudiante.casino === "Básica") {
          const curso = estudiante.curso || ""
          if (
            curso.includes("1°") ||
            curso.includes("2°") ||
            curso.includes("3°") ||
            curso.includes("4°") ||
            curso.includes("5°")
          ) {
            nivel = "LOWERSCHOOL"
          } else if (curso.includes("6°") || curso.includes("7°") || curso.includes("8°")) {
            nivel = "MIDDLESCHOOL"
          } else {
            nivel = "MIDDLESCHOOL" // Por defecto para básica
          }
        } else if (estudiante.casino === "Media") {
          nivel = "HIGHSCHOOL"
        }
      } else if (casino === "Media") {
        nivel = "HIGH SCHOOL"
      }

      if (!grupos[nivel]) grupos[nivel] = []
      grupos[nivel].push(estudiante)
    })

    // Ordenar cada grupo de estudiantes por curso y nombre
    Object.keys(grupos).forEach((nivel) => {
      grupos[nivel] = ordenarPorCursoYNombre(grupos[nivel])
    })

    return grupos
  }

  const getFuncionarios = (casino: string) => {
    const pedidosCasino = getPedidosPorCasino(casino)
    const funcionarios = pedidosCasino.filter((p) => p.tipo_destinatario === "funcionario")

    // Filtrar funcionarios específicos por casino
    const filteredFuncionarios = funcionarios.filter((funcionario) => {
      if (casino === "Básica") {
        return funcionario.nivel === "preschool" || funcionario.nivel === "basica"
      } else if (casino === "Media") {
        return funcionario.nivel === "media"
      }
      return false
    })

    // Ordenar funcionarios por curso/ubicación y nombre
    return ordenarPorCursoYNombre(filteredFuncionarios)
  }

  const getTotalesPorNivel = (casino: string) => {
    const pedidosCasino = getPedidosPorCasino(casino)
    const totalesPorNivel: { [nivel: string]: { [opcion: string]: number; total: number } } = {}
    let totalGeneral = 0

    // Obtener estudiantes por nivel
    const gruposEstudiantes = getEstudiantesPorNivel(casino)

    // Calcular totales por nivel para estudiantes
    Object.entries(gruposEstudiantes).forEach(([nivel, estudiantes]) => {
      if (!totalesPorNivel[nivel]) {
        totalesPorNivel[nivel] = { total: 0 }
      }

      estudiantes.forEach((estudiante) => {
        const opcion = `OPCION ${estudiante.codigo}`
        totalesPorNivel[nivel][opcion] = (totalesPorNivel[nivel][opcion] || 0) + estudiante.cantidad
        totalesPorNivel[nivel].total += estudiante.cantidad
        totalGeneral += estudiante.cantidad
      })
    })

    // Calcular totales para funcionarios
    const funcionarios = getFuncionarios(casino)
    if (funcionarios.length > 0) {
      totalesPorNivel["FUNCIONARIOS"] = { total: 0 }

      funcionarios.forEach((funcionario) => {
        const opcion = `OPCION ${funcionario.codigo}`
        totalesPorNivel["FUNCIONARIOS"][opcion] = (totalesPorNivel["FUNCIONARIOS"][opcion] || 0) + funcionario.cantidad
        totalesPorNivel["FUNCIONARIOS"].total += funcionario.cantidad
        totalGeneral += funcionario.cantidad
      })
    }

    return { totalesPorNivel, totalGeneral }
  }

  const getTotalPorNivel = (nivel: string, casino: string) => {
    const pedidosCasino = getPedidosPorCasino(casino)
    let total = 0

    if (nivel === "FUNCIONARIOS") {
      const funcionarios = getFuncionarios(casino)
      funcionarios.forEach((funcionario) => {
        total += funcionario.cantidad
      })
    } else {
      const gruposEstudiantes = getEstudiantesPorNivel(casino)
      const estudiantesNivel = gruposEstudiantes[nivel] || []
      estudiantesNivel.forEach((estudiante) => {
        total += estudiante.cantidad
      })
    }

    return total
  }

  const handleExportarPlanilla = async () => {
    setActualizando(true)
    await cargarPedidosCasinos()
    setActualizando(false)

    const gruposEstudiantesBasica = getEstudiantesPorNivel("Básica")
    const funcionariosBasica = getFuncionarios("Básica")
    const gruposEstudiantesMedia = getEstudiantesPorNivel("Media")
    const funcionariosMedia = getFuncionarios("Media")
    const fechaFormateada = formatearFechaCompleta(fechaSeleccionada)

    await exportarPlanilla(
      fechaSeleccionada,
      fechaFormateada,
      opcionesMenu,
      gruposEstudiantesBasica,
      funcionariosBasica,
      gruposEstudiantesMedia,
      funcionariosMedia,
      pedidosCasinos,
    )
  }

  useEffect(() => {
    if (fechaSeleccionada) {
      cargarPedidosCasinos()
      cargarOpcionesMenu()
    }
  }, [fechaSeleccionada])

  useEffect(() => {
    cargarFechasDisponibles()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const gruposEstudiantes = getEstudiantesPorNivel(casinoSeleccionado)
  const funcionarios = getFuncionarios(casinoSeleccionado)
  const { totalesPorNivel, totalGeneral } = getTotalesPorNivel(casinoSeleccionado)

  const getTotalesPorOpcionNivel = (nivel: string, casino: string) => {
    const totalesPorOpcion: { [opcion: string]: number } = {}
    let totalNivel = 0

    if (nivel === "FUNCIONARIOS") {
      const funcionarios = getFuncionarios(casino)
      funcionarios.forEach((funcionario) => {
        const opcion = `OPCIÓN ${funcionario.codigo}`
        totalesPorOpcion[opcion] = (totalesPorOpcion[opcion] || 0) + funcionario.cantidad
        totalNivel += funcionario.cantidad
      })
    } else {
      const gruposEstudiantes = getEstudiantesPorNivel(casino)
      const estudiantesNivel = gruposEstudiantes[nivel] || []
      estudiantesNivel.forEach((estudiante) => {
        const opcion = `OPCIÓN ${estudiante.codigo}`
        totalesPorOpcion[opcion] = (totalesPorOpcion[opcion] || 0) + estudiante.cantidad
        totalNivel += estudiante.cantidad
      })
    }

    return { totalesPorOpcion, totalNivel }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 pb-0">
        <AvisoNuevosPedidos visible={hayNuevos} onActualizar={actualizarAhora} actualizando={actualizando} />
      </div>

      {/* Header con controles */}
      <div className="bg-gray-50 p-4 border-b">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex gap-4">
            <Select value={fechaSeleccionada} onValueChange={setFechaSeleccionada}>
              <SelectTrigger className="w-64">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Seleccionar fecha" />
              </SelectTrigger>
              <SelectContent>
                {fechasDisponibles.map((fecha) => (
                  <SelectItem key={fecha} value={fecha}>
                    {formatearFecha(fecha)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={casinoSeleccionado} onValueChange={setCasinoSeleccionado}>
              <SelectTrigger className="w-48">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Básica">Básica</SelectItem>
                <SelectItem value="Media">Media</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              setActualizando(true)
              try {
                await cargarPedidosCasinos()
                exportarTicketsPDF(pedidosCasinosRef.current, fechaSeleccionada)
              } finally {
                setActualizando(false)
              }
            }}
            disabled={!fechaSeleccionada || pedidosCasinos.length === 0 || actualizando}
          >
            <FileText className="h-4 w-4 mr-2" />
            Tickets
          </Button>
          <Button onClick={handleExportarPlanilla} disabled={!fechaSeleccionada || actualizando}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Todas las Planillas
          </Button>
        </div>
      </div>

      {/* Planilla principal */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Header de la planilla */}
        <div className="text-center mb-6 border-2 border-gray-300 p-4">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="w-20 h-20 flex items-center justify-center">
              <Image
                src="/images/delicias-logo-complete.png"
                alt="Delicias Food Service Logo"
                width={80}
                height={80}
                className="rounded-full"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold underline">PLANILLA DE DESPACHO ALMUERZOS</h1>
              <h2 className="text-lg font-semibold">CASINO {casinoSeleccionado.toUpperCase()}</h2>
            </div>
          </div>

          <div className="border border-gray-400 inline-block px-4 py-1 mt-2">
            <span className="font-medium">Fecha: {formatearFechaCompleta(fechaSeleccionada)}</span>
          </div>
        </div>

        {/* Opciones del menú */}
        {opcionesMenu.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2 underline">OPCIONES ALMUERZOS</h3>
            <div className="bg-gray-100 p-3 rounded">
              {opcionesMenu.map((opcion, index) => (
                <div
                  key={opcion.codigo_opcion}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px" }}
                >
                  <span className="font-medium">{opcion.codigo_opcion}</span>
                  <span className="ml-4">{opcion.descripcion_opcion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estudiantes por nivel en orden fijo */}
        {(casinoSeleccionado === "Básica" ? ["PRESCHOOL", "MIDDLESCHOOL", "LOWERSCHOOL", "HIGHSCHOOL"] : ["HIGH SCHOOL"]).map(
          (nivel) => {
            const estudiantes = gruposEstudiantes[nivel] || []
            const { totalesPorOpcion, totalNivel } = getTotalesPorOpcionNivel(nivel, casinoSeleccionado)

            return (
              <div key={nivel} className="mb-6">
                <div style={{ ...getColorHeader(nivel), padding: "8px", textAlign: "center", fontWeight: "bold" }}>
                  {nivel}
                </div>
                <table className="w-full border-collapse border border-gray-400">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-gray-400 p-2 text-center">#</th>
                      <th className="border border-gray-400 p-2 text-left">ALUMNO</th>
                      <th className="border border-gray-400 p-2 text-center">CURSO</th>
                      <th className="border border-gray-400 p-2 text-center">OPCION</th>
                      <th className="border border-gray-400 p-2 text-center">CANTIDAD</th>
                      <th className="border border-gray-400 p-2 text-center">OBSERVACION</th>
                      <th className="border border-gray-400 p-2 text-center">PAGO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantes.length > 0 ? (
                      estudiantes.map((estudiante, index) => (
                        <tr key={estudiante.id} style={{ backgroundColor: "#FFFFFF" }}>
                          <td className="border border-gray-400 p-2 text-center">{index + 1}</td>
                          <td className="border border-gray-400 p-2">{estudiante.destinatario}</td>
                          <td className="border border-gray-400 p-2 text-center">{estudiante.curso || ""}</td>
                          <td
                            className="border border-gray-400 p-2 text-center font-semibold"
                            style={{
                              backgroundColor: getColorOpcion(estudiante.codigo).backgroundColor,
                              color: getColorOpcion(estudiante.codigo).color,
                              border: "1px solid #9CA3AF",
                              padding: "8px",
                              textAlign: "center",
                              fontWeight: "600",
                            }}
                          >
                            OPC {estudiante.codigo}
                          </td>
                          <td className="border border-gray-400 p-2 text-center">{estudiante.cantidad}</td>
                          <td className="border border-gray-400 p-2 text-center"></td>
                          <td className="border border-gray-400 p-2 text-center">
                            {estudiante.estado_pago?.toUpperCase() || "PAGADO"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="border border-gray-400 p-4 text-center text-gray-500">
                          Sin pedidos para este nivel
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Totales por opción */}
                <div className="bg-gray-200 border border-gray-400">
                  {opcionesMenu.map((opcion, index) => {
                    const opcionKey = `OPCIÓN ${opcion.codigo_opcion}`
                    const cantidad = totalesPorOpcion[opcionKey] || 0

                    return (
                      <div
                        key={opcion.codigo_opcion}
                        className="flex justify-between p-2 border-b border-gray-300 last:border-b-0"
                      >
                        <span className="font-bold">{opcionKey}</span>
                        <div className="flex gap-4">
                          <span className="font-bold">{cantidad}</span>
                          {index === opcionesMenu.length - 1 && <span className="font-bold text-lg">{totalNivel}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          },
        )}

        {/* Funcionarios */}
        {funcionarios.length > 0 && (
          <div className="mb-6">
            <div style={{ ...getColorHeader("FUNCIONARIOS"), padding: "8px", textAlign: "center", fontWeight: "bold" }}>
              FUNCIONARIOS
            </div>
            <table className="w-full border-collapse border border-gray-400">
              <thead>
                <tr className="bg-orange-100">
                  <th className="border border-gray-400 p-2 text-center">#</th>
                  <th className="border border-gray-400 p-2 text-left">FUNCIONARIO</th>
                  <th className="border border-gray-400 p-2 text-center">CURSO/UBICACIÓN</th>
                  <th className="border border-gray-400 p-2 text-center">OPCION</th>
                  <th className="border border-gray-400 p-2 text-center">CANTIDAD</th>
                  <th className="border border-gray-400 p-2 text-center">OBSERVACION</th>
                  <th className="border border-gray-400 p-2 text-center">PAGO</th>
                </tr>
              </thead>
              <tbody>
                {funcionarios.map((funcionario, index) => (
                  <tr key={funcionario.id} style={{ backgroundColor: "#FFFFFF" }}>
                    <td className="border border-gray-400 p-2 text-center">{index + 1}</td>
                    <td className="border border-gray-400 p-2">{funcionario.destinatario}</td>
                    <td className="border border-gray-400 p-2 text-center">
                      {funcionario.nivel === "preschool"
                        ? funcionario.curso || "Preschool"
                        : funcionario.nivel === "basica"
                          ? "Básica"
                          : funcionario.nivel === "media"
                            ? "Media"
                            : "Sin ubicación"}
                    </td>
                    <td
                      className="border border-gray-400 p-2 text-center font-semibold"
                      style={{
                        backgroundColor: getColorOpcion(funcionario.codigo).backgroundColor,
                        color: getColorOpcion(funcionario.codigo).color,
                        border: "1px solid #9CA3AF",
                        padding: "8px",
                        textAlign: "center",
                        fontWeight: "600",
                      }}
                    >
                      OPC {funcionario.codigo}
                    </td>
                    <td className="border border-gray-400 p-2 text-center">{funcionario.cantidad}</td>
                    <td className="border border-gray-400 p-2 text-center"></td>
                    <td className="border border-gray-400 p-2 text-center">
                      {funcionario.estado_pago?.toUpperCase() || "PAGADO"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totales por opción */}
            <div className="bg-gray-200 border border-gray-400">
              {opcionesMenu.map((opcion, index) => {
                const opcionKey = `OPCIÓN ${opcion.codigo_opcion}`
                const cantidad = funcionarios.reduce(
                  (sum, func) => sum + (func.codigo === opcion.codigo_opcion ? func.cantidad : 0),
                  0,
                )

                return (
                  <div
                    key={opcion.codigo_opcion}
                    className="flex justify-between p-2 border-b border-gray-300 last:border-b-0"
                  >
                    <span className="font-bold">{opcionKey}</span>
                    <div className="flex gap-4">
                      <span className="font-bold">{cantidad}</span>
                      {index === opcionesMenu.length - 1 && (
                        <span className="font-bold text-lg">
                          {funcionarios.reduce((sum, func) => sum + func.cantidad, 0)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Total general */}
        <div className="mt-6 border-t-2 border-gray-400 pt-4">
          <div className="bg-gray-600 text-white p-3 text-center">
            <span className="text-lg font-bold">
              TOTAL PEDIDOS {casinoSeleccionado.toUpperCase()}: {totalGeneral}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
