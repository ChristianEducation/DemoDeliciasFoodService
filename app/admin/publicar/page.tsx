"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/hooks/use-toast"
import { CalendarIcon, Plus, Trash2, Save, X, Edit } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Almuerzo {
  id: string
  fecha: string
  dia_semana: string
  numero_dia: number
  codigo_opcion: number
  pedidos_actuales: number
  descripcion_opcion: string
  categoria: string
  activa: boolean
  created_at: string | null
}

interface Colacion {
  id: string
  codigo: string
  snack: string
  bebestible: string
  descripcion: string
  precio: number
}

export default function AdminPublicar() {
  const [almuerzos, setAlmuerzos] = useState<Almuerzo[]>([])
  const [colaciones, setColaciones] = useState<Colacion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedOpcion, setSelectedOpcion] = useState<number | null>(null)
  const [descripcionAlmuerzo, setDescripcionAlmuerzo] = useState("")
  const [editandoAlmuerzo, setEditandoAlmuerzo] = useState<string | null>(null)
  const [editandoColacion, setEditandoColacion] = useState<string | null>(null)
  const [descripcionEditAlmuerzo, setDescripcionEditAlmuerzo] = useState("")
  const [colacionEdit, setColacionEdit] = useState({
    snack: "",
    bebestible: "",
    precio: 0,
  })
  const [nuevaColacion, setNuevaColacion] = useState({
    snack: "",
    bebestible: "",
    precio: 0,
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showAlmuerzoDialog, setShowAlmuerzoDialog] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)

      // Cargar almuerzos
      const { data: almuerzoData, error: almuerzoError } = await supabase
        .from("almuerzos")
        .select("*")
        .order("fecha", { ascending: false })

      if (almuerzoError) throw almuerzoError

      // Cargar colaciones
      const { data: colacionData, error: colacionError } = await supabase.from("colaciones").select("*").order("codigo")

      if (colacionError) throw colacionError

      setAlmuerzos(almuerzoData || [])
      setColaciones(colacionData || [])
    } catch (error) {
      console.error("Error cargando datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatearFecha = (fecha: Date): string => {
    return format(fecha, "yyyy-MM-dd")
  }

  const obtenerDiaSemana = (fecha: Date): string => {
    return format(fecha, "EEEE", { locale: es })
  }

  const obtenerNumeroDia = (fecha: Date): number => {
    return fecha.getDate()
  }

  const verificarAlmuerzoExiste = (fecha: string, codigo: number): boolean => {
    return almuerzos.some((a) => a.fecha === fecha && a.codigo_opcion === codigo)
  }

  const abrirDialogoAlmuerzo = (opcion: number) => {
    const fechaStr = formatearFecha(selectedDate)

    if (verificarAlmuerzoExiste(fechaStr, opcion)) {
      toast({
        title: "Almuerzo ya existe",
        description: `La opción ${opcion} ya está creada para esta fecha`,
        variant: "destructive",
      })
      return
    }

    setSelectedOpcion(opcion)
    setDescripcionAlmuerzo("")
    setShowAlmuerzoDialog(true)
  }

  const guardarAlmuerzo = async () => {
    if (!selectedOpcion || !descripcionAlmuerzo.trim()) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      const fechaStr = formatearFecha(selectedDate)
      const diaSemana = obtenerDiaSemana(selectedDate)
      const numeroDia = obtenerNumeroDia(selectedDate)

      const nuevoAlmuerzo = {
        fecha: fechaStr,
        dia_semana: diaSemana,
        numero_dia: numeroDia,
        codigo_opcion: selectedOpcion,
        pedidos_actuales: 0,
        descripcion_opcion: descripcionAlmuerzo.trim(),
        categoria: "MENU",
        activa: true,
        created_at: null,
      }

      const { data, error } = await supabase.from("almuerzos").insert([nuevoAlmuerzo]).select()

      if (error) throw error

      setAlmuerzos((prev) => [data[0], ...prev])
      setShowAlmuerzoDialog(false)
      setSelectedOpcion(null)
      setDescripcionAlmuerzo("")

      toast({
        title: "Éxito",
        description: "Almuerzo agregado correctamente",
      })
    } catch (error) {
      console.error("Error guardando almuerzo:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el almuerzo",
        variant: "destructive",
      })
    }
  }

  const iniciarEditarAlmuerzo = (almuerzo: Almuerzo) => {
    setEditandoAlmuerzo(almuerzo.id)
    setDescripcionEditAlmuerzo(almuerzo.descripcion_opcion)
  }

  const guardarEditAlmuerzo = async (id: string) => {
    if (!descripcionEditAlmuerzo.trim()) {
      toast({
        title: "Error",
        description: "La descripción es obligatoria",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("almuerzos")
        .update({ descripcion_opcion: descripcionEditAlmuerzo.trim() })
        .eq("id", id)

      if (error) throw error

      setAlmuerzos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, descripcion_opcion: descripcionEditAlmuerzo.trim() } : a)),
      )

      setEditandoAlmuerzo(null)
      setDescripcionEditAlmuerzo("")

      toast({
        title: "Éxito",
        description: "Almuerzo actualizado correctamente",
      })
    } catch (error) {
      console.error("Error actualizando almuerzo:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el almuerzo",
        variant: "destructive",
      })
    }
  }

  const cancelarEditAlmuerzo = () => {
    setEditandoAlmuerzo(null)
    setDescripcionEditAlmuerzo("")
  }

  const eliminarAlmuerzo = async (id: string) => {
    try {
      const { error } = await supabase.from("almuerzos").delete().eq("id", id)

      if (error) throw error

      setAlmuerzos((prev) => prev.filter((a) => a.id !== id))

      toast({
        title: "Éxito",
        description: "Almuerzo eliminado correctamente",
      })
    } catch (error) {
      console.error("Error eliminando almuerzo:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el almuerzo",
        variant: "destructive",
      })
    }
  }

  const crearColacion = async () => {
    if (!nuevaColacion.snack || !nuevaColacion.bebestible || nuevaColacion.precio <= 0) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios y el precio debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    try {
      // Generar código automáticamente
      const maxCodigo = colaciones.length > 0 ? Math.max(...colaciones.map((c) => Number.parseInt(c.codigo))) : 0
      const nuevoCodigo = (maxCodigo + 1).toString()

      const descripcion = `${nuevaColacion.snack} + ${nuevaColacion.bebestible}`

      const { data, error } = await supabase
        .from("colaciones")
        .insert([
          {
            codigo: nuevoCodigo,
            snack: nuevaColacion.snack,
            bebestible: nuevaColacion.bebestible,
            descripcion: descripcion,
            precio: nuevaColacion.precio,
          },
        ])
        .select()

      if (error) throw error

      setColaciones((prev) => [...prev, data[0]])
      setNuevaColacion({ snack: "", bebestible: "", precio: 0 })

      toast({
        title: "Éxito",
        description: "Colación creada correctamente",
      })
    } catch (error) {
      console.error("Error creando colación:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la colación",
        variant: "destructive",
      })
    }
  }

  const iniciarEditarColacion = (colacion: Colacion) => {
    setEditandoColacion(colacion.id)
    setColacionEdit({
      snack: colacion.snack,
      bebestible: colacion.bebestible,
      precio: colacion.precio,
    })
  }

  const guardarEditColacion = async (id: string) => {
    if (!colacionEdit.snack || !colacionEdit.bebestible || colacionEdit.precio <= 0) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios y el precio debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    try {
      const descripcion = `${colacionEdit.snack} + ${colacionEdit.bebestible}`

      const { error } = await supabase
        .from("colaciones")
        .update({
          snack: colacionEdit.snack,
          bebestible: colacionEdit.bebestible,
          descripcion: descripcion,
          precio: colacionEdit.precio,
        })
        .eq("id", id)

      if (error) throw error

      setColaciones((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                snack: colacionEdit.snack,
                bebestible: colacionEdit.bebestible,
                descripcion: descripcion,
                precio: colacionEdit.precio,
              }
            : c,
        ),
      )

      setEditandoColacion(null)
      setColacionEdit({ snack: "", bebestible: "", precio: 0 })

      toast({
        title: "Éxito",
        description: "Colación actualizada correctamente",
      })
    } catch (error) {
      console.error("Error actualizando colación:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la colación",
        variant: "destructive",
      })
    }
  }

  const cancelarEditColacion = () => {
    setEditandoColacion(null)
    setColacionEdit({ snack: "", bebestible: "", precio: 0 })
  }

  const eliminarColacion = async (id: string) => {
    try {
      const { error } = await supabase.from("colaciones").delete().eq("id", id)

      if (error) throw error

      setColaciones((prev) => prev.filter((c) => c.id !== id))

      toast({
        title: "Éxito",
        description: "Colación eliminada correctamente",
      })
    } catch (error) {
      console.error("Error eliminando colación:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la colación",
        variant: "destructive",
      })
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const almuerzosPorFecha = almuerzos.filter((a) => a.fecha === formatearFecha(selectedDate))

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Publicar Menús</h1>
        <p className="text-gray-600 mt-2">Gestiona los menús de almuerzos y colaciones</p>
      </div>

      <Tabs defaultValue="almuerzos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="almuerzos">Almuerzos</TabsTrigger>
          <TabsTrigger value="colaciones">Colaciones</TabsTrigger>
        </TabsList>

        {/* Tab Almuerzos */}
        <TabsContent value="almuerzos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestionar Almuerzos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selector de fecha */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Seleccionar fecha:</label>
                <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, "PPP", { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date)
                          setShowDatePicker(false)
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Opciones de almuerzo */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Opciones disponibles para {format(selectedDate, "PPP", { locale: es })}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((opcion) => {
                    const existe = verificarAlmuerzoExiste(formatearFecha(selectedDate), opcion)
                    return (
                      <Card key={opcion} className={existe ? "border-green-500 bg-green-50" : "border-dashed"}>
                        <CardContent className="p-4 text-center">
                          <div className="space-y-2">
                            <Badge variant={existe ? "default" : "outline"}>Opción {opcion}</Badge>
                            {existe ? (
                              <div className="space-y-2">
                                <p className="text-sm text-green-600">✓ Creada</p>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    const almuerzo = almuerzosPorFecha.find((a) => a.codigo_opcion === opcion)
                                    if (almuerzo) eliminarAlmuerzo(almuerzo.id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => abrirDialogoAlmuerzo(opcion)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Lista de almuerzos creados para la fecha */}
              {almuerzosPorFecha.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Almuerzos creados:</h3>
                  <div className="space-y-2">
                    {almuerzosPorFecha.map((almuerzo) => (
                      <div key={almuerzo.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge>Opción {almuerzo.codigo_opcion}</Badge>
                              <span className="text-sm text-gray-500">
                                Pedidos actuales: {almuerzo.pedidos_actuales}
                              </span>
                            </div>
                            {editandoAlmuerzo === almuerzo.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={descripcionEditAlmuerzo}
                                  onChange={(e) => setDescripcionEditAlmuerzo(e.target.value)}
                                  rows={3}
                                  className="w-full"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => guardarEditAlmuerzo(almuerzo.id)}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Guardar
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={cancelarEditAlmuerzo}>
                                    <X className="h-4 w-4 mr-2" />
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm">{almuerzo.descripcion_opcion}</p>
                            )}
                          </div>
                          {editandoAlmuerzo !== almuerzo.id && (
                            <Button variant="ghost" size="sm" onClick={() => iniciarEditarAlmuerzo(almuerzo)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Colaciones */}
        <TabsContent value="colaciones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Crear Nueva Colación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Snack"
                  value={nuevaColacion.snack}
                  onChange={(e) => setNuevaColacion({ ...nuevaColacion, snack: e.target.value })}
                />
                <Input
                  placeholder="Bebestible"
                  value={nuevaColacion.bebestible}
                  onChange={(e) => setNuevaColacion({ ...nuevaColacion, bebestible: e.target.value })}
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Precio"
                    value={nuevaColacion.precio}
                    onChange={(e) => setNuevaColacion({ ...nuevaColacion, precio: Number(e.target.value) || 0 })}
                  />
                  <Button onClick={crearColacion}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {(nuevaColacion.snack || nuevaColacion.bebestible) && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Vista previa descripción:</p>
                  <p className="font-medium">
                    {nuevaColacion.snack} + {nuevaColacion.bebestible}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Colaciones Existentes ({colaciones.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {colaciones.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay colaciones creadas</p>
                ) : (
                  colaciones.map((colacion) => (
                    <div key={colacion.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge>{colacion.codigo}</Badge>
                          </div>
                          {editandoColacion === colacion.id ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Input
                                  placeholder="Snack"
                                  value={colacionEdit.snack}
                                  onChange={(e) => setColacionEdit({ ...colacionEdit, snack: e.target.value })}
                                />
                                <Input
                                  placeholder="Bebestible"
                                  value={colacionEdit.bebestible}
                                  onChange={(e) => setColacionEdit({ ...colacionEdit, bebestible: e.target.value })}
                                />
                                <Input
                                  type="number"
                                  placeholder="Precio"
                                  value={colacionEdit.precio}
                                  onChange={(e) =>
                                    setColacionEdit({ ...colacionEdit, precio: Number(e.target.value) || 0 })
                                  }
                                />
                              </div>
                              {(colacionEdit.snack || colacionEdit.bebestible) && (
                                <div className="p-2 bg-gray-50 rounded text-sm">
                                  <span className="text-gray-600">Vista previa: </span>
                                  <span className="font-medium">
                                    {colacionEdit.snack} + {colacionEdit.bebestible}
                                  </span>
                                </div>
                              )}
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => guardarEditColacion(colacion.id)}>
                                  <Save className="h-4 w-4 mr-2" />
                                  Guardar
                                </Button>
                                <Button variant="outline" size="sm" onClick={cancelarEditColacion}>
                                  <X className="h-4 w-4 mr-2" />
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium">{colacion.descripcion}</p>
                              <p className="text-sm text-gray-600">{formatPrice(colacion.precio)}</p>
                            </div>
                          )}
                        </div>
                        {editandoColacion !== colacion.id && (
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => iniciarEditarColacion(colacion)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => eliminarColacion(colacion.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para agregar almuerzo */}
      <Dialog open={showAlmuerzoDialog} onOpenChange={setShowAlmuerzoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Almuerzo - Opción {selectedOpcion}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Fecha: {format(selectedDate, "PPP", { locale: es })}</p>
              <p className="text-sm text-gray-600">Día: {obtenerDiaSemana(selectedDate)}</p>
            </div>
            <Textarea
              placeholder="Descripción del almuerzo..."
              value={descripcionAlmuerzo}
              onChange={(e) => setDescripcionAlmuerzo(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={guardarAlmuerzo} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
              <Button variant="outline" onClick={() => setShowAlmuerzoDialog(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
