"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Download, Search, Filter } from 'lucide-react'
import { EstudiantesTable } from "@/components/admin/EstudiantesTable"
import { EstudianteModal } from "@/components/admin/EstudianteModal"
import { supabase } from "@/lib/supabase"

interface Estudiante {
  id: number
  name: string
  email?: string
  telefono?: string
  level: string
  curso: string
  casino: string
  active: string
  created_at: string
}

const EstudiantesPage = () => {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [filteredEstudiantes, setFilteredEstudiantes] = useState<Estudiante[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEstudiante, setSelectedEstudiante] = useState<Estudiante | null>(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNivel, setSelectedNivel] = useState<string>("all")
  const [selectedCurso, setSelectedCurso] = useState<string>("all")

  // Opciones únicas para filtros
  const [niveles, setNiveles] = useState<string[]>([])
  const [cursos, setCursos] = useState<string[]>([])

  const cargarEstudiantes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("estudiantes").select("*").order("name", { ascending: true })

      if (error) {
        console.error("Error cargando estudiantes:", error)
        return
      }

      setEstudiantes(data || [])

      // Extraer opciones únicas para filtros
      const nivelesUnicos = [...new Set(data?.map((e) => e.level) || [])]
      const cursosUnicos = [...new Set(data?.map((e) => e.curso) || [])]

      setNiveles(nivelesUnicos.sort())
      setCursos(cursosUnicos.sort())
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGuardarEstudiante = async (data: { name: string; curso: string; level: string }) => {
    try {
      // Determinar el casino basado en el nivel
      let casino = null
      if (data.level === "LOWERSCHOOL" || data.level === "MIDDLESCHOOL") {
        casino = "Basica"
      } else if (data.level === "HIGHSCHOOL") {
        casino = "Media"
      }
      // PRESCHOOL queda como null

      if (selectedEstudiante) {
        // Actualizar estudiante existente
        const { error } = await supabase
          .from("estudiantes")
          .update({
            name: data.name,
            curso: data.curso,
            level: data.level,
            casino: casino,
            active: "VERDADERO"
          })
          .eq("id", selectedEstudiante.id)

        if (error) {
          console.error("Error actualizando estudiante:", error)
          return
        }
      } else {
        // Crear nuevo estudiante
        const { error } = await supabase
          .from("estudiantes")
          .insert({
            name: data.name,
            curso: data.curso,
            level: data.level,
            casino: casino,
            active: "VERDADERO",
          })

        if (error) {
          console.error("Error creando estudiante:", error)
          return
        }
      }

      setIsModalOpen(false)
      setSelectedEstudiante(null)
      await cargarEstudiantes()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleEliminarEstudiante = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este estudiante?")) {
      return
    }

    try {
      const { error } = await supabase
        .from("estudiantes")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("Error eliminando estudiante:", error)
        return
      }

      await cargarEstudiantes()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  // Aplicar filtros
  useEffect(() => {
    let filtered = estudiantes

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (estudiante) =>
          estudiante.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          estudiante.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtro por nivel
    if (selectedNivel !== "all") {
      filtered = filtered.filter((estudiante) => estudiante.level === selectedNivel)
    }

    // Filtro por curso
    if (selectedCurso !== "all") {
      filtered = filtered.filter((estudiante) => estudiante.curso === selectedCurso)
    }

    setFilteredEstudiantes(filtered)
  }, [estudiantes, searchTerm, selectedNivel, selectedCurso])

  useEffect(() => {
    cargarEstudiantes()
  }, [])

  const exportarEstudiantes = async () => {
    try {
      // Importar XLSX dinámicamente
      const XLSX = await import("xlsx")

      const datosExport = filteredEstudiantes.map((estudiante) => ({
        Nombre: estudiante.name,
        Email: estudiante.email || "",
        Teléfono: estudiante.telefono || "",
        Nivel: estudiante.level,
        Curso: estudiante.curso,
        "Fecha Registro": new Date(estudiante.created_at).toLocaleDateString("es-CL"),
      }))

      const ws = XLSX.utils.json_to_sheet(datosExport)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Estudiantes")

      const fecha = new Date().toISOString().split("T")[0]
      XLSX.writeFile(wb, `estudiantes_${fecha}.xlsx`)
    } catch (error) {
      console.error("Error exportando:", error)
    }
  }

  const handleEditEstudiante = (estudiante: { id: string; name: string; curso: string; level: string }) => {
    // Encontrar el estudiante completo en la lista original
    const estudianteCompleto = estudiantes.find(e => e.id.toString() === estudiante.id)
    if (estudianteCompleto) {
      setSelectedEstudiante(estudianteCompleto)
      setIsModalOpen(true)
    }
  }

  const handleAddEstudiante = () => {
    setSelectedEstudiante(null)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedEstudiante(null)
  }

  const limpiarFiltros = () => {
    setSearchTerm("")
    setSelectedNivel("all")
    setSelectedCurso("all")
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando estudiantes...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Estudiantes</h1>
          <p className="text-gray-600 mt-2">
            Administra los estudiantes del sistema
            <Badge variant="secondary" className="ml-2">
              {filteredEstudiantes.length} estudiantes
            </Badge>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleAddEstudiante} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Estudiante
          </Button>
          <Button
            onClick={exportarEstudiantes}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50 bg-transparent"
            disabled={filteredEstudiantes.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>Filtra y busca estudiantes por diferentes criterios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por Nivel */}
            <Select value={selectedNivel} onValueChange={setSelectedNivel}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                {niveles.map((nivel) => (
                  <SelectItem key={nivel} value={nivel}>
                    {nivel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por Curso */}
            <Select value={selectedCurso} onValueChange={setSelectedCurso}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cursos</SelectItem>
                {cursos.map((curso) => (
                  <SelectItem key={curso} value={curso}>
                    {curso}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Botón limpiar filtros */}
            <Button variant="outline" onClick={limpiarFiltros} className="w-full bg-transparent">
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de estudiantes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Estudiantes</CardTitle>
          <CardDescription>
            {filteredEstudiantes.length === estudiantes.length
              ? `Mostrando todos los ${estudiantes.length} estudiantes`
              : `Mostrando ${filteredEstudiantes.length} de ${estudiantes.length} estudiantes`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEstudiantes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                {estudiantes.length === 0
                  ? "No hay estudiantes registrados"
                  : "No se encontraron estudiantes con los filtros aplicados"}
              </p>
              {estudiantes.length === 0 && (
                <Button onClick={handleAddEstudiante} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar primer estudiante
                </Button>
              )}
            </div>
          ) : (
            <EstudiantesTable
              estudiantes={filteredEstudiantes.map(e => ({
                id: e.id.toString(),
                name: e.name,
                curso: e.curso,
                level: e.level
              }))}
              loading={loading}
              onEditar={handleEditEstudiante}
              onEliminar={handleEliminarEstudiante}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <EstudianteModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onGuardar={handleGuardarEstudiante}
        estudiante={selectedEstudiante ? {
          id: selectedEstudiante.id.toString(),
          name: selectedEstudiante.name,
          curso: selectedEstudiante.curso,
          level: selectedEstudiante.level
        } : null}
        cursosDisponibles={cursos}
      />
    </div>
  )
}

export default EstudiantesPage
