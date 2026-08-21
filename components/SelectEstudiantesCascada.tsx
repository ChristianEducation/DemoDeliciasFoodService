"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, X } from "lucide-react"

interface Estudiante {
  id: string
  name: string
  level: string
  curso: string
}

interface EstudianteSeleccionado {
  id: string
  name: string
  level: string
  curso: string
}

interface SelectEstudiantesCascadaProps {
  onEstudiantesSeleccionados: (estudiantesIds: string[]) => void
}

export default function SelectEstudiantesCascada({ onEstudiantesSeleccionados }: SelectEstudiantesCascadaProps) {
  const [niveles, setNiveles] = useState<string[]>([])
  const [cursos, setCursos] = useState<string[]>([])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])

  const [nivelSeleccionado, setNivelSeleccionado] = useState<string>("")
  const [cursoSeleccionado, setCursoSeleccionado] = useState<string>("")
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<string>("")

  const [estudiantesAgregados, setEstudiantesAgregados] = useState<EstudianteSeleccionado[]>([])

  const [loadingNiveles, setLoadingNiveles] = useState(true)
  const [loadingCursos, setLoadingCursos] = useState(false)
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false)

  const supabase = createClient()

  // Cargar niveles al montar el componente
  useEffect(() => {
    async function fetchNiveles() {
      setLoadingNiveles(true)
      try {
        const { data, error } = await supabase.from("estudiantes").select("level").not("level", "is", null)

        if (error) throw error

        const nivelesUnicos = [...new Set(data?.map((e) => e.level) || [])].sort()
        setNiveles(nivelesUnicos)
      } catch (error) {
        console.error("Error cargando niveles:", error)
      } finally {
        setLoadingNiveles(false)
      }
    }

    fetchNiveles()
  }, [])

  // Cargar cursos cuando se selecciona un nivel
  useEffect(() => {
    if (nivelSeleccionado) {
      async function fetchCursos() {
        setLoadingCursos(true)
        setCursos([])
        setCursoSeleccionado("")
        setEstudiantes([])
        setEstudianteSeleccionado("")

        try {
          const { data, error } = await supabase
            .from("estudiantes")
            .select("curso")
            .eq("level", nivelSeleccionado)
            .not("curso", "is", null)

          if (error) throw error

          const cursosUnicos = [...new Set(data?.map((e) => e.curso) || [])].sort()
          setCursos(cursosUnicos)
        } catch (error) {
          console.error("Error cargando cursos:", error)
        } finally {
          setLoadingCursos(false)
        }
      }

      fetchCursos()
    }
  }, [nivelSeleccionado])

  // Cargar estudiantes cuando se selecciona un curso
  useEffect(() => {
    if (nivelSeleccionado && cursoSeleccionado) {
      async function fetchEstudiantes() {
        setLoadingEstudiantes(true)
        setEstudiantes([])
        setEstudianteSeleccionado("")

        try {
          const { data, error } = await supabase
            .from("estudiantes")
            .select("id, name, level, curso")
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
    }
  }, [nivelSeleccionado, cursoSeleccionado])

  const handleAgregarEstudiante = () => {
    if (estudianteSeleccionado) {
      const estudiante = estudiantes.find((e) => e.id === estudianteSeleccionado)
      if (estudiante && !estudiantesAgregados.find((e) => e.id === estudiante.id)) {
        const nuevosEstudiantes = [...estudiantesAgregados, estudiante]
        setEstudiantesAgregados(nuevosEstudiantes)

        // Limpiar selecciones para agregar otro
        setNivelSeleccionado("")
        setCursoSeleccionado("")
        setEstudianteSeleccionado("")
        setCursos([])
        setEstudiantes([])
      }
    }
  }

  const handleRemoverEstudiante = (estudianteId: string) => {
    const nuevosEstudiantes = estudiantesAgregados.filter((e) => e.id !== estudianteId)
    setEstudiantesAgregados(nuevosEstudiantes)
  }

  const handleContinuar = () => {
    const ids = estudiantesAgregados.map((e) => e.id)

    console.log("📊 Guardando estudiantes seleccionados:", {
      ids,
      estudiantesCompletos: estudiantesAgregados,
    })

    // Guardar SOLO los IDs como array de strings
    localStorage.setItem("estudiantesSeleccionados", JSON.stringify(ids))

    // Guardar los datos completos por separado para referencia futura
    localStorage.setItem("estudiantesCompletosSeleccionados", JSON.stringify(estudiantesAgregados))

    onEstudiantesSeleccionados(ids)
  }

  return (
    <div className="space-y-8">
      {/* Estudiantes ya agregados */}
      {estudiantesAgregados.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-green-800 mb-3">Estudiantes seleccionados:</h3>
            <div className="flex flex-wrap gap-2">
              {estudiantesAgregados.map((estudiante) => (
                <Badge key={estudiante.id} variant="secondary" className="bg-green-100 text-green-800 px-3 py-1">
                  {estudiante.name} ({estudiante.level} - {estudiante.curso})
                  <button onClick={() => handleRemoverEstudiante(estudiante.id)} className="ml-2 hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selector de Nivel */}
      <div className="text-center">
        <h2 className="text-xl font-light text-gray-700 mb-4">Selecciona el Nivel</h2>
        <div className="max-w-xs mx-auto">
          <Select value={nivelSeleccionado} onValueChange={setNivelSeleccionado} disabled={loadingNiveles}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder={loadingNiveles ? "Cargando..." : "Nivel"} />
            </SelectTrigger>
            <SelectContent>
              {niveles.map((nivel) => (
                <SelectItem key={nivel} value={nivel}>
                  {nivel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loadingNiveles && (
            <div className="flex justify-center mt-2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Selector de Curso */}
      {nivelSeleccionado && (
        <div className="text-center">
          <h2 className="text-xl font-light text-gray-700 mb-4">Selecciona el Curso</h2>
          <div className="max-w-xs mx-auto">
            <Select
              value={cursoSeleccionado}
              onValueChange={setCursoSeleccionado}
              disabled={loadingCursos || cursos.length === 0}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder={loadingCursos ? "Cargando..." : "Curso"} />
              </SelectTrigger>
              <SelectContent>
                {cursos.map((curso) => (
                  <SelectItem key={curso} value={curso}>
                    {curso}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loadingCursos && (
              <div className="flex justify-center mt-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selector de Estudiante */}
      {cursoSeleccionado && (
        <div className="text-center">
          <h2 className="text-xl font-light text-gray-700 mb-4">Selecciona el Estudiante</h2>
          <div className="max-w-xs mx-auto">
            {loadingEstudiantes ? (
              <div className="flex justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            ) : estudiantes.length === 0 ? (
              <p className="text-gray-500 text-sm">No se encontraron estudiantes</p>
            ) : (
              <>
                <Select value={estudianteSeleccionado} onValueChange={setEstudianteSeleccionado}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Estudiante" />
                  </SelectTrigger>
                  <SelectContent>
                    {estudiantes
                      .filter((estudiante) => !estudiantesAgregados.find((e) => e.id === estudiante.id))
                      .map((estudiante) => (
                        <SelectItem key={estudiante.id} value={estudiante.id}>
                          {estudiante.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {estudianteSeleccionado && (
                  <Button onClick={handleAgregarEstudiante} className="mt-3 w-full bg-transparent" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Estudiante
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Botón para agregar otro estudiante */}
      {estudiantesAgregados.length > 0 && (
        <div className="text-center">
          <Button
            onClick={() => {
              setNivelSeleccionado("")
              setCursoSeleccionado("")
              setEstudianteSeleccionado("")
              setCursos([])
              setEstudiantes([])
            }}
            variant="outline"
            className="mb-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Otro Estudiante
          </Button>
        </div>
      )}

      {/* Botón Continuar */}
      {estudiantesAgregados.length > 0 && (
        <div className="text-center pt-4">
          <Button onClick={handleContinuar} size="lg" className="px-8 py-3">
            Continuar con {estudiantesAgregados.length} estudiante{estudiantesAgregados.length !== 1 ? "s" : ""}
          </Button>
        </div>
      )}
    </div>
  )
}
