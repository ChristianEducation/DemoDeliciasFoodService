"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { obtenerFechaChileISO } from "@/utils/chile-time"
import LogoHeader from "@/components/LogoHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Clock, Calendar, CheckCircle2, RotateCcw, AlertCircle, ArrowLeft, Trash2, Coins, X, Sparkles } from "lucide-react"
import TourAnulacion from "@/components/anular/TourAnulacion"

interface Estudiante {
  id: string
  name: string
  level: string
  curso: string
  creditos_disponibles: number
}

interface AlmuerzoItem {
  id: string
  fecha: string
  tipo: string
  codigo: string
  descripcion: string
  precio_unitario: number
  pedidos: {
    estado_pago: string
  }
}

export default function AnulacionPage() {
  const supabase = createClient()
  const router = useRouter()

  // Horario states
  const [cargandoHorario, setCargandoHorario] = useState(true)
  const [permitido, setPermitido] = useState<boolean | null>(null)
  const [horaLimite, setHoraLimite] = useState<number | null>(null)
  const [horaActual, setHoraActual] = useState<number | null>(null)

  // Cascade states
  const [niveles, setNiveles] = useState<string[]>([])
  const [cursos, setCursos] = useState<string[]>([])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])

  const [nivelSeleccionado, setNivelSeleccionado] = useState<string>("")
  const [cursoSeleccionado, setCursoSeleccionado] = useState<string>("")
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<Estudiante | null>(null)

  const [loadingNiveles, setLoadingNiveles] = useState(false)
  const [loadingCursos, setLoadingCursos] = useState(false)
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false)

  // Almuerzos states
  const [almuerzos, setAlmuerzos] = useState<AlmuerzoItem[]>([])
  const [loadingAlmuerzos, setLoadingAlmuerzos] = useState(false)

  // Modal anulación states
  const [itemAAnular, setItemAAnular] = useState<AlmuerzoItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [anulando, setAnulando] = useState(false)

  // Success state inline
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [mensajeError, setMensajeError] = useState<string | null>(null)

  // 1. Verificar horario de anulación al montar el componente
  useEffect(() => {
    async function verificarHorario() {
      try {
        const res = await fetch("/api/anulacion")
        if (!res.ok) throw new Error("Error consultando api de horario")
        const data = await res.json()
        setPermitido(data.permitido)
        setHoraLimite(data.hora_limite)
        setHoraActual(data.hora_actual)
      } catch (error) {
        console.error("Error verificando horario de anulación:", error)
        // Fallback defensivo si falla la API
        setPermitido(true)
        setHoraLimite(9)
      } finally {
        setCargandoHorario(false)
      }
    }

    verificarHorario()
  }, [])

  // 2. Cargar niveles cuando el horario está permitido
  useEffect(() => {
    if (permitido === true) {
      async function fetchNiveles() {
        setLoadingNiveles(true)
        try {
          const { data, error } = await supabase
            .from("estudiantes")
            .select("level")
            .not("level", "is", null)

          if (error) throw error

          const nivelesUnicos = [...new Set(data?.map((e: any) => e.level) || [])].sort()
          setNiveles(nivelesUnicos)
        } catch (error) {
          console.error("Error cargando niveles:", error)
        } finally {
          setLoadingNiveles(false)
        }
      }
      fetchNiveles()
    }
  }, [permitido])

  // 3. Cargar cursos cuando se selecciona un nivel
  useEffect(() => {
    if (nivelSeleccionado) {
      async function fetchCursos() {
        setLoadingCursos(true)
        setCursos([])
        setCursoSeleccionado("")
        setEstudiantes([])
        setEstudianteSeleccionado(null)
        setAlmuerzos([])
        setMensajeExito(null)
        setMensajeError(null)

        try {
          const { data, error } = await supabase
            .from("estudiantes")
            .select("curso")
            .eq("level", nivelSeleccionado)
            .not("curso", "is", null)

          if (error) throw error

          const cursosUnicos = [...new Set(data?.map((e: any) => e.curso) || [])].sort()
          setCursos(cursosUnicos)
        } catch (error) {
          console.error("Error cargando cursos:", error)
        } finally {
          setLoadingCursos(false)
        }
      }
      fetchCursos()
    } else {
      setCursos([])
      setCursoSeleccionado("")
      setEstudiantes([])
      setEstudianteSeleccionado(null)
      setAlmuerzos([])
    }
  }, [nivelSeleccionado])

  // 4. Cargar estudiantes cuando se selecciona un curso
  useEffect(() => {
    if (nivelSeleccionado && cursoSeleccionado) {
      async function fetchEstudiantes() {
        setLoadingEstudiantes(true)
        setEstudiantes([])
        setEstudianteSeleccionado(null)
        setAlmuerzos([])
        setMensajeExito(null)
        setMensajeError(null)

        try {
          const { data, error } = await supabase
            .from("estudiantes")
            .select("id, name, level, curso, creditos_disponibles")
            .eq("level", nivelSeleccionado)
            .eq("curso", cursoSeleccionado)
            .order("name")

          if (error) throw error
          setEstudiantes(data || [])
        } catch (error) {
          console.error("Error cargando estudiantes:", error)
        } finally {
          setLoadingEstudiantes(false)
        }
      }
      fetchEstudiantes()
    } else {
      setEstudiantes([])
      setEstudianteSeleccionado(null)
      setAlmuerzos([])
    }
  }, [nivelSeleccionado, cursoSeleccionado])

  // 5. Cargar almuerzos cuando se selecciona un estudiante
  const handleEstudianteChange = async (estudianteId: string) => {
    const estudiante = estudiantes.find((e) => e.id === estudianteId)
    if (!estudiante) return

    setEstudianteSeleccionado(estudiante)
    setAlmuerzos([])
    setLoadingAlmuerzos(true)
    setMensajeExito(null)
    setMensajeError(null)

    try {
      const hoyChile = obtenerFechaChileISO() // "YYYY-MM-DD"
      
      const { data, error } = await supabase
        .from("pedidos_item")
        .select(`
          id,
          fecha,
          tipo,
          codigo,
          descripcion,
          precio_unitario,
          pedidos!inner (
            estado_pago
          )
        `)
        .eq("destinatario", estudiante.name)
        .eq("nivel", estudiante.level)
        .eq("curso", estudiante.curso)
        .eq("tipo_destinatario", "estudiante")
        .eq("tipo", "almuerzo")
        .is("deleted_at", null)
        .gt("fecha", hoyChile)
        .in("pedidos.estado_pago", ["pagado", "FMD", "PGC"])
        .order("fecha", { ascending: true })

      if (error) throw error
      setAlmuerzos((data as any) || [])
    } catch (error) {
      console.error("Error cargando almuerzos del estudiante:", error)
      setMensajeError("Ocurrió un error al cargar los almuerzos del estudiante.")
    } finally {
      setLoadingAlmuerzos(false)
    }
  }

  // Formateador de fecha amigable en español
  const formatearFecha = (fechaStr: string) => {
    const parts = fechaStr.split("-")
    if (parts.length !== 3) return fechaStr
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)
    
    const date = new Date(year, month, day)
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
    }
    const formatted = date.toLocaleDateString("es-CL", opciones)
    // Capitalizar la primera letra
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  // Abrir modal de confirmación
  const triggerAnulacion = (item: AlmuerzoItem) => {
    setItemAAnular(item)
    setIsModalOpen(true)
    setMensajeExito(null)
    setMensajeError(null)
  }

  // Confirmar y procesar anulación vía API POST /api/anulacion
  const ejecutarAnulacion = async () => {
    if (!itemAAnular || !estudianteSeleccionado) return

    setAnulando(true)
    setMensajeExito(null)
    setMensajeError(null)

    try {
      const res = await fetch("/api/anulacion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pedido_item_id: itemAAnular.id,
          estudiante_id: estudianteSeleccionado.id,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Error al anular el almuerzo")
      }

      // Éxito:
      // 1. Quitar el item anulado de la lista en pantalla
      setAlmuerzos((prev) => prev.filter((itm) => itm.id !== itemAAnular.id))

      // 2. Incrementar en 1 los créditos del estudiante en pantalla
      setEstudianteSeleccionado((prev) => {
        if (!prev) return prev
        const nuevosCreditos = (prev.creditos_disponibles ?? 0) + 1
        
        // También actualizamos la lista local de estudiantes
        setEstudiantes((prevEsts) =>
          prevEsts.map((est) =>
            est.id === prev.id ? { ...est, creditos_disponibles: nuevosCreditos } : est
          )
        )
        return {
          ...prev,
          creditos_disponibles: nuevosCreditos,
        }
      })

      // 3. Mostrar mensaje de éxito inline
      setMensajeExito(
        `Almuerzo del ${formatearFecha(itemAAnular.fecha)} anulado correctamente. Se acreditó 1 crédito de almuerzo.`
      )
    } catch (error: any) {
      console.error("Error ejecutando anulación:", error)
      setMensajeError(error.message || "Ocurrió un error al intentar anular el almuerzo.")
    } finally {
      setAnulando(false)
      setIsModalOpen(false)
      setItemAAnular(null)
    }
  }

  // Demo: arma un pedido de ejemplo para el estudiante seleccionado y lo
  // manda al resumen, para mostrar en vivo cómo se aplica el descuento del
  // crédito recién ganado.
  const verDescuentoDemo = () => {
    if (!estudianteSeleccionado) return

    const hoyChile = obtenerFechaChileISO()
    const [y, m, d] = hoyChile.split("-").map(Number)

    // Varios almuerzos futuros para que el descuento del crédito se vea aplicado
    // sobre un total mayor a $0 (con un solo almuerzo el total quedaría en $0
    // y eso genera dudas al mostrar la demo).
    const menusDemo = [
      { codigo_opcion: "1", descripcion_opcion: "Pollo al horno con puré" },
      { codigo_opcion: "2", descripcion_opcion: "Lasaña de verduras" },
      { codigo_opcion: "3", descripcion_opcion: "Pescado con arroz" },
    ]

    // Solo se almuerza de lunes a viernes en el casino: avanzamos día a día
    // saltando sábados y domingos hasta juntar una fecha hábil por cada menú.
    const siguienteFechaHabil = (fechaBase: Date) => {
      const fecha = new Date(fechaBase)
      while (fecha.getDay() === 0 || fecha.getDay() === 6) {
        fecha.setDate(fecha.getDate() + 1)
      }
      return fecha
    }

    const pedidos: Record<string, any[]> = {}
    let cursor = new Date(y, m - 1, d + 3)
    menusDemo.forEach((menu) => {
      cursor = siguienteFechaHabil(cursor)
      const fechaFuturaStr = cursor.toISOString().split("T")[0]
      cursor.setDate(cursor.getDate() + 1)
      pedidos[fechaFuturaStr] = [
        {
          codigo_opcion: menu.codigo_opcion,
          descripcion_opcion: menu.descripcion_opcion,
          categoria: "Almuerzo",
          fecha: fechaFuturaStr,
          dia_semana: "",
          cantidad: 1,
          precio_unitario: 5500,
          subtotal: 5500,
        },
      ]
    })

    const carritoAlmuerzos = {
      destinatarios: [
        {
          id: estudianteSeleccionado.id,
          nombre: estudianteSeleccionado.name,
          tipo: "estudiante",
          pedidos,
        },
      ],
    }

    localStorage.setItem("carritoAlmuerzos", JSON.stringify(carritoAlmuerzos))
    localStorage.removeItem("carritoColaciones")
    localStorage.removeItem("funcionarioSeleccionado")
    localStorage.removeItem("funcionarioConHijosSeleccionado")
    localStorage.removeItem("destinatariosSeleccionados")

    router.push("/resumen")
  }

  // Render: Loading general (verificando horario)
  if (cargandoHorario) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <LogoHeader />
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-500 font-medium">Verificando condiciones horarias...</p>
        </div>
      </div>
    )
  }

  // Render: Lockout screen si el plazo de anulación expiró
  if (permitido === false) {
    return (
      <div className="min-h-screen relative">
        <LogoHeader />
        <main className="container mx-auto px-4 py-8 pt-24 flex items-center justify-center min-h-[80vh]">
          <Card className="max-w-md w-full shadow-lg border-red-100 bg-white">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-red-50 text-red-500 p-3 rounded-full w-fit mb-4">
                <Clock className="h-12 w-12" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">Horario Vencido</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-gray-600">
                El plazo límite para realizar anulaciones de almuerzo venció a las{" "}
                <span className="font-semibold text-gray-800">{horaLimite}:00 hrs</span>.
              </p>
              <div className="p-3 bg-amber-50 rounded-lg flex items-start gap-3 text-left text-amber-800 text-sm border border-amber-100">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p>
                  Recuerda que solo se pueden anular almuerzos de días futuros antes de la hora límite
                  establecida. Podrás realizar cambios a partir de mañana.
                </p>
              </div>
              <Link href="/" passHref>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al inicio
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Render: Pantalla de anulación operativa
  return (
    <div className="min-h-screen relative">
      <LogoHeader />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <RotateCcw className="h-7 w-7 text-blue-600" />
                Anulación de Almuerzos
              </h1>
              <p className="text-gray-600">
                Selecciona al estudiante para visualizar y anular sus colaciones futuras.
              </p>
            </div>
            <Link href="/" passHref>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Atrás
              </Button>
            </Link>
          </div>

          {/* Alertas Inline */}
          {mensajeExito && (
            <div className="p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg flex items-start gap-3 shadow-sm animate-in fade-in-50">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">¡Operación exitosa!</p>
                <p className="text-sm text-green-700">{mensajeExito}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-green-800 hover:bg-green-100 h-6 px-1.5"
                onClick={() => setMensajeExito(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {mensajeError && (
            <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg flex items-start gap-3 shadow-sm animate-in fade-in-50">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Ha ocurrido un problema</p>
                <p className="text-sm text-red-700">{mensajeError}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-800 hover:bg-red-100 h-6 px-1.5"
                onClick={() => setMensajeError(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* CARD SELECTORES (CASCADA) */}
          <Card className="shadow-sm border-gray-100 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800">Buscador de Estudiante</CardTitle>
              <CardDescription>
                Filtra por nivel y curso para localizar al estudiante.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Nivel */}
              <div id="tour-nivel" className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Nivel</label>
                <Select
                  value={nivelSeleccionado}
                  onValueChange={setNivelSeleccionado}
                  disabled={loadingNiveles}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue placeholder={loadingNiveles ? "Cargando..." : "Selecciona nivel"} />
                  </SelectTrigger>
                  <SelectContent>
                    {niveles.map((nivel) => (
                      <SelectItem key={nivel} value={nivel}>
                        {nivel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Curso */}
              <div id="tour-curso" className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Curso</label>
                <Select
                  value={cursoSeleccionado}
                  onValueChange={setCursoSeleccionado}
                  disabled={!nivelSeleccionado || loadingCursos || cursos.length === 0}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue
                      placeholder={
                        !nivelSeleccionado
                          ? "Selecciona nivel primero"
                          : loadingCursos
                          ? "Cargando..."
                          : "Selecciona curso"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {cursos.map((curso) => (
                      <SelectItem key={curso} value={curso}>
                        {curso}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Estudiante */}
              <div id="tour-estudiante" className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Estudiante</label>
                <Select
                  value={estudianteSeleccionado?.id || ""}
                  onValueChange={handleEstudianteChange}
                  disabled={!cursoSeleccionado || loadingEstudiantes || estudiantes.length === 0}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue
                      placeholder={
                        !cursoSeleccionado
                          ? "Selecciona curso primero"
                          : loadingEstudiantes
                          ? "Cargando..."
                          : "Selecciona estudiante"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {estudiantes.map((estudiante) => (
                      <SelectItem key={estudiante.id} value={estudiante.id}>
                        {estudiante.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </CardContent>
          </Card>

          {/* CARD DE DETALLES Y LISTA DE ALMUERZOS */}
          {estudianteSeleccionado && (
            <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              
              {/* Información del Estudiante & Créditos */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-blue-50 border border-blue-100 rounded-lg gap-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{estudianteSeleccionado.name}</h3>
                  <p className="text-sm text-gray-600">
                    {estudianteSeleccionado.level} — {estudianteSeleccionado.curso}
                  </p>
                </div>
                <div id="tour-creditos" className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-blue-200 shadow-sm">
                  <Coins className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-gray-700">
                    Créditos disponibles:{" "}
                    <span className="font-bold text-blue-700">
                      {estudianteSeleccionado.creditos_disponibles ?? 0}
                    </span>
                  </span>
                </div>
              </div>

              {mensajeExito && (
                <Button
                  id="tour-ver-descuento"
                  onClick={verDescuentoDemo}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Ver cómo se descuenta el crédito en un pedido nuevo
                </Button>
              )}

              {/* Listado de Almuerzos */}
              <Card id="tour-lista-almuerzos" className="shadow-sm border-gray-100 bg-white">
                <CardHeader className="pb-3 border-b border-gray-50">
                  <CardTitle className="text-md font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    Almuerzos Anulables Programados
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingAlmuerzos ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <p className="text-sm text-gray-500">Cargando almuerzos programados...</p>
                    </div>
                  ) : almuerzos.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                      <AlertCircle className="h-8 w-8 text-gray-300 mx-auto" />
                      <p className="text-gray-500 font-medium text-sm">
                        Este estudiante no tiene almuerzos futuros para anular.
                      </p>
                      <p className="text-gray-400 text-xs px-6">
                        Solo se pueden anular almuerzos programados a partir de mañana y que correspondan a pedidos pagados.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {almuerzos.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="space-y-1">
                            <span className="text-sm font-semibold text-blue-600 capitalize">
                              {formatearFecha(item.fecha)}
                            </span>
                            <div className="text-gray-800 font-medium text-sm">
                              {item.descripcion}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] text-gray-500">
                                {item.codigo}
                              </Badge>
                              <span className="text-xs text-gray-500 font-medium">
                                ${item.precio_unitario.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <Button
                            id={index === 0 ? "tour-boton-anular" : undefined}
                            variant="destructive"
                            size="sm"
                            onClick={() => triggerAnulacion(item)}
                            className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200"
                          >
                            <Trash2 className="h-4 w-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">Anular</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          )}

        </div>
      </main>

      <TourAnulacion
        estudianteListo={!!estudianteSeleccionado}
        anulacionListo={!!mensajeExito}
        onVerDescuento={verDescuentoDemo}
      />

      {/* DIALOG DE CONFIRMACION */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-800">
              ¿Anular almuerzo del {itemAAnular ? formatearFecha(itemAAnular.fecha) : ""}?
            </DialogTitle>
            <DialogDescription className="pt-2 text-gray-600 text-sm">
              {itemAAnular && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1 mb-3">
                  <p className="font-semibold text-gray-800">{itemAAnular.descripcion}</p>
                  <p className="text-xs text-gray-500">Código: {itemAAnular.codigo}</p>
                  <p className="text-xs text-gray-500">Valor original: ${itemAAnular.precio_unitario.toLocaleString()}</p>
                </div>
              )}
              <span className="block text-gray-700">
                Al confirmar, <strong>{estudianteSeleccionado?.name}</strong> recibirá 1 crédito que se aplicará automáticamente en su próximo pedido.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                setItemAAnular(null)
              }}
              disabled={anulando}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={ejecutarAnulacion}
              disabled={anulando}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {anulando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Anulando...
                </>
              ) : (
                "Confirmar anulación"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
