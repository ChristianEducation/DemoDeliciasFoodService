"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, Trash2, Plus, Save, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ConfiguracionBloqueo {
  id: string
  hora_limite_lunes: number
  hora_limite_semana: number
}

interface DiaFeriado {
  id: string
  fecha: string
  descripcion: string | null
}

export default function ConfiguracionPage() {
  // Estado para horarios de bloqueo
  const [config, setConfig] = useState<ConfiguracionBloqueo | null>(null)
  const [horaLunes, setHoraLunes] = useState<number>(21)
  const [horaSemana, setHoraSemana] = useState<number>(9)
  const [guardandoConfig, setGuardandoConfig] = useState(false)

  // Estado para feriados
  const [feriados, setFeriados] = useState<DiaFeriado[]>([])
  const [nuevaFecha, setNuevaFecha] = useState("")
  const [nuevaDescripcion, setNuevaDescripcion] = useState("")
  const [agregandoFeriado, setAgregandoFeriado] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

  // Estado general
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const [configRes, feriadosRes] = await Promise.all([
        supabase.from("configuracion_bloqueo").select("*").single(),
        supabase.from("dias_feriados").select("*").order("fecha", { ascending: true }),
      ])

      if (configRes.data) {
        setConfig(configRes.data)
        setHoraLunes(configRes.data.hora_limite_lunes)
        setHoraSemana(configRes.data.hora_limite_semana)
      }

      if (feriadosRes.data) {
        setFeriados(feriadosRes.data)
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
      setMensaje({ tipo: "error", texto: "Error al cargar la configuración" })
    } finally {
      setCargando(false)
    }
  }

  const guardarConfiguracion = async () => {
    setGuardandoConfig(true)
    setMensaje(null)
    try {
      const { data, error } = await supabase
        .from("configuracion_bloqueo")
        .update({
          hora_limite_lunes: horaLunes,
          hora_limite_semana: horaSemana,
          updated_at: new Date().toISOString(),
        })
        .eq("id", config?.id)
        .select()
        .single()

      if (error) throw error

      setMensaje({ tipo: "exito", texto: "Configuración guardada correctamente" })
      setConfig(data)
    } catch (error) {
      console.error("Error al guardar:", error)
      setMensaje({ tipo: "error", texto: "Error al guardar la configuración" })
    } finally {
      setGuardandoConfig(false)
    }
  }

  const agregarFeriado = async () => {
    if (!nuevaFecha) return

    setAgregandoFeriado(true)
    setMensaje(null)
    try {
      const { data, error } = await supabase
        .from("dias_feriados")
        .insert({
          fecha: nuevaFecha,
          descripcion: nuevaDescripcion || null,
        })
        .select()
        .single()

      if (error) throw error

      setFeriados([...feriados, data].sort((a, b) => a.fecha.localeCompare(b.fecha)))
      setNuevaFecha("")
      setNuevaDescripcion("")
      setMensaje({ tipo: "exito", texto: "Feriado agregado correctamente" })
    } catch (error) {
      console.error("Error al agregar feriado:", error)
      setMensaje({ tipo: "error", texto: "Error al agregar feriado" })
    } finally {
      setAgregandoFeriado(false)
    }
  }

  const eliminarFeriado = async (id: string) => {
    setEliminandoId(id)
    setMensaje(null)
    try {
      const { error } = await supabase.from("dias_feriados").delete().eq("id", id)

      if (error) throw error

      setFeriados(feriados.filter((f) => f.id !== id))
      setMensaje({ tipo: "exito", texto: "Feriado eliminado correctamente" })
    } catch (error) {
      console.error("Error al eliminar feriado:", error)
      setMensaje({ tipo: "error", texto: "Error al eliminar feriado" })
    } finally {
      setEliminandoId(null)
    }
  }

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha + "T12:00:00")
    return date.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  if (cargando) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Administra los horarios de bloqueo y días feriados</p>
      </div>

      {mensaje && (
        <div
          className={`p-4 rounded-lg ${
            mensaje.tipo === "exito"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Horarios de Bloqueo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horarios de Bloqueo
          </CardTitle>
          <CardDescription>Define hasta qué hora se pueden realizar pedidos para cada día</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="horaLunes">Hora límite para pedir el Lunes</Label>
              <p className="text-sm text-muted-foreground">Hasta qué hora del domingo se puede pedir para el lunes</p>
              <div className="flex items-center gap-2">
                <Input
                  id="horaLunes"
                  type="number"
                  min={0}
                  max={23}
                  value={horaLunes}
                  onChange={(e) => setHoraLunes(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-muted-foreground">:00 hrs</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="horaSemana">Hora límite para Martes a Viernes</Label>
              <p className="text-sm text-muted-foreground">Hasta qué hora del día anterior se puede pedir</p>
              <div className="flex items-center gap-2">
                <Input
                  id="horaSemana"
                  type="number"
                  min={0}
                  max={23}
                  value={horaSemana}
                  onChange={(e) => setHoraSemana(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-muted-foreground">:00 hrs</span>
              </div>
            </div>
          </div>

          <Button onClick={guardarConfiguracion} disabled={guardandoConfig}>
            {guardandoConfig ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar Horarios
          </Button>
        </CardContent>
      </Card>

      {/* Días Feriados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Días Feriados
          </CardTitle>
          <CardDescription>Los días feriados no estarán disponibles para realizar pedidos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Agregar nuevo feriado */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="nuevaFecha" className="sr-only">
                Fecha
              </Label>
              <Input
                id="nuevaFecha"
                type="date"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                placeholder="Seleccionar fecha"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="nuevaDescripcion" className="sr-only">
                Descripción
              </Label>
              <Input
                id="nuevaDescripcion"
                type="text"
                value={nuevaDescripcion}
                onChange={(e) => setNuevaDescripcion(e.target.value)}
                placeholder="Descripción (opcional)"
              />
            </div>
            <Button onClick={agregarFeriado} disabled={!nuevaFecha || agregandoFeriado}>
              {agregandoFeriado ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Agregar
            </Button>
          </div>

          {/* Lista de feriados */}
          {feriados.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay días feriados registrados</p>
          ) : (
            <div className="border rounded-lg divide-y">
              {feriados.map((feriado) => (
                <div key={feriado.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                  <div>
                    <p className="font-medium capitalize">{formatearFecha(feriado.fecha)}</p>
                    {feriado.descripcion && <p className="text-sm text-muted-foreground">{feriado.descripcion}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => eliminarFeriado(feriado.id)}
                    disabled={eliminandoId === feriado.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {eliminandoId === feriado.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
