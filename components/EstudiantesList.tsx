"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { Estudiante } from "@/lib/types"

interface EstudiantesListProps {
  onSelectionChange?: (selectedIds: string[]) => void
}

export default function EstudiantesList({ onSelectionChange }: EstudiantesListProps) {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    async function fetchEstudiantes() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("estudiantes").select("*").order("nombre")

        if (error) {
          setError(error.message)
        } else {
          setEstudiantes(data || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    fetchEstudiantes()
  }, [])

  const handleSelectionChange = (estudianteId: string, checked: boolean) => {
    const newSelection = checked ? [...selectedIds, estudianteId] : selectedIds.filter((id) => id !== estudianteId)

    setSelectedIds(newSelection)
    onSelectionChange?.(newSelection)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando estudiantes...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600">
            <p className="font-semibold">Error al cargar estudiantes:</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Seleccionar Estudiantes
          <Badge variant="secondary">{estudiantes.length} disponibles</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {estudiantes.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No se encontraron estudiantes</p>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {estudiantes.map((estudiante) => (
              <div key={estudiante.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                <Checkbox
                  id={estudiante.id}
                  checked={selectedIds.includes(estudiante.id)}
                  onCheckedChange={(checked) => handleSelectionChange(estudiante.id, checked as boolean)}
                />
                <label htmlFor={estudiante.id} className="flex-1 cursor-pointer">
                  <div className="font-medium">
                    {estudiante.nombre} {estudiante.apellido}
                  </div>
                  <div className="text-sm text-gray-500">
                    Curso: {estudiante.curso} | RUT: {estudiante.rut}
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}
        {selectedIds.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              {selectedIds.length} estudiante{selectedIds.length !== 1 ? "s" : ""} seleccionado
              {selectedIds.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
