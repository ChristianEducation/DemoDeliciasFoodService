"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"

interface Estudiante {
  id: string
  name: string
  level: string
  curso: string
}

export function useSelectCascada() {
  const [niveles, setNiveles] = useState<string[]>([])
  const [cursos, setCursos] = useState<string[]>([])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])

  const [nivelSeleccionado, setNivelSeleccionado] = useState<string>("")
  const [cursoSeleccionado, setCursoSeleccionado] = useState<string>("")

  const [loading, setLoading] = useState({
    niveles: true,
    cursos: false,
    estudiantes: false,
  })

  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Función para obtener niveles únicos
  const fetchNiveles = async () => {
    setLoading((prev) => ({ ...prev, niveles: true }))
    setError(null)

    try {
      const { data, error } = await supabase.from("estudiantes").select("level").not("level", "is", null)

      if (error) throw error

      const nivelesUnicos = [...new Set(data?.map((e) => e.level) || [])].sort()
      setNiveles(nivelesUnicos)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando niveles")
    } finally {
      setLoading((prev) => ({ ...prev, niveles: false }))
    }
  }

  // Función para obtener cursos por nivel
  const fetchCursos = async (nivel: string) => {
    setLoading((prev) => ({ ...prev, cursos: true }))
    setCursos([])
    setCursoSeleccionado("")
    setEstudiantes([])

    try {
      const { data, error } = await supabase
        .from("estudiantes")
        .select("curso")
        .eq("level", nivel)
        .not("curso", "is", null)

      if (error) throw error

      const cursosUnicos = [...new Set(data?.map((e) => e.curso) || [])].sort()
      setCursos(cursosUnicos)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando cursos")
    } finally {
      setLoading((prev) => ({ ...prev, cursos: false }))
    }
  }

  // Función para obtener estudiantes por nivel y curso
  const fetchEstudiantes = async (nivel: string, curso: string) => {
    setLoading((prev) => ({ ...prev, estudiantes: true }))
    setEstudiantes([])

    try {
      const { data, error } = await supabase
        .from("estudiantes")
        .select("id, name, level, curso")
        .eq("level", nivel)
        .eq("curso", curso)
        .order("name")

      if (error) throw error

      setEstudiantes(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando estudiantes")
    } finally {
      setLoading((prev) => ({ ...prev, estudiantes: false }))
    }
  }

  // Efectos para cargar datos automáticamente
  useEffect(() => {
    fetchNiveles()
  }, [])

  useEffect(() => {
    if (nivelSeleccionado) {
      fetchCursos(nivelSeleccionado)
    }
  }, [nivelSeleccionado])

  useEffect(() => {
    if (nivelSeleccionado && cursoSeleccionado) {
      fetchEstudiantes(nivelSeleccionado, cursoSeleccionado)
    }
  }, [nivelSeleccionado, cursoSeleccionado])

  return {
    // Datos
    niveles,
    cursos,
    estudiantes,
    // Estados de selección
    nivelSeleccionado,
    cursoSeleccionado,
    // Funciones de selección
    setNivelSeleccionado,
    setCursoSeleccionado,
    // Estados de carga
    loading,
    error,
    // Funciones de recarga
    refetchNiveles: fetchNiveles,
    refetchCursos: () => nivelSeleccionado && fetchCursos(nivelSeleccionado),
    refetchEstudiantes: () =>
      nivelSeleccionado && cursoSeleccionado && fetchEstudiantes(nivelSeleccionado, cursoSeleccionado),
  }
}
