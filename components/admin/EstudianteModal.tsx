"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"

interface Estudiante {
  id: string
  name: string
  curso: string
  level: string
}

interface EstudianteModalProps {
  isOpen: boolean
  onClose: () => void
  onGuardar: (data: { name: string; curso: string; level: string }) => void
  estudiante: Estudiante | null
}

export function EstudianteModal({ isOpen, onClose, onGuardar, estudiante }: EstudianteModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    curso: "",
    level: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [cursosDisponibles, setCursosDisponibles] = useState<string[]>([])
  const [loadingCursos, setLoadingCursos] = useState(false)

  // Cargar cursos disponibles según el nivel seleccionado
  const cargarCursosPorNivel = async (nivel: string) => {
    if (!nivel) {
      setCursosDisponibles([])
      return
    }

    try {
      setLoadingCursos(true)
      const { data, error } = await supabase
        .from("estudiantes")
        .select("curso")
        .eq("level", nivel)
        .not("curso", "is", null)

      if (error) {
        console.error("Error cargando cursos:", error)
        return
      }

      // Extraer cursos únicos y ordenarlos
      const cursosUnicos = [...new Set(data?.map(item => item.curso) || [])]
      setCursosDisponibles(cursosUnicos.sort())
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoadingCursos(false)
    }
  }

  useEffect(() => {
    if (estudiante) {
      setFormData({
        name: estudiante.name,
        curso: estudiante.curso,
        level: estudiante.level,
      })
      // Cargar cursos para el nivel del estudiante
      cargarCursosPorNivel(estudiante.level)
    } else {
      setFormData({
        name: "",
        curso: "",
        level: "",
      })
      setCursosDisponibles([])
    }
    setErrors({})
  }, [estudiante, isOpen])

  // Cuando cambia el nivel, cargar los cursos correspondientes
  useEffect(() => {
    if (formData.level) {
      cargarCursosPorNivel(formData.level)
      // Limpiar el curso seleccionado cuando cambia el nivel
      if (!estudiante) {
        setFormData(prev => ({ ...prev, curso: "" }))
      }
    }
  }, [formData.level, estudiante])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido"
    }

    if (!formData.curso.trim()) {
      newErrors.curso = "El curso es requerido"
    }

    if (!formData.level) {
      newErrors.level = "El nivel es requerido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    onGuardar(formData)
  }

  const handleClose = () => {
    setFormData({ name: "", curso: "", level: "" })
    setCursosDisponibles([])
    setErrors({})
    onClose()
  }

  const handleLevelChange = (value: string) => {
    setFormData({ ...formData, level: value, curso: "" })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{estudiante ? "Editar Estudiante" : "Agregar Estudiante"}</DialogTitle>
          <DialogDescription>
            {estudiante ? "Modifica los datos del estudiante." : "Completa los datos para agregar un nuevo estudiante."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Campo Nombre */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ingresa el nombre completo"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>
            </div>

            {/* Campo Nivel */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="level" className="text-right">
                Nivel
              </Label>
              <div className="col-span-3">
                <Select value={formData.level} onValueChange={handleLevelChange}>
                  <SelectTrigger className={errors.level ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecciona un nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESCHOOL">PRESCHOOL</SelectItem>
                    <SelectItem value="LOWERSCHOOL">LOWERSCHOOL</SelectItem>
                    <SelectItem value="MIDDLESCHOOL">MIDDLESCHOOL</SelectItem>
                    <SelectItem value="HIGHSCHOOL">HIGHSCHOOL</SelectItem>
                  </SelectContent>
                </Select>
                {errors.level && <p className="text-sm text-red-500 mt-1">{errors.level}</p>}
              </div>
            </div>

            {/* Campo Curso */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="curso" className="text-right">
                Curso
              </Label>
              <div className="col-span-3">
                {formData.level ? (
                  <>
                    {cursosDisponibles.length > 0 ? (
                      <Select 
                        value={formData.curso} 
                        onValueChange={(value) => setFormData({ ...formData, curso: value })}
                        disabled={loadingCursos}
                      >
                        <SelectTrigger className={errors.curso ? "border-red-500" : ""}>
                          <SelectValue placeholder={loadingCursos ? "Cargando cursos..." : "Selecciona un curso"} />
                        </SelectTrigger>
                        <SelectContent>
                          {cursosDisponibles.map((curso) => (
                            <SelectItem key={curso} value={curso}>
                              {curso}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="curso"
                        value={formData.curso}
                        onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                        placeholder={loadingCursos ? "Cargando..." : "Ingresa el curso (ej: 1° Básico A)"}
                        className={errors.curso ? "border-red-500" : ""}
                        disabled={loadingCursos}
                      />
                    )}
                    {!loadingCursos && cursosDisponibles.length === 0 && formData.level && (
                      <p className="text-sm text-gray-500 mt-1">
                        No hay cursos registrados para este nivel. Puedes escribir uno nuevo.
                      </p>
                    )}
                  </>
                ) : (
                  <Input
                    id="curso"
                    value={formData.curso}
                    onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                    placeholder="Primero selecciona un nivel"
                    className={errors.curso ? "border-red-500" : ""}
                    disabled={true}
                  />
                )}
                {errors.curso && <p className="text-sm text-red-500 mt-1">{errors.curso}</p>}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loadingCursos}>
              {loadingCursos ? "Cargando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
